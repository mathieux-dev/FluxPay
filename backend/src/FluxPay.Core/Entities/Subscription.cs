namespace FluxPay.Core.Entities;

public class Subscription
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public Guid CustomerId { get; set; }
    public string? ProviderSubscriptionId { get; set; }
    public SubscriptionStatus Status { get; set; }
    public long AmountCents { get; set; }
    public string Interval { get; set; } = string.Empty;
    public DateTime? NextBillingDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    
    public Merchant Merchant { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
}

public enum SubscriptionStatus
{
    Active,
    Cancelled,
    PastDue,
    Expired
}
