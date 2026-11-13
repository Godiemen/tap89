'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock3, MapPin, Phone, Star } from 'lucide-react';
import { useApp, etaRange, km, money, productAvailable } from '@sipdash/core';
import type { Category } from '@sipdash/core';
import { ProductCard, cn, storePhoto } from '../../../src/design';
import { useParams } from 'next/navigation';

const CAT_LABELS: Record<Category, string> = {
  beer: 'Beer',
  wine: 'Wine',
  spirits: 'Spirits',
  mixers: 'Mixers',
  snacks: 'Snacks',
  extras: 'Extras',
};

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const store = useApp((s) => s.stores.find((x) => x.id === id));
  const surge = useApp((s) => s.surge);
  const cart = useApp((s) => s.cart);
  const cartStoreId = useApp((s) => s.cartStoreId);
  const [cat, setCat] = useState<Category | 'all'>('all');

  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);
  const catalog = useApp((s) => s.products);
  const cartTotal = cart.reduce((sum, c) => {
    const p = catalog.find((x) => x.id === c.productId);
    return sum + (p?.price ?? 0) * c.qty;
  }, 0);

  const products = useMemo(
    () =>
      catalog.filter(
        (p) => p.storeId === id && (cat === 'all' || p.category === cat),
      ),
    [catalog, id, cat],
  );

  if (!store) {
    return (
      <main className="mx-auto max-w-[1320px] px-5 py-24 text-center md:px-8">
        <h1 className="font-display text-5xl uppercase">Store not found</h1>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4">
          <ArrowLeft size={16} /> Back to shops
        </Link>
      </main>
    );
  }

  const cats = [...new Set(catalog.filter((p) => p.storeId === id).map((p) => p.category))];
  const fee = store.deliveryFee * surge;

  return (
    <main className="bg-cream">
      {/* store hero */}
      <section className="relative">
        <div className="relative h-64 overflow-hidden bg-sand md:h-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={storePhoto(store)} alt={store.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
          <Link
            href="/"
            className="absolute left-5 top-5 grid size-11 place-items-center rounded-full bg-white transition hover:scale-105 md:left-8"
            aria-label="Back"
          >
            <ArrowLeft size={19} />
          </Link>
          <div className="absolute bottom-6 left-5 right-5 md:left-8">
            {store.promo ? (
              <span className="mb-3 inline-block bg-gold px-3 py-1.5 text-xs font-bold">{store.promo}</span>
            ) : null}
            <h1 className="font-display text-5xl uppercase tracking-tight text-white md:text-7xl">{store.name}</h1>
          </div>
        </div>
        <div className="border-b border-black/10 bg-white px-5 py-4 md:px-8">
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold">
            <span className="flex items-center gap-1.5">
              <Star size={15} fill="currentColor" className="text-grape" /> {store.rating} ({store.ratingCount})
            </span>
            <span className="flex items-center gap-1.5 text-mist">
              <Clock3 size={15} /> {etaRange(store.deliveryTimeMin, store.deliveryTimeMax)}
            </span>
            <span className="flex items-center gap-1.5 text-mist">
              <MapPin size={15} /> {km(store.distanceKm)} · {store.address}
            </span>
            <span className={store.open ? 'text-grape' : 'text-wine'}>
              {store.open ? (fee === 0 ? 'Free delivery' : `${money(fee)} delivery${surge > 1 ? ' ⚡' : ''}`) : 'Closed'}
            </span>
            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="ml-auto flex items-center gap-1.5 rounded-full border border-black/15 px-3.5 py-1.5 transition hover:border-black"
              >
                <Phone size={14} /> Call store
              </a>
            )}
          </div>
        </div>
      </section>

      {/* menu */}
      <section className="mx-auto max-w-[1320px] px-5 py-12 md:px-8 md:py-16">
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setCat('all')}
            className={cn(
              'rounded-full border px-4 py-2 text-xs font-bold transition hover:border-black',
              cat === 'all' ? 'border-black bg-black text-white' : 'border-black/15 bg-white',
            )}
          >
            Everything
          </button>
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                'rounded-full border px-4 py-2 text-xs font-bold transition hover:border-black',
                cat === c ? 'border-black bg-black text-white' : 'border-black/15 bg-white',
              )}
            >
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="py-20 text-center text-mist">Nothing on the shelf in this category.</p>
        )}
      </section>

      {/* sticky cart bar */}
      {cartCount > 0 && cartStoreId === id ? (
        <div className="sticky bottom-5 z-30 mx-auto max-w-[1320px] px-5 pb-5 md:px-8">
          <Link
            href="/cart"
            className="flex h-14 items-center justify-between bg-grape px-6 font-bold text-white shadow-[6px_6px_0_#1b1526] transition hover:bg-ink"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-6 place-items-center rounded-full bg-gold text-xs text-black">{cartCount}</span>
              View cart
            </span>
            <span className="flex items-center gap-2">
              {money(cartTotal)} <ArrowRight size={17} />
            </span>
          </Link>
        </div>
      ) : null}
    </main>
  );
}
