using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FluxPay.Core.Providers;
using Microsoft.Extensions.Configuration;

namespace FluxPay.Infrastructure.Providers;

public class PagarMeAdapter : IProviderAdapter, ISubscriptionProvider
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _webhookSecret;
    private readonly bool _isSandbox;

    public string ProviderName => "pagarme";
    public bool IsSandbox => _isSandbox;

    public PagarMeAdapter(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Providers:PagarMe:ApiKey"] ?? throw new InvalidOperationException("PagarMe API key not configured");
        _webhookSecret = configuration["Providers:PagarMe:WebhookSecret"] ?? string.Empty;
        _isSandbox = configuration.GetValue<bool>("Providers:PagarMe:Sandbox");
        
        var baseUrl = _isSandbox ? "https://api.pagar.me/sandbox/v5" : "https://api.pagar.me/core/v5";
        _httpClient.BaseAddress = new Uri(baseUrl);
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Basic {Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_apiKey}:"))}");
    }

    public async Task<AuthorizationResult> AuthorizeAsync(AuthorizationRequest request)
    {
        var payload = new
        {
            amount = request.AmountCents,
            payment_method = "credit_card",
            credit_card = new
            {
                card_token = request.CardToken,
                capture = request.Capture
            },
            customer = new
            {
                name = request.CustomerName,
                email = request.CustomerEmail,
                document = request.CustomerDocument,
                type = request.CustomerDocument.Length == 11 ? "individual" : "company"
            },
            metadata = request.Metadata ?? new Dictionary<string, string>()
        };

        try
        {
            var response = await _httpClient.PostAsJsonAsync("/orders", payload);
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                var errorData = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
                return new AuthorizationResult
                {
                    Success = false,
                    ErrorCode = errorData?.GetValueOrDefault("code")?.ToString(),
                    ErrorMessage = errorData?.GetValueOrDefault("message")?.ToString(),
                    RawResponse = errorData
                };
            }

            var data = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
            var charges = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(data?["charges"]?.ToString() ?? "[]");
            var charge = charges?.FirstOrDefault();
            var lastTransaction = charge != null 
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(charge["last_transaction"]?.ToString() ?? "{}")
                : null;
            var card = lastTransaction != null
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(lastTransaction["card"]?.ToString() ?? "{}")
                : null;

            return new AuthorizationResult
            {
                Success = true,
                ProviderTransactionId = lastTransaction?.GetValueOrDefault("id")?.ToString(),
                ProviderPaymentId = data?.GetValueOrDefault("id")?.ToString(),
                Status = charge?.GetValueOrDefault("status")?.ToString() ?? "pending",
                CardLastFourDigits = card?.GetValueOrDefault("last_four_digits")?.ToString(),
                CardBrand = card?.GetValueOrDefault("brand")?.ToString(),
                RawResponse = data
            };
        }
        catch (Exception ex)
        {
            return new AuthorizationResult
            {
                Success = false,
                ErrorCode = "provider_error",
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<CaptureResult> CaptureAsync(string providerTransactionId, long amountCents)
    {
        var payload = new
        {
            amount = amountCents
        };

        try
        {
            var response = await _httpClient.PostAsJsonAsync($"/charges/{providerTransactionId}/capture", payload);
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                var errorData = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
                return new CaptureResult
                {
                    Success = false,
                    ErrorCode = errorData?.GetValueOrDefault("code")?.ToString(),
                    ErrorMessage = errorData?.GetValueOrDefault("message")?.ToString(),
                    RawResponse = errorData
                };
            }

            var data = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
            
            return new CaptureResult
            {
                Success = true,
                ProviderTransactionId = data?.GetValueOrDefault("id")?.ToString(),
                Status = data?.GetValueOrDefault("status")?.ToString() ?? "captured",
                CapturedAmountCents = amountCents,
                RawResponse = data
            };
        }
        catch (Exception ex)
        {
            return new CaptureResult
            {
                Success = false,
                ErrorCode = "provider_error",
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<RefundResult> RefundAsync(string providerTransactionId, long amountCents)
    {
        var payload = new
        {
            amount = amountCents
        };

        try
        {
            var response = await _httpClient.PostAsJsonAsync($"/charges/{providerTransactionId}/refund", payload);
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                var errorData = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
                return new RefundResult
                {
                    Success = false,
                    ErrorCode = errorData?.GetValueOrDefault("code")?.ToString(),
                    ErrorMessage = errorData?.GetValueOrDefault("message")?.ToString(),
                    RawResponse = errorData
                };
            }

            var data = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
            
            return new RefundResult
            {
                Success = true,
                ProviderRefundId = data?.GetValueOrDefault("id")?.ToString(),
                ProviderTransactionId = providerTransactionId,
                Status = data?.GetValueOrDefault("status")?.ToString() ?? "refunded",
                RefundedAmountCents = amountCents,
                RawResponse = data
            };
        }
        catch (Exception ex)
        {
            return new RefundResult
            {
                Success = false,
                ErrorCode = "provider_error",
                ErrorMessage = ex.Message
            };
        }
    }

    public Task<bool> ValidateWebhookSignatureAsync(string signature, string payload, long timestamp)
    {
        if (string.IsNullOrEmpty(_webhookSecret))
        {
            return Task.FromResult(false);
        }

        var message = $"{timestamp}.{payload}";
        var expectedSignature = ComputeHmacSha256(message, _webhookSecret);
        
        return Task.FromResult(ConstantTimeEquals(signature, expectedSignature));
    }

    public async Task<SubscriptionResult> CreateSubscriptionAsync(SubscriptionRequest request)
    {
        var payload = new
        {
            plan = new
            {
                name = "Subscription Plan",
                amount = request.AmountCents,
                interval = request.Interval,
                interval_count = 1,
                billing_type = "prepaid"
            },
            customer = new
            {
                name = request.CustomerName,
                email = request.CustomerEmail,
                document = request.CustomerDocument,
                type = request.CustomerDocument.Length == 11 ? "individual" : "company"
            },
            payment_method = "credit_card",
            credit_card = new
            {
                card_token = request.CardToken
            },
            metadata = request.Metadata ?? new Dictionary<string, string>()
        };

        try
        {
            var response = await _httpClient.PostAsJsonAsync("/subscriptions", payload);
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                var errorData = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
                return new SubscriptionResult
                {
                    Success = false,
                    ErrorCode = errorData?.GetValueOrDefault("code")?.ToString(),
                    ErrorMessage = errorData?.GetValueOrDefault("message")?.ToString(),
                    RawResponse = errorData
                };
            }

            var data = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
            var nextBillingAt = data?.GetValueOrDefault("next_billing_at")?.ToString();
            
            return new SubscriptionResult
            {
                Success = true,
                ProviderSubscriptionId = data?.GetValueOrDefault("id")?.ToString(),
                Status = data?.GetValueOrDefault("status")?.ToString() ?? "active",
                NextBillingDate = !string.IsNullOrEmpty(nextBillingAt) ? DateTime.Parse(nextBillingAt) : null,
                RawResponse = data
            };
        }
        catch (Exception ex)
        {
            return new SubscriptionResult
            {
                Success = false,
                ErrorCode = "provider_error",
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<SubscriptionCancellationResult> CancelSubscriptionAsync(string providerSubscriptionId)
    {
        try
        {
            var response = await _httpClient.DeleteAsync($"/subscriptions/{providerSubscriptionId}");
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                var errorData = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
                return new SubscriptionCancellationResult
                {
                    Success = false,
                    ErrorCode = errorData?.GetValueOrDefault("code")?.ToString(),
                    ErrorMessage = errorData?.GetValueOrDefault("message")?.ToString(),
                    RawResponse = errorData
                };
            }

            var data = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
            var canceledAt = data?.GetValueOrDefault("canceled_at")?.ToString();
            
            return new SubscriptionCancellationResult
            {
                Success = true,
                ProviderSubscriptionId = providerSubscriptionId,
                Status = "cancelled",
                CancelledAt = !string.IsNullOrEmpty(canceledAt) ? DateTime.Parse(canceledAt) : DateTime.UtcNow,
                RawResponse = data
            };
        }
        catch (Exception ex)
        {
            return new SubscriptionCancellationResult
            {
                Success = false,
                ErrorCode = "provider_error",
                ErrorMessage = ex.Message
            };
        }
    }

    private static string ComputeHmacSha256(string message, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var messageBytes = Encoding.UTF8.GetBytes(message);
        
        using var hmac = new HMACSHA256(keyBytes);
        var hashBytes = hmac.ComputeHash(messageBytes);
        return Convert.ToBase64String(hashBytes);
    }

    public async Task<List<ProviderTransactionReport>> GetTransactionReportAsync(DateTime date)
    {
        var startDate = date.Date;
        var endDate = startDate.AddDays(1);
        
        var queryParams = $"?created_since={startDate:yyyy-MM-ddTHH:mm:ssZ}&created_until={endDate:yyyy-MM-ddTHH:mm:ssZ}";
        
        try
        {
            var response = await _httpClient.GetAsync($"/orders{queryParams}");
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                return new List<ProviderTransactionReport>();
            }

            var data = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
            var ordersArray = data?.GetValueOrDefault("data")?.ToString();
            var orders = ordersArray != null 
                ? JsonSerializer.Deserialize<List<Dictionary<string, object>>>(ordersArray) 
                : new List<Dictionary<string, object>>();

            var reports = new List<ProviderTransactionReport>();
            
            if (orders != null)
            {
                foreach (var order in orders)
                {
                    var orderId = order.GetValueOrDefault("id")?.ToString();
                    var chargesArray = order.GetValueOrDefault("charges")?.ToString();
                    var charges = chargesArray != null 
                        ? JsonSerializer.Deserialize<List<Dictionary<string, object>>>(chargesArray)
                        : new List<Dictionary<string, object>>();

                    if (charges != null)
                    {
                        foreach (var charge in charges)
                        {
                            var lastTransactionObj = charge.GetValueOrDefault("last_transaction")?.ToString();
                            var lastTransaction = lastTransactionObj != null
                                ? JsonSerializer.Deserialize<Dictionary<string, object>>(lastTransactionObj)
                                : null;

                            var amountValue = charge.GetValueOrDefault("amount");
                            var amount = amountValue != null ? Convert.ToInt64(amountValue) : 0;

                            var createdAtStr = charge.GetValueOrDefault("created_at")?.ToString();
                            var createdAt = !string.IsNullOrEmpty(createdAtStr) 
                                ? DateTime.Parse(createdAtStr) 
                                : DateTime.UtcNow;

                            reports.Add(new ProviderTransactionReport
                            {
                                ProviderPaymentId = orderId ?? string.Empty,
                                Status = charge.GetValueOrDefault("status")?.ToString() ?? "unknown",
                                AmountCents = amount,
                                TransactionDate = createdAt,
                                RawData = order
                            });
                        }
                    }
                }
            }

            return reports;
        }
        catch (Exception)
        {
            return new List<ProviderTransactionReport>();
        }
    }

    private static bool ConstantTimeEquals(string a, string b)
    {
        if (a.Length != b.Length)
        {
            return false;
        }

        var result = 0;
        for (var i = 0; i < a.Length; i++)
        {
            result |= a[i] ^ b[i];
        }

        return result == 0;
    }
}
