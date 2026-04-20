'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  MapPin,
  Briefcase,
  Bell,
  Heart,
  Plus,
  Trash2,
  Edit2,
  Users,
  Share2,
  FolderOpen,
  ChevronRight,
  Plane,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import PriceChart from '@/components/PriceChart';
import UserAvatar from '@/components/UserAvatar';
import FlightDetailModal from '@/components/FlightDetailModal';
import { dummyFlights } from '@/data/flights';
import type { Flight, SavedFlight, Folder, LoyaltyStatus } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const mockUser = {
  email: 'kate@example.com',
  firstName: 'Kate',
  lastName: 'Casey',
  homeAirportCode: 'ATL',
  defaultCabinClass: 'economy' as const,
  defaultBags: { personal: true, carryon: true, checked: 0 },
  phoneNumber: '(404) 555-0123',
};

const initialLoyaltyStatuses: LoyaltyStatus[] = [
  {
    id: 1,
    airlineCode: 'DL',
    airlineName: 'Delta Air Lines',
    statusTier: 'Gold Medallion',
    freeBags: 1,
  },
];

const initialSavedFlights: SavedFlight[] = [
  {
    id: 1,
    flight: dummyFlights[4],
    route: `${dummyFlights[4].origin} → ${dummyFlights[4].destination}`,
    priceAlertEnabled: true,
    priceDropThreshold: 300,
    priceRiseThreshold: 400,
    alertFrequency: 'immediate',
    priceChange: { amount: 18, direction: 'down' },
  },
  {
    id: 2,
    flight: dummyFlights[0],
    route: `${dummyFlights[0].origin} → ${dummyFlights[0].destination}`,
    priceAlertEnabled: true,
    alertFrequency: 'daily',
    priceChange: { amount: 25, direction: 'up' },
  },
  {
    id: 3,
    flight: dummyFlights[10],
    route: `${dummyFlights[10].origin} → ${dummyFlights[10].destination}`,
    priceAlertEnabled: false,
    alertFrequency: 'weekly',
    priceChange: { amount: 42, direction: 'down' },
  },
  {
    id: 4,
    flight: dummyFlights[3],
    route: `${dummyFlights[3].origin} → ${dummyFlights[3].destination}`,
    priceAlertEnabled: true,
    alertFrequency: 'immediate',
    priceChange: { amount: 8, direction: 'up' },
  },
  {
    id: 5,
    flight: dummyFlights[8],
    route: `${dummyFlights[8].origin} → ${dummyFlights[8].destination}`,
    priceAlertEnabled: false,
    alertFrequency: 'weekly',
    priceChange: { amount: 31, direction: 'down' },
  },
];

