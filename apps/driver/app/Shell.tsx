'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { initSession, signOut, startEngine, stopEngine, useApp, money } from '@sipdash/core';
import { NavCapture } from '../src/nav';
import Auth from './Auth';
import { Bike, Clock3, Menu, Power, ShieldCheck, UserRound, Wallet, X } from 'lucide-react';
import { cn } from '../src/design';

const NAV = [
  { href: '/', label: 'Dash', icon: Power },
  { href: '/earnings', label: 'Earnings', icon: Wallet },
  { href: '/activity', label: 'Activity', icon: Clock3 },
  { href: '/account', label: 'Account', icon: UserRound },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const path = usePathname();
  const online = useApp((s) => s.driverOnline);
  const earnings = useApp((s) => s.driverEarnings);

  return (
    <>
      <div className="bg-gold px-5 py-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
        Drive safe. Check every ID. Never hand off to a minor.
      </div>
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-4 px-5 md:px-8">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-full border border-ink/15 bg-white transition hover:bg-ink hover:text-cream lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <Link href="/" className="mr-2 flex items-center gap-2" aria-label="SipDash Drive home">
            <span className="grid size-9 -rotate-3 place-items-center bg-ink font-display text-lg text-gold">S</span>
            <span className="font-display text-[25px] uppercase tracking-tight text-ink">
              SipDash<span className="text-grape">&nbsp;Drive</span>
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((it) => {
              const active = it.href === '/' ? path === '/' : path.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-bold transition',
                    active ? 'bg-ink text-gold' : 'text-ink/60 hover:bg-ink/5 hover:text-ink',
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-bold text-ink md:flex">
              <Bike size={16} className="text-grape" />
              {money(earnings)} today
            </span>
            <span
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider',
                online ? 'bg-mint/25 text-emerald-700' : 'bg-ink/5 text-ink/50',
              )}
            >
              <span className={cn('size-2 rounded-full', online ? 'animate-pulse bg-emerald-500' : 'bg-ink/30')} />
              {online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-ink/10 bg-white p-5 lg:hidden">
            <div className="flex gap-5 text-sm font-bold text-ink">
              {NAV.map((it) => (
                <Link key={it.href} href={it.href} onClick={() => setMenuOpen(false)}>
                  {it.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-white px-5 py-10 md:px-8">
      <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-6 md:flex-row md:items-center">
        <span className="font-display text-2xl uppercase text-ink">
          SipDash<span className="text-grape">&nbsp;Drive</span>
        </span>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-ink/70">
          <a href="#">Driver help</a>
          <a href="#">Earnings</a>
          <a href="#">Safety</a>
          <a href="#">Terms</a>
        </div>
        <p className="text-xs text-mist">© 2025 SipDash. Verify ID on every alcohol drop-off.</p>
      </div>
    </footer>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const path = usePathname();
  const account = useApp((s) => s.account);
  const authReady = useApp((s) => s.authReady);
  const bare = path === '/'; // Dash renders its own full-screen experience

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
      <div className="grid min-h-dvh place-items-center bg-cream font-sans text-ink">
        <NavCapture />
        <div className="font-display text-5xl uppercase">Drive</div>
      </div>
    );
  }

  if (!account) return <Auth />;

  if (account.role !== 'driver') {
    return (
      <div className="grid min-h-dvh place-items-center bg-cream p-5 font-sans text-ink">
        <NavCapture />
        <div className="max-w-sm text-center">
          <h1 className="font-display text-3xl uppercase">Wrong app</h1>
          <p className="mt-3 text-sm text-mist">
            This account is registered as a {account.role}. Sign in with a courier account to dash.
          </p>
          <button
            onClick={() => void signOut()}
            className="mt-6 h-12 w-full rounded-2xl bg-ink font-bold text-white transition hover:bg-grape"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (account.verified === false) {
    return (
      <div className="grid min-h-dvh place-items-center bg-cream p-5 font-sans text-ink">
        <NavCapture />
        <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-white p-8 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-gold/30">
            <ShieldCheck size={30} className="text-ink" />
          </span>
          <h1 className="mt-6 font-display text-3xl uppercase text-ink">Application under review</h1>
          <p className="mt-3 text-sm leading-6 text-mist">
            Hey {account.name.split(' ')[0]} — our ops team is verifying your courier application
            ({account.vehicle} · {account.plate}). This page unlocks automatically once you&apos;re approved.
          </p>
          <button
            onClick={() => void signOut()}
            className="mt-8 h-12 w-full rounded-2xl border border-ink/15 font-bold text-ink transition hover:bg-stone"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (bare) {
    return (
      <div className="min-h-dvh bg-white font-sans text-ink">
        <NavCapture />
        {mounted ? children : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream font-sans text-ink">
      <NavCapture />
      <Header />
      {mounted ? (
        children
      ) : (
        <div className="grid min-h-[60vh] place-items-center font-display text-5xl uppercase">Drive</div>
      )}
      <Footer />
    </div>
  );
}
