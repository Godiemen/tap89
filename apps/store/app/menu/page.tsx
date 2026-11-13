'use client';
import { useMemo, useState } from 'react';
import { PackageOpen, Search } from 'lucide-react';
import { useApp, productAvailable, money, type Category } from '@sipdash/core';
import { Card, Eyebrow, Switch, cn } from '../../src/design';

const CAT_LABEL: Record<string, string> = {
  beer: 'Beer',
  wine: 'Wine',
  spirits: 'Spirits',
  mixers: 'Mixers',
  snacks: 'Snacks',
  extras: 'Extras',
};

const field =
  'h-10 w-full border border-border bg-[#faf9f5] px-3 text-xs font-bold outline-none transition focus:border-ring';

function AddProduct() {
  const addProduct = useApp((s) => s.addProduct);
  const [f, setF] = useState({ name: '', brand: '', size: '', price: '', emoji: '', description: '' });
  const [cat, setCat] = useState<Category>('beer');
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(f.price);
    if (!f.name.trim() || !(price > 0)) return;
    addProduct({
      name: f.name.trim(),
      brand: f.brand.trim(),
      category: cat,
      size: f.size.trim(),
      price,
      image: f.emoji.trim() || '📦',
      description: f.description.trim(),
      tags: [],
      available: true,
    });
    setF({ name: '', brand: '', size: '', price: '', emoji: '', description: '' });
  };

  return (
    <Card className="mb-6">
      <div className="border-b border-border p-4">
        <h2 className="font-display text-base font-bold">Add item</h2>
      </div>
      <form onSubmit={submit} className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <input required value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Item name *" className={field} />
        <input value={f.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Brand" className={field} />
        <input value={f.size} onChange={(e) => set('size', e.target.value)} placeholder="Size (e.g. 750ml)" className={field} />
        <select value={cat} onChange={(e) => setCat(e.target.value as Category)} className={field}>
          {Object.entries(CAT_LABEL).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
        <input required type="number" min="0.01" step="0.01" value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="Price *" className={field} />
        <input value={f.emoji} onChange={(e) => set('emoji', e.target.value)} placeholder="Emoji (e.g. 🍷)" className={field} />
        <input value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Description" className={cn(field, 'sm:col-span-2')} />
        <button type="submit" className="h-10 bg-deep text-xs font-bold text-white transition hover:bg-ink">
          Add to menu
        </button>
      </form>
    </Card>
  );
}

export default function Menu() {
  useApp((s) => s.availability);
  const toggle = useApp((s) => s.toggleProductAvailability);
  const [q, setQ] = useState('');
  const [hideSoldOut, setHideSoldOut] = useState(false);

  const catalog = useApp((s) => s.products);
  const storeId = useApp((s) => s.account?.userId);
  const products = useMemo(() => catalog.filter((p) => p.storeId === storeId), [catalog, storeId]);
  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (!hideSoldOut || productAvailable(p.id)) &&
          (p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase())),
      ),
    [products, q, hideSoldOut],
  );
  const sections = useMemo(() => {
    const cats = [...new Set(filtered.map((p) => p.category))];
    return cats.map((c) => ({ cat: c, items: filtered.filter((p) => p.category === c) }));
  }, [filtered]);

  const inStock = products.filter((p) => productAvailable(p.id)).length;

  return (
    <main className="p-4 md:p-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Catalog</Eyebrow>
          <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">Menu</h1>
          <p className="mt-1 text-xs text-sub">
            {inStock}/{products.length} items in stock
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold">
            <Switch checked={hideSoldOut} onChange={setHideSoldOut} label="Hide sold out" /> Hide sold out
          </label>
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" size={15} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search items"
              className="h-10 w-full min-w-[200px] border border-border bg-[#faf9f5] pl-9 pr-3 text-xs outline-none transition focus:border-ring md:w-[240px]"
            />
          </label>
        </div>
      </div>

      <AddProduct />

      <div className="grid gap-6 xl:grid-cols-2">
        {sections.map(({ cat, items }) => (
          <Card key={cat}>
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-display text-base font-bold">{CAT_LABEL[cat] ?? cat}</h2>
              <span className="font-mono text-[10px] text-sub">{items.length} items</span>
            </div>
            <div className="divide-y divide-border">
              {items.map((p) => {
                const on = productAvailable(p.id);
                return (
                  <div key={p.id} className="flex items-center gap-4 p-4 transition hover:bg-[#fbfaf6]">
                    <span className="grid size-11 shrink-0 place-items-center border border-border bg-bg text-xl">
                      {p.image}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate text-sm font-bold', !on && 'text-sub line-through')}>{p.name}</p>
                      <p className="mt-0.5 truncate text-xs text-sub">
                        {p.brand} · {p.size}
                      </p>
                    </div>
                    {p.popular ? (
                      <span className="hidden shrink-0 bg-priority px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-priority-ink sm:inline">
                        Popular
                      </span>
                    ) : null}
                    <span className="tabular shrink-0 font-mono text-xs font-bold">{money(p.price)}</span>
                    <Switch checked={on} onChange={() => toggle(p.id)} label={`Toggle ${p.name}`} />
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {!sections.length && (
        <Card className="py-20 text-center">
          <PackageOpen size={36} strokeWidth={1.3} className="mx-auto mb-4 text-leaf" />
          <p className="text-sm font-bold">No items match</p>
          <p className="mt-1 text-xs text-sub">Try a different search.</p>
        </Card>
      )}
    </main>
  );
}