const initialFolders: Folder[] = [
  {
    id: 1,
    name: 'Spring Break 2026',
    flightCount: 3,
    collaborators: [{ id: 2, name: 'Sarah M.', permission: 'edit' }],
    shareToken: 'abc123',
    flights: [],
  },
  {
    id: 2,
    name: 'Summer Europe',
    flightCount: 2,
    collaborators: [],
    shareToken: 'def456',
    flights: [],
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const { getToken } = useAuth();
  const { user: clerkUser, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    async function syncUser() {
      try {
        const token = await getToken();
        const profile = await apiFetch<{ LoyaltyStatuses: LoyaltyStatus[] }>('/user/profile', {}, token);
        if (profile.LoyaltyStatuses) setLoyaltyStatuses(profile.LoyaltyStatuses);
      } catch (err) {
        console.error('Failed to sync user:', err);
      }
    }
    if (clerkUser) syncUser();
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const [loyaltyStatuses, setLoyaltyStatuses] = useState<LoyaltyStatus[]>(initialLoyaltyStatuses);
  const [savedFlights] = useState<SavedFlight[]>(initialSavedFlights);
  const [folders, setFolders] = useState<Folder[]>(initialFolders);

  const [selectedSaved, setSelectedSaved] = useState<SavedFlight | null>(null);
  const [detailFlight, setDetailFlight] = useState<Flight | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Loyalty form
  const [showLoyaltyForm, setShowLoyaltyForm] = useState(false);
  const [newAirline, setNewAirline] = useState('');
  const [newTier, setNewTier] = useState('');
  const [newFreeBags, setNewFreeBags] = useState(0);

  // Alert config
  const [alertDropBelow, setAlertDropBelow] = useState('');
  const [alertRiseAbove, setAlertRiseAbove] = useState('');
  const [weeklySummary, setWeeklySummary] = useState(true);

  // Folders
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<number | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [openFolder, setOpenFolder] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<'view' | 'edit'>('view');
  const [copiedShareLink, setCopiedShareLink] = useState<number | null>(null);

  // Preferences
  const [alertsOn, setAlertsOn] = useState(true);
  const [showEditPrefs, setShowEditPrefs] = useState(false);

  /* ---- Handlers ---- */

  async function addLoyaltyStatus() {
    if (!newAirline.trim() || !newTier.trim()) return;
    try {
      const token = await getToken();
      const airlines: Record<string, string> = {
        'Delta Air Lines': 'DL', 'American Airlines': 'AA', 'United Airlines': 'UA',
        'Southwest Airlines': 'WN', 'JetBlue Airways': 'B6', 'Alaska Airlines': 'AS',
      };
      const saved = await apiFetch<LoyaltyStatus>('/user/loyalty-status', {
        method: 'POST',
        body: JSON.stringify({
          airlineCode: airlines[newAirline] ?? newAirline.slice(0, 2).toUpperCase(),
          airlineName: newAirline,
          statusTier: newTier,
          freeBags: newFreeBags,
        }),
      }, token);
      setLoyaltyStatuses((prev) => [...prev, saved]);
    } catch (err) {
      console.error('Failed to add loyalty status:', err);
    }
    setNewAirline('');
    setNewTier('');
    setNewFreeBags(0);
    setShowLoyaltyForm(false);
  }

  async function removeLoyaltyStatus(id: number) {
    try {
      const token = await getToken();
      await apiFetch(`/user/loyalty-status/${id}`, { method: 'DELETE' }, token);
      setLoyaltyStatuses((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to remove loyalty status:', err);
    }
  }

  function selectSavedFlight(sf: SavedFlight) {
    setSelectedSaved(sf);
    setAlertDropBelow(sf.priceDropThreshold?.toString() ?? '');
    setAlertRiseAbove(sf.priceRiseThreshold?.toString() ?? '');
  }

  function openFlightDetail(flight: Flight) {
    setDetailFlight(flight);
    setShowDetailModal(true);
  }

  function createFolder() {
    if (!newFolderName.trim()) return;
    const folder: Folder = {
      id: Date.now(),
      name: newFolderName,
      flightCount: 0,
      collaborators: [],
      shareToken: Math.random().toString(36).slice(2, 8),
      flights: [],
    };
    setFolders((prev) => [...prev, folder]);
    setNewFolderName('');
    setShowNewFolder(false);
  }

  function deleteFolder(id: number) {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (openFolder === id) setOpenFolder(null);
    if (editingFolder === id) setEditingFolder(null);
  }

  function saveEditFolder(id: number) {
    if (!editFolderName.trim()) return;
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: editFolderName } : f)),
    );
    setEditingFolder(null);
  }

  function addCollaborator(folderId: number) {
    if (!inviteEmail.trim()) return;
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? {
              ...f,
              collaborators: [
                ...f.collaborators,
                { id: Date.now(), name: inviteEmail, permission: invitePermission },
              ],
            }
          : f,
      ),
    );
    setInviteEmail('');
  }

  function copyShareLink(folder: Folder) {
    navigator.clipboard.writeText(`https://fairfleet.app/shared/${folder.shareToken}`);
    setCopiedShareLink(folder.id);
    setTimeout(() => setCopiedShareLink(null), 2000);
  }

  /* ---- Derived data for price tracker ---- */
  const selectedFlight = selectedSaved?.flight ?? null;
  const priceHistory = selectedFlight?.priceHistory ?? [];
  const currentPrice = selectedFlight?.totalPrice ?? 0;

  const stats = priceHistory.length > 0
    ? {
        thirtyDaysAgo: priceHistory[0].price,
        lowest: Math.min(...priceHistory.map((p) => p.price)),
        avg: Math.round(priceHistory.reduce((a, b) => a + b.price, 0) / priceHistory.length),
      }
    : null;

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display font-black text-2xl text-ink mb-6">My Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* ============================================================ */}
          {/*  COLUMN 1 — Profile                                          */}
          {/* ============================================================ */}
          <div className="space-y-4">
            {/* Profile header */}
            <div className="rounded-xl border border-border p-4 bg-[#F0DCDE]">
            <div className="flex items-center gap-4">
              <UserAvatar name={mockUser.firstName} size="lg" />
              <div>
                <p className="font-display font-bold text-lg text-ink">
                  {mockUser.firstName} {mockUser.lastName}
                </p>
                <p className="text-sm text-muted font-body">{mockUser.email}</p>
                <p className="text-xs text-muted font-body mt-0.5">
                  Signed in &middot; Free account
                </p>
              </div>
            </div>
            </div>

            {/* Preferences */}
            <div className="rounded-xl border border-border p-4 bg-paper border-l-4 border-l-brand-blue">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-sm text-ink">Preferences</h2>
                <button
                  onClick={() => setShowEditPrefs(!showEditPrefs)}
                  className="flex items-center gap-1 text-xs text-brand-blue hover:text-brand-dark-blue font-body transition-colors"
                >
                  <Settings size={14} />
                  Edit Preferences
                </button>
              </div>

              <div className="space-y-2.5">
                <PrefRow icon={<MapPin size={14} />} label="Home airport">
                  <Chip color="blue">{mockUser.homeAirportCode}</Chip>
                </PrefRow>
                <PrefRow icon={<Briefcase size={14} />} label="Default class">
                  <Chip color="blue">Economy</Chip>
                </PrefRow>
                <PrefRow icon={<Briefcase size={14} />} label="Usual bags">
                  <Chip color="gray">Personal + Carry-on</Chip>
                </PrefRow>
                <PrefRow icon={<Bell size={14} />} label="Phone">
                  <span className="text-sm font-body text-ink">{mockUser.phoneNumber}</span>
                </PrefRow>
                <PrefRow icon={<Bell size={14} />} label="Price alerts">
                  <button
                    onClick={() => setAlertsOn(!alertsOn)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-display font-bold transition-colors ${
                      alertsOn
                        ? 'bg-brand-light-green text-brand-dark-green'
                        : 'bg-off text-muted'
                    }`}
                  >
                    {alertsOn ? 'On' : 'Off'}
                  </button>
                </PrefRow>
              </div>

              <AnimatePresence>
                {showEditPrefs && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-4 text-xs text-muted font-body italic">
                      Preferences editing coming soon — for now, these are demo defaults.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Airline Loyalty Status */}
            <div className="rounded-xl border border-border p-4 bg-[#D5D1F4]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-sm text-ink">Airline Status</h2>
                <button
                  onClick={() => setShowLoyaltyForm(!showLoyaltyForm)}
                  className="p-1 rounded-md hover:bg-off transition-colors text-brand-blue"
                  aria-label="Add loyalty status"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {loyaltyStatuses.map((ls) => (
                  <div
                    key={ls.id}
                    className="flex items-center gap-3 rounded-lg bg-off p-3 border-l-4 border-brand-purple"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm text-ink truncate">
                        {ls.airlineName}
                      </p>
                      <p className="text-xs text-muted font-body">{ls.statusTier}</p>
                      <p className="text-xs text-brand-purple font-body">
                        {ls.freeBags} free checked bag{ls.freeBags === 1 ? '' : 's'}
                      </p>
                    </div>
                    <button
                      onClick={() => removeLoyaltyStatus(ls.id)}
                      className="p-1 text-muted hover:text-brand-dark-red transition-colors shrink-0"
                      aria-label="Remove status"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {showLoyaltyForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2 rounded-lg border border-border p-3">
                      <select
                        value={newAirline}
                        onChange={(e) => setNewAirline(e.target.value)}
                        className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      >
                        <option value="">Select airline…</option>
                        <option value="Delta Air Lines">Delta Air Lines</option>
                        <option value="American Airlines">American Airlines</option>
                        <option value="United Airlines">United Airlines</option>
                        <option value="Southwest Airlines">Southwest Airlines</option>
                        <option value="JetBlue Airways">JetBlue Airways</option>
                        <option value="Alaska Airlines">Alaska Airlines</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Status tier (e.g. Gold Medallion)"
                        value={newTier}
                        onChange={(e) => setNewTier(e.target.value)}
                        className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                      <label className="flex items-center gap-2">
                        <span className="text-xs text-muted font-body whitespace-nowrap">
                          Free bags:
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={newFreeBags}
                          onChange={(e) => setNewFreeBags(Number(e.target.value))}
                          className="w-20 rounded-lg border border-border bg-paper px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                      </label>
                      <button
                        onClick={addLoyaltyStatus}
                        className="w-full rounded-full bg-brand-blue text-white py-2 text-sm font-display font-bold hover:bg-brand-dark-blue transition-colors"
                      >
                        Add Status
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Saved Flights List */}
            <div className="rounded-xl border border-border p-4 bg-[#B5E4F3]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-sm text-ink">
                  Saved Flights{' '}
                  <span className="text-muted font-body font-normal">({savedFlights.length})</span>
                </h2>
                <Heart size={16} className="text-brand-blue" />
              </div>

              <div className="space-y-1.5">
                {savedFlights.map((sf) => {
                  const isActive = selectedSaved?.id === sf.id;
                  return (
                    <button
                      key={sf.id}
                      onClick={() => selectSavedFlight(sf)}
                      className={`w-full text-left rounded-lg p-3 transition-colors ${
                        isActive
                          ? 'bg-brand-blue/10 border border-brand-blue'
                          : 'bg-off hover:bg-subtle border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-display font-bold text-sm text-ink">{sf.route}</p>
                        {sf.priceChange && (
                          <span
                            className={`flex items-center gap-0.5 text-xs font-display font-bold ${
                              sf.priceChange.direction === 'down'
                                ? 'text-brand-dark-green'
                                : 'text-brand-dark-red'
                            }`}
                          >
                            {sf.priceChange.direction === 'down' ? (
                              <TrendingDown size={12} />
                            ) : (
                              <TrendingUp size={12} />
                            )}
                            {sf.priceChange.direction === 'down' ? '↓' : '↑'} $
                            {sf.priceChange.amount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted font-body mt-0.5">
                        {sf.flight.departureDate} &middot; {sf.flight.airline}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-display font-bold text-brand-dark-blue text-sm">
                          ${sf.flight.totalPrice}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openFlightDetail(sf.flight);
                          }}
                          className="text-[10px] text-brand-blue hover:text-brand-dark-blue font-body flex items-center gap-0.5"
                        >
                          Details <ChevronRight size={10} />
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/*  COLUMN 2 — Price Tracker                                    */}
          {/* ============================================================ */}
          <div className="bg-paper rounded-xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={18} className="text-brand-teal" />
              <h2 className="font-display font-bold text-sm text-ink">Price Tracker</h2>
            </div>

            {selectedFlight ? (
              <>
                {/* Route header */}
                <div>
                  <p className="font-display font-bold text-lg text-ink">
                    {selectedSaved!.route}{' '}
                    <span className="font-body font-normal text-muted text-sm">
                      &middot; {selectedFlight.departureDate.replace(/^2026-0?/, '').replace('-', '/')}
                    </span>
                  </p>
                  <p className="text-xs text-muted font-body mt-0.5">
                    {selectedFlight.cabinClass === 'economy'
                      ? 'Economy'
                      : selectedFlight.cabinClass.replace('_', ' ')}{' '}
                    &middot; 1 adult &middot;{' '}
                    {selectedFlight.bags.checked.included ? '1 checked bag (free)' : 'No checked bag'}
                  </p>
                </div>

                {/* Price chart */}
                <PriceChart priceHistory={priceHistory} currentPrice={currentPrice} />

                {/* Stats row */}
                {stats && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-off rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted font-body uppercase tracking-wide">
                        30 days ago
                      </p>
                      <p className="font-display font-bold text-sm text-ink mt-0.5">
                        ${stats.thirtyDaysAgo}
                      </p>
                    </div>
                    <div className="bg-off rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted font-body uppercase tracking-wide">
                        Lowest seen
                      </p>
                      <p className="font-display font-bold text-sm text-brand-dark-green mt-0.5">
                        ${stats.lowest}
                      </p>
                    </div>
                    <div className="bg-off rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted font-body uppercase tracking-wide">
                        30-day avg
                      </p>
                      <p className="font-display font-bold text-sm text-ink mt-0.5">
                        ${stats.avg}
                      </p>
                    </div>
                  </div>
                )}

                {/* Trend insight */}
                {stats && (
                  <p className="text-sm text-brand-blue font-body">
                    {currentPrice <= stats.avg
                      ? 'Current price is below the 30-day average — a good time to book.'
                      : 'Current price is above the 30-day average — consider setting a price alert.'}
                  </p>
                )}

                {/* Alert configuration */}
                <div className="mt-4 rounded-xl border border-border p-4 space-y-3 bg-[#FEF8E5]">
                  <h3 className="font-display font-bold text-sm text-ink flex items-center gap-1.5">
                    <Bell size={14} /> Alert Configuration
                  </h3>

                  <label className="block">
                    <span className="text-xs text-muted font-body">Alert if price drops below</span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm text-ink">$</span>
                      <input
                        type="number"
                        value={alertDropBelow}
                        onChange={(e) => setAlertDropBelow(e.target.value)}
                        placeholder={String(currentPrice - 50)}
                        className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs text-muted font-body">Alert if price rises above</span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm text-ink">$</span>
                      <input
                        type="number"
                        value={alertRiseAbove}
                        onChange={(e) => setAlertRiseAbove(e.target.value)}
                        placeholder={String(currentPrice + 50)}
                        className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>
                  </label>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted font-body">Weekly summary email</span>
                    <button
                      onClick={() => setWeeklySummary(!weeklySummary)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        weeklySummary ? 'bg-brand-dark-green' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          weeklySummary ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <button className="w-full rounded-full bg-brand-blue text-white py-2.5 text-sm font-display font-bold hover:bg-brand-dark-blue transition-colors shadow-cta">
                    Save Alert Settings
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                <Plane size={40} className="text-border mb-3" />
                <p className="font-display font-bold text-sm text-muted">
                  Select a saved flight to view price tracking
                </p>
                <p className="text-xs text-muted font-body mt-1">
                  Click on any flight in your saved list
                </p>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  COLUMN 3 — Folders                                          */}
          {/* ============================================================ */}
          <div className="bg-[#F8E5DE] rounded-xl border border-border p-6 space-y-5 md:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-brand-teal" />
                <h2 className="font-display font-bold text-sm text-ink">Flight Folders</h2>
              </div>
              <button
                onClick={() => setShowNewFolder(!showNewFolder)}
                className="flex items-center gap-1 rounded-full bg-brand-blue text-white px-3 py-1.5 text-xs font-display font-bold hover:bg-brand-dark-blue transition-colors shadow-cta"
              >
                <Plus size={14} /> New Folder
              </button>
            </div>

            {/* New folder form */}
            <AnimatePresence>
              {showNewFolder && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="Folder name…"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                      className="flex-1 rounded-lg border border-border bg-paper px-3 py-2 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                    <button
                      onClick={createFolder}
                      className="rounded-lg bg-brand-blue text-white px-4 py-2 text-sm font-display font-bold hover:bg-brand-dark-blue transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Folder list */}
            <div className="space-y-3">
              {folders.map((folder) => {
                const isOpen = openFolder === folder.id;
                const isEditing = editingFolder === folder.id;

                return (
                  <div
                    key={folder.id}
                    className="rounded-xl border border-border bg-off overflow-hidden transition-shadow hover:shadow-sm"
                  >
                    {/* Folder header */}
                    <div className="p-4 flex items-center gap-3">
                      <FolderOpen size={18} className="text-brand-blue shrink-0" />
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editFolderName}
                              onChange={(e) => setEditFolderName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEditFolder(folder.id)}
                              className="flex-1 rounded-lg border border-border bg-paper px-2 py-1 text-sm font-display font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                              autoFocus
                            />
                            <button
                              onClick={() => saveEditFolder(folder.id)}
                              className="text-xs text-brand-dark-blue font-display font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingFolder(null)}
                              className="text-xs text-muted"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setOpenFolder(isOpen ? null : folder.id)}
                            className="text-left w-full"
                          >
                            <p className="font-display font-bold text-sm text-ink truncate">
                              {folder.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted font-body">
                                {folder.flightCount} flight{folder.flightCount === 1 ? '' : 's'}
                              </span>
                              {folder.collaborators.length > 0 && (
                                <span className="flex items-center gap-1 text-xs text-muted font-body">
                                  <Users size={10} />
                                  {folder.collaborators.length}
                                </span>
                              )}
                            </div>
                          </button>
                        )}
                      </div>

                      {/* Folder actions */}
                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingFolder(folder.id);
                              setEditFolderName(folder.name);
                            }}
                            className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-paper transition-colors"
                            aria-label="Edit folder"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteFolder(folder.id)}
                            className="p-1.5 rounded-md text-muted hover:text-brand-dark-red hover:bg-paper transition-colors"
                            aria-label="Delete folder"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={() => copyShareLink(folder)}
                            className="p-1.5 rounded-md text-muted hover:text-brand-blue hover:bg-paper transition-colors"
                            aria-label="Share folder"
                          >
                            <Share2 size={14} />
                          </button>
                          {copiedShareLink === folder.id && (
                            <span className="text-[10px] text-brand-dark-green font-body whitespace-nowrap">
                              Copied!
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Expanded folder content */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border px-4 py-3 space-y-3">
                            {folder.flights.length === 0 && (
                              <p className="text-xs text-muted font-body italic">
                                No flights in this folder yet.
                              </p>
                            )}

                            {/* Collaborators */}
                            {folder.collaborators.length > 0 && (
                              <div>
                                <p className="text-xs text-muted font-body font-semibold mb-1.5">
                                  Collaborators
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {folder.collaborators.map((c) => (
                                    <span
                                      key={c.id}
                                      className="inline-flex items-center gap-1 rounded-full bg-paper border border-border px-2 py-0.5 text-[10px] font-body text-ink"
                                    >
                                      <Users size={10} className="text-muted" />
                                      {c.name}
                                      <span className="text-muted">({c.permission})</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Invite collaborator */}
                            <div>
                              <p className="text-xs text-muted font-body font-semibold mb-1.5">
                                Invite
                              </p>
                              <div className="flex gap-2">
                                <input
                                  type="email"
                                  placeholder="Email address…"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  className="flex-1 rounded-lg border border-border bg-paper px-2 py-1.5 text-xs font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                />
                                <select
                                  value={invitePermission}
                                  onChange={(e) =>
                                    setInvitePermission(e.target.value as 'view' | 'edit')
                                  }
                                  className="rounded-lg border border-border bg-paper px-2 py-1.5 text-xs font-body text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                >
                                  <option value="view">View</option>
                                  <option value="edit">Edit</option>
                                </select>
                                <button
                                  onClick={() => addCollaborator(folder.id)}
                                  className="rounded-lg bg-brand-blue text-white px-3 py-1.5 text-xs font-display font-bold hover:bg-brand-dark-blue transition-colors"
                                >
                                  Invite
                                </button>
                              </div>
                            </div>

                            {/* Share link */}
                            <button
                              onClick={() => copyShareLink(folder)}
                              className="flex items-center gap-1.5 text-xs text-brand-blue hover:text-brand-dark-blue font-body transition-colors"
                            >
                              <Share2 size={12} />
                              Copy share link
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {folders.length === 0 && (
                <p className="text-center text-sm text-muted font-body py-8">
                  No folders yet — create one to organize your saved flights.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Flight Detail Modal */}
      <FlightDetailModal
        flight={detailFlight}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper components                                                  */
/* ------------------------------------------------------------------ */

function PrefRow({
  icon,
  label,
  children,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-xs text-muted font-body">
        {icon} {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  children,
  color,
}: Readonly<{
  children: React.ReactNode;
  color: 'blue' | 'gray' | 'green';
}>) {
  const colorClasses = {
    blue: 'bg-brand-light-blue/20 text-brand-dark-blue',
    gray: 'bg-off text-ink',
    green: 'bg-brand-light-green text-brand-dark-green',
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-display font-bold ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
}
