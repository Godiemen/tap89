'use client';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Navigation, Package, Phone, ShieldCheck } from 'lucide-react';
import { db, isLive, money, orderNo } from '@sipdash/core';
import { cn } from '../design';
import CodeEntry from './CodeEntry';

export type Stage = 'to_store' | 'at_store' | 'to_customer' | 'at_customer';

interface StageCopy {
  title: string;
  sub: string;
  cta: string;
}

const STAGE_COPY: Record<Stage, StageCopy> = {
  to_store: { title: 'Navigate to pickup', sub: 'Head to the store', cta: 'Arrived at pickup' },
  at_store: { title: 'At the store', sub: 'Ask staff for the pickup code', cta: 'Confirm pickup' },
  to_customer: { title: 'Navigate to drop-off', sub: 'Verify ID on arrival', cta: 'Arrived at drop-off' },
  at_customer: {
    title: 'At drop-off',
    sub: 'Check ID, then ask the customer for their code.',
    cta: 'Verify code & hand off',
  },
};

/** Navigation/delivery-stage content rendered inside the shared BottomSheet. */
export default function NavigationBar({
  stage,
  orderId,
  storeName,
  tip,
  etaText,
  onStageAction,
}: {
  stage: Stage;
  orderId: string;
  storeName: string;
  tip: number;
  etaText: string;
  onStageAction: (stage: Stage, code?: string) => Promise<boolean>;
}) {
  const copy = STAGE_COPY[stage];
  const navigating = stage === 'to_store' || stage === 'to_customer';
  const handoff = stage === 'at_customer';

  const [contact, setContact] = useState<{ phone: string; name: string } | null>(null);
  useEffect(() => {
    if (!isLive()) return;
    let on = true;
    const wantStore = stage === 'to_store' || stage === 'at_store';
    void db.orderContacts(orderId).then(({ data }: any) => {
      if (!on || !data?.ok) return;
      const phone = (wantStore ? data.store_phone : data.customer_phone) as string;
      const name = (wantStore ? data.store_name : data.customer_name) as string;
      setContact(phone ? { phone, name } : null);
    });
    return () => {
      on = false;
    };
  }, [orderId, stage]);

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      aria-label="Active delivery navigation"
    >
      {handoff && (
        <p className="mx-3 rounded-xl bg-gold px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-ink">
          Check every ID. Never hand off to a minor.
        </p>
      )}
      <div className="flex items-center gap-4 px-5 pb-4 pt-3">
        <span
          className={cn(
            'grid size-12 shrink-0 place-items-center rounded-full',
            handoff ? 'bg-mint text-ink' : 'bg-ink text-gold',
          )}
        >
          {handoff ? <ShieldCheck size={21} /> : navigating ? <Navigation size={21} /> : <Package size={21} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">
            {copy.title} <span className="ml-1 font-mono text-xs text-mist">{orderNo(orderId)}</span>
          </p>
          <p className="tabular mt-0.5 truncate text-sm text-mist">
            {etaText} · {storeName} · {money(tip)} tip
          </p>
        </div>
      </div>
      <div className="flex gap-2 px-5 pb-5">
        {contact && (
          <a
            href={`tel:${contact.phone}`}
            aria-label={`Call ${contact.name}`}
            className="grid size-14 shrink-0 place-items-center rounded-full bg-mint text-ink transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-ink"
          >
            <Phone size={20} />
          </a>
        )}
        {stage === 'at_store' || stage === 'at_customer' ? null : (
          <button
            onClick={() => void onStageAction(stage)}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ink',
              'bg-gold text-ink shadow-[0_6px_18px_rgba(255,211,90,0.5)]',
            )}
          >
            {copy.cta}
          </button>
        )}
      </div>
      {stage === 'at_store' && (
        <CodeEntry
          prompt="Pickup code from store"
          cta="Confirm pickup"
          onSubmit={(code) => onStageAction('at_store', code)}
        />
      )}
      {stage === 'at_customer' && (
        <CodeEntry
          prompt="Drop-off code from customer"
          cta="Complete delivery"
          tone="mint"
          onSubmit={(code) => onStageAction('at_customer', code)}
        />
      )}
    </motion.div>
  );
}
