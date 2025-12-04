namespace FluxPay.Core.Providers;

public interface IPixProvider
{
    Task<PixResult> CreatePixPaymentAsync(PixRequest request);
}

public class PixRequest
{
    public long AmountCents { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerDocument { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 60;
    public Dictionary<string, string>? Metadata { get; set; }
}

public class PixResult
{
    public bool Success { get; set; }
    public string? ProviderPaymentId { get; set; }
    public string? QrCode { get; set; }
    public string? QrCodeUrl { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object>? RawResponse { get; set; }
}
