using FluxPay.Core.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace FluxPay.Api.Controllers;

[ApiController]
[Route("v1/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly IWebhookService _webhookService;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(IWebhookService webhookService, ILogger<WebhooksController> logger)
    {
        _webhookService = webhookService;
        _logger = logger;
    }

    [HttpPost("provider")]
    public async Task<IActionResult> ReceiveProviderWebhook()
    {
        try
        {
            var provider = Request.Headers["X-Provider"].ToString();
            var signature = Request.Headers["X-Signature"].ToString();
            var timestampHeader = Request.Headers["X-Timestamp"].ToString();
            var nonce = Request.Headers["X-Nonce"].ToString();

            if (string.IsNullOrEmpty(provider) || string.IsNullOrEmpty(signature) || 
                string.IsNullOrEmpty(timestampHeader) || string.IsNullOrEmpty(nonce))
            {
                return Unauthorized(new
                {
                    error = new
                    {
                        code = "INVALID_WEBHOOK",
                        message = "Missing required webhook headers"
                    }
                });
            }

            if (!long.TryParse(timestampHeader, out var timestamp))
            {
                return Unauthorized(new
                {
                    error = new
                    {
                        code = "INVALID_TIMESTAMP",
                        message = "Invalid timestamp format"
                    }
                });
            }

            using var reader = new StreamReader(Request.Body);
            var payload = await reader.ReadToEndAsync();

            var isValid = await _webhookService.ValidateProviderWebhookAsync(provider, signature, payload, timestamp, nonce);

            if (!isValid)
            {
                return Unauthorized(new
                {
                    error = new
                    {
                        code = "INVALID_SIGNATURE",
                        message = "Webhook signature validation failed"
                    }
                });
            }

            JsonDocument? jsonDoc = null;
            string? providerPaymentId = null;
            string? status = null;
            string? eventType = null;

            try
            {
                jsonDoc = JsonDocument.Parse(payload);
                
                if (jsonDoc.RootElement.TryGetProperty("event", out var eventProp))
                {
                    eventType = eventProp.GetString();
                }
                
                if (jsonDoc.RootElement.TryGetProperty("transaction", out var transactionProp))
                {
                    if (transactionProp.TryGetProperty("id", out var idProp))
                    {
                        providerPaymentId = idProp.GetString();
                    }
                    if (transactionProp.TryGetProperty("status", out var statusProp))
                    {
                        status = statusProp.GetString();
                    }
                }
                else if (jsonDoc.RootElement.TryGetProperty("data", out var dataProp))
                {
                    if (dataProp.TryGetProperty("id", out var idProp))
                    {
                        providerPaymentId = idProp.GetString();
                    }
                    if (dataProp.TryGetProperty("status", out var statusProp))
                    {
                        status = statusProp.GetString();
                    }
                }
            }
            catch (JsonException)
            {
            }
            finally
            {
                jsonDoc?.Dispose();
            }

            var webhookEvent = new ProviderWebhookEvent
            {
                Provider = provider,
                EventType = eventType ?? "unknown",
                Payload = payload,
                ProviderPaymentId = providerPaymentId,
                Status = status
            };

            _ = Task.Run(async () =>
            {
                try
                {
                    await _webhookService.ProcessProviderWebhookAsync(webhookEvent);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing provider webhook asynchronously");
                }
            });

            return Ok(new { received = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error receiving provider webhook");
            return StatusCode(500, new
            {
                error = new
                {
                    code = "INTERNAL_ERROR",
                    message = "An error occurred while processing the webhook"
                }
            });
        }
    }

    [HttpPost("merchant/test")]
    public async Task<IActionResult> TestMerchantWebhook([FromBody] TestWebhookRequest request)
    {
        try
        {
            var merchantId = HttpContext.Items["MerchantId"] as Guid?;
            if (!merchantId.HasValue)
            {
                return Unauthorized(new
                {
                    error = new
                    {
                        code = "UNAUTHORIZED",
                        message = "Merchant authentication required"
                    }
                });
            }

            if (string.IsNullOrEmpty(request.EndpointUrl))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_REQUEST",
                        message = "endpoint_url is required"
                    }
                });
            }

            if (!Uri.TryCreate(request.EndpointUrl, UriKind.Absolute, out var uri) || 
                (uri.Scheme != "http" && uri.Scheme != "https"))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_URL",
                        message = "endpoint_url must be a valid HTTP or HTTPS URL"
                    }
                });
            }

            var result = await _webhookService.TestMerchantWebhookAsync(merchantId.Value, request.EndpointUrl);

            return Ok(new
            {
                success = result.Success,
                status_code = result.StatusCode,
                response_time_ms = result.ResponseTimeMs,
                response_body = result.ResponseBody,
                error_message = result.ErrorMessage
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing merchant webhook");
            return StatusCode(500, new
            {
                error = new
                {
                    code = "INTERNAL_ERROR",
                    message = "An error occurred while testing the webhook"
                }
            });
        }
    }
}

public class TestWebhookRequest
{
    public string EndpointUrl { get; set; } = string.Empty;
}
