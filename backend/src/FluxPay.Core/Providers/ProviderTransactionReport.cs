namespace FluxPay.Core.Providers;

public class ProviderTransactionReport
{
    public string ProviderPaymentId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public long AmountCents { get; set; }
    public DateTime TransactionDate { get; set; }
    public Dictionary<string, object>? RawData { get; set; }
}
