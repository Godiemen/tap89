'use client';
import { Suspense, useMemo, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@sipdash/core';
import type { Category } from '@sipdash/core';
import { ProductCard, StoreCard, cn } from '../../src/design';

const CAT_PILLS: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'wine', label: 'Wine' },
  { key: 'beer', label: 'Beer' },
  { key: 'spirits', label: 'Spirits' },
  { key: 'mixers', label: 'Mixers' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'extras', label: 'Extras' },
];

function SearchInner() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const stores = useApp((s) => s.stores);

  const q = query.trim().toLowerCase();

  const catalog = useApp((s) => s.products);
  const products = useMemo(
    () =>
      catalog.filter(
        (p) =>
          (cat === 'all' || p.category === cat) &&
          (!q ||
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.includes(q) ||
            p.tags?.some((t) => t.toLowerCase().includes(q))),
      ).slice(0, 24),
    [catalog, q, cat],
  );

  const matchedStores = useMemo(
    () => stores.filter((s) => s.approved && (!q || s.name.toLowerCase().includes(q))).slice(0, 6),
    [stores, q],
  );

  return (
    <main className="bg-cream px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-[1320px]">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-grape">Search the cellar</p>
        <h1 className="font-display text-5xl uppercase tracking-tight md:text-6xl">What are you craving?</h1>

        <div className="relative mt-8 max-w-2xl">
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2" size={21} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-16 w-full rounded-full border-0 bg-stone pl-14 pr-6 text-base font-bold outline-none ring-grape transition focus:ring-2"
            placeholder="Try &quot;tequila&quot;, &quot;IPA&quot;, &quot;rosé&quot;..."
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {CAT_PILLS.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={cn(
                'rounded-full border px-4 py-2 text-xs font-bold transition hover:border-black',
                cat === c.key ? 'border-black bg-black text-white' : 'border-black/15 bg-white',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {matchedStores.length > 0 ? (
          <>
            <h2 className="mb-6 mt-12 font-display text-3xl uppercase tracking-tight">Stores</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {matchedStores.map((s) => (
                <StoreCard key={s.id} store={s} />
              ))}
            </div>
          </>
        ) : null}

        <h2 className="mb-6 mt-12 font-display text-3xl uppercase tracking-tight">
          {products.length ? `${products.length} bottles` : 'No matches'}
        </h2>
        {products.length === 0 ? (
          <p className="max-w-md text-sm leading-6 text-mist">
            We couldn&apos;t find that on any nearby shelf. Try a broader term like &quot;wine&quot; or &quot;beer&quot;.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}
