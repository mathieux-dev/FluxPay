using FluxPay.Core.Entities;
using FluxPay.Core.Providers;
using FluxPay.Core.Services;
using FluxPay.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FluxPay.Infrastructure.Services;

public class ReconciliationService : IReconciliationService
{
    private readonly FluxPayDbContext _dbContext;
    private readonly IProviderFactory _providerFactory;
    private readonly IAuditService _auditService;
    private readonly ILogger<ReconciliationService> _logger;

    public ReconciliationService(
        FluxPayDbContext dbContext,
        IProviderFactory providerFactory,
        IAuditService auditService,
        ILogger<ReconciliationService> logger)
    {
        _dbContext = dbContext;
        _providerFactory = providerFactory;
        _auditService = auditService;
        _logger = logger;
    }

    public async Task<ReconciliationReport> ReconcileAsync(DateTime date)
    {
        var report = new ReconciliationReport
        {
            ReconciliationDate = date.Date,
            GeneratedAt = DateTime.UtcNow
        };

        var startDate = date.Date;
        var endDate = startDate.AddDays(1);

        var payments = await _dbContext.Payments
            .Where(p => p.CreatedAt >= startDate && p.CreatedAt < endDate)
            .Where(p => p.ProviderPaymentId != null)
            .ToListAsync();

        report.TotalPayments = payments.Count;

        var pagarmePayments = payments.Where(p => p.Provider == "pagarme").ToList();
        var gerencianetPayments = payments.Where(p => p.Provider == "gerencianet").ToList();

        if (pagarmePayments.Any())
        {
            await ReconcileProviderPaymentsAsync("pagarme", pagarmePayments, date, report);
        }

        if (gerencianetPayments.Any())
        {
            await ReconcileProviderPaymentsAsync("gerencianet", gerencianetPayments, date, report);
        }

        report.MatchedPayments = report.TotalPayments - report.MismatchedPayments;

        await _auditService.LogAsync(new AuditEntry
        {
            MerchantId = null,
            Actor = "ReconciliationWorker",
            Action = "reconciliation_completed",
            ResourceType = "reconciliation_report",
            ResourceId = null,
            Changes = new Dictionary<string, object>
            {
                ["reconciliation_date"] = date.Date,
                ["total_payments"] = report.TotalPayments,
                ["matched_payments"] = report.MatchedPayments,
                ["mismatched_payments"] = report.MismatchedPayments
            }
        });

        return report;
    }

    private async Task ReconcileProviderPaymentsAsync(
        string providerName,
        List<Payment> payments,
        DateTime date,
        ReconciliationReport report)
    {
        try
        {
            var provider = _providerFactory.GetProvider(providerName);
            var providerReports = await provider.GetTransactionReportAsync(date);

            var providerReportDict = providerReports
                .Where(r => !string.IsNullOrEmpty(r.ProviderPaymentId))
                .ToDictionary(r => r.ProviderPaymentId, r => r);

            foreach (var payment in payments)
            {
                if (string.IsNullOrEmpty(payment.ProviderPaymentId))
                {
                    continue;
                }

                if (!providerReportDict.TryGetValue(payment.ProviderPaymentId, out var providerReport))
                {
                    var mismatch = new ReconciliationMismatch
                    {
                        PaymentId = payment.Id,
                        Provider = providerName,
                        ProviderPaymentId = payment.ProviderPaymentId,
                        FluxPayStatus = payment.Status.ToString(),
                        ProviderStatus = "not_found",
                        FluxPayAmount = payment.AmountCents,
                        ProviderAmount = 0,
                        MismatchType = "missing_in_provider",
                        Details = "Payment exists in FluxPay but not found in provider report"
                    };

                    report.Mismatches.Add(mismatch);
                    report.MismatchedPayments++;

                    await CreateMismatchAlertAsync(payment, mismatch);
                    continue;
                }

                var statusMatch = CompareStatuses(payment.Status, providerReport.Status);
                var amountMatch = payment.AmountCents == providerReport.AmountCents;

                if (!statusMatch || !amountMatch)
                {
                    var mismatchType = !statusMatch && !amountMatch ? "status_and_amount_mismatch" :
                                      !statusMatch ? "status_mismatch" : "amount_mismatch";

                    var mismatch = new ReconciliationMismatch
                    {
                        PaymentId = payment.Id,
                        Provider = providerName,
                        ProviderPaymentId = payment.ProviderPaymentId,
                        FluxPayStatus = payment.Status.ToString(),
                        ProviderStatus = providerReport.Status,
                        FluxPayAmount = payment.AmountCents,
                        ProviderAmount = providerReport.AmountCents,
                        MismatchType = mismatchType,
                        Details = $"Status match: {statusMatch}, Amount match: {amountMatch}"
                    };

                    report.Mismatches.Add(mismatch);
                    report.MismatchedPayments++;

                    await CreateMismatchAlertAsync(payment, mismatch);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reconciling {Provider} payments for date {Date}", providerName, date);
            
            await _auditService.LogAsync(new AuditEntry
            {
                MerchantId = null,
                Actor = "ReconciliationWorker",
                Action = "reconciliation_error",
                ResourceType = "reconciliation_report",
                ResourceId = null,
                Changes = new Dictionary<string, object>
                {
                    ["provider"] = providerName,
                    ["date"] = date,
                    ["error"] = ex.Message
                }
            });
        }
    }

    private bool CompareStatuses(PaymentStatus fluxPayStatus, string providerStatus)
    {
        var normalizedProviderStatus = providerStatus.ToLowerInvariant();

        return fluxPayStatus switch
        {
            PaymentStatus.Pending => normalizedProviderStatus is "pending" or "waiting_payment" or "active",
            PaymentStatus.Authorized => normalizedProviderStatus is "authorized" or "pre_authorized",
            PaymentStatus.Paid => normalizedProviderStatus is "paid" or "captured" or "concluida",
            PaymentStatus.Refunded => normalizedProviderStatus is "refunded" or "canceled",
            PaymentStatus.Failed => normalizedProviderStatus is "failed" or "refused" or "error",
            PaymentStatus.Expired => normalizedProviderStatus is "expired" or "removida_pelo_usuario_recebedor" or "removida_pelo_psp",
            PaymentStatus.Cancelled => normalizedProviderStatus is "cancelled" or "canceled",
            _ => false
        };
    }

    private async Task CreateMismatchAlertAsync(Payment payment, ReconciliationMismatch mismatch)
    {
        await _auditService.LogAsync(new AuditEntry
        {
            MerchantId = payment.MerchantId,
            Actor = "ReconciliationWorker",
            Action = "reconciliation_mismatch_detected",
            ResourceType = "payment",
            ResourceId = payment.Id,
            Changes = new Dictionary<string, object>
            {
                ["mismatch_type"] = mismatch.MismatchType,
                ["fluxpay_status"] = mismatch.FluxPayStatus,
                ["provider_status"] = mismatch.ProviderStatus,
                ["fluxpay_amount"] = mismatch.FluxPayAmount,
                ["provider_amount"] = mismatch.ProviderAmount,
                ["details"] = mismatch.Details
            }
        });

        _logger.LogWarning(
            "Reconciliation mismatch detected for payment {PaymentId}: {MismatchType}. FluxPay: {FluxPayStatus}/{FluxPayAmount}, Provider: {ProviderStatus}/{ProviderAmount}",
            payment.Id,
            mismatch.MismatchType,
            mismatch.FluxPayStatus,
            mismatch.FluxPayAmount,
            mismatch.ProviderStatus,
            mismatch.ProviderAmount);
    }
}
