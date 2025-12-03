using FluxPay.Infrastructure.Data;
using FluxPay.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace FluxPay.Tests.Unit;

public class JwtServiceTests : IDisposable
{
    private readonly string _originalEncryptionKey;
    private readonly string _originalPrivateKey;
    private readonly string _originalPublicKey;

    public JwtServiceTests()
    {
        _originalEncryptionKey = Environment.GetEnvironmentVariable("MASTER_ENCRYPTION_KEY") ?? string.Empty;
        _originalPrivateKey = Environment.GetEnvironmentVariable("JWT_PRIVATE_KEY") ?? string.Empty;
        _originalPublicKey = Environment.GetEnvironmentVariable("JWT_PUBLIC_KEY") ?? string.Empty;

        var encryptionKey = new byte[32];
        RandomNumberGenerator.Fill(encryptionKey);
        Environment.SetEnvironmentVariable("MASTER_ENCRYPTION_KEY", Convert.ToBase64String(encryptionKey));

        using var rsa = RSA.Create(2048);
        var privateKey = rsa.ExportRSAPrivateKeyPem();
        var publicKey = rsa.ExportRSAPublicKeyPem();
        Environment.SetEnvironmentVariable("JWT_PRIVATE_KEY", privateKey);
        Environment.SetEnvironmentVariable("JWT_PUBLIC_KEY", publicKey);
    }

    public void Dispose()
    {
        if (string.IsNullOrEmpty(_originalEncryptionKey))
            Environment.SetEnvironmentVariable("MASTER_ENCRYPTION_KEY", null);
        else
            Environment.SetEnvironmentVariable("MASTER_ENCRYPTION_KEY", _originalEncryptionKey);

        if (string.IsNullOrEmpty(_originalPrivateKey))
            Environment.SetEnvironmentVariable("JWT_PRIVATE_KEY", null);
        else
            Environment.SetEnvironmentVariable("JWT_PRIVATE_KEY", _originalPrivateKey);

        if (string.IsNullOrEmpty(_originalPublicKey))
            Environment.SetEnvironmentVariable("JWT_PUBLIC_KEY", null);
        else
            Environment.SetEnvironmentVariable("JWT_PUBLIC_KEY", _originalPublicKey);
    }

    [Fact]
    public void GenerateAndValidateAccessToken_ShouldWork()
    {
        var options = new DbContextOptionsBuilder<FluxPayDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var dbContext = new FluxPayDbContext(options);
        var encryptionService = new EncryptionService();
        var service = new JwtService(dbContext, encryptionService);

        var userId = Guid.NewGuid();
        var email = "test@example.com";

        var accessToken = service.GenerateAccessToken(userId, email, false, null);
        
        Assert.NotNull(accessToken);
        Assert.NotEmpty(accessToken);
        
        var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var token = tokenHandler.ReadJwtToken(accessToken);
        
        Assert.NotNull(token);
        Assert.Equal("RS256", token.Header.Alg);
        
        var validatedUserId = service.ValidateAccessTokenAsync(accessToken).Result;

        Assert.Equal(userId, validatedUserId);
    }
}
