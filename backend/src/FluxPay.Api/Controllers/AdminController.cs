using FluxPay.Core.Entities;
using FluxPay.Core.Services;
using FluxPay.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text.Json;

namespace FluxPay.Api.Controllers;

[ApiController]
[Route("v1/admin")]
public class AdminController : ControllerBase
{
    private readonly FluxPayDbContext _dbContext;
    private readonly IEncryptionService _encryptionService;
    private readonly IAuditService _auditService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        FluxPayDbContext dbContext,
        IEncryptionService encryptionService,
        IAuditService auditService,
        ILogger<AdminController> logger)
    {
        _dbContext = dbContext;
        _encryptionService = encryptionService;
        _auditService = auditService;
        _logger = logger;
    }

    [HttpPost("merchants")]
    public async Task<IActionResult> CreateMerchant([FromBody] CreateMerchantRequest request)
    {
        try
        {
            var isAdmin = HttpContext.Items["IsAdmin"] as bool?;
            if (isAdmin != true)
            {
                return StatusCode(403, new
                {
                    error = new
                    {
                        code = "INSUFFICIENT_PERMISSIONS",
                        message = "Admin access required"
                    }
                });
            }

            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_REQUEST",
                        message = "Name and email are required"
                    }
                });
            }

            var existingMerchant = await _dbContext.Merchants
                .FirstOrDefaultAsync(m => m.Email == request.Email);

            if (existingMerchant != null)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "MERCHANT_EXISTS",
                        message = "Merchant with this email already exists"
                    }
                });
            }

            var merchantId = Guid.NewGuid();
            
            string? providerConfigEncrypted = null;
            if (request.ProviderConfig != null)
            {
                var providerConfigJson = JsonSerializer.Serialize(request.ProviderConfig);
                providerConfigEncrypted = _encryptionService.Encrypt(providerConfigJson);
            }

            var merchant = new Merchant
            {
                Id = merchantId,
                Name = request.Name,
                Email = request.Email,
                ProviderConfigEncrypted = providerConfigEncrypted,
                Active = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.Merchants.Add(merchant);

            var keySecretBytes = new byte[32];
            RandomNumberGenerator.Fill(keySecretBytes);
            var keySecret = Convert.ToBase64String(keySecretBytes);
            var keyId = $"merchant-{merchantId.ToString().Substring(0, 8)}";
            var keyHash = _encryptionService.Hash(keySecret);
            var keySecretEncrypted = _encryptionService.Encrypt(keySecret);

            var apiKey = new ApiKey
            {
                Id = Guid.NewGuid(),
                MerchantId = merchantId,
                KeyId = keyId,
                KeyHash = keyHash,
                KeySecretEncrypted = keySecretEncrypted,
                Active = true,
                ExpiresAt = null,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.ApiKeys.Add(apiKey);

            await _dbContext.SaveChangesAsync();

            var userId = HttpContext.Items["UserId"] as Guid?;
            await _auditService.LogAsync(new AuditEntry
            {
                MerchantId = merchantId,
                Actor = userId?.ToString() ?? "system",
                Action = "merchant.created",
                ResourceType = "merchant",
                ResourceId = merchantId,
                Changes = new
                {
                    name = merchant.Name,
                    email = merchant.Email
                }
            });

            return StatusCode(201, new
            {
                merchant_id = merchant.Id,
                name = merchant.Name,
                email = merchant.Email,
                api_key = new
                {
                    key_id = apiKey.KeyId,
                    key_secret = keySecret
                },
                created_at = merchant.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating merchant");
            return StatusCode(500, new
            {
                error = new
                {
                    code = "INTERNAL_ERROR",
                    message = "An error occurred while creating merchant"
                }
            });
        }
    }

    [HttpGet("merchants/{id}")]
    public async Task<IActionResult> GetMerchant(Guid id)
    {
        try
        {
            var isAdmin = HttpContext.Items["IsAdmin"] as bool?;
            if (isAdmin != true)
            {
                return StatusCode(403, new
                {
                    error = new
                    {
                        code = "INSUFFICIENT_PERMISSIONS",
                        message = "Admin access required"
                    }
                });
            }

            var merchant = await _dbContext.Merchants
                .Include(m => m.ApiKeys)
                .Include(m => m.Payments)
                .FirstOrDefaultAsync(m => m.Id == id);

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

            var totalVolumeCents = merchant.Payments.Sum(p => p.AmountCents);
            var totalTransactions = merchant.Payments.Count;

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
                transaction_volume_cents = totalVolumeCents,
                transaction_count = totalTransactions,
                created_at = merchant.CreatedAt,
                updated_at = merchant.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving merchant {MerchantId}", id);
            return StatusCode(500, new
            {
                error = new
                {
                    code = "INTERNAL_ERROR",
                    message = "An error occurred while retrieving merchant"
                }
            });
        }
    }

    [HttpPost("merchants/{id}/disable")]
    public async Task<IActionResult> DisableMerchant(Guid id)
    {
        try
        {
            var isAdmin = HttpContext.Items["IsAdmin"] as bool?;
            if (isAdmin != true)
            {
                return StatusCode(403, new
                {
                    error = new
                    {
                        code = "INSUFFICIENT_PERMISSIONS",
                        message = "Admin access required"
                    }
                });
            }

            var merchant = await _dbContext.Merchants.FindAsync(id);

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

            if (!merchant.Active)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "MERCHANT_ALREADY_DISABLED",
                        message = "Merchant is already disabled"
                    }
                });
            }

            merchant.Active = false;
            merchant.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            var userId = HttpContext.Items["UserId"] as Guid?;
            await _auditService.LogAsync(new AuditEntry
            {
                MerchantId = id,
                Actor = userId?.ToString() ?? "system",
                Action = "merchant.disabled",
                ResourceType = "merchant",
                ResourceId = id,
                Changes = new
                {
                    active = false,
                    disabled_at = merchant.UpdatedAt
                }
            });

            return Ok(new
            {
                merchant_id = merchant.Id,
                active = merchant.Active,
                disabled_at = merchant.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disabling merchant {MerchantId}", id);
            return StatusCode(500, new
            {
                error = new
                {
                    code = "INTERNAL_ERROR",
                    message = "An error occurred while disabling merchant"
                }
            });
        }
    }
}

public class CreateMerchantRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Dictionary<string, object>? ProviderConfig { get; set; }
}
