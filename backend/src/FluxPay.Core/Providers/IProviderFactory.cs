using FluxPay.Core.Entities;

namespace FluxPay.Core.Providers;

public interface IProviderFactory
{
    IProviderAdapter GetProvider(string providerName);
    IProviderAdapter GetProviderForPaymentMethod(PaymentMethod method);
    IPixProvider GetPixProvider();
    IBoletoProvider GetBoletoProvider();
    ISubscriptionProvider GetSubscriptionProvider();
}
