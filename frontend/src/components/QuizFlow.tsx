'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sun,
  Cloud,
  Snowflake,
  Shuffle,
  User,
  Heart,
  Users,
  UsersRound,
  Palmtree,
  Mountain,
  Building2,
  TreePine,
  Calendar,
  CalendarDays,
  CalendarRange,
  Infinity as InfinityIcon,
  DollarSign,
  CalendarCheck,
  Plane,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { fetchExploreDestinations } from '@/lib/api';
import type { Destination, QuizAnswer } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';

interface QuizFlowProps {
  onComplete?: (answers: QuizAnswer) => void;
  onClose?: () => void;
  inline?: boolean;
}

interface QuizOption {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface QuizQuestion {
  key: keyof QuizAnswer;
  title: string;
  subtitle: string;
  options: QuizOption[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    key: 'weather',
    title: 'What weather sounds perfect?',
    subtitle: 'Pick the climate that makes you happiest.',
    options: [
      { id: 'warm', label: 'Warm & Sunny', description: 'Beaches, sunshine, and blue skies', icon: Sun },
      { id: 'mild', label: 'Mild & Temperate', description: 'Comfortable and pleasant year-round', icon: Cloud },
      { id: 'cool', label: 'Cool & Crisp', description: 'Fresh mountain air and cozy vibes', icon: Snowflake },
      { id: 'surprise', label: 'Surprise Me', description: 'Dealer\'s choice — any weather goes', icon: Shuffle },
    ],
  },
  {
    key: 'companions',
    title: 'Who\'s coming along?',
    subtitle: 'Your travel crew shapes the trip.',
    options: [
      { id: 'solo', label: 'Solo', description: 'Just me, myself, and I', icon: User },
      { id: 'couple', label: 'Couple', description: 'A romantic getaway for two', icon: Heart },
      { id: 'family', label: 'Family', description: 'Bringing the kids along', icon: Users },
      { id: 'group', label: 'Group', description: 'Friends or a larger party', icon: UsersRound },
    ],
  },
  {
    key: 'vibe',
    title: 'What\'s the vibe?',
    subtitle: 'Choose the experience you\'re craving.',
    options: [
      { id: 'beach', label: 'Chill & Beach', description: 'Sand between your toes, zero stress', icon: Palmtree },
      { id: 'adventure', label: 'Thrill & Adventure', description: 'Extreme sports, zip-lines, off-the-beaten-path', icon: Mountain },
      { id: 'city', label: 'City & Culture', description: 'Museums, food scenes, nightlife, architecture', icon: Building2 },
      { id: 'nature', label: 'Scenic & Outdoors', description: 'National parks, wildlife, gentle hikes, stargazing', icon: TreePine },
    ],
  },
  {
    key: 'length',
    title: 'How long is the trip?',
    subtitle: 'From a quick escape to a long vacation.',
    options: [
      { id: 'weekend', label: 'Weekend', description: '2-3 days, short and sweet', icon: Calendar },
      { id: '1week', label: '1 Week', description: 'A solid week of exploration', icon: CalendarDays },
      { id: '2weeks', label: '2 Weeks', description: 'A proper extended vacation', icon: CalendarRange },
      { id: 'flexible', label: 'Flexible', description: 'No fixed timeline in mind', icon: InfinityIcon },
    ],
  },
  {
    key: 'budget',
    title: 'What\'s your budget per person?',
    subtitle: 'Flight cost only — we\'ll find the best deal.',
    options: [
      { id: '0-300', label: '$0 – $300', description: 'Budget-friendly domestic flights', icon: DollarSign },
      { id: '300-600', label: '$300 – $600', description: 'Mid-range with more options', icon: DollarSign },
      { id: '600-1000', label: '$600 – $1,000', description: 'Premium routes and longer trips', icon: DollarSign },
      { id: '1000+', label: '$1,000+', description: 'International and first-class territory', icon: DollarSign },
    ],
  },
  {
    key: 'flexibility',
    title: 'How flexible are your dates?',
    subtitle: 'Flexibility often unlocks better prices.',
    options: [
      { id: 'specific', label: 'Specific Dates', description: 'I know exactly when I\'m going', icon: CalendarCheck },
      { id: 'flexible-3', label: 'Flexible ±3 Days', description: 'A few days of wiggle room', icon: CalendarDays },
      { id: 'anytime-3mo', label: 'Anytime (3 Months)', description: 'Within the next three months', icon: CalendarRange },
      { id: 'open', label: 'Totally Open', description: 'Whenever the price is right', icon: InfinityIcon },
    ],
  },
];

const BUDGET_RANGES: Record<string, [number, number]> = {
  '0-300': [0, 300],
  '300-600': [300, 600],
  '600-1000': [600, 1000],
  '1000+': [1000, Infinity],
};

const WEATHER_TAGS: Record<string, string[]> = {
  warm: ['Beach', 'Resort'],
  mild: ['Culture', 'Food', 'Shopping'],
  cool: ['Mountains', 'Nature', 'Adventure'],
  surprise: [],
};

const VIBE_TAGS: Record<string, string[]> = {
  beach: ['Beach', 'Resort', 'Diving'],
  adventure: ['Adventure', 'Mountains', 'Nature'],
  city: ['Culture', 'Shopping', 'Nightlife', 'Food', 'History'],
  nature: ['Nature', 'Mountains', 'Adventure'],
};

function scoreDestination(dest: Destination, answers: QuizAnswer): number {
  let score = 0;

  if (answers.weather && answers.weather !== 'surprise') {
    const tags = WEATHER_TAGS[answers.weather] || [];
    if (tags.some((t) => dest.tags.includes(t))) score += 2;
  }

  if (answers.vibe) {
    const tags = VIBE_TAGS[answers.vibe] || [];
    if (tags.some((t) => dest.tags.includes(t))) score += 3;
  }

  if (answers.budget) {
    const [min, max] = BUDGET_RANGES[answers.budget] || [0, Infinity];
    if (dest.cheapestPrice >= min && dest.cheapestPrice <= max) score += 4;
    else if (dest.cheapestPrice < min + 100 || dest.cheapestPrice > max - 100) score += 1;
  }

  return score;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

export default function QuizFlow({ onComplete, onClose, inline }: Readonly<QuizFlowProps>) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<QuizAnswer>({});
  const [showResults, setShowResults] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);

