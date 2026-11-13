'use client';
import Link from 'next/link';
import { ArrowRight, PackageOpen, Star } from 'lucide-react';
import { useApp, STATUS_COLOR, STATUS_LABEL, money, orderNo, timeAgo } from '@sipdash/core';
import { cn } from '../../src/design';

const LIVE = ['placed', 'accepted', 'preparing', 'ready', 'driver_assigned', 'picked_up', 'en_route'];

export default function Orders() {
  const orders = useApp((s) => s.orders);
  const rateOrder = useApp((s) => s.rateOrder);

  return (
    <main className="bg-cream px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-grape">Your history</p>
        <h1 className="font-display text-5xl uppercase tracking-tight md:text-6xl">Orders</h1>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <PackageOpen size={42} strokeWidth={1.3} className="mb-4 text-grape" />
            <h3 className="text-xl font-bold">No orders yet</h3>
            <p className="mt-2 max-w-xs text-sm text-mist">Your delivered nights will show up here.</p>
          </div>
        ) : (
          <div className="mt-10 space-y-5">
            {orders.map((order) => {
              const live = LIVE.includes(order.status);
              return (
                <Link
                  key={order.id}
                  href={`/tracking/${order.id}`}
                  className="group block border border-black/10 bg-white p-6 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-[6px_6px_0_#e9e4dc]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="grid size-14 place-items-center bg-stone text-2xl">
                        {order.items[0]?.emoji ?? '🧾'}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold">{order.storeName}</h3>
                        <p className="mt-0.5 text-xs text-mist">
                          {orderNo(order.id)} · {order.items.reduce((s, i) => s + i.qty, 0)} items ·{' '}
                          {timeAgo(order.placedAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white',
                        live && 'animate-pulse',
                      )}
                      style={{ background: STATUS_COLOR[order.status] ?? '#1b1526' }}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-mist">
                    {order.items
                      .slice(0, 2)
                      .map((i) => `${i.qty}× ${i.name}`)
                      .join(', ')}
                    {order.items.length > 2 ? ` +${order.items.length - 2} more` : ''}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
                    <span className="font-bold">{money(order.total)}</span>
                    {live ? (
                      <span className="flex items-center gap-2 text-sm font-bold text-grape">
                        Track live <ArrowRight size={15} />
                      </span>
                    ) : order.status === 'delivered' && order.rating === undefined ? (
                      <span className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => rateOrder(order.id, n)}
                            className="p-0.5 text-stone transition hover:text-gold"
                            aria-label={`Rate ${n}`}
                          >
                            <Star size={18} className="text-black/20 hover:fill-gold hover:text-gold" />
                          </button>
                        ))}
                        <span className="ml-1 text-xs font-bold text-mist">Rate</span>
                      </span>
                    ) : order.rating !== undefined ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-mist">
                        <Star size={14} fill="#ffd45c" className="text-gold" /> You rated {order.rating}/5
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-mist">View details</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
