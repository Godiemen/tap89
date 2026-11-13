'use client';
import { motion } from 'motion/react';
import { Check, Package, ShieldCheck, X, Zap } from 'lucide-react';
import type { DeliveryRequest } from '@sipdash/core';
import { km, money } from '@sipdash/core';
import { cn } from '../design';

/** Incoming-request content rendered inside the shared BottomSheet. */
export default function RequestSheet({
  req,
  onAccept,
  onDecline,
}: {
  req: DeliveryRequest;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const pct = req.expiresIn / 15;
  const urgent = pct < 0.3;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="px-5 pb-5 pt-3"
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest',
            req.surge > 1 ? 'bg-gold text-ink' : 'bg-ink text-white',
          )}
        >
          {req.surge > 1 ? <Zap size={13} /> : <Package size={13} />}
          {req.surge > 1 ? `${req.surge.toFixed(1)}x surge` : 'Delivery request'}
        </span>
        {/* 15s countdown ring */}
        <div
          className="relative grid size-13 place-items-center"
          role="timer"
          aria-label={`${Math.ceil(req.expiresIn)} seconds left to accept`}
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#e9e4dc" strokeWidth="4" />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke={urgent ? '#d4183d' : '#1b1526'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${pct * 151} 151`}
            />
          </svg>
          <span className={cn('tabular font-mono text-sm font-bold', urgent && 'text-wine')}>
            {Math.ceil(req.expiresIn)}
          </span>
        </div>
      </div>

      <p className="tabular mt-3 font-display text-5xl uppercase tracking-tight text-ink">
        {money(req.payout)}
      </p>
      <p className="text-sm text-mist">includes estimated tip</p>

      <div className="mt-5">
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1 size-3 rounded-full bg-gold ring-2 ring-gold/30" aria-hidden="true" />
            <span className="w-px flex-1 bg-ink/15" aria-hidden="true" />
          </div>
          <div className="pb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist">Pick up</p>
            <p className="font-bold text-ink">{req.storeName}</p>
            <p className="text-sm text-mist">{req.storeAddress}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="mt-1 size-3 rounded-sm bg-ink" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist">Drop off</p>
            <p className="font-bold text-ink">{req.customerAddress}</p>
          </div>
        </div>
      </div>

      <div className="tabular mt-4 flex items-center justify-between border-t border-ink/10 pt-3 text-sm text-mist">
        <span>{km(req.distanceKm)} trip</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-grape" />
          {req.items} item{req.items > 1 ? 's' : ''} · alcohol · ID check
        </span>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={onDecline}
          className="flex h-13 flex-1 items-center justify-center gap-2 rounded-full border border-ink/15 py-3.5 font-bold text-ink transition hover:border-ink/40 focus:outline-none focus:ring-2 focus:ring-grape"
        >
          <X size={17} /> Decline
        </button>
        <button
          onClick={onAccept}
          className="flex h-13 flex-[2] items-center justify-center gap-2 rounded-full bg-gold py-3.5 font-bold text-ink shadow-[0_6px_18px_rgba(255,211,90,0.5)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ink"
        >
          <Check size={17} /> Accept
        </button>
      </div>
    </motion.div>
  );
}
