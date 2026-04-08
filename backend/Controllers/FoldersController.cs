using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FairFleetAPI.Data;
using FairFleetAPI.DTOs;
using FairFleetAPI.Models;

namespace FairFleetAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FoldersController : ControllerBase
{
    private readonly AppDbContext _db;

    public FoldersController(AppDbContext db)
    {
        _db = db;
    }

    private async Task<User?> GetCurrentUser()
    {
        var clerkUserId = Request.Headers["X-Clerk-User-Id"].FirstOrDefault();
        if (string.IsNullOrEmpty(clerkUserId)) return null;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId);
        if (user == null)
        {
            user = new User { ClerkUserId = clerkUserId };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }

        return user;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var folders = await _db.Folders
            .Where(f => f.UserId == user.Id)
            .Include(f => f.Flights)
            .Select(f => new
            {
                f.Id,
                f.Name,
                f.ShareToken,
                FlightCount = f.Flights.Count,
                f.CreatedAt
            })
            .ToListAsync();

        return Ok(folders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(int id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var folder = await _db.Folders
            .Include(f => f.Flights)
            .Include(f => f.Collaborators)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == user.Id);

        if (folder == null) return NotFound();

        return Ok(new
        {
            folder.Id,
            folder.Name,
            folder.ShareToken,
            Flights = folder.Flights.Select(fl => new
            {
                fl.Id, fl.Route, fl.AirlineName, fl.TotalPrice, fl.DepartureDate
            }),
            Collaborators = folder.Collaborators.Select(c => new
            {
                c.Id, c.User.Email, c.Permission
            })
        });
    }

    [HttpPost]
    public async Task<ActionResult> Create(CreateFolderDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var folder = new Folder
        {
            UserId = user.Id,
            Name = dto.Name
        };

        _db.Folders.Add(folder);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = folder.Id }, new { folder.Id, folder.Name, folder.ShareToken });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, CreateFolderDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var folder = await _db.Folders
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == user.Id);

        if (folder == null) return NotFound();

        folder.Name = dto.Name;
        folder.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { folder.Id, folder.Name });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var folder = await _db.Folders
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == user.Id);

        if (folder == null) return NotFound();

        _db.Folders.Remove(folder);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/collaborators")]
    public async Task<ActionResult> InviteCollaborator(int id, InviteCollaboratorDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var folder = await _db.Folders
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == user.Id);

        if (folder == null) return NotFound();

        var invitee = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (invitee == null)
            return BadRequest(new { message = "User not found" });

        var existing = await _db.FolderCollaborators
            .AnyAsync(c => c.FolderId == id && c.UserId == invitee.Id);

        if (existing)
            return Conflict(new { message = "User is already a collaborator" });

        var collab = new FolderCollaborator
        {
            FolderId = id,
            UserId = invitee.Id,
            Permission = dto.Permission
        };

        _db.FolderCollaborators.Add(collab);
        await _db.SaveChangesAsync();

        return Ok(new { collab.Id, invitee.Email, collab.Permission });
    }

    [HttpDelete("{folderId}/collaborators/{collabId}")]
    public async Task<ActionResult> RemoveCollaborator(int folderId, int collabId)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var collab = await _db.FolderCollaborators
            .FirstOrDefaultAsync(c => c.Id == collabId && c.FolderId == folderId);

        if (collab == null) return NotFound();

        var folder = await _db.Folders.FindAsync(folderId);
        if (folder == null || folder.UserId != user.Id)
            return Forbid();

        _db.FolderCollaborators.Remove(collab);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("shared/{shareToken}")]
    public async Task<ActionResult> GetSharedFolder(string shareToken)
    {
        var folder = await _db.Folders
            .Include(f => f.Flights)
            .Include(f => f.User)
            .FirstOrDefaultAsync(f => f.ShareToken == shareToken);

        if (folder == null) return NotFound();

        return Ok(new
        {
            folder.Name,
            OwnerEmail = folder.User.Email,
            Flights = folder.Flights.Select(fl => new
            {
                fl.Id, fl.Route, fl.AirlineName, fl.TotalPrice, fl.DepartureDate
            })
        });
    }
}
