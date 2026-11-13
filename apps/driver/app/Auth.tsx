'use client';
import { useState } from 'react';
import { signIn, signUp } from '@sipdash/core';
import { Bike } from 'lucide-react';
import { cn } from '../src/design';

const input =
  'h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-sm font-bold text-ink outline-none transition focus:border-grape focus:ring-2 focus:ring-grape/30';

export default function Auth() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', vehicle: '', plate: '' });
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const err =
      mode === 'in'
        ? await signIn(f.email, f.password)
        : await signUp({
            role: 'driver',
            name: f.name,
            email: f.email,
            password: f.password,
            vehicle: f.vehicle,
            plate: f.plate,
            phone: f.phone,
          });
    if (err) setMsg(err);
    setBusy(false);
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-ink p-5">
      <div className="w-full max-w-md rounded-3xl bg-cream p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:p-10">
        <span className="mb-6 grid size-14 -rotate-3 place-items-center rounded-2xl bg-ink font-display text-2xl text-gold">
          <Bike size={26} />
        </span>
        <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-tight text-ink">
          {mode === 'in' ? 'Back on the road.' : 'Drive with SipDash.'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-mist">
          {mode === 'in'
            ? 'Sign in to go online and start earning.'
            : 'Apply to deliver. Our ops team verifies every courier before you can go online.'}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-stone p-1">
          {(['in', 'up'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setMsg(null);
              }}
              className={cn(
                'h-10 rounded-full text-xs font-bold uppercase tracking-wider transition',
                mode === m ? 'bg-ink text-gold' : 'text-mist hover:text-ink',
              )}
            >
              {m === 'in' ? 'Sign in' : 'Apply to drive'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === 'up' && (
            <>
              <input required value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" className={input} />
              <input required type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Phone (customers/stores call you on this)" className={input} />
              <input required value={f.vehicle} onChange={(e) => set('vehicle', e.target.value)} placeholder="Vehicle (e.g. Toyota Corolla)" className={input} />
              <input required value={f.plate} onChange={(e) => set('plate', e.target.value)} placeholder="License plate" className={input} />
            </>
          )}
          <input required type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="Email" className={input} />
          <input
            required
            type="password"
            minLength={6}
            value={f.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="Password (6+ characters)"
            className={input}
          />
          {msg && <p className="rounded-xl border border-grape/40 bg-grape/10 p-3 text-xs font-bold text-grape">{msg}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gold font-display text-lg uppercase text-ink transition hover:bg-ink hover:text-gold disabled:opacity-60"
          >
            {busy ? 'One sec…' : mode === 'in' ? 'Sign in' : 'Submit application'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-5 text-mist">
          SipDash Drive · Couriers must be 21+ and complete ID-check training.
        </p>
      </div>
    </main>
  );
}
