using FluxPay.Core.Services;
using FluxPay.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OtpNet;

namespace FluxPay.Api.Controllers;

[ApiController]
[Route("v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IJwtService _jwtService;
    private readonly IEncryptionService _encryptionService;
    private readonly FluxPayDbContext _dbContext;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IJwtService jwtService,
        IEncryptionService encryptionService,
        FluxPayDbContext dbContext,
        ILogger<AuthController> logger)
    {
        _jwtService = jwtService;
        _encryptionService = encryptionService;
        _dbContext = dbContext;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_REQUEST",
                        message = "Email and password are required"
                    }
                });
            }

            var user = await _dbContext.Users
                .Include(u => u.Merchant)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !_encryptionService.VerifyHash(request.Password, user.PasswordHash))
            {
                return Unauthorized(new
                {
                    error = new
                    {
                        code = "INVALID_CREDENTIALS",
                        message = "Invalid email or password"
                    }
                });
            }

            if (user.MfaEnabled)
            {
                if (string.IsNullOrWhiteSpace(request.MfaCode))
                {
                    return Unauthorized(new
                    {
                        error = new
                        {
                            code = "MFA_REQUIRED",
                            message = "MFA code is required"
                        }
                    });
                }

                var mfaSecret = _encryptionService.Decrypt(user.MfaSecretEncrypted!);
                var totp = new Totp(Base32Encoding.ToBytes(mfaSecret));
                
                if (!totp.VerifyTotp(request.MfaCode, out _, new VerificationWindow(1, 1)))
                {
                    return Unauthorized(new
                    {
                        error = new
                        {
                            code = "INVALID_MFA_CODE",
                            message = "Invalid MFA code"
                        }
                    });
                }
            }

            var accessToken = _jwtService.GenerateAccessToken(
                user.Id,
                user.Email,
                user.IsAdmin,
                user.MerchantId
            );

            var refreshToken = _jwtService.GenerateRefreshToken();
            var expiresAt = DateTime.UtcNow.AddDays(30);
            await _jwtService.StoreRefreshTokenAsync(user.Id, refreshToken, expiresAt);

            return Ok(new
            {
                access_token = accessToken,
                refresh_token = refreshToken,
                token_type = "Bearer",
                expires_in = user.IsAdmin ? 300 : 900
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email {Email}", request.Email);
            return StatusCode(500, new
            {
                error = new
                {
                    code = "INTERNAL_ERROR",
                    message = "An error occurred during login"
                }
            });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_REQUEST",
                        message = "Refresh token is required"
                    }
                });
            }

            var userId = await _jwtService.ValidateAndConsumeRefreshTokenAsync(request.RefreshToken);

            if (!userId.HasValue)
            {
                return Unauthorized(new
                {
                    error = new
                    {
                        code = "TOKEN_REVOKED",
                        message = "Refresh token is invalid or has been revoked"
                    }
                });
            }

            var user = await _dbContext.Users.FindAsync(userId.Value);

            if (user == null)
            {
                return Unauthorized(new
                {
                    error = new
                    {
                        code = "USER_NOT_FOUND",
                        message = "User not found"
                    }
                });
            }

            var accessToken = _jwtService.GenerateAccessToken(
                user.Id,
                user.Email,
                user.IsAdmin,
                user.MerchantId
            );

            var newRefreshToken = _jwtService.GenerateRefreshToken();
            var expiresAt = DateTime.UtcNow.AddDays(30);
            await _jwtService.StoreRefreshTokenAsync(user.Id, newRefreshToken, expiresAt);

            return Ok(new
            {
                access_token = accessToken,
                refresh_token = newRefreshToken,
                token_type = "Bearer",
                expires_in = user.IsAdmin ? 300 : 900
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new
            {
                error = new
                {
                    code = "INTERNAL_ERROR",
                    message = "An error occurred during token refresh"
                }
            });
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        try
        {
            var userId = HttpContext.Items["UserId"] as Guid?;

            if (!userId.HasValue)
            {
                return Unauthorized(new
                {
                    error = new
                    {
                        code = "UNAUTHORIZED",
                        message = "User authentication required"
                    }
                });
            }

            await _jwtService.RevokeRefreshTokensAsync(userId.Value);

            return Ok(new
            {
                message = "Logged out successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new
            {
                error = new
                {
                    code = "INTERNAL_ERROR",
                    message = "An error occurred during logout"
                }
            });
        }
    }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? MfaCode { get; set; }
}

public class RefreshRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}
