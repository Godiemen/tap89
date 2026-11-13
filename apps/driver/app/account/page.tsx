'use client';
import {
  BadgeCheck,
  Car,
  ChevronRight,
  CreditCard,
  Package,
  ShieldCheck,
} from 'lucide-react';
import { useApp, signOut } from '@sipdash/core';
import { Card, cn } from '../../src/design';

export default function DriverAccount() {
  const online = useApp((s) => s.driverOnline);
  const trips = useApp((s) => s.trips);
  const earnings = useApp((s) => s.driverEarnings);
  const account = useApp((s) => s.account);
  const name = account?.name ?? 'Driver';
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const ROWS = [
    { icon: ShieldCheck, label: 'Documents', sub: "Driver's license, 21+ cert, insurance", status: account?.verified ? 'Verified' : 'Pending' },
    { icon: Car, label: 'Vehicle', sub: `${account?.vehicle || 'Vehicle'} · ${account?.plate || '—'}`, status: null },
    { icon: CreditCard, label: 'Payout method', sub: 'Set up in onboarding', status: null },
    { icon: Package, label: 'Delivery bag', sub: 'Insulated cooler — required for alcohol', status: 'Required' },
    { icon: BadgeCheck, label: 'Alcohol delivery training', sub: 'ID verification certified', status: account?.verified ? 'Verified' : 'Pending' },
  ];

  return (
    <main className="bg-cream px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-grape">Driver profile</p>
        <h1 className="font-display text-5xl uppercase tracking-tight text-ink md:text-6xl">{name}</h1>

        {/* profile card */}
        <Card className="mt-8 flex items-center gap-5 rounded-2xl">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-ink font-display text-2xl text-gold shadow-[0_0_0_4px_rgba(255,212,92,0.4)]">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-ink">{name}</p>
            <p className="mt-0.5 truncate text-sm text-mist">
              {account?.vehicle} · {account?.plate} · {account?.email}
            </p>
          </div>
          <span
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider',
              online ? 'bg-mint/25 text-emerald-700' : 'bg-ink/5 text-ink/50',
            )}
          >
            <span className={cn('size-1.5 rounded-full', online ? 'animate-pulse bg-emerald-500' : 'bg-ink/30')} />
            {online ? 'Online' : 'Offline'}
          </span>
        </Card>

        {/* stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Trips today', value: String(trips.length) },
            { label: 'Earned', value: `R${earnings.toFixed(0)}` },
            { label: 'ID checks', value: '100%' },
          ].map((s) => (
            <Card key={s.label} className="rounded-2xl p-4 text-center">
              <p className="tabular font-display text-2xl text-ink md:text-3xl">{s.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-mist">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* links */}
        <Card className="mt-6 divide-y divide-ink/10 rounded-2xl p-0">
          {ROWS.map((row) => (
            <button key={row.label} className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-stone/60">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-stone">
                <row.icon size={17} className="text-grape" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{row.label}</p>
                <p className="mt-0.5 truncate text-xs text-mist">{row.sub}</p>
              </div>
              {row.status && (
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                    row.status === 'Verified' ? 'bg-mint/25 text-emerald-700' : 'bg-gold/40 text-ink',
                  )}
                >
                  {row.status}
                </span>
              )}
              <ChevronRight size={16} className="shrink-0 text-mist" />
            </button>
          ))}
        </Card>

        {/* safety strip */}
        <div className="mt-6 rounded-2xl bg-ink p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold/70">Courier rule #1</p>
          <p className="mt-1.5 font-display text-xl uppercase leading-tight text-gold">
            Check every ID. Never hand off to a minor.
          </p>
        </div>

        <button
          onClick={() => void signOut()}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl border border-ink/15 text-sm font-bold text-ink transition hover:bg-stone"
        >
          Sign out
        </button>

        <p className="mt-10 text-center text-[11px] leading-5 text-mist">
          SipDash Drive prototype · Couriers must be 21+ and complete alcohol-delivery training.
        </p>
      </div>
    </main>
  );
}
