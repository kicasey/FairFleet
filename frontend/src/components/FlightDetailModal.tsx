'use client';

import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Heart, Bell, ChevronDown, Check, AlertTriangle } from 'lucide-react';
import { Flight } from '@/lib/types';
import PriceChart from '@/components/PriceChart';
import ShareButton from '@/components/ShareButton';
import { getAirline, getFareClassesForAirline } from '@/data/airlines';
import { buildBookingUrl } from '@/lib/bookingUrls';

interface FlightDetailModalProps {
  flight: Flight | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (flight: Flight) => void;
  isSaved?: boolean;
}

export default function FlightDetailModal({
  flight,
  isOpen,
  onClose,
  onSave,
  isSaved,
}: Readonly<FlightDetailModalProps>) {
  const [isMobile, setIsMobile] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [showFareClasses, setShowFareClasses] = useState(false);
  const [priceDropThreshold, setPriceDropThreshold] = useState('');
  const [priceRiseThreshold, setPriceRiseThreshold] = useState('');
  const [alertFrequency, setAlertFrequency] = useState<
    'immediate' | 'daily' | 'weekly'
  >('immediate');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!flight) return null;

  const airline = getAirline(flight.airlineCode);
  const fareClasses = getFareClassesForAirline(flight.airlineCode);

  const routeAirports = [
    flight.segments[0]?.departureAirport,
    ...flight.segments.map((s) => s.arrivalAirport),
  ];
  const routeString = routeAirports.filter(Boolean).join(' \u2192 ');
  const flightNumbers = flight.segments
    .map((s) => s.flightNumber)
    .join(' / ');

  const formatCabinClass = (cls: string) =>
    cls.replaceAll('_', ' ').replaceAll(/\b\w/g, (l) => l.toUpperCase());

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full md:max-w-3xl max-h-[90vh] overflow-y-auto bg-paper rounded-t-2xl md:rounded-2xl shadow-2xl z-10"
            initial={
              isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95 }
            }
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
            exit={
              isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95 }
            }
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-20 p-1 rounded-full hover:bg-white/20 transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={24} className="text-white" />
            </button>

            {/* Header */}
            <div className="gradient-primary p-6 rounded-t-2xl">
              <h2 className="font-display font-black text-xl text-white">
                {routeString}
              </h2>
              <p className="text-white/70 text-sm mt-1">
                {airline.name} &middot; {flightNumbers} &middot;{' '}
                {flight.departureDate} &middot;{' '}
                {formatCabinClass(flight.cabinClass)}
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left column — Itinerary Timeline */}
                <div>
                  <h3 className="font-display font-bold text-sm text-ink mb-4">
                    Itinerary
                  </h3>
                  <div className="relative">
                    <div className="absolute left-[9px] top-3 bottom-3 w-0.5 bg-border" />

                    {flight.segments.map((segment, idx) => {
                      const isLast =
                        idx === flight.segments.length - 1;
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
                                  Layover {layover.duration} &mdash;
                                  Terminal {layover.terminal}
                                </p>
                                {layover.foodSuggestions.length > 0 && (
                                  <ul className="mt-2 space-y-1">
                                    {layover.foodSuggestions.map(
                                      (food) => (
                                        <li
                                          key={food.name}
                                          className="text-xs text-muted"
                                        >
                                          {food.name} ({food.type})
                                          &middot; Gate {food.gate}{' '}
                                          &middot; {food.cost}
                                        </li>
                                      ),
                                    )}
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

                {/* Right column — Cost Breakdown & Actions */}
                <div className="space-y-5">
                  {/* Cost Breakdown */}
                  <div>
                    <h3 className="font-display font-bold text-sm text-ink mb-3">
                      Cost Breakdown
                    </h3>
                    <div className="space-y-2">
                      <CostLine
                        label="Base fare"
                        value={flight.baseFare}
                      />
                      <CostLine
                        label="Taxes & fees"
                        value={flight.taxes}
                      />
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
                    href={buildBookingUrl({
                      airline: flight.airlineCode,
                      origin: flight.origin,
                      destination: flight.destination,
                      departDate: flight.departureDate,
                      passengers: 1,
                      cabinClass: flight.cabinClass,
                    })}
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
                  {onSave && (
                    <button
                      className={`w-full rounded-full py-2.5 font-display font-bold text-sm transition-colors ${
                        isSaved
                          ? 'bg-brand-blue/10 border border-brand-blue text-brand-blue'
                          : 'border border-brand-blue text-brand-blue hover:bg-brand-blue/5'
                      }`}
                      onClick={() => onSave(flight)}
                    >
                      <Heart
                        size={14}
                        className={`inline mr-1.5 ${
                          isSaved ? 'fill-brand-blue' : ''
                        }`}
                      />
                      {isSaved ? 'Saved' : 'Save to Profile'}
                    </button>
                  )}

                  {/* Share */}
                  <div className="flex justify-center">
                    <ShareButton
                      url={buildBookingUrl({
                        airline: flight.airlineCode,
                        origin: flight.origin,
                        destination: flight.destination,
                        departDate: flight.departureDate,
                        passengers: 1,
                        cabinClass: flight.cabinClass,
                      })}
                      title={`Flight deal: ${flight.origin} \u2192 ${flight.destination} for $${flight.totalPrice}`}
                    />
                  </div>

                  {/* Price Alert */}
                  <div>
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
                                  placeholder={String(
                                    flight.totalPrice - 50,
                                  )}
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
                                  placeholder={String(
                                    flight.totalPrice + 50,
                                  )}
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
                                  [
                                    'immediate',
                                    'daily',
                                    'weekly',
                                  ] as const
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
                                      checked={
                                        alertFrequency === freq
                                      }
                                      onChange={() =>
                                        setAlertFrequency(freq)
                                      }
                                      className="sr-only"
                                    />
                                    {freq.charAt(0).toUpperCase() +
                                      freq.slice(1)}
                                  </label>
                                ))}
                              </div>
                            </div>

                            <button className="w-full rounded-full bg-brand-blue text-white py-2 text-sm font-display font-bold hover:bg-brand-dark-blue transition-colors">
                              Save Alert
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fare Class Panel */}
                  <div className="border-t border-border pt-4">
                    <button
                      className="flex items-center gap-2 text-sm font-display font-bold text-muted hover:text-ink transition-colors w-full"
                      onClick={() =>
                        setShowFareClasses(!showFareClasses)
                      }
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

              {/* 30-Day Price History Chart */}
              <div className="mt-6">
                <h3 className="font-display font-bold text-sm text-ink mb-3">
                  30-Day Price History
                </h3>
                <PriceChart
                  priceHistory={flight.priceHistory}
                  currentPrice={flight.totalPrice}
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

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
