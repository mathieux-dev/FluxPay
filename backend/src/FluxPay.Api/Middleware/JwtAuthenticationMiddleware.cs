using FluxPay.Core.Services;
using FluxPay.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FluxPay.Api.Middleware;

public class JwtAuthenticationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<JwtAuthenticationMiddleware> _logger;

    public JwtAuthenticationMiddleware(RequestDelegate next, ILogger<JwtAuthenticationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(
        HttpContext context,
        IJwtService jwtService,
        FluxPayDbContext dbContext)
    {
        var authHeader = context.Request.Headers["Authorization"].ToString();
        
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = "TOKEN_EXPIRED",
                    message = "Missing or invalid authorization header"
                }
            });
            return;
        }

        var token = authHeader.Substring("Bearer ".Length).Trim();
        
        var userId = await jwtService.ValidateAccessTokenAsync(token);
        
        if (userId == null)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = "TOKEN_EXPIRED",
                    message = "Access token has expired or is invalid"
                }
            });
            return;
        }

        var user = await dbContext.Users
            .Include(u => u.Merchant)
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = "TOKEN_EXPIRED",
                    message = "User not found"
                }
            });
            return;
        }

        context.Items["UserId"] = user.Id;
        context.Items["User"] = user;
        context.Items["IsAdmin"] = user.IsAdmin;
        
        if (user.MerchantId.HasValue)
        {
            context.Items["MerchantId"] = user.MerchantId.Value;
            context.Items["Merchant"] = user.Merchant;
        }

        await _next(context);
    }
}
