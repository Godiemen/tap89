'use client';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '@sipdash/core';
import { cn, Eyebrow, StatusPill } from '../../src/design';

export default function AdminDrivers() {
  const drivers = useApp((s) => s.adminDrivers);
  const toggleVerified = useApp((s) => s.toggleDriverVerified);

  const online = drivers.filter((d) => d.online).length;
  const pending = drivers.filter((d) => !d.verified).length;

  return (
    <main className="p-4 md:p-7">
      <div className="mb-5">
        <Eyebrow>Courier fleet</Eyebrow>
        <h1 className="mt-1 font-display text-2xl tracking-[-0.04em]">COURIERS</h1>
        <p className="mt-1 text-xs text-sub">
          {online} online · {pending} pending verification
        </p>
      </div>

      <div className="border border-black bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[2fr_1.3fr_1fr_1fr_120px_100px] border-b border-border bg-strip px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-sub">
              <span>Courier</span>
              <span>Vehicle</span>
              <span>Trips</span>
              <span>Status</span>
              <span>Verification</span>
              <span>Action</span>
            </div>
            {drivers.map((d) => (
              <div
                key={d.id}
                className="grid grid-cols-[2fr_1.3fr_1fr_1fr_120px_100px] items-center border-b border-border px-4 py-4 transition hover:bg-[#fafafa]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    style={{ backgroundColor: d.avatarColor }}
                    className="grid size-10 shrink-0 place-items-center border border-black/15 text-[11px] font-bold text-black"
                  >
                    {d.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">{d.name}</span>
                    <span className="mt-1 block truncate text-[10px] text-sub">{d.rating}★ rating</span>
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{d.vehicle}</span>
                  <span className="mt-1 block truncate font-mono text-[9px] text-sub">{d.plate}</span>
                </span>
                <span className="tabular text-xs">{d.trips}</span>
                <span className="text-xs">
                  <span className={cn('mr-1 inline-block size-1.5 rounded-full', d.online ? 'bg-leaf' : 'bg-sub')} />
                  {d.online ? 'Online' : 'Offline'}
                </span>
                <StatusPill label={d.verified ? 'Approved' : 'Needs review'} />
                <span>
                  <button
                    onClick={() => toggleVerified(d.id)}
                    className={cn(
                      'h-8 border px-3 text-[10px] font-semibold transition',
                      d.verified
                        ? 'border-border text-sub hover:border-wine hover:text-wine'
                        : 'border-black bg-black text-white hover:bg-lime hover:text-black',
                    )}
                  >
                    {d.verified ? 'Revoke' : 'Verify'}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 border border-border bg-white p-4">
        <ShieldCheck size={16} className="text-leaf" />
        <p className="text-[11px] leading-5 text-sub">
          Alcohol deliveries require couriers to be 21+ verified with completed ID-check training.
        </p>
      </div>
    </main>
  );
}
