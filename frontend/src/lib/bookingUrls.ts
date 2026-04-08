interface BookingParams {
  airline: string;
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
}

export function buildBookingUrl(p: BookingParams): string {
  switch (p.airline) {
    case 'DL':
      return `https://www.delta.com/flight-search/book-a-flight?action=findFlights&tripType=${p.returnDate ? 'ROUND_TRIP' : 'ONE_WAY'}&from=${p.origin}&to=${p.destination}&departureDate=${p.departDate}${p.returnDate ? `&returnDate=${p.returnDate}` : ''}&paxCount=${p.passengers}&cabinClass=COACH`;

    case 'AA':
      return `https://www.aa.com/booking/find-flights?tripType=${p.returnDate ? 'roundTrip' : 'oneWay'}&originAirport=${p.origin}&destinationAirport=${p.destination}&departDate=${p.departDate}${p.returnDate ? `&returnDate=${p.returnDate}` : ''}&adultCount=${p.passengers}`;

    case 'UA':
      return `https://www.united.com/en/us/fsr/choose-flights?f=${p.origin}&t=${p.destination}&d=${p.departDate}${p.returnDate ? `&r=${p.returnDate}` : ''}&px=${p.passengers}&taxng=1&idx=1`;

    case 'WN':
      return `https://www.southwest.com/air/booking/select.html?originationAirportCode=${p.origin}&destinationAirportCode=${p.destination}&departureDate=${p.departDate}${p.returnDate ? `&returnDate=${p.returnDate}` : ''}&adultPassengersCount=${p.passengers}&tripType=${p.returnDate ? 'roundtrip' : 'oneway'}`;

    case 'NK':
      return `https://www.spirit.com/book/flights?orgCode=${p.origin}&desCode=${p.destination}&departDate=${p.departDate}&numAdt=${p.passengers}&tripType=${p.returnDate ? 'RT' : 'OW'}`;

    case 'F9':
      return `https://www.flyfrontier.com/booking/search?origin=${p.origin}&destination=${p.destination}&outboundDate=${p.departDate}&ADT=${p.passengers}`;

    case 'B6':
      return `https://www.jetblue.com/booking/flights?from=${p.origin}&to=${p.destination}&depart=${p.departDate}${p.returnDate ? `&return=${p.returnDate}` : ''}&pax=${p.passengers}&isMultiCity=false`;

    case 'AS':
      return `https://www.alaskaair.com/shopping/flights?A=${p.passengers}&type=${p.returnDate ? 'RT' : 'OW'}&O=${p.origin}&D=${p.destination}&OD=${p.departDate}${p.returnDate ? `&RD=${p.returnDate}` : ''}`;

    default:
      return `https://www.google.com/travel/flights?q=flights+from+${p.origin}+to+${p.destination}+on+${p.departDate}`;
  }
}
