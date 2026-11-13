'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { initSession, signOut, startEngine, stopEngine, useApp } from '@sipdash/core';
import { NavCapture } from '../src/nav';
import Auth from './Auth';
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  LayoutGrid,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  ReceiptText,
  SlidersHorizontal,
  Store,
  UserRoundCheck,
  UsersRound,
  X,
} from 'lucide-react';
import { cn } from '../src/design';

const CRUMBS: Record<string, string> = {
  '/': 'Approval queue',
  '/orders': 'Order monitor',
  '/stores': 'Store partners',
  '/drivers': 'Courier fleet',
  '/more': 'Platform controls',
};

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();
  const account = useApp((s) => s.account);
  const initials = (account?.name ?? 'A')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const stores = useApp((s) => s.stores);
  const drivers = useApp((s) => s.adminDrivers);
  const pendingStores = stores.filter((s) => !s.approved).length;
  const pendingDrivers = drivers.filter((d) => !d.verified).length;

  const nav = [
    { href: '/', label: 'Overview', icon: LayoutGrid },
    { href: '/orders', label: 'Orders', icon: ReceiptText },
    { href: '/stores', label: 'Stores', icon: Store, badge: pendingStores ? String(pendingStores) : undefined },
    { href: '/drivers', label: 'Couriers', icon: UserRoundCheck, badge: pendingDrivers ? String(pendingDrivers) : undefined },
    { href: '/more', label: 'Controls', icon: SlidersHorizontal },
  ];

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[236px] flex-col border-r border-white/10 bg-deep text-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-[74px] items-center justify-between border-b border-white/15 px-5">
          <Link href="/" className="flex items-center gap-3" aria-label="SipDash admin home">
            <span className="font-display text-xl tracking-[-0.08em]">SIPDASH</span>
            <span className="h-5 w-px bg-white/25" />
            <span className="text-sm font-medium">Ops</span>
          </Link>
          <button onClick={onClose} className="lg:hidden" aria-label="Close menu">
            <X size={19} />
          </button>
        </div>

        <div className="border-b border-white/15 p-4">
          <button className="flex w-full items-center gap-3 border border-white/15 px-3 py-3 text-left transition hover:border-white/35">
            <span className="grid size-8 place-items-center bg-lime text-xs font-bold text-black">SD</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">SipDash Operations</span>
              <span className="mt-0.5 block text-[10px] text-white/45">Owner workspace</span>
            </span>
            <ChevronDown size={14} className="text-white/45" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5">
          <p className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Control room</p>
          <div className="space-y-1">
            {nav.map(({ href, label, icon: Icon, badge }) => {
              const active = href === '/' ? path === '/' : path.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    'flex h-11 w-full items-center gap-3 px-3 text-[13px] transition',
                    active ? 'bg-white font-semibold text-black' : 'text-white/60 hover:bg-white/[0.08] hover:text-white',
                  )}
                >
                  <Icon size={17} />
                  <span className="flex-1 text-left">{label}</span>
                  {badge && (
                    <span
                      className={cn(
                        'grid h-5 min-w-5 place-items-center px-1 font-mono text-[9px]',
                        active ? 'bg-lime text-black' : 'bg-white/[0.12] text-white',
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          <p className="mb-2 mt-7 px-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Directory</p>
          <Link
            href="/more"
            onClick={onClose}
            className="flex h-11 w-full items-center gap-3 px-3 text-[13px] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
          >
            <UsersRound size={17} />
            <span className="flex-1 text-left">Customers</span>
          </Link>
          <Link
            href="/stores"
            onClick={onClose}
            className="flex h-11 w-full items-center gap-3 px-3 text-[13px] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Building2 size={17} />
            <span className="flex-1 text-left">Organizations</span>
          </Link>
        </nav>

        <div className="m-3 border border-white/15 p-4">
          <CircleHelp size={16} className="text-lime" />
          <p className="mt-4 text-xs font-semibold">Need an escalation?</p>
          <p className="mt-1 text-[10px] leading-4 text-white/45">Risk support is online with a 2 min response time.</p>
          <button className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-lime">
            <MessageSquareText size={14} /> Contact support
          </button>
        </div>

        <div className="flex items-center gap-3 border-t border-white/15 p-4">
          <span className="grid size-9 place-items-center rounded-full bg-coral text-xs font-bold text-black">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold">{account?.name ?? 'Admin'}</span>
            <button onClick={() => void signOut()} className="block text-[10px] text-white/40 hover:text-white">
              Sign out
            </button>
          </span>
          <MoreHorizontal size={16} className="text-white/45" />
        </div>
      </aside>

      {open && (
        <button
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          aria-label="Close navigation overlay"
        />
      )}
    </>
  );
}

function Header({ onMenu }: { onMenu: () => void }) {
  const path = usePathname();
  const crumb = CRUMBS[path] ?? 'Overview';

  return (
    <header className="sticky top-0 z-30 flex h-[74px] items-center border-b border-border bg-white/95 px-4 backdrop-blur md:px-7">
      <button
        onClick={onMenu}
        className="mr-3 grid size-10 place-items-center border border-border lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={19} />
      </button>
      <div className="hidden items-center gap-2 text-xs text-sub sm:flex">
        <span>Marketplace ops</span>
        <ChevronRight size={13} />
        <span className="font-semibold text-ink">{crumb}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          className="relative grid size-10 place-items-center border border-border transition hover:bg-secondary"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="absolute mb-5 ml-5 size-2 border border-white bg-coral" />
        </button>
        <button className="hidden h-10 items-center gap-2 border border-border px-3 text-xs font-semibold transition hover:bg-secondary md:flex">
          <CircleHelp size={15} /> Help center
        </button>
      </div>
    </header>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        <div className="font-display text-3xl">SIPDASH</div>
      </div>
    );
  }

  if (!account) return <Auth />;

  if (account.role !== 'admin') {
    return (
      <div className="grid min-h-screen place-items-center bg-bg p-5 font-sans text-ink">
        <NavCapture />
        <div className="max-w-sm text-center">
          <h1 className="font-display text-2xl font-bold">Not authorized</h1>
          <p className="mt-3 text-sm text-sub">
            This account is registered as a {account.role}. Operator access must be granted from the
            Supabase dashboard — see supabase/README.md.
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

  return (
    <div className="min-h-screen bg-bg font-sans text-ink selection:bg-lime">
      <NavCapture />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[236px]">
        <Header onMenu={() => setSidebarOpen(true)} />
        {mounted ? (
          children
        ) : (
          <div className="grid min-h-[60vh] place-items-center font-display text-3xl">SIPDASH</div>
        )}
      </div>
    </div>
  );
}
