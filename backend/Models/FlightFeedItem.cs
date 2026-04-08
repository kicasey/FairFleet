using System.ComponentModel.DataAnnotations;

namespace FairFleetAPI.Models;

public class FlightFeedItem
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int SavedFlightId { get; set; }
    [MaxLength(20)]
    public string ActionType { get; set; } = "saved";
    public bool IsPublic { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public User User { get; set; } = null!;
    public SavedFlight SavedFlight { get; set; } = null!;
}
