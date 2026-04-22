import type { Destination, Flight } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function fetchFlights(params: {
  from: string;
  to: string;
  date?: string;
  returnDate?: string;
  roundTrip?: boolean;
  flexibleDates?: boolean;
  flexibleDays?: number;
  cabinClass?: string;
  passengers?: number;
  children?: number;
  bags?: string[];
  checkedBags?: number;
  maxStops?: number;
  airlines?: string[];
  maxDuration?: number;
  departureTimeBuckets?: string[];
  maxLayoverMinutes?: number;
  sortBy?: string;
}): Promise<Flight[]> {
  const query = new URLSearchParams();
  query.set('from', params.from);
  query.set('to', params.to);
  query.set('departDate', params.date || '');
  query.set('cabinClass', params.cabinClass || 'economy');
  query.set('passengers', String(params.passengers ?? 1));
  if (params.returnDate) query.set('returnDate', params.returnDate);
  if (params.roundTrip) query.set('roundTrip', 'true');
  if (params.flexibleDates) query.set('flexibleDates', 'true');
  if (params.flexibleDays) query.set('flexibleDays', String(params.flexibleDays));
  if (params.children) query.set('children', String(params.children));
  if (params.bags?.length) query.set('bags', params.bags.join(','));
  if (typeof params.checkedBags === 'number') query.set('checkedBags', String(params.checkedBags));
  if (typeof params.maxStops === 'number') query.set('maxStops', String(params.maxStops));
  if (params.airlines?.length) query.set('airlines', params.airlines.join(','));
  if (typeof params.maxDuration === 'number') query.set('maxDuration', String(params.maxDuration));
  if (params.departureTimeBuckets?.length) query.set('departureTimeBuckets', params.departureTimeBuckets.join(','));
  if (typeof params.maxLayoverMinutes === 'number') query.set('maxLayoverMinutes', String(params.maxLayoverMinutes));
  if (params.sortBy) query.set('sortBy', params.sortBy);

  const res = await apiFetch<{ flights: Flight[]; source?: string }>(`/flights/search?${query.toString()}`);
  if (res.source) {
    console.info(`Flight data source: ${res.source}`);
  }
  return res.flights ?? [];
}

export async function fetchExploreDestinations(from = 'ATL'): Promise<Destination[]> {
  const res = await apiFetch<{ destinations: Destination[] }>(`/flights/explore?from=${from}`);
  return res.destinations ?? [];
}

export async function fetchDeals(): Promise<Destination[]> {
  const res = await apiFetch<{ destinations: Destination[] }>(`/flights/deals`);
  return res.destinations ?? [];
}

export async function fetchFlightById(id: string): Promise<Flight> {
  return apiFetch<Flight>(`/flights/${id}`);
}
