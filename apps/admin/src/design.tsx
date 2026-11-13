'use client';
import React from 'react';

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-sub', className)}>
      {children}
    </p>
  );
}

/** Sharp-cornered bordered card */
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('border border-border bg-card', className)}>{children}</div>;
}

/** Status pill in the ops-console style */
export const STATUS_CLS: Record<string, string> = {
  Pending: 'border-[#a87900] bg-[#fff3c4] text-[#6c4d00]',
  Approved: 'border-[#377d53] bg-[#dff4e5] text-[#225d3a]',
  'Needs review': 'border-[#b85b32] bg-[#ffe1d2] text-[#7b351b]',
  Declined: 'border-[#9c9c9c] bg-[#eeeeec] text-[#555555]',
  Live: 'border-[#4d6430] bg-[#eef6d9] text-[#37511f]',
  Done: 'border-[#377d53] bg-[#dff4e5] text-[#225d3a]',
  Issue: 'border-[#9c9c9c] bg-[#eeeeec] text-[#555555]',
};

export function StatusPill({ label }: { label: string }) {
  return (
    <span className={cn('w-fit border px-2 py-1 text-[9px] font-semibold', STATUS_CLS[label] ?? STATUS_CLS.Pending)}>
      {label}
    </span>
  );
}

/** iOS-style switch */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-card',
        checked ? 'bg-ink' : 'bg-[#cbced4]',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
