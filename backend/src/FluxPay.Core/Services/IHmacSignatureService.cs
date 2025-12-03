namespace FluxPay.Core.Services;

public interface IHmacSignatureService
{
    string ComputeSignature(string secret, string message);
    bool VerifySignature(string secret, string message, string signature);
}
