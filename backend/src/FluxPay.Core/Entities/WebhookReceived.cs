namespace FluxPay.Core.Entities;

public class WebhookReceived
{
    public Guid Id { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public bool Processed { get; set; }
    public DateTime ReceivedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}
