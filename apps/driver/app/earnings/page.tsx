'use client';
import { ArrowRight, Bike, Star, TrendingUp, Zap } from 'lucide-react';
import { useApp, money, timeAgo } from '@sipdash/core';
import { Card, cn } from '../../src/design';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK = [38.4, 52.1, 44.0, 61.75, 88.3, 102.4, 47.35];

export default function Earnings() {
  const earnings = useApp((s) => s.driverEarnings);
  const trips = useApp((s) => s.trips);
  const weekTotal = WEEK.reduce((a, b) => a + b, 0) + earnings;
  const max = Math.max(...WEEK, earnings, 1);
  const bestDay = Math.max(...WEEK);

  return (
    <main className="bg-cream px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-4xl">
        {/* hero */}
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-grape">This week</p>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <h1 className="tabular font-display text-7xl uppercase leading-none tracking-tight text-ink md:text-8xl">
            {money(weekTotal)}
          </h1>
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-mint/25 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <TrendingUp size={13} /> 12% vs last week
          </span>
        </div>

        {/* chart */}
        <Card className="mt-10 rounded-2xl">
          <div className="mb-8 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist">Daily earnings</p>
            <span className="rounded-full bg-gold/40 px-3 py-1 text-[11px] font-bold text-ink">
              Sat was your best day
            </span>
          </div>
          <div className="flex h-48 items-end gap-3 border-b border-ink/10 pb-0">
            {WEEK.map((v, i) => {
              const best = v === bestDay;
              return (
                <div key={i} className="group flex h-full flex-1 cursor-default flex-col items-center justify-end gap-2">
                  <span className="tabular font-mono text-[10px] text-mist opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {money(v)}
                  </span>
                  <div
                    className={cn(
                      'w-full max-w-10 rounded-t-lg transition-all duration-300 group-hover:brightness-95',
                      best ? 'bg-grape' : 'bg-stone hover:bg-grape/30',
                    )}
                    style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
                  />
                  <span className="border-t-2 border-transparent pb-1 pt-1 text-[11px] font-bold text-mist">
                    {DAYS[i]}
                  </span>
                </div>
              );
            })}
            <div className="group flex h-full flex-1 cursor-default flex-col items-center justify-end gap-2">
              <span className="tabular font-mono text-[10px] font-bold text-ink">{money(earnings)}</span>
              <div
                className="w-full max-w-10 rounded-t-lg bg-gold transition-all duration-300 group-hover:brightness-95"
                style={{ height: `${Math.max(4, (earnings / max) * 100)}%` }}
              />
              <span className="border-t-2 border-transparent pb-1 pt-1 text-[11px] font-bold text-ink">Now</span>
            </div>
          </div>
        </Card>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* surge */}
          <Card accent className="rounded-2xl">
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-gold">
                <Zap size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink">Surge earnings</p>
                <p className="mt-0.5 truncate text-sm text-mist">Downtown core · 1.5x until 9pm</p>
              </div>
              <span className="tabular shrink-0 rounded-lg bg-ink px-3 py-1.5 text-sm font-bold text-gold">
                +R14.20
              </span>
            </div>
          </Card>

          {/* instant cashout */}
          <button className="group flex items-center gap-4 rounded-2xl bg-gold p-5 text-left shadow-[0_10px_30px_rgba(255,212,92,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(255,212,92,0.5)] focus:outline-none focus:ring-2 focus:ring-ink md:p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-gold">
              <Zap size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">Instant cash out</p>
              <p className="tabular mt-0.5 text-sm font-bold text-ink/60">{money(weekTotal)} available</p>
            </div>
            <ArrowRight size={18} className="shrink-0 text-ink transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* trips */}
        <h2 className="mb-4 mt-10 font-display text-3xl uppercase tracking-tight text-ink">Recent trips</h2>
        <Card className="divide-y divide-ink/10 rounded-2xl p-0">
          {trips.map((t) => (
            <div key={t.id} className="flex items-center gap-4 p-5 transition hover:bg-stone/60">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-stone">
                <Bike size={17} className="text-grape" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{t.storeName}</p>
                <p className="mt-0.5 truncate text-sm text-mist">
                  {t.customerAddress} · {timeAgo(t.at)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular font-bold text-ink">{money(t.payout + t.tip)}</p>
                {t.rating ? (
                  <p className="mt-0.5 flex items-center justify-end gap-1 text-xs font-bold text-amber-500">
                    <Star size={11} fill="currentColor" /> {t.rating}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </main>
  );
}
