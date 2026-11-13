'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  DoorOpen,
  MapPin,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react';
import {
  useApp,
  cartSubtotal,
  money,
  productById,
  storeById,
} from '@sipdash/core';
import Auth from '../Auth';
import { cn } from '../../src/design';

const TIPS = [0, 2, 4, 6];

const PAYMENTS = [
  { id: 'p1', label: 'Visa ···· 4242', icon: CreditCard },
  { id: 'p2', label: 'Apple Pay', icon: Smartphone },
  { id: 'p3', label: 'Wallet · R18.50', icon: Wallet },
  { id: 'p4', label: 'Cash on delivery', icon: Banknote },
];

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn('flex justify-between py-1 text-sm', bold ? 'font-bold text-base' : 'text-mist')}>
      <span>{label}</span>
      <span className={cn(bold && 'text-ink font-bold')}>{value}</span>
    </div>
  );
}

export default function Checkout() {
  const router = useRouter();
  const cart = useApp((s) => s.cart);
  const cartStoreId = useApp((s) => s.cartStoreId);
  const promoCode = useApp((s) => s.promoCode);
  const promos = useApp((s) => s.promos);
  const surge = useApp((s) => s.surge);
  const placeOrder = useApp((s) => s.placeOrder);
  const address = useApp((s) => s.account?.address ?? '');
  const account = useApp((s) => s.account);

  const [tip, setTip] = useState(3);
  const [pay, setPay] = useState('p1');
  const [leaveAtDoor, setLeaveAtDoor] = useState(true);
  const [note, setNote] = useState('');

  const store = cartStoreId ? storeById(cartStoreId) : null;
  const subtotal = cartSubtotal(cart);
  const deliveryFee = store ? store.deliveryFee * surge : 0;
  const serviceFee = Math.min(4.99, subtotal * 0.08);
  const promo = promos.find((p) => p.code === promoCode);
  const discount = promo
    ? promo.type === 'percent'
      ? (subtotal * promo.value) / 100
      : promo.type === 'flat'
        ? promo.value
        : 0
    : 0;
  const effDelivery = promo?.type === 'free_delivery' ? 0 : deliveryFee;
  const total = subtotal + effDelivery + serviceFee - discount + tip;

  const submit = () => {
    const order = placeOrder(tip, note);
    if (order) router.replace(`/tracking/${order.id}`);
  };

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center md:px-8">
        <h1 className="font-display text-5xl uppercase">Nothing to check out</h1>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4">
          <ArrowLeft size={16} /> Back to shops
        </Link>
      </main>
    );
  }

  // sign-in wall only at checkout — guests can browse freely
  if (!account) return <Auth />;

  return (
    <main className="bg-cream px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/cart" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-mist hover:text-ink">
          <ArrowLeft size={15} /> Back to cart
        </Link>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-grape">{store?.name}</p>
        <h1 className="font-display text-5xl uppercase tracking-tight md:text-6xl">Checkout</h1>

        <div className="mt-10 space-y-6">
          {/* address */}
          <section className="border border-black/10 bg-white p-6">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-full bg-stone">
                <MapPin size={20} className="text-grape" />
              </span>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist">Deliver to</p>
                <p className="font-bold">{address}</p>
              </div>
              <span className="text-sm font-bold text-grape">Edit</span>
            </div>
            <button
              onClick={() => setLeaveAtDoor(!leaveAtDoor)}
              className="mt-5 flex w-full items-center gap-3 border-t border-black/10 pt-5 text-left"
            >
              <span
                className={cn(
                  'grid size-6 place-items-center border transition',
                  leaveAtDoor ? 'border-ink bg-ink text-white' : 'border-black/25 bg-white',
                )}
              >
                {leaveAtDoor && <DoorOpen size={13} />}
              </span>
              <span className="text-sm font-bold">Leave at door + verify ID on arrival</span>
            </button>
          </section>

          {/* payment */}
          <section className="border border-black/10 bg-white p-6">
            <h2 className="mb-4 font-display text-2xl uppercase tracking-tight">Payment</h2>
            <div className="divide-y divide-black/10">
              {PAYMENTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPay(p.id)}
                  className="flex w-full items-center gap-3 py-3.5 text-left"
                >
                  <p.icon size={18} className="text-ink" />
                  <span className="flex-1 text-sm font-bold">{p.label}</span>
                  <span
                    className={cn(
                      'size-5 rounded-full border-2 transition',
                      pay === p.id ? 'border-grape bg-grape ring-2 ring-white' : 'border-black/20',
                    )}
                  />
                </button>
              ))}
            </div>
          </section>

          {/* order note */}
          <section className="border border-black/10 bg-white p-6">
            <h2 className="mb-2 font-display text-2xl uppercase tracking-tight">Order note</h2>
            <p className="mb-3 text-[11px] text-mist">
              Allergies, substitutions, or drop-off details — shown to the store and printed on the kitchen ticket.
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="e.g. no ice, ring the bell twice…"
              className="w-full resize-none border border-black/15 bg-white p-3 text-sm outline-none focus:border-ink"
            />
          </section>

          {/* tip */}
          <section className="border border-black/10 bg-white p-6">
            <h2 className="mb-4 font-display text-2xl uppercase tracking-tight">Driver tip</h2>
            <div className="grid grid-cols-4 gap-2">
              {TIPS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTip(t)}
                  className={cn(
                    'flex h-14 items-center justify-center border text-base font-bold transition',
                    tip === t
                      ? 'border-ink bg-ink text-white shadow-[4px_4px_0_#ffd45c]'
                      : 'border-black/15 bg-white hover:border-black',
                  )}
                >
                  {t === 0 ? 'None' : `R${t}`}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-mist">100% of tips go to your driver.</p>
          </section>

          {/* summary */}
          <section className="border border-black/10 bg-white p-6">
            <h2 className="mb-4 font-display text-2xl uppercase tracking-tight">Order summary</h2>
            {cart.map((c) => {
              const p = productById(c.productId);
              return (
                <div key={c.productId} className="flex justify-between py-1 text-sm">
                  <span className="text-mist">
                    {c.qty}× {p?.name}
                  </span>
                  <span className="font-bold">{money((p?.price ?? 0) * c.qty)}</span>
                </div>
              );
            })}
            <div className="my-4 border-t border-black/10" />
            <Row label="Subtotal" value={money(subtotal)} />
            <Row
              label={`Delivery${surge > 1 ? ` ⚡${surge.toFixed(1)}x` : ''}`}
              value={effDelivery === 0 ? 'Free' : money(effDelivery)}
            />
            <Row label="Service fee" value={money(serviceFee)} />
            {discount > 0 && <Row label={`Discount (${promoCode})`} value={`-${money(discount)}`} />}
            <Row label="Tip" value={money(tip)} />
            <div className="my-3 border-t border-black/10" />
            <Row label="Total" value={money(total)} bold />
          </section>

          <button
            onClick={submit}
            className="flex h-16 w-full items-center justify-between bg-grape px-6 font-bold text-white shadow-[6px_6px_0_#1b1526] transition hover:bg-ink"
          >
            <span className="flex items-center gap-3">
              <ShieldCheck size={19} /> Place order · ID checked at door
            </span>
            <span>{money(total)}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
