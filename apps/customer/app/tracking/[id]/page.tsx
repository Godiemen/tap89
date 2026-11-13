'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { ArrowLeft, Bike, CheckCircle2, Clock3, KeyRound, Phone, Star, Store } from 'lucide-react';
const LiveMap = dynamic(() => import('@sipdash/ui').then((m) => m.LiveMap), { ssr: false });
import { db, isLive, useApp, STATUS_COLOR, STATUS_LABEL, clock, money, orderNo, fetchRoute, haversineKm } from '@sipdash/core';
import { cn } from '../../../src/design';

const STEPS = ['placed', 'accepted', 'preparing', 'ready', 'driver_assigned', 'picked_up', 'en_route', 'delivered'];

export default function Tracking() {
  const { id } = useParams<{ id: string }>();
  const order = useApp((s) => s.orders.find((o) => o.id === id));
  const rateOrder = useApp((s) => s.rateOrder);
  const [contacts, setContacts] = useState<{ driver?: string; store?: string }>({});
  const [dropoffCode, setDropoffCode] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !isLive()) return;
    let on = true;
    void db.orderContacts(id).then(({ data }: any) => {
      if (!on || !data?.ok) return;
      setContacts({
        driver: data.driver_phone || undefined,
        store: data.store_phone || undefined,
      });
    });
    void db.orderCode(id).then(({ data }: any) => {
      if (on && data?.ok) setDropoffCode(data.dropoff_code ?? null);
    });
    return () => {
      on = false;
    };
  }, [id, order?.driverName]);

  // real-road ETA: OSRM duration for the remaining courier→customer leg,
  // throttled so GPS ticks don't spam the routing API
  const [roadEtaMin, setRoadEtaMin] = useState<number | null>(null);
  const lastEtaFetch = useRef(0);
  useEffect(() => {
    if (!order?.driverLatLng || !order?.customerLatLng) return;
    if (!['picked_up', 'en_route', 'driver_assigned'].includes(order.status)) return;
    if (Date.now() - lastEtaFetch.current < 20_000) return;
    lastEtaFetch.current = Date.now();
    let on = true;
    void fetchRoute([order.driverLatLng, order.customerLatLng]).then((r) => {
      if (on) setRoadEtaMin(r ? Math.max(1, Math.round(r.totalDurationS / 60)) : null);
    });
    return () => {
      on = false;
    };
  }, [order?.driverLatLng?.lat, order?.driverLatLng?.lng, order?.status, order?.customerLatLng]);

  if (!order) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center md:px-8">
        <h1 className="font-display text-5xl uppercase">Order not found</h1>
        <Link href="/orders" className="mt-6 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4">
          <ArrowLeft size={16} /> All orders
        </Link>
      </main>
    );
  }

  const stepIdx = STEPS.indexOf(order.status);
  const done = order.status === 'delivered';
  const dead = ['rejected', 'cancelled'].includes(order.status);
  // ETA: real road time when we have the courier's GPS fix; sim estimate otherwise
  const remaining =
    roadEtaMin ??
    (order.status === 'en_route' && order.driverProgress !== undefined
      ? Math.max(1, Math.ceil((1 - order.driverProgress) * 20))
      : order.etaMinutes);

  return (
    <main className="bg-cream px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/orders" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-mist hover:text-ink">
          <ArrowLeft size={15} /> All orders
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-grape">{order.storeName}</p>
            <h1 className="font-display text-5xl uppercase tracking-tight md:text-6xl">Order {orderNo(order.id)}</h1>
          </div>
          <span
            className="rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white"
            style={{ background: STATUS_COLOR[order.status] ?? '#1b1526' }}
          >
            {STATUS_LABEL[order.status]}
          </span>
        </div>

        {/* map */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white">
          <LiveMap
            height={340}
            markers={[
              { ...order.storePos, latLng: order.storeLatLng, emoji: '🏪', label: order.storeName },
              { ...order.customerPos, latLng: order.customerLatLng, emoji: '🏠', label: 'You' },
            ]}
            route={{
              from: { x: order.storePos.x, y: order.storePos.y, latLng: order.storeLatLng },
              to: { x: order.customerPos.x, y: order.customerPos.y, latLng: order.customerLatLng },
              progress: order.driverProgress,
            }}
            driver={
              order.driverLatLng
                ? { latLng: order.driverLatLng }
                : order.driverPos
                  ? { x: order.driverPos.x, y: order.driverPos.y }
                  : undefined
            }
          />
        </div>

        {/* drop-off handoff code — the courier can't read it, only verify it */}
        {dropoffCode && !done && !dead && (
          <section className="mt-6 flex items-center gap-5 rounded-2xl border-2 border-ink bg-ink p-6 text-cream">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gold text-ink">
              <KeyRound size={21} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cream/60">
                Your handoff code
              </p>
              <p className="mt-0.5 text-sm text-cream/80">
                Show this to the courier when your order arrives — no code, no handoff.
              </p>
            </div>
            <p className="tabular shrink-0 font-mono text-4xl font-bold tracking-[0.3em] text-gold">
              {dropoffCode}
            </p>
          </section>
        )}

        {/* eta + driver */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="border border-black/10 bg-white p-6">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-full bg-gold">
                <Clock3 size={20} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist">Estimated arrival</p>
                <p className="font-display text-3xl uppercase">
                  {done ? 'Delivered' : dead ? STATUS_LABEL[order.status] : `${remaining} min`}
                </p>
              </div>
            </div>
            {order.driverName && !dead ? (
              <div className="mt-5 flex items-center gap-4 border-t border-black/10 pt-5">
                <span className="grid size-12 place-items-center rounded-full bg-grape text-white">
                  <Bike size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist">Your courier</p>
                  <p className="truncate font-bold">{order.driverName}</p>
                </div>
                {contacts.driver && (
                  <a
                    href={`tel:${contacts.driver}`}
                    aria-label={`Call ${order.driverName}`}
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-mint transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <Phone size={18} />
                  </a>
                )}
              </div>
            ) : null}
            {contacts.store && !done && !dead && (
              <div className="mt-4 flex items-center gap-4 border-t border-black/10 pt-4">
                <span className="grid size-12 place-items-center rounded-full bg-stone">
                  <Store size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist">The store</p>
                  <p className="truncate font-bold">{order.storeName}</p>
                </div>
                <a
                  href={`tel:${contacts.store}`}
                  aria-label={`Call ${order.storeName}`}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-mint transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <Phone size={18} />
                </a>
              </div>
            )}
          </section>

          {/* progress */}
          <section className="border border-black/10 bg-white p-6">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-mist">Progress</p>
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={cn('h-2 flex-1 rounded-full', i <= stepIdx ? 'bg-grape' : 'bg-stone')}
                />
              ))}
            </div>
            <p className="mt-4 text-sm font-bold">{STATUS_LABEL[order.status]}</p>
            <p className="mt-1 text-xs text-mist">
              {done
                ? 'Enjoy responsibly.'
                : order.status === 'en_route'
                  ? `${remaining} min — have your ID ready`
                  : 'Your driver will be assigned shortly'}
            </p>
            {done && order.rating === undefined ? (
              <div className="mt-5 border-t border-black/10 pt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-mist">Rate your order</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => rateOrder(order.id, n)} aria-label={`Rate ${n}`}>
                      <Star size={26} className="text-black/15 transition hover:fill-gold hover:text-gold" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {/* items + timeline */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="border border-black/10 bg-white p-6">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-mist">{order.storeName}</p>
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between py-1 text-sm">
                <span>
                  {i.emoji} {i.qty}× {i.name}
                </span>
                <span className="font-bold">{money(i.price * i.qty)}</span>
              </div>
            ))}
            <div className="mt-4 flex justify-between border-t border-black/10 pt-4 font-bold">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
          </section>

          <section className="border border-black/10 bg-white p-6">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-mist">Timeline</p>
            <div className="space-y-3">
              {order.timeline
                .slice()
                .reverse()
                .map((t, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 size={16} style={{ color: STATUS_COLOR[t.status] ?? '#6f6977' }} />
                    <span className="flex-1 font-bold">{STATUS_LABEL[t.status]}</span>
                    <span className="font-mono text-xs text-mist">{clock(t.at)}</span>
                  </div>
                ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
