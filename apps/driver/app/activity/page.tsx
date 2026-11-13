'use client';
import { Bike, CheckCheck, PackageOpen, Star, ThumbsUp } from 'lucide-react';
import { useApp, km, money, timeAgo } from '@sipdash/core';
import { Card } from '../../src/design';

const STATS = [
  { label: 'Acceptance', value: '94%', icon: ThumbsUp, tint: 'bg-grape/10 text-grape' },
  { label: 'Completion', value: '99%', icon: CheckCheck, tint: 'bg-mint/25 text-emerald-700' },
  { label: 'Rating', value: '4.9★', icon: Star, tint: 'bg-gold/40 text-ink' },
];

export default function Activity() {
  const trips = useApp((s) => s.trips);

  return (
    <main className="bg-cream px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-4xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-grape">Your record</p>
        <h1 className="font-display text-5xl uppercase tracking-tight text-ink md:text-6xl">Activity</h1>

        {/* stats */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {STATS.map((s) => (
            <Card key={s.label} className="rounded-2xl p-4 text-center transition hover:border-ink/30 md:p-5">
              <span className={`mx-auto grid size-10 place-items-center rounded-full ${s.tint}`}>
                <s.icon size={17} />
              </span>
              <p className="tabular mt-3 font-display text-2xl text-ink md:text-3xl">{s.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-mist">{s.label}</p>
            </Card>
          ))}
        </div>

        {trips.length ? (
          <Card className="mt-8 divide-y divide-ink/10 rounded-2xl p-0">
            {trips.map((t) => (
              <div key={t.id} className="flex items-center gap-4 p-5 transition hover:bg-stone/60">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-stone">
                  <Bike size={17} className="text-grape" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{t.storeName}</p>
                  <p className="mt-0.5 truncate text-sm text-mist">{t.customerAddress}</p>
                  <p className="tabular mt-0.5 font-mono text-[11px] text-mist">
                    {timeAgo(t.at)} · {km(t.distanceKm)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tabular font-bold text-ink">{money(t.payout + t.tip)}</p>
                  {t.rating ? (
                    <p className="mt-1 flex items-center justify-end gap-1 text-xs font-bold text-amber-500">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} size={11} fill="currentColor" />
                      ))}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-mist">No rating</p>
                  )}
                </div>
              </div>
            ))}
          </Card>
        ) : (
          <Card className="mt-8 rounded-2xl py-20 text-center">
            <PackageOpen size={40} strokeWidth={1.3} className="mx-auto mb-4 text-grape" />
            <h3 className="text-xl font-bold text-ink">No deliveries yet</h3>
            <p className="mt-2 text-sm text-mist">Go online to start receiving requests.</p>
          </Card>
        )}
      </div>
    </main>
  );
}
