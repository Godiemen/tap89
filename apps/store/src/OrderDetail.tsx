'use client';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bike,
  Check,
  Clock3,
  KeyRound,
  PackageCheck,
  Phone,
  Printer,
  X,
} from 'lucide-react';
import {
  db,
  isLive,
  useApp,
  money,
  orderNo,
  timeAgo,
  productAvailable,
  STATUS_LABEL,
  type Order,
} from '@sipdash/core';
import { cn } from '../src/design';

const REASONS = ['Out of stock', 'Too busy to fulfil', 'Closing soon', 'Other'];

const firstName = (full: string) => full.trim().split(/\s+/)[0] || full;

export default function OrderDetail({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const act = useApp((s) => s.storeOrderAction);
  const toggleAvail = useApp((s) => s.toggleProductAvailability);
  const [contacts, setContacts] = useState<{ customer?: string; driver?: string }>({});
  const [pickupCode, setPickupCode] = useState<string | null>(null);
  const [reasonMode, setReasonMode] = useState<'reject' | 'cancel' | null>(null);
  const [reason, setReason] = useState(REASONS[0]);

  useEffect(() => {
    if (!isLive()) return;
    let on = true;
    void db.orderContacts(order.id).then(({ data }: any) => {
      if (!on || !data?.ok) return;
      setContacts({
        customer: data.customer_phone || undefined,
        driver: data.driver_phone || undefined,
      });
    });
    void db.orderCode(order.id).then(({ data }: any) => {
      if (on && data?.ok) setPickupCode(data.pickup_code ?? null);
    });
    return () => {
      on = false;
    };
  }, [order.id]);

  const canCancel = ['accepted', 'preparing', 'ready', 'driver_assigned'].includes(order.status);
  const terminal = ['delivered', 'rejected', 'cancelled'].includes(order.status);

  return (
    <>
      {/* backdrop */}
      <button
        aria-label="Close order detail"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <aside
        role="dialog"
        aria-label={`Order ${orderNo(order.id)} detail`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl"
      >
        {/* header */}
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold">{orderNo(order.id)}</span>
              <span className="bg-secondary px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-sub">
              {timeAgo(order.placedAt)} · Delivery
              {order.cancelReason ? ` · ${order.cancelReason}` : ''}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => window.print()}
              aria-label="Print kitchen ticket"
              title="Print kitchen ticket"
              className="grid size-9 place-items-center border border-border text-sub transition hover:bg-secondary hover:text-ink"
            >
              <Printer size={15} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid size-9 place-items-center border border-border text-sub transition hover:bg-secondary hover:text-ink"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* special instructions — prominent, kitchen-critical */}
        {order.instructions && (
          <div className="mx-5 mt-5 flex gap-3 border-2 border-priority bg-[#fff8e6] p-4">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-priority-ink" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-priority-ink">
                Customer note
              </p>
              <p className="mt-1 text-sm font-bold leading-6">{order.instructions}</p>
            </div>
          </div>
        )}

        {/* customer + driver */}
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <div className="border border-border bg-bg p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sub">Customer</p>
            <p className="mt-1.5 text-sm font-bold">{firstName(order.customerName)}</p>
            <p className="mt-0.5 text-xs leading-5 text-sub">{order.customerAddress}</p>
            {contacts.customer && (
              <a
                href={`tel:${contacts.customer}`}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-leaf"
              >
                <Phone size={12} /> Call
              </a>
            )}
          </div>
          <div className="border border-border bg-bg p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sub">Courier</p>
            {order.driverName ? (
              <>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold">
                  <Bike size={14} /> {order.driverName}
                </p>
                <p className="mt-0.5 text-xs text-sub">{STATUS_LABEL[order.status]}</p>
                {contacts.driver && (
                  <a
                    href={`tel:${contacts.driver}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-leaf"
                  >
                    <Phone size={12} /> Call
                  </a>
                )}
              </>
            ) : (
              <p className="mt-1.5 text-xs text-sub">
                {order.status === 'ready' ? 'Broadcasting to couriers…' : 'Not assigned yet'}
              </p>
            )}
          </div>
        </div>

        {/* pickup code — staff gives this to the courier; they can't proceed without it */}
        {pickupCode && order.status === 'driver_assigned' && (
          <div className="mx-5 mb-1 flex items-center gap-3 border-2 border-ink bg-ink p-4 text-card">
            <KeyRound size={18} className="shrink-0 text-priority" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-card/60">
                Pickup code
              </p>
              <p className="text-[11px] text-card/75">Tell the courier — required to collect.</p>
            </div>
            <p className="tabular shrink-0 font-mono text-2xl font-bold tracking-[0.25em] text-priority">
              {pickupCode}
            </p>
          </div>
        )}

        {/* items + stock toggles */}
        <div className="border-t border-border px-5 py-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-sub">
            Items · mark sold out inline
          </p>
          <ul className="divide-y divide-border">
            {order.items.map((i, idx) => {
              const inStock = productAvailable(i.productId);
              return (
                <li key={idx} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-6 text-center">{i.emoji}</span>
                  <span className={cn('flex-1', !inStock && 'text-sub line-through')}>
                    {i.qty} × {i.name}
                  </span>
                  <span className="tabular font-mono text-xs font-bold">{money(i.price * i.qty)}</span>
                  <button
                    onClick={() => toggleAvail(i.productId)}
                    className={cn(
                      'border px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition',
                      inStock
                        ? 'border-border text-sub hover:border-wine hover:text-wine'
                        : 'border-wine bg-wine text-white',
                    )}
                    title={inStock ? 'Mark out of stock' : 'Back in stock'}
                  >
                    {inStock ? 'Sold out' : 'Sold out'}
                  </button>
                </li>
              );
            })}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-xs">
            <div className="flex justify-between"><dt className="text-sub">Subtotal</dt><dd className="tabular font-mono">{money(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-sub">Delivery</dt><dd className="tabular font-mono">{money(order.deliveryFee)}</dd></div>
            <div className="flex justify-between"><dt className="text-sub">Service fee</dt><dd className="tabular font-mono">{money(order.serviceFee)}</dd></div>
            {order.tip > 0 && (
              <div className="flex justify-between"><dt className="text-sub">Tip</dt><dd className="tabular font-mono">{money(order.tip)}</dd></div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between"><dt className="text-sub">Discount{order.promoCode ? ` (${order.promoCode})` : ''}</dt><dd className="tabular font-mono">-{money(order.discount)}</dd></div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
              <dt>Total</dt><dd className="tabular font-mono">{money(order.total)}</dd>
            </div>
          </dl>
        </div>

        {/* actions */}
        <div className="mt-auto border-t border-border p-5">
          {reasonMode ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sub">
                {reasonMode === 'reject' ? 'Reject order — pick a reason' : 'Cancel order — pick a reason'}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={cn(
                      'border px-3 py-2.5 text-left text-[11px] font-bold transition',
                      reason === r ? 'border-black bg-ink text-white' : 'border-border text-sub hover:border-black',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    void act(order.id, reasonMode === 'reject' ? 'reject' : 'cancel', reason.toLowerCase().replace(/ /g, '_'));
                    onClose();
                  }}
                  className="h-11 flex-1 bg-wine text-xs font-bold text-white transition hover:brightness-95"
                >
                  Confirm {reasonMode}
                </button>
                <button
                  onClick={() => setReasonMode(null)}
                  className="h-11 border border-border px-4 text-xs font-bold text-sub transition hover:bg-secondary"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {order.status === 'placed' && (
                <>
                  <button
                    onClick={() => { void act(order.id, 'accept'); onClose(); }}
                    className="flex h-11 items-center justify-center gap-2 bg-harvest text-xs font-bold text-harvest-ink transition hover:brightness-95"
                  >
                    <Check size={15} /> Accept order
                  </button>
                  <button
                    onClick={() => setReasonMode('reject')}
                    className="h-11 border border-border text-xs font-bold text-wine transition hover:bg-secondary"
                  >
                    Reject order
                  </button>
                </>
              )}
              {['accepted', 'preparing'].includes(order.status) && (
                <button
                  onClick={() => { void act(order.id, 'ready'); onClose(); }}
                  className="flex h-11 items-center justify-center gap-2 bg-sage text-xs font-bold text-sage-ink transition hover:brightness-95"
                >
                  <PackageCheck size={15} /> Mark ready for pickup
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setReasonMode('cancel')}
                  className="h-11 border border-border text-xs font-bold text-sub transition hover:bg-secondary hover:text-wine"
                >
                  Cancel order
                </button>
              )}
              {terminal && (
                <p className="flex items-center justify-center gap-2 py-2 text-xs text-sub">
                  <Clock3 size={13} /> This order is closed.
                </p>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* printable kitchen ticket — off-screen normally, sole content when printing */}
      <style>{`@media print{ body *{visibility:hidden} .print-ticket,.print-ticket *{visibility:visible} .print-ticket{position:fixed;left:0;top:0;width:100%;padding:24px} }`}</style>
      <div className="print-ticket fixed -left-[9999px] top-0 bg-white font-mono text-black">
        <h1 className="text-2xl font-bold">SipDash · {orderNo(order.id)}</h1>
        <p className="mt-1 text-sm">
          {new Date(order.placedAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })} ·{' '}
          {firstName(order.customerName)} · Delivery
        </p>
        {order.instructions && (
          <p className="mt-3 border-2 border-black p-2 text-sm font-bold">NOTE: {order.instructions}</p>
        )}
        <ul className="mt-4 space-y-2 text-lg">
          {order.items.map((i, idx) => (
            <li key={idx}>
              <strong>{i.qty}×</strong> {i.emoji} {i.name}
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-black pt-2 text-sm">
          Items: {order.items.reduce((s, i) => s + i.qty, 0)} · Total {money(order.total)}
          {order.tip > 0 ? ` · Tip ${money(order.tip)}` : ''}
        </p>
      </div>
    </>
  );
}
