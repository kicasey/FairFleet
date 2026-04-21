import airportData from 'airports-json';
import { Airport } from '@/lib/types';

type AirportRecord = {
  iata_code?: string;
  municipality?: string;
  name?: string;
  iso_country?: string;
  latitude_deg?: string;
  longitude_deg?: string;
};

const parsedAirports = (airportData.airports as AirportRecord[])
  .filter((airport) => airport.iata_code && airport.iata_code.length === 3)
  .map((airport) => ({
    code: airport.iata_code!.toUpperCase(),
    city: airport.municipality?.trim() || 'Unknown',
    name: airport.name?.trim() || 'Unknown Airport',
    country: airport.iso_country?.trim() || 'Unknown',
    lat: Number(airport.latitude_deg ?? '0'),
    lng: Number(airport.longitude_deg ?? '0'),
  }))
  .filter((airport) => !Number.isNaN(airport.lat) && !Number.isNaN(airport.lng));

const dedupedAirports = new Map<string, Airport>();
for (const airport of parsedAirports) {
  if (!dedupedAirports.has(airport.code)) {
    dedupedAirports.set(airport.code, airport);
  }
}

export const airports: Airport[] = [...dedupedAirports.values()].sort((a, b) => a.code.localeCompare(b.code));

export function findAirport(query: string): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }

  return airports.filter(
    (airport) =>
      airport.code.toLowerCase().includes(q) ||
      airport.city.toLowerCase().includes(q) ||
      airport.name.toLowerCase().includes(q),
  );
}

export function getAirport(code: string): Airport | undefined {
  return airports.find((airport) => airport.code === code.trim().toUpperCase());
}
