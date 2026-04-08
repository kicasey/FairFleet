using System.ComponentModel.DataAnnotations.Schema;

namespace FairFleetAPI.Models;

public class PriceHistory
{
    public int Id { get; set; }
    public int SavedFlightId { get; set; }
    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    
    public SavedFlight SavedFlight { get; set; } = null!;
}
