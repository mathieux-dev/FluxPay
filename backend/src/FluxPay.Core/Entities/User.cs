namespace FluxPay.Core.Entities;

public class User
{
    public Guid Id { get; set; }
    public Guid? MerchantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? MfaSecretEncrypted { get; set; }
    public bool MfaEnabled { get; set; }
    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public Merchant? Merchant { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
