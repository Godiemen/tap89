'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bike,
  Check,
  ChevronDown,
  Clock3,
  CookingPot,
  Ellipsis,
  PackageCheck,
  Pause,
  Phone,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  db,
  isLive,
  useApp,
  money,
  orderNo,
  timeAgo,
  clock,
  isTodaySAST,
  hourSAST,
  productAvailable,
  STATUS_LABEL,
  type Order,
  type OrderStatus,
} from '@sipdash/core';
import { cn, Eyebrow } from '../src/design';
import { useNewOrderAlert } from '../src/useNewOrderAlert';
import OrderDetail from '../src/OrderDetail';

type Tab = 'New' | 'Preparing' | 'Ready' | 'Courier' | 'Done';

/** Every active status maps to exactly one tab — no order is ever invisible. */
const TAB_STATUS: Record<Tab, OrderStatus[]> = {
  New: ['placed'],
  Preparing: ['accepted', 'preparing'],
  Ready: ['ready'],
  Courier: ['driver_assigned', 'picked_up', 'en_route'],
  Done: ['delivered', 'rejected', 'cancelled'],
};

const LIVE_STATUSES: OrderStatus[] = [
  'placed',
  'accepted',
  'preparing',
  'ready',
  'driver_assigned',
  'picked_up',
  'en_route',
];

const TAB_META: Record<Tab, { icon: typeof Sparkles; cls: string; action: string }> = {
  New: { icon: Sparkles, cls: 'bg-harvest text-harvest-ink', action: 'Accept order' },
  Preparing: { icon: CookingPot, cls: 'bg-sage text-sage-ink', action: 'Mark ready' },
  Ready: { icon: PackageCheck, cls: 'bg-ready text-white', action: 'Awaiting courier' },
  Courier: { icon: Bike, cls: 'bg-grape text-white', action: 'With courier' },
  Done: { icon: Check, cls: 'bg-secondary text-ink', action: '' },
};

function useNow() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function OrderRow({ order, tab, now, onOpen }: { order: Order; tab: Tab; now: number; onOpen: (o: Order) => void }) {
  const act = useApp((s) => s.storeOrderAction);
  const acceptTimeoutSec = useApp((s) => s.acceptTimeoutSec);
  const meta = TAB_META[tab];
  const Icon = meta.icon;
  const [contacts, setContacts] = useState<{ customer?: string; driver?: string }>({});

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
    return () => {
      on = false;
    };
  }, [order.id, order.driverName]);
  const remaining = now
    ? Math.max(0, Math.ceil(acceptTimeoutSec - (now - order.placedAt) / 1000))
    : acceptTimeoutSec;
  const assignedAt = order.timeline.find((t) => t.status === 'driver_assigned')?.at;
  const eta =
    tab === 'New'
      ? `${remaining}s to accept`
      : tab === 'Preparing'
        ? 'Accepted — prep in progress'
        : tab === 'Courier'
          ? `${STATUS_LABEL[order.status]}${assignedAt ? ` · ${timeAgo(assignedAt)}` : ''}`
          : tab === 'Done'
            ? STATUS_LABEL[order.status]
            : 'Courier notified';

  return (
    <article
      onClick={() => onOpen(order)}
      className="grid cursor-pointer gap-4 p-5 transition hover:bg-[#fbfaf6] md:grid-cols-[82px_1fr_auto] md:items-start"
    >
      <div>
        <div className="font-mono text-lg font-bold">{orderNo(order.id)}</div>
        <div className="mt-1 text-[10px] text-sub">{timeAgo(order.placedAt)}</div>
        {order.tip > 0 && (
          <span className="mt-3 inline-block bg-priority px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-priority-ink">
            +{money(order.tip)} tip
          </span>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold">{order.customerName}</h3>
          <span className="text-[10px] text-sub">· Delivery</span>
        </div>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-[#4d514e]">
          {order.items.map((i, idx) => (
            <li key={idx}>
              {i.emoji} {i.qty} × {i.name}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="tabular font-mono text-[11px] font-bold">{money(order.total)}</span>
          <span className={cn('flex items-center gap-1 text-[10px]', tab === 'New' && remaining < acceptTimeoutSec * 0.3 ? 'text-wine' : 'text-sub')}>
            <Clock3 size={11} /> {eta}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 md:flex-col md:items-end">
        {tab === 'New' ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); void act(order.id, 'accept'); }}
              className={cn('flex h-10 min-w-[124px] items-center justify-center gap-2 px-4 text-[11px] font-bold transition hover:brightness-95', meta.cls)}
            >
              <Icon size={14} /> {meta.action}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onOpen(order); }}
              className="flex h-10 items-center justify-center gap-2 border border-border px-4 text-[11px] font-bold text-sub transition hover:bg-secondary hover:text-ink"
            >
              Reject…
            </button>
          </>
        ) : tab === 'Preparing' ? (
          <button
            onClick={(e) => { e.stopPropagation(); void act(order.id, 'ready'); }}
            className={cn('flex h-10 min-w-[124px] items-center justify-center gap-2 px-4 text-[11px] font-bold transition hover:brightness-95', meta.cls)}
          >
            <Icon size={14} /> {meta.action}
          </button>
        ) : (
          <span className={cn('flex h-10 min-w-[124px] items-center justify-center gap-2 px-4 text-[11px] font-bold', meta.cls)}>
            <Icon size={14} />
            {tab === 'Courier' && order.driverName ? order.driverName : meta.action}
          </span>
        )}
        {tab === 'Done' && order.cancelReason && (
          <span className="font-mono text-[9px] text-sub">{order.cancelReason}</span>
        )}
        {contacts.customer && (
          <a
            href={`tel:${contacts.customer}`}
            onClick={(e) => e.stopPropagation()}
            title={`Call ${order.customerName}`}
            aria-label={`Call customer ${order.customerName}`}
            className="grid size-9 place-items-center border border-border text-sub transition hover:bg-secondary hover:text-ink"
          >
            <Phone size={15} />
          </a>
        )}
        {contacts.driver && (
          <a
            href={`tel:${contacts.driver}`}
            onClick={(e) => e.stopPropagation()}
            title={`Call courier ${order.driverName ?? ''}`}
            aria-label={`Call courier ${order.driverName ?? ''}`}
            className="grid size-9 place-items-center border border-border text-sub transition hover:bg-secondary hover:text-ink"
          >
            <Bike size={15} />
          </a>
        )}
        <button onClick={(e) => e.stopPropagation()} className="grid size-9 place-items-center text-sub hover:bg-secondary" aria-label={`More options for order ${order.id}`}>
          <Ellipsis size={17} />
        </button>
      </div>
    </article>
  );
}

