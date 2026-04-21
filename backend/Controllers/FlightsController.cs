using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FairFleetAPI.Data;
using FairFleetAPI.DTOs;
using FairFleetAPI.Services.FlightSearch;
using System.Text.Json;
using System.Security.Claims;

namespace FairFleetAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FlightsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IFlightSearchService _flightSearchService;

    public FlightsController(AppDbContext db, IFlightSearchService flightSearchService)
    {
        _db = db;
        _flightSearchService = flightSearchService;
    }

    [HttpGet("search")]
    public async Task<ActionResult> Search([FromQuery] FlightSearchDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.From) || string.IsNullOrWhiteSpace(dto.To))
        {
            return BadRequest(new { message = "Both 'from' and 'to' are required." });
        }

        var normalized = NormalizeSearchDto(dto);
        try
        {
            var flights = await _flightSearchService.SearchAsync(normalized, cancellationToken);
            flights = await ApplyLoyaltyBenefitsAsync(flights, cancellationToken);
            var flexibleDateOptions = normalized.FlexibleDates
                ? flights
                    .GroupBy(f => f.DepartureDate)
                    .Select(g => new { date = g.Key, cheapestPrice = g.Min(x => x.TotalPrice) })
                    .OrderBy(x => x.cheapestPrice)
                    .Take(5)
                    .ToList()
                : [];

            return Ok(new { flights, total = flights.Count, source = "serpapi", flexibleDateOptions });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
    }

    [HttpGet("explore")]
    public async Task<ActionResult> Explore([FromQuery] string? from, CancellationToken cancellationToken)
    {
        var origin = string.IsNullOrWhiteSpace(from) ? "ATL" : from.ToUpperInvariant();
        var departDate = DateTime.UtcNow.AddDays(21).ToString("yyyy-MM-dd");
        var targets = new[] { "LAX", "JFK", "ORD", "MIA", "DFW", "SEA", "CUN", "LHR" };
        var allFlights = new List<ApiFlightDto>();

        try
        {
            foreach (var target in targets)
            {
                var dto = new FlightSearchDto(origin, target, departDate, null, 1, "economy");
                var normalized = NormalizeSearchDto(dto);
                var flights = await _flightSearchService.SearchAsync(normalized, cancellationToken);
                allFlights.AddRange(flights);
            }
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }

        var destinations = allFlights
            .GroupBy(f => f.Destination)
            .Select(g =>
            {
                var min = g.OrderBy(f => f.TotalPrice).First();
                var meta = DestinationMeta.TryGetValue(g.Key, out var m)
                    ? m
                    : (City: g.Key, Country: "Unknown", Lat: 0.0, Lng: 0.0, Continent: "North America", Tags: new[] { "Culture" }, Temp: 70, Condition: "Clear");
                return new
                {
                    code = g.Key,
                    city = meta.City,
                    country = meta.Country,
                    lat = meta.Lat,
                    lng = meta.Lng,
                    cheapestPrice = min.TotalPrice,
                    flightTime = min.Duration,
                    weather = new { temp = meta.Temp, condition = meta.Condition },
                    tags = meta.Tags,
                    continent = meta.Continent
                };
            })
            .OrderBy(d => d.cheapestPrice)
            .ToList();

        return Ok(new
        {
            destinations,
            from = origin,
            hydratedFrom = "serpapi",
            resultCount = allFlights.Count
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetFlight(string id, CancellationToken cancellationToken)
    {
        if (int.TryParse(id, out var dbId))
        {
            var saved = await _db.SavedFlights.FindAsync([dbId], cancellationToken);
            if (saved is not null)
            {
                return Ok(saved);
            }
        }

        return NotFound(new { message = "Only saved-flight IDs are supported on this endpoint." });
    }

    [HttpGet("{id}/price-history")]
    public async Task<ActionResult> GetPriceHistory(int id)
    {
        var history = await _db.PriceHistories
            .Where(p => p.SavedFlightId == id)
            .OrderBy(p => p.RecordedAt)
            .Select(p => new { p.Price, p.RecordedAt })
            .ToListAsync();

        if (history.Count == 0)
        {
            return Ok(new { points = history, low = 0m, high = 0m, average = 0m, insight = "No historical data available yet." });
        }

        var low = history.Min(h => h.Price);
        var high = history.Max(h => h.Price);
        var avg = decimal.Round(history.Average(h => h.Price), 2);
        var first = history.First().Price;
        var last = history.Last().Price;
        var delta = decimal.Round(last - first, 2);
        var insight = delta switch
        {
            < 0 => $"Price has dropped ${Math.Abs(delta)} over the tracked period. Consider booking soon if this route is trending down.",
            > 0 => $"Price has increased ${delta} over the tracked period. Watch alerts closely before it rises further.",
            _ => "Price is stable over the tracked period."
        };

        return Ok(new { points = history, low, high, average = avg, insight });
    }

    [HttpGet("deals")]
    public async Task<ActionResult> GetDeals([FromQuery] string? airport, CancellationToken cancellationToken)
    {
        var origin = string.IsNullOrWhiteSpace(airport) ? "ATL" : airport.ToUpperInvariant();
        var departDate = DateTime.UtcNow.AddDays(21).ToString("yyyy-MM-dd");
        var targets = new[] { "LAX", "JFK", "ORD", "MIA", "DFW" };
        var flights = new List<ApiFlightDto>();

        try
        {
            foreach (var target in targets)
            {
                var dto = new FlightSearchDto(origin, target, departDate, null, 1, "economy");
                var normalized = NormalizeSearchDto(dto);
                var result = await _flightSearchService.SearchAsync(normalized, cancellationToken);
                flights.AddRange(result);
            }
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }

        var top = flights.OrderBy(f => f.TotalPrice).Take(8).ToList();

        var deals = top.Select(f =>
        {
            var normalPrice = decimal.Round(f.TotalPrice * 1.22m, 2);
            return new
            {
                route = $"{f.Origin}-{f.Destination}",
                airline = f.Airline,
                price = f.TotalPrice,
                normalPrice,
                savings = decimal.Round(normalPrice - f.TotalPrice, 2),
                expiresIn = "24 hours"
            };
        }).ToList();

        return Ok(new { deals, airport = origin });
    }

    private static FlightSearchDto NormalizeSearchDto(FlightSearchDto dto)
    {
        var cabin = string.IsNullOrWhiteSpace(dto.CabinClass) ? "economy" : dto.CabinClass.ToLowerInvariant();
        var depart = string.IsNullOrWhiteSpace(dto.DepartDate)
            ? DateTime.UtcNow.AddDays(14).ToString("yyyy-MM-dd")
            : dto.DepartDate;
        var passengers = dto.Passengers <= 0 ? 1 : dto.Passengers;
        return dto with
        {
            From = dto.From.ToUpperInvariant(),
            To = dto.To.ToUpperInvariant(),
            CabinClass = cabin,
            DepartDate = depart,
            Passengers = passengers,
            FlexibleDays = Math.Clamp(dto.FlexibleDays, 0, 3),
            SortBy = string.IsNullOrWhiteSpace(dto.SortBy) ? "price" : dto.SortBy.ToLowerInvariant()
        };
    }

    private async Task<List<ApiFlightDto>> ApplyLoyaltyBenefitsAsync(List<ApiFlightDto> flights, CancellationToken cancellationToken)
    {
        var clerkUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(clerkUserId))
        {
            return flights;
        }

        var statuses = await _db.AirlineLoyaltyStatuses
            .Where(s => s.User.ClerkUserId == clerkUserId)
            .ToListAsync(cancellationToken);
        if (statuses.Count == 0)
        {
            return flights;
        }

        return flights.Select(f =>
        {
            var status = statuses.FirstOrDefault(s => s.AirlineCode.Equals(f.AirlineCode, StringComparison.OrdinalIgnoreCase));
            if (status is null || status.FreeBags <= 0)
            {
                return f;
            }

            var updatedBag = f.Bags with { Checked = new ApiBagOptionDto(true, 0m) };
            var adjustedTotal = Math.Max(0m, f.TotalPrice - f.BagFees);
            return f with
            {
                Bags = updatedBag,
                BagFees = 0m,
                TotalPrice = adjustedTotal,
                FareClass = $"{f.FareClass} (loyalty perks)"
            };
        }).ToList();
    }

    private static readonly Dictionary<string, (string City, string Country, double Lat, double Lng, string Continent, string[] Tags, int Temp, string Condition)> DestinationMeta =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["LAX"] = ("Los Angeles", "United States", 33.9425, -118.4081, "North America", ["Beach", "Entertainment"], 74, "Sunny"),
            ["JFK"] = ("New York", "United States", 40.6413, -73.7781, "North America", ["Culture", "Shopping"], 62, "Partly Cloudy"),
            ["ORD"] = ("Chicago", "United States", 41.9742, -87.9073, "North America", ["Food", "Culture"], 57, "Windy"),
            ["MIA"] = ("Miami", "United States", 25.7959, -80.2870, "North America", ["Beach", "Nightlife"], 83, "Sunny"),
            ["DFW"] = ("Dallas", "United States", 32.8998, -97.0403, "North America", ["Food", "Culture"], 79, "Clear"),
            ["SEA"] = ("Seattle", "United States", 47.4502, -122.3088, "North America", ["Nature", "Food"], 55, "Rainy"),
            ["CUN"] = ("Cancun", "Mexico", 21.0365, -86.8771, "North America", ["Beach", "Resort"], 87, "Sunny"),
            ["LHR"] = ("London", "United Kingdom", 51.4700, -0.4543, "Europe", ["History", "Culture"], 56, "Overcast")
        };
}
