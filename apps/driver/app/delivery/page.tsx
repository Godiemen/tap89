'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import { useApp, distKm, km, money, orderNo } from '@sipdash/core';
const LiveMap = dynamic(() => import('@sipdash/ui').then((m) => m.LiveMap), { ssr: false });
import { Card, cn } from '../../src/design';
import CodeEntry from '../../src/components/CodeEntry';

const STAGE_LABEL: Record<string, { title: string; sub: string }> = {
  to_store: { title: 'Heading to store', sub: 'Drive to the pickup location' },
  at_store: { title: 'At the store', sub: 'Collect the order from staff' },
  to_customer: { title: 'Delivering', sub: 'Drive to the customer — verify ID at drop-off' },
  at_customer: { title: 'At drop-off', sub: 'Check ID, then complete delivery' },
};

const STAGE_ORDER = ['to_store', 'at_store', 'to_customer', 'at_customer'];

export default function Delivery() {
  const order = useApp((s) => s.activeDelivery);
  const stage = useApp((s) => s.deliveryStage);
  const driverPos = useApp((s) => s.driverPos);
  const driverLatLng = useApp((s) => s.driverLatLng);
  const confirmPickup = useApp((s) => s.confirmPickup);
  const completeDelivery = useApp((s) => s.completeDelivery);
  const router = useRouter();

  if (!order || !stage) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center md:px-8">
        <h1 className="font-display text-5xl uppercase text-ink">No active delivery</h1>
        <p className="mt-3 text-sm text-mist">Accept a request on the dash to get moving.</p>
        <Link
          href="/"
          className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-ink px-8 font-bold text-gold transition hover:-translate-y-0.5"
        >
          <ArrowLeft size={17} /> Back to dash
        </Link>
      </main>
    );
  }

  const target =
    stage === 'to_store' || stage === 'at_store'
      ? { ...order.storePos, latLng: order.storeLatLng }
      : { ...order.customerPos, latLng: order.customerLatLng };
  const info = STAGE_LABEL[stage];
  const dist = distKm(order.storePos, order.customerPos);
  const estPayout = 3.5 + dist * 1.9 + order.tip;
  const stageIdx = STAGE_ORDER.indexOf(stage);

  return (
    <main className="bg-cream px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-mist hover:text-ink">
          <ArrowLeft size={15} /> Dash
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-grape">Order {orderNo(order.id)}</p>
            <h1 className="font-display text-5xl uppercase tracking-tight text-ink md:text-6xl">{info.title}</h1>
            <p className="mt-2 text-sm text-mist">{info.sub}</p>
          </div>
          {/* stage dots */}
          <div className="flex gap-1.5">
            {STAGE_ORDER.map((s, i) => (
              <span key={s} className={cn('h-2 w-8 rounded-full', i <= stageIdx ? 'bg-gold' : 'bg-ink/10')} />
            ))}
          </div>
        </div>

        {/* map */}
        <Card className="mt-8 overflow-hidden rounded-2xl p-0">
          <LiveMap
            height={300}
            markers={[
              { ...order.storePos, emoji: '🏪', label: order.storeName },
              { ...order.customerPos, emoji: '🏠', label: 'Customer' },
            ]}
            route={{ from: { ...driverPos, latLng: driverLatLng }, to: target }}
            driver={{ x: driverPos.x, y: driverPos.y, latLng: driverLatLng }}
          />
        </Card>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* legs */}
          <Card className="rounded-2xl">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em] text-mist">Route</p>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="mt-1 size-3 rounded-full bg-gold" />
                <span className="w-px flex-1 bg-ink/15" />
              </div>
              <div className="flex flex-1 items-start justify-between gap-3 pb-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist">
                    Pick up · {order.items.length || '—'} items
                  </p>
                  <p className="font-bold text-ink">{order.storeName}</p>
                  <p className="text-sm text-mist">
                    {stage === 'at_store' ? 'Show order number to staff' : 'Head to the store'}
                  </p>
                </div>
                {stageIdx >= 1 && <CheckCircle2 size={19} className="shrink-0 text-emerald-500" />}
              </div>
            </div>
            <div className="flex gap-4">
              <span className="mt-1 size-3 rounded-full bg-grape" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist">
                  Drop off · ID check required
                </p>
                <p className="font-bold text-ink">{order.customerAddress}</p>
                <p className="text-sm text-mist">Verify customer is 21+ before handing over</p>
              </div>
            </div>
          </Card>

          {/* payout */}
          <Card className="rounded-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist">Estimated payout</p>
            <p className="tabular mt-1 font-display text-6xl uppercase tracking-tight text-ink">{money(estPayout)}</p>
            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-mist">
                <span>Trip distance</span>
                <span className="font-bold text-ink">{km(dist)}</span>
              </div>
              <div className="flex justify-between text-mist">
                <span>Tip included</span>
                <span className="font-bold text-ink">{money(order.tip)}</span>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-ink/10 pt-4 text-xs font-bold text-ink">
              <ShieldCheck size={14} className="text-grape" /> No ID, no handoff — protect your rating
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className="sticky bottom-5 mt-8">
          {stage === 'at_store' ? (
            <Card className="rounded-2xl p-0 py-2">
              <CodeEntry
                prompt="Pickup code from store"
                cta="Confirm pickup"
                onSubmit={(code) => confirmPickup(code)}
              />
            </Card>
          ) : stage === 'at_customer' ? (
            <Card className="rounded-2xl p-0 py-2">
              <CodeEntry
                prompt="Drop-off code from customer"
                cta="Verify code & complete delivery"
                tone="mint"
                onSubmit={async (code) => {
                  const ok = await completeDelivery(code);
                  if (ok) router.push('/');
                  return ok;
                }}
              />
            </Card>
          ) : (
            <div className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-ink font-bold text-cream shadow-[0_10px_30px_rgba(27,21,38,0.3)]">
              <Navigation size={18} className="animate-pulse text-gold" /> Navigating
              <ArrowRight size={16} className="text-cream/50" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
