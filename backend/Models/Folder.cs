using System.ComponentModel.DataAnnotations;

namespace FairFleetAPI.Models;

public class Folder
{
    public int Id { get; set; }
    public int UserId { get; set; }
    [MaxLength(255)]
    public string Name { get; set; } = "";
    [MaxLength(64)]
    public string ShareToken { get; set; } = Guid.NewGuid().ToString("N")[..16];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    public User User { get; set; } = null!;
    public ICollection<SavedFlight> Flights { get; set; } = new List<SavedFlight>();
    public ICollection<FolderCollaborator> Collaborators { get; set; } = new List<FolderCollaborator>();
}
