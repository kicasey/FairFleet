using FairFleetAPI.Data;
using FairFleetAPI.Models;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace FairFleetAPI.Services.Notifications;

public class NotificationSender : INotificationSender
{
    private readonly AppDbContext _db;
    private readonly ILogger<NotificationSender> _logger;
    private readonly IConfiguration _config;

    public NotificationSender(AppDbContext db, ILogger<NotificationSender> logger, IConfiguration config)
    {
        _db = db;
        _logger = logger;
        _config = config;
    }

    public async Task SendAsync(User user, SavedFlight savedFlight, string channel, string type, string message, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Notification {Channel} {Type} for saved flight {SavedFlightId}: {Message}", channel, type, savedFlight.Id, message);

        var status = "logged";

        if (string.Equals(channel, "email", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(user.Email))
        {
            status = await TrySendEmailAsync(user.Email!, savedFlight, type, message, cancellationToken);
        }

        _db.NotificationLogs.Add(new NotificationLog
        {
            UserId = user.Id,
            SavedFlightId = savedFlight.Id,
            Channel = channel,
            Type = type,
            Message = $"[{status}] {message}",
            SentAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task<string> TrySendEmailAsync(string toEmail, SavedFlight savedFlight, string type, string message, CancellationToken cancellationToken)
    {
        var apiKey = _config["SendGrid:ApiKey"] ?? Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
        var fromEmail = _config["SendGrid:FromEmail"] ?? Environment.GetEnvironmentVariable("SENDGRID_FROM_EMAIL");

        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(fromEmail))
        {
            _logger.LogWarning("SendGrid not configured; skipping email delivery for saved flight {SavedFlightId}", savedFlight.Id);
            return "skipped-no-config";
        }

        try
        {
            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(fromEmail, "FairFleet Alerts");
            var to = new EmailAddress(toEmail);
            var subject = $"FairFleet price alert: {savedFlight.Route}";
            var plainBody = BuildPlainBody(savedFlight, message);
            var htmlBody = BuildHtmlBody(savedFlight, message);
            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainBody, htmlBody);
            var response = await client.SendEmailAsync(msg, cancellationToken);

            if ((int)response.StatusCode >= 200 && (int)response.StatusCode < 300)
            {
                _logger.LogInformation("SendGrid accepted email for saved flight {SavedFlightId} ({Status})", savedFlight.Id, (int)response.StatusCode);
                return "sent";
            }

            var errorBody = await response.Body.ReadAsStringAsync(cancellationToken);
            _logger.LogError("SendGrid rejected email for saved flight {SavedFlightId}: {Status} {Body}", savedFlight.Id, (int)response.StatusCode, errorBody);
            return $"failed-{(int)response.StatusCode}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SendGrid send threw for saved flight {SavedFlightId}", savedFlight.Id);
            return "failed-exception";
        }
    }

    private static string BuildPlainBody(SavedFlight savedFlight, string message)
    {
        return $"{message}\n\nRoute: {savedFlight.Route}\nAirline: {savedFlight.AirlineName}\nDeparture: {savedFlight.DepartureDate:yyyy-MM-dd}\nLast saved price: ${savedFlight.TotalPrice:0.00}\n\nOpen FairFleet to review the full alert.";
    }

    private static string BuildHtmlBody(SavedFlight savedFlight, string message)
    {
        return $"<p>{System.Net.WebUtility.HtmlEncode(message)}</p>" +
               $"<p><strong>Route:</strong> {System.Net.WebUtility.HtmlEncode(savedFlight.Route)}<br/>" +
               $"<strong>Airline:</strong> {System.Net.WebUtility.HtmlEncode(savedFlight.AirlineName)}<br/>" +
               $"<strong>Departure:</strong> {savedFlight.DepartureDate:yyyy-MM-dd}<br/>" +
               $"<strong>Last saved price:</strong> ${savedFlight.TotalPrice:0.00}</p>" +
               "<p>Open FairFleet to review the full alert.</p>";
    }
}
