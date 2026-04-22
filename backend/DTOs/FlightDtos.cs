namespace FairFleetAPI.DTOs;

public record FlightSearchDto(
    string From,
    string To,
    string? DepartDate,
    string? ReturnDate,
    int Passengers = 1,
    string CabinClass = "economy",
    string? Bags = null,
    int CheckedBags = 0,
    int? MaxStops = null,
    string? Airlines = null,
    int? MaxDuration = null,
    string? DepartureTimeBuckets = null,
    int? MaxLayoverMinutes = null,
    bool RoundTrip = false,
    bool FlexibleDates = false,
    int FlexibleDays = 0,
    string SortBy = "price"
);
public record SaveFlightDto(string FlightData, string Route, string AirlineCode, string AirlineName, string DepartureDate, decimal TotalPrice, decimal BaseFare, decimal BagFees, decimal SeatFees, int? FolderId);
public record AlertConfigDto(bool PriceAlertEnabled, decimal? PriceDropThreshold, decimal? PriceRiseThreshold, string AlertFrequency);
public record SavedFlightFolderDto(int? FolderId);
public record CreateFolderDto(string Name);
public record InviteCollaboratorDto(string Email, string Permission);

public record ApiFoodSuggestionDto(string Name, string Type, string Gate, string Cost);
public record ApiLayoverDto(string Airport, string AirportCode, string Terminal, string Duration, int DurationMinutes, List<ApiFoodSuggestionDto> FoodSuggestions, bool BagsThrough);
public record ApiFlightSegmentDto(string FlightNumber, string Airline, string AirlineCode, string AircraftType, string DepartureAirport, string DepartureTime, string ArrivalAirport, string ArrivalTime, string Duration, int DurationMinutes);
public record ApiBagOptionDto(bool Included, decimal Fee);
public record ApiBagInfoDto(ApiBagOptionDto PersonalItem, ApiBagOptionDto CarryOn, ApiBagOptionDto Checked);
public record ApiPricePointDto(string Date, decimal Price);

public record ApiFlightDto(
    string Id,
    string Airline,
    string AirlineCode,
    string Origin,
    string Destination,
    string OriginCity,
    string DestinationCity,
    string DepartureDate,
    string DepartureTime,
    string ArrivalTime,
    string Duration,
    int DurationMinutes,
    int Stops,
    string CabinClass,
    decimal BaseFare,
    decimal Taxes,
    ApiBagInfoDto Bags,
    decimal BagFees,
    decimal SeatFees,
    bool SeatSelectionIncluded,
    decimal TotalPrice,
    string FareClass,
    string ProprietaryFareClass,
    string BookingUrl,
    int MilesEquivalent,
    List<string> StopCities,
    List<ApiFlightSegmentDto> Segments,
    List<ApiLayoverDto> Layovers,
    List<ApiPricePointDto> PriceHistory
);
