'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { initSession, signOut, startEngine, stopEngine, useApp } from '@sipdash/core';
import { NavCapture } from '../src/nav';
import Auth from './Auth';
import {
  BarChart3,
  Bell,
  ChevronDown,
  CircleHelp,
  Hourglass,
  LayoutDashboard,
  Menu as MenuIcon,
  MessageSquareText,
  ReceiptText,
  Settings,
  Store,
  UtensilsCrossed,
  WalletCards,
  X,
} from 'lucide-react';
import { cn } from '../src/design';

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const MANAGE = [{ href: '/settings', label: 'Store settings', icon: Settings }];

function Sidebar({ open, onClose, pendingCount }: { open: boolean; onClose: () => void; pendingCount: number }) {
  const path = usePathname();
  const store = useApp((s) => s.stores.find((x) => x.id === s.account?.userId));
  const storeId = useApp((s) => s.account?.userId ?? '');

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-deep text-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-[82px] items-center justify-between border-b border-white/10 px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="SipDash Store home">
            <span className="grid size-9 place-items-center bg-lime text-deep">
              <UtensilsCrossed size={19} strokeWidth={2.5} />
            </span>
            <span>
              <span className="block font-display text-[17px] font-bold leading-none">SipDash</span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">
                Merchant
              </span>
            </span>
          </Link>
          <button className="lg:hidden" onClick={onClose} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-white/10 px-4 py-5">
          <button className="flex w-full items-center gap-3 px-2 text-left">
            <span className="grid size-10 shrink-0 place-items-center bg-coral text-sm font-bold text-[#27130c]">
              {store?.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() ?? 'ST'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{store?.name ?? 'My Store'}</span>
              <span className="block truncate text-[11px] text-white/50">
                {store?.address ?? 'Storefront'} · #{storeId.slice(0, 8).toUpperCase()}
              </span>
            </span>
            <ChevronDown size={15} className="text-white/50" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5">
          <p className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">Workspace</p>
          <div className="space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? path === '/' : path.startsWith(href);
              const badge = label === 'Overview' && pendingCount > 0 ? String(pendingCount) : null;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    'flex h-11 w-full items-center gap-3 px-3 text-sm transition',
                    active ? 'bg-lime font-bold text-deep' : 'text-white/65 hover:bg-white/[0.08] hover:text-white',
                  )}
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left">{label}</span>
                  {badge && (
                    <span
                      className={cn(
                        'grid size-5 place-items-center text-[10px] font-bold',
                        active ? 'bg-deep text-white' : 'bg-coral text-[#21120d]',
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <Link
              href="/"
              onClick={onClose}
              className="flex h-11 w-full items-center gap-3 px-3 text-sm text-white/65 transition hover:bg-white/[0.08] hover:text-white"
            >
              <ReceiptText size={18} />
              <span className="flex-1 text-left">Orders</span>
              {pendingCount > 0 && (
                <span className="grid size-5 place-items-center bg-coral text-[10px] font-bold text-[#21120d]">
                  {pendingCount}
                </span>
              )}
            </Link>
            <Link
              href="/analytics"
              onClick={onClose}
              className="flex h-11 w-full items-center gap-3 px-3 text-sm text-white/65 transition hover:bg-white/[0.08] hover:text-white"
            >
              <WalletCards size={18} />
              <span className="flex-1 text-left">Payments</span>
            </Link>
          </div>
          <p className="mt-7 px-3 pb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">Manage</p>
          {MANAGE.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex h-11 w-full items-center gap-3 px-3 text-sm transition',
                  active ? 'bg-lime font-bold text-deep' : 'text-white/65 hover:bg-white/[0.08] hover:text-white',
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
          <Link
            href="/menu"
            onClick={onClose}
            className="flex h-11 w-full items-center gap-3 px-3 text-sm text-white/65 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Store size={18} />
            Storefront
          </Link>
        </nav>

        <div className="m-3 border border-white/[0.12] bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold">
            <CircleHelp size={15} className="text-lime" /> Merchant support
          </div>
          <p className="text-[11px] leading-5 text-white/50">Average reply time is under 3 minutes.</p>
          <button className="mt-3 flex items-center gap-2 text-xs font-bold text-lime">
            <MessageSquareText size={14} /> Start a chat
          </button>
        </div>
      </aside>

      {open && (
        <button
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-label="Close menu overlay"
        />
      )}
    </>
  );
}

function Header({ onMenu }: { onMenu: () => void }) {
  const open = useApp((s) => s.storeOpen);
  const paused = useApp((s) => s.storePaused);
  const pausedUntil = useApp((s) => s.storePausedUntil);
  const store = useApp((s) => s.stores.find((x) => x.id === s.account?.userId));
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const accepting = open && !paused;
  const statusLabel = accepting
    ? 'Accepting orders'
    : paused
      ? pausedUntil
        ? `Paused until ${new Date(pausedUntil).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`
        : 'Paused'
      : 'Store offline';

  return (
    <header className="sticky top-0 z-30 flex h-[82px] items-center border-b border-border bg-bg/95 px-4 backdrop-blur-lg md:px-7">
      <button
        onClick={onMenu}
        className="mr-3 grid size-10 place-items-center border border-border bg-white lg:hidden"
        aria-label="Open navigation"
      >
        <MenuIcon size={19} />
      </button>
      <div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-sub">{today}</p>
        <h1 className="mt-1 font-display text-xl font-bold leading-none md:text-2xl">
          {store?.name ?? 'Store'} service
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <button
          className="relative grid size-10 place-items-center border border-border bg-white transition hover:bg-secondary"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-alert" />
        </button>
        <span
          className={cn(
            'flex h-10 items-center gap-2 border px-3 text-xs font-bold md:px-4',
            accepting
              ? 'border-[#83a32d] bg-[#e9f6ca] text-[#244314]'
              : 'border-[#d1b7ae] bg-[#f4ded7] text-[#6b2715]',
          )}
          title="Change this in the dashboard pause control or settings"
        >
          <span className={cn('size-2 rounded-full', accepting ? 'bg-leaf' : 'bg-[#a63d20]')} />
          <span className="hidden sm:inline">{statusLabel}</span>
          <span className="sm:hidden">{accepting ? 'Open' : paused ? 'Paused' : 'Offline'}</span>
        </span>
        <span className="flex size-10 items-center justify-center bg-deep font-display text-xs font-bold text-white">
          {store?.name
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() ?? 'ST'}
        </span>
      </div>
    </header>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pendingCount = useApp((s) => s.storeOrders.filter((o) => o.status === 'placed').length);
  const connected = useApp((s) => s.connected);
  const account = useApp((s) => s.account);
  const authReady = useApp((s) => s.authReady);

  useEffect(() => {
    setMounted(true);
    void initSession();
    return () => stopEngine();
  }, []);

  useEffect(() => {
    if (account) startEngine();
  }, [account]);

  if (!mounted || !authReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg font-sans text-ink">
        <NavCapture />
        <div className="font-display text-3xl font-bold">SipDash</div>
      </div>
    );
  }

  if (!account) return <Auth />;

  if (account.role !== 'store') {
    return (
      <div className="grid min-h-screen place-items-center bg-bg p-5 font-sans text-ink">
        <NavCapture />
        <div className="max-w-sm text-center">
          <h1 className="font-display text-3xl font-bold">Wrong app</h1>
          <p className="mt-3 text-sm text-sub">
            This account is registered as a {account.role}. Sign in with a merchant account.
          </p>
          <button
            onClick={() => void signOut()}
            className="mt-6 h-12 w-full bg-deep text-sm font-bold text-white transition hover:bg-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (account.approved === false) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg p-5 font-sans text-ink">
        <NavCapture />
        <div className="w-full max-w-md border border-border bg-card p-8 text-center">
          <span className="mx-auto grid size-16 place-items-center bg-harvest">
            <Hourglass size={30} className="text-harvest-ink" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold">Application under review</h1>
          <p className="mt-3 text-sm leading-6 text-sub">
            {account.name} is being reviewed by our ops team. Your storefront unlocks automatically
            once it&apos;s approved — you can keep this page open.
          </p>
          <button
            onClick={() => void signOut()}
            className="mt-8 h-12 w-full border border-border text-sm font-bold transition hover:bg-secondary"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg font-sans text-ink selection:bg-lime">
      <NavCapture />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} pendingCount={pendingCount} />
      <div className="lg:pl-[248px]">
        <Header onMenu={() => setSidebarOpen(true)} />
        {!connected && (
          <div
            role="alert"
            className="border-b border-[#d1b7ae] bg-[#f4ded7] px-4 py-2 text-center text-xs font-bold text-[#6b2715] md:px-7"
          >
            Reconnecting — order updates may be delayed. Orders placed while offline appear when the connection returns.
          </div>
        )}
        {mounted ? (
          children
        ) : (
          <div className="grid min-h-[60vh] place-items-center font-display text-3xl font-bold">SipDash</div>
        )}
      </div>
    </div>
  );
}
