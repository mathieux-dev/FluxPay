using Serilog.Core;
using Serilog.Events;
using System.Text.RegularExpressions;

namespace FluxPay.Api.Logging;

public class SensitiveDataMaskingEnricher : ILogEventEnricher
{
    private static readonly Regex PanPattern = new(@"\b\d{13,19}\b", RegexOptions.Compiled);
    private static readonly Regex CvvPattern = new(@"\b\d{3,4}\b", RegexOptions.Compiled);
    private static readonly Regex EmailPattern = new(@"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", RegexOptions.Compiled);
    private static readonly Regex ApiKeyPattern = new(@"(api[_-]?key|secret|password|token)[\s:=]+[^\s,}]+", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        if (logEvent.Exception != null)
        {
            var maskedMessage = MaskSensitiveData(logEvent.Exception.Message);
            if (maskedMessage != logEvent.Exception.Message)
            {
                var maskedProperty = propertyFactory.CreateProperty("MaskedExceptionMessage", maskedMessage);
                logEvent.AddPropertyIfAbsent(maskedProperty);
            }
        }

        foreach (var property in logEvent.Properties)
        {
            if (property.Value is ScalarValue scalarValue && scalarValue.Value is string stringValue)
            {
                var maskedValue = MaskSensitiveData(stringValue);
                if (maskedValue != stringValue)
                {
                    logEvent.AddOrUpdateProperty(propertyFactory.CreateProperty(property.Key, maskedValue));
                }
            }
        }
    }

    private static string MaskSensitiveData(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;

        var masked = PanPattern.Replace(input, "****-****-****-****");
        masked = CvvPattern.Replace(masked, "***");
        masked = EmailPattern.Replace(masked, m => MaskEmail(m.Value));
        masked = ApiKeyPattern.Replace(masked, m => $"{m.Groups[1].Value}=***MASKED***");

        return masked;
    }

    private static string MaskEmail(string email)
    {
        var parts = email.Split('@');
        if (parts.Length != 2)
            return email;

        var localPart = parts[0];
        var maskedLocal = localPart.Length > 2
            ? $"{localPart[0]}***{localPart[^1]}"
            : "***";

        return $"{maskedLocal}@{parts[1]}";
    }
}
