using System.ComponentModel.DataAnnotations;

namespace FairFleetAPI.Models;

public class AirlineLoyaltyStatus
{
    public int Id { get; set; }
    public int UserId { get; set; }
    [MaxLength(2)]
    public string AirlineCode { get; set; } = "";
    [MaxLength(100)]
    public string AirlineName { get; set; } = "";
    [MaxLength(100)]
    public string StatusTier { get; set; } = "";
    public int FreeBags { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public User User { get; set; } = null!;
}
