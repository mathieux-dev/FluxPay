namespace FluxPay.Core.Entities;

public class Customer
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string EmailHash { get; set; } = string.Empty;
    public string DocumentHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    public Merchant Merchant { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}
