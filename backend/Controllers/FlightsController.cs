using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
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
    private readonly IMemoryCache _cache;

    private static readonly TimeSpan ExploreCacheTtl = TimeSpan.FromHours(6);
    private const string ExploreCacheKeyPrefix = "explore:";
    private const string ExploreWarmOriginsKey = "explore:warm-origins";

    public FlightsController(AppDbContext db, IFlightSearchService flightSearchService, IMemoryCache cache)
    {
        _db = db;
        _flightSearchService = flightSearchService;
        _cache = cache;
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
        try
        {
            var result = await GetExploreDestinationsCachedAsync(origin, cancellationToken);
            return Ok(new
            {
                destinations = result.Destinations.Select(ProjectDestination).ToList(),
                from = origin,
                hydratedFrom = result.FromCache ? "cache" : "serpapi",
                resultCount = result.Destinations.Count
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
    }

    private static object ProjectDestination(ExploreDestination d) => new
    {
        code = d.Code,
        city = d.City,
        country = d.Country,
        lat = d.Lat,
        lng = d.Lng,
        cheapestPrice = d.CheapestPrice,
        flightTime = d.FlightTime,
        weather = new { temp = d.Temp, condition = d.Condition },
        tags = d.Tags,
        continent = d.Continent,
        origin = d.Origin
    };

    private async Task<(List<ExploreDestination> Destinations, bool FromCache)> GetExploreDestinationsCachedAsync(
        string origin, CancellationToken cancellationToken)
    {
        var cacheKey = ExploreCacheKeyPrefix + origin;
        if (_cache.TryGetValue<List<ExploreDestination>>(cacheKey, out var cached) && cached is not null)
        {
            return (cached, true);
        }

        var departDate = DateTime.UtcNow.AddDays(21).ToString("yyyy-MM-dd");
        var targets = new[]
        {
            "LAX", "JFK", "ORD", "MIA", "DFW", "SEA",
            "CUN", "LHR", "CDG", "AMS", "FCO", "MAD",
            "NRT", "ICN", "MEX", "YYZ",
            "NAS", "MBJ", "SJU", "PUJ"
        };
        var allFlights = new List<ApiFlightDto>();

        foreach (var target in targets)
        {
            if (string.Equals(target, origin, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }
            var dto = new FlightSearchDto(origin, target, departDate, null, 1, "economy");
            var normalized = NormalizeSearchDto(dto);
            var flights = await _flightSearchService.SearchAsync(normalized, cancellationToken);
            allFlights.AddRange(flights);
        }

        var destinations = allFlights
            .GroupBy(f => f.Destination)
            .Select(g =>
            {
                var min = g.OrderBy(f => f.TotalPrice).First();
                var meta = DestinationMeta.TryGetValue(g.Key, out var m)
                    ? m
                    : (City: g.Key, Country: "Unknown", Lat: 0.0, Lng: 0.0, Continent: "North America", Tags: new[] { "Culture" }, Temp: 70, Condition: "Clear");
                return new ExploreDestination(
                    g.Key,
                    meta.City,
                    meta.Country,
                    meta.Lat,
                    meta.Lng,
                    min.TotalPrice,
                    min.Duration,
                    meta.Temp,
                    meta.Condition,
                    meta.Tags,
                    meta.Continent,
                    origin
                );
            })
            .OrderBy(d => d.CheapestPrice)
            .ToList();

        _cache.Set(cacheKey, destinations, ExploreCacheTtl);
        return (destinations, false);
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
    public async Task<ActionResult> GetDeals(CancellationToken cancellationToken)
    {
        var candidateOrigins = new[] { "ATL", "LAX", "JFK", "ORD", "DFW", "MIA", "SEA", "DEN", "BOS", "SFO" };
        var merged = new Dictionary<string, ExploreDestination>(StringComparer.OrdinalIgnoreCase);

        foreach (var candidate in candidateOrigins)
        {
            if (_cache.TryGetValue<List<ExploreDestination>>(ExploreCacheKeyPrefix + candidate, out var cached) && cached is not null)
            {
                foreach (var d in cached)
                {
                    if (!merged.TryGetValue(d.Code, out var existing) || d.CheapestPrice < existing.CheapestPrice)
                    {
                        merged[d.Code] = d;
                    }
                }
            }
        }

        try
        {
            if (merged.Count == 0)
            {
                var warmed = await GetExploreDestinationsCachedAsync("ATL", cancellationToken);
                foreach (var d in warmed.Destinations)
                {
                    merged[d.Code] = d;
                }
            }
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }

        var destinations = merged.Values
            .OrderBy(d => d.CheapestPrice)
            .Take(8)
            .Select(ProjectDestination)
            .ToList();

        return Ok(new { destinations, hydratedFrom = "cache-merge", resultCount = destinations.Count });
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

    private sealed record ExploreDestination(
        string Code,
        string City,
        string Country,
        double Lat,
        double Lng,
        decimal CheapestPrice,
        string FlightTime,
        int Temp,
        string Condition,
        string[] Tags,
        string Continent,
        string Origin);

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
            ["LHR"] = ("London", "United Kingdom", 51.4700, -0.4543, "Europe", ["History", "Culture"], 56, "Overcast"),
            ["CDG"] = ("Paris", "France", 49.0097, 2.5479, "Europe", ["Culture", "Food"], 60, "Cloudy"),
            ["AMS"] = ("Amsterdam", "Netherlands", 52.3105, 4.7683, "Europe", ["Culture", "Nightlife"], 54, "Rainy"),
            ["FCO"] = ("Rome", "Italy", 41.8003, 12.2389, "Europe", ["History", "Food"], 68, "Sunny"),
            ["MAD"] = ("Madrid", "Spain", 40.4719, -3.5626, "Europe", ["Culture", "Food"], 70, "Clear"),
            ["NRT"] = ("Tokyo", "Japan", 35.7647, 140.3864, "Asia", ["Culture", "Food"], 65, "Partly Cloudy"),
            ["ICN"] = ("Seoul", "South Korea", 37.4602, 126.4407, "Asia", ["Culture", "Food"], 63, "Clear"),
            ["MEX"] = ("Mexico City", "Mexico", 19.4363, -99.0721, "North America", ["Culture", "Food"], 75, "Sunny"),
            ["YYZ"] = ("Toronto", "Canada", 43.6777, -79.6248, "North America", ["Culture", "Food"], 50, "Cloudy"),
            ["NAS"] = ("Nassau", "Bahamas", 25.0389, -77.4662, "North America", ["Beach", "Resort"], 82, "Sunny"),
            ["MBJ"] = ("Montego Bay", "Jamaica", 18.5037, -77.9134, "North America", ["Beach", "Resort"], 85, "Sunny"),
            ["SJU"] = ("San Juan", "Puerto Rico", 18.4394, -66.0018, "North America", ["Beach", "Culture"], 84, "Sunny"),
            ["PUJ"] = ("Punta Cana", "Dominican Republic", 18.5674, -68.3634, "North America", ["Beach", "Resort"], 86, "Sunny")
        };
}
