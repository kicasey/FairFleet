'use client';

import Navbar from '@/components/Navbar';
import UserAvatar from '@/components/UserAvatar';
import { useState } from 'react';
import {
  Heart,
  Share2,
  UserPlus,
  Users,
  Check,
  X,
  Clock,
  Plane,
} from 'lucide-react';
import { motion } from 'framer-motion';

const dummyFriends = [
  { id: 'f1', name: 'Sarah M.', airport: 'ATL', status: 'friend' as const },
  { id: 'f2', name: 'James K.', airport: 'LAX', status: 'friend' as const },
  { id: 'f3', name: 'Priya R.', airport: 'ORD', status: 'friend' as const },
  { id: 'f4', name: 'Marcus T.', airport: 'MIA', status: 'friend' as const },
];

const dummyRequests = [
  { id: 'r1', name: 'Ava L.', airport: 'SFO' },
  { id: 'r2', name: 'Noah W.', airport: 'DFW' },
];

type FeedAction = 'saved' | 'hearted';

interface FeedItem {
  id: string;
  friendName: string;
  action: FeedAction;
  origin: string;
  destination: string;
  airline: string;
  price: number;
  departureDate: string;
  timestamp: string;
  likes: number;
}

const feedItems: FeedItem[] = [
  { id: 'fi-1', friendName: 'Sarah M.', action: 'saved', origin: 'ATL', destination: 'CUN', airline: 'Delta', price: 343, departureDate: 'Apr 22', timestamp: '2 hours ago', likes: 4 },
  { id: 'fi-2', friendName: 'James K.', action: 'hearted', origin: 'ATL', destination: 'LHR', airline: 'Delta', price: 642, departureDate: 'May 10', timestamp: '5 hours ago', likes: 7 },
  { id: 'fi-3', friendName: 'Priya R.', action: 'saved', origin: 'ATL', destination: 'NRT', airline: 'United', price: 914, departureDate: 'Jun 1', timestamp: '1 day ago', likes: 12 },
  { id: 'fi-4', friendName: 'Marcus T.', action: 'hearted', origin: 'MIA', destination: 'CDG', airline: 'American', price: 587, departureDate: 'May 18', timestamp: '1 day ago', likes: 3 },
  { id: 'fi-5', friendName: 'Sarah M.', action: 'saved', origin: 'ATL', destination: 'SJO', airline: 'Spirit', price: 218, departureDate: 'Apr 28', timestamp: '2 days ago', likes: 9 },
  { id: 'fi-6', friendName: 'James K.', action: 'hearted', origin: 'LAX', destination: 'HND', airline: 'ANA', price: 823, departureDate: 'Jun 14', timestamp: '2 days ago', likes: 15 },
  { id: 'fi-7', friendName: 'Priya R.', action: 'saved', origin: 'ORD', destination: 'BCN', airline: 'Iberia', price: 498, departureDate: 'May 25', timestamp: '3 days ago', likes: 6 },
  { id: 'fi-8', friendName: 'Marcus T.', action: 'hearted', origin: 'MIA', destination: 'BOG', airline: 'Avianca', price: 274, departureDate: 'Apr 19', timestamp: '3 days ago', likes: 2 },
];

