'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { BadgeCheck, Clock3, MapPin, PauseCircle, Store, Wallet } from 'lucide-react';
import { useApp, signOut, type LatLng } from '@sipdash/core';
import { Card, Eyebrow, Switch, cn } from '../../src/design';

const LocationPicker = dynamic(() => import('@sipdash/ui').then((m) => m.LocationPicker), { ssr: false });

const PREP_OPTIONS = [10, 15, 20, 30];

const DAYS: { key: string; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

type Hours = Record<string, [string, string]>;

/** Where couriers actually pick up — geocoded address or a hand-placed pin. */
function StorePin({ store }: { store: { latLng?: LatLng } | undefined }) {
  const setMyLocation = useApp((s) => s.setMyLocation);
  const [pin, setPin] = useState<LatLng | undefined>(store?.latLng);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <Card className="mt-6">
      <div className="flex items-center gap-4 p-5">
        <span className="grid size-10 shrink-0 place-items-center border border-border bg-bg">
          <MapPin size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Pickup location</p>
          <p className="mt-0.5 text-xs text-sub">
            {store?.latLng
              ? 'Set — couriers navigate to this pin'
              : 'Not set — couriers see an approximate area'}
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 border border-border px-3 py-2 text-[11px] font-bold transition hover:bg-secondary"
        >
          {open ? 'Done' : store?.latLng ? 'Adjust' : 'Set pin'}
        </button>
      </div>
      {open && (
        <div className="border-t border-border p-5">
          <LocationPicker value={pin ?? store?.latLng} onPick={setPin} height={220} />
          <button
            onClick={() => {
              if (pin) {
                setMyLocation(pin);
                setSaved(true);
                setOpen(false);
                setTimeout(() => setSaved(false), 2000);
              }
            }}
            className="mt-3 h-11 w-full bg-ink text-xs font-bold text-white transition hover:brightness-95"
          >
            Save pickup pin
          </button>
        </div>
      )}
      {saved && <p className="border-t border-border px-5 py-2.5 text-[11px] font-bold text-leaf">Saved.</p>}
    </Card>
  );
}

