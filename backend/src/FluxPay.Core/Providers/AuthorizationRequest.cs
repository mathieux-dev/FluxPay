namespace FluxPay.Core.Providers;

public class AuthorizationRequest
{
    public string CardToken { get; set; } = string.Empty;
    public long AmountCents { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerDocument { get; set; } = string.Empty;
    public Dictionary<string, string>? Metadata { get; set; }
    public bool Capture { get; set; } = true;
}
