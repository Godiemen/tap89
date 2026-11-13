'use client';
import { useState } from 'react';
import { signIn } from '@sipdash/core';
import { LayoutGrid } from 'lucide-react';

const input =
  'h-11 w-full border border-border bg-white px-3.5 text-sm font-semibold text-ink outline-none transition focus:border-ink';

export default function Auth() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ email: '', password: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const err = await signIn(f.email, f.password);
    if (err) setMsg(err);
    setBusy(false);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-deep p-5">
      <div className="w-full max-w-sm border border-white/10 bg-white p-8 md:p-10">
        <span className="mb-6 grid size-14 place-items-center bg-deep text-lime">
          <LayoutGrid size={26} />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-[-0.04em] text-ink">SIPDASH OPS</h1>
        <p className="mt-3 text-sm leading-6 text-sub">
          Operator sign in. Admin access is granted from the Supabase dashboard — see supabase/README.md.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            required
            type="email"
            value={f.email}
            onChange={(e) => setF((s) => ({ ...s, email: e.target.value }))}
            placeholder="Work email"
            className={input}
          />
          <input
            required
            type="password"
            value={f.password}
            onChange={(e) => setF((s) => ({ ...s, password: e.target.value }))}
            placeholder="Password"
            className={input}
          />
          {msg && <p className="border border-coral/40 bg-coral/10 p-3 text-xs font-bold text-coral">{msg}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex h-12 w-full items-center justify-center bg-deep text-sm font-bold text-white transition hover:bg-ink disabled:opacity-60"
          >
            {busy ? 'One sec…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