function OpeningHours({ store }: { store: { openHours?: Hours } | undefined }) {
  const setOpenHours = useApp((s) => s.setOpenHours);
  const [days, setDays] = useState<Hours>(store?.openHours ?? {
    mon: ['09:00', '23:00'], tue: ['09:00', '23:00'], wed: ['09:00', '23:00'],
    thu: ['09:00', '23:00'], fri: ['09:00', '23:00'], sat: ['10:00', '23:00'],
    sun: ['10:00', '22:00'],
  });
  const [enabled, setEnabled] = useState(!!store?.openHours);
  const [saved, setSaved] = useState(false);

  const save = (h: Hours | null) => {
    setOpenHours(h);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="mt-6">
      <div className="flex items-center gap-4 border-b border-border p-5">
        <span className="grid size-10 shrink-0 place-items-center border border-border bg-bg">
          <Clock3 size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Opening hours</p>
          <p className="mt-0.5 text-xs text-sub">
            {enabled
              ? 'Outside these hours the store is auto-paused (SAST)'
              : 'Off — no hours-based auto-pause'}
          </p>
        </div>
        <Switch
          checked={enabled}
          onChange={() => {
            const on = !enabled;
            setEnabled(on);
            save(on ? days : null);
          }}
          label="Opening hours"
        />
      </div>
      {enabled && (
        <>
          <div className="divide-y divide-border">
            {DAYS.map((d) => {
              const range = days[d.key];
              const closed = !range;
              return (
                <div key={d.key} className="grid grid-cols-[88px_1fr_auto] items-center gap-3 p-4">
                  <span className="text-xs font-bold">{d.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      disabled={closed}
                      value={range?.[0] ?? '09:00'}
                      onChange={(e) =>
                        setDays((s) => ({ ...s, [d.key]: [e.target.value, s[d.key]?.[1] ?? '23:00'] }))
                      }
                      className="border border-border bg-white px-2 py-1.5 font-mono text-xs disabled:opacity-40"
                    />
                    <span className="text-xs text-sub">to</span>
                    <input
                      type="time"
                      disabled={closed}
                      value={range?.[1] ?? '23:00'}
                      onChange={(e) =>
                        setDays((s) => ({ ...s, [d.key]: [s[d.key]?.[0] ?? '09:00', e.target.value] }))
                      }
                      className="border border-border bg-white px-2 py-1.5 font-mono text-xs disabled:opacity-40"
                    />
                  </div>
                  <button
                    onClick={() =>
                      setDays((s) => {
                        const next = { ...s };
                        if (next[d.key]) delete next[d.key];
                        else next[d.key] = ['09:00', '23:00'];
                        return next;
                      })
                    }
                    className={cn(
                      'border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition',
                      closed ? 'border-wine bg-wine text-white' : 'border-border text-sub hover:text-ink',
                    )}
                  >
                    {closed ? 'Closed' : 'Open'}
                  </button>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => save(days)}
            className="h-11 w-full border-t border-border bg-ink text-xs font-bold text-white transition hover:brightness-95"
          >
            {saved ? 'Saved ✓' : 'Save hours'}
          </button>
        </>
      )}
    </Card>
  );
}

const COMPLIANCE = [
  'Liquor license #LL-2041-88 — valid until Dec 2026',
  'All drivers must verify customer ID at drop-off',
  'No deliveries to intoxicated customers',
  'Delivery hours restricted: 9am – 11pm',
];

export default function StoreSettings() {
  const open = useApp((s) => s.storeOpen);
  const paused = useApp((s) => s.storePaused);
  const prepTime = useApp((s) => s.prepTimeMin);
  const toggleOpen = useApp((s) => s.toggleStoreOpen);
  const togglePaused = useApp((s) => s.toggleStorePaused);
  const setPrepTime = useApp((s) => s.setPrepTime);
  const store = useApp((s) => s.stores.find((x) => x.id === s.account?.userId));

  return (
    <main className="p-4 md:p-7">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Eyebrow>Manage</Eyebrow>
          <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">Store settings</h1>
          <p className="mt-1 text-xs text-sub">
            {store?.emoji} {store?.name} · {store?.address}
          </p>
        </div>

        {/* status */}
        <Card>
          <div className="flex items-center gap-4 border-b border-border p-5">
            <span className="grid size-10 shrink-0 place-items-center border border-border bg-bg">
              <Store size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Store open</p>
              <p className="mt-0.5 text-xs text-sub">{open ? 'Visible in the customer app' : 'Marked closed in the app'}</p>
            </div>
            <Switch checked={open} onChange={toggleOpen} label="Store open" />
          </div>
          <div className="flex items-center gap-4 p-5">
            <span className="grid size-10 shrink-0 place-items-center border border-border bg-bg">
              <PauseCircle size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Pause new orders</p>
              <p className="mt-0.5 text-xs text-sub">Stay visible but stop incoming orders</p>
            </div>
            <Switch checked={paused} onChange={togglePaused} label="Pause new orders" />
          </div>
        </Card>

        {/* opening hours */}
        <OpeningHours store={store} />

        {/* pickup pin */}
        <StorePin store={store} />

        {/* prep time */}
        <Card className="mt-6">
          <div className="border-b border-border p-5">
            <div className="flex items-center gap-4">
              <span className="grid size-10 shrink-0 place-items-center border border-border bg-bg">
                <Clock3 size={17} />
              </span>
              <div>
                <p className="text-sm font-bold">Estimated prep time</p>
                <p className="mt-0.5 text-xs text-sub">Shown to customers as part of delivery ETA</p>
              </div>
            </div>
          </div>
          <div className="flex gap-px bg-border p-px">
            {PREP_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setPrepTime(m)}
                className={cn(
                  'tabular flex-1 py-3 text-sm font-bold transition',
                  prepTime === m ? 'bg-primary text-white' : 'bg-card text-sub hover:bg-secondary hover:text-ink',
                )}
              >
                {m} min
              </button>
            ))}
          </div>
        </Card>

        {/* compliance */}
        <Card className="mt-6">
          <div className="border-b border-border p-5">
            <Eyebrow>Required</Eyebrow>
            <h2 className="mt-1 font-display text-lg font-bold">Alcohol compliance</h2>
          </div>
          <div className="divide-y divide-border">
            {COMPLIANCE.map((t) => (
              <div key={t} className="flex items-center gap-3 p-4">
                <BadgeCheck size={16} className="shrink-0 text-leaf" />
                <p className="text-xs leading-5 text-[#4d514e]">{t}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* payout */}
        <Card className="mt-6">
          <div className="flex items-center gap-4 p-5">
            <span className="grid size-10 shrink-0 place-items-center border border-border bg-bg">
              <Wallet size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Payouts</p>
              <p className="mt-0.5 text-xs text-sub">Weekly · Bank •••• 4410 · next payout R1,240</p>
            </div>
            <span className="shrink-0 bg-sage px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sage-ink">
              On time
            </span>
          </div>
        </Card>

        {/* sign out */}
        <Card className="mt-6 border-deep bg-deep text-white">
          <div className="flex items-center gap-4 p-5">
            <span className="grid size-10 shrink-0 place-items-center bg-lime text-deep">
              <Store size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Sign out</p>
              <p className="mt-0.5 text-xs text-white/50">End this merchant session</p>
            </div>
            <button
              onClick={() => void signOut()}
              className="shrink-0 bg-lime px-4 py-2 text-xs font-bold text-deep transition hover:brightness-95"
            >
              Sign out →
            </button>
          </div>
        </Card>
      </div>
    </main>
  );
}
