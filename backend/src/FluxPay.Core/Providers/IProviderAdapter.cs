namespace FluxPay.Core.Providers;

public interface IProviderAdapter
{
    string ProviderName { get; }
    bool IsSandbox { get; }
    Task<AuthorizationResult> AuthorizeAsync(AuthorizationRequest request);
    Task<CaptureResult> CaptureAsync(string providerTransactionId, long amountCents);
    Task<RefundResult> RefundAsync(string providerTransactionId, long amountCents);
    Task<bool> ValidateWebhookSignatureAsync(string signature, string payload, long timestamp);
    Task<List<ProviderTransactionReport>> GetTransactionReportAsync(DateTime date);
}
