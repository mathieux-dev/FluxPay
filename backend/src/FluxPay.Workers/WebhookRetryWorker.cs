using FluxPay.Core.Entities;
using FluxPay.Core.Services;
using FluxPay.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace FluxPay.Workers;

public class WebhookRetryWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<WebhookRetryWorker> _logger;
    private readonly TimeSpan _pollInterval = TimeSpan.FromMinutes(5);

    public WebhookRetryWorker(
        IServiceProvider serviceProvider,
        ILogger<WebhookRetryWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("WebhookRetryWorker started. Polling every {Interval} minutes", _pollInterval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(_pollInterval, stoppingToken);

                if (!stoppingToken.IsCancellationRequested)
                {
                    await ProcessFailedWebhooksAsync(stoppingToken);
                }
            }
            catch (TaskCanceledException)
            {
                _logger.LogInformation("WebhookRetryWorker is stopping");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in WebhookRetryWorker polling loop");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        _logger.LogInformation("WebhookRetryWorker stopped");
    }

    private async Task ProcessFailedWebhooksAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<FluxPayDbContext>();
        var hmacService = scope.ServiceProvider.GetRequiredService<IHmacSignatureService>();
        var encryptionService = scope.ServiceProvider.GetRequiredService<IEncryptionService>();
        var httpClientFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();
        var auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();

        var now = DateTime.UtcNow;

        var failedWebhooks = await dbContext.WebhookDeliveries
            .Where(w => w.Status == WebhookDeliveryStatus.Failed && 
                       w.NextRetryAt.HasValue && 
                       w.NextRetryAt.Value <= now &&
                       w.AttemptCount < 10)
            .Include(w => w.Payment)
            .ToListAsync(stoppingToken);

        if (failedWebhooks.Count == 0)
        {
            _logger.LogDebug("No failed webhooks ready for retry");
            return;
        }

        _logger.LogInformation("Processing {Count} failed webhooks for retry", failedWebhooks.Count);

        foreach (var webhookDelivery in failedWebhooks)
        {
            if (stoppingToken.IsCancellationRequested)
            {
                break;
            }

            try
            {
                await RetryWebhookDeliveryAsync(
                    webhookDelivery,
                    dbContext,
                    hmacService,
                    encryptionService,
                    httpClientFactory,
                    auditService,
                    stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrying webhook delivery {WebhookId}", webhookDelivery.Id);
            }
        }

        await dbContext.SaveChangesAsync(stoppingToken);
    }

    private async Task RetryWebhookDeliveryAsync(
        WebhookDelivery webhookDelivery,
        FluxPayDbContext dbContext,
        IHmacSignatureService hmacService,
        IEncryptionService encryptionService,
        IHttpClientFactory httpClientFactory,
        IAuditService auditService,
        CancellationToken stoppingToken)
    {
        var merchantWebhook = await dbContext.MerchantWebhooks
            .FirstOrDefaultAsync(w => w.MerchantId == webhookDelivery.MerchantId && w.Active, stoppingToken);

        if (merchantWebhook == null)
        {
            _logger.LogWarning("No active webhook endpoint for merchant {MerchantId}, marking as permanently failed", webhookDelivery.MerchantId);
            webhookDelivery.Status = WebhookDeliveryStatus.PermanentlyFailed;
            webhookDelivery.LastError = "No active webhook endpoint configured";
            return;
        }

        webhookDelivery.AttemptCount++;

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var nonce = Guid.NewGuid().ToString();
        var traceId = Guid.NewGuid().ToString();

        var webhookSecret = encryptionService.Decrypt(merchantWebhook.SecretEncrypted);
        var message = $"{timestamp}.{nonce}.{webhookDelivery.Payload}";
        var signature = hmacService.ComputeSignature(webhookSecret, message);

        _logger.LogInformation(
            "Retrying webhook delivery {WebhookId} for merchant {MerchantId}, attempt {Attempt}/10",
            webhookDelivery.Id,
            webhookDelivery.MerchantId,
            webhookDelivery.AttemptCount);

        var result = await DeliverWebhookAsync(
            merchantWebhook.EndpointUrl,
            webhookDelivery.Payload,
            signature,
            timestamp,
            nonce,
            traceId,
            httpClientFactory);

        if (result.Success)
        {
            webhookDelivery.Status = WebhookDeliveryStatus.Success;
            webhookDelivery.LastError = null;
            webhookDelivery.NextRetryAt = null;
            merchantWebhook.LastSuccessAt = DateTime.UtcNow;

            _logger.LogInformation(
                "Webhook delivery {WebhookId} succeeded on attempt {Attempt}",
                webhookDelivery.Id,
                webhookDelivery.AttemptCount);

            await auditService.LogAsync(new AuditEntry
            {
                MerchantId = webhookDelivery.MerchantId,
                Actor = "system:webhook_retry_worker",
                Action = "webhook.retry_succeeded",
                ResourceType = "WebhookDelivery",
                ResourceId = webhookDelivery.Id,
                Changes = new { attemptCount = webhookDelivery.AttemptCount, paymentId = webhookDelivery.PaymentId }
            });
        }
        else
        {
            webhookDelivery.LastError = result.ErrorMessage;

            if (webhookDelivery.AttemptCount >= 10)
            {
                webhookDelivery.Status = WebhookDeliveryStatus.PermanentlyFailed;
                webhookDelivery.NextRetryAt = null;

                _logger.LogWarning(
                    "Webhook delivery {WebhookId} permanently failed after {Attempts} attempts. Last error: {Error}",
                    webhookDelivery.Id,
                    webhookDelivery.AttemptCount,
                    result.ErrorMessage);

                await auditService.LogAsync(new AuditEntry
                {
                    MerchantId = webhookDelivery.MerchantId,
                    Actor = "system:webhook_retry_worker",
                    Action = "webhook.permanently_failed",
                    ResourceType = "WebhookDelivery",
                    ResourceId = webhookDelivery.Id,
                    Changes = new 
                    { 
                        attemptCount = webhookDelivery.AttemptCount, 
                        paymentId = webhookDelivery.PaymentId,
                        lastError = result.ErrorMessage 
                    }
                });
            }
            else
            {
                webhookDelivery.NextRetryAt = CalculateNextRetryTime(webhookDelivery.AttemptCount);

                _logger.LogWarning(
                    "Webhook delivery {WebhookId} failed on attempt {Attempt}/10. Next retry at {NextRetry}. Error: {Error}",
                    webhookDelivery.Id,
                    webhookDelivery.AttemptCount,
                    webhookDelivery.NextRetryAt,
                    result.ErrorMessage);
            }
        }
    }

    private async Task<WebhookDeliveryResult> DeliverWebhookAsync(
        string endpointUrl,
        string payload,
        string signature,
        long timestamp,
        string nonce,
        string traceId,
        IHttpClientFactory httpClientFactory)
    {
        var httpClient = httpClientFactory.CreateClient();
        httpClient.Timeout = TimeSpan.FromSeconds(10);

        var request = new HttpRequestMessage(HttpMethod.Post, endpointUrl);
        request.Headers.Add("X-Signature", signature);
        request.Headers.Add("X-Timestamp", timestamp.ToString());
        request.Headers.Add("X-Nonce", nonce);
        request.Headers.Add("X-Trace-Id", traceId);
        request.Content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json");

        var stopwatch = Stopwatch.StartNew();

        try
        {
            var response = await httpClient.SendAsync(request);
            stopwatch.Stop();

            var responseBody = await response.Content.ReadAsStringAsync();

            return new WebhookDeliveryResult
            {
                Success = response.IsSuccessStatusCode,
                StatusCode = (int)response.StatusCode,
                ResponseTimeMs = stopwatch.ElapsedMilliseconds,
                ResponseBody = responseBody,
                ErrorMessage = response.IsSuccessStatusCode ? null : $"HTTP {response.StatusCode}"
            };
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            return new WebhookDeliveryResult
            {
                Success = false,
                StatusCode = 0,
                ResponseTimeMs = stopwatch.ElapsedMilliseconds,
                ErrorMessage = ex.Message
            };
        }
    }

    private DateTime CalculateNextRetryTime(int attemptCount)
    {
        var delays = new[] { 1, 5, 15, 30, 60, 120, 240, 480, 720, 1440 };
        var delayMinutes = attemptCount <= delays.Length ? delays[attemptCount - 1] : delays[^1];
        return DateTime.UtcNow.AddMinutes(delayMinutes);
    }
}
