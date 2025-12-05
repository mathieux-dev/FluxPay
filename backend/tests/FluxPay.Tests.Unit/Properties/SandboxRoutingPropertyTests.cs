using FsCheck;
using FsCheck.Xunit;
using FluxPay.Core.Entities;
using FluxPay.Core.Providers;
using FluxPay.Core.Services;
using FluxPay.Infrastructure.Data;
using FluxPay.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using System.Security.Cryptography;

namespace FluxPay.Tests.Unit.Properties;

public class SandboxRoutingPropertyTests : IDisposable
{
    private readonly string _originalEncryptionKey;
    private readonly EncryptionService _encryptionService;

    public SandboxRoutingPropertyTests()
    {
        _originalEncryptionKey = Environment.GetEnvironmentVariable("MASTER_ENCRYPTION_KEY") ?? string.Empty;

        var encryptionKey = new byte[32];
        RandomNumberGenerator.Fill(encryptionKey);
        Environment.SetEnvironmentVariable("MASTER_ENCRYPTION_KEY", Convert.ToBase64String(encryptionKey));

        _encryptionService = new EncryptionService();
    }

    public void Dispose()
    {
        if (string.IsNullOrEmpty(_originalEncryptionKey))
            Environment.SetEnvironmentVariable("MASTER_ENCRYPTION_KEY", null);
        else
            Environment.SetEnvironmentVariable("MASTER_ENCRYPTION_KEY", _originalEncryptionKey);
    }

