using System.ComponentModel.DataAnnotations;

namespace FairFleetAPI.Models;

public class Friendship
{
    public int Id { get; set; }
    public int RequesterId { get; set; }
    public int AddresseeId { get; set; }
    [MaxLength(20)]
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public User Requester { get; set; } = null!;
    public User Addressee { get; set; } = null!;
}
