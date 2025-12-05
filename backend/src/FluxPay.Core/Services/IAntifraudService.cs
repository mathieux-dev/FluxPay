namespace FluxPay.Core.Services;

public interface IAntifraudService
{
    Task<AntifraudResult> CheckPaymentAsync(string ipAddress, string? cpf, string? bin, long amountCents);
    Task RecordFailedAttemptAsync(string ipAddress);
    Task<bool> IsIpBlockedAsync(string ipAddress);
}

public class AntifraudResult
{
    public bool IsAllowed { get; set; }
    public string? RejectionReason { get; set; }
    public AntifraudRuleType? TriggeredRule { get; set; }
}

public enum AntifraudRuleType
{
    IpVelocity,
    CpfBlacklist,
    BinBlacklist,
    AdaptiveIpBlock
}

