using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FairFleetAPI.Models;

public class SavedFlight
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FlightData { get; set; } = "{}"; // JSON snapshot
    [MaxLength(20)]
    public string Route { get; set; } = "";
    [MaxLength(2)]
    public string AirlineCode { get; set; } = "";
    [MaxLength(100)]
    public string AirlineName { get; set; } = "";
    public DateOnly DepartureDate { get; set; }
    [Column(TypeName = "decimal(10,2)")]
    public decimal TotalPrice { get; set; }
    [Column(TypeName = "decimal(10,2)")]
    public decimal BaseFare { get; set; }
    [Column(TypeName = "decimal(10,2)")]
    public decimal BagFees { get; set; }
    [Column(TypeName = "decimal(10,2)")]
    public decimal SeatFees { get; set; }
    public bool PriceAlertEnabled { get; set; }
    [Column(TypeName = "decimal(10,2)")]
    public decimal? PriceDropThreshold { get; set; }
    [Column(TypeName = "decimal(10,2)")]
    public decimal? PriceRiseThreshold { get; set; }
    [MaxLength(20)]
    public string AlertFrequency { get; set; } = "daily";
    public int? FolderId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    public User User { get; set; } = null!;
    public Folder? Folder { get; set; }
    public ICollection<PriceHistory> PriceHistories { get; set; } = new List<PriceHistory>();
}
