using FairFleetAPI.Data;
using FairFleetAPI.Models;

namespace FairFleetAPI.Services.Notifications;

public class NotificationSender : INotificationSender
{
    private readonly AppDbContext _db;
    private readonly ILogger<NotificationSender> _logger;

    public NotificationSender(AppDbContext db, ILogger<NotificationSender> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task SendAsync(User user, SavedFlight savedFlight, string channel, string type, string message, CancellationToken cancellationToken)
    {
        // Current implementation logs notifications in DB and app logs.
        // Delivery providers (email/SMS gateways) can be swapped in behind this interface.
        _logger.LogInformation("Notification {Channel} {Type} for saved flight {SavedFlightId}: {Message}", channel, type, savedFlight.Id, message);

        _db.NotificationLogs.Add(new NotificationLog
        {
            UserId = user.Id,
            SavedFlightId = savedFlight.Id,
            Channel = channel,
            Type = type,
            Message = message,
            SentAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(cancellationToken);
    }
}
