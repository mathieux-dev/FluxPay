namespace FluxPay.Core.Services;

public interface IReconciliationService
{
    Task<ReconciliationReport> ReconcileAsync(DateTime date);
}

public class ReconciliationReport
{
    public DateTime ReconciliationDate { get; set; }
    public int TotalPayments { get; set; }
    public int MatchedPayments { get; set; }
    public int MismatchedPayments { get; set; }
    public List<ReconciliationMismatch> Mismatches { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

public class ReconciliationMismatch
{
    public Guid PaymentId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string ProviderPaymentId { get; set; } = string.Empty;
    public string FluxPayStatus { get; set; } = string.Empty;
    public string ProviderStatus { get; set; } = string.Empty;
    public long FluxPayAmount { get; set; }
    public long ProviderAmount { get; set; }
    public string MismatchType { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
}