function FeedCard({ item }: Readonly<{ item: FeedItem }>) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes);

  const toggleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="bg-paper rounded-xl border border-border p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar name={item.friendName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-ink">
            <span className="font-semibold">{item.friendName}</span>{' '}
            <span className="text-muted">{item.action === 'saved' ? 'saved' : 'hearted'}</span>{' '}
            <span className="font-semibold">
              {item.origin} → {item.destination}
            </span>
          </p>
          <p className="font-body text-xs text-muted flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.timestamp}
          </p>
        </div>
      </div>

      {/* Flight mini card */}
      <div className="rounded-lg bg-off border border-border p-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-brand-dark-blue/10">
              <Plane className="h-4 w-4 text-brand-dark-blue" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-ink">
                {item.origin} → {item.destination}
              </p>
              <p className="font-body text-xs text-muted">
                {item.airline} · {item.departureDate}
              </p>
            </div>
          </div>
          <span className="font-display font-black text-lg text-brand-dark-blue">
            ${item.price}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 1.3 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          onClick={toggleLike}
          className="flex items-center gap-1.5 text-sm font-body text-muted hover:text-brand-red transition-colors"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${liked ? 'fill-brand-red text-brand-red' : ''}`}
          />
          <span className={liked ? 'text-brand-red font-semibold' : ''}>{likeCount}</span>
        </motion.button>
        <button className="flex items-center gap-1.5 text-sm font-body text-muted hover:text-brand-teal transition-colors">
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
      </div>
    </motion.div>
  );
}

export default function FeedPage() {
  const [tab, setTab] = useState<'feed' | 'friends'>('feed');
  const [friendEmail, setFriendEmail] = useState('');
  const [requests, setRequests] = useState(dummyRequests);
  const [friends, setFriends] = useState(dummyFriends);

  const acceptRequest = (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (req) {
      setFriends((prev) => [...prev, { id: req.id, name: req.name, airport: req.airport, status: 'friend' as const }]);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const declineRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-off">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        {/* Tab pills */}
        <div className="flex items-center gap-1 bg-paper rounded-full border border-border p-1 mb-8 w-fit mx-auto">
          <button
            onClick={() => setTab('feed')}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-body font-semibold transition-colors ${
              tab === 'feed'
                ? 'bg-brand-dark-blue text-white'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Plane className="h-4 w-4" />
            Flight Feed
          </button>
          <button
            onClick={() => setTab('friends')}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-body font-semibold transition-colors ${
              tab === 'friends'
                ? 'bg-brand-dark-blue text-white'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Users className="h-4 w-4" />
            Friends
          </button>
        </div>

        {/* Feed Tab */}
        {tab === 'feed' && (
          <div className="space-y-4">
            {feedItems.length > 0 ? (
              feedItems.map((item, i) => (
                <FeedCard key={item.id} item={item} />
              ))
            ) : (
              <div className="text-center py-20">
                <Users className="h-12 w-12 text-muted/40 mx-auto mb-4" />
                <p className="font-display font-bold text-lg text-ink mb-1">No activity yet</p>
                <p className="font-body text-sm text-muted">
                  Connect with friends to see their flight finds!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Friends Tab */}
        {tab === 'friends' && (
          <div className="space-y-6">
            {/* Add friend */}
            <div className="bg-paper rounded-xl border border-border p-4">
              <label htmlFor="friend-email" className="font-display font-semibold text-sm text-ink mb-2 block">
                Add a friend
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="friend-email"
                  type="email"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  placeholder="Add friend by email"
                  className="flex-1 rounded-lg border border-border bg-off px-3 py-2 text-sm font-body text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition"
                />
                <button
                  onClick={() => setFriendEmail('')}
                  className="flex items-center justify-center h-9 w-9 rounded-lg bg-brand-blue text-white hover:bg-brand-dark-blue transition-colors shrink-0"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Friend requests */}
            {requests.length > 0 && (
              <div className="bg-paper rounded-xl border border-border p-4">
                <h3 className="font-display font-semibold text-sm text-ink mb-3">
                  Friend Requests
                </h3>
                <div className="space-y-2">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 rounded-lg bg-off p-3"
                    >
                      <UserAvatar name={req.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-semibold text-ink">{req.name}</p>
                        <p className="font-body text-xs text-muted">Home: {req.airport}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => acceptRequest(req.id)}
                          className="flex items-center justify-center h-8 w-8 rounded-full bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-colors"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => declineRequest(req.id)}
                          className="flex items-center justify-center h-8 w-8 rounded-full bg-brand-red/10 text-brand-red hover:bg-brand-red/20 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends list */}
            <div className="bg-paper rounded-xl border border-border p-4">
              <h3 className="font-display font-semibold text-sm text-ink mb-3">
                Your Friends
              </h3>
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 rounded-lg hover:bg-subtle p-3 transition-colors"
                  >
                    <UserAvatar name={friend.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-ink">{friend.name}</p>
                      <p className="font-body text-xs text-muted">Home: {friend.airport}</p>
                    </div>
                    <span className="text-xs font-body text-brand-teal font-semibold bg-brand-teal/10 px-2.5 py-0.5 rounded-full">
                      {friend.airport}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
