'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

type SharedFolder = {
  name: string;
  ownerEmail?: string;
  flights: Array<{
    id: number;
    route: string;
    airlineName: string;
    totalPrice: number;
    departureDate: string;
  }>;
};

export default function SharedFolderPage() {
  const params = useParams();
  const token = params.token as string;
  const [folder, setFolder] = useState<SharedFolder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<SharedFolder>(`/folders/shared/${token}`)
      .then(setFolder)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load shared folder.'));
  }, [token]);

  return (
    <div className="min-h-screen bg-off">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display font-black text-2xl text-ink mb-4">
          {folder?.name ?? 'Shared Flight Folder'}
        </h1>
        {folder?.ownerEmail && (
          <p className="text-sm text-muted mb-4">Shared by {folder.ownerEmail}</p>
        )}
        {error && <p className="text-sm text-brand-dark-burgundy">{error}</p>}
        {!error && !folder && <p className="text-sm text-muted">Loading shared folder...</p>}
        {folder && (
          <div className="space-y-3">
            {folder.flights.map((flight) => (
              <div key={flight.id} className="rounded-xl border border-border bg-paper p-4">
                <p className="font-display font-bold text-sm text-ink">{flight.route}</p>
                <p className="text-xs text-muted">{flight.airlineName} · {flight.departureDate}</p>
                <p className="font-display font-bold text-brand-dark-blue mt-1">${flight.totalPrice}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
