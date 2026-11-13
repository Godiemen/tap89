'use client';
import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, Star } from 'lucide-react';
import { useApp, money, dayKeySAST, dowSAST } from '@sipdash/core';
import { Card, Eyebrow, cn } from '../../src/design';

export default function Analytics() {
  const orders = useApp((s) => s.storeOrders);
  const store = useApp((s) => s.stores.find((x) => x.id === s.account?.userId));

  // last 7 SAST days, oldest → today
  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const ts = Date.now() - (6 - i) * 86400_000;
      return { key: dayKeySAST(ts), label: dowSAST(ts), revenue: 0, count: 0, dead: 0 };
    });
    for (const o of orders) {
      const day = days.find((d) => d.key === dayKeySAST(o.placedAt));
      if (!day) continue;
      day.count += 1;
      if (o.status === 'delivered') day.revenue += o.total;
      if (o.status === 'cancelled' || o.status === 'rejected') day.dead += 1;
    }
    return days;
  }, [orders]);

  const weekRevenue = week.reduce((s, d) => s + d.revenue, 0);
  const weekOrders = week.reduce((s, d) => s + d.count, 0);
  const weekDead = week.reduce((s, d) => s + d.dead, 0);
  const deadPct = weekOrders ? (weekDead / weekOrders) * 100 : 0;
  const bestDay = week.reduce((a, b) => (b.revenue > a.revenue ? b : a), week[0]);
  const max = Math.max(...week.map((d) => d.revenue), 1);

  const topItems = useMemo(() => {
    const acc = new Map<string, { name: string; emoji: string; sold: number; revenue: number }>();
    const weekKeys = new Set(week.map((d) => d.key));
    for (const o of orders) {
      if (o.status !== 'delivered' || !weekKeys.has(dayKeySAST(o.placedAt))) continue;
      for (const i of o.items) {
        const e = acc.get(i.name) ?? { name: i.name, emoji: i.emoji, sold: 0, revenue: 0 };
        e.sold += i.qty;
        e.revenue += i.qty * i.price;
        acc.set(i.name, e);
      }
    }
    return [...acc.values()].sort((a, b) => b.sold - a.sold).slice(0, 4);
  }, [orders, week]);

  const METRICS = [
    { label: 'Sales (7 days)', value: money(weekRevenue), note: `${weekOrders} orders`, pos: true },
    { label: 'Orders (7 days)', value: String(weekOrders), note: `${weekDead} cancelled/rejected`, pos: weekDead === 0 },
    {
      label: 'Rating',
      value: store && store.rating > 0 ? `${store.rating.toFixed(1)}★` : '—',
      note: store?.ratingCount ? `${store.ratingCount} ratings` : 'no ratings yet',
      pos: true,
    },
    {
      label: 'Cancelled + rejected',
      value: `${deadPct.toFixed(1)}%`,
      note: 'share of orders, 7 days',
      pos: deadPct < 5,
    },
  ];

  return (
    <main className="p-4 md:p-7">
      <div className="mb-6">
        <Eyebrow>Performance</Eyebrow>
        <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">Analytics</h1>
        <p className="mt-1 text-xs text-sub">{store?.name ?? 'Store'} · last 7 days</p>
      </div>

      {/* metrics */}
      <section className="mb-6 grid grid-cols-2 gap-px border border-border bg-border xl:grid-cols-4">
        {METRICS.map((m) => (
          <article key={m.label} className="bg-card p-4 md:p-5">
            <p className="text-[11px] text-sub">{m.label}</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
              <strong className="tabular font-mono text-xl font-medium md:text-2xl">{m.value}</strong>
              <span className={cn('flex items-center gap-0.5 text-[10px] font-bold', m.pos ? 'text-pos' : 'text-neg')}>
                {m.pos ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {m.note}
              </span>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,.6fr)]">
        {/* weekly chart */}
        <Card>
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <Eyebrow>Sales pulse</Eyebrow>
              <h2 className="mt-1 font-display text-lg font-bold">Daily delivered revenue</h2>
            </div>
            <span className="border border-border px-3 py-1.5 text-[10px] font-bold">Last 7 days</span>
          </div>
          <div className="p-5">
            <div className="flex h-56 items-end gap-3 border-b border-border">
              {week.map((d, i) => {
                const best = d === bestDay && d.revenue > 0;
                const isToday = i === week.length - 1;
                return (
                  <div key={d.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="tabular font-mono text-[10px] text-sub opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {money(d.revenue)}
                    </span>
                    <div
                      className={cn(
                        'w-full max-w-12 transition-all duration-300 group-hover:brightness-110',
                        isToday ? 'bg-lime' : best ? 'bg-primary' : 'bg-muted hover:bg-[#b1d25a]',
                      )}
                      style={{ height: `${Math.max(3, (d.revenue / max) * 100)}%` }}
                    />
                    <span className={cn('pb-1 pt-1 text-[11px] font-bold', isToday ? 'text-ink' : 'text-sub')}>
                      {isToday ? 'Now' : d.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-sub">
              <Star size={12} className="text-leaf" />
              {bestDay && bestDay.revenue > 0
                ? `${bestDay.label} was your best day — ${money(bestDay.revenue)} in delivered sales.`
                : 'No delivered sales in the last 7 days yet.'}
            </p>
          </div>
        </Card>

        {/* top items */}
        <Card>
          <div className="border-b border-border p-5">
            <Eyebrow>Bestsellers</Eyebrow>
            <h2 className="mt-1 font-display text-lg font-bold">Top items · 7 days</h2>
          </div>
          <div className="divide-y divide-border">
            {topItems.map((t, i) => (
              <div key={t.name} className="flex items-center gap-4 p-4 transition hover:bg-[#fbfaf6]">
                <span className="grid size-9 shrink-0 place-items-center font-mono text-xs font-bold text-sub">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="grid size-10 shrink-0 place-items-center border border-border bg-bg text-lg">{t.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{t.name}</p>
                  <p className="mt-0.5 text-xs text-sub">{t.sold} sold</p>
                </div>
                <span className="tabular shrink-0 font-mono text-xs font-bold">{money(t.revenue)}</span>
              </div>
            ))}
            {topItems.length === 0 && (
              <p className="p-8 text-center text-xs text-sub">No delivered sales yet — bestsellers appear here.</p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
