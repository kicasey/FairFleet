'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  PlaneTakeoff,
  PlaneLanding,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
} from 'lucide-react';
import { findAirport, getAirport } from '@/data/airports';
import { airlines } from '@/data/airlines';
import type { Airport } from '@/lib/types';

interface SearchBoxProps {
  onSearch?: (params: SearchParams) => void;
  onSurpriseMe?: () => void;
  compact?: boolean;
}

interface SearchParams {
  from: string;
  to: string;
  departureDate: string;
  returnDate: string;
  roundTrip: boolean;
  flexible: boolean;
  adults: number;
  children: number;
  classes: string[];
  bags: string[];
  departureTimes: string[];
  maxStops: string;
  preferredAirlines: string[];
  maxLayover: string;
}

const CLASS_OPTIONS = ['Economy', 'Premium Economy', 'Business', 'First'];
const BAG_OPTIONS = ['Personal Item', 'Carry-on', 'Checked'];
const DEPARTURE_TIMES = [
  { label: 'Morning', range: '6-12' },
  { label: 'Afternoon', range: '12-5' },
  { label: 'Evening', range: '5-9' },
  { label: 'Red-eye', range: '9-6' },
];
const MAX_STOPS_OPTIONS = ['Any', 'Nonstop', '1 stop', '2+ stops'];
const AIRLINE_LIST = [
  { code: 'DL', name: 'Delta' },
  { code: 'AA', name: 'American' },
  { code: 'UA', name: 'United' },
  { code: 'WN', name: 'Southwest' },
  { code: 'NK', name: 'Spirit' },
  { code: 'F9', name: 'Frontier' },
  { code: 'B6', name: 'JetBlue' },
  { code: 'AS', name: 'Alaska' },
];
const MAX_LAYOVER_OPTIONS = ['Any', '2h', '4h', '6h', '8h'];

