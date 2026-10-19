using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Veykivo.Application.Abstractions;

namespace Veykivo.Infrastructure.Email;

public sealed class SmtpOptions
{
    public string? Host { get; set; }
    public int Port { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string From { get; set; } = "no-reply@veykivo.com";
}

/// <summary>SMTP ayarı yoksa e-posta gönderilmez, yalnızca bilgi logu düşülür (yerel geliştirme).</summary>
public sealed class SmtpEmailSender(IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    public async Task SendAsync(string to, string subject, string textBody, CancellationToken ct)
    {
        var o = options.Value;
        if (string.IsNullOrWhiteSpace(o.Host))
        {
            logger.LogInformation("SMTP yapılandırılmamış; '{Subject}' bildirimi gönderilmedi.", subject);
            return;
        }

        using var client = new SmtpClient(o.Host, o.Port) { EnableSsl = o.EnableSsl };
        if (!string.IsNullOrEmpty(o.Username))
            client.Credentials = new NetworkCredential(o.Username, o.Password);

        using var message = new MailMessage(o.From, to, subject, textBody);
        await client.SendMailAsync(message, ct);
    }
}
