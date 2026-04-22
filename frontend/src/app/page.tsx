'use client';

import Navbar from '@/components/Navbar';
import SearchBox from '@/components/SearchBox';
import QuizFlow from '@/components/QuizFlow';
import { fetchExploreDestinations, fetchFlights } from '@/lib/api';
import { getDestinationPhotoSync } from '@/lib/unsplash';
import type { Destination, Flight } from '@/lib/types';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Plane } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const POPULAR_DESTINATIONS = ['LAX', 'JFK', 'MIA', 'ORD', 'DEN', 'SEA', 'BOS', 'LAS'];

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const cardGradients = [
  'from-brand-dark-blue to-brand-blue',
  'from-brand-teal to-brand-light-blue',
  'from-brand-dark-green to-brand-green',
  'from-brand-blue to-brand-teal',
  'from-brand-dark-blue to-brand-teal',
  'from-brand-green to-brand-light-green',
  'from-brand-teal to-brand-blue',
  'from-brand-dark-green to-brand-dark-blue',
];

export default function Home() {
  const [mode, setMode] = useState<'destination' | 'quiz'>('destination');
  const [deals, setDeals] = useState<Destination[]>([]);
  const [todayFlights, setTodayFlights] = useState<Flight[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const planeY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const planeX = useTransform(scrollYProgress, [0, 1], [0, -60]);

  useEffect(() => {
    fetchExploreDestinations('ATL')
      .then((data) => setDeals(data.slice(0, 8)))
      .catch((err) => console.error('Failed to load explore destinations:', err));
  }, []);

  useEffect(() => {
    const dest = POPULAR_DESTINATIONS[Math.floor(Math.random() * POPULAR_DESTINATIONS.length)];
    fetchFlights({ from: 'ATL', to: dest, date: tomorrowISO(), cabinClass: 'economy', passengers: 1 })
      .then((flights) => setTodayFlights(flights.slice(0, 4)))
      .catch((err) => console.error('Failed to load today\'s flights:', err));
  }, []);

  const todayFlightsDest = todayFlights[0]?.destination ?? '';

  return (
    <div className="min-h-screen bg-off">
      <Navbar />

      {/* Hero */}
      <div
        ref={heroRef}
        className="gradient-primary relative overflow-hidden min-h-[520px] flex flex-col items-center justify-center px-4 pb-24 pt-16"
      >
        {/* Plane silhouette parallax */}
        <motion.div
          style={{ y: planeY, x: planeX }}
          className="pointer-events-none absolute top-8 right-[-40px] md:right-12"
        >
          <Plane
            size={420}
            className="text-white opacity-[0.06] rotate-[-15deg]"
            strokeWidth={0.5}
          />
        </motion.div>

        {/* Hero content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center text-center max-w-2xl"
        >
          <p className="font-display font-semibold text-[8px] uppercase tracking-[0.2em] text-white/45 mb-4">
            UNBIASED. TRANSPARENT. YOURS.
          </p>
          <h1 className="font-display font-black text-[42px] md:text-[56px] text-white tracking-[-0.05em] leading-none mb-4">
            Where to?
          </h1>
          <p className="font-body text-white/80 text-lg max-w-xl mb-10">
            See every flight&apos;s true cost — bags, seats, all of it. We link
            you straight to the airline.
          </p>
        </motion.div>

        {/* Search box card */}
        <div className="bg-paper rounded-2xl shadow-xl p-6 max-w-4xl w-full mx-auto -mb-16 relative z-20">
          {mode === 'destination' ? (
            <SearchBox onSurpriseMe={() => setMode('quiz')} />
          ) : (
            <QuizFlow inline onClose={() => setMode('destination')} />
          )}
        </div>
      </div>

      {/* Flights taking off tomorrow */}
      {todayFlights.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-4">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-ink">
              Flights taking off tomorrow · ATL → {todayFlightsDest}
            </h2>
            <Link
              href={`/search?from=ATL&to=${todayFlightsDest}&date=${tomorrowISO()}`}
              className="text-sm font-body font-semibold text-brand-blue hover:text-brand-dark-blue"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {todayFlights.map((f) => (
              <Link
                key={f.id}
                href={`/search?from=ATL&to=${todayFlightsDest}&date=${tomorrowISO()}`}
                className="rounded-xl bg-paper border border-border p-4 hover:-translate-y-1 transition-transform duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-sm text-ink">{f.airline}</span>
                  <span className="font-display font-black text-brand-blue">${Math.round(f.totalPrice)}</span>
                </div>
                <p className="text-xs text-muted font-body">
                  {f.departureTime} → {f.arrivalTime} · {f.duration}
                </p>
                <p className="text-xs text-muted font-body mt-0.5">
                  {f.stops === 0 ? 'Nonstop' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Live Deals */}
      <section className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 ${todayFlights.length > 0 ? 'pt-8' : 'pt-24'}`}>
        <h2 className="font-display font-bold text-xl text-ink mb-6">
          Cheapest from ATL right now
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {deals.map((dest, i) => (
            <Link
              key={dest.code}
              href={`/search?from=ATL&to=${dest.code}`}
              className="group rounded-xl overflow-hidden bg-paper border border-border hover:-translate-y-1 transition-transform duration-200 shadow-sm hover:shadow-md"
            >
              {/* Photo + gradient overlay */}
              <div
                className="relative h-[140px] bg-cover bg-center overflow-hidden"
                style={{
                  backgroundImage: `url(${getDestinationPhotoSync(dest.city)})`,
                }}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cardGradients[i % cardGradients.length]} opacity-55`}
                  aria-hidden
                />
                {/* Weather badge */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-[#FEF8E5] px-3 py-1 text-xs font-body font-medium text-ink">
                  {dest.weather?.temp ?? 72}°F {dest.weather?.condition ?? 'Clear'}
                </div>
                {/* IATA overlay */}
                <span className="absolute bottom-2 left-3 z-10 font-display font-black text-[40px] leading-none text-white/60">
                  {dest.code}
                </span>
              </div>

              {/* Card body */}
              <div className="p-4">
                <p className="font-display font-bold text-sm text-ink">
                  {dest.city}
                </p>
                <p className="font-display font-bold text-brand-blue mt-1">
                  From ${Math.round(dest.cheapestPrice)}
                </p>
                <p className="text-xs text-muted mt-1">
                  Carry-on incl. · Nonstop
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Rainbow accent bar */}
      <div className="gradient-rainbow h-[3px] w-full" />
    </div>
  );
}
