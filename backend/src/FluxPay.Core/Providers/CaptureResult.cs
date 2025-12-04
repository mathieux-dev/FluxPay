namespace FluxPay.Core.Providers;

public class CaptureResult
{
    public bool Success { get; set; }
    public string? ProviderTransactionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public long CapturedAmountCents { get; set; }
    public Dictionary<string, object>? RawResponse { get; set; }
}
