'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  CreditCard,
  MapPin,
  Receipt,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useApp, money, signOut, timeAgo, type LatLng } from '@sipdash/core';
import Auth from '../Auth';
import { cn } from '../../src/design';

const LocationPicker = dynamic(() => import('@sipdash/ui').then((m) => m.LocationPicker), { ssr: false });

const KIND_ICON: Record<string, typeof Bell> = { order: Receipt, promo: BadgeCheck, system: Bell };

/** Drop the real delivery pin — writes lat/lng on the customer row so orders
 *  carry a real drop-off the courier can route to. */
function DeliveryPin() {
  const account = useApp((s) => s.account);
  const setMyLocation = useApp((s) => s.setMyLocation);
  const [pin, setPin] = useState<LatLng | undefined>(account?.latLng);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-5 border border-black/10 bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MapPin size={17} className="text-grape" />
          <div>
            <p className="text-sm font-bold">Delivery pin</p>
            <p className="text-xs text-mist">
              {account?.latLng ? 'Set — couriers route to this spot' : 'Not set — couriers see an approximate area'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs font-bold text-grape underline underline-offset-2"
        >
          {open ? 'Done' : account?.latLng ? 'Adjust' : 'Set pin'}
        </button>
      </div>
      {open && (
        <div className="mt-4">
          <LocationPicker value={pin ?? account?.latLng} onPick={setPin} height={220} />
          <button
            onClick={() => {
              if (pin) {
                setMyLocation(pin);
                setSaved(true);
                setOpen(false);
                setTimeout(() => setSaved(false), 2000);
              }
            }}
            className="mt-3 h-11 w-full bg-grape text-xs font-bold text-white transition hover:brightness-95"
          >
            Save delivery pin
          </button>
          <p className="mt-2 text-center text-[11px] text-mist">Drag the pin or tap the map to place it.</p>
        </div>
      )}
      {saved && <p className="mt-2 text-[11px] font-bold text-leaf">Saved.</p>}
    </section>
  );
}

export default function Account() {
  const account = useApp((s) => s.account);
  const userName = account?.name ?? 'there';
  const email = account?.email ?? '';
  const address = account?.address ?? '';
  const ageVerified = useApp((s) => s.ageVerified);
  const notifications = useApp((s) => s.notifications);
  const markNotificationsRead = useApp((s) => s.markNotificationsRead);
  const orders = useApp((s) => s.orders);

  if (!account) return <Auth />;

  const spent = orders.reduce((s, o) => s + o.total, 0);
  const unread = notifications.filter((n) => !n.read).length;

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="bg-cream px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-grape">Your account</p>
        <h1 className="font-display text-5xl uppercase tracking-tight md:text-6xl">Hey, {userName.split(' ')[0]}</h1>

        {/* profile card */}
        <section className="mt-10 flex items-center gap-5 border border-black/10 bg-white p-6">
          <span className="grid size-16 place-items-center rounded-full bg-ink font-display text-2xl text-gold">
            {initials}
          </span>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{userName}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-mist">
              <MapPin size={13} /> {address}
            </p>
            <p className="mt-0.5 text-xs text-mist">{email}</p>
          </div>
          {ageVerified && (
            <span className="flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-xs font-bold">
              <ShieldCheck size={14} /> 21+ verified
            </span>
          )}
        </section>

        {/* delivery pin */}
        <DeliveryPin />

        {/* stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ['Orders', String(orders.length)],
            ['Spent', money(spent)],
            ['Unread', String(unread)],
          ].map(([label, value]) => (
            <div key={label} className="border border-black/10 bg-white p-5 text-center">
              <p className="font-display text-3xl">{value}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-mist">{label}</p>
            </div>
          ))}
        </div>

        {/* quick links */}
        <div className="mt-5 divide-y divide-black/10 border border-black/10 bg-white">
          {[
            { href: '/orders', label: 'Order history', icon: Receipt },
            { href: '/cart', label: 'Payment & cart', icon: CreditCard },
            { href: '/', label: 'App settings', icon: Settings },
          ].map((row) => (
            <Link key={row.label} href={row.href} className="flex items-center gap-4 p-5 transition hover:bg-stone">
              <row.icon size={18} className="text-grape" />
              <span className="flex-1 text-sm font-bold">{row.label}</span>
              <ChevronRight size={16} className="text-mist" />
            </Link>
          ))}
        </div>

        {/* notifications */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl uppercase tracking-tight">Notifications</h2>
            {unread > 0 && (
              <button onClick={markNotificationsRead} className="text-xs font-bold text-grape underline underline-offset-2">
                Mark all read
              </button>
            )}
          </div>
          <div className="divide-y divide-black/10 border border-black/10 bg-white">
            {notifications.slice(0, 8).map((n) => {
              const Icon = KIND_ICON[n.kind] ?? Bell;
              return (
                <div key={n.id} className={cn('flex items-start gap-4 p-5', !n.read && 'bg-gold/10')}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-stone">
                    <Icon size={16} className="text-grape" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">{n.title}</p>
                      <span className="font-mono text-[11px] text-mist">{timeAgo(n.at)}</span>
                    </div>
                    <p className="mt-0.5 text-sm leading-5 text-mist">{n.body}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-grape" />}
                </div>
              );
            })}
            {notifications.length === 0 && (
              <p className="p-8 text-center text-sm text-mist">All quiet. Order something worth a notification.</p>
            )}
          </div>
        </section>

        <button
          onClick={() => void signOut()}
          className="mt-8 flex h-12 w-full items-center justify-center border border-ink/15 bg-white text-sm font-bold transition hover:border-ink"
        >
          Sign out
        </button>

        <p className="mt-10 text-center text-[11px] leading-5 text-mist">
          SipDash prototype · Customers must be 21+ · Couriers verify ID on every delivery.
        </p>
      </div>
    </main>
  );
}
