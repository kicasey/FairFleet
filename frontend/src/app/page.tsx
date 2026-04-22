'use client';

import Navbar from '@/components/Navbar';
import SearchBox from '@/components/SearchBox';
import QuizFlow from '@/components/QuizFlow';
import { apiFetch, fetchDeals, fetchExploreDestinations } from '@/lib/api';
import { getDestinationPhotoSync } from '@/lib/unsplash';
import type { Destination } from '@/lib/types';
import { useAuth, useUser } from '@clerk/nextjs';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Plane } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

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
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();
  const [mode, setMode] = useState<'destination' | 'quiz'>('destination');
  const [deals, setDeals] = useState<Destination[]>([]);
  const [homeAirport, setHomeAirport] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const planeY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const planeX = useTransform(scrollYProgress, [0, 1], [0, -60]);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    async function load() {
      let origin: string | null = null;
      if (isSignedIn) {
        try {
          const token = await getToken();
          const profile = await apiFetch<{ homeAirportCode?: string }>('/user/profile', {}, token);
          if (profile.homeAirportCode) {
            origin = profile.homeAirportCode.toUpperCase();
          }
        } catch (err) {
          console.error('Failed to load profile for home airport:', err);
        }
      }

      if (cancelled) return;
      setHomeAirport(origin);

      try {
        const data = origin ? await fetchExploreDestinations(origin) : await fetchDeals();
        if (!cancelled) setDeals(data.slice(0, 8));
      } catch (err) {
        console.error('Failed to load deals:', err);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  const sectionHeading = homeAirport
    ? `Cheapest from ${homeAirport} right now`
    : 'Cheapest flights right now';
  const searchOrigin = homeAirport ?? 'ATL';

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

      {/* Live Deals */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-24">
        <h2 className="font-display font-bold text-xl text-ink mb-6">
          {sectionHeading}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {deals.map((dest, i) => (
            <Link
              key={dest.code}
              href={`/search?from=${dest.origin ?? searchOrigin}&to=${dest.code}`}
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
