'use client';

import { useState, useEffect, Fragment } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Heart,
  Bell,
  ChevronDown,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PriceChart from '@/components/PriceChart';
import BagIndicator from '@/components/BagIndicator';
import ShareButton from '@/components/ShareButton';
import { apiFetch, fetchFlightById } from '@/lib/api';
import { getAirline, getFareClassesForAirline } from '@/data/airlines';
import type { Flight } from '@/lib/types';

function CostLine({
  label,
  value,
  included,
}: Readonly<{
  label: string;
  value: number;
  included?: boolean;
}>) {
  const renderValue = () => {
    if (included === undefined) {
      return <span className="text-ink">${value}</span>;
    }
    if (included) {
      return (
        <span className="text-brand-dark-green font-medium">Included</span>
      );
    }
    return (
      <span className="text-brand-dark-red font-medium">+${value}</span>
    );
  };

  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      {renderValue()}
    </div>
  );
}

export default function FlightDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [flight, setFlight] = useState<Flight | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [showFareClasses, setShowFareClasses] = useState(false);
  const [priceDropThreshold, setPriceDropThreshold] = useState('');
  const [priceRiseThreshold, setPriceRiseThreshold] = useState('');
  const [alertFrequency, setAlertFrequency] = useState<
    'immediate' | 'daily' | 'weekly'
  >('immediate');
  const [isSaved, setIsSaved] = useState(false);
  const [savedFlightId, setSavedFlightId] = useState<number | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    if (!id) return;
    fetchFlightById(id)
      .then((result) => setFlight(result))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-red/10 flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-brand-red" />
          </div>
          <h1 className="font-display font-black text-2xl text-ink mb-2">
            Flight Not Found
          </h1>
          <p className="font-body text-muted mb-6 max-w-md">
            We couldn&apos;t find a flight with ID &ldquo;{id}&rdquo;. It may
            have been removed or the link is incorrect.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-6 py-3 font-display font-bold text-sm text-white hover:bg-brand-dark-blue transition-colors shadow-cta"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </>
    );
  }

  if (!flight) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse font-display text-muted">
            Loading flight details…
          </div>
        </div>
      </>
    );
  }

  const airline = getAirline(flight.airlineCode);
  const fareClasses = getFareClassesForAirline(flight.airlineCode);

  const routeAirports = [
    flight.segments[0]?.departureAirport,
    ...flight.segments.map((s) => s.arrivalAirport),
  ];
  const routeString = routeAirports.filter(Boolean).join(' → ');
  const flightNumbers = flight.segments
    .map((s) => s.flightNumber)
    .join(' / ');

  const formatCabinClass = (cls: string) =>
    cls.replaceAll('_', ' ').replaceAll(/\b\w/g, (l) => l.toUpperCase());

  async function ensureSavedFlight(): Promise<number> {
    if (!flight) {
      throw new Error('Flight details are not loaded yet.');
    }
    if (savedFlightId) {
      return savedFlightId;
    }
    const token = await getToken();
    const saved = await apiFetch<{ id: number }>('/saved-flights', {
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
    setSavedFlightId(saved.id);
    setIsSaved(true);
    return saved.id;
  }

  async function handleSave() {
    try {
      await ensureSavedFlight();
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : 'Failed to save flight.');
    }
  }

  async function handleSaveAlert() {
    try {
      const idToConfigure = await ensureSavedFlight();
      const token = await getToken();
      await apiFetch(`/saved-flights/${idToConfigure}/alert`, {
        method: 'PUT',
        body: JSON.stringify({
          priceAlertEnabled: true,
          priceDropThreshold: priceDropThreshold ? Number(priceDropThreshold) : null,
          priceRiseThreshold: priceRiseThreshold ? Number(priceRiseThreshold) : null,
          alertFrequency,
        }),
      }, token);
      setAlertMessage('Alert saved successfully.');
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : 'Failed to save alert.');
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-off">
        {/* Back link */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-body text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={16} />
            Back to search results
          </Link>
        </div>

        {/* Gradient header */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="gradient-primary rounded-2xl p-6 sm:p-8">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
              {routeString}
            </h1>
            <p className="text-white/70 text-sm mt-2">
              {airline.name} &middot; {flightNumbers} &middot;{' '}
              {flight.departureDate} &middot;{' '}
              {formatCabinClass(flight.cabinClass)}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <BagIndicator
                included={flight.bags.personalItem.included}
                label="Personal"
                fee={flight.bags.personalItem.fee}
              />
              <BagIndicator
                included={flight.bags.carryOn.included}
                label="Carry-on"
                fee={flight.bags.carryOn.fee}
              />
              <BagIndicator
                included={flight.bags.checked.included}
                label="Checked"
                fee={flight.bags.checked.fee}
              />
            </div>
          </div>
        </div>

        {/* Two-column body */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column — Itinerary Timeline */}
            <div className="bg-paper rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="font-display font-bold text-sm text-ink mb-4">
                Itinerary
              </h2>
              <div className="relative">
                <div className="absolute left-[9px] top-3 bottom-3 w-0.5 bg-border" />

                {flight.segments.map((segment, idx) => {
                  const isLast = idx === flight.segments.length - 1;
                  const layover = flight.layovers[idx];

                  return (
                    <Fragment key={segment.flightNumber}>
                      {/* Departure */}
                      <div className="relative flex items-start gap-3 pb-4">
                        <div className="relative z-10 mt-1 w-5 flex-shrink-0 flex justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-dark-blue ring-2 ring-paper" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-sm text-ink">
                            {segment.departureTime}
                          </p>
                          <p className="text-xs text-muted">
                            {segment.departureAirport}
                          </p>
                          <p className="text-xs text-muted">
                            {segment.flightNumber} &middot;{' '}
                            {segment.aircraftType}
                          </p>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="relative flex items-start gap-3 pb-4">
                        <div className="w-5 flex-shrink-0" />
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          <Clock size={12} />
                          <span>{segment.duration}</span>
                        </div>
                      </div>

                      {/* Arrival */}
                      <div className="relative flex items-start gap-3 pb-4">
                        <div className="relative z-10 mt-1 w-5 flex-shrink-0 flex justify-center">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ring-2 ring-paper ${
                              isLast
                                ? 'bg-brand-teal'
                                : 'bg-brand-light-blue'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-display font-bold text-sm text-ink">
                            {segment.arrivalTime}
                          </p>
                          <p className="text-xs text-muted">
                            {segment.arrivalAirport}
                          </p>
                        </div>
                      </div>

                      {/* Layover */}
                      {layover && (
                        <div className="relative flex items-start gap-3 pb-4">
                          <div className="w-5 flex-shrink-0" />
                          <div className="flex-1 bg-brand-light-green/30 border border-brand-green/20 rounded-lg p-3">
                            <p className="font-display font-bold text-xs text-ink">
                              Layover {layover.duration} &mdash; Terminal{' '}
                              {layover.terminal}
                            </p>
                            {layover.foodSuggestions.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {layover.foodSuggestions.map((food) => (
                                  <li
                                    key={food.name}
                                    className="text-xs text-muted"
                                  >
                                    {food.name} ({food.type}) &middot; Gate{' '}
                                    {food.gate} &middot; {food.cost}
                                  </li>
                                ))}
                              </ul>
                            )}
                            <p className="text-xs mt-2 flex items-center gap-1">
                              {layover.bagsThrough ? (
                                <>
                                  <Check
                                    size={12}
                                    className="text-brand-dark-green"
                                  />
                                  <span className="text-brand-dark-green">
                                    Bags checked through
                                  </span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle
                                    size={12}
                                    className="text-brand-yellow"
                                  />
                                  <span className="text-brand-dark-red">
                                    Must re-check bags
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>

            {/* Right column — Cost & Actions */}
            <div className="space-y-5">
              {/* Cost Breakdown */}
              <div className="bg-paper rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="font-display font-bold text-sm text-ink mb-3">
                  Cost Breakdown
                </h2>
                <div className="space-y-2">
                  <CostLine label="Base fare" value={flight.baseFare} />
                  <CostLine label="Taxes & fees" value={flight.taxes} />
                  <CostLine
                    label="Carry-on"
                    value={flight.bags.carryOn.fee}
                    included={flight.bags.carryOn.included}
                  />
                  <CostLine
                    label="Checked bag"
                    value={flight.bags.checked.fee}
                    included={flight.bags.checked.included}
                  />
                  <CostLine
                    label="Seat selection"
                    value={flight.seatFees}
                    included={flight.seatSelectionIncluded}
                  />
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-display font-bold text-brand-dark-blue">
                      Total
                    </span>
                    <span className="font-display font-bold text-brand-dark-blue">
                      ${flight.totalPrice}
                    </span>
                  </div>
                </div>
              </div>

              {/* Book CTA */}
              <a
                href={flight.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-brand-blue text-white rounded-full py-3 font-display font-bold text-center shadow-cta hover:bg-brand-dark-blue transition-colors"
              >
                Book on {airline.name.split(' ')[0]}.com
              </a>
              <p className="text-[10px] text-muted text-center -mt-3">
                Opens airline&apos;s website directly
              </p>

              {/* Save to Profile */}
              <button
                className={`w-full rounded-full py-2.5 font-display font-bold text-sm transition-colors ${
                  isSaved
                    ? 'bg-brand-blue/10 border border-brand-blue text-brand-blue'
                    : 'border border-brand-blue text-brand-blue hover:bg-brand-blue/5'
                }`}
                onClick={handleSave}
              >
                <Heart
                  size={14}
                  className={`inline mr-1.5 ${
                    isSaved ? 'fill-brand-blue' : ''
                  }`}
                />
                {isSaved ? 'Saved' : 'Save to Profile'}
              </button>

              {/* Share */}
              <div className="flex justify-center">
                <ShareButton
                  url={`${globalThis.window === undefined ? '' : globalThis.location.origin}/flight/${flight.id}`}
                  title={`Flight deal: ${flight.origin} → ${flight.destination} for $${flight.totalPrice}`}
                />
              </div>

              {/* Price Alert */}
              <div className="bg-paper rounded-2xl border border-border p-6 shadow-sm">
                <button
                  className="flex items-center gap-2 text-sm font-display font-bold text-brand-blue hover:text-brand-dark-blue transition-colors"
                  onClick={() => setShowPriceAlert(!showPriceAlert)}
                >
                  <Bell size={16} />
                  Set Price Alert
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      showPriceAlert ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {showPriceAlert && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-3">
                        <div className="flex gap-3">
                          <label className="flex-1">
                            <span className="text-xs text-muted block mb-1">
                              Drop below $
                            </span>
                            <input
                              type="number"
                              value={priceDropThreshold}
                              onChange={(e) =>
                                setPriceDropThreshold(e.target.value)
                              }
                              placeholder={String(flight.totalPrice - 50)}
                              className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                            />
                          </label>
                          <label className="flex-1">
                            <span className="text-xs text-muted block mb-1">
                              Rise above $
                            </span>
                            <input
                              type="number"
                              value={priceRiseThreshold}
                              onChange={(e) =>
                                setPriceRiseThreshold(e.target.value)
                              }
                              placeholder={String(flight.totalPrice + 50)}
                              className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                            />
                          </label>
                        </div>

                        <div>
                          <span className="text-xs text-muted block mb-2">
                            Frequency
                          </span>
                          <div className="flex gap-2">
                            {(
                              ['immediate', 'daily', 'weekly'] as const
                            ).map((freq) => (
                              <label
                                key={freq}
                                className={`flex-1 text-center cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-display font-bold transition-colors ${
                                  alertFrequency === freq
                                    ? 'border-brand-blue bg-brand-blue/10 text-brand-dark-blue'
                                    : 'border-border text-muted hover:border-brand-light-blue'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="alertFrequency"
                                  value={freq}
                                  checked={alertFrequency === freq}
                                  onChange={() => setAlertFrequency(freq)}
                                  className="sr-only"
                                />
                                {freq.charAt(0).toUpperCase() + freq.slice(1)}
                              </label>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleSaveAlert}
                          className="w-full rounded-full bg-brand-blue text-white py-2 text-sm font-display font-bold hover:bg-brand-dark-blue transition-colors"
                        >
                          Save Alert
                        </button>
                        {alertMessage && (
                          <p className="text-xs text-muted">{alertMessage}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Fare Class Panel */}
              <div className="bg-paper rounded-2xl border border-border p-6 shadow-sm">
                <button
                  className="flex items-center gap-2 text-sm font-display font-bold text-muted hover:text-ink transition-colors w-full"
                  onClick={() => setShowFareClasses(!showFareClasses)}
                >
                  What this airline calls it
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      showFareClasses ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {showFareClasses && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 font-display font-bold text-muted">
                                Proprietary Term
                              </th>
                              <th className="text-left py-2 font-display font-bold text-muted">
                                Standard Label
                              </th>
                              <th className="text-left py-2 font-display font-bold text-muted">
                                Included
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {fareClasses.map((fc) => (
                              <tr
                                key={fc.proprietaryTerm}
                                className={`border-b border-border/50 ${
                                  fc.proprietaryTerm ===
                                  flight.proprietaryFareClass
                                    ? 'bg-brand-blue/5'
                                    : ''
                                }`}
                              >
                                <td className="py-2 font-display font-bold text-ink">
                                  {fc.proprietaryTerm}
                                </td>
                                <td className="py-2 text-muted">
                                  {fc.standardLabel}
                                </td>
                                <td className="py-2">
                                  <div className="flex flex-wrap gap-1">
                                    {fc.personalItemIncluded && (
                                      <span className="text-brand-dark-green">
                                        Personal
                                      </span>
                                    )}
                                    {fc.carryOnIncluded && (
                                      <span className="text-brand-dark-green">
                                        Carry-on
                                      </span>
                                    )}
                                    {fc.checkedBagIncluded && (
                                      <span className="text-brand-dark-green">
                                        Checked
                                      </span>
                                    )}
                                    {fc.seatSelectionIncluded && (
                                      <span className="text-brand-dark-green">
                                        Seat
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Full-width Price Chart */}
          <div className="mt-6 pb-12">
            <h2 className="font-display font-bold text-sm text-ink mb-3">
              30-Day Price History
            </h2>
            <PriceChart
              priceHistory={flight.priceHistory}
              currentPrice={flight.totalPrice}
            />
          </div>
        </div>
      </main>
    </>
  );
}
