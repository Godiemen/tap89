'use client';
import { BadgeCheck, LogOut, Percent, Ticket, UsersRound, Zap } from 'lucide-react';
import { useApp, money, signOut } from '@sipdash/core';
import { cn, Card, Eyebrow, StatusPill, Switch } from '../../src/design';

const SURGE_STEPS = [1.0, 1.25, 1.5, 2.0];
const FEE_STEPS = [15, 22, 28];
const AVATAR_COLORS = ['#d7ff64', '#ffc46b', '#a6d8ff', '#e5d3ff', '#ffbdb5'];

export default function AdminMore() {
  const customers = useApp((s) => s.adminCustomers);
  const suspendCustomer = useApp((s) => s.suspendCustomer);
  const promos = useApp((s) => s.promos);
  const togglePromo = useApp((s) => s.togglePromo);
  const surge = useApp((s) => s.surge);
  const setSurge = useApp((s) => s.setSurge);
  const fee = useApp((s) => s.platformFeePct);
  const setPlatformFee = useApp((s) => s.setPlatformFee);

  return (
    <main className="p-4 md:p-7">
      <div className="mb-5">
        <Eyebrow>Platform controls</Eyebrow>
        <h1 className="mt-1 font-display text-2xl tracking-[-0.04em]">CONTROLS</h1>
        <p className="mt-1 text-xs text-sub">Changes apply to all apps instantly.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* surge */}
        <Card>
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center border border-border bg-strip">
                <Zap size={16} />
              </span>
              <div>
                <p className="text-xs font-bold">Surge pricing</p>
                <p className="mt-0.5 text-[10px] text-sub">Multiplies delivery fees city-wide</p>
              </div>
            </div>
            <span
              className={cn(
                'tabular border px-3 py-1.5 font-mono text-sm font-bold',
                surge > 1 ? 'border-[#a87900] bg-[#fff3c4] text-[#6c4d00]' : 'border-border bg-strip text-sub',
              )}
            >
              {surge.toFixed(2)}x
            </span>
          </div>
          <div className="flex gap-px bg-border p-px">
            {SURGE_STEPS.map((v) => (
              <button
                key={v}
                onClick={() => setSurge(v)}
                className={cn(
                  'tabular flex-1 py-3 text-sm font-bold transition',
                  surge === v ? 'bg-black text-lime' : 'bg-card text-sub hover:bg-secondary hover:text-ink',
                )}
              >
                {v}x
              </button>
            ))}
          </div>
        </Card>

        {/* platform fee */}
        <Card>
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center border border-border bg-strip">
                <Percent size={16} />
              </span>
              <div>
                <p className="text-xs font-bold">Platform commission</p>
                <p className="mt-0.5 text-[10px] text-sub">SipDash&apos;s cut of each order&apos;s subtotal</p>
              </div>
            </div>
            <span className="tabular border border-border bg-strip px-3 py-1.5 font-mono text-sm font-bold">{fee}%</span>
          </div>
          <div className="flex gap-px bg-border p-px">
            {FEE_STEPS.map((v) => (
              <button
                key={v}
                onClick={() => setPlatformFee(v)}
                className={cn(
                  'tabular flex-1 py-3 text-sm font-bold transition',
                  fee === v ? 'bg-black text-lime' : 'bg-card text-sub hover:bg-secondary hover:text-ink',
                )}
              >
                {v}%
              </button>
            ))}
          </div>
        </Card>

        {/* promos */}
        <Card>
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center border border-border bg-strip">
                <Ticket size={16} />
              </span>
              <div>
                <p className="text-xs font-bold">Promo codes</p>
                <p className="mt-0.5 text-[10px] text-sub">{promos.filter((p) => p.active).length} active</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {promos.map((p) => (
              <div key={p.code} className="flex items-center gap-4 p-4 transition hover:bg-[#fafafa]">
                <span className="tabular grid h-9 shrink-0 place-items-center border border-black bg-black px-3 font-mono text-[10px] font-bold text-lime">
                  {p.code}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{p.description}</p>
                  <p className="mt-0.5 font-mono text-[9px] text-sub">
                    {p.uses} uses{p.minSubtotal > 0 ? ` · min ${money(p.minSubtotal)}` : ''}
                  </p>
                </div>
                <Switch checked={p.active} onChange={() => togglePromo(p.code)} label={`Toggle ${p.code}`} />
              </div>
            ))}
          </div>
        </Card>

        {/* customers */}
        <Card>
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center border border-border bg-strip">
                <UsersRound size={16} />
              </span>
              <div>
                <p className="text-xs font-bold">Customers</p>
                <p className="mt-0.5 text-[10px] text-sub">
                  {customers.filter((c) => c.status === 'suspended').length} suspended
                </p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {customers.map((c, i) => (
              <div key={c.id} className="flex items-center gap-4 p-4 transition hover:bg-[#fafafa]">
                <span
                  style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  className="grid size-9 shrink-0 place-items-center border border-black/15 text-[10px] font-bold text-black"
                >
                  {c.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">
                    {c.name}
                    {c.ageVerified && <BadgeCheck size={12} className="ml-1 inline text-leaf" />}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-sub">
                    {c.orders} orders · {money(c.spent)} spent
                  </p>
                </div>
                <StatusPill label={c.status === 'active' ? 'Approved' : 'Declined'} />
                <button
                  onClick={() => suspendCustomer(c.id)}
                  className={cn(
                    'h-8 shrink-0 border px-3 text-[10px] font-semibold transition',
                    c.status === 'active'
                      ? 'border-border text-sub hover:border-wine hover:text-wine'
                      : 'border-black bg-black text-white hover:bg-lime hover:text-black',
                  )}
                >
                  {c.status === 'active' ? 'Suspend' : 'Reactivate'}
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* sign out */}
      <Card className="mt-6 border-deep bg-deep text-white">
        <div className="flex items-center gap-4 p-5">
          <span className="grid size-10 shrink-0 place-items-center bg-lime text-deep">
            <LogOut size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Sign out</p>
            <p className="mt-0.5 text-xs text-white/50">End this operator session</p>
          </div>
          <button
            onClick={() => void signOut()}
            className="shrink-0 bg-lime px-4 py-2 text-xs font-bold text-deep transition hover:bg-[#c8ef56]"
          >
            Sign out →
          </button>
        </div>
      </Card>
    </main>
  );
}
