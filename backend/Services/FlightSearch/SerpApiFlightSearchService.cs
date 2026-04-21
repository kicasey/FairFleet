using System.Globalization;
using System.Text.Json;
using FairFleetAPI.Data;
using FairFleetAPI.DTOs;
using FairFleetAPI.Models;

namespace FairFleetAPI.Services.FlightSearch;

public class SerpApiFlightSearchService : IFlightSearchService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SerpApiFlightSearchService> _logger;
    private readonly AppDbContext _db;

    public SerpApiFlightSearchService(HttpClient httpClient, IConfiguration configuration, ILogger<SerpApiFlightSearchService> logger, AppDbContext db)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _db = db;
    }

    public async Task<List<ApiFlightDto>> SearchAsync(FlightSearchDto dto, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["SerpApi:ApiKey"] ?? Environment.GetEnvironmentVariable("SERPAPI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("SerpAPI key is not configured.");
        }

        var departDate = string.IsNullOrWhiteSpace(dto.DepartDate)
            ? DateTime.UtcNow.AddDays(14).ToString("yyyy-MM-dd")
            : dto.DepartDate!;

        var daysToQuery = BuildDepartDates(departDate, dto.FlexibleDates ? dto.FlexibleDays : 0);
        var fareMaps = _db.AirlineFareClassMaps.ToList();
        var allFlights = new List<ApiFlightDto>();

        foreach (var day in daysToQuery)
        {
            var type = dto.RoundTrip && !string.IsNullOrWhiteSpace(dto.ReturnDate) ? "1" : "2";
            var returnQuery = type == "1"
                ? $"&return_date={Uri.EscapeDataString(dto.ReturnDate!)}"
                : string.Empty;
            var url =
                $"https://serpapi.com/search.json?engine=google_flights&type={type}&departure_id={Uri.EscapeDataString(dto.From)}&arrival_id={Uri.EscapeDataString(dto.To)}&outbound_date={Uri.EscapeDataString(day)}{returnQuery}&currency=USD&hl=en&api_key={Uri.EscapeDataString(apiKey)}";

            _logger.LogInformation("SerpAPI request: {From}->{To} on {Date}", dto.From, dto.To, day);
            var response = await _httpClient.GetAsync(url, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new InvalidOperationException($"SerpAPI error {(int)response.StatusCode}: {errorBody}");
            }
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

            if (doc.RootElement.TryGetProperty("best_flights", out var bestFlights))
            {
                allFlights.AddRange(ParseFlightGroup(bestFlights, dto, day, fareMaps));
            }
            if (doc.RootElement.TryGetProperty("other_flights", out var otherFlights))
            {
                allFlights.AddRange(ParseFlightGroup(otherFlights, dto, day, fareMaps));
            }
        }

        var flights = allFlights;
        if (dto.MaxStops.HasValue)
        {
            flights = flights.Where(f => f.Stops <= dto.MaxStops.Value).ToList();
        }

        if (!string.IsNullOrWhiteSpace(dto.Airlines))
        {
            var codes = dto.Airlines.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            flights = flights.Where(f => codes.Contains(f.AirlineCode, StringComparer.OrdinalIgnoreCase)).ToList();
        }
        if (dto.MaxDuration.HasValue)
        {
            flights = flights.Where(f => f.DurationMinutes <= dto.MaxDuration.Value).ToList();
        }
        if (dto.MaxLayoverMinutes.HasValue)
        {
            flights = flights.Where(f => f.Layovers.All(l => l.DurationMinutes <= dto.MaxLayoverMinutes.Value)).ToList();
        }
        if (!string.IsNullOrWhiteSpace(dto.DepartureTimeBuckets))
        {
            var allowed = dto.DepartureTimeBuckets.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Select(v => v.ToLowerInvariant())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            flights = flights.Where(f => allowed.Contains(GetTimeBucket(f.DepartureTime))).ToList();
        }

        return flights;
    }

    private static IEnumerable<ApiFlightDto> ParseFlightGroup(JsonElement group, FlightSearchDto dto, string departDate, List<AirlineFareClassMap> fareMaps)
    {
        foreach (var item in group.EnumerateArray())
        {
            var price = item.TryGetProperty("price", out var priceEl) && priceEl.ValueKind == JsonValueKind.Number
                ? priceEl.GetDecimal()
                : 0m;
            var airline = item.TryGetProperty("airline", out var airlineEl) ? airlineEl.GetString() ?? "Unknown" : "Unknown";
            var flights = item.TryGetProperty("flights", out var flightsEl) && flightsEl.ValueKind == JsonValueKind.Array
                ? flightsEl.EnumerateArray().ToList()
                : new List<JsonElement>();

            if (flights.Count == 0)
            {
                continue;
            }

            var first = flights[0];
            var airlineCode = first.TryGetProperty("airline_logo", out var logoEl)
                ? GetAirlineCodeFromLogo(logoEl.GetString())
                : (first.TryGetProperty("airline", out var firstAirline) ? GetCodeFromAirlineName(firstAirline.GetString()) : "NA");
            var originCity = TryGetAirportCity(first, "departure_airport", dto.From);
            var destinationCity = TryGetAirportCity(flights[^1], "arrival_airport", dto.To);

            var segments = flights.Select((seg, idx) =>
            {
                var depAirport = seg.TryGetProperty("departure_airport", out var depA) && depA.TryGetProperty("id", out var depId)
                    ? depId.GetString() ?? dto.From
                    : dto.From;
                var arrAirport = seg.TryGetProperty("arrival_airport", out var arrA) && arrA.TryGetProperty("id", out var arrId)
                    ? arrId.GetString() ?? dto.To
                    : dto.To;
                var depTime = seg.TryGetProperty("departure_airport", out var depObj) && depObj.TryGetProperty("time", out var depTimeEl)
                    ? ExtractClock(depTimeEl.GetString())
                    : "08:00";
                var arrTime = seg.TryGetProperty("arrival_airport", out var arrObj) && arrObj.TryGetProperty("time", out var arrTimeEl)
                    ? ExtractClock(arrTimeEl.GetString())
                    : "11:00";
                var durationMinutes = seg.TryGetProperty("duration", out var durEl) && durEl.ValueKind == JsonValueKind.Number
                    ? durEl.GetInt32()
                    : 0;
                var segAirline = seg.TryGetProperty("airline", out var segAirlineEl)
                    ? segAirlineEl.GetString() ?? airline
                    : airline;

                return new ApiFlightSegmentDto(
                    FlightNumber: seg.TryGetProperty("flight_number", out var fn) ? $"{GetCodeFromAirlineName(segAirline)} {fn.GetString() ?? $"{idx + 1}"}" : $"{GetCodeFromAirlineName(segAirline)} {idx + 1}",
                    Airline: segAirline,
                    AirlineCode: GetCodeFromAirlineName(segAirline),
                    AircraftType: seg.TryGetProperty("airplane", out var plane) ? plane.GetString() ?? "Unknown aircraft" : "Unknown aircraft",
                    DepartureAirport: depAirport,
                    DepartureTime: depTime,
                    ArrivalAirport: arrAirport,
                    ArrivalTime: arrTime,
                    Duration: FormatDuration(durationMinutes),
                    DurationMinutes: durationMinutes
                );
            }).ToList();

            var durationTotal = item.TryGetProperty("total_duration", out var totalDuration) && totalDuration.ValueKind == JsonValueKind.Number
                ? totalDuration.GetInt32()
                : segments.Sum(s => s.DurationMinutes);
            var stops = Math.Max(0, segments.Count - 1);
            var fareMap = ResolveFareMap(fareMaps, airlineCode, airline, dto.CabinClass, item);
            var bags = BuildBagInfo(fareMap);
            var checkedFeeEach = bags.Checked.Included ? 0m : bags.Checked.Fee;
            var checkedCount = Math.Max(0, dto.CheckedBags);
            var bagFees = decimal.Round((bags.CarryOn.Included ? 0m : bags.CarryOn.Fee) + (checkedFeeEach * checkedCount), 2);
            var seatFees = fareMap.SeatSelectionIncluded ? 0m : 15m;
            var baseFare = decimal.Round(price * 0.82m, 2);
            var taxes = decimal.Round(price - baseFare, 2);
            var totalPrice = decimal.Round(baseFare + taxes + bagFees + seatFees, 2);
            var priceHistory = BuildPriceHistory(price);
            var stopCities = segments.Skip(1).Select(s => s.DepartureAirport).Distinct().ToList();

            yield return new ApiFlightDto(
                Id: item.TryGetProperty("departure_token", out var token) && !string.IsNullOrWhiteSpace(token.GetString())
                    ? token.GetString()!
                    : Guid.NewGuid().ToString("N")[..12],
                Airline: airline,
                AirlineCode: airlineCode,
                Origin: dto.From,
                Destination: dto.To,
                OriginCity: originCity,
                DestinationCity: destinationCity,
                DepartureDate: departDate,
                DepartureTime: segments[0].DepartureTime,
                ArrivalTime: segments[^1].ArrivalTime,
                Duration: FormatDuration(durationTotal),
                DurationMinutes: durationTotal,
                Stops: stops,
                CabinClass: dto.CabinClass,
                BaseFare: baseFare,
                Taxes: taxes,
                Bags: bags,
                BagFees: bagFees,
                SeatFees: seatFees,
                SeatSelectionIncluded: fareMap.SeatSelectionIncluded,
                TotalPrice: totalPrice,
                FareClass: fareMap.StandardLabel,
                ProprietaryFareClass: fareMap.ProprietaryTerm,
                BookingUrl: "https://www.google.com/travel/flights",
                MilesEquivalent: (int)Math.Round(totalPrice * 78),
                StopCities: stopCities,
                Segments: segments,
                Layovers: new List<ApiLayoverDto>(),
                PriceHistory: priceHistory
            );
        }
    }

    private static List<ApiPricePointDto> BuildPriceHistory(decimal basePrice)
    {
        var points = new List<ApiPricePointDto>();
        for (var i = 29; i >= 0; i--)
        {
            var date = DateTime.UtcNow.Date.AddDays(-i).ToString("yyyy-MM-dd");
            var factor = 0.9m + ((29 - i) * 0.006m);
            var price = decimal.Round(basePrice * factor, 2);
            points.Add(new ApiPricePointDto(date, price));
        }
        return points;
    }

    private static string ExtractClock(string? dateTimeRaw)
    {
        if (string.IsNullOrWhiteSpace(dateTimeRaw))
        {
            return "00:00";
        }

        if (DateTime.TryParse(dateTimeRaw, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var dt))
        {
            return dt.ToString("HH:mm");
        }

        var pieces = dateTimeRaw.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return pieces.Length > 0 ? pieces[^1] : "00:00";
    }

    private static string FormatDuration(int durationMinutes)
    {
        var hours = durationMinutes / 60;
        var mins = durationMinutes % 60;
        return $"{hours}h {mins}m";
    }

    private static string GetAirlineCodeFromLogo(string? logoUrl)
    {
        if (string.IsNullOrWhiteSpace(logoUrl))
        {
            return "NA";
        }

        var file = Path.GetFileNameWithoutExtension(logoUrl);
        return file.Length >= 2 ? file[..2].ToUpperInvariant() : "NA";
    }

    private static string GetCodeFromAirlineName(string? airline)
    {
        if (string.IsNullOrWhiteSpace(airline))
        {
            return "NA";
        }

        var words = airline.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 1)
        {
            return airline[..Math.Min(2, airline.Length)].ToUpperInvariant();
        }

        return string.Concat(words.Take(2).Select(w => char.ToUpperInvariant(w[0])));
    }

    private static string TryGetAirportCity(JsonElement flightSegment, string airportNodeName, string fallback)
    {
        if (flightSegment.TryGetProperty(airportNodeName, out var airportNode) &&
            airportNode.TryGetProperty("name", out var nameNode))
        {
            var fullName = nameNode.GetString();
            if (!string.IsNullOrWhiteSpace(fullName))
            {
                var cityPart = fullName.Split(',')[0].Trim();
                if (!string.IsNullOrWhiteSpace(cityPart))
                {
                    return cityPart;
                }
            }
        }

        return fallback;
    }

    private static List<string> BuildDepartDates(string baseDate, int flexDays)
    {
        if (!DateOnly.TryParse(baseDate, out var start))
        {
            return [baseDate];
        }

        var days = Math.Clamp(flexDays, 0, 3);
        if (days == 0)
        {
            return [baseDate];
        }

        var list = new List<string>();
        for (var i = -days; i <= days; i++)
        {
            list.Add(start.AddDays(i).ToString("yyyy-MM-dd"));
        }
        return list;
    }

    private static string GetTimeBucket(string departureTime)
    {
        var hour = 0;
        if (TimeOnly.TryParse(departureTime, out var parsed))
        {
            hour = parsed.Hour;
        }
        else
        {
            var parts = departureTime.Split(':', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length > 0 && int.TryParse(parts[0], out var h))
            {
                hour = h;
            }
        }

        if (hour >= 6 && hour < 12) return "morning";
        if (hour >= 12 && hour < 17) return "afternoon";
        if (hour >= 17 && hour < 21) return "evening";
        return "redeye";
    }

    private static AirlineFareClassMap ResolveFareMap(
        List<AirlineFareClassMap> maps,
        string airlineCode,
        string airlineName,
        string cabinClass,
        JsonElement item)
    {
        var providerTerm = item.TryGetProperty("type", out var type) ? (type.GetString() ?? "Standard") : "Standard";
        var mapped = maps.FirstOrDefault(m =>
            m.AirlineCode.Equals(airlineCode, StringComparison.OrdinalIgnoreCase) &&
            m.ProprietaryTerm.Equals(providerTerm, StringComparison.OrdinalIgnoreCase));
        if (mapped is not null)
        {
            return mapped;
        }

        return new AirlineFareClassMap
        {
            AirlineCode = airlineCode,
            AirlineName = airlineName,
            ProprietaryTerm = providerTerm,
            StandardLabel = cabinClass.Replace('_', ' '),
            PersonalItemIncluded = true,
            CarryOnIncluded = true,
            CheckedBagIncluded = false,
            SeatSelectionIncluded = false
        };
    }

    private static ApiBagInfoDto BuildBagInfo(AirlineFareClassMap fareMap)
    {
        return new ApiBagInfoDto(
            PersonalItem: new ApiBagOptionDto(fareMap.PersonalItemIncluded, fareMap.PersonalItemIncluded ? 0m : 20m),
            CarryOn: new ApiBagOptionDto(fareMap.CarryOnIncluded, fareMap.CarryOnIncluded ? 0m : 35m),
            Checked: new ApiBagOptionDto(fareMap.CheckedBagIncluded, fareMap.CheckedBagIncluded ? 0m : 40m)
        );
    }
}
