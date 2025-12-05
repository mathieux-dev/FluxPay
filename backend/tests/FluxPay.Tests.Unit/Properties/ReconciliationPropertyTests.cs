using FsCheck;
using FsCheck.Xunit;
using FluxPay.Core.Entities;
using FluxPay.Core.Providers;
using FluxPay.Core.Services;
using FluxPay.Infrastructure.Data;
using FluxPay.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace FluxPay.Tests.Unit.Properties;

public class ReconciliationPropertyTests
{
    [Property(MaxTest = 100)]
    public void Reconciliation_Mismatch_Detection_Should_Flag_Status_Differences()
    {
        Prop.ForAll(
            GeneratePaymentWithProviderReport(),
            data =>
            {
                var options = new DbContextOptionsBuilder<FluxPayDbContext>()
                    .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                    .Options;
                using var dbContext = new FluxPayDbContext(options);

                var merchantId = Guid.NewGuid();
                var merchant = new Merchant
                {
                    Id = merchantId,
                    Name = "Test Merchant",
                    Email = "merchant@test.com",
                    ProviderConfigEncrypted = "{}",
                    Active = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                dbContext.Merchants.Add(merchant);

                var payment = new Payment
                {
                    Id = Guid.NewGuid(),
                    MerchantId = merchantId,
                    AmountCents = data.AmountCents,
                    Method = PaymentMethod.CreditCard,
                    Status = data.FluxPayStatus,
                    Provider = "pagarme",
                    ProviderPaymentId = data.ProviderPaymentId,
                    CreatedAt = data.Date,
                    UpdatedAt = data.Date
                };
                dbContext.Payments.Add(payment);
                dbContext.SaveChanges();

                var mockProviderAdapter = Substitute.For<IProviderAdapter>();
                mockProviderAdapter.ProviderName.Returns("pagarme");
                mockProviderAdapter.GetTransactionReportAsync(Arg.Any<DateTime>())
                    .Returns(Task.FromResult(new List<ProviderTransactionReport>
                    {
                        new ProviderTransactionReport
                        {
                            ProviderPaymentId = data.ProviderPaymentId,
                            Status = data.ProviderStatus,
                            AmountCents = data.AmountCents,
                            TransactionDate = data.Date
                        }
                    }));

                var mockProviderFactory = Substitute.For<IProviderFactory>();
                mockProviderFactory.GetProvider("pagarme").Returns(mockProviderAdapter);

                var mockAuditService = Substitute.For<IAuditService>();
                mockAuditService.LogAsync(Arg.Any<AuditEntry>())
                    .Returns(Task.CompletedTask);

                var mockLogger = Substitute.For<ILogger<ReconciliationService>>();

                var service = new ReconciliationService(
                    dbContext,
                    mockProviderFactory,
                    mockAuditService,
                    mockLogger);

                var report = service.ReconcileAsync(data.Date).Result;

                var statusesMatch = CompareStatuses(data.FluxPayStatus, data.ProviderStatus);

                if (!statusesMatch)
                {
                    return report.MismatchedPayments > 0 &&
                           report.Mismatches.Any(m => m.PaymentId == payment.Id &&
                                                     m.MismatchType.Contains("status"));
                }
                else
                {
                    return report.MismatchedPayments == 0 ||
                           !report.Mismatches.Any(m => m.PaymentId == payment.Id);
                }
            }
        ).QuickCheckThrowOnFailure();
    }

    [Property(MaxTest = 100)]
    public void Reconciliation_Mismatch_Alerting_Should_Create_Audit_Log_For_Mismatches()
    {
        Prop.ForAll(
            GenerateMismatchedPaymentData(),
            data =>
            {
                var options = new DbContextOptionsBuilder<FluxPayDbContext>()
                    .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                    .Options;
                using var dbContext = new FluxPayDbContext(options);

                var merchantId = Guid.NewGuid();
                var merchant = new Merchant
                {
                    Id = merchantId,
                    Name = "Test Merchant",
                    Email = "merchant@test.com",
                    ProviderConfigEncrypted = "{}",
                    Active = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                dbContext.Merchants.Add(merchant);

                var payment = new Payment
                {
                    Id = Guid.NewGuid(),
                    MerchantId = merchantId,
                    AmountCents = data.FluxPayAmount,
                    Method = PaymentMethod.CreditCard,
                    Status = data.FluxPayStatus,
                    Provider = "pagarme",
                    ProviderPaymentId = data.ProviderPaymentId,
                    CreatedAt = data.Date,
                    UpdatedAt = data.Date
                };
                dbContext.Payments.Add(payment);
                dbContext.SaveChanges();

                var mockProviderAdapter = Substitute.For<IProviderAdapter>();
                mockProviderAdapter.ProviderName.Returns("pagarme");
                mockProviderAdapter.GetTransactionReportAsync(Arg.Any<DateTime>())
                    .Returns(Task.FromResult(new List<ProviderTransactionReport>
                    {
                        new ProviderTransactionReport
                        {
                            ProviderPaymentId = data.ProviderPaymentId,
                            Status = data.ProviderStatus,
                            AmountCents = data.ProviderAmount,
                            TransactionDate = data.Date
                        }
                    }));

                var mockProviderFactory = Substitute.For<IProviderFactory>();
                mockProviderFactory.GetProvider("pagarme").Returns(mockProviderAdapter);

                var mockAuditService = Substitute.For<IAuditService>();
                mockAuditService.LogAsync(Arg.Any<AuditEntry>())
                    .Returns(Task.CompletedTask);

                var mockLogger = Substitute.For<ILogger<ReconciliationService>>();

                var service = new ReconciliationService(
                    dbContext,
                    mockProviderFactory,
                    mockAuditService,
                    mockLogger);

                var report = service.ReconcileAsync(data.Date).Result;

                mockAuditService.Received().LogAsync(Arg.Is<AuditEntry>(e =>
                    e.Action == "reconciliation_mismatch_detected" &&
                    e.ResourceType == "payment" &&
                    e.ResourceId == payment.Id &&
                    e.MerchantId == merchantId
                ));

                return report.MismatchedPayments > 0 &&
                       report.Mismatches.Any(m => m.PaymentId == payment.Id);
            }
        ).QuickCheckThrowOnFailure();
    }

    private static bool CompareStatuses(PaymentStatus fluxPayStatus, string providerStatus)
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

    private static Arbitrary<PaymentProviderData> GeneratePaymentWithProviderReport()
    {
        var gen = from fluxPayStatus in Gen.Elements(
                      PaymentStatus.Pending,
                      PaymentStatus.Authorized,
                      PaymentStatus.Paid,
                      PaymentStatus.Refunded,
                      PaymentStatus.Failed,
                      PaymentStatus.Expired,
                      PaymentStatus.Cancelled)
                  from providerStatus in Gen.Elements(
                      "pending", "waiting_payment", "active",
                      "authorized", "pre_authorized",
                      "paid", "captured", "concluida",
                      "refunded", "canceled",
                      "failed", "refused", "error",
                      "expired", "removida_pelo_usuario_recebedor", "removida_pelo_psp",
                      "cancelled")
                  from amountCents in Gen.Choose(100, 1000000)
                  from daysAgo in Gen.Choose(1, 30)
                  select new PaymentProviderData
                  {
                      FluxPayStatus = fluxPayStatus,
                      ProviderStatus = providerStatus,
                      AmountCents = amountCents,
                      ProviderPaymentId = Guid.NewGuid().ToString(),
                      Date = DateTime.UtcNow.Date.AddDays(-daysAgo)
                  };

        return Arb.From(gen);
    }

    private static Arbitrary<MismatchedPaymentData> GenerateMismatchedPaymentData()
    {
        var gen = from fluxPayStatus in Gen.Elements(PaymentStatus.Paid, PaymentStatus.Pending, PaymentStatus.Authorized)
                  from providerStatus in Gen.Elements("failed", "refused", "expired", "canceled")
                  from fluxPayAmount in Gen.Choose(100, 1000000)
                  from providerAmount in Gen.Choose(100, 1000000)
                  from daysAgo in Gen.Choose(1, 30)
                  select new MismatchedPaymentData
                  {
                      FluxPayStatus = fluxPayStatus,
                      ProviderStatus = providerStatus,
                      FluxPayAmount = fluxPayAmount,
                      ProviderAmount = providerAmount,
                      ProviderPaymentId = Guid.NewGuid().ToString(),
                      Date = DateTime.UtcNow.Date.AddDays(-daysAgo)
                  };

        return Arb.From(gen);
    }
}

public class PaymentProviderData
{
    public PaymentStatus FluxPayStatus { get; set; }
    public string ProviderStatus { get; set; } = string.Empty;
    public long AmountCents { get; set; }
    public string ProviderPaymentId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}

public class MismatchedPaymentData
{
    public PaymentStatus FluxPayStatus { get; set; }
    public string ProviderStatus { get; set; } = string.Empty;
    public long FluxPayAmount { get; set; }
    public long ProviderAmount { get; set; }
    public string ProviderPaymentId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}
