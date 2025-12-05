using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FluxPay.Core.Providers;
using Microsoft.Extensions.Configuration;

namespace FluxPay.Infrastructure.Providers;

public class GerencianetAdapter : IPixProvider, IBoletoProvider
{
    private readonly HttpClient _httpClient;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly string _webhookSecret;
    private readonly bool _isSandbox;
    private string? _accessToken;
    private DateTime _tokenExpiry;

    public string ProviderName => "gerencianet";

    public GerencianetAdapter(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _clientId = configuration["Providers:Gerencianet:ClientId"] ?? throw new InvalidOperationException("Gerencianet client ID not configured");
        _clientSecret = configuration["Providers:Gerencianet:ClientSecret"] ?? throw new InvalidOperationException("Gerencianet client secret not configured");
        _webhookSecret = configuration["Providers:Gerencianet:WebhookSecret"] ?? string.Empty;
        _isSandbox = configuration.GetValue<bool>("Providers:Gerencianet:Sandbox");
        
        var baseUrl = _isSandbox ? "https://api-pix-h.gerencianet.com.br" : "https://api-pix.gerencianet.com.br";
        _httpClient.BaseAddress = new Uri(baseUrl);
    }

    public async Task<PixResult> CreatePixPaymentAsync(PixRequest request)
    {
        await EnsureAuthenticatedAsync();

        var txid = Guid.NewGuid().ToString("N");
        var payload = new
        {
            calendario = new
            {
                expiracao = request.ExpirationMinutes * 60
            },
            devedor = new
            {
                cpf = request.CustomerDocument.Length == 11 ? request.CustomerDocument : null,
                cnpj = request.CustomerDocument.Length == 14 ? request.CustomerDocument : null,
                nome = request.CustomerName
            },
            valor = new
            {
                original = (request.AmountCents / 100.0m).ToString("F2")
            },
            chave = _clientId,
            solicitacaoPagador = "Pagamento via FluxPay",
            infoAdicionais = request.Metadata?.Select(kvp => new { nome = kvp.Key, valor = kvp.Value }).ToArray()
        };

        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _accessToken);
            var response = await _httpClient.PutAsJsonAsync($"/v2/cob/{txid}", payload);
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                var errorData = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
                return new PixResult
                {
                    Success = false,
                    ErrorCode = errorData?.GetValueOrDefault("codigo")?.ToString(),
                    ErrorMessage = errorData?.GetValueOrDefault("mensagem")?.ToString(),
                    RawResponse = errorData
                };
            }

            var data = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
            var location = data?.GetValueOrDefault("location")?.ToString();
            var locId = data?.GetValueOrDefault("loc")?.ToString();
            
            var qrCodeResponse = await _httpClient.GetAsync($"/v2/loc/{locId}/qrcode");
            var qrCodeContent = await qrCodeResponse.Content.ReadAsStringAsync();
            var qrCodeData = JsonSerializer.Deserialize<Dictionary<string, object>>(qrCodeContent);

            var calendario = data != null 
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(data["calendario"]?.ToString() ?? "{}")
                : null;
            var criacao = calendario?.GetValueOrDefault("criacao")?.ToString();
            var expiracao = calendario?.GetValueOrDefault("expiracao")?.ToString();
            
            return new PixResult
            {
                Success = true,
                ProviderPaymentId = txid,
                QrCode = qrCodeData?.GetValueOrDefault("qrcode")?.ToString(),
                QrCodeUrl = qrCodeData?.GetValueOrDefault("imagemQrcode")?.ToString(),
                ExpiresAt = !string.IsNullOrEmpty(criacao) && !string.IsNullOrEmpty(expiracao)
                    ? DateTime.Parse(criacao).AddSeconds(int.Parse(expiracao))
                    : DateTime.UtcNow.AddMinutes(request.ExpirationMinutes),
                RawResponse = data
            };
        }
        catch (Exception ex)
        {
            return new PixResult
            {
                Success = false,
                ErrorCode = "provider_error",
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<BoletoResult> CreateBoletoPaymentAsync(BoletoRequest request)
    {
        await EnsureAuthenticatedAsync();

        var payload = new
        {
            items = new[]
            {
                new
                {
                    name = "Pagamento",
                    amount = 1,
                    value = request.AmountCents
                }
            },
            customer = new
            {
                name = request.CustomerName,
                email = request.CustomerEmail,
                cpf = request.CustomerDocument.Length == 11 ? request.CustomerDocument : null,
                cnpj = request.CustomerDocument.Length == 14 ? request.CustomerDocument : null,
                birth = "1990-01-01"
            },
            banking_billet = new
            {
                expire_at = request.ExpiresAt.ToString("yyyy-MM-dd"),
                customer = new
                {
                    name = request.CustomerName,
                    email = request.CustomerEmail,
                    cpf = request.CustomerDocument.Length == 11 ? request.CustomerDocument : null,
                    cnpj = request.CustomerDocument.Length == 14 ? request.CustomerDocument : null,
                    birth = "1990-01-01"
                }
            },
            metadata = request.Metadata ?? new Dictionary<string, string>()
        };

        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _accessToken);
            var response = await _httpClient.PostAsJsonAsync("/v1/charge", payload);
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                var errorData = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
                return new BoletoResult
                {
                    Success = false,
                    ErrorCode = errorData?.GetValueOrDefault("code")?.ToString(),
                    ErrorMessage = errorData?.GetValueOrDefault("error_description")?.ToString(),
                    RawResponse = errorData
                };
            }

            var data = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
            var chargeData = data != null 
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(data["data"]?.ToString() ?? "{}")
                : null;
            var billet = chargeData != null
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(chargeData["banking_billet"]?.ToString() ?? "{}")
                : null;

            return new BoletoResult
            {
                Success = true,
                ProviderPaymentId = chargeData?.GetValueOrDefault("charge_id")?.ToString(),
                Barcode = billet?.GetValueOrDefault("barcode")?.ToString(),
                DigitableLine = billet?.GetValueOrDefault("line")?.ToString(),
                PdfUrl = billet?.GetValueOrDefault("pdf")?.ToString(),
                ExpiresAt = request.ExpiresAt,
                RawResponse = data
            };
        }
        catch (Exception ex)
        {
            return new BoletoResult
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

    private async Task EnsureAuthenticatedAsync()
    {
        if (!string.IsNullOrEmpty(_accessToken) && DateTime.UtcNow < _tokenExpiry)
        {
            return;
        }

        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_clientId}:{_clientSecret}"));
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credentials);

        var payload = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("grant_type", "client_credentials")
        });

        var response = await _httpClient.PostAsync("/oauth/token", payload);
        var content = await response.Content.ReadAsStringAsync();
        
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Failed to authenticate with Gerencianet: {content}");
        }

        var data = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
        _accessToken = data?.GetValueOrDefault("access_token")?.ToString();
        var expiresIn = data?.GetValueOrDefault("expires_in")?.ToString();
        _tokenExpiry = DateTime.UtcNow.AddSeconds(int.Parse(expiresIn ?? "3600") - 60);
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
        await EnsureAuthenticatedAsync();
        
        var startDate = date.Date;
        var endDate = startDate.AddDays(1);
        
        var queryParams = $"?inicio={startDate:yyyy-MM-ddT00:00:00Z}&fim={endDate:yyyy-MM-ddT00:00:00Z}";
        
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _accessToken);
            var response = await _httpClient.GetAsync($"/v2/cob{queryParams}");
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                return new List<ProviderTransactionReport>();
            }

            var data = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
            var cobsArray = data?.GetValueOrDefault("cobs")?.ToString();
            var cobs = cobsArray != null 
                ? JsonSerializer.Deserialize<List<Dictionary<string, object>>>(cobsArray)
                : new List<Dictionary<string, object>>();

            var reports = new List<ProviderTransactionReport>();
            
            if (cobs != null)
            {
                foreach (var cob in cobs)
                {
                    var txid = cob.GetValueOrDefault("txid")?.ToString();
                    var status = cob.GetValueOrDefault("status")?.ToString();
                    
                    var valorObj = cob.GetValueOrDefault("valor")?.ToString();
                    var valor = valorObj != null 
                        ? JsonSerializer.Deserialize<Dictionary<string, object>>(valorObj)
                        : null;
                    
                    var originalStr = valor?.GetValueOrDefault("original")?.ToString();
                    var amountCents = !string.IsNullOrEmpty(originalStr)
                        ? (long)(decimal.Parse(originalStr) * 100)
                        : 0;

                    var calendarioObj = cob.GetValueOrDefault("calendario")?.ToString();
                    var calendario = calendarioObj != null
                        ? JsonSerializer.Deserialize<Dictionary<string, object>>(calendarioObj)
                        : null;
                    
                    var criacaoStr = calendario?.GetValueOrDefault("criacao")?.ToString();
                    var criacao = !string.IsNullOrEmpty(criacaoStr)
                        ? DateTime.Parse(criacaoStr)
                        : DateTime.UtcNow;

                    reports.Add(new ProviderTransactionReport
                    {
                        ProviderPaymentId = txid ?? string.Empty,
                        Status = status ?? "unknown",
                        AmountCents = amountCents,
                        TransactionDate = criacao,
                        RawData = cob
                    });
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
