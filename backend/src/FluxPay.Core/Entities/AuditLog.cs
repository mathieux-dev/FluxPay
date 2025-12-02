namespace FluxPay.Core.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid? MerchantId { get; set; }
    public string Actor { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public Guid? ResourceId { get; set; }
    public string? Changes { get; set; }
    public string Signature { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    public Merchant? Merchant { get; set; }
}