  useEffect(() => {
    fetchExploreDestinations('ATL')
      .then((data) => setDestinations(data))
      .catch((err) => console.error('Failed to load quiz destinations:', err));
  }, []);

  const currentQuestion = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  const selectAnswer = useCallback((key: keyof QuizAnswer, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  function goNext() {
    if (step < QUESTIONS.length - 1) {
      setDirection(1);
      setStep(step + 1);
    } else {
      setShowResults(true);
      onComplete?.(answers);
    }
  }

  function goBack() {
    if (showResults) {
      setShowResults(false);
      return;
    }
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  }

  const matchedDestinations = useMemo(() => {
    return [...destinations]
      .map((d) => ({ dest: d, score: scoreDestination(d, answers) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((m) => m.dest);
  }, [answers, destinations]);

  const previewDestinations = matchedDestinations.slice(0, 4);
  const answerKeys = Object.entries(answers) as [keyof QuizAnswer, string][];

  const containerClass = inline
    ? 'w-full'
    : 'w-full max-w-4xl mx-auto';

  /* ────── Results view ────── */
  if (showResults) {
    return (
      <div className={containerClass}>
        <div className="rounded-2xl bg-paper border border-border shadow-xl shadow-brand-dark-blue/5 p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-display font-semibold uppercase text-xs tracking-widest text-muted mb-1">
                Your Matches
              </p>
              <h2 className="font-display font-extrabold text-lg text-ink">
                We found your perfect destinations
              </h2>
            </div>
            {onClose && (
              <button onClick={onClose} className="rounded-full p-2 text-muted hover:bg-off transition-colors">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Answer chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {answerKeys.map(([key, value]) => (
              <span
                key={key}
                className="rounded-full bg-brand-light-blue/20 border border-brand-blue/20 px-3 py-1 text-xs font-body font-semibold text-brand-dark-blue"
              >
                {value}
              </span>
            ))}
          </div>

          {/* Destination cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchedDestinations.map((dest) => (
              <div
                key={dest.code}
                className="rounded-xl border border-border bg-off/50 p-4 hover:shadow-md hover:border-brand-blue/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-display font-bold text-sm text-ink">{dest.city}</h3>
                    <p className="text-xs font-body text-muted">{dest.country}</p>
                  </div>
                  <span className="rounded-full bg-brand-dark-blue/10 px-2 py-0.5 font-display text-xs font-bold text-brand-dark-blue">
                    {dest.code}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {dest.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-off px-2 py-0.5 text-[9px] font-body text-muted border border-border">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-extrabold text-lg text-brand-dark-blue">
                      ${dest.cheapestPrice}
                    </p>
                    <p className="text-[10px] font-body text-muted">{dest.flightTime} flight</p>
                  </div>
                  <button className="rounded-full bg-brand-blue px-4 py-1.5 text-xs font-body font-semibold text-white hover:bg-brand-dark-blue transition-colors flex items-center gap-1.5 group-hover:shadow-md">
                    <Plane className="h-3 w-3" />
                    View Flights
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Back button */}
          <div className="mt-6 flex justify-start">
            <button
              onClick={goBack}
              className="rounded-full border border-border px-5 py-2 text-sm font-body font-semibold text-muted hover:bg-off transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ────── Quiz view ────── */
  return (
    <div className={containerClass}>
      <div className="rounded-2xl bg-paper border border-border shadow-xl shadow-brand-dark-blue/5 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-off">
          <div
            className="h-full rounded-r-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #2875F1 0%, #6050E8 100%)',
            }}
          />
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Main quiz panel */}
          <div className="flex-1 p-6 sm:p-8">
            {/* Close button + step indicator */}
            <div className="flex items-center justify-between mb-6">
              <p className="font-display font-semibold uppercase text-xs tracking-widest text-muted">
                Question {step + 1} of {QUESTIONS.length}
              </p>
              {onClose && (
                <button onClick={onClose} className="rounded-full p-2 text-muted hover:bg-off transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Animated question */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {/* Question text */}
                <h2 className="font-display font-extrabold text-sm sm:text-base text-ink mb-1">
                  {currentQuestion.title}
                </h2>
                <p className="text-muted text-sm font-body mb-6">{currentQuestion.subtitle}</p>

                {/* 2×2 options grid */}
                <div className="grid grid-cols-2 gap-3">
                  {currentQuestion.options.map((opt) => {
                    const selected = answers[currentQuestion.key] === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => selectAnswer(currentQuestion.key, opt.id)}
                        className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                          selected
                            ? 'bg-brand-light-purple/20 border-brand-purple shadow-sm'
                            : 'bg-paper border-border hover:border-brand-blue/30'
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            selected ? 'bg-brand-blue/20' : 'bg-off'
                          }`}
                        >
                          <Icon
                            className={`h-4.5 w-4.5 ${
                              selected ? 'text-brand-blue' : 'text-muted'
                            }`}
                          />
                        </div>
                        <p className="font-display font-bold text-[9px] uppercase tracking-wide text-ink">
                          {opt.label}
                        </p>
                        <p className="text-[9px] text-muted leading-snug">{opt.description}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Answer summary chips */}
            {answerKeys.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-border">
                {answerKeys.map(([key, value]) => {
                  const q = QUESTIONS.find((qq) => qq.key === key);
                  const opt = q?.options.find((o) => o.id === value);
                  return (
                    <span
                      key={key}
                      className="rounded-full bg-brand-light-pink px-2.5 py-0.5 text-[10px] font-body text-brand-dark-burgundy"
                    >
                      {opt?.label || value}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={goBack}
                disabled={step === 0}
                className="rounded-full border border-border px-5 py-2 text-sm font-body font-semibold text-muted hover:bg-off transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={goNext}
                disabled={!answers[currentQuestion.key]}
                className="rounded-full bg-brand-blue px-6 py-2 text-sm font-body font-semibold text-white hover:bg-brand-dark-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-cta"
              >
                {step === QUESTIONS.length - 1 ? 'See Results' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Live preview side panel (desktop only) */}
          <div className="hidden lg:block w-72 border-l border-border bg-off/50 p-5">
            <p className="font-display font-semibold uppercase text-[10px] tracking-widest text-muted mb-4">
              Live Preview
            </p>
            <div className="space-y-3">
              {previewDestinations.map((dest) => (
                <div
                  key={dest.code}
                  className="rounded-xl border border-border bg-paper p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-display font-bold text-xs text-ink">{dest.city}</h4>
                    <span className="font-display font-extrabold text-xs text-brand-dark-blue">
                      ${dest.cheapestPrice}
                    </span>
                  </div>
                  <p className="text-[10px] font-body text-muted mb-1.5">
                    {dest.country} · {dest.flightTime}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {dest.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-off px-1.5 py-0.5 text-[8px] font-body text-muted border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
