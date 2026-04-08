using System.ComponentModel.DataAnnotations;

namespace FairFleetAPI.Models;

public class User
{
    public int Id { get; set; }
    [MaxLength(255)]
    public string ClerkUserId { get; set; } = "";
    [MaxLength(255)]
    public string? Email { get; set; }
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }
    [MaxLength(3)]
    public string? HomeAirportCode { get; set; }
    [MaxLength(20)]
    public string DefaultCabinClass { get; set; } = "economy";
    public string? DefaultBags { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    public ICollection<AirlineLoyaltyStatus> LoyaltyStatuses { get; set; } = new List<AirlineLoyaltyStatus>();
    public ICollection<SavedFlight> SavedFlights { get; set; } = new List<SavedFlight>();
    public ICollection<Folder> Folders { get; set; } = new List<Folder>();
}
