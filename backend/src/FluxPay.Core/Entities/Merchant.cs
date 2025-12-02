namespace FluxPay.Core.Entities;

public class Merchant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ProviderConfigEncrypted { get; set; } = string.Empty;
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public ICollection<ApiKey> ApiKeys { get; set; } = new List<ApiKey>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<MerchantWebhook> Webhooks { get; set; } = new List<MerchantWebhook>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    public ICollection<Customer> Customers { get; set; } = new List<Customer>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public ICollection<User> Users { get; set; } = new List<User>();
}
