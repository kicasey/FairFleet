using FairFleetAPI.Models;

namespace FairFleetAPI.Services.Notifications;

public interface INotificationSender
{
    Task SendAsync(User user, SavedFlight savedFlight, string channel, string type, string message, CancellationToken cancellationToken);
    Task SendWelcomeAsync(User user, CancellationToken cancellationToken);
}
