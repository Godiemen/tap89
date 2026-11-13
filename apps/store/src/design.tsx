'use client';
import React from 'react';

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/** Mono uppercase section label */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-leaf', className)}>
      {children}
    </p>
  );
}

/** Sharp-cornered card (radius 0, like the DashDish design) */
export function Card({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const cls = cn('border border-border bg-card', onClick && 'cursor-pointer transition hover:border-ink/30', className);
  return onClick ? (
    <button onClick={onClick} className={cn(cls, 'block w-full text-left')}>
      {children}
    </button>
  ) : (
    <div className={cls}>{children}</div>
  );
}

/** iOS-style switch in the merchant palette */
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
        'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card',
        checked ? 'bg-primary' : 'bg-[#cbced4]',
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
