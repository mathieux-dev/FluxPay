namespace FluxPay.Core.Services;

public interface IJwtService
{
    string GenerateAccessToken(Guid userId, string email, bool isAdmin, Guid? merchantId);
    string GenerateRefreshToken();
    Task<Guid?> ValidateAccessTokenAsync(string token);
    Task<string> StoreRefreshTokenAsync(Guid userId, string refreshToken, DateTime expiresAt);
    Task<Guid?> ValidateAndConsumeRefreshTokenAsync(string refreshToken);
    Task RevokeRefreshTokensAsync(Guid userId);
}
