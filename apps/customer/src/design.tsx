'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Heart, Plus, Star } from 'lucide-react';
import { useApp, productAvailable, etaRange, km, money } from '@sipdash/core';
import type { Category, Product, Store } from '@sipdash/core';

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export const TONES = ['bg-[#e6d5ff]', 'bg-[#ffd45c]', 'bg-[#ffb8a4]', 'bg-[#b8efe2]', 'bg-[#f3d9ef]', 'bg-[#cde7ff]'];

const STORE_PHOTOS = [
  'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&h=560&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?w=900&h=560&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=900&h=560&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=900&h=560&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1533676802871-5591cd458098?w=900&h=560&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=900&h=560&fit=crop&auto=format',
];

const PRODUCT_PHOTOS: Record<Category, string[]> = {
  wine: [
    'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?w=520&h=680&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=520&h=680&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1566754436893-98224ee05be2?w=520&h=680&fit=crop&auto=format',
  ],
  beer: [
    'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=520&h=680&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=520&h=680&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=520&h=680&fit=crop&auto=format',
  ],
  spirits: [
    'https://images.unsplash.com/photo-1614313511387-1436a4480ebb?w=520&h=680&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=520&h=680&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=520&h=680&fit=crop&auto=format',
  ],
  mixers: [
    'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=520&h=680&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=520&h=680&fit=crop&auto=format',
  ],
  snacks: [
    'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=520&h=680&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=520&h=680&fit=crop&auto=format',
  ],
  extras: [
    'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=520&h=680&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=520&h=680&fit=crop&auto=format',
  ],
};

export const HERO_PHOTO =
  'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=1000&h=1100&fit=crop&auto=format';

const hashId = (id: string) => id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);

export const storePhoto = (store: Store) => STORE_PHOTOS[hashId(store.id) % STORE_PHOTOS.length];

export const productPhoto = (product: Product) => {
  const pool = PRODUCT_PHOTOS[product.category] ?? PRODUCT_PHOTOS.extras;
  return pool[hashId(product.id) % pool.length];
};

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-grape">{children}</p>
  );
}

export function SectionTitle({ eyebrow, title, aside }: { eyebrow: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="font-display text-4xl uppercase tracking-tight md:text-5xl">{title}</h2>
      </div>
      {aside}
    </div>
  );
}

export function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="hidden items-center gap-2 text-sm font-bold underline decoration-2 underline-offset-4 sm:flex">
      View all <ArrowRight size={16} />
    </Link>
  );
}

export function StoreCard({ store }: { store: Store }) {
  const surge = useApp((s) => s.surge);
  const fee = store.deliveryFee * surge;
  const [fav, setFav] = React.useState(false);
  return (
    <Link href={`/store/${store.id}`} className="group block cursor-pointer">
      <div className="relative h-60 overflow-hidden bg-sand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={storePhoto(store)}
          alt={`${store.name} storefront`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {store.promo ? (
          <span className="absolute bottom-3 left-3 bg-gold px-3 py-2 text-xs font-bold">{store.promo}</span>
        ) : null}
        {!store.open ? (
          <span className="absolute bottom-3 left-3 bg-ink px-3 py-2 text-xs font-bold uppercase tracking-wider text-white">
            Closed
          </span>
        ) : null}
        <button
          onClick={(e) => {
            e.preventDefault();
            setFav(!fav);
          }}
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white transition hover:scale-105"
          aria-label={`Favorite ${store.name}`}
        >
          <Heart size={19} fill={fav ? '#6e38ee' : 'none'} className={fav ? 'text-grape' : ''} />
        </button>
      </div>
      <div className="flex items-start justify-between gap-4 pt-4">
        <div>
          <h3 className="text-xl font-bold">{store.name}</h3>
          <p className="mt-1 text-sm text-mist">
            {etaRange(store.deliveryTimeMin, store.deliveryTimeMax)} · {km(store.distanceKm)} ·{' '}
            {surge > 1 ? `${money(fee)} ⚡` : fee === 0 ? 'Free delivery' : `${money(fee)} delivery`}
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-stone px-2.5 py-1.5 text-xs font-bold">
          <Star size={12} fill="currentColor" /> {store.rating}
        </span>
      </div>
    </Link>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useApp((s) => s.addToCart);
  const cart = useApp((s) => s.cart);
  const setCartQty = useApp((s) => s.setCartQty);
  const available = productAvailable(product.id);
  const inCart = cart.find((c) => c.productId === product.id)?.qty ?? 0;
  const tag = product.tags?.[0] ?? (product.popular ? 'Top pick' : undefined);

  return (
    <article className="group">
      <div className="relative h-64 overflow-hidden bg-white md:h-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={productPhoto(product)}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {tag ? (
          <span className="absolute left-3 top-3 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider">
            {tag}
          </span>
        ) : null}
        {!available ? (
          <div className="absolute inset-0 grid place-items-center bg-white/60">
            <span className="bg-ink px-3 py-2 text-xs font-bold uppercase tracking-wider text-white">Sold out</span>
          </div>
        ) : inCart > 0 ? (
          <div className="absolute bottom-3 right-3 flex items-center gap-3 rounded-full border border-black/15 bg-white p-1 shadow-lg">
            <button
              onClick={() => setCartQty(product.id, inCart - 1)}
              className="grid size-9 place-items-center rounded-full text-lg font-bold hover:bg-stone"
            >
              −
            </button>
            <span className="min-w-3 text-center text-xs font-bold">{inCart}</span>
            <button
              onClick={() => addToCart(product.id)}
              className="grid size-9 place-items-center rounded-full bg-ink text-white"
            >
              <Plus size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => addToCart(product.id)}
            className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full bg-ink text-white shadow-lg transition hover:scale-105 hover:bg-grape"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus size={20} />
          </button>
        )}
      </div>
      <div className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold leading-tight md:text-lg">{product.name}</h3>
          <span className="font-bold">{money(product.price)}</span>
        </div>
        <p className="mt-1.5 text-xs text-mist md:text-sm">
          {product.brand} · {product.size}
          {product.abv ? ` · ${product.abv}%` : ''}
        </p>
      </div>
    </article>
  );
}
