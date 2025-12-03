using FluxPay.Core.Services;
using FluxPay.Infrastructure.Redis;
using StackExchange.Redis;

namespace FluxPay.Infrastructure.Services;

public class RateLimiter : IRateLimiter
{
    private readonly RedisConnectionFactory _redisFactory;

    public RateLimiter(RedisConnectionFactory redisFactory)
    {
        _redisFactory = redisFactory;
    }

    public async Task<RateLimitResult> CheckRateLimitAsync(string key, int limit, TimeSpan window)
    {
        var db = _redisFactory.GetDatabase();
        var redisKey = $"ratelimit:{key}";
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var windowStart = now - (long)window.TotalMilliseconds;

        var transaction = db.CreateTransaction();
        
        var removeOldTask = transaction.SortedSetRemoveRangeByScoreAsync(redisKey, 0, windowStart);
        var addCurrentTask = transaction.SortedSetAddAsync(redisKey, now.ToString(), now);
        var countTask = transaction.SortedSetLengthAsync(redisKey);
        var expireTask = transaction.KeyExpireAsync(redisKey, window);

        await transaction.ExecuteAsync();

        await removeOldTask;
        await addCurrentTask;
        var count = await countTask;
        await expireTask;

        var isAllowed = count <= limit;
        var remainingRequests = Math.Max(0, limit - (int)count + (isAllowed ? 0 : 1));
        var resetTime = DateTime.UtcNow.Add(window);

        return new RateLimitResult
        {
            IsAllowed = isAllowed,
            RemainingRequests = remainingRequests,
            ResetTime = resetTime
        };
    }
}
