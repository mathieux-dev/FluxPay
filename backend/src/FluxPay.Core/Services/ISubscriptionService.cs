using FluxPay.Core.Entities;

namespace FluxPay.Core.Services;

public interface ISubscriptionService
{
    Task<SubscriptionCreationResult> CreateSubscriptionAsync(CreateSubscriptionRequest request, Guid merchantId);
    Task<Subscription> GetSubscriptionAsync(Guid subscriptionId, Guid merchantId);
    Task<SubscriptionCancellationResponse> CancelSubscriptionAsync(Guid subscriptionId, Guid merchantId);
}

public class CreateSubscriptionRequest
{
    public string CardToken { get; set; } = string.Empty;
    public long AmountCents { get; set; }
    public string Interval { get; set; } = string.Empty;
    public CustomerInfo Customer { get; set; } = null!;
    public Dictionary<string, string>? Metadata { get; set; }
}

public class SubscriptionCreationResult
{
    public Guid SubscriptionId { get; set; }
    public string? ProviderSubscriptionId { get; set; }
    public SubscriptionStatus Status { get; set; }
    public long AmountCents { get; set; }
    public string Interval { get; set; } = string.Empty;
    public DateTime? NextBillingDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SubscriptionCancellationResponse
{
    public Guid SubscriptionId { get; set; }
    public SubscriptionStatus Status { get; set; }
    public DateTime? CancelledAt { get; set; }
}
