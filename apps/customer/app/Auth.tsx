'use client';
import { useState } from 'react';
import { signIn, signUp } from '@sipdash/core';
import { ShieldCheck } from 'lucide-react';
import { cn } from '../src/design';

const input =
  'h-12 w-full border border-black/15 bg-white px-4 text-sm font-bold outline-none transition focus:border-grape focus:ring-2 focus:ring-grape/30';

export default function Auth() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', address: '', age: false });
  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'up' && !f.age) {
      setMsg('You must be 21 or older to create an account.');
      return;
    }
    setBusy(true);
    setMsg(null);
    const err =
      mode === 'in'
        ? await signIn(f.email, f.password)
        : await signUp({
            role: 'customer',
            name: f.name,
            email: f.email,
            password: f.password,
            phone: f.phone,
            address: f.address,
          });
    if (err) setMsg(err);
    setBusy(false);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-ink p-5">
      <div className="w-full max-w-md bg-cream p-8 shadow-[10px_10px_0_#ffd45c] md:p-10">
        <span className="mb-6 grid size-14 rotate-3 place-items-center bg-grape font-display text-2xl text-white">S</span>
        <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-tight">
          {mode === 'in' ? 'Welcome back.' : 'Create your account.'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-mist">
          {mode === 'in'
            ? 'Sign in to order from your neighborhood bottle shops.'
            : 'Alcohol delivered in minutes. You must be 21+ to order.'}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-px border border-black/15 bg-black/15">
          {(['in', 'up'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setMsg(null);
              }}
              className={cn(
                'h-11 text-xs font-bold uppercase tracking-wider transition',
                mode === m ? 'bg-ink text-white' : 'bg-white text-mist hover:text-ink',
              )}
            >
              {m === 'in' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === 'up' && (
            <>
              <input required value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" className={input} />
              <input value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Phone" className={input} />
              <input required value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="Delivery address" className={input} />
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
          {mode === 'up' && (
            <label className="flex cursor-pointer items-start gap-3 border border-black/15 bg-white p-4">
              <input
                type="checkbox"
                checked={f.age}
                onChange={(e) => set('age', e.target.checked)}
                className="mt-0.5 size-4 accent-grape"
              />
              <span className="text-xs font-bold leading-5">
                I am 21 or older. A courier will verify my government-issued ID at delivery.
              </span>
            </label>
          )}
          {msg && <p className="border border-grape/40 bg-grape/10 p-3 text-xs font-bold text-grape">{msg}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex h-14 w-full items-center justify-center gap-3 bg-grape font-bold text-white transition hover:bg-ink disabled:opacity-60"
          >
            <ShieldCheck size={18} />
            {busy ? 'One sec…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-5 text-mist">
          SipDash · Please enjoy responsibly.
        </p>
      </div>
    </main>
  );
}