function AirportInput({
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  value: string;
  onChange: (code: string, display: string) => void;
  placeholder: string;
  icon: typeof PlaneTakeoff;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInput(q: string) {
    setQuery(q);
    if (q.length >= 1) {
      setResults(findAirport(q).slice(0, 6));
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  }

  function select(a: Airport) {
    const display = `${a.code} – ${a.city}`;
    setQuery(display);
    onChange(a.code, display);
    setOpen(false);
  }

  function commitManualAirport(raw: string) {
    const cleaned = raw.trim().toUpperCase();
    if (!cleaned) return;
    const code = cleaned.split(/[\s-]+/)[0];
    if (/^[A-Z]{3}$/.test(code)) {
      onChange(code, code);
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-off px-3 py-2.5 focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-light-blue/30 transition-all">
        <Icon className="h-4 w-4 text-muted shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => query.length >= 1 && setOpen(true)}
          onBlur={(e) => commitManualAirport(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commitManualAirport(query);
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-body text-ink placeholder:text-muted outline-none"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-paper shadow-lg overflow-hidden">
          {results.map((a) => (
            <button
              key={a.code}
              onClick={() => select(a)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-off transition-colors"
            >
              <span className="rounded-md bg-brand-dark-blue/10 px-2 py-0.5 font-display text-xs font-bold text-brand-dark-blue">
                {a.code}
              </span>
              <span className="text-sm font-body text-ink truncate">
                {a.city} – {a.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchBox({ onSearch, onSurpriseMe, compact }: Readonly<SearchBoxProps>) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'destination' | 'explore' | 'surprise'>('destination');

  const [fromCode, setFromCode] = useState('');
  const [fromDisplay, setFromDisplay] = useState('');
  const [toCode, setToCode] = useState('');
  const [toDisplay, setToDisplay] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [roundTrip, setRoundTrip] = useState(false);
  const [flexible, setFlexible] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [travelersOpen, setTravelersOpen] = useState(false);
  const travelersRef = useRef<HTMLDivElement>(null);

  const [selectedClasses, setSelectedClasses] = useState<string[]>([...CLASS_OPTIONS]);
  const [selectedBags, setSelectedBags] = useState<string[]>(['Personal Item', 'Carry-on']);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [departureTimes, setDepartureTimes] = useState<string[]>([]);
  const [maxStops, setMaxStops] = useState('Any');
  const [preferredAirlines, setPreferredAirlines] = useState<string[]>([]);
  const [maxLayover, setMaxLayover] = useState('Any');
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (travelersRef.current && !travelersRef.current.contains(e.target as Node))
        setTravelersOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleChip = useCallback((list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }, []);

  function handleSearch() {
    const normalizedFrom = fromCode.trim().toUpperCase();
    const normalizedTo = toCode.trim().toUpperCase();

    if (!getAirport(normalizedFrom)) {
      setSearchError('Enter a valid 3-letter departure airport code.');
      return;
    }

    if (!getAirport(normalizedTo)) {
      setSearchError('Enter a valid 3-letter destination airport code.');
      return;
    }

    if (normalizedFrom === normalizedTo) {
      setSearchError('Departure and destination airports must be different.');
      return;
    }

    setSearchError(null);

    const params: SearchParams = {
      from: normalizedFrom,
      to: normalizedTo,
      departureDate,
      returnDate,
      roundTrip,
      flexible,
      adults,
      children,
      classes: selectedClasses,
      bags: selectedBags,
      departureTimes,
      maxStops,
      preferredAirlines,
      maxLayover,
    };

    if (onSearch) {
      onSearch(params);
    } else {
      const query = new URLSearchParams();
      if (normalizedFrom) query.set('from', normalizedFrom);
      if (normalizedTo) query.set('to', normalizedTo);
      if (departureDate) query.set('date', departureDate);
      if (roundTrip && returnDate) query.set('returnDate', returnDate);
      query.set('passengers', String(adults));
      query.set('cabin', selectedClasses[0]?.toLowerCase().replace(' ', '_') ?? 'economy');
      if (children > 0) query.set('children', String(children));
      router.push(`/search?${query.toString()}`);
    }
  }

  function handleTabClick(tab: 'destination' | 'explore' | 'surprise') {
    setActiveTab(tab);
    if (tab === 'explore') router.push('/explore');
    if (tab === 'surprise') onSurpriseMe?.();
  }

  const travelersLabel = `${adults} Adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}`;

  /* ────── Compact variant for navbar embedding ────── */
  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2 rounded-full border border-border bg-off px-2 py-1">
          <AirportInput
            value={fromDisplay}
            onChange={(code, display) => {
              setFromCode(code);
              setFromDisplay(display);
              setSearchError(null);
            }}
            placeholder="From"
            icon={PlaneTakeoff}
          />
          <AirportInput
            value={toDisplay}
            onChange={(code, display) => {
              setToCode(code);
              setToDisplay(display);
              setSearchError(null);
            }}
            placeholder="To"
            icon={PlaneLanding}
          />
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="rounded-lg border border-border bg-paper px-2 py-1 text-xs font-body text-ink"
          />
          <button
            onClick={handleSearch}
            className="flex items-center gap-1 rounded-full bg-brand-blue px-4 py-1.5 text-xs font-body font-semibold text-white hover:bg-brand-dark-blue transition-colors shadow-cta"
          >
            <Search className="h-3 w-3" />
            Search
          </button>
        </div>
        {searchError && (
          <p className="mt-2 text-xs font-body text-brand-dark-burgundy">{searchError}</p>
        )}
      </>
    );
  }

  /* ────── Full variant ────── */
  return (
    <div className="rounded-2xl bg-paper border border-border shadow-xl shadow-brand-dark-blue/5 p-5 sm:p-7">
      {/* Tab pills */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'destination', label: 'Destination' },
          { key: 'explore', label: 'Explore' },
          { key: 'surprise', label: 'Surprise Me' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTabClick(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-body font-semibold transition-colors ${
              activeTab === key
                ? 'bg-white text-brand-dark-blue shadow-sm border border-border'
                : 'text-muted hover:text-ink hover:bg-off'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* From */}
        <AirportInput
          value={fromDisplay}
          onChange={(code, display) => {
            setFromCode(code);
            setFromDisplay(display);
            setSearchError(null);
          }}
          placeholder="From where?"
          icon={PlaneTakeoff}
        />

        {/* To */}
        <AirportInput
          value={toDisplay}
          onChange={(code, display) => {
            setToCode(code);
            setToDisplay(display);
            setSearchError(null);
          }}
          placeholder="To where?"
          icon={PlaneLanding}
        />

        {/* Dates */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-off px-3 py-2.5 focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-light-blue/30 transition-all">
            <Calendar className="h-4 w-4 text-muted shrink-0" />
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full bg-transparent text-sm font-body text-ink outline-none"
            />
          </div>
          <div className="flex items-center gap-3 px-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={roundTrip}
                onChange={(e) => setRoundTrip(e.target.checked)}
                className="accent-brand-blue h-3.5 w-3.5"
              />
              <span className="text-xs font-body text-muted">Round-trip</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={flexible}
                onChange={(e) => setFlexible(e.target.checked)}
                className="accent-brand-blue h-3.5 w-3.5"
              />
              <span className="text-xs font-body text-muted">Flexible</span>
            </label>
          </div>
          {roundTrip && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-off px-3 py-2.5 focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-light-blue/30 transition-all">
              <Calendar className="h-4 w-4 text-muted shrink-0" />
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-transparent text-sm font-body text-ink outline-none"
              />
            </div>
          )}
        </div>

        {/* Travelers */}
        <div ref={travelersRef} className="relative">
          <button
            onClick={() => setTravelersOpen(!travelersOpen)}
            className="flex w-full items-center gap-2 rounded-xl border border-border bg-off px-3 py-2.5 text-left hover:border-brand-blue transition-colors"
          >
            <Users className="h-4 w-4 text-muted shrink-0" />
            <span className="flex-1 text-sm font-body text-ink truncate">{travelersLabel}</span>
            <ChevronDown className={`h-4 w-4 text-muted transition-transform ${travelersOpen ? 'rotate-180' : ''}`} />
          </button>
          {travelersOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-paper shadow-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-body text-ink">Adults</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:bg-off transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-display font-bold text-ink">{adults}</span>
                  <button
                    onClick={() => setAdults(Math.min(9, adults + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:bg-off transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-body text-ink">Children</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:bg-off transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-display font-bold text-ink">{children}</span>
                  <button
                    onClick={() => setChildren(Math.min(9, children + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:bg-off transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chips row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CLASS_OPTIONS.map((cls) => (
          <button
            key={cls}
            onClick={() => toggleChip(selectedClasses, cls, setSelectedClasses)}
            className={`rounded-full px-3 py-1 text-xs font-body font-semibold transition-colors ${
              selectedClasses.includes(cls)
                ? 'bg-brand-blue/15 text-brand-dark-blue border border-brand-blue/30'
                : 'bg-off text-muted border border-border hover:bg-subtle'
            }`}
          >
            {cls}
          </button>
        ))}
        <span className="w-px h-6 bg-border self-center mx-1" />
        {BAG_OPTIONS.map((bag) => (
          <button
            key={bag}
            onClick={() => toggleChip(selectedBags, bag, setSelectedBags)}
            className={`rounded-full px-3 py-1 text-xs font-body font-semibold transition-colors ${
              selectedBags.includes(bag)
                ? 'bg-brand-green/15 text-brand-dark-green border border-brand-green/30'
                : 'bg-off text-muted border border-border hover:bg-subtle'
            }`}
          >
            {bag}
          </button>
        ))}
      </div>

      {/* Advanced Search toggle */}
      <button
        onClick={() => setAdvancedOpen(!advancedOpen)}
        className="flex items-center gap-1.5 text-xs font-body font-semibold text-muted hover:text-ink transition-colors mb-4"
      >
        {advancedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        Advanced Search
      </button>

      <AnimatePresence>
        {advancedOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 rounded-xl border border-border bg-off/50 p-4 mb-4">
              {/* Departure time */}
              <div>
                <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted mb-2">
                  Departure Time
                </p>
                <div className="space-y-1.5">
                  {DEPARTURE_TIMES.map(({ label, range }) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={departureTimes.includes(label)}
                        onChange={() => toggleChip(departureTimes, label, setDepartureTimes)}
                        className="accent-brand-blue h-3.5 w-3.5"
                      />
                      <span className="text-xs font-body text-ink">
                        {label} <span className="text-muted">({range})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Max stops */}
              <div>
                <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted mb-2">
                  Max Stops
                </p>
                <select
                  value={maxStops}
                  onChange={(e) => setMaxStops(e.target.value)}
                  className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm font-body text-ink outline-none focus:border-brand-blue"
                >
                  {MAX_STOPS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Preferred airlines */}
              <div>
                <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted mb-2">
                  Preferred Airlines
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {AIRLINE_LIST.map(({ code, name }) => (
                    <label key={code} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferredAirlines.includes(code)}
                        onChange={() => toggleChip(preferredAirlines, code, setPreferredAirlines)}
                        className="accent-brand-blue h-3.5 w-3.5"
                      />
                      <span className="text-xs font-body text-ink">{name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Max layover */}
              <div>
                <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted mb-2">
                  Max Layover
                </p>
                <select
                  value={maxLayover}
                  onChange={(e) => setMaxLayover(e.target.value)}
                  className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm font-body text-ink outline-none focus:border-brand-blue"
                >
                  {MAX_LAYOVER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search button */}
      <button
        onClick={handleSearch}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-blue px-6 py-3 font-body font-semibold text-white shadow-cta hover:bg-brand-dark-blue active:scale-[0.98] transition-all"
      >
        <Search className="h-4 w-4" />
        Search Flights
      </button>
      {searchError && (
        <p className="mt-2 text-center text-xs font-body text-brand-dark-burgundy">{searchError}</p>
      )}

      {/* Airline logos row */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        {AIRLINE_LIST.map(({ code }) => {
          const a = airlines[code];
          return (
            <span
              key={code}
              className="rounded-md px-2 py-0.5 text-[10px] font-display font-bold"
              style={{ backgroundColor: a?.bgColor, color: a?.color }}
            >
              {code}
            </span>
          );
        })}
      </div>
    </div>
  );
}
