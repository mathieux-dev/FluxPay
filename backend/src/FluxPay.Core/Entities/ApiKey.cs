namespace FluxPay.Core.Entities;

public class ApiKey
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public string KeyId { get; set; } = string.Empty;
    public string KeyHash { get; set; } = string.Empty;
    public string KeySecretEncrypted { get; set; } = string.Empty;
    public bool Active { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public Merchant Merchant { get; set; } = null!;
}
