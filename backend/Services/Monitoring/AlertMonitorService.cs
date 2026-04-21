using System.Text.Json;
using FairFleetAPI.Data;
using FairFleetAPI.DTOs;
using FairFleetAPI.Models;
using FairFleetAPI.Services.FlightSearch;
using FairFleetAPI.Services.Notifications;
using Microsoft.EntityFrameworkCore;

namespace FairFleetAPI.Services.Monitoring;

public class AlertMonitorService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AlertMonitorService> _logger;

    public AlertMonitorService(IServiceScopeFactory scopeFactory, ILogger<AlertMonitorService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunAlertSweep(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                try
                {
                    _logger.LogError(ex, "Alert monitor sweep failed.");
                }
                catch
                {
                    // Do not let logger-provider shutdown errors crash the host.
                }
            }

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task RunAlertSweep(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var flightSearch = scope.ServiceProvider.GetRequiredService<IFlightSearchService>();
        var sender = scope.ServiceProvider.GetRequiredService<INotificationSender>();

        var tracked = await db.SavedFlights
            .Include(s => s.User)
            .Where(s => s.PriceAlertEnabled)
            .ToListAsync(cancellationToken);

        foreach (var saved in tracked)
        {
            if (!CanSendByFrequency(saved, db))
            {
                continue;
            }

            var routeParts = saved.Route.Split('→', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            if (routeParts.Length != 2)
            {
                continue;
            }

            var from = routeParts[0];
            var to = routeParts[1];
            var dto = new FlightSearchDto(from, to, saved.DepartureDate.ToString("yyyy-MM-dd"), null, 1, "economy");
            var latest = (await flightSearch.SearchAsync(dto, cancellationToken)).OrderBy(f => f.TotalPrice).FirstOrDefault();

            if (latest is null)
            {
                await DispatchChannels(sender, saved, "cancellation", $"Tracked flight {saved.Route} is unavailable right now (possible cancellation).", cancellationToken);
                continue;
            }

            await TrackPriceHistory(db, saved, latest.TotalPrice, cancellationToken);
            await CheckPriceAlerts(sender, saved, latest.TotalPrice, cancellationToken);
            await CheckScheduleChange(sender, saved, latest, cancellationToken);

            saved.TotalPrice = latest.TotalPrice;
            saved.FlightData = JsonSerializer.Serialize(latest);
            saved.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static bool CanSendByFrequency(SavedFlight saved, AppDbContext db)
    {
        var latest = db.NotificationLogs
            .Where(n => n.SavedFlightId == saved.Id)
            .OrderByDescending(n => n.SentAt)
            .FirstOrDefault();
        if (latest is null)
        {
            return true;
        }

        var elapsed = DateTime.UtcNow - latest.SentAt;
        return saved.AlertFrequency switch
        {
            "immediate" => elapsed >= TimeSpan.FromMinutes(1),
            "daily" => elapsed >= TimeSpan.FromDays(1),
            "weekly" => elapsed >= TimeSpan.FromDays(7),
            _ => elapsed >= TimeSpan.FromDays(1)
        };
    }

    private static async Task TrackPriceHistory(AppDbContext db, SavedFlight saved, decimal latestPrice, CancellationToken cancellationToken)
    {
        db.PriceHistories.Add(new PriceHistory
        {
            SavedFlightId = saved.Id,
            Price = latestPrice,
            RecordedAt = DateTime.UtcNow
        });

        var cutoff = DateTime.UtcNow.AddDays(-30);
        var oldPoints = await db.PriceHistories
            .Where(p => p.SavedFlightId == saved.Id && p.RecordedAt < cutoff)
            .ToListAsync(cancellationToken);
        if (oldPoints.Count > 0)
        {
            db.PriceHistories.RemoveRange(oldPoints);
        }
    }

    private static async Task CheckPriceAlerts(INotificationSender sender, SavedFlight saved, decimal latestPrice, CancellationToken cancellationToken)
    {
        if (saved.PriceDropThreshold.HasValue && latestPrice <= saved.PriceDropThreshold.Value)
        {
            await DispatchChannels(sender, saved, "price_drop", $"{saved.Route} dropped to ${latestPrice} (threshold ${saved.PriceDropThreshold.Value}).", cancellationToken);
        }
        if (saved.PriceRiseThreshold.HasValue && latestPrice >= saved.PriceRiseThreshold.Value)
        {
            await DispatchChannels(sender, saved, "price_rise", $"{saved.Route} rose to ${latestPrice} (threshold ${saved.PriceRiseThreshold.Value}).", cancellationToken);
        }
    }

    private static async Task CheckScheduleChange(INotificationSender sender, SavedFlight saved, ApiFlightDto latest, CancellationToken cancellationToken)
    {
        var previousDeparture = TryReadFlightField(saved.FlightData, "departureTime");
        var previousArrival = TryReadFlightField(saved.FlightData, "arrivalTime");
        if ((!string.IsNullOrWhiteSpace(previousDeparture) && !previousDeparture.Equals(latest.DepartureTime, StringComparison.OrdinalIgnoreCase))
            || (!string.IsNullOrWhiteSpace(previousArrival) && !previousArrival.Equals(latest.ArrivalTime, StringComparison.OrdinalIgnoreCase)))
        {
            await DispatchChannels(
                sender,
                saved,
                "schedule_change",
                $"{saved.Route} schedule changed from {previousDeparture}-{previousArrival} to {latest.DepartureTime}-{latest.ArrivalTime}.",
                cancellationToken);
        }
    }

    private static async Task DispatchChannels(INotificationSender sender, SavedFlight saved, string type, string message, CancellationToken cancellationToken)
    {
        var channels = new List<string>();
        if (!string.IsNullOrWhiteSpace(saved.User.Email))
        {
            channels.Add("email");
        }
        if (!string.IsNullOrWhiteSpace(saved.User.PhoneNumber))
        {
            channels.Add("sms");
        }
        if (channels.Count == 0)
        {
            channels.Add("in_app");
        }

        foreach (var channel in channels)
        {
            await sender.SendAsync(saved.User, saved, channel, type, message, cancellationToken);
        }
    }

    private static string? TryReadFlightField(string json, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }
        try
        {
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.TryGetProperty(fieldName, out var value) ? value.GetString() : null;
        }
        catch
        {
            return null;
        }
    }
}
