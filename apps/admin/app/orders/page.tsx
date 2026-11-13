'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useApp, money, orderNo, STATUS_LABEL, timeAgo } from '@sipdash/core';
import { cn, Eyebrow, StatusPill } from '../../src/design';

const FILTERS = ['all', 'live', 'delivered', 'issues'] as const;
const LIVE = ['placed', 'accepted', 'preparing', 'ready', 'driver_assigned', 'picked_up', 'en_route'];

function pillFor(status: string): string {
  if (status === 'delivered') return 'Done';
  if (status === 'rejected' || status === 'cancelled') return 'Issue';
  return 'Live';
}

export default function AdminOrders() {
  const allOrders = useApp((s) => s.allOrders);
  const adminCancelOrder = useApp((s) => s.adminCancelOrder);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [search, setSearch] = useState('');

  const all = useMemo(() => {
    let list = [...allOrders].sort((a, b) => b.placedAt - a.placedAt);
    if (filter === 'live') list = list.filter((o) => LIVE.includes(o.status));
    else if (filter === 'delivered') list = list.filter((o) => o.status === 'delivered');
    else if (filter === 'issues')
      list = list.filter((o) => o.status === 'rejected' || o.status === 'cancelled' || o.flagged);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        `${o.id} ${o.customerName} ${o.storeName}`.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allOrders, filter, search]);

  return (
    <main className="p-4 md:p-7">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Eyebrow>Order monitor</Eyebrow>
          <h1 className="mt-1 font-display text-2xl tracking-[-0.04em]">ALL ORDERS</h1>
        </div>
        <label className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, customer, store"
            className="h-10 w-full border border-border bg-[#fafafa] pl-9 pr-3 text-xs outline-none focus:border-black sm:w-[280px]"
          />
        </label>
      </div>

      <div className="border border-black bg-white">
        <div className="flex gap-6 border-b border-border px-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn('relative h-12 text-xs font-semibold capitalize', filter === f ? 'text-black' : 'text-sub')}
            >
              {f === 'issues' ? 'Issues' : f}
              {filter === f && <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-black" />}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[120px_1.4fr_1.4fr_90px_90px_110px_42px] border-b border-border bg-strip px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-sub">
              <span>Order</span>
              <span>Customer</span>
              <span>Store</span>
              <span>Items</span>
              <span>Total</span>
              <span>Status</span>
              <span />
            </div>
            {all.map((o) => (
              <div
                key={o.id}
                className="grid grid-cols-[120px_1.4fr_1.4fr_90px_90px_110px_42px] items-center border-b border-border px-4 py-4 transition hover:bg-[#fafafa]"
              >
                <span>
                  <span className="block font-mono text-xs font-bold">{orderNo(o.id)}</span>
                  <span className="mt-1 block font-mono text-[9px] text-sub">{timeAgo(o.placedAt)}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">{o.customerName}</span>
                  <span className="mt-1 block truncate text-[10px] text-sub">{o.customerAddress}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{o.storeName}</span>
                  {o.driverName && <span className="mt-1 block truncate text-[10px] text-sub">🚗 {o.driverName}</span>}
                </span>
                <span className="tabular text-xs">{o.items.reduce((s, i) => s + i.qty, 0)}</span>
                <span className="tabular font-mono text-xs font-bold">{money(o.total)}</span>
                <span>
                  <StatusPill label={pillFor(o.status)} />
                  {o.flagged && (
                    <span className="mt-1 block font-mono text-[9px] font-bold uppercase text-wine">
                      ⚠ {o.flagReason === 'stuck_delivery' ? 'stuck' : o.flagReason}
                    </span>
                  )}
                </span>
                <span className="font-mono text-[9px] text-sub">
                  {STATUS_LABEL[o.status]}
                  {LIVE.includes(o.status) && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Cancel order ${orderNo(o.id)}?`)) {
                          void adminCancelOrder(o.id);
                        }
                      }}
                      className="mt-1 block text-wine underline underline-offset-2 hover:text-black"
                    >
                      cancel
                    </button>
                  )}
                </span>
              </div>
            ))}
            {all.length === 0 && (
              <div className="grid h-56 place-items-center text-center">
                <div>
                  <Search className="mx-auto text-sub" size={24} />
                  <p className="mt-3 text-sm font-semibold">No orders in this view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
