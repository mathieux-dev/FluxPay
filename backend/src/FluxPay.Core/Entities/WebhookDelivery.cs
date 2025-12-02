namespace FluxPay.Core.Entities;

public class WebhookDelivery
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public Guid PaymentId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public WebhookDeliveryStatus Status { get; set; }
    public int AttemptCount { get; set; }
    public string? LastError { get; set; }
    public DateTime? NextRetryAt { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public Payment Payment { get; set; } = null!;
}

public enum WebhookDeliveryStatus
{
    Pending,
    Success,
    Failed,
    PermanentlyFailed
}
