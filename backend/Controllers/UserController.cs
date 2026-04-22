using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FairFleetAPI.Data;
using FairFleetAPI.Models;
using System.Security.Claims;

namespace FairFleetAPI.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly AppDbContext _db;

    public UserController(AppDbContext db)
    {
        _db = db;
    }

    private async Task<User?> GetCurrentUser()
    {
        var clerkUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(clerkUserId)) return null;
        var emailFromToken = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId);
        if (user == null)
        {
            user = new User { ClerkUserId = clerkUserId, Email = emailFromToken };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }
        else if (!string.IsNullOrWhiteSpace(emailFromToken) && !string.Equals(user.Email, emailFromToken, StringComparison.OrdinalIgnoreCase))
        {
            user.Email = emailFromToken;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return user;
    }

    [HttpGet("profile")]
    public async Task<ActionResult> GetProfile()
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        await _db.Entry(user).Collection(u => u.LoyaltyStatuses).LoadAsync();

        return Ok(new
        {
            user.Id,
            user.ClerkUserId,
            user.Email,
            user.PhoneNumber,
            user.HomeAirportCode,
            user.DefaultCabinClass,
            user.DefaultBags,
            user.CreatedAt,
            LoyaltyStatuses = user.LoyaltyStatuses.Select(ls => new
            {
                ls.Id,
                ls.AirlineCode,
                ls.AirlineName,
                ls.StatusTier,
                ls.FreeBags
            })
        });
    }

    [HttpPut("profile")]
    public async Task<ActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        if (dto.Email != null) user.Email = dto.Email;
        if (dto.PhoneNumber != null) user.PhoneNumber = dto.PhoneNumber;
        if (dto.HomeAirportCode != null) user.HomeAirportCode = dto.HomeAirportCode;
        if (dto.DefaultCabinClass != null) user.DefaultCabinClass = dto.DefaultCabinClass;
        if (dto.DefaultBags != null) user.DefaultBags = dto.DefaultBags;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Profile updated" });
    }

    [HttpPost("loyalty-status")]
    public async Task<ActionResult> AddLoyaltyStatus([FromBody] AddLoyaltyStatusDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var status = new AirlineLoyaltyStatus
        {
            UserId = user.Id,
            AirlineCode = dto.AirlineCode,
            AirlineName = dto.AirlineName,
            StatusTier = dto.StatusTier,
            FreeBags = dto.FreeBags
        };

        _db.AirlineLoyaltyStatuses.Add(status);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProfile), new { id = status.Id }, new
        {
            status.Id,
            status.AirlineCode,
            status.AirlineName,
            status.StatusTier,
            status.FreeBags
        });
    }

    [HttpDelete("loyalty-status/{id}")]
    public async Task<ActionResult> DeleteLoyaltyStatus(int id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var status = await _db.AirlineLoyaltyStatuses
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == user.Id);

        if (status == null) return NotFound(new { message = "Loyalty status was not found for this account." });

        _db.AirlineLoyaltyStatuses.Remove(status);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

public record UpdateProfileDto(string? Email, string? PhoneNumber, string? HomeAirportCode, string? DefaultCabinClass, string? DefaultBags);
public record AddLoyaltyStatusDto(string AirlineCode, string AirlineName, string StatusTier, int FreeBags);
