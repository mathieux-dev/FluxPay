using System.Net;

namespace FluxPay.Api.Middleware;

public class IpAllowlistMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<IpAllowlistMiddleware> _logger;
    private readonly HashSet<string> _allowedIps;
    private readonly List<(IPAddress network, int prefixLength)> _allowedNetworks;

    public IpAllowlistMiddleware(
        RequestDelegate next,
        ILogger<IpAllowlistMiddleware> logger,
        IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _allowedIps = new HashSet<string>();
        _allowedNetworks = new List<(IPAddress, int)>();

        var allowlistConfig = configuration["ADMIN_IP_ALLOWLIST"] ?? string.Empty;
        
        if (!string.IsNullOrWhiteSpace(allowlistConfig))
        {
            var entries = allowlistConfig.Split(',', StringSplitOptions.RemoveEmptyEntries);
            
            foreach (var entry in entries)
            {
                var trimmedEntry = entry.Trim();
                
                if (trimmedEntry.Contains('/'))
                {
                    var parts = trimmedEntry.Split('/');
                    if (parts.Length == 2 && 
                        IPAddress.TryParse(parts[0], out var network) && 
                        int.TryParse(parts[1], out var prefixLength))
                    {
                        _allowedNetworks.Add((network, prefixLength));
                    }
                }
                else if (IPAddress.TryParse(trimmedEntry, out _))
                {
                    _allowedIps.Add(trimmedEntry);
                }
            }
        }
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var remoteIp = context.Connection.RemoteIpAddress;

        if (remoteIp == null)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = "IP_NOT_ALLOWED",
                    message = "Unable to determine client IP address"
                }
            });
            return;
        }

        var remoteIpString = remoteIp.ToString();

        if (IPAddress.IsLoopback(remoteIp))
        {
            await _next(context);
            return;
        }

        if (_allowedIps.Count == 0 && _allowedNetworks.Count == 0)
        {
            await _next(context);
            return;
        }

        if (_allowedIps.Contains(remoteIpString))
        {
            await _next(context);
            return;
        }

        foreach (var (network, prefixLength) in _allowedNetworks)
        {
            if (IsInSubnet(remoteIp, network, prefixLength))
            {
                await _next(context);
                return;
            }
        }

        _logger.LogWarning("IP address {RemoteIp} not in allowlist for admin endpoint {Path}", 
            remoteIpString, context.Request.Path);

        context.Response.StatusCode = 403;
        await context.Response.WriteAsJsonAsync(new
        {
            error = new
            {
                code = "IP_NOT_ALLOWED",
                message = "IP address not allowed to access admin endpoints"
            }
        });
    }

    private static bool IsInSubnet(IPAddress address, IPAddress network, int prefixLength)
    {
        var addressBytes = address.GetAddressBytes();
        var networkBytes = network.GetAddressBytes();

        if (addressBytes.Length != networkBytes.Length)
        {
            return false;
        }

        var bytesToCheck = prefixLength / 8;
        var bitsToCheck = prefixLength % 8;

        for (int i = 0; i < bytesToCheck; i++)
        {
            if (addressBytes[i] != networkBytes[i])
            {
                return false;
            }
        }

        if (bitsToCheck > 0)
        {
            var mask = (byte)(0xFF << (8 - bitsToCheck));
            if ((addressBytes[bytesToCheck] & mask) != (networkBytes[bytesToCheck] & mask))
            {
                return false;
            }
        }

        return true;
    }
}
