'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PricePoint {
  date: string;
  price: number;
}

interface PriceChartProps {
  priceHistory: PricePoint[];
  currentPrice: number;
}

export default function PriceChart({ priceHistory, currentPrice }: Readonly<PriceChartProps>) {
  const stats = useMemo(() => {
    if (priceHistory.length === 0) {
      return { low: 0, high: 0, avg: 0, thirtyDaysAgo: 0, trend: 0 };
    }

    const prices = priceHistory.map((p) => p.price);
    const low = Math.min(...prices);
    const high = Math.max(...prices);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const thirtyDaysAgo = prices[0];
    const trend = currentPrice - thirtyDaysAgo;

    return { low, high, avg, thirtyDaysAgo, trend };
  }, [priceHistory, currentPrice]);

  const trendPercent =
    stats.thirtyDaysAgo > 0
      ? ((stats.trend / stats.thirtyDaysAgo) * 100).toFixed(1)
      : '0';

  const trendDown = stats.trend <= 0;

  return (
    <div className="rounded-2xl bg-paper border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <p className="font-body text-xs text-muted uppercase tracking-wide">
            Price History
          </p>
          <p className="font-display text-2xl font-bold text-ink mt-0.5">
            ${currentPrice}
          </p>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-display font-bold ${
            trendDown
              ? 'bg-[#E3F8E9] text-brand-dark-green'
              : 'bg-[#FFBEB9] text-brand-dark-red'
          }`}
        >
          {trendDown ? (
            <TrendingDown className="h-3.5 w-3.5" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5" />
          )}
          {trendDown ? '' : '+'}
          {trendPercent}%
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pb-1">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={priceHistory}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2875F1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2196D4" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#EBF1F7"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#6E8099', fontFamily: 'var(--font-body)' }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />

            <YAxis
              tickFormatter={(v: number) => `$${v}`}
              tick={{ fontSize: 10, fill: '#6E8099', fontFamily: 'var(--font-body)' }}
              axisLine={false}
              tickLine={false}
              tickMargin={4}
              width={52}
            />

            <Tooltip
              contentStyle={{
                background: '#0A1628',
                border: 'none',
                borderRadius: 10,
                padding: '8px 12px',
                fontFamily: 'var(--font-display)',
                fontSize: 12,
                color: '#fff',
              }}
              formatter={(value) => [`$${value}`, 'Price']}
              labelStyle={{ color: '#B5E4F3', fontSize: 10, fontFamily: 'var(--font-body)' }}
            />

            <ReferenceLine
              y={stats.low}
              stroke="#7CD092"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />

            <Area
              type="monotone"
              dataKey="price"
              stroke="#2875F1"
              strokeWidth={2.5}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#2875F1',
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stat boxes */}
      <div className="grid grid-cols-3 gap-px bg-border">
        <StatBox
          label="30 days ago"
          value={`$${stats.thirtyDaysAgo}`}
        />
        <StatBox
          label="Lowest seen"
          value={`$${stats.low}`}
          valueClass="text-brand-green"
        />
        <StatBox
          label="30-day avg"
          value={`$${stats.avg}`}
        />
      </div>

      {/* Trend insight */}
      <div className="px-5 py-3 border-t border-border">
        <p className="font-body text-sm text-brand-blue">
          {trendDown ? (
            <>
              Prices have dropped{' '}
              <span className="font-display font-bold">
                ${Math.abs(stats.trend)}
              </span>{' '}
              ({Math.abs(Number(trendPercent))}%) in the last 30 days — a good
              time to book.
            </>
          ) : (
            <>
              Prices have risen{' '}
              <span className="font-display font-bold">
                ${Math.abs(stats.trend)}
              </span>{' '}
              ({trendPercent}%) in the last 30 days — consider setting a price
              alert.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  valueClass = 'text-ink',
}: Readonly<{
  label: string;
  value: string;
  valueClass?: string;
}>) {
  return (
    <div className="bg-paper px-4 py-3 text-center">
      <p className="font-body text-[10px] text-muted uppercase tracking-wide">
        {label}
      </p>
      <p className={`font-display text-base font-bold mt-0.5 ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}
