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

  return res.json();
}

export async function fetchFlights(params: {
  from: string;
  to: string;
  date?: string;
  cabinClass?: string;
  passengers?: number;
}): Promise<Flight[]> {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
    departDate: params.date || '',
    cabinClass: params.cabinClass || 'economy',
    passengers: String(params.passengers ?? 1),
  });
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

export async function fetchFlightById(id: string): Promise<Flight> {
  return apiFetch<Flight>(`/flights/${id}`);
}
