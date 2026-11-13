'use client';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import {
  ArrowRight,
  Beer,
  Clock3,
  CupSoda,
  MapPin,
  Martini,
  Pizza,
  Search,
  Sparkles,
  Wine,
} from 'lucide-react';
import { useApp, productAvailable } from '@sipdash/core';
import type { Category } from '@sipdash/core';
import { HERO_PHOTO, ProductCard, SectionTitle, StoreCard, TONES, ViewAll } from '../src/design';

const CATEGORY_ICONS: Record<Category, typeof Wine> = {
  wine: Wine,
  beer: Beer,
  spirits: Sparkles,
  mixers: Martini,
  snacks: Pizza,
  extras: CupSoda,
};

const CATEGORY_LABELS: { key: Category; label: string }[] = [
  { key: 'wine', label: 'Wine' },
  { key: 'beer', label: 'Beer' },
  { key: 'spirits', label: 'Spirits' },
  { key: 'mixers', label: 'Cocktails' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'extras', label: 'Extras' },
];

const FILTERS = ['Delivery now', 'Offers', 'Top rated'];

export default function CustomerHome() {
  const stores = useApp((s) => s.stores);
  const address = useApp((s) => s.account?.address ?? '');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [filter, setFilter] = useState(0);

  const visibleStores = useMemo(() => {
    const approved = stores.filter((s) => s.approved);
    if (filter === 1) return approved.filter((s) => s.promo);
    if (filter === 2) return [...approved].sort((a, b) => b.rating - a.rating);
    // open shops first, closed ones still listed below (badged "Closed")
    return [...approved].sort((a, b) => Number(b.open) - Number(a.open));
  }, [stores, filter]);

  const catalog = useApp((s) => s.products);
  const popular = useMemo(() => {
    const pool = catalog.filter(
      (p) => productAvailable(p.id) && (activeCategory === 'all' || p.category === activeCategory),
    );
    const featured = pool.filter((p) => p.popular);
    return (featured.length >= 8 ? featured : pool).slice(0, 8);
  }, [catalog, activeCategory]);

  return (
    <main>
      {/* HERO */}
      <section className="relative grid min-h-[560px] overflow-hidden lg:grid-cols-[57%_43%]">
        <div className="relative flex items-center bg-grape px-6 py-16 text-white md:px-12 lg:px-[8vw] lg:py-24">
          <div className="relative z-10 max-w-[670px]">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-7 inline-flex items-center gap-2 border border-white/30 px-3 py-2 text-xs font-bold uppercase tracking-[0.15em]"
            >
              <Clock3 size={14} /> The good stuff, in 30 min
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-[650px] font-display text-[clamp(4rem,8vw,7.4rem)] uppercase leading-[0.84] tracking-[-0.035em]"
            >
              Tonight, delivered.
            </motion.h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-white/80 md:text-lg">
              Your neighborhood bottle shops, cellar picks, cold beer and cocktail essentials — at your door before
              the ice melts.
            </p>
            <div className="mt-8 flex max-w-[560px] flex-col gap-3 bg-white p-2 sm:flex-row">
              <div className="flex min-h-14 flex-1 items-center gap-3 px-3 text-ink">
                <MapPin size={20} className="shrink-0 text-grape" />
                <span className="text-sm font-bold">{address}</span>
              </div>
              <Link
                href="/search"
                className="flex h-14 items-center justify-center gap-3 bg-ink px-6 font-bold text-white transition hover:bg-gold hover:text-black"
              >
                Find drinks <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <div className="absolute -bottom-20 -right-20 size-64 rounded-full border-[38px] border-gold/90" />
        </div>
        <div className="relative min-h-[440px] bg-peach">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_PHOTO}
            alt="Colorful cocktails ready to serve"
            className="absolute inset-0 h-full w-full object-cover mix-blend-multiply"
          />
          <div className="absolute left-6 top-6 rotate-3 bg-gold px-4 py-3 font-display text-2xl uppercase text-black shadow-[6px_6px_0_#1b1526] md:left-10 md:top-10">
            First order: R10 off
          </div>
          <div className="absolute bottom-6 right-6 max-w-[190px] bg-white p-4 text-sm font-bold leading-5 shadow-[7px_7px_0_#1b1526] md:bottom-10 md:right-10">
            <span className="block text-xs uppercase tracking-widest text-grape">Happy hour</span>
            No rush. No lines. Just pour.
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-b border-black/10 bg-cream px-5 py-10 md:px-8">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-grape">Browse the bar</p>
              <h2 className="font-display text-3xl uppercase tracking-tight md:text-4xl">What are we pouring?</h2>
            </div>
            <ViewAll href="/search" />
          </div>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-5">
            {CATEGORY_LABELS.map(({ key, label }, i) => {
              const Icon = CATEGORY_ICONS[key];
              const active = activeCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(active ? 'all' : key)}
                  className={`group relative flex min-h-32 flex-col items-center justify-center gap-3 overflow-hidden border p-3 transition md:min-h-40 ${
                    active
                      ? 'border-ink bg-ink text-white shadow-[5px_5px_0_#ffd45c]'
                      : 'border-black/10 bg-white hover:-translate-y-1 hover:border-black'
                  }`}
                >
                  <span
                    className={`grid size-14 place-items-center rounded-full ${TONES[i % TONES.length]} text-ink md:size-16`}
                  >
                    <Icon size={27} strokeWidth={1.8} />
                  </span>
                  <span className="text-sm font-bold">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* STORES */}
      <section id="stores" className="bg-white px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1320px]">
          <SectionTitle
            eyebrow="Near you"
            title="Bottle shops near you"
            aside={
              <div className="flex gap-2">
                {FILTERS.map((f, i) => (
                  <button
                    key={f}
                    onClick={() => setFilter(i)}
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition hover:border-black ${
                      i === filter ? 'border-black bg-black text-white' : 'border-black/15 bg-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            }
          />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {visibleStores.map((store, i) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08 }}
              >
                <StoreCard store={store} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR */}
      <section id="popular" className="bg-stone px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-grape">
                {activeCategory === 'all' ? 'Across the neighborhood' : `In ${activeCategory}`}
              </p>
              <h2 className="font-display text-4xl uppercase tracking-tight md:text-5xl">Popular right now</h2>
            </div>
            <p className="hidden max-w-xs text-right text-sm leading-6 text-mist md:block">
              Handpicked bottles and cold favorites arriving in 15–25 minutes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-5">
            {popular.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* RESPONSIBILITY */}
      <section id="responsibility" className="grid bg-ink text-white lg:grid-cols-[42%_58%]">
        <div className="flex min-h-[430px] items-end bg-gold p-8 text-ink md:p-14">
          <div>
            <span className="mb-8 grid size-20 place-items-center rounded-full border-2 border-black font-display text-3xl">
              21+
            </span>
            <h2 className="max-w-md font-display text-5xl uppercase leading-[0.95] md:text-6xl">
              Good nights start responsibly.
            </h2>
          </div>
        </div>
        <div className="grid gap-10 p-8 md:grid-cols-3 md:p-14 lg:p-16">
          {[
            ['01', 'Choose local', 'Browse trusted, licensed stores in your neighborhood.'],
            ['02', 'We check ID', 'Your courier verifies a valid government-issued ID.'],
            ['03', 'Enjoy well', 'Never drink and drive. Sip slowly, stay safe.'],
          ].map(([number, title, text]) => (
            <div key={number} className="border-t border-white/20 pt-5">
              <span className="font-mono text-xs text-gold">{number}</span>
              <h3 className="mt-8 text-xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/60">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
