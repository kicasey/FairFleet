'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { SlidersHorizontal, ArrowUpDown, Plane } from 'lucide-react';
import Navbar from '@/components/Navbar';
import FlightCard from '@/components/FlightCard';
import FlightDetailModal from '@/components/FlightDetailModal';
import { Flight } from '@/lib/types';
import { apiFetch, fetchFlights } from '@/lib/api';

type SortKey = 'price' | 'duration' | 'departure';
const FILTER_STORAGE_KEY = 'fairfleet.search.filters';
const SORT_STORAGE_KEY = 'fairfleet.search.sort';

interface Filters {
  priceMin: string;
  priceMax: string;
  stops: Set<number>;
  airlines: Set<string>;
  durationMin: string;
  durationMax: string;
  cabinClass: Set<string>;
  departureTime: Set<string>;
}

const CABIN_OPTIONS = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
];

const TIME_OPTIONS = [
  { value: 'morning', label: 'Morning', sub: '6am – 12pm' },
  { value: 'afternoon', label: 'Afternoon', sub: '12 – 5pm' },
  { value: 'evening', label: 'Evening', sub: '5 – 9pm' },
  { value: 'redeye', label: 'Red-eye', sub: '9pm – 6am' },
];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getTimeBucket(departureTime: string): string {
  const mins = timeToMinutes(departureTime);
  if (mins >= 360 && mins < 720) return 'morning';
  if (mins >= 720 && mins < 1020) return 'afternoon';
  if (mins >= 1020 && mins < 1260) return 'evening';
  return 'redeye';
}

function toggleSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function SearchResults() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? 'ATL';
  const to = searchParams.get('to') ?? '';
  const date = searchParams.get('date') ?? searchParams.get('dep') ?? '';
  const passengers = searchParams.get('passengers') ?? searchParams.get('adults') ?? '1';
  const cabin = searchParams.get('cabin') ?? 'economy';
  const bags = searchParams.get('bags') ?? '0 bags';
  const returnDate = searchParams.get('returnDate') ?? '';
  const roundTrip = searchParams.get('roundTrip') === 'true';
  const flexibleDates = searchParams.get('flexibleDates') === 'true';
  const flexibleDays = Number(searchParams.get('flexibleDays') ?? '0');
  const children = Number(searchParams.get('children') ?? '0');
  const checkedBags = Number(searchParams.get('checkedBags') ?? '0');
  const maxStops = searchParams.get('maxStops');
  const airlines = searchParams.get('airlines');
  const departureTimeBuckets = searchParams.get('departureTimeBuckets');
  const maxLayoverMinutes = searchParams.get('maxLayoverMinutes');

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!from || !to) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetchFlights({
      from,
      to,
      date,
      returnDate,
      roundTrip,
      flexibleDates,
      flexibleDays: Number.isFinite(flexibleDays) ? flexibleDays : 0,
      cabinClass: cabin,
      passengers: Number(passengers),
      children,
      bags: bags ? bags.split(',').filter(Boolean) : [],
      checkedBags,
      maxStops: maxStops ? Number(maxStops) : undefined,
      airlines: airlines ? airlines.split(',').filter(Boolean) : [],
      departureTimeBuckets: departureTimeBuckets ? departureTimeBuckets.split(',').filter(Boolean) : [],
      maxLayoverMinutes: maxLayoverMinutes ? Number(maxLayoverMinutes) : undefined,
    })
      .then((res) => setFlights(res ?? []))
      .catch((err) => console.error('Failed to fetch flights:', err))
      .finally(() => setLoading(false));
  }, [from, to, date, returnDate, roundTrip, flexibleDates, flexibleDays, cabin, passengers, children, bags, checkedBags, maxStops, airlines, departureTimeBuckets, maxLayoverMinutes]);

  const allAirlines = useMemo(
    () => [...new Set(flights.map((f) => f.airline))].sort((a, b) => a.localeCompare(b)),
    [flights],
  );

  const [filters, setFilters] = useState<Filters>(() => {
    if (typeof window !== 'undefined') {
      const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as {
            priceMin: string; priceMax: string; stops: number[]; airlines: string[]; durationMin: string; durationMax: string; cabinClass: string[]; departureTime: string[];
          };
          return {
            priceMin: parsed.priceMin ?? '',
            priceMax: parsed.priceMax ?? '',
            stops: new Set(parsed.stops ?? [0, 1, 2]),
            airlines: new Set(parsed.airlines ?? []),
            durationMin: parsed.durationMin ?? '',
            durationMax: parsed.durationMax ?? '',
            cabinClass: new Set(parsed.cabinClass ?? ['economy', 'premium_economy', 'business', 'first']),
            departureTime: new Set(parsed.departureTime ?? ['morning', 'afternoon', 'evening', 'redeye']),
          };
        } catch {
          // ignore invalid session payload
        }
      }
    }
    return {
      priceMin: '',
      priceMax: '',
      stops: new Set([0, 1, 2]),
      airlines: new Set<string>(),
      durationMin: '',
      durationMax: '',
      cabinClass: new Set(['economy', 'premium_economy', 'business', 'first']),
      departureTime: new Set(['morning', 'afternoon', 'evening', 'redeye']),
    };
  });

  const [sortBy, setSortBy] = useState<SortKey>(() => {
    if (typeof window !== 'undefined') {
      const sort = sessionStorage.getItem(SORT_STORAGE_KEY);
      if (sort === 'price' || sort === 'duration' || sort === 'departure') {
        return sort;
      }
    }
    return 'price';
  });
  const [showMiles, setShowMiles] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [savedFlights, setSavedFlights] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const payload = {
      ...filters,
      stops: [...filters.stops],
      airlines: [...filters.airlines],
      cabinClass: [...filters.cabinClass],
      departureTime: [...filters.departureTime],
    };
    sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(payload));
  }, [filters]);

  useEffect(() => {
    sessionStorage.setItem(SORT_STORAGE_KEY, sortBy);
  }, [sortBy]);

  const filteredFlights = useMemo(() => {
    return flights.filter((f) => {
      if (filters.priceMin && f.totalPrice < Number(filters.priceMin))
        return false;
      if (filters.priceMax && f.totalPrice > Number(filters.priceMax))
        return false;

      const stopBucket = Math.min(f.stops, 2);
      if (!filters.stops.has(stopBucket)) return false;

      const activeAirlines = filters.airlines.size > 0 ? filters.airlines : new Set(allAirlines);
      if (!activeAirlines.has(f.airline)) return false;

      if (
        filters.durationMin &&
        f.durationMinutes < Number(filters.durationMin) * 60
      )
        return false;
      if (
        filters.durationMax &&
        f.durationMinutes > Number(filters.durationMax) * 60
      )
        return false;

      if (!filters.cabinClass.has(f.cabinClass)) return false;
      if (!filters.departureTime.has(getTimeBucket(f.departureTime)))
        return false;

      return true;
    });
  }, [flights, filters, allAirlines]);

  const sortedFlights = useMemo(() => {
    const sorted = [...filteredFlights];
    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => a.totalPrice - b.totalPrice);
        break;
      case 'duration':
        sorted.sort((a, b) => a.durationMinutes - b.durationMinutes);
        break;
      case 'departure':
        sorted.sort(
          (a, b) =>
            timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime),
        );
        break;
    }
    return sorted;
  }, [filteredFlights, sortBy]);

  const handleSave = async (flight: Flight) => {
    const alreadySaved = savedFlights.has(flight.id);
    setSavedFlights((prev) => {
      const next = new Set(prev);
      if (next.has(flight.id)) next.delete(flight.id);
      else next.add(flight.id);
      return next;
    });
    if (!alreadySaved) {
      try {
        const token = await getToken();
        await apiFetch('/saved-flights', {
          method: 'POST',
          body: JSON.stringify({
            flightData: JSON.stringify(flight),
            route: `${flight.origin} → ${flight.destination}`,
            airlineCode: flight.airlineCode,
            airlineName: flight.airline,
            departureDate: flight.departureDate,
            totalPrice: flight.totalPrice,
            baseFare: flight.baseFare,
            bagFees: flight.bagFees,
            seatFees: flight.seatFees,
          }),
        }, token);
      } catch (err) {
        console.error('Failed to save flight:', err);
      }
    }
  };

  const sortLabel: Record<SortKey, string> = {
    price: 'total cost',
    duration: 'duration',
    departure: 'departure time',
  };

  const searchSummary = {
    from: from || 'Any',
    to: to || 'Anywhere',
    date: date || 'Flexible',
    passengers: `${passengers} pax`,
    cabin: cabin.replaceAll('_', ' ').replaceAll(/\b\w/g, (l) => l.toUpperCase()),
    bags,
  };

  /* ─── Filter sidebar content (shared between desktop sidebar & mobile drawer) ─── */
  const filterContent = (
    <div className="space-y-6">
      {/* Total Price */}
      <FilterSection title="Total Price">
        <p className="text-brand-blue text-xs mb-2">
          Includes bags + fees
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) =>
              setFilters((p) => ({ ...p, priceMin: e.target.value }))
            }
            className="w-full rounded-lg border border-border bg-paper px-3 py-1.5 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) =>
              setFilters((p) => ({ ...p, priceMax: e.target.value }))
            }
            className="w-full rounded-lg border border-border bg-paper px-3 py-1.5 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </FilterSection>

      {/* Stops */}
      <FilterSection title="Stops">
        {[
          { value: 0, label: 'Nonstop' },
          { value: 1, label: '1 stop' },
          { value: 2, label: '2+ stops' },
        ].map((opt) => (
          <Checkbox
            key={opt.value}
            label={opt.label}
            checked={filters.stops.has(opt.value)}
            onChange={() =>
              setFilters((p) => ({
                ...p,
                stops: toggleSet(p.stops, opt.value),
              }))
            }
          />
        ))}
      </FilterSection>

      {/* Airline */}
      <FilterSection title="Airline">
        {allAirlines.map((a) => (
          <Checkbox
            key={a}
            label={a}
            checked={filters.airlines.has(a)}
            onChange={() =>
              setFilters((p) => ({
                ...p,
                airlines: toggleSet(p.airlines, a),
              }))
            }
          />
        ))}
      </FilterSection>

      {/* Duration */}
      <FilterSection title="Duration (hours)">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.durationMin}
            onChange={(e) =>
              setFilters((p) => ({ ...p, durationMin: e.target.value }))
            }
            className="w-full rounded-lg border border-border bg-paper px-3 py-1.5 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.durationMax}
            onChange={(e) =>
              setFilters((p) => ({ ...p, durationMax: e.target.value }))
            }
            className="w-full rounded-lg border border-border bg-paper px-3 py-1.5 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </FilterSection>

      {/* Cabin Class */}
      <FilterSection title="Cabin Class">
        {CABIN_OPTIONS.map((opt) => (
          <Checkbox
            key={opt.value}
            label={opt.label}
            checked={filters.cabinClass.has(opt.value)}
            onChange={() =>
              setFilters((p) => ({
                ...p,
                cabinClass: toggleSet(p.cabinClass, opt.value),
              }))
            }
          />
        ))}
      </FilterSection>

      {/* Departure Time */}
      <FilterSection title="Departure Time">
        {TIME_OPTIONS.map((opt) => (
          <Checkbox
            key={opt.value}
            label={`${opt.label} (${opt.sub})`}
            checked={filters.departureTime.has(opt.value)}
            onChange={() =>
              setFilters((p) => ({
                ...p,
                departureTime: toggleSet(p.departureTime, opt.value),
              }))
            }
          />
        ))}
      </FilterSection>
    </div>
  );

  return (
    <div className="min-h-screen bg-off">
      <Navbar searchSummary={searchSummary} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile filters toggle */}
        <button
          className="lg:hidden mb-4 flex items-center gap-2 rounded-full border border-border bg-paper px-4 py-2 text-sm font-display font-bold text-ink hover:bg-subtle transition-colors"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>

        {/* Mobile filters drawer */}
        {filtersOpen && (
          <div className="lg:hidden mb-6 bg-paper rounded-xl border border-border p-4">
            {filterContent}
          </div>
        )}

        <div className="flex gap-6">
          {/* ── Desktop Sidebar ── */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="sticky top-20 max-h-screen overflow-y-auto bg-paper rounded-xl border border-border p-4">
              {filterContent}
            </div>
          </aside>

          {/* ── Main Results ── */}
          <main className="flex-1 min-w-0">
            {/* Results summary bar */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 mb-4 px-4 py-3 rounded-[8px]"
              style={{ background: 'linear-gradient(135deg, #F8E5DE 0%, #F4F7FA 40%, #D5D1F4 100%)' }}
            >
              <p className="font-display text-[11px] font-bold text-ink">
                {sortedFlights.length} flight{sortedFlights.length !== 1 && 's'} · sorted by{' '}
                {sortLabel[sortBy]}
              </p>

              <div className="flex items-center gap-3">
                {/* Miles / Dollar Toggle */}
                <div className="flex items-center gap-2 text-sm font-body">
                  <span
                    className={showMiles ? 'text-muted' : 'font-semibold text-ink'}
                  >
                    $
                  </span>
                  <button
                    role="switch"
                    aria-checked={showMiles}
                    onClick={() => setShowMiles(!showMiles)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showMiles ? 'bg-brand-blue' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showMiles ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span
                    className={showMiles ? 'font-semibold text-ink' : 'text-muted'}
                  >
                    Miles
                  </span>
                </div>

                {/* Sort pills */}
                <div className="flex items-center gap-1">
                  <ArrowUpDown size={14} className="text-muted mr-1" />
                  {(
                    [
                      { key: 'price', label: 'Total Cost' },
                      { key: 'duration', label: 'Duration' },
                      { key: 'departure', label: 'Departure' },
                    ] as { key: SortKey; label: string }[]
                  ).map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSortBy(s.key)}
                      className={`rounded-full px-3 py-1 text-[10px] font-display font-bold border transition-all ${
                        sortBy === s.key
                          ? 'bg-brand-blue text-white border-brand-blue'
                          : 'bg-white text-muted border-border hover:border-brand-blue/30'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Flight cards */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <p className="font-display text-muted text-sm animate-pulse">Searching flights...</p>
              </div>
            ) : sortedFlights.length > 0 ? (
              <div className="space-y-3">
                {sortedFlights.map((flight, idx) => (
                  <div key={flight.id}>
                    {flight.priceHistory?.length > 0 && (
                      <div className="mb-1 text-[10px] font-body text-muted">
                        {(() => {
                          const avg = flight.priceHistory.reduce((acc, p) => acc + p.price, 0) / flight.priceHistory.length;
                          return flight.totalPrice <= avg
                            ? 'Prices are historically low right now.'
                            : 'Prices are trending higher than usual.';
                        })()}
                      </div>
                    )}
                    {showMiles && flight.milesEquivalent ? (
                      <div className="relative">
                        <FlightCard
                          flight={flight}
                          isBestValue={idx === 0}
                          onSelect={setSelectedFlight}
                          onSave={handleSave}
                          isSaved={savedFlights.has(flight.id)}
                        />
                        <div className="absolute top-4 right-24 bg-brand-dark-blue/90 text-white text-xs font-display font-bold px-3 py-1 rounded-full z-10">
                          {flight.milesEquivalent.toLocaleString()} miles
                        </div>
                      </div>
                    ) : (
                      <FlightCard
                        flight={flight}
                        isBestValue={idx === 0}
                        onSelect={setSelectedFlight}
                        onSave={handleSave}
                        isSaved={savedFlights.has(flight.id)}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Plane
                  size={48}
                  className="text-brand-light-blue mb-4"
                  strokeWidth={1.5}
                />
                <p className="font-display font-bold text-lg text-ink mb-1">
                  No flights match your filters
                </p>
                <p className="font-body text-sm text-muted max-w-sm">
                  Try adjusting your price range, stops, or departure time to
                  see more results.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Flight Detail Modal */}
      <FlightDetailModal
        flight={selectedFlight}
        isOpen={selectedFlight !== null}
        onClose={() => setSelectedFlight(null)}
        onSave={handleSave}
        isSaved={
          selectedFlight ? savedFlights.has(selectedFlight.id) : false
        }
      />
    </div>
  );
}

/* ─── Shared sub-components ─── */

const FILTER_SECTION_STYLES: Record<string, string> = {
  'Total Price': 'text-brand-dark-blue bg-brand-light-blue/50',
  'Stops': 'text-brand-dark-green bg-brand-light-green/50',
  'Airline': 'text-brand-dark-purple bg-brand-light-purple/50',
  'Duration (hours)': 'text-brand-dark-burgundy bg-brand-light-pink/50',
  'Cabin Class': 'text-brand-dark-blue bg-brand-light-yellow/50',
  'Departure Time': 'text-brand-purple bg-brand-light-purple/50',
};

function FilterSection({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  const style = FILTER_SECTION_STYLES[title] || 'text-muted';
  return (
    <div>
      <div className={`font-display text-[8px] font-bold tracking-widest uppercase px-2 py-1 rounded-[8px] mb-2 ${style}`}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: Readonly<{ label: string; checked: boolean; onChange: () => void }>) {
  return (
    <label className="flex items-center gap-2 cursor-pointer py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded border-border text-brand-dark-blue focus:ring-brand-blue accent-brand-dark-blue"
      />
      <span className="text-sm font-body text-ink">{label}</span>
    </label>
  );
}

/* ─── Page export wrapped in Suspense ─── */

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-off flex items-center justify-center">
          <div className="animate-pulse font-display text-muted text-sm">
            Loading flights...
          </div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
