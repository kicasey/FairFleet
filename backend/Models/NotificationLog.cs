using System.ComponentModel.DataAnnotations;

namespace FairFleetAPI.Models;

public class NotificationLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int SavedFlightId { get; set; }
    [MaxLength(20)]
    public string Channel { get; set; } = "email";
    [MaxLength(30)]
    public string Type { get; set; } = "price_drop";
    public string? Message { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    
    public User User { get; set; } = null!;
    public SavedFlight SavedFlight { get; set; } = null!;
}
