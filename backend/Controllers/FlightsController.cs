using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FairFleetAPI.Data;
using FairFleetAPI.DTOs;

namespace FairFleetAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FlightsController : ControllerBase
{
    private readonly AppDbContext _db;

    public FlightsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("search")]
    public ActionResult Search([FromQuery] FlightSearchDto dto)
    {
        var dummyResults = new[]
        {
            new
            {
                id = "FL001",
                airline = "Delta",
                airlineCode = "DL",
                from = dto.From,
                to = dto.To,
                departDate = dto.DepartDate ?? DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-dd"),
                departTime = "08:00",
                arriveTime = "11:30",
                duration = "3h 30m",
                stops = 0,
                cabinClass = dto.CabinClass,
                baseFare = 189.00m,
                bagFees = 35.00m,
                seatFees = 0.00m,
                totalPrice = 224.00m,
                fareClass = "Main Cabin",
                standardLabel = "Economy"
            },
            new
            {
                id = "FL002",
                airline = "United",
                airlineCode = "UA",
                from = dto.From,
                to = dto.To,
                departDate = dto.DepartDate ?? DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-dd"),
                departTime = "10:15",
                arriveTime = "13:45",
                duration = "3h 30m",
                stops = 0,
                cabinClass = dto.CabinClass,
                baseFare = 175.00m,
                bagFees = 40.00m,
                seatFees = 12.00m,
                totalPrice = 227.00m,
                fareClass = "Economy",
                standardLabel = "Economy"
            },
            new
            {
                id = "FL003",
                airline = "American",
                airlineCode = "AA",
                from = dto.From,
                to = dto.To,
                departDate = dto.DepartDate ?? DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-dd"),
                departTime = "14:00",
                arriveTime = "17:20",
                duration = "3h 20m",
                stops = 0,
                cabinClass = dto.CabinClass,
                baseFare = 195.00m,
                bagFees = 30.00m,
                seatFees = 0.00m,
                totalPrice = 225.00m,
                fareClass = "Main Cabin",
                standardLabel = "Economy"
            }
        };

        var results = dummyResults.AsEnumerable();

        if (dto.MaxStops.HasValue)
            results = results.Where(r => r.stops <= dto.MaxStops.Value);

        if (!string.IsNullOrEmpty(dto.Airlines))
        {
            var codes = dto.Airlines.Split(',');
            results = results.Where(r => codes.Contains(r.airlineCode));
        }

        return Ok(new { flights = results, total = results.Count() });
    }

    [HttpGet("explore")]
    public ActionResult Explore([FromQuery] string? from)
    {
        var destinations = new[]
        {
            new { code = "LAX", city = "Los Angeles", country = "US", lowestPrice = 149.00m },
            new { code = "JFK", city = "New York", country = "US", lowestPrice = 199.00m },
            new { code = "ORD", city = "Chicago", country = "US", lowestPrice = 129.00m },
            new { code = "MIA", city = "Miami", country = "US", lowestPrice = 179.00m },
            new { code = "DFW", city = "Dallas", country = "US", lowestPrice = 159.00m },
            new { code = "SEA", city = "Seattle", country = "US", lowestPrice = 169.00m }
        };

        return Ok(new { destinations, from = from ?? "N/A" });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetFlight(int id)
    {
        var flight = await _db.SavedFlights.FindAsync(id);
        if (flight == null)
            return NotFound();

        return Ok(flight);
    }

    [HttpGet("{id}/price-history")]
    public async Task<ActionResult> GetPriceHistory(int id)
    {
        var history = await _db.PriceHistories
            .Where(p => p.SavedFlightId == id)
            .OrderBy(p => p.RecordedAt)
            .Select(p => new { p.Price, p.RecordedAt })
            .ToListAsync();

        return Ok(history);
    }

    [HttpGet("deals")]
    public ActionResult GetDeals([FromQuery] string? airport)
    {
        var deals = new[]
        {
            new { route = $"{airport ?? "ATL"}-LAX", airline = "Delta", price = 99.00m, normalPrice = 189.00m, savings = 90.00m, expiresIn = "2 days" },
            new { route = $"{airport ?? "ATL"}-JFK", airline = "JetBlue", price = 79.00m, normalPrice = 149.00m, savings = 70.00m, expiresIn = "1 day" },
            new { route = $"{airport ?? "ATL"}-ORD", airline = "United", price = 89.00m, normalPrice = 159.00m, savings = 70.00m, expiresIn = "3 days" }
        };

        return Ok(new { deals, airport = airport ?? "ATL" });
    }
}
