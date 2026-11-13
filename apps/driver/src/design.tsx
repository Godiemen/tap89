'use client';
import React from 'react';

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export function Eyebrow({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={cn('mb-2 text-xs font-bold uppercase tracking-[0.18em]', light ? 'text-gold' : 'text-grape')}>
      {children}
    </p>
  );
}

/** Light card matching the driver app theme */
export function Card({
  children,
  className,
  onClick,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  const cls = cn(
    'border p-5 transition md:p-6',
    accent
      ? 'border-gold/80 bg-gold/10'
      : 'border-ink/10 bg-white shadow-[0_4px_20px_rgba(27,21,38,0.06)]',
    onClick && 'cursor-pointer hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-[0_8px_28px_rgba(27,21,38,0.12)]',
    className,
  );
  return onClick ? (
    <button onClick={onClick} className={cn(cls, 'block w-full text-left')}>
      {children}
    </button>
  ) : (
    <div className={cls}>{children}</div>
  );
}

export function Pill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2 text-xs font-bold transition',
        active
          ? 'border-ink bg-ink text-gold'
          : 'border-ink/15 bg-white text-ink/70 hover:border-ink/50',
      )}
    >
      {children}
    </button>
  );
}
