namespace FluxPay.Core.Services;

public interface IRateLimiter
{
    Task<RateLimitResult> CheckRateLimitAsync(string key, int limit, TimeSpan window);
}

public class RateLimitResult
{
    public bool IsAllowed { get; set; }
    public int RemainingRequests { get; set; }
    public DateTime ResetTime { get; set; }
}
