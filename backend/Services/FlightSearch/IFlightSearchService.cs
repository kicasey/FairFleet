using FairFleetAPI.DTOs;

namespace FairFleetAPI.Services.FlightSearch;

public interface IFlightSearchService
{
    Task<List<ApiFlightDto>> SearchAsync(FlightSearchDto dto, CancellationToken cancellationToken = default);
}
