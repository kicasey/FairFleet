'use client';

import { Fragment } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Flight } from '@/lib/types';
import AirlineLogo from '@/components/AirlineLogo';
import BagIndicator from '@/components/BagIndicator';
import { buildBookingUrl } from '@/lib/bookingUrls';

const AIRLINE_ACCENT_COLORS: Record<string, string> = {
  DL: '#0C1464',
  AA: '#FF4B4B',
  UA: '#2875F1',
  WN: '#FFDC8C',
  NK: '#696E28',
  F9: '#2D4637',
  B6: '#2196D4',
  AS: '#551E5F',
};

interface FlightCardProps {
  flight: Flight;
  isBestValue?: boolean;
  onSelect: (flight: Flight) => void;
  onSave?: (flight: Flight) => void;
  isSaved?: boolean;
  loyaltyPerks?: { freeBags: number };
}

export default function FlightCard({
  flight,
  isBestValue,
  onSelect,
  onSave,
  isSaved,
  loyaltyPerks,
}: Readonly<FlightCardProps>) {
  const hasFreeBags = loyaltyPerks !== undefined && loyaltyPerks.freeBags > 0;
  const carryOnIncluded = hasFreeBags || flight.bags.carryOn.included;
  const carryOnFee = flight.bags.carryOn.included ? undefined : (flight.bags.carryOn.fee || undefined);
  const carryOnPerk = hasFreeBags && !flight.bags.carryOn.included;
  const checkedIncluded = hasFreeBags || flight.bags.checked.included;
  const checkedFee = flight.bags.checked.included ? undefined : (flight.bags.checked.fee || undefined);
  const checkedPerk = hasFreeBags && !flight.bags.checked.included;
  const stopSuffix = flight.stops > 1 ? 's' : '';
  const stopsLabel = flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${stopSuffix}`;
  const accentColor = AIRLINE_ACCENT_COLORS[flight.airlineCode] || '#D4DDE8';

  const bookingHref = buildBookingUrl({
    airline: flight.airlineCode,
    origin: flight.origin,
    destination: flight.destination,
    departDate: flight.departureDate,
    passengers: 1,
    cabinClass: flight.cabinClass,
  });

  return (
    <article
      className={`relative bg-paper rounded-[14px] border-[1.5px] border-border hover:shadow-[0_4px_24px_rgba(10,22,40,0.10)] transition-all cursor-pointer ${
        isBestValue
          ? 'border-brand-blue shadow-md'
          : ''
      }`}
      style={{ borderLeftWidth: '3px', borderLeftColor: accentColor, padding: '16px 20px', paddingRight: '48px' }}
      onClick={() => onSelect(flight)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(flight); } }}
    >
      {/* Heart – absolute top-right, never overlaps price */}
      <motion.button
        whileTap={{ scale: 1.3 }}
        className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-light-rose transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onSave?.(flight);
        }}
        aria-label={isSaved ? 'Unsave flight' : 'Save flight'}
      >
        <Heart
          className={`w-[18px] h-[18px] ${
            isSaved
              ? 'fill-brand-red text-brand-red'
              : 'text-brand-dusty-rose'
          }`}
        />
      </motion.button>

      {/* Best Value badge */}
      {isBestValue && (
        <div className="absolute -top-px left-4 bg-brand-yellow-green text-white font-display text-[7px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-b-md">
          Best Value
        </div>
      )}

      {/* Desktop: 4-column grid */}
      <div className="hidden md:grid grid-cols-[50px_1.2fr_200px_auto] gap-4 items-center">
        {/* Col 1: Airline Logo */}
        <div className="flex justify-center">
          <AirlineLogo
            iataCode={flight.airlineCode}
            airlineName={flight.airline}
            size={34}
          />
        </div>

        {/* Col 2: Route & Times */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xs text-ink">
              {flight.departureTime}
            </span>
            <div className="flex items-center gap-1 flex-1">
              <div className="w-2 h-2 rounded-full bg-brand-blue shrink-0" />
              <div className="h-[1.5px] flex-1 bg-border" />
              {Array.from({ length: flight.stops }).map((_, i) => (
                <Fragment key={`stop-${flight.id}-${i}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-blue shrink-0" />
                  <div className="h-[1.5px] flex-1 bg-border" />
                </Fragment>
              ))}
              <div className="w-2 h-2 rounded-full bg-brand-teal shrink-0" />
            </div>
            <span className="font-display font-bold text-xs text-ink">
              {flight.arrivalTime}
            </span>
          </div>
          <p className="text-[9px] text-muted font-body mt-1">
            {flight.origin} → {flight.destination} · {flight.duration} ·{' '}
            {stopsLabel}
            {flight.stopCities &&
              flight.stopCities.length > 0 &&
              ` via ${flight.stopCities.join(', ')}`}
          </p>
        </div>

        {/* Col 3: Bag Inclusions – pill boxes in vertical column */}
        <div className="flex flex-col gap-1.5">
          <BagIndicator
            included={flight.bags.personalItem.included}
            label="Personal"
            fee={flight.bags.personalItem.fee || undefined}
          />
          <BagIndicator
            included={carryOnIncluded}
            label="Carry-on"
            fee={carryOnFee}
            statusPerk={carryOnPerk}
          />
          <BagIndicator
            included={checkedIncluded}
            label="Checked"
            fee={checkedFee}
            statusPerk={checkedPerk}
          />
          <BagIndicator
            included={flight.seatSelectionIncluded}
            label="Seat"
          />
        </div>

        {/* Col 4: Price & CTA */}
        <div className="text-right min-w-[130px]">
          <p
            className={`font-display font-black text-xl tracking-[-0.03em] ${
              isBestValue ? 'text-brand-dark-blue' : 'text-ink'
            }`}
          >
            ${flight.totalPrice}
          </p>
          <p className="text-[9px] text-muted font-body mt-0.5">
            ${flight.baseFare} fare + ${flight.bagFees + flight.seatFees}{' '}
            extras
          </p>
          <a
            href={bookingHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-block font-display text-[8px] font-bold tracking-wide px-5 py-2.5 rounded-full mt-2 transition-colors bg-brand-blue text-white shadow-cta hover:bg-brand-dark-blue"
          >
            Book on {flight.airline.split(' ')[0]} →
          </a>
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Airline + Route row */}
        <div className="flex items-center gap-3">
          <AirlineLogo
            iataCode={flight.airlineCode}
            airlineName={flight.airline}
            size={34}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xs text-ink">
                {flight.departureTime}
              </span>
              <div className="flex items-center gap-1 flex-1">
                <div className="w-2 h-2 rounded-full bg-brand-blue shrink-0" />
                <div className="h-[1.5px] flex-1 bg-border" />
                {Array.from({ length: flight.stops }).map((_, i) => (
                  <Fragment key={`m-stop-${flight.id}-${i}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-blue shrink-0" />
                    <div className="h-[1.5px] flex-1 bg-border" />
                  </Fragment>
                ))}
                <div className="w-2 h-2 rounded-full bg-brand-teal shrink-0" />
              </div>
              <span className="font-display font-bold text-xs text-ink">
                {flight.arrivalTime}
              </span>
            </div>
            <p className="text-[9px] text-muted font-body mt-1">
              {flight.origin} → {flight.destination} · {flight.duration} ·{' '}
              {stopsLabel}
              {flight.stopCities &&
                flight.stopCities.length > 0 &&
                ` via ${flight.stopCities.join(', ')}`}
            </p>
          </div>
        </div>

        {/* Bags + Price row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <BagIndicator
              included={flight.bags.personalItem.included}
              label="Personal"
              fee={flight.bags.personalItem.fee || undefined}
            />
            <BagIndicator
              included={carryOnIncluded}
              label="Carry-on"
              fee={carryOnFee}
              statusPerk={carryOnPerk}
            />
            <BagIndicator
              included={checkedIncluded}
              label="Checked"
              fee={checkedFee}
              statusPerk={checkedPerk}
            />
            <BagIndicator
              included={flight.seatSelectionIncluded}
              label="Seat"
            />
          </div>

          <div className="text-right shrink-0">
            <p
              className={`font-display font-black text-xl tracking-[-0.03em] ${
                isBestValue ? 'text-brand-dark-blue' : 'text-ink'
              }`}
            >
              ${flight.totalPrice}
            </p>
            <p className="text-[9px] text-muted font-body mt-0.5">
              ${flight.baseFare} fare + ${flight.bagFees + flight.seatFees}{' '}
              extras
            </p>
            <a
              href={bookingHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-block font-display text-[8px] font-bold tracking-wide px-5 py-2.5 rounded-full mt-2 transition-colors bg-brand-blue text-white shadow-cta hover:bg-brand-dark-blue"
            >
              Book on {flight.airline.split(' ')[0]} →
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