function RevenueChart({ deliveredToday }: { deliveredToday: Order[] }) {
  // last 8 SAST hours of delivered revenue
  const { buckets, total } = useMemo(() => {
    const nowH = hourSAST(Date.now());
    const buckets = Array.from({ length: 8 }, (_, i) => {
      const h = (nowH - (7 - i) + 24) % 24;
      return { h, label: h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`, v: 0 };
    });
    for (const o of deliveredToday) {
      const doneAt = o.timeline[o.timeline.length - 1]?.at ?? o.placedAt;
      const bucket = buckets.find((b) => b.h === hourSAST(doneAt));
      if (bucket) bucket.v += o.total;
    }
    return { buckets, total: buckets.reduce((s, b) => s + b.v, 0) };
  }, [deliveredToday]);

  const max = Math.max(...buckets.map((b) => b.v), 1);
  const W = 400;
  const H = 160;
  const pts = buckets.map((b, i) => [i * (W / (buckets.length - 1)), H - (b.v / max) * (H - 12)] as const);
  const HOURS = buckets.map((b) => b.label);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <div className="p-5">
      <div className="mb-5 flex items-end gap-3">
        <strong className="tabular font-mono text-3xl font-medium">{money(total)}</strong>
        <span className="mb-1 text-[10px] font-bold text-sub">last 8h delivered</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="h-[210px] w-full" role="img" aria-label="Hourly sales chart">
        <defs>
          <pattern id="chartHatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#b1d25a" strokeWidth="2" />
          </pattern>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1="0" y1={H * f} x2={W} y2={H * f} stroke="#e7e3d9" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#chartHatch)" />
        <path d={line} fill="none" stroke="#315d36" strokeWidth="2" />
        {pts.map((p, i) => (
          <text key={i} x={p[0]} y={H + 14} fontSize="9" fill="#7b7b72" textAnchor="middle" fontFamily="DM Mono">
            {HOURS[i]}
          </text>
        ))}
      </svg>
    </div>
  );
}

const PAUSE_OPTS = [
  { label: '30 min', min: 30 },
  { label: '1 hour', min: 60 },
  { label: '2 hours', min: 120 },
  { label: 'Until I resume', min: -1 },
];

function PauseControl({ now }: { now: number }) {
  const paused = useApp((s) => s.storePaused);
  const until = useApp((s) => s.storePausedUntil);
  const pause = useApp((s) => s.pauseStore);
  const [open, setOpen] = useState(false);

  if (paused) {
    return (
      <div className="flex items-center gap-3">
        {until && (
          <span className="text-[11px] text-white/60">
            Resumes {clock(until)} ({Math.max(0, Math.ceil((until - now) / 60000))}m)
          </span>
        )}
        <button
          onClick={() => pause()}
          className="flex h-11 items-center gap-2 bg-lime px-4 text-xs font-bold text-deep transition hover:brightness-95"
        >
          <Zap size={15} /> Resume orders
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-11 items-center gap-2 border border-white/20 bg-white/5 px-4 text-xs font-bold text-white transition hover:bg-white/10"
      >
        <Pause size={15} /> Pause new orders <ChevronDown size={13} />
      </button>
      {open && (
        <>
          <button aria-label="Close pause menu" onClick={() => setOpen(false)} className="fixed inset-0 z-10" />
          <div className="absolute right-0 top-12 z-20 w-48 border border-border bg-card text-ink shadow-xl">
            {PAUSE_OPTS.map((o) => (
              <button
                key={o.min}
                onClick={() => {
                  pause(o.min);
                  setOpen(false);
                }}
                className="block w-full px-4 py-3 text-left text-xs font-bold transition hover:bg-secondary"
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Overview() {
  const orders = useApp((s) => s.storeOrders);
  const paused = useApp((s) => s.storePaused);
  const prepTime = useApp((s) => s.prepTimeMin);
  const store = useApp((s) => s.stores.find((x) => x.id === s.account?.userId));
  const products = useApp((s) => s.products);
  const soldOut = useMemo(
    () => products.filter((p) => p.storeId === store?.id && !productAvailable(p.id)).length,
    [products, store],
  );
  const now = useNow();

  const [tab, setTab] = useState<Tab>('New');
  const [search, setSearch] = useState('');

  const newCount = orders.filter((o) => o.status === 'placed').length;
  const { muted, toggleMuted } = useNewOrderAlert(newCount > 0);
  const [detail, setDetail] = useState<Order | null>(null);
  // keep the panel in sync as realtime updates the order
  const detailOrder = detail ? (orders.find((o) => o.id === detail.id) ?? detail) : null;

  const counts = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(TAB_STATUS) as Tab[]).map((t) => [
          t,
          orders.filter(
            (o) => TAB_STATUS[t].includes(o.status) && (t !== 'Done' || isTodaySAST(o.placedAt)),
          ).length,
        ]),
      ) as Record<Tab, number>,
    [orders],
  );

  const visible = orders.filter(
    (o) =>
      TAB_STATUS[tab].includes(o.status) &&
      (tab !== 'Done' || isTodaySAST(o.placedAt)) &&
      `${o.id} ${o.customerName} ${o.items.map((i) => i.name).join(' ')}`.toLowerCase().includes(search.toLowerCase()),
  );

  const liveCount = orders.filter((o) => LIVE_STATUSES.includes(o.status)).length;
  const todayOrders = orders.filter((o) => isTodaySAST(o.placedAt));
  const deliveredToday = todayOrders.filter((o) => o.status === 'delivered');
  const netSales = deliveredToday.reduce((s, o) => s + o.total, 0);
  const rating = store && store.rating > 0 ? store.rating : null;

  const METRICS = [
    { label: 'Net sales today', value: money(netSales), note: `${deliveredToday.length} delivered`, pos: true },
    { label: 'Orders today', value: String(todayOrders.length), note: `${liveCount} live`, pos: true },
    {
      label: 'Avg. order',
      value: deliveredToday.length ? money(netSales / deliveredToday.length) : '—',
      note: 'delivered today',
      pos: true,
    },
    {
      label: 'Customer rating',
      value: rating ? rating.toFixed(1) : '—',
      note: store?.ratingCount ? `${store.ratingCount} ratings` : 'no ratings yet',
      pos: true,
    },
  ];

  return (
    <main className="p-4 md:p-7">
      {/* hero */}
      <section className="mb-6 grid overflow-hidden bg-ready text-white xl:grid-cols-[1fr_350px]">
        <div className="relative px-6 py-7 md:px-8 md:py-9">
          <div className="absolute right-8 top-0 hidden h-full w-px bg-white/10 md:block" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-lime">Live operations</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight md:text-[40px]">
                {counts.New > 0 ? 'New orders are in.' : 'All caught up.'}
                <br />
                <span className="text-white/50">
                  {counts.New > 0
                    ? `${counts.New} waiting — accept before the timer runs out.`
                    : liveCount > 0
                      ? `${liveCount} order${liveCount === 1 ? '' : 's'} in progress.`
                      : 'Quiet for now — new orders appear here.'}
                </span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
                Average prep time is set to {prepTime} minutes.
              </p>
            </div>
            <PauseControl now={now} />
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-white/10 xl:border-l xl:border-t-0">
          <div className="flex flex-col justify-between border-r border-white/10 p-6">
            <span className="text-[11px] text-white/50">Active orders</span>
            <strong className="tabular mt-5 font-mono text-4xl font-medium">{liveCount}</strong>
            <span className="mt-2 text-[10px] text-lime">+{counts.New} awaiting</span>
          </div>
          <div className="flex flex-col justify-between p-6">
            <span className="text-[11px] text-white/50">Avg. prep</span>
            <strong className="tabular mt-5 font-mono text-4xl font-medium">
              {prepTime}
              <span className="text-lg">m</span>
            </strong>
            <span className="mt-2 text-[10px] text-white/50">Target: {prepTime + 2}m</span>
          </div>
        </div>
      </section>

      {/* metrics */}
      <section className="mb-6 grid grid-cols-2 gap-px border border-border bg-border xl:grid-cols-4">
        {METRICS.map((m) => (
          <article key={m.label} className="bg-card p-4 md:p-5">
            <p className="text-[11px] text-sub">{m.label}</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
              <strong className="tabular font-mono text-xl font-medium md:text-2xl">{m.value}</strong>
              <span className={cn('text-[10px] font-bold', m.pos ? 'text-pos' : 'text-neg')}>{m.note}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,.55fr)]">
        {/* order rail */}
        <section className="border border-border bg-card">
          <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <Eyebrow>Order rail</Eyebrow>
              <h2 className="mt-1 font-display text-xl font-bold">Live orders</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMuted}
                aria-label={muted ? 'Unmute new-order alerts' : 'Mute new-order alerts'}
                title={muted ? 'Alerts muted' : 'Alerts on'}
                className={cn(
                  'grid size-10 place-items-center border transition',
                  muted ? 'border-border text-sub' : 'border-black bg-ink text-white',
                )}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <label className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order or item"
                className="h-10 w-full min-w-[220px] border border-border bg-[#faf9f5] pl-9 pr-3 text-xs outline-none transition focus:border-ring md:w-[250px]"
              />
              </label>
            </div>
          </div>
          <div className="flex overflow-x-auto border-b border-border px-5">
            {(Object.keys(TAB_META) as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'relative flex h-12 min-w-[120px] items-center gap-2 text-xs font-bold transition',
                  tab === t ? 'text-ready' : 'text-sub',
                )}
              >
                {t}
                <span
                  className={cn(
                    'grid size-5 place-items-center text-[9px]',
                    tab === t ? 'bg-ready text-white' : 'bg-secondary',
                  )}
                >
                  {counts[t]}
                </span>
                {tab === t && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-ready" />}
              </button>
            ))}
          </div>
          <div className="min-h-[350px] divide-y divide-border">
            {visible.map((o) => (
              <OrderRow key={o.id} order={o} tab={tab} now={now} onOpen={setDetail} />
            ))}
            {visible.length === 0 && (
              <div className="grid min-h-[300px] place-items-center text-center">
                <div>
                  <Check className="mx-auto text-leaf" size={28} />
                  <p className="mt-3 text-sm font-bold">All caught up</p>
                  <p className="mt-1 text-xs text-sub">No {tab.toLowerCase()} orders match your search.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* right rail */}
        <div className="space-y-6">
          <section className="border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <Eyebrow>Sales pulse</Eyebrow>
                <h2 className="mt-1 font-display text-lg font-bold">Revenue</h2>
              </div>
              <button className="flex h-9 items-center gap-2 border border-border px-3 text-[10px] font-bold">
                Today <ChevronDown size={12} />
              </button>
            </div>
            <RevenueChart deliveredToday={deliveredToday} />
          </section>

          <section className="border border-border bg-harvest p-5 text-harvest-ink">
            <div className="flex items-start justify-between">
              <span className="grid size-9 place-items-center border border-black/20">
                <Zap size={17} />
              </span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em]">Stock</span>
            </div>
            <h2 className="mt-8 max-w-[260px] font-display text-xl font-bold leading-tight">
              {soldOut === 0
                ? 'Everything on the menu is in stock.'
                : `${soldOut} item${soldOut === 1 ? ' is' : 's are'} marked out of stock.`}
            </h2>
            <p className="mt-3 text-xs leading-5 text-black/60">
              {soldOut === 0
                ? 'Mark items sold out from the Menu page as they run out.'
                : 'Restocked? Flip them back on from the Menu page.'}
            </p>
            <Link
              href="/menu"
              className="mt-5 flex h-10 items-center gap-2 bg-harvest-ink px-4 text-[11px] font-bold text-white w-fit"
            >
              Manage menu <ChevronDown size={13} className="-rotate-90" />
            </Link>
          </section>
        </div>
      </div>

      {detailOrder && <OrderDetail order={detailOrder} onClose={() => setDetail(null)} />}
    </main>
  );
}
