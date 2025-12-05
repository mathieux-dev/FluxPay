using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FluxPay.Infrastructure.Data;
using FluxPay.Infrastructure.Redis;
using StackExchange.Redis;

namespace FluxPay.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly FluxPayDbContext _dbContext;
    private readonly RedisConnectionFactory _redisFactory;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public HealthController(
        FluxPayDbContext dbContext,
        RedisConnectionFactory redisFactory,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _redisFactory = redisFactory;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var databaseCheck = await CheckDatabaseAsync();
        var redisCheck = await CheckRedisAsync();
        var pagarmeCheck = await CheckProviderAsync("PagarMe");
        var gerencianetCheck = await CheckProviderAsync("Gerencianet");

        var health = new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            checks = new
            {
                database = databaseCheck,
                redis = redisCheck,
                providers = new
                {
                    pagarme = pagarmeCheck,
                    gerencianet = gerencianetCheck
                }
            }
        };

        var allHealthy = databaseCheck.Healthy &&
                        redisCheck.Healthy &&
                        pagarmeCheck.Healthy &&
                        gerencianetCheck.Healthy;

        if (!allHealthy)
        {
            return StatusCode(503, health);
        }

        return Ok(health);
    }

    private async Task<HealthCheckResult> CheckDatabaseAsync()
    {
        try
        {
            await _dbContext.Database.ExecuteSqlRawAsync("SELECT 1");
            return new HealthCheckResult { Healthy = true, Message = "Connected" };
        }
        catch (Exception ex)
        {
            return new HealthCheckResult { Healthy = false, Message = ex.Message };
        }
    }

    private async Task<HealthCheckResult> CheckRedisAsync()
    {
        try
        {
            var db = _redisFactory.GetDatabase();
            var key = $"health:check:{Guid.NewGuid()}";
            await db.StringSetAsync(key, "test", TimeSpan.FromSeconds(5));
            var value = await db.StringGetAsync(key);
            await db.KeyDeleteAsync(key);
            
            if (value == "test")
            {
                return new HealthCheckResult { Healthy = true, Message = "Connected" };
            }
            
            return new HealthCheckResult { Healthy = false, Message = "Redis read/write failed" };
        }
        catch (Exception ex)
        {
            return new HealthCheckResult { Healthy = false, Message = ex.Message };
        }
    }

    private async Task<HealthCheckResult> CheckProviderAsync(string providerName)
    {
        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(5);

            if (providerName == "PagarMe")
            {
                var apiKey = _configuration["Providers:PagarMe:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                {
                    return new HealthCheckResult { Healthy = false, Message = "API key not configured" };
                }

                var isSandbox = _configuration.GetValue<bool>("Providers:PagarMe:Sandbox");
                var baseUrl = isSandbox ? "https://api.pagar.me/core/v5" : "https://api.pagar.me/core/v5";
                
                var response = await httpClient.GetAsync($"{baseUrl}/orders?page=1&size=1");
                
                if (response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    return new HealthCheckResult { Healthy = true, Message = "Reachable" };
                }
                
                return new HealthCheckResult { Healthy = false, Message = $"Status: {response.StatusCode}" };
            }
            else if (providerName == "Gerencianet")
            {
                var clientId = _configuration["Providers:Gerencianet:ClientId"];
                if (string.IsNullOrEmpty(clientId))
                {
                    return new HealthCheckResult { Healthy = false, Message = "Client ID not configured" };
                }

                var isSandbox = _configuration.GetValue<bool>("Providers:Gerencianet:Sandbox");
                var baseUrl = isSandbox ? "https://api-pix-h.gerencianet.com.br" : "https://api-pix.gerencianet.com.br";
                
                var response = await httpClient.GetAsync($"{baseUrl}/v2/health");
                
                if (response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return new HealthCheckResult { Healthy = true, Message = "Reachable" };
                }
                
                return new HealthCheckResult { Healthy = false, Message = $"Status: {response.StatusCode}" };
            }

            return new HealthCheckResult { Healthy = false, Message = "Unknown provider" };
        }
        catch (Exception ex)
        {
            return new HealthCheckResult { Healthy = false, Message = ex.Message };
        }
    }

    private class HealthCheckResult
    {
        public bool Healthy { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
