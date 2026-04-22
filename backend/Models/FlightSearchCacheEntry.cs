using System.ComponentModel.DataAnnotations;

namespace FairFleetAPI.Models;

public class FlightSearchCacheEntry
{
    public int Id { get; set; }
    [MaxLength(255)]
    public string CacheKey { get; set; } = "";
    [MaxLength(8)]
    public string Origin { get; set; } = "";
    [MaxLength(8)]
    public string Destination { get; set; } = "";
    [MaxLength(20)]
    public string CabinClass { get; set; } = "economy";
    public int Passengers { get; set; } = 1;
    [MaxLength(10)]
    public string DepartDate { get; set; } = "";
    public string ResponseJson { get; set; } = "[]";
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
