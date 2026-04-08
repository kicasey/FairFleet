using System.ComponentModel.DataAnnotations;

namespace FairFleetAPI.Models;

public class FolderCollaborator
{
    public int Id { get; set; }
    public int FolderId { get; set; }
    public int UserId { get; set; }
    [MaxLength(10)]
    public string Permission { get; set; } = "view";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public Folder Folder { get; set; } = null!;
    public User User { get; set; } = null!;
}
