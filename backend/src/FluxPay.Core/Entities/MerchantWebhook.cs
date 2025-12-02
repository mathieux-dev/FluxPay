namespace FluxPay.Core.Entities;

public class MerchantWebhook
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public string EndpointUrl { get; set; } = string.Empty;
    public string SecretEncrypted { get; set; } = string.Empty;
    public bool Active { get; set; }
    public int RetryCount { get; set; }
    public DateTime? LastSuccessAt { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public Merchant Merchant { get; set; } = null!;
}
