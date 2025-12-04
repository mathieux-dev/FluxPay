namespace FluxPay.Core.Providers;

public class AuthorizationResult
{
    public bool Success { get; set; }
    public string? ProviderTransactionId { get; set; }
    public string? ProviderPaymentId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public string? CardLastFourDigits { get; set; }
    public string? CardBrand { get; set; }
    public Dictionary<string, object>? RawResponse { get; set; }
}
