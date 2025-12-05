using FluxPay.Core.Entities;
using FluxPay.Core.Services;
using FluxPay.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace FluxPay.Api.Controllers;

[ApiController]
[Route("v1/merchants")]
public class MerchantsController : ControllerBase
{
    private readonly FluxPayDbContext _dbContext;
    private readonly IEncryptionService _encryptionService;
    private readonly ILogger<MerchantsController> _logger;

    public MerchantsController(
        FluxPayDbContext dbContext,
        IEncryptionService encryptionService,
        ILogger<MerchantsController> logger)
    {
        _dbContext = dbContext;
        _encryptionService = encryptionService;
        _logger = logger;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMerchantDetails()
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

            var merchant = await _dbContext.Merchants
                .Include(m => m.ApiKeys.Where(k => k.Active))
                .FirstOrDefaultAsync(m => m.Id == merchantId.Value);

            if (merchant == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "MERCHANT_NOT_FOUND",
                        message = "Merchant not found"
                    }
                });
            }

            return Ok(new
            {
                merchant_id = merchant.Id,
                name = merchant.Name,
                email = merchant.Email,
                active = merchant.Active,
                api_keys = merchant.ApiKeys.Select(k => new
                {
                    key_id = k.KeyId,
                    active = k.Active,
                    expires_at = k.ExpiresAt,
                    created_at = k.CreatedAt
                }).ToList(),
                created_at = merchant.CreatedAt,
                updated_at = merchant.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving merchant details");
            return StatusCode(500, new
            {
                error = new
                {
                    code = "INTERNAL_ERROR",
                    message = "An error occurred while retrieving merchant details"
                }
            });
        }
    }

    [HttpGet("me/transactions")]
    public async Task<IActionResult> ListTransactions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? status = null,
        [FromQuery] string? method = null)
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

            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 50;

            var query = _dbContext.Payments
                .Include(p => p.Customer)
                .Include(p => p.Transactions)
                .Where(p => p.MerchantId == merchantId.Value);

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (Enum.TryParse<PaymentStatus>(status, true, out var statusEnum))
                {
                    query = query.Where(p => p.Status == statusEnum);
                }
            }

            if (!string.IsNullOrWhiteSpace(method))
            {
                if (Enum.TryParse<PaymentMethod>(method, true, out var methodEnum))
                {
                    query = query.Where(p => p.Method == methodEnum);
                }
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var payments = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                data = payments.Select(p => new
                {
                    payment_id = p.Id,
                    status = p.Status.ToString().ToLowerInvariant(),
                    amount_cents = p.AmountCents,
                    method = p.Method.ToString().ToLowerInvariant(),
                    customer = p.Customer != null ? new
                    {
                        name = p.Customer.Name
                    } : null,
                    created_at = p.CreatedAt,
                    updated_at = p.UpdatedAt
                }).ToList(),
                pagination = new
                {
                    page,
                    page_size = pageSize,
                    total_count = totalCount,
                    total_pages = totalPages
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing transactions");
            return StatusCode(500, new
            {
                error = new
                {
                    code = "INTERNAL_ERROR",
                    message = "An error occurred while listing transactions"
                }
            });
        }
    }

    [HttpPost("me/api-keys/rotate")]
    public async Task<IActionResult> RotateApiKey()
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

            var merchant = await _dbContext.Merchants
                .Include(m => m.ApiKeys)
                .FirstOrDefaultAsync(m => m.Id == merchantId.Value);

            if (merchant == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "MERCHANT_NOT_FOUND",
                        message = "Merchant not found"
                    }
                });
            }

            var keySecretBytes = new byte[32];
            RandomNumberGenerator.Fill(keySecretBytes);
            var keySecret = Convert.ToBase64String(keySecretBytes);
            var keyId = $"merchant-{merchantId.Value.ToString().Substring(0, 8)}";
            var keyHash = _encryptionService.Hash(keySecret);
            var keySecretEncrypted = _encryptionService.Encrypt(keySecret);

            var newApiKey = new ApiKey
            {
                Id = Guid.NewGuid(),
                MerchantId = merchantId.Value,
                KeyId = keyId,
                KeyHash = keyHash,
                KeySecretEncrypted = keySecretEncrypted,
                Active = true,
                ExpiresAt = null,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.ApiKeys.Add(newApiKey);

            var oldActiveKeys = merchant.ApiKeys.Where(k => k.Active).ToList();
            var gracePeriodEnd = DateTime.UtcNow.AddDays(30);
            
            foreach (var oldKey in oldActiveKeys)
            {
                oldKey.ExpiresAt = gracePeriodEnd;
            }

            await _dbContext.SaveChangesAsync();

            return Ok(new
            {
                key_id = newApiKey.KeyId,
                key_secret = keySecret,
                active = newApiKey.Active,
                created_at = newApiKey.CreatedAt,
                message = "API key rotated successfully. Old keys will expire in 30 days.",
                old_keys_expire_at = gracePeriodEnd
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rotating API key");
            return StatusCode(500, new
            {
                error = new
                {
                    code = "INTERNAL_ERROR",
                    message = "An error occurred while rotating API key"
                }
            });
        }
    }
}
