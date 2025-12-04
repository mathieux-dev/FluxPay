using System.Security.Cryptography;
using System.Text;
using FluxPay.Core.Services;
using FluxPay.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FluxPay.Api.Middleware;

public class ApiKeyAuthenticationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiKeyAuthenticationMiddleware> _logger;

    public ApiKeyAuthenticationMiddleware(RequestDelegate next, ILogger<ApiKeyAuthenticationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(
        HttpContext context,
        FluxPayDbContext dbContext,
        IHmacSignatureService hmacService,
        INonceStore nonceStore,
        IEncryptionService encryptionService)
    {
        if (!context.Request.Headers.TryGetValue("X-Api-Key", out var apiKeyHeader) ||
            !context.Request.Headers.TryGetValue("X-Timestamp", out var timestampHeader) ||
            !context.Request.Headers.TryGetValue("X-Nonce", out var nonceHeader) ||
            !context.Request.Headers.TryGetValue("X-Signature", out var signatureHeader))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = "INVALID_API_KEY",
                    message = "Missing required authentication headers"
                }
            });
            return;
        }

        var apiKeyId = apiKeyHeader.ToString();
        var timestampStr = timestampHeader.ToString();
        var nonce = nonceHeader.ToString();
        var signature = signatureHeader.ToString();

        if (!long.TryParse(timestampStr, out var timestamp))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = "INVALID_API_KEY",
                    message = "Invalid timestamp format"
                }
            });
            return;
        }

        var currentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var timeDiff = Math.Abs(currentTimestamp - timestamp);
        
        if (timeDiff > 60)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = "TIMESTAMP_SKEW",
                    message = "Request timestamp outside acceptable window"
                }
            });
            return;
        }

        var apiKey = await dbContext.ApiKeys
            .Include(k => k.Merchant)
            .FirstOrDefaultAsync(k => k.KeyId == apiKeyId && k.Active);

        if (apiKey == null)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = "INVALID_API_KEY",
                    message = "API key not found or inactive"
                }
            });
            return;
        }

        if (apiKey.ExpiresAt.HasValue && apiKey.ExpiresAt.Value < DateTime.UtcNow)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = "INVALID_API_KEY",
                    message = "API key has expired"
                }
            });
            return;
        }

        if (!apiKey.Merchant.Active)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = "MERCHANT_DISABLED",
                    message = "Merchant account is disabled"
                }
            });
            return;
        }

        var merchantId = apiKey.MerchantId.ToString();
        var isNonceUnique = await nonceStore.IsNonceUniqueAsync(merchantId, nonce);
        
        if (!isNonceUnique)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = "NONCE_REUSED",
                    message = "Nonce has been used before"
                }
            });
            return;
        }

        context.Request.EnableBuffering();
        var bodyContent = string.Empty;
        
        if (context.Request.ContentLength > 0)
        {
            using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
            bodyContent = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;
        }

        var bodySha256Hex = string.Empty;
        if (!string.IsNullOrEmpty(bodyContent))
        {
            using var sha256 = SHA256.Create();
            var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(bodyContent));
            bodySha256Hex = Convert.ToHexString(hashBytes).ToLowerInvariant();
        }

        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? string.Empty;
        var message = $"{timestampStr}.{nonce}.{method}.{path}.{bodySha256Hex}";

        var apiKeySecret = encryptionService.Decrypt(apiKey.KeySecretEncrypted);
        var isSignatureValid = hmacService.VerifySignature(apiKeySecret, message, signature);

        if (!isSignatureValid)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = "INVALID_SIGNATURE",
                    message = "HMAC signature verification failed"
                }
            });
            return;
        }

        await nonceStore.StoreNonceAsync(merchantId, nonce, TimeSpan.FromHours(24));

        context.Items["MerchantId"] = apiKey.MerchantId;
        context.Items["Merchant"] = apiKey.Merchant;

        await _next(context);
    }
}
