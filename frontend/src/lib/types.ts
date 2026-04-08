export interface Airport {
  code: string;
  city: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export interface Airline {
  code: string;
  name: string;
  color: string;
  bgColor: string;
  personalItemFree: boolean;
  carryOnFree: boolean;
  checkedBagFee: number;
  secondCheckedBagFee: number;
}

export interface BagInfo {
  personalItem: { included: boolean; fee: number };
  carryOn: { included: boolean; fee: number };
  checked: { included: boolean; fee: number };
}

export interface FlightSegment {
  flightNumber: string;
  airline: string;
  airlineCode: string;
  aircraftType: string;
  departureAirport: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalTime: string;
  duration: string;
  durationMinutes: number;
}

export interface LayoverInfo {
  airport: string;
  airportCode: string;
  terminal: string;
  duration: string;
  durationMinutes: number;
  foodSuggestions: { name: string; type: string; gate: string; cost: string }[];
  bagsThrough: boolean;
}

export interface Flight {
  id: string;
  airline: string;
  airlineCode: string;
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  departureDate: string;
  returnDate?: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  durationMinutes: number;
  stops: number;
  stopCities?: string[];
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  baseFare: number;
  taxes: number;
  bags: BagInfo;
  bagFees: number;
  seatFees: number;
  seatSelectionIncluded: boolean;
  totalPrice: number;
  segments: FlightSegment[];
  layovers: LayoverInfo[];
  fareClass: string;
  proprietaryFareClass: string;
  bookingUrl: string;
  priceHistory: PricePoint[];
  milesEquivalent?: number;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface Destination {
  code: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  cheapestPrice: number;
  flightTime: string;
  weather: { temp: number; condition: string };
  tags: string[];
  imageUrl?: string;
  continent: string;
}

export interface FareClassMapping {
  airlineCode: string;
  airlineName: string;
  proprietaryTerm: string;
  standardLabel: string;
  description: string;
  personalItemIncluded: boolean;
  carryOnIncluded: boolean;
  checkedBagIncluded: boolean;
  seatSelectionIncluded: boolean;
  changeFee: number;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  homeAirportCode: string;
  defaultCabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  defaultBags: { personal: boolean; carryon: boolean; checked: number };
  loyaltyStatuses: LoyaltyStatus[];
}

export interface LoyaltyStatus {
  id: number;
  airlineCode: string;
  airlineName: string;
  statusTier: string;
  freeBags: number;
}

export interface SavedFlight {
  id: number;
  flight: Flight;
  route: string;
  priceAlertEnabled: boolean;
  priceDropThreshold?: number;
  priceRiseThreshold?: number;
  alertFrequency: 'immediate' | 'daily' | 'weekly';
  folderId?: number;
  priceChange?: { amount: number; direction: 'up' | 'down' };
}

export interface Folder {
  id: number;
  name: string;
  flightCount: number;
  collaborators: { id: number; name: string; permission: 'view' | 'edit' }[];
  shareToken: string;
  flights: SavedFlight[];
}

export interface QuizAnswer {
  weather?: string;
  companions?: string;
  vibe?: string;
  length?: string;
  budget?: string;
  flexibility?: string;
}

export type SearchFilters = {
  priceRange: [number, number];
  stops: number[];
  airlines: string[];
  durationRange: [number, number];
  cabinClass: string[];
  departureTime: string[];
  maxLayover?: number;
};
