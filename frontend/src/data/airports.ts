import { Airport } from '@/lib/types';

export const airports: Airport[] = [
  { code: 'ATL', city: 'Atlanta', name: 'Hartsfield-Jackson Atlanta International', country: 'US', lat: 33.6407, lng: -84.4277 },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International', country: 'US', lat: 33.9425, lng: -118.4081 },
  { code: 'ORD', city: 'Chicago', name: "O'Hare International", country: 'US', lat: 41.9742, lng: -87.9073 },
  { code: 'DFW', city: 'Dallas', name: 'Dallas/Fort Worth International', country: 'US', lat: 32.8998, lng: -97.0403 },
  { code: 'DEN', city: 'Denver', name: 'Denver International', country: 'US', lat: 39.8561, lng: -104.6737 },
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy International', country: 'US', lat: 40.6413, lng: -73.7781 },
  { code: 'SFO', city: 'San Francisco', name: 'San Francisco International', country: 'US', lat: 37.6213, lng: -122.379 },
  { code: 'SEA', city: 'Seattle', name: 'Seattle-Tacoma International', country: 'US', lat: 47.4502, lng: -122.3088 },
  { code: 'MIA', city: 'Miami', name: 'Miami International', country: 'US', lat: 25.7959, lng: -80.2870 },
  { code: 'BOS', city: 'Boston', name: 'Boston Logan International', country: 'US', lat: 42.3656, lng: -71.0096 },
  { code: 'MSP', city: 'Minneapolis', name: 'Minneapolis-Saint Paul International', country: 'US', lat: 44.8848, lng: -93.2223 },
  { code: 'DTW', city: 'Detroit', name: 'Detroit Metropolitan Wayne County', country: 'US', lat: 42.2124, lng: -83.3534 },
  { code: 'PHX', city: 'Phoenix', name: 'Phoenix Sky Harbor International', country: 'US', lat: 33.4373, lng: -112.0078 },
  { code: 'MCO', city: 'Orlando', name: 'Orlando International', country: 'US', lat: 28.4312, lng: -81.3081 },
  { code: 'IAH', city: 'Houston', name: 'George Bush Intercontinental', country: 'US', lat: 29.9902, lng: -95.3368 },
  // International - Caribbean/Latin
  { code: 'CUN', city: 'Cancún', name: 'Cancún International', country: 'MX', lat: 21.0365, lng: -86.8771 },
  { code: 'SJU', city: 'San Juan', name: 'Luis Muñoz Marín International', country: 'PR', lat: 18.4394, lng: -66.0018 },
  { code: 'NAS', city: 'Nassau', name: 'Lynden Pindling International', country: 'BS', lat: 25.0390, lng: -77.4662 },
  { code: 'MBJ', city: 'Montego Bay', name: 'Sangster International', country: 'JM', lat: 18.5037, lng: -77.9134 },
  { code: 'BOG', city: 'Bogotá', name: 'El Dorado International', country: 'CO', lat: 4.7016, lng: -74.1469 },
  { code: 'LIM', city: 'Lima', name: 'Jorge Chávez International', country: 'PE', lat: -12.0219, lng: -77.1143 },
  // International - Europe
  { code: 'LHR', city: 'London', name: 'London Heathrow', country: 'GB', lat: 51.4700, lng: -0.4543 },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle', country: 'FR', lat: 49.0097, lng: 2.5479 },
  { code: 'FCO', city: 'Rome', name: 'Leonardo da Vinci–Fiumicino', country: 'IT', lat: 41.8003, lng: 12.2389 },
  { code: 'BCN', city: 'Barcelona', name: 'Barcelona–El Prat', country: 'ES', lat: 41.2974, lng: 2.0833 },
  { code: 'LIS', city: 'Lisbon', name: 'Humberto Delgado', country: 'PT', lat: 38.7756, lng: -9.1354 },
  { code: 'AMS', city: 'Amsterdam', name: 'Amsterdam Schiphol', country: 'NL', lat: 52.3105, lng: 4.7683 },
  // International - Asia/Pacific
  { code: 'NRT', city: 'Tokyo', name: 'Narita International', country: 'JP', lat: 35.7720, lng: 140.3929 },
  { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi', country: 'TH', lat: 13.6900, lng: 100.7501 },
  { code: 'SYD', city: 'Sydney', name: 'Kingsford Smith', country: 'AU', lat: -33.9461, lng: 151.1772 },
  { code: 'ICN', city: 'Seoul', name: 'Incheon International', country: 'KR', lat: 37.4602, lng: 126.4407 },
];

export function findAirport(query: string): Airport[] {
  const q = query.toLowerCase();
  return airports.filter(
    a =>
      a.code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q)
  );
}

export function getAirport(code: string): Airport | undefined {
  return airports.find(a => a.code === code);
}
