'use client';
import { Store as StoreIcon } from 'lucide-react';
import { useApp } from '@sipdash/core';
import { cn, Eyebrow, StatusPill, Switch } from '../../src/design';

const AVATAR_COLORS = ['#d7ff64', '#ffc46b', '#a6d8ff', '#e5d3ff', '#ffbdb5'];

export default function AdminStores() {
  const stores = useApp((s) => s.stores);
  const toggleApproved = useApp((s) => s.toggleStoreApproved);

  const approved = stores.filter((s) => s.approved).length;

  return (
    <main className="p-4 md:p-7">
      <div className="mb-5">
        <Eyebrow>Organizations</Eyebrow>
        <h1 className="mt-1 font-display text-2xl tracking-[-0.04em]">STORE PARTNERS</h1>
        <p className="mt-1 text-xs text-sub">
          {approved} approved · {stores.length - approved} pending / suspended
        </p>
      </div>

      <div className="border border-black bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_120px_90px] border-b border-border bg-strip px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-sub">
              <span>Store</span>
              <span>Categories</span>
              <span>Rating</span>
              <span>Status</span>
              <span>Access</span>
              <span>Listing</span>
            </div>
            {stores.map((s, i) => (
              <div
                key={s.id}
                className="grid grid-cols-[2fr_1.2fr_1fr_1fr_120px_90px] items-center border-b border-border px-4 py-4 transition hover:bg-[#fafafa]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                    className="grid size-10 shrink-0 place-items-center border border-black/15 text-lg"
                  >
                    {s.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">{s.name}</span>
                    <span className="mt-1 block truncate text-[10px] text-sub">{s.address}</span>
                  </span>
                </span>
                <span className="truncate text-xs">{s.categories.join(', ')}</span>
                <span className="text-xs font-semibold">
                  {s.rating}★<span className="ml-1 text-[10px] font-normal text-sub">({s.ratingCount})</span>
                </span>
                <span className="text-xs">
                  <span className={cn('mr-1 inline-block size-1.5 rounded-full', s.open ? 'bg-leaf' : 'bg-sub')} />
                  {s.open ? 'Open' : 'Closed'}
                </span>
                <StatusPill label={s.approved ? 'Approved' : 'Pending'} />
                <span>
                  <button
                    onClick={() => toggleApproved(s.id)}
                    className={cn(
                      'h-8 border px-3 text-[10px] font-semibold transition',
                      s.approved
                        ? 'border-border text-sub hover:border-wine hover:text-wine'
                        : 'border-black bg-black text-white hover:bg-lime hover:text-black',
                    )}
                  >
                    {s.approved ? 'Suspend' : 'Approve'}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 border border-border bg-white p-4">
        <StoreIcon size={16} className="text-sub" />
        <p className="text-[11px] leading-5 text-sub">
          Suspending a store hides it from the customer app instantly. Approving makes it orderable.
        </p>
      </div>
    </main>
  );
}
