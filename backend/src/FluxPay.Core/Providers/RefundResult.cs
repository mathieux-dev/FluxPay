namespace FluxPay.Core.Providers;

public class RefundResult
{
    public bool Success { get; set; }
    public string? ProviderRefundId { get; set; }
    public string? ProviderTransactionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public long RefundedAmountCents { get; set; }
    public Dictionary<string, object>? RawResponse { get; set; }
}
