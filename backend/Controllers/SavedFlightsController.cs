using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FairFleetAPI.Data;
using FairFleetAPI.DTOs;
using FairFleetAPI.Models;
using System.Security.Claims;

namespace FairFleetAPI.Controllers;

[ApiController]
[Authorize]
[Route("api/saved-flights")]
public class SavedFlightsController : ControllerBase
{
    private readonly AppDbContext _db;

    public SavedFlightsController(AppDbContext db)
    {
        _db = db;
    }

    private async Task<User?> GetCurrentUser()
    {
        var clerkUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
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

        var flights = await _db.SavedFlights
            .Where(f => f.UserId == user.Id)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new
            {
                f.Id,
                f.Route,
                f.AirlineCode,
                f.AirlineName,
                f.DepartureDate,
                f.TotalPrice,
                f.BaseFare,
                f.BagFees,
                f.SeatFees,
                f.PriceAlertEnabled,
                f.AlertFrequency,
                f.FolderId,
                f.CreatedAt
            })
            .ToListAsync();

        return Ok(flights);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(int id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var flight = await _db.SavedFlights
            .Include(f => f.PriceHistories.OrderBy(p => p.RecordedAt))
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == user.Id);

        if (flight == null) return NotFound();

        return Ok(flight);
    }

    [HttpPost]
    public async Task<ActionResult> Save(SaveFlightDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var flight = new SavedFlight
        {
            UserId = user.Id,
            FlightData = dto.FlightData,
            Route = dto.Route,
            AirlineCode = dto.AirlineCode,
            AirlineName = dto.AirlineName,
            DepartureDate = DateOnly.Parse(dto.DepartureDate),
            TotalPrice = dto.TotalPrice,
            BaseFare = dto.BaseFare,
            BagFees = dto.BagFees,
            SeatFees = dto.SeatFees,
            FolderId = dto.FolderId
        };

        _db.SavedFlights.Add(flight);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = flight.Id }, new { flight.Id, flight.Route, flight.TotalPrice });
    }

    [HttpPut("{id}/alert")]
    public async Task<ActionResult> ConfigureAlert(int id, AlertConfigDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var flight = await _db.SavedFlights
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == user.Id);

        if (flight == null) return NotFound();

        flight.PriceAlertEnabled = dto.PriceAlertEnabled;
        flight.PriceDropThreshold = dto.PriceDropThreshold;
        flight.PriceRiseThreshold = dto.PriceRiseThreshold;
        flight.AlertFrequency = dto.AlertFrequency;
        flight.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Alert configured", flight.PriceAlertEnabled });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var flight = await _db.SavedFlights
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == user.Id);

        if (flight == null) return NotFound();

        _db.SavedFlights.Remove(flight);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("{id}/folder")]
    public async Task<ActionResult> MoveToFolder(int id, [FromBody] SavedFlightFolderDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized(new { message = "Missing X-Clerk-User-Id header" });

        var flight = await _db.SavedFlights.FirstOrDefaultAsync(f => f.Id == id && f.UserId == user.Id);
        if (flight == null) return NotFound();

        if (dto.FolderId.HasValue)
        {
            var folder = await _db.Folders.FirstOrDefaultAsync(f => f.Id == dto.FolderId.Value && f.UserId == user.Id);
            if (folder == null) return BadRequest(new { message = "Folder not found for user." });
        }

        flight.FolderId = dto.FolderId;
        flight.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Saved flight folder updated.", flight.Id, flight.FolderId });
    }
}
