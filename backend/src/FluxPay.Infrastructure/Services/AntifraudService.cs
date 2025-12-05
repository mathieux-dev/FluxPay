using FluxPay.Core.Services;
using FluxPay.Infrastructure.Redis;
using StackExchange.Redis;

namespace FluxPay.Infrastructure.Services;

public class AntifraudService : IAntifraudService
{
    private readonly RedisConnectionFactory _redisFactory;
    private readonly IAuditService _auditService;
    private readonly IRateLimiter _rateLimiter;

    private const int IpVelocityLimit = 10;
    private static readonly TimeSpan IpVelocityWindow = TimeSpan.FromMinutes(1);
    private const int FailedAttemptsThreshold = 3;
    private static readonly TimeSpan FailedAttemptsWindow = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan IpBlockDuration = TimeSpan.FromHours(1);

    private static readonly HashSet<string> CpfBlacklist = new()
    {
        "00000000000",
        "11111111111",
        "22222222222",
        "33333333333",
        "44444444444",
        "55555555555",
        "66666666666",
        "77777777777",
        "88888888888",
        "99999999999"
    };

    private static readonly HashSet<string> BinBlacklist = new()
    {
        "000000",
        "111111",
        "999999"
    };

    public AntifraudService(
        RedisConnectionFactory redisFactory,
        IAuditService auditService,
        IRateLimiter rateLimiter)
    {
        _redisFactory = redisFactory;
        _auditService = auditService;
        _rateLimiter = rateLimiter;
    }

    public async Task<AntifraudResult> CheckPaymentAsync(string ipAddress, string? cpf, string? bin, long amountCents)
    {
        if (await IsIpBlockedAsync(ipAddress))
        {
            await LogAntifraudEventAsync(ipAddress, AntifraudRuleType.AdaptiveIpBlock, cpf, bin, amountCents);
            return new AntifraudResult
            {
                IsAllowed = false,
                RejectionReason = "IP address is temporarily blocked due to suspicious activity",
                TriggeredRule = AntifraudRuleType.AdaptiveIpBlock
            };
        }

        var velocityResult = await _rateLimiter.CheckRateLimitAsync($"ip:{ipAddress}", IpVelocityLimit, IpVelocityWindow);
        if (!velocityResult.IsAllowed)
        {
            await LogAntifraudEventAsync(ipAddress, AntifraudRuleType.IpVelocity, cpf, bin, amountCents);
            return new AntifraudResult
            {
                IsAllowed = false,
                RejectionReason = "IP address exceeded velocity limit",
                TriggeredRule = AntifraudRuleType.IpVelocity
            };
        }

        if (!string.IsNullOrEmpty(cpf) && CpfBlacklist.Contains(cpf))
        {
            await LogAntifraudEventAsync(ipAddress, AntifraudRuleType.CpfBlacklist, cpf, bin, amountCents);
            return new AntifraudResult
            {
                IsAllowed = false,
                RejectionReason = "CPF is on blacklist",
                TriggeredRule = AntifraudRuleType.CpfBlacklist
            };
        }

        if (!string.IsNullOrEmpty(bin) && BinBlacklist.Contains(bin))
        {
            await LogAntifraudEventAsync(ipAddress, AntifraudRuleType.BinBlacklist, cpf, bin, amountCents);
            return new AntifraudResult
            {
                IsAllowed = false,
                RejectionReason = "Card BIN is on blacklist",
                TriggeredRule = AntifraudRuleType.BinBlacklist
            };
        }

        return new AntifraudResult
        {
            IsAllowed = true
        };
    }

    public async Task RecordFailedAttemptAsync(string ipAddress)
    {
        var db = _redisFactory.GetDatabase();
        var key = $"antifraud:failed:{ipAddress}";
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var windowStart = now - (long)FailedAttemptsWindow.TotalMilliseconds;

        var transaction = db.CreateTransaction();
        
        var removeOldTask = transaction.SortedSetRemoveRangeByScoreAsync(key, 0, windowStart);
        var addCurrentTask = transaction.SortedSetAddAsync(key, now.ToString(), now);
        var countTask = transaction.SortedSetLengthAsync(key);
        var expireTask = transaction.KeyExpireAsync(key, FailedAttemptsWindow);

        await transaction.ExecuteAsync();

        await removeOldTask;
        await addCurrentTask;
        var count = await countTask;
        await expireTask;

        if (count >= FailedAttemptsThreshold)
        {
            await BlockIpAsync(ipAddress);
        }
    }

    public async Task<bool> IsIpBlockedAsync(string ipAddress)
    {
        var db = _redisFactory.GetDatabase();
        var key = $"antifraud:blocked:{ipAddress}";
        return await db.KeyExistsAsync(key);
    }

    private async Task BlockIpAsync(string ipAddress)
    {
        var db = _redisFactory.GetDatabase();
        var key = $"antifraud:blocked:{ipAddress}";
        await db.StringSetAsync(key, "1", IpBlockDuration);
        
        await LogAntifraudEventAsync(ipAddress, AntifraudRuleType.AdaptiveIpBlock, null, null, 0);
    }

    private async Task LogAntifraudEventAsync(
        string ipAddress,
        AntifraudRuleType rule,
        string? cpf,
        string? bin,
        long amountCents)
    {
        var changes = new
        {
            IpAddress = ipAddress,
            Rule = rule.ToString(),
            Cpf = cpf,
            Bin = bin,
            AmountCents = amountCents,
            Timestamp = DateTime.UtcNow
        };

        await _auditService.LogAsync(new AuditEntry
        {
            Actor = $"System:Antifraud",
            Action = "AntifraudRuleTriggered",
            ResourceType = "Payment",
            Changes = changes
        });
    }
}

