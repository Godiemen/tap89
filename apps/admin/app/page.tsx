'use client';
import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock3,
  FileCheck2,
  Filter,
  MoreHorizontal,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';
import { useApp, STATUS_LABEL } from '@sipdash/core';
import { cn, Eyebrow, StatusPill } from '../src/design';

type QStatus = 'Pending' | 'Approved' | 'Needs review' | 'Declined';
type QKind = 'Store' | 'Courier' | 'Customer';

interface QItem {
  key: string;
  kind: QKind;
  name: string;
  initials: string;
  sub: string;
  detail: string;
  detailSub: string;
  submitted: string;
  mono: string;
  status: QStatus;
  risk: 'Low' | 'Medium' | 'High';
  color: string;
  note: string;
  approveLabel: string;
  declineLabel: string;
  onApprove: () => void;
  onDecline: () => void;
}

const AVATAR_COLORS = ['#d7ff64', '#ffc46b', '#a6d8ff', '#e5d3ff', '#ffbdb5', '#b8f1cc'];

export default function AdminDash() {
  const stores = useApp((s) => s.stores);
  const drivers = useApp((s) => s.adminDrivers);
  const customers = useApp((s) => s.adminCustomers);
  const allOrders = useApp((s) => s.allOrders);
  const toggleStore = useApp((s) => s.toggleStoreApproved);
  const toggleDriver = useApp((s) => s.toggleDriverVerified);
  const suspendCustomer = useApp((s) => s.suspendCustomer);
  const surge = useApp((s) => s.surge);

  const [tab, setTab] = useState<'Queue' | 'All users'>('Queue');
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  
  const liveOrders = allOrders.filter((o) => !['delivered', 'rejected', 'cancelled'].includes(o.status));
  const gmv = allOrders.reduce((s, o) => s + o.total, 0);

  const items = useMemo<QItem[]>(() => {
    const list: QItem[] = [];
    stores.forEach((s, i) => {
      list.push({
        key: `store-${s.id}`,
        kind: 'Store',
        name: s.name,
        initials: s.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
        sub: `${s.address}`,
        detail: s.categories.map((c) => c[0].toUpperCase() + c.slice(1)).join(', ') || 'General',
        detailSub: `${s.rating}★ · ${s.ratingCount} ratings`,
        submitted: s.open ? 'Open now' : 'Closed',
        mono: s.id.toUpperCase(),
        status: s.approved ? 'Approved' : 'Pending',
        risk: 'Low',
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        note: s.approved
          ? 'Listing is live on the marketplace. Suspend to hide it from customers instantly.'
          : 'Liquor license and menu submitted. Approve to make this store visible to customers.',
        approveLabel: s.approved ? 'Approved' : 'Approve listing',
        declineLabel: s.approved ? 'Suspend' : 'Decline',
        onApprove: () => toggleStore(s.id),
        onDecline: () => toggleStore(s.id),
      });
    });
    drivers.forEach((d, i) => {
      list.push({
        key: `driver-${d.id}`,
        kind: 'Courier',
        name: d.name,
        initials: d.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
        sub: `${d.vehicle} · ${d.plate}`,
        detail: d.online ? 'Online now' : 'Offline',
        detailSub: `${d.trips} trips · ${d.rating}★`,
        submitted: d.online ? 'On shift' : 'Off shift',
        mono: d.id.toUpperCase(),
        status: d.verified ? 'Approved' : 'Needs review',
        risk: d.verified ? 'Low' : 'Medium',
        color: d.avatarColor || AVATAR_COLORS[(i + 2) % AVATAR_COLORS.length],
        note: d.verified
          ? '21+ age check and ID-verification training on file. Courier is cleared for alcohol deliveries.'
          : 'Awaiting 21+ verification and alcohol-delivery training sign-off. Required before first delivery.',
        approveLabel: d.verified ? 'Verified' : 'Verify courier',
        declineLabel: d.verified ? 'Revoke' : 'Decline',
        onApprove: () => toggleDriver(d.id),
        onDecline: () => toggleDriver(d.id),
      });
    });
    customers.forEach((c, i) => {
      list.push({
        key: `cust-${c.id}`,
        kind: 'Customer',
        name: c.name,
        initials: c.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
        sub: c.email,
        detail: `${c.orders} orders`,
        detailSub: `Joined ${c.joined}`,
        submitted: c.ageVerified ? '21+ verified' : 'Unverified age',
        mono: c.id.toUpperCase(),
        status: c.status === 'active' ? 'Approved' : 'Declined',
        risk: c.status === 'active' ? 'Low' : 'High',
        color: AVATAR_COLORS[(i + 4) % AVATAR_COLORS.length],
        note:
          c.status === 'active'
            ? `Active account · spent R${c.spent.toFixed(0)} lifetime. Suspend to block ordering.`
            : 'Account suspended — cannot place orders. Reactivate to restore access.',
        approveLabel: c.status === 'active' ? 'Active' : 'Reactivate',
        declineLabel: c.status === 'active' ? 'Suspend' : 'Declined',
        onApprove: () => suspendCustomer(c.id),
        onDecline: () => suspendCustomer(c.id),
      });
    });
    return list;
  }, [stores, drivers, customers, toggleStore, toggleDriver, suspendCustomer]);

  const queue = items.filter((i) => i.status !== 'Approved');
  const filtered = useMemo(
    () =>
      (tab === 'Queue' ? queue : items).filter((i) =>
        `${i.name} ${i.sub} ${i.kind} ${i.mono}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [tab, queue, items, search],
  );

  const selected = items.find((i) => i.key === selectedKey) ?? filtered[0] ?? items[0];

  const act = (approve: boolean) => {
    if (!selected) return;
    if (approve) selected.onApprove();
    else selected.onDecline();
    setToast(approve ? `${selected.name} updated` : `${selected.name} flagged`);
    window.setTimeout(() => setToast(''), 2600);
  };

  const METRICS = [
    { label: 'Orders today', value: String(46 + allOrders.length), note: '+8 live now' },
    { label: 'Gross sales', value: `R${(1240 + gmv).toFixed(0)}`, note: '+12.4%' },
    { label: 'Couriers online', value: String(drivers.filter((d) => d.online).length), note: 'of ' + drivers.length },
    { label: 'Surge', value: `${surge.toFixed(2)}x`, note: surge > 1 ? 'active' : 'normal' },
  ];

  return (
    <main>
      {/* hero */}
      <section className="border-b border-black bg-white">
        <div className="grid xl:grid-cols-[1fr_430px]">
          <div className="px-5 py-8 md:px-8 md:py-10">
            <div className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-olive">
              <span className="size-2 bg-moss" /> Marketplace operations / Live
            </div>
            <h1 className="max-w-3xl font-display text-[38px] leading-[0.96] tracking-[-0.045em] sm:text-[52px]">
              ORDERS, FLOWING.
              <br />
              <span className="text-[#a7a7a1]">CITY, MOVING.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-sub">
              Review new store partners, verify couriers for alcohol delivery, and keep the marketplace trustworthy.
            </p>
          </div>
          <div className="grid grid-cols-2 border-t border-black xl:border-l xl:border-t-0">
            <div className="flex flex-col justify-between border-r border-black bg-lime p-5 md:p-7">
              <span className="text-[11px] font-semibold uppercase tracking-wide">Awaiting decision</span>
              <strong className="mt-8 font-display text-5xl tracking-[-0.06em]">
                {String(queue.length).padStart(2, '0')}
              </strong>
              <span className="mt-3 flex items-center gap-1 text-[10px] font-semibold">
                <ArrowDownRight size={13} /> stores & couriers
              </span>
            </div>
            <div className="flex flex-col justify-between p-5 md:p-7">
              <span className="text-[11px] font-semibold uppercase tracking-wide">Live orders</span>
              <strong className="tabular mt-8 font-mono text-4xl font-medium">{liveOrders.length}</strong>
              <span className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-leaf">
                <ArrowUpRight size={13} /> tracking now
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* metrics */}
      <section className="grid grid-cols-2 border-b border-border bg-white md:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.label} className="border-r border-border p-4 last:border-r-0 md:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sub">{m.label}</p>
            <p className="tabular mt-3 font-mono text-xl font-medium md:text-2xl">{m.value}</p>
            <p className="mt-1 text-[10px] text-sub">{m.note}</p>
          </div>
        ))}
      </section>

      <section className="p-4 md:p-7">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Eyebrow>Marketplace access</Eyebrow>
            <h2 className="mt-1 font-display text-2xl tracking-[-0.04em]">APPROVAL DESK</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-10 items-center gap-2 border border-border bg-white px-3 text-xs font-semibold hover:bg-secondary">
              <Filter size={14} /> Filters{' '}
              <span className="grid size-5 place-items-center bg-black text-[9px] text-white">{queue.length}</span>
            </button>
            <button className="grid size-10 place-items-center border border-border bg-white hover:bg-secondary" aria-label="Table settings">
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        <div className="grid border border-black bg-white 2xl:grid-cols-[minmax(0,1fr)_390px]">
          {/* table */}
          <div className="min-w-0">
            <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-6">
                {(['Queue', 'All users'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn('relative h-10 text-xs font-semibold', tab === t ? 'text-black' : 'text-sub')}
                  >
                    {t}
                    {t === 'Queue' && queue.length > 0 && (
                      <span className="ml-2 bg-lime px-2 py-1 font-mono text-[9px]">{queue.length}</span>
                    )}
                    {tab === t && <span className="absolute inset-x-0 bottom-[-17px] h-0.5 bg-black" />}
                  </button>
                ))}
              </div>
              <label className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, business or id"
                  className="h-10 w-full border border-border bg-[#fafafa] pl-9 pr-3 text-xs outline-none focus:border-black sm:w-[260px]"
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[2fr_1.25fr_1fr_110px_42px] border-b border-border bg-strip px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-sub">
                  <span>Entity</span>
                  <span>Detail</span>
                  <span>Submitted</span>
                  <span>Status</span>
                  <span />
                </div>
                {filtered.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setSelectedKey(item.key)}
                    className={cn(
                      'grid w-full grid-cols-[2fr_1.25fr_1fr_110px_42px] items-center border-b border-border px-4 py-4 text-left transition hover:bg-[#fafafa]',
                      selected?.key === item.key && 'bg-rowhl',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        style={{ backgroundColor: item.color }}
                        className="grid size-10 shrink-0 place-items-center border border-black/15 text-[11px] font-bold text-black"
                      >
                        {item.initials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold">{item.name}</span>
                        <span className="mt-1 block truncate text-[10px] text-sub">
                          {item.kind} · {item.sub}
                        </span>
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">{item.detail}</span>
                      <span className="mt-1 block truncate text-[10px] text-sub">{item.detailSub}</span>
                    </span>
                    <span>
                      <span className="block text-xs">{item.submitted}</span>
                      <span className="mt-1 block font-mono text-[9px] text-sub">{item.mono}</span>
                    </span>
                    <StatusPill label={item.status} />
                    <ChevronRight size={15} className="text-sub" />
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="grid h-56 place-items-center text-center">
                    <div>
                      <Search className="mx-auto text-sub" size={24} />
                      <p className="mt-3 text-sm font-semibold">No entries found</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* decision panel */}
          {selected && (
            <aside className="border-t border-black bg-panel text-white 2xl:border-l 2xl:border-t-0">
              <div className="flex items-center justify-between border-b border-white/15 p-5">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">Decision panel</p>
                  <p className="mt-1 text-xs font-semibold">
                    {selected.mono} · {selected.kind}
                  </p>
                </div>
                <button className="grid size-8 place-items-center border border-white/15 hover:bg-white/10" aria-label="More options">
                  <MoreHorizontal size={16} />
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <span
                    style={{ backgroundColor: selected.color }}
                    className="grid size-14 place-items-center border border-white/20 text-sm font-bold text-black"
                  >
                    {selected.initials}
                  </span>
                  <div>
                    <h3 className="text-base font-bold">{selected.name}</h3>
                    <p className="mt-1 text-[11px] text-white/45">
                      {selected.kind} · {selected.sub}
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 border border-white/15">
                  <div className="border-r border-white/15 p-3">
                    <p className="text-[9px] uppercase tracking-wide text-white/35">Risk signal</p>
                    <p className="mt-2 flex items-center gap-2 text-xs font-semibold">
                      <span
                        className={cn(
                          'size-2',
                          selected.risk === 'Low' ? 'bg-lime' : selected.risk === 'Medium' ? 'bg-amber2' : 'bg-coral',
                        )}
                      />
                      {selected.risk}
                    </p>
                  </div>
                  <div className="p-3">
                    <p className="text-[9px] uppercase tracking-wide text-white/35">Status</p>
                    <p className="mt-2 font-mono text-xs">{selected.status}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="mb-3 text-[9px] uppercase tracking-[0.16em] text-white/35">Verification trail</p>
                  {[
                    ['Identity', selected.kind === 'Customer' ? 'Age 21+ confirmed' : 'Government ID matched', true],
                    ['Business', selected.detail, true],
                    [
                      'Authorization',
                      selected.status === 'Needs review' ? 'Manual review required' : 'Ownership confirmed',
                      selected.status !== 'Needs review',
                    ],
                    ['Compliance', 'Alcohol-delivery rules accepted', true],
                  ].map(([title, detail, passed]) => (
                    <div key={String(title)} className="flex gap-3 border-t border-white/10 py-3">
                      <span
                        className={cn(
                          'mt-0.5 grid size-5 shrink-0 place-items-center border',
                          passed ? 'border-lime text-lime' : 'border-amber2 text-amber2',
                        )}
                      >
                        {passed ? <Check size={12} /> : <Clock3 size={11} />}
                      </span>
                      <span>
                        <span className="block text-[11px] font-semibold">{title}</span>
                        <span className="mt-0.5 block text-[10px] text-white/40">{detail}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 border border-white/15 bg-white/5 p-3">
                  <p className="flex items-center gap-2 text-[10px] font-semibold text-lime">
                    <ShieldCheck size={14} /> System recommendation
                  </p>
                  <p className="mt-2 text-[10px] leading-5 text-white/50">{selected.note}</p>
                </div>
              </div>
              <div className="sticky bottom-0 grid grid-cols-[1fr_1.35fr] gap-2 border-t border-white/15 bg-panel p-5">
                <button
                  onClick={() => act(false)}
                  className="flex h-11 items-center justify-center gap-2 border border-white/20 text-xs font-semibold transition hover:bg-white/10"
                >
                  <XCircle size={15} /> {selected.declineLabel}
                </button>
                <button
                  onClick={() => act(true)}
                  className={cn(
                    'flex h-11 items-center justify-center gap-2 text-xs font-bold transition',
                    selected.status === 'Approved'
                      ? 'border border-white/20 text-white hover:bg-white/10'
                      : 'bg-lime text-black hover:bg-[#c8ef56]',
                  )}
                >
                  <BadgeCheck size={16} /> {selected.approveLabel}
                </button>
              </div>
            </aside>
          )}
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-3 bg-black px-4 py-3 text-xs font-semibold text-white shadow-xl">
          <span className="grid size-6 place-items-center bg-lime text-black">
            <FileCheck2 size={14} />
          </span>
          {toast}
        </div>
      )}
    </main>
  );
}
