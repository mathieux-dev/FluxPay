using FluxPay.Core.Entities;
using FluxPay.Core.Providers;
using FluxPay.Core.Services;
using FluxPay.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace FluxPay.Infrastructure.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly FluxPayDbContext _dbContext;
    private readonly IProviderFactory _providerFactory;
    private readonly IEncryptionService _encryptionService;
    private readonly IAuditService _auditService;

    public SubscriptionService(
        FluxPayDbContext dbContext,
        IProviderFactory providerFactory,
        IEncryptionService encryptionService,
        IAuditService auditService)
    {
        _dbContext = dbContext;
        _providerFactory = providerFactory;
        _encryptionService = encryptionService;
        _auditService = auditService;
    }

    public async Task<SubscriptionCreationResult> CreateSubscriptionAsync(CreateSubscriptionRequest request, Guid merchantId)
    {
        ValidateSubscriptionRequest(request);

        var merchant = await _dbContext.Merchants
            .FirstOrDefaultAsync(m => m.Id == merchantId && m.Active);
        
        if (merchant == null)
        {
            throw new InvalidOperationException("Merchant not found or inactive");
        }

        var customer = await GetOrCreateCustomerAsync(request.Customer, merchantId);

        var subscriptionProvider = _providerFactory.GetProvider("pagarme") as ISubscriptionProvider;
        if (subscriptionProvider == null)
        {
            throw new InvalidOperationException("Subscription provider not available");
        }

        var providerRequest = new SubscriptionRequest
        {
            CardToken = request.CardToken,
            AmountCents = request.AmountCents,
            Interval = request.Interval,
            CustomerName = request.Customer.Name,
            CustomerEmail = request.Customer.Email,
            CustomerDocument = request.Customer.Document,
            Metadata = request.Metadata
        };

        var providerResult = await subscriptionProvider.CreateSubscriptionAsync(providerRequest);

        if (!providerResult.Success)
        {
            throw new InvalidOperationException($"Subscription creation failed: {providerResult.ErrorMessage}");
        }

        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            MerchantId = merchantId,
            CustomerId = customer.Id,
            ProviderSubscriptionId = providerResult.ProviderSubscriptionId,
            Status = MapProviderStatus(providerResult.Status),
            AmountCents = request.AmountCents,
            Interval = request.Interval,
            NextBillingDate = providerResult.NextBillingDate,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Subscriptions.Add(subscription);

        await _auditService.LogAsync(new AuditEntry
        {
            MerchantId = merchantId,
            Actor = $"merchant:{merchantId}",
            Action = "subscription.created",
            ResourceType = "Subscription",
            ResourceId = subscription.Id,
            Changes = new { amount = request.AmountCents, interval = request.Interval }
        });

        await _dbContext.SaveChangesAsync();

        return new SubscriptionCreationResult
        {
            SubscriptionId = subscription.Id,
            ProviderSubscriptionId = subscription.ProviderSubscriptionId,
            Status = subscription.Status,
            AmountCents = subscription.AmountCents,
            Interval = subscription.Interval,
            NextBillingDate = subscription.NextBillingDate,
            CreatedAt = subscription.CreatedAt
        };
    }

    public async Task<Subscription> GetSubscriptionAsync(Guid subscriptionId, Guid merchantId)
    {
        var subscription = await _dbContext.Subscriptions
            .Include(s => s.Customer)
            .Include(s => s.Merchant)
            .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.MerchantId == merchantId);

        if (subscription == null)
        {
            throw new InvalidOperationException("Subscription not found");
        }

        return subscription;
    }

    public async Task<SubscriptionCancellationResponse> CancelSubscriptionAsync(Guid subscriptionId, Guid merchantId)
    {
        var subscription = await _dbContext.Subscriptions
            .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.MerchantId == merchantId);

        if (subscription == null)
        {
            throw new InvalidOperationException("Subscription not found");
        }

        if (subscription.Status == SubscriptionStatus.Cancelled)
        {
            throw new InvalidOperationException("Subscription is already cancelled");
        }

        var subscriptionProvider = _providerFactory.GetProvider("pagarme") as ISubscriptionProvider;
        if (subscriptionProvider == null)
        {
            throw new InvalidOperationException("Subscription provider not available");
        }

        var providerResult = await subscriptionProvider.CancelSubscriptionAsync(subscription.ProviderSubscriptionId!);

        if (!providerResult.Success)
        {
            throw new InvalidOperationException($"Subscription cancellation failed: {providerResult.ErrorMessage}");
        }

        subscription.Status = SubscriptionStatus.Cancelled;
        subscription.CancelledAt = providerResult.CancelledAt ?? DateTime.UtcNow;

        await _auditService.LogAsync(new AuditEntry
        {
            MerchantId = merchantId,
            Actor = $"merchant:{merchantId}",
            Action = "subscription.cancelled",
            ResourceType = "Subscription",
            ResourceId = subscription.Id,
            Changes = new { cancelledAt = subscription.CancelledAt }
        });

        await _dbContext.SaveChangesAsync();

        return new SubscriptionCancellationResponse
        {
            SubscriptionId = subscription.Id,
            Status = subscription.Status,
            CancelledAt = subscription.CancelledAt
        };
    }

    private async Task<Customer> GetOrCreateCustomerAsync(CustomerInfo customerInfo, Guid merchantId)
    {
        var emailHash = _encryptionService.Hash(customerInfo.Email.ToLowerInvariant());
        var documentHash = _encryptionService.Hash(customerInfo.Document);

        var customer = await _dbContext.Customers
            .FirstOrDefaultAsync(c => c.MerchantId == merchantId && c.DocumentHash == documentHash);

        if (customer == null)
        {
            customer = new Customer
            {
                Id = Guid.NewGuid(),
                MerchantId = merchantId,
                Name = customerInfo.Name,
                EmailHash = emailHash,
                DocumentHash = documentHash,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Customers.Add(customer);
        }

        return customer;
    }

    private void ValidateSubscriptionRequest(CreateSubscriptionRequest request)
    {
        if (request.AmountCents <= 0)
        {
            throw new ArgumentException("Amount must be greater than zero");
        }

        if (string.IsNullOrWhiteSpace(request.CardToken))
        {
            throw new ArgumentException("Card token is required");
        }

        if (string.IsNullOrWhiteSpace(request.Interval))
        {
            throw new ArgumentException("Interval is required");
        }

        if (request.Customer == null)
        {
            throw new ArgumentException("Customer information is required");
        }

        if (string.IsNullOrWhiteSpace(request.Customer.Name))
        {
            throw new ArgumentException("Customer name is required");
        }

        if (string.IsNullOrWhiteSpace(request.Customer.Email))
        {
            throw new ArgumentException("Customer email is required");
        }

        if (string.IsNullOrWhiteSpace(request.Customer.Document))
        {
            throw new ArgumentException("Customer document is required");
        }
    }

    private SubscriptionStatus MapProviderStatus(string providerStatus)
    {
        return providerStatus.ToLowerInvariant() switch
        {
            "active" => SubscriptionStatus.Active,
            "cancelled" or "canceled" => SubscriptionStatus.Cancelled,
            "past_due" => SubscriptionStatus.PastDue,
            "expired" => SubscriptionStatus.Expired,
            _ => SubscriptionStatus.Active
        };
    }
}
