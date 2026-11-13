'use client';
import { useState } from 'react';
import { signIn, signUp, type Category } from '@sipdash/core';
import { UtensilsCrossed } from 'lucide-react';
import { cn } from '../src/design';

const input =
  'h-11 w-full border border-border bg-white px-3.5 text-sm font-bold text-ink outline-none transition focus:border-ring';

const CATS: { key: Category; label: string }[] = [
  { key: 'beer', label: 'Beer' },
  { key: 'wine', label: 'Wine' },
  { key: 'spirits', label: 'Spirits' },
  { key: 'mixers', label: 'Mixers' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'extras', label: 'Extras' },
];

export default function Auth() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ name: '', email: '', password: '', address: '', phone: '' });
  const [cats, setCats] = useState<Category[]>(['beer']);
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  const toggleCat = (c: Category) =>
    setCats((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'up' && cats.length === 0) {
      setMsg('Pick at least one category your store sells.');
      return;
    }
    setBusy(true);
    setMsg(null);
    const err =
      mode === 'in'
        ? await signIn(f.email, f.password)
        : await signUp({
            role: 'store',
            name: f.name,
            email: f.email,
            password: f.password,
            address: f.address,
            phone: f.phone,
            categories: cats,
          });
    if (err) setMsg(err);
    setBusy(false);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-deep p-5">
      <div className="w-full max-w-md bg-card p-8 md:p-10">
        <span className="mb-6 grid size-14 place-items-center bg-lime text-deep">
          <UtensilsCrossed size={26} strokeWidth={2.5} />
        </span>
        <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
          {mode === 'in' ? 'Merchant sign in' : 'Sell on SipDash'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-sub">
          {mode === 'in'
            ? 'Sign in to manage orders, menu and payouts.'
            : 'Register your bottle shop. Our ops team reviews every storefront before it goes live.'}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-px border border-border bg-border">
          {(['in', 'up'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setMsg(null);
              }}
              className={cn(
                'h-11 text-xs font-bold uppercase tracking-wider transition',
                mode === m ? 'bg-deep text-white' : 'bg-card text-sub hover:text-ink',
              )}
            >
              {m === 'in' ? 'Sign in' : 'Register store'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === 'up' && (
            <>
              <input required value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Store name" className={input} />
              <input required value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="Store address" className={input} />
              <input required type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Store phone (customers/drivers can call this)" className={input} />
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-sub">What do you sell?</p>
                <div className="flex flex-wrap gap-2">
                  {CATS.map(({ key, label }) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => toggleCat(key)}
                      className={cn(
                        'border px-3 py-2 text-xs font-bold transition',
                        cats.includes(key)
                          ? 'border-deep bg-deep text-white'
                          : 'border-border bg-white text-sub hover:border-ink',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <input required type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="Work email" className={input} />
          <input
            required
            type="password"
            minLength={6}
            value={f.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="Password (6+ characters)"
            className={input}
          />
          {msg && <p className="border border-wine/40 bg-wine/10 p-3 text-xs font-bold text-wine">{msg}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex h-12 w-full items-center justify-center bg-deep text-sm font-bold text-white transition hover:bg-ink disabled:opacity-60"
          >
            {busy ? 'One sec…' : mode === 'in' ? 'Sign in' : 'Submit for review'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-5 text-sub">
          SipDash Merchant · Licensed alcohol retailers only.
        </p>
      </div>
    </main>
  );
}
