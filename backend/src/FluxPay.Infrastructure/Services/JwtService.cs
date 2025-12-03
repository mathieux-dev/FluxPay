using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using FluxPay.Core.Services;
using FluxPay.Core.Entities;
using FluxPay.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace FluxPay.Infrastructure.Services;

public class JwtService : IJwtService
{
    private readonly FluxPayDbContext _dbContext;
    private readonly IEncryptionService _encryptionService;
    private readonly RSA _rsa;
    private readonly RsaSecurityKey _securityKey;
    private readonly JwtSecurityTokenHandler _tokenHandler;

    public JwtService(FluxPayDbContext dbContext, IEncryptionService encryptionService)
    {
        _dbContext = dbContext;
        _encryptionService = encryptionService;
        _tokenHandler = new JwtSecurityTokenHandler
        {
            MapInboundClaims = false
        };

        var privateKeyPem = Environment.GetEnvironmentVariable("JWT_PRIVATE_KEY");
        var publicKeyPem = Environment.GetEnvironmentVariable("JWT_PUBLIC_KEY");

        if (string.IsNullOrEmpty(privateKeyPem))
        {
            throw new InvalidOperationException("JWT_PRIVATE_KEY environment variable is not set");
        }

        if (string.IsNullOrEmpty(publicKeyPem))
        {
            throw new InvalidOperationException("JWT_PUBLIC_KEY environment variable is not set");
        }

        _rsa = RSA.Create();
        _rsa.ImportFromPem(privateKeyPem);
        _securityKey = new RsaSecurityKey(_rsa);
    }

    public string GenerateAccessToken(Guid userId, string email, bool isAdmin, Guid? merchantId)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("is_admin", isAdmin.ToString().ToLower())
        };

        if (merchantId.HasValue)
        {
            claims.Add(new Claim("merchant_id", merchantId.Value.ToString()));
        }

        var expiryMinutes = isAdmin ? 5 : 15;
        var expires = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expires,
            SigningCredentials = new SigningCredentials(_securityKey, SecurityAlgorithms.RsaSha256),
            Issuer = "FluxPay",
            Audience = "FluxPay"
        };

        var token = _tokenHandler.CreateToken(tokenDescriptor);
        return _tokenHandler.WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[32];
        RandomNumberGenerator.Fill(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public Task<Guid?> ValidateAccessTokenAsync(string token)
    {
        try
        {
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = _securityKey,
                ValidateIssuer = true,
                ValidIssuer = "FluxPay",
                ValidateAudience = true,
                ValidAudience = "FluxPay",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = _tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
            
            if (validatedToken is not JwtSecurityToken jwtToken || 
                !jwtToken.Header.Alg.Equals(SecurityAlgorithms.RsaSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return Task.FromResult<Guid?>(null);
            }

            var userIdClaim = principal.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Task.FromResult<Guid?>(null);
            }

            return Task.FromResult<Guid?>(userId);
        }
        catch
        {
            return Task.FromResult<Guid?>(null);
        }
    }

    public async Task<string> StoreRefreshTokenAsync(Guid userId, string refreshToken, DateTime expiresAt)
    {
        var tokenHash = _encryptionService.Hash(refreshToken);

        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = tokenHash,
            Revoked = false,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.RefreshTokens.Add(refreshTokenEntity);
        await _dbContext.SaveChangesAsync();

        return tokenHash;
    }

    public async Task<Guid?> ValidateAndConsumeRefreshTokenAsync(string refreshToken)
    {
        var tokenHash = _encryptionService.Hash(refreshToken);

        var storedToken = await _dbContext.RefreshTokens
            .Where(rt => rt.TokenHash == tokenHash && !rt.Revoked && rt.ExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync();

        if (storedToken == null)
        {
            return null;
        }

        storedToken.Revoked = true;
        await _dbContext.SaveChangesAsync();

        return storedToken.UserId;
    }

    public async Task RevokeRefreshTokensAsync(Guid userId)
    {
        var tokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.Revoked)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.Revoked = true;
        }

        await _dbContext.SaveChangesAsync();
    }
}
