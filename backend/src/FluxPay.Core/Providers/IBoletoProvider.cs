namespace FluxPay.Core.Providers;

public interface IBoletoProvider
{
    bool IsSandbox { get; }
    Task<BoletoResult> CreateBoletoPaymentAsync(BoletoRequest request);
}

public class BoletoRequest
{
    public long AmountCents { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerDocument { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public Dictionary<string, string>? Metadata { get; set; }
}

public class BoletoResult
{
    public bool Success { get; set; }
    public string? ProviderPaymentId { get; set; }
    public string? Barcode { get; set; }
    public string? DigitableLine { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object>? RawResponse { get; set; }
}
