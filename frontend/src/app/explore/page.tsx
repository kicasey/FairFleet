'use client';

import Navbar from '@/components/Navbar';
import QuizFlow from '@/components/QuizFlow';
import MapCursorEffect from '@/components/MapCursorEffect';
import { fetchExploreDestinations, fetchFlights } from '@/lib/api';
import { getDestinationPhotoSync } from '@/lib/unsplash';
import { Destination, Flight } from '@/lib/types';
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  List,
  Sparkles,
  Globe,
  Calendar,
  DollarSign,
  Plane,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

const geoUrl =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

type ViewMode = 'map' | 'list' | 'quiz';
type SortKey = 'city' | 'cheapestPrice' | 'flightTime' | 'stops';
type SortDir = 'asc' | 'desc';

const CONTINENTS = [
  'All',
  'North America',
  'Europe',
  'Asia',
  'Caribbean',
  'South America',
  'Oceania',
] as const;

const PRICE_RANGES = ['$0-300', '$300-600', '$600+'] as const;
const DATE_FILTERS = ['All Dates', 'This Weekend', 'Next Month'] as const;
const CLASS_FILTERS = ['Economy', 'Business'] as const;

const CONTINENT_POSITIONS: Record<
  string,
  { center: [number, number]; zoom: number }
> = {
  All: { center: [0, 20], zoom: 1 },
  'North America': { center: [-100, 40], zoom: 2.5 },
  Europe: { center: [15, 50], zoom: 3.5 },
  Asia: { center: [100, 35], zoom: 2.5 },
  Caribbean: { center: [-70, 18], zoom: 4 },
  'South America': { center: [-60, -15], zoom: 2 },
  Oceania: { center: [135, -25], zoom: 3 },
};

const ATL_COORDS: [number, number] = [-84.4277, 33.6407];

function getTomorrowDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function priceTier(price: number): 'cheap' | 'mid' | 'expensive' {
  if (price < 250) return 'cheap';
  if (price <= 500) return 'mid';
  return 'expensive';
}

function getTierGlowColor(tier: 'cheap' | 'mid' | 'expensive'): string {
  switch (tier) {
    case 'cheap': return '#7CD092';
    case 'mid': return '#6050E8';
    case 'expensive': return '#FFDC8C';
  }
}

function getTierTextColor(tier: 'cheap' | 'mid' | 'expensive'): string {
  switch (tier) {
    case 'cheap': return '#2D4637';
    case 'mid': return '#551E5F';
    case 'expensive': return '#7D283C';
  }
}

const TIER_TEXT_CLASS: Record<string, string> = {
  cheap: 'text-brand-dark-green',
  mid: 'text-brand-dark-purple',
  expensive: 'text-brand-dark-burgundy',
};

const TIER_DOT_CLASS: Record<string, string> = {
  cheap: 'bg-brand-green',
  mid: 'bg-brand-purple',
  expensive: 'bg-brand-yellow',
};

