'use client';

import { useState } from 'react';

interface AirlineLogoProps {
  iataCode: string;
  airlineName: string;
  size?: number;
  className?: string;
}

export default function AirlineLogo({ iataCode, airlineName, size = 34, className = '' }: Readonly<AirlineLogoProps>) {
  const [failed, setFailed] = useState(false);
  const logoUrl = `https://content.airhex.com/content/logos/airlines_${iataCode}_200_200_s.png`;

  return (
    <div
      className={`rounded-lg overflow-hidden bg-white border border-border flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {!failed ? (
        <img
          src={logoUrl}
          alt={`${airlineName} logo`}
          width={size - 8}
          height={size - 8}
          className="object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-display text-[7px] font-bold text-muted">{iataCode}</span>
      )}
    </div>
  );
}
