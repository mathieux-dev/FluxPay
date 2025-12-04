namespace FluxPay.Core.Providers;

public interface ISubscriptionProvider
{
    Task<SubscriptionResult> CreateSubscriptionAsync(SubscriptionRequest request);
    Task<SubscriptionCancellationResult> CancelSubscriptionAsync(string providerSubscriptionId);
}

public class SubscriptionRequest
{
    public string CardToken { get; set; } = string.Empty;
    public long AmountCents { get; set; }
    public string Interval { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerDocument { get; set; } = string.Empty;
    public Dictionary<string, string>? Metadata { get; set; }
}

public class SubscriptionResult
{
    public bool Success { get; set; }
    public string? ProviderSubscriptionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? NextBillingDate { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object>? RawResponse { get; set; }
}

public class SubscriptionCancellationResult
{
    public bool Success { get; set; }
    public string? ProviderSubscriptionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? CancelledAt { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object>? RawResponse { get; set; }
}
