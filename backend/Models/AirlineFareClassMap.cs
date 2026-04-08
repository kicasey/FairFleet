using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FairFleetAPI.Models;

public class AirlineFareClassMap
{
    public int Id { get; set; }
    [MaxLength(2)]
    public string AirlineCode { get; set; } = "";
    [MaxLength(100)]
    public string AirlineName { get; set; } = "";
    [MaxLength(255)]
    public string ProprietaryTerm { get; set; } = "";
    [MaxLength(255)]
    public string StandardLabel { get; set; } = "";
    public string? Description { get; set; }
    public bool PersonalItemIncluded { get; set; }
    public bool CarryOnIncluded { get; set; }
    public bool CheckedBagIncluded { get; set; }
    public bool SeatSelectionIncluded { get; set; }
    [Column(TypeName = "decimal(10,2)")]
    public decimal ChangeFee { get; set; }
}