function Chip({
  active,
  onClick,
  children,
}: Readonly<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}>) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-body font-semibold transition-all whitespace-nowrap ${
        active
          ? 'bg-white text-brand-dark-blue shadow-sm'
          : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function parseFlight(ft: string): number {
  const h = /(\d+)h/.exec(ft);
  const m = /(\d+)m/.exec(ft);
  return (h ? Number.parseInt(h[1]) * 60 : 0) + (m ? Number.parseInt(m[1]) : 0);
}

export default function ExplorePage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [view, setView] = useState<ViewMode>('map');
  const [dateFilter, setDateFilter] = useState('All Dates');
  const [classFilter, setClassFilter] = useState('Economy');
  const [continent, setContinent] = useState('All');
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('cheapestPrice');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [selectedDestFlights, setSelectedDestFlights] = useState<Flight[]>([]);
  const [isLoadingSelectedDestFlights, setIsLoadingSelectedDestFlights] = useState(false);
  const [selectedDestFlightError, setSelectedDestFlightError] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 20],
    zoom: 1,
  });

  useEffect(() => {
    fetchExploreDestinations('ATL')
      .then((data) =>
        setDestinations(
          data.map((d) => ({
            ...d,
            flightTime: d.flightTime || 'N/A',
            tags: Array.isArray(d.tags) ? d.tags : [],
            weather: d.weather ?? { temp: 72, condition: 'Clear' },
          })),
        ),
      )
      .catch((err) => console.error('Failed to load explore destinations:', err));
  }, []);

  useEffect(() => {
    if (!selectedDest) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDestFlights([]);
      setSelectedDestFlightError(null);
      return;
    }

    setIsLoadingSelectedDestFlights(true);
    setSelectedDestFlightError(null);

    fetchFlights({
      from: 'ATL',
      to: selectedDest.code,
      date: getTomorrowDate(),
      cabinClass: 'economy',
      passengers: 1,
    })
      .then((flights) => setSelectedDestFlights(flights.slice(0, 3)))
      .catch((err) => {
        setSelectedDestFlights([]);
        setSelectedDestFlightError(err instanceof Error ? err.message : 'Unable to load live flights.');
      })
      .finally(() => setIsLoadingSelectedDestFlights(false));
  }, [selectedDest]);

  const markerScale = Math.max(0.4, Math.min(1.5, 1 / position.zoom));
  const labelScale = Math.max(0.4, Math.min(1.5, 1 / position.zoom));

  const filtered = useMemo(() => {
    let result = [...destinations];
    if (continent !== 'All')
      result = result.filter((d) => d.continent === continent);
    if (priceRange) {
      result = result.filter((d) => {
        if (priceRange === '$0-300') return d.cheapestPrice <= 300;
        if (priceRange === '$300-600')
          return d.cheapestPrice > 300 && d.cheapestPrice <= 600;
        return d.cheapestPrice > 600;
      });
    }
    if (dateFilter === 'This Weekend') {
      result = result.filter((d) => {
        const hours = parseFlight(d.flightTime);
        return hours <= 360;
      });
    } else if (dateFilter === 'Next Month') {
      // All destinations available for next month (no date-specific filtering on static data)
    }
    if (classFilter === 'Business') {
      result = result.filter((d) => d.cheapestPrice >= 300);
    }
    return result;
  }, [destinations, continent, priceRange, dateFilter, classFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'city':
          cmp = a.city.localeCompare(b.city);
          break;
        case 'cheapestPrice':
          cmp = a.cheapestPrice - b.cheapestPrice;
          break;
        case 'flightTime':
          cmp = parseFlight(a.flightTime) - parseFlight(b.flightTime);
          break;
        default:
          cmp = a.cheapestPrice - b.cheapestPrice;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const recommended = useMemo(() => {
    return [...destinations]
      .sort((a, b) => a.cheapestPrice - b.cheapestPrice)
      .slice(0, 8);
  }, [destinations]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function handleMarkerClick(dest: Destination, e: React.MouseEvent) {
    e.stopPropagation();
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSelectedDest(dest);
    setPopupPos({
      x: Math.min(Math.max(e.clientX - rect.left + 12, 8), rect.width - 280),
      y: Math.min(Math.max(e.clientY - rect.top - 30, 8), rect.height - 250),
    });
  }

  return (
    <div className="min-h-screen bg-off">
      <Navbar />

      {/* Hero */}
      <div className="gradient-primary relative overflow-hidden">
        <Plane
          size={320}
          className="pointer-events-none absolute -top-4 -right-12 text-white opacity-[0.05] rotate-[-15deg]"
          strokeWidth={0.5}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-6">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display font-black text-3xl text-white mb-6"
          >
            Explore Destinations
          </motion.h1>

          {/* View tabs */}
          <div className="flex items-center gap-2 mb-4">
            <Chip active={view === 'map'} onClick={() => setView('map')}>
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Heat Map
              </span>
            </Chip>
            <Chip active={view === 'list'} onClick={() => setView('list')}>
              <span className="flex items-center gap-1.5">
                <List className="h-3.5 w-3.5" />
                List View
              </span>
            </Chip>
            <Chip active={view === 'quiz'} onClick={() => setView('quiz')}>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Quiz
              </span>
            </Chip>
          </div>

          {/* Filter chips */}
          {view !== 'quiz' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2.5"
            >
              {/* Date & class */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <Calendar className="h-3.5 w-3.5 text-white/50 shrink-0" />
                {DATE_FILTERS.map((d) => (
                  <Chip
                    key={d}
                    active={dateFilter === d}
                    onClick={() => setDateFilter(d)}
                  >
                    {d}
                  </Chip>
                ))}
                <div className="w-px h-5 bg-white/20 shrink-0 mx-1" />
                {CLASS_FILTERS.map((c) => (
                  <Chip
                    key={c}
                    active={classFilter === c}
                    onClick={() => setClassFilter(c)}
                  >
                    {c}
                  </Chip>
                ))}
              </div>

              {/* Continent & price */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <Filter className="h-3.5 w-3.5 text-white/50 shrink-0" />
                {CONTINENTS.map((c) => (
                  <Chip
                    key={c}
                    active={continent === c}
                    onClick={() => {
                      setContinent(c);
                      const target = CONTINENT_POSITIONS[c] ?? CONTINENT_POSITIONS.All;
                      setPosition({ coordinates: target.center, zoom: target.zoom });
                      setSelectedDest(null);
                    }}
                  >
                    {c}
                  </Chip>
                ))}
                <div className="w-px h-5 bg-white/20 shrink-0 mx-1" />
                <DollarSign className="h-3.5 w-3.5 text-white/50 shrink-0" />
                {PRICE_RANGES.map((p) => (
                  <Chip
                    key={p}
                    active={priceRange === p}
                    onClick={() =>
                      setPriceRange(priceRange === p ? null : p)
                    }
                  >
                    {p}
                  </Chip>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* ── Heat Map View ── */}
        {view === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <div
                ref={mapRef}
                className="relative rounded-[14px] overflow-hidden border border-border"
                style={{ background: '#DCE8F0', height: 460, cursor: 'none' }}
                onClick={() => setSelectedDest(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSelectedDest(null);
                }}
              >
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ scale: 140 }}
                  width={900}
                  height={460}
                  style={{ width: '100%', height: '100%', display: 'block' }}
                >
                  <ZoomableGroup
                    center={position.coordinates}
                    zoom={position.zoom}
                    onMoveEnd={setPosition}
                    minZoom={1}
                    maxZoom={8}
                  >
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="#EBF1F7"
                            stroke="#D4DDE8"
                            strokeWidth={0.5 / position.zoom}
                            style={{
                              default: { outline: 'none' },
                              hover: { fill: '#D5D1F4', outline: 'none' },
                              pressed: { fill: '#B5E4F3', outline: 'none' },
                            }}
                          />
                        ))
                      }
                    </Geographies>

                    {/* ATL home pin */}
                    <Marker coordinates={ATL_COORDS}>
                      <g transform={`scale(${markerScale})`}>
                        <circle r={14} fill="rgba(124,208,146,0.15)" />
                        <circle
                          r={5}
                          fill="#0C1464"
                          stroke="#E3F8E9"
                          strokeWidth={2.5}
                        />
                      </g>
                      <g transform={`translate(0,${-14 * markerScale}) scale(${labelScale})`}>
                        <rect
                          x={-12}
                          y={-6.5}
                          width={24}
                          height={13}
                          rx={6.5}
                          fill="#E3F8E9"
                        />
                        <text
                          textAnchor="middle"
                          y={3.5}
                          style={{
                            fontSize: '7.5px',
                            fontWeight: 800,
                            fill: '#0C1464',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          ATL
                        </text>
                      </g>
                    </Marker>

                    {/* Destination markers — zoom-responsive */}
                    {filtered.map((dest) => {
                      const tier = priceTier(dest.cheapestPrice);
                      const priceStr = `$${dest.cheapestPrice}`;
                      const labelW = priceStr.length * 4.2 + 12;

                      return (
                        <Marker
                          key={dest.code}
                          coordinates={[dest.lng, dest.lat]}
                        >
                          <g
                            onClick={(e) => handleMarkerClick(dest, e)}
                            style={{ cursor: 'pointer' }}
                            transform={`scale(${markerScale})`}
                          >
                            {/* Glow ring */}
                            <circle r={16} fill={getTierGlowColor(tier)} opacity={0.3} />
                            {/* Pin dot */}
                            <circle r={7} fill="#2875F1" stroke="white" strokeWidth={2} />
                            {/* Plane icon */}
                            <text textAnchor="middle" y={2} fontSize={6} fill="white">✈</text>
                          </g>
                          {/* Price label — scales independently */}
                          <g transform={`translate(0, ${22 * markerScale}) scale(${labelScale})`}>
                            <rect
                              x={-labelW / 2}
                              y={-8}
                              width={labelW}
                              height={16}
                              rx={8}
                              fill="white"
                              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
                            />
                            <text
                              textAnchor="middle"
                              y={3}
                              style={{
                                fontSize: '8px',
                                fontWeight: 700,
                                fill: getTierTextColor(tier),
                                fontFamily: 'var(--font-display)',
                              }}
                            >
                              {priceStr}
                            </text>
                          </g>
                        </Marker>
                      );
                    })}
                  </ZoomableGroup>
                </ComposableMap>

                {/* Map cursor effect */}
                <MapCursorEffect containerRef={mapRef} />

                {/* Legend */}
                <div className="absolute bottom-3 left-3 z-30 pointer-events-none rounded-lg bg-white/80 backdrop-blur-sm px-3.5 py-2.5 flex flex-col gap-1.5">
                  {[
                    { label: 'Under $250', color: '#7CD092' },
                    { label: '$250–$500', color: '#6050E8' },
                    { label: '$500+', color: '#FFDC8C' },
                  ].map((entry) => (
                    <div
                      key={entry.label}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-[10px] font-body text-muted">
                        {entry.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Popup card with photo header */}
                <AnimatePresence>
                  {selectedDest && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-30 w-[260px] rounded-[14px] overflow-hidden shadow-xl border border-border bg-paper"
                      style={{ left: popupPos.x, top: popupPos.y }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Photo header */}
                      <div className="relative h-[80px] overflow-hidden">
                        <img
                          src={getDestinationPhotoSync(selectedDest.city)}
                          alt={selectedDest.city}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <h4 className="font-display text-sm font-bold text-white">
                            {selectedDest.city} ({selectedDest.code})
                          </h4>
                          <span className="text-[9px] text-white/70">
                            {selectedDest.weather?.temp ?? 72}°F · {selectedDest.weather?.condition ?? 'Clear'} · {selectedDest.flightTime || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="px-3 py-2 text-xs text-muted font-body">
                        Live fares from Google Flights. Current lowest starts at ${Math.round(selectedDest.cheapestPrice)}.
                      </div>
                      <div className="px-3 pb-2 pt-1">
                        <p className="text-[10px] font-display font-semibold uppercase tracking-wide text-muted mb-1.5">
                          Top Live Options
                        </p>
                        {isLoadingSelectedDestFlights && (
                          <p className="text-[10px] font-body text-muted">Loading flights...</p>
                        )}
                        {!isLoadingSelectedDestFlights && selectedDestFlightError && (
                          <p className="text-[10px] font-body text-brand-dark-burgundy">
                            {selectedDestFlightError}
                          </p>
                        )}
                        {!isLoadingSelectedDestFlights &&
                          !selectedDestFlightError &&
                          selectedDestFlights.length === 0 && (
                            <p className="text-[10px] font-body text-muted">No live options found right now.</p>
                          )}
                        {!isLoadingSelectedDestFlights &&
                          !selectedDestFlightError &&
                          selectedDestFlights.length > 0 && (
                            <div className="space-y-1.5">
                              {selectedDestFlights.map((flight) => (
                                <div
                                  key={flight.id}
                                  className="rounded-lg border border-subtle bg-off px-2 py-1.5 text-[10px] font-body text-ink"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold">{flight.airline}</span>
                                    <span className="font-display font-bold text-brand-blue">
                                      ${Math.round(flight.totalPrice)}
                                    </span>
                                  </div>
                                  <div className="text-muted">
                                    {flight.departureTime} to {flight.arrivalTime} · {flight.duration}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>

                      {/* CTA */}
                      <div className="px-3 py-2 text-center border-t border-subtle">
                        <Link
                          href={`/search?from=ATL&to=${selectedDest.code}`}
                          className="text-brand-blue font-semibold text-[10px] hover:underline"
                        >
                          See all flights to {selectedDest.city} →
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <Globe className="h-12 w-12 text-muted mx-auto mb-4 opacity-40" />
                  <p className="font-display font-bold text-sm text-ink mb-1">
                    No destinations found
                  </p>
                  <p className="text-xs font-body text-muted">
                    Try adjusting your filters
                  </p>
                </div>
              )}
            </section>

            {/* You May Also Like */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
              <h2 className="font-display font-bold text-lg text-ink mb-4">
                You May Also Like
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                {recommended.map((dest) => (
                  <Link
                    key={dest.code}
                    href={`/search?from=ATL&to=${dest.code}`}
                    className="shrink-0 w-56 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div
                      className="relative h-[70px] bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${getDestinationPhotoSync(dest.city)})`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/25" />
                      <span className="absolute bottom-1.5 left-2.5 z-[1] font-display font-black text-2xl leading-none text-white/90 drop-shadow-sm">
                        {dest.code}
                      </span>
                      <span className="absolute top-1.5 right-2.5 z-[1] font-display font-bold text-[10px] text-white drop-shadow-sm">
                        {dest.city}
                      </span>
                    </div>
                    <div className="bg-paper p-3 border border-t-0 border-border">
                      <p className="font-display text-[10px] font-bold text-ink">
                        {dest.city}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[9px] font-body text-muted">
                          {dest.flightTime || 'N/A'} · {dest.tags?.[0] ?? 'Popular'}
                        </span>
                      </div>
                      <p className="font-display font-extrabold text-sm text-brand-blue mt-1">
                        From ${dest.cheapestPrice}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {/* ── List View ── */}
        {view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="bg-subtle border-b border-border">
                        {(
                          [
                            { key: 'city', label: 'Destination' },
                            { key: 'cheapestPrice', label: 'Cheapest Price' },
                            { key: 'flightTime', label: 'Flight Time' },
                          ] as { key: SortKey; label: string }[]
                        ).map((col) => (
                          <th
                            key={col.key}
                            onClick={() => toggleSort(col.key)}
                            className="text-left px-4 py-3 font-display font-bold text-xs text-muted uppercase tracking-wider cursor-pointer hover:text-ink transition-colors select-none"
                          >
                            <span className="flex items-center gap-1.5">
                              {col.label}
                              {sortKey === col.key && (
                                <span className="text-brand-blue">
                                  {sortDir === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </span>
                          </th>
                        ))}
                        <th className="text-left px-4 py-3 font-display font-bold text-xs text-muted uppercase tracking-wider">
                          Stops
                        </th>
                        <th className="text-left px-4 py-3 font-display font-bold text-xs text-muted uppercase tracking-wider">
                          Airlines
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((dest, i) => {
                        const tier = priceTier(dest.cheapestPrice);
                        const tierText = TIER_TEXT_CLASS[tier];
                        const tierDot = TIER_DOT_CLASS[tier];
                        const airlines = 'Live search';
                        const stopsLabel = 'Varies';
                        const rowBg = i % 2 === 0 ? 'bg-paper' : 'bg-off';

                        return (
                          <tr
                            key={dest.code}
                            className={`border-b border-border last:border-0 transition-colors hover:bg-subtle/50 ${rowBg}`}
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${tierDot}`}
                                />
                                <div>
                                  <p className="font-display font-bold text-sm text-ink">
                                    {dest.city}
                                  </p>
                                  <p className="text-xs font-body text-muted">
                                    {dest.country} · {dest.code}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`font-display font-bold text-sm ${tierText}`}
                              >
                                ${dest.cheapestPrice}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-body text-sm text-ink">
                                {dest.flightTime}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-body text-sm text-ink">
                                {stopsLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-xs font-body text-muted">
                                {airlines}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <Link
                                href={`/search?from=ATL&to=${dest.code}`}
                                className="rounded-full bg-brand-blue px-3 py-1.5 text-xs font-body font-semibold text-white hover:bg-brand-dark-blue transition-colors inline-flex items-center gap-1"
                              >
                                <Plane className="h-3 w-3" />
                                Flights
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {sorted.length === 0 && (
                  <div className="text-center py-16">
                    <Globe className="h-12 w-12 text-muted mx-auto mb-4 opacity-40" />
                    <p className="font-display font-bold text-sm text-ink mb-1">
                      No destinations found
                    </p>
                    <p className="text-xs font-body text-muted">
                      Try adjusting your filters
                    </p>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        )}

        {/* ── Quiz View ── */}
        {view === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
              <QuizFlow inline onClose={() => setView('map')} />
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
