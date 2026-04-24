'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, Plane, RotateCcw, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { fetchExploreDestinations } from '@/lib/api';
import type { Destination, QuizAnswer } from '@/lib/types';

interface QuizFlowProps {
  onComplete?: (answers: QuizAnswer) => void;
  onClose?: () => void;
  inline?: boolean;
  homeAirport?: string;
}

interface QuizOption {
  id: string;
  label: string;
}

interface QuizQuestion {
  key: keyof QuizAnswer;
  prompt: string;
  options: QuizOption[];
  ack: (choice: QuizOption) => string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    key: 'weather',
    prompt: "First up — what kind of weather are you in the mood for?",
    options: [
      { id: 'warm', label: 'Warm & sunny' },
      { id: 'mild', label: 'Mild & temperate' },
      { id: 'cool', label: 'Cool & crisp' },
      { id: 'surprise', label: 'Surprise me' },
    ],
    ack: (c) => `${c.label} — nice.`,
  },
  {
    key: 'companions',
    prompt: "Who's coming with you?",
    options: [
      { id: 'solo', label: 'Just me' },
      { id: 'couple', label: 'Couple' },
      { id: 'family', label: 'Family' },
      { id: 'group', label: 'Group of friends' },
    ],
    ack: (c) => `Got it — ${c.label.toLowerCase()}.`,
  },
  {
    key: 'vibe',
    prompt: "What vibe are you after?",
    options: [
      { id: 'beach', label: 'Chill & beach' },
      { id: 'adventure', label: 'Adventure' },
      { id: 'city', label: 'City & culture' },
      { id: 'nature', label: 'Scenic & outdoors' },
    ],
    ack: (c) => `${c.label} — love it.`,
  },
  {
    key: 'length',
    prompt: "How long is the trip?",
    options: [
      { id: 'weekend', label: 'Weekend' },
      { id: '1week', label: '1 week' },
      { id: '2weeks', label: '2 weeks' },
      { id: 'flexible', label: 'Flexible' },
    ],
    ack: (c) => `Cool, ${c.label.toLowerCase()} it is.`,
  },
  {
    key: 'budget',
    prompt: "What's your budget per person (flights only)?",
    options: [
      { id: '0-300', label: 'Under $300' },
      { id: '300-600', label: '$300 – $600' },
      { id: '600-1000', label: '$600 – $1,000' },
      { id: '1000+', label: '$1,000+' },
    ],
    ack: (c) => `Budget noted: ${c.label}.`,
  },
  {
    key: 'flexibility',
    prompt: "Last one — how flexible are your dates?",
    options: [
      { id: 'specific', label: 'Specific dates' },
      { id: 'flexible-3', label: '±3 days' },
      { id: 'anytime-3mo', label: 'Within 3 months' },
      { id: 'open', label: 'Totally open' },
    ],
    ack: () => `Perfect.`,
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

function pickMatches(answers: QuizAnswer, availableDestinations: Destination[]): Destination[] {
  return [...availableDestinations]
    .map((d) => ({ dest: d, score: scoreDestination(d, answers) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((m) => m.dest);
}

type ChatMessage =
  | { id: string; role: 'bot'; text: string }
  | { id: string; role: 'user'; text: string }
  | {
      id: string;
      role: 'results';
      destinations: Destination[];
      blurbs: Record<string, string>;
    };

type Phase = 'quiz' | 'freeform' | 'generating' | 'done';

const INTRO_TEXT =
  "Hi! I'm your FairFleet travel buddy. Answer a few quick questions and I'll use AI to match you with destinations.";

const FREEFORM_PROMPT =
  "Anything else I should know? Tell me in your own words, or hit Skip.";

interface RecommendationResponse {
  summary: string;
  blurbs: Record<string, string>;
}

async function fetchRecommendations(
  answers: QuizAnswer,
  freeformNote: string | undefined,
  dests: Destination[],
): Promise<RecommendationResponse> {
  const res = await fetch('/api/quiz-recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answers,
      freeformNote,
      destinations: dests.map((d) => ({
        code: d.code,
        city: d.city,
        country: d.country,
        cheapestPrice: d.cheapestPrice,
        flightTime: d.flightTime,
        tags: d.tags,
      })),
    }),
  });
  if (!res.ok) throw new Error(`Recommendation request failed: ${res.status}`);
  return (await res.json()) as RecommendationResponse;
}

export default function QuizFlow({ onComplete, onClose, inline, homeAirport = 'ATL' }: Readonly<QuizFlowProps>) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'intro', role: 'bot', text: INTRO_TEXT },
  ]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer>({});
  const [phase, setPhase] = useState<Phase>('quiz');
  const [isTyping, setIsTyping] = useState(true);
  const [freeformInput, setFreeformInput] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const currentQuestion = step < QUESTIONS.length ? QUESTIONS[step] : null;

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  useEffect(() => {
    fetchExploreDestinations(homeAirport)
      .then((data) => setDestinations(data))
      .catch((err) => console.error('Failed to load quiz destinations:', err));
  }, [homeAirport]);

  useEffect(() => {
    if (phase !== 'quiz') return;
    if (!currentQuestion) return;
    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      appendMessage({
        id: `q-${currentQuestion.key}`,
        role: 'bot',
        text: currentQuestion.prompt,
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [step, currentQuestion, phase, appendMessage]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, phase]);

  async function finalizeWithAi(finalAnswers: QuizAnswer, note: string | undefined) {
    const matches = pickMatches(finalAnswers, destinations);
    setPhase('generating');
    setIsTyping(true);
    appendMessage({ id: 'gen-status', role: 'bot', text: "Thinking through your matches…" });

    try {
      const { summary, blurbs } = await fetchRecommendations(finalAnswers, note, matches);
      appendMessage({ id: 'results-summary', role: 'bot', text: summary });
      appendMessage({ id: 'results', role: 'results', destinations: matches, blurbs });
    } catch (err) {
      console.error(err);
      const fallbackBlurbs: Record<string, string> = {};
      for (const d of matches) {
        fallbackBlurbs[d.code] =
          `${d.city}, ${d.country} — from $${d.cheapestPrice}, about ${d.flightTime} in the air.`;
      }
      appendMessage({
        id: 'results-summary',
        role: 'bot',
        text: "I couldn't reach the AI just now, but here are your best matches.",
      });
      appendMessage({ id: 'results', role: 'results', destinations: matches, blurbs: fallbackBlurbs });
    } finally {
      setIsTyping(false);
      setPhase('done');
      onComplete?.(finalAnswers);
    }
  }

  function handleSelect(option: QuizOption) {
    if (!currentQuestion || isTyping || phase !== 'quiz') return;
    const question = currentQuestion;
    const nextAnswers = { ...answers, [question.key]: option.id };
    setAnswers(nextAnswers);
    appendMessage({ id: `a-${question.key}`, role: 'user', text: option.label });
    setIsTyping(true);
    setTimeout(() => {
      appendMessage({ id: `ack-${question.key}`, role: 'bot', text: question.ack(option) });
      const isLast = step === QUESTIONS.length - 1;
      if (isLast) {
        setTimeout(() => {
          appendMessage({ id: 'freeform-prompt', role: 'bot', text: FREEFORM_PROMPT });
          setIsTyping(false);
          setPhase('freeform');
        }, 500);
      } else {
        setStep(step + 1);
      }
    }, 650);
  }

  function handleFreeformSend() {
    if (phase !== 'freeform') return;
    const note = freeformInput.trim();
    if (!note) return;
    appendMessage({ id: 'freeform-answer', role: 'user', text: note });
    setFreeformInput('');
    void finalizeWithAi(answers, note);
  }

  function handleFreeformSkip() {
    if (phase !== 'freeform') return;
    appendMessage({ id: 'freeform-skip', role: 'user', text: 'Skip' });
    void finalizeWithAi(answers, undefined);
  }

  function handleRestart() {
    setMessages([{ id: 'intro', role: 'bot', text: INTRO_TEXT }]);
    setAnswers({});
    setStep(0);
    setFreeformInput('');
    setPhase('quiz');
    setIsTyping(true);
  }

  const containerClass = inline ? 'w-full max-w-2xl mx-auto' : 'w-full max-w-2xl mx-auto px-4';

  const matchCount = messages.reduce(
    (acc, m) => (m.role === 'results' ? m.destinations.length : acc),
    0,
  );

  const statusLabel = (() => {
    if (phase === 'generating') return 'Generating…';
    if (phase === 'done') return 'Finished';
    if (isTyping) return 'Typing…';
    return 'Online';
  })();

  return (
    <div className={containerClass}>
      <div className="rounded-2xl bg-paper border border-border shadow-xl shadow-brand-dark-blue/5 overflow-hidden flex flex-col h-[620px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-off/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-ink leading-tight">FairFleet Assistant</p>
              <p className="font-body text-[11px] text-muted leading-tight">{statusLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {phase === 'done' && (
              <button
                onClick={handleRestart}
                className="rounded-full p-2 text-muted hover:bg-off transition-colors"
                aria-label="Restart quiz"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted hover:bg-off transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-paper">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'results' ? (
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {m.destinations.map((dest) => (
                      <div
                        key={dest.code}
                        className="rounded-xl border border-border bg-off/40 p-3 hover:shadow-sm hover:border-brand-blue/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h3 className="font-display font-bold text-sm text-ink leading-tight">{dest.city}</h3>
                            <p className="text-[11px] font-body text-muted">{dest.country}</p>
                          </div>
                          <span className="rounded-full bg-brand-dark-blue/10 px-2 py-0.5 font-display text-[10px] font-bold text-brand-dark-blue">
                            {dest.code}
                          </span>
                        </div>
                        {m.blurbs[dest.code] && (
                          <p className="text-[11px] font-body text-muted leading-snug mt-1 mb-2">
                            {m.blurbs[dest.code]}
                          </p>
                        )}
                        <div className="flex items-end justify-between mt-2">
                          <div>
                            <p className="font-display font-extrabold text-base text-brand-dark-blue leading-none">
                              ${dest.cheapestPrice}
                            </p>
                            <p className="text-[10px] font-body text-muted mt-1">{dest.flightTime} flight</p>
                          </div>
                          <Link
                            href={`/search?from=${homeAirport}&to=${dest.code}&passengers=1&cabin=economy`}
                            className="rounded-full bg-brand-blue px-3 py-1 text-[11px] font-body font-semibold text-white hover:bg-brand-dark-blue transition-colors flex items-center gap-1"
                          >
                            <Plane className="h-3 w-3" />
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-body leading-snug whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-brand-blue text-white rounded-br-sm'
                        : 'bg-off text-ink rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-off rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                <TypingDot delay={0} />
                <TypingDot delay={0.15} />
                <TypingDot delay={0.3} />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-off/30 px-4 py-3 min-h-[72px] flex items-center">
          {phase === 'quiz' && currentQuestion && !isTyping ? (
            <div className="flex flex-wrap gap-2 w-full">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  className="rounded-full border border-brand-blue/30 bg-paper px-4 py-1.5 text-sm font-body font-semibold text-brand-dark-blue hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : phase === 'freeform' ? (
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={freeformInput}
                onChange={(e) => setFreeformInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFreeformSend(); }}
                placeholder="e.g. celebrating an anniversary, want good food…"
                className="flex-1 rounded-full border border-border bg-paper px-4 py-2 text-sm font-body text-ink placeholder:text-muted focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                autoFocus
              />
              <button
                onClick={handleFreeformSkip}
                className="rounded-full border border-border bg-paper px-4 py-2 text-sm font-body font-semibold text-muted hover:bg-off transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleFreeformSend}
                disabled={!freeformInput.trim()}
                className="rounded-full bg-brand-blue px-4 py-2 text-sm font-body font-semibold text-white hover:bg-brand-dark-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </div>
          ) : phase === 'generating' ? (
            <div className="flex items-center gap-2 w-full text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-body">Crafting your personalized recommendations…</span>
            </div>
          ) : phase === 'done' ? (
            <div className="flex items-center justify-between w-full">
              <p className="text-xs font-body text-muted">
                {matchCount} AI-personalized match{matchCount === 1 ? '' : 'es'}
              </p>
              <button
                onClick={handleRestart}
                className="rounded-full bg-brand-blue px-4 py-1.5 text-sm font-body font-semibold text-white hover:bg-brand-dark-blue transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Start over
              </button>
            </div>
          ) : (
            <p className="text-xs font-body text-muted italic">Assistant is typing…</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingDot({ delay }: Readonly<{ delay: number }>) {
  return (
    <motion.span
      className="block h-1.5 w-1.5 rounded-full bg-muted"
      animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 0.9, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}
