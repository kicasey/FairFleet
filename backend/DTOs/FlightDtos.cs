namespace FairFleetAPI.DTOs;

public record FlightSearchDto(string From, string To, string? DepartDate, string? ReturnDate, int Passengers = 1, string CabinClass = "economy", string? Bags = null, int? MaxStops = null, string? Airlines = null, int? MaxDuration = null);
public record SaveFlightDto(string FlightData, string Route, string AirlineCode, string AirlineName, string DepartureDate, decimal TotalPrice, decimal BaseFare, decimal BagFees, decimal SeatFees, int? FolderId);
public record AlertConfigDto(bool PriceAlertEnabled, decimal? PriceDropThreshold, decimal? PriceRiseThreshold, string AlertFrequency);
public record CreateFolderDto(string Name);
public record InviteCollaboratorDto(string Email, string Permission);
