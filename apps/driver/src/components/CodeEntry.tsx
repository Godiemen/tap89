'use client';
import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { cn } from '../design';

/** 4-digit handoff code entry — courier types the code shown by store/customer. */
export default function CodeEntry({
  prompt,
  cta,
  tone = 'gold',
  onSubmit,
}: {
  prompt: string;
  cta: string;
  tone?: 'gold' | 'mint';
  onSubmit: (code: string) => Promise<boolean>;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async () => {
    if (busy || code.length !== 4) return;
    setBusy(true);
    setError(false);
    const ok = await onSubmit(code);
    setBusy(false);
    if (ok) setCode('');
    else setError(true);
  };

  return (
    <div className="px-5 pb-5">
      <label className="mb-2 block text-center text-[10px] font-bold uppercase tracking-[0.16em] text-mist">
        {prompt}
      </label>
      <input
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, '').slice(0, 4));
          setError(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        inputMode="numeric"
        autoComplete="off"
        placeholder="••••"
        aria-label="4-digit handoff code"
        className={cn(
          'tabular mx-auto block w-44 rounded-2xl border-2 bg-white px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.5em] text-ink focus:outline-none',
          error ? 'border-red-400' : 'border-ink/15 focus:border-ink',
        )}
      />
      {error && (
        <p className="mt-2 text-center text-xs font-bold text-red-500">
          Wrong code — check it with {prompt.toLowerCase().includes('store') ? 'the store' : 'the customer'}.
        </p>
      )}
      <button
        onClick={submit}
        disabled={busy || code.length !== 4}
        className={cn(
          'mt-3 flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold transition enabled:hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ink disabled:opacity-40',
          tone === 'mint'
            ? 'bg-mint text-ink shadow-[0_6px_18px_rgba(27,21,38,0.2)]'
            : 'bg-gold text-ink shadow-[0_6px_18px_rgba(255,211,90,0.5)]',
        )}
      >
        <KeyRound size={17} /> {busy ? 'Verifying…' : cta}
      </button>
    </div>
  );
}
