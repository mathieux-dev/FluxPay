namespace FluxPay.Core.Configuration;

public class OpenTelemetrySettings
{
    public string ServiceName { get; set; } = "FluxPay";
    public string ServiceVersion { get; set; } = "1.0.0";
    public string OtlpEndpoint { get; set; } = string.Empty;
    public string OtlpHeaders { get; set; } = string.Empty;
}
