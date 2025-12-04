using FluxPay.Core.Entities;
using FluxPay.Core.Providers;

namespace FluxPay.Infrastructure.Providers;

public class ProviderFactory : IProviderFactory
{
    private readonly IServiceProvider _serviceProvider;
    private readonly Dictionary<string, Type> _providerMap;

    public ProviderFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
        _providerMap = new Dictionary<string, Type>(StringComparer.OrdinalIgnoreCase)
        {
            { "pagarme", typeof(PagarMeAdapter) },
            { "gerencianet", typeof(GerencianetAdapter) }
        };
    }

    public IProviderAdapter GetProvider(string providerName)
    {
        if (!_providerMap.TryGetValue(providerName, out var providerType))
        {
            throw new InvalidOperationException($"Provider '{providerName}' is not supported");
        }

        var provider = _serviceProvider.GetService(providerType);
        if (provider is not IProviderAdapter adapter)
        {
            throw new InvalidOperationException($"Provider '{providerName}' does not implement IProviderAdapter");
        }

        return adapter;
    }

    public IProviderAdapter GetProviderForPaymentMethod(PaymentMethod method)
    {
        return method switch
        {
            PaymentMethod.CreditCard => GetProvider("pagarme"),
            PaymentMethod.DebitCard => GetProvider("pagarme"),
            PaymentMethod.Pix => throw new InvalidOperationException("PIX payments should use GetPixProvider()"),
            PaymentMethod.Boleto => throw new InvalidOperationException("Boleto payments should use GetBoletoProvider()"),
            _ => throw new ArgumentException($"Unsupported payment method: {method}", nameof(method))
        };
    }

    public IPixProvider GetPixProvider()
    {
        var provider = _serviceProvider.GetService(typeof(GerencianetAdapter));
        if (provider is not IPixProvider pixProvider)
        {
            throw new InvalidOperationException("PIX provider not configured");
        }

        return pixProvider;
    }

    public IBoletoProvider GetBoletoProvider()
    {
        var provider = _serviceProvider.GetService(typeof(GerencianetAdapter));
        if (provider is not IBoletoProvider boletoProvider)
        {
            throw new InvalidOperationException("Boleto provider not configured");
        }

        return boletoProvider;
    }

    public ISubscriptionProvider GetSubscriptionProvider()
    {
        var provider = _serviceProvider.GetService(typeof(PagarMeAdapter));
        if (provider is not ISubscriptionProvider subscriptionProvider)
        {
            throw new InvalidOperationException("Subscription provider not configured");
        }

        return subscriptionProvider;
    }
}
