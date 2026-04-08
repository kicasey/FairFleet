'use client';

import Navbar from '@/components/Navbar';
import {
  CreditCard,
  Plane,
  Award,
  BookOpen,
  ExternalLink,
  Star,
  TrendingUp,
  Gift,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const pointsCards = [
  {
    title: 'Earning Miles',
    color: 'border-brand-teal',
    accent: 'text-brand-teal',
    icon: TrendingUp,
    body: 'Accumulate miles through flights with your preferred airline, co-branded credit cards that earn bonus points on everyday spending, and online shopping portals that award extra miles per dollar. Stacking multiple earning methods is the fastest way to build a balance.',
  },
  {
    title: 'Redeeming Miles',
    color: 'border-brand-green',
    accent: 'text-brand-green',
    icon: Gift,
    body: 'Look for "sweet spot" redemptions — routes where airlines charge far fewer miles than average. Transfer points from flexible programs like Chase or Amex to airline partners, and study award charts to find outsized value on premium cabins.',
  },
  {
    title: 'Status Tiers',
    color: 'border-brand-purple',
    accent: 'text-brand-purple',
    icon: Star,
    body: 'Airlines reward loyalty through tiers like Silver, Gold, and Platinum. Delta SkyMiles Medallion, American AAdvantage, and United MileagePlus each offer complimentary upgrades, priority boarding, bonus earning, and waived fees at higher levels.',
  },
  {
    title: 'Alliance Benefits',
    color: 'border-brand-dark-blue',
    accent: 'text-brand-dark-blue',
    icon: Plane,
    body: 'Star Alliance (United, ANA, Lufthansa), SkyTeam (Delta, Air France, KLM), and oneworld (American, British Airways, Cathay) let you earn and redeem miles across partner airlines and access lounges worldwide with qualifying status.',
  },
];

const creditCards = [
  { name: 'Chase Sapphire Preferred', fee: '$95', bonus: '60K pts', earn: '2× travel & dining', best: 'Best overall starter' },
  { name: 'Amex Gold', fee: '$250', bonus: '60K pts', earn: '4× dining & groceries', best: 'Best for foodies' },
  { name: 'Capital One Venture X', fee: '$395', bonus: '75K mi', earn: '2× everything', best: 'Best lounge access' },
  { name: 'Chase Sapphire Reserve', fee: '$550', bonus: '60K pts', earn: '3× travel & dining', best: 'Best premium' },
  { name: 'Citi Premier', fee: '$95', bonus: '60K pts', earn: '3× travel/gas/grocery', best: 'Best value' },
];

const opportunities = [
  {
    title: 'Error Fares',
    color: 'border-t-brand-red',
    icon: Zap,
    body: 'Airlines occasionally publish fares far below market price due to pricing glitches. Follow deal-alert accounts, act fast, and book refundable when possible — most error fares are honored once ticketed.',
  },
  {
    title: 'Positioning Flights',
    color: 'border-t-brand-teal',
    icon: Plane,
    body: 'Sometimes a cheap domestic flight to a different departure city unlocks dramatically lower international fares. A $60 flight to a hub can save $500+ on your overseas ticket.',
  },
  {
    title: 'Credit Card Churning',
    color: 'border-t-brand-purple',
    icon: CreditCard,
    body: 'Strategically applying for cards to earn sign-up bonuses can yield tens of thousands of points. Keep track of application rules (Chase 5/24, Amex lifetime limits) and always pay balances in full.',
  },
  {
    title: 'Award Sweet Spots',
    color: 'border-t-brand-green',
    icon: Award,
    body: 'Some redemptions offer exceptional value — ANA first class for 55K Virgin Atlantic miles, Hyatt hotels via Chase transfers at 1:1, or Avianca LifeMiles for Star Alliance business class.',
  },
  {
    title: 'Hidden City Ticketing',
    color: 'border-t-brand-yellow',
    icon: Star,
    body: 'Booking a flight with a connection at your true destination can be cheaper than a direct fare. Risks include lost luggage, airline penalties, and voided return legs — use with caution.',
  },
  {
    title: 'Flexible Date Searching',
    color: 'border-t-brand-dark-blue',
    icon: TrendingUp,
    body: 'Shifting your travel dates by just ±3 days can reveal fare differences of $100–$400. Use fare calendars on Google Flights or Skyscanner to visualize the cheapest windows.',
  },
];

const resources = [
  { name: 'The Points Guy', url: 'https://thepointsguy.com', desc: 'Card reviews, deal alerts, and points strategy guides' },
  { name: 'One Mile at a Time', url: 'https://onemileatatime.com', desc: 'In-depth airline and hotel loyalty program analysis' },
  { name: 'Doctor of Credit', url: 'https://doctorofcredit.com', desc: 'Credit card bonus tracking and bank deal roundups' },
  { name: 'FlyerTalk', url: 'https://flyertalk.com', desc: 'Community forums for frequent flyers and points enthusiasts' },
  { name: 'Google Flights Tips', url: 'https://support.google.com/travel/answer/6235879', desc: 'Official guide to flexible searching, price tracking, and fare calendars' },
];

export default function TipsPage() {
  return (
    <div className="min-h-screen bg-off">
      <Navbar />

      {/* Hero */}
      <div className="gradient-primary px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display font-black text-3xl md:text-4xl text-white mb-3">
            Travel Tips &amp; Resources
          </h1>
          <p className="font-body text-white/70 text-lg max-w-xl mx-auto">
            Master the art of smart travel
          </p>
        </motion.div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Section 1 — How Airline Points Work */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="bg-paper rounded-xl border border-border p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-purple/10">
              <Award className="h-5 w-5 text-brand-purple" />
            </div>
            <h2 className="font-display font-bold text-xl text-ink">How Airline Points Work</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {pointsCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`rounded-lg border-l-4 ${card.color} bg-off p-5`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${card.accent}`} />
                    <h3 className="font-display font-bold text-sm text-ink">{card.title}</h3>
                  </div>
                  <p className="font-body text-sm text-muted leading-relaxed">{card.body}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Section 2 — Best Travel Credit Cards */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="bg-paper rounded-xl border border-border p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-teal/10">
              <CreditCard className="h-5 w-5 text-brand-teal" />
            </div>
            <h2 className="font-display font-bold text-xl text-ink">Best Travel Credit Cards</h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm font-body">
              <thead>
                <tr className="bg-off">
                  <th className="font-display font-semibold text-xs text-muted px-4 py-3">Card Name</th>
                  <th className="font-display font-semibold text-xs text-muted px-4 py-3">Annual Fee</th>
                  <th className="font-display font-semibold text-xs text-muted px-4 py-3">Sign-Up Bonus</th>
                  <th className="font-display font-semibold text-xs text-muted px-4 py-3 hidden sm:table-cell">Earn Rate</th>
                  <th className="font-display font-semibold text-xs text-muted px-4 py-3 hidden md:table-cell">Best For</th>
                </tr>
              </thead>
              <tbody>
                {creditCards.map((card, i) => (
                  <tr
                    key={card.name}
                    className={i % 2 === 0 ? 'bg-paper' : 'bg-off'}
                  >
                    <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">{card.name}</td>
                    <td className="px-4 py-3 text-muted">{card.fee}</td>
                    <td className="px-4 py-3 text-brand-dark-blue font-semibold">{card.bonus}</td>
                    <td className="px-4 py-3 text-muted hidden sm:table-cell">{card.earn}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="inline-block rounded-full bg-brand-teal/10 px-2.5 py-0.5 text-xs font-semibold text-brand-teal">
                        {card.best}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Section 3 — Cool Opportunities */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="bg-paper rounded-xl border border-border p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-yellow/10">
              <Zap className="h-5 w-5 text-brand-yellow" />
            </div>
            <h2 className="font-display font-bold text-xl text-ink">Cool Opportunities</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((opp) => {
              const Icon = opp.icon;
              return (
                <div
                  key={opp.title}
                  className={`rounded-lg border-t-4 ${opp.color} bg-off p-5`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-ink" />
                    <h3 className="font-display font-bold text-sm text-ink">{opp.title}</h3>
                  </div>
                  <p className="font-body text-sm text-muted leading-relaxed">{opp.body}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Section 4 — Learn More */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="bg-paper rounded-xl border border-border p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-dark-blue/10">
              <BookOpen className="h-5 w-5 text-brand-dark-blue" />
            </div>
            <h2 className="font-display font-bold text-xl text-ink">Learn More</h2>
          </div>

          <div className="space-y-1">
            {resources.map((res) => (
              <a
                key={res.name}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-subtle transition-colors group"
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-off border border-border group-hover:border-brand-teal/40 transition-colors shrink-0">
                  <ChevronRight className="h-4 w-4 text-muted group-hover:text-brand-teal transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-display font-semibold text-sm text-ink">{res.name}</span>
                  <p className="font-body text-xs text-muted truncate">{res.desc}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted/50 group-hover:text-brand-teal shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