    [Property(MaxTest = 100)]
    public void Sandbox_Mode_Should_Mark_Transactions_As_Test()
    {
        Prop.ForAll(
            GenerateValidCardPaymentRequest(),
            Arb.From<bool>(),
            (request, isSandbox) =>
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
                dbContext.SaveChanges();

                var mockProviderAdapter = Substitute.For<IProviderAdapter>();
                mockProviderAdapter.ProviderName.Returns("pagarme");
                mockProviderAdapter.IsSandbox.Returns(isSandbox);
                mockProviderAdapter.AuthorizeAsync(Arg.Any<AuthorizationRequest>())
                    .Returns(Task.FromResult(new AuthorizationResult
                    {
                        Success = true,
                        ProviderTransactionId = Guid.NewGuid().ToString(),
                        ProviderPaymentId = Guid.NewGuid().ToString(),
                        Status = "authorized",
                        CardLastFourDigits = "1234",
                        CardBrand = "visa"
                    }));

                var mockProviderFactory = Substitute.For<IProviderFactory>();
                mockProviderFactory.GetProviderForPaymentMethod(Arg.Any<PaymentMethod>())
                    .Returns(mockProviderAdapter);

                var mockAuditService = Substitute.For<IAuditService>();
                mockAuditService.LogAsync(Arg.Any<AuditEntry>())
                    .Returns(Task.CompletedTask);

                var service = new PaymentService(dbContext, mockProviderFactory, _encryptionService, mockAuditService);

                var result = service.CreatePaymentAsync(request, merchantId).Result;

                var payment = dbContext.Payments.FirstOrDefault(p => p.Id == result.PaymentId);
                var transaction = dbContext.Transactions.FirstOrDefault(t => t.PaymentId == result.PaymentId);

                return payment != null && 
                       transaction != null && 
                       payment.IsTest == isSandbox && 
                       transaction.IsTest == isSandbox;
            }
        ).QuickCheckThrowOnFailure();
    }

    [Property(MaxTest = 100)]
    public void Sandbox_Mode_Should_Mark_PIX_Payments_As_Test()
    {
        Prop.ForAll(
            GenerateValidPixPaymentRequest(),
            Arb.From<bool>(),
            (request, isSandbox) =>
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
                dbContext.SaveChanges();

                var mockPixProvider = Substitute.For<IPixProvider>();
                mockPixProvider.IsSandbox.Returns(isSandbox);
                mockPixProvider.CreatePixPaymentAsync(Arg.Any<PixRequest>())
                    .Returns(Task.FromResult(new PixResult
                    {
                        Success = true,
                        ProviderPaymentId = Guid.NewGuid().ToString(),
                        QrCode = "00020126580014br.gov.bcb.pix",
                        QrCodeUrl = "https://example.com/qr.png",
                        ExpiresAt = DateTime.UtcNow.AddHours(1)
                    }));

                var mockProviderFactory = Substitute.For<IProviderFactory>();
                mockProviderFactory.GetPixProvider().Returns(mockPixProvider);

                var mockAuditService = Substitute.For<IAuditService>();
                mockAuditService.LogAsync(Arg.Any<AuditEntry>())
                    .Returns(Task.CompletedTask);

                var service = new PaymentService(dbContext, mockProviderFactory, _encryptionService, mockAuditService);

                var result = service.CreatePaymentAsync(request, merchantId).Result;

                var payment = dbContext.Payments.FirstOrDefault(p => p.Id == result.PaymentId);

                return payment != null && payment.IsTest == isSandbox;
            }
        ).QuickCheckThrowOnFailure();
    }

    [Property(MaxTest = 100)]
    public void Sandbox_Mode_Should_Mark_Boleto_Payments_As_Test()
    {
        Prop.ForAll(
            GenerateValidBoletoPaymentRequest(),
            Arb.From<bool>(),
            (request, isSandbox) =>
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
                dbContext.SaveChanges();

                var mockBoletoProvider = Substitute.For<IBoletoProvider>();
                mockBoletoProvider.IsSandbox.Returns(isSandbox);
                mockBoletoProvider.CreateBoletoPaymentAsync(Arg.Any<BoletoRequest>())
                    .Returns(Task.FromResult(new BoletoResult
                    {
                        Success = true,
                        ProviderPaymentId = Guid.NewGuid().ToString(),
                        Barcode = "34191790010104351004791020150008291070026000",
                        DigitableLine = "34191.79001 01043.510047 91020.150008 2 91070026000",
                        PdfUrl = "https://example.com/boleto.pdf",
                        ExpiresAt = DateTime.UtcNow.AddDays(7)
                    }));

                var mockProviderFactory = Substitute.For<IProviderFactory>();
                mockProviderFactory.GetBoletoProvider().Returns(mockBoletoProvider);

                var mockAuditService = Substitute.For<IAuditService>();
                mockAuditService.LogAsync(Arg.Any<AuditEntry>())
                    .Returns(Task.CompletedTask);

                var service = new PaymentService(dbContext, mockProviderFactory, _encryptionService, mockAuditService);

                var result = service.CreatePaymentAsync(request, merchantId).Result;

                var payment = dbContext.Payments.FirstOrDefault(p => p.Id == result.PaymentId);

                return payment != null && payment.IsTest == isSandbox;
            }
        ).QuickCheckThrowOnFailure();
    }

    private static Arbitrary<CreatePaymentRequest> GenerateValidCardPaymentRequest()
    {
        return Arb.From(
            from amountCents in Gen.Choose(100, 1000000)
            from name in Gen.Elements("John Doe", "Jane Smith", "Bob Johnson")
            from email in Gen.Elements("test@example.com", "user@test.com", "customer@mail.com")
            from document in Gen.Elements("12345678901", "98765432100")
            from cardToken in Gen.Elements("tok_test_123", "tok_test_456", "tok_test_789")
            select new CreatePaymentRequest
            {
                AmountCents = amountCents,
                Method = PaymentMethod.CreditCard,
                CardToken = cardToken,
                Customer = new CustomerInfo
                {
                    Name = name,
                    Email = email,
                    Document = document
                }
            }
        );
    }

    private static Arbitrary<CreatePaymentRequest> GenerateValidPixPaymentRequest()
    {
        return Arb.From(
            from amountCents in Gen.Choose(100, 1000000)
            from name in Gen.Elements("John Doe", "Jane Smith", "Bob Johnson")
            from email in Gen.Elements("test@example.com", "user@test.com", "customer@mail.com")
            from document in Gen.Elements("12345678901", "98765432100")
            select new CreatePaymentRequest
            {
                AmountCents = amountCents,
                Method = PaymentMethod.Pix,
                Customer = new CustomerInfo
                {
                    Name = name,
                    Email = email,
                    Document = document
                }
            }
        );
    }

    private static Arbitrary<CreatePaymentRequest> GenerateValidBoletoPaymentRequest()
    {
        return Arb.From(
            from amountCents in Gen.Choose(100, 1000000)
            from name in Gen.Elements("John Doe", "Jane Smith", "Bob Johnson")
            from email in Gen.Elements("test@example.com", "user@test.com", "customer@mail.com")
            from document in Gen.Elements("12345678901", "98765432100")
            select new CreatePaymentRequest
            {
                AmountCents = amountCents,
                Method = PaymentMethod.Boleto,
                Customer = new CustomerInfo
                {
                    Name = name,
                    Email = email,
                    Document = document
                }
            }
        );
    }
}
