'use client';
import { useEffect, useState } from 'react';
import { initSession, signOut, startEngine, stopEngine, useApp } from '@sipdash/core';
import { NavCapture } from '../src/nav';
import { ChevronDown, MapPin, Menu, Receipt, Search, ShieldCheck, ShoppingBag, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const cartCount = useApp((s) => s.cart.reduce((sum, c) => sum + c.qty, 0));
  const address = useApp((s) => s.account?.address ?? '');
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search');
  };

  return (
    <>
      <div className="bg-ink px-5 py-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white">
        You must be 21+ to order. Valid ID required at delivery.
      </div>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-cream/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-4 px-5 md:px-8">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-full border border-black/10 bg-white transition hover:bg-black hover:text-white lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <Link href="/" className="mr-1 flex items-center gap-2" aria-label="SipDash home">
            <span className="grid size-9 rotate-3 place-items-center bg-grape font-display text-lg text-white">S</span>
            <span className="font-display text-[25px] uppercase tracking-tight">SipDash</span>
          </Link>

          <button className="hidden h-11 items-center gap-2 border-l border-black/10 pl-5 text-sm font-bold md:flex">
            <MapPin size={17} className="text-grape" />
            {address.split(',')[0] || 'Set address'}
            <ChevronDown size={15} />
          </button>

          <form onSubmit={submit} className="relative ml-auto hidden max-w-xl flex-1 md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={19} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 w-full rounded-full border-0 bg-stone pl-12 pr-5 text-sm outline-none ring-grape transition focus:ring-2"
              placeholder="Search wine, beer, spirits..."
            />
          </form>

          <Link
            href="/orders"
            className="hidden h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition hover:bg-stone sm:flex"
          >
            <Receipt size={18} />
            Orders
          </Link>
          <Link
            href="/account"
            className="hidden h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition hover:bg-stone sm:flex"
          >
            <UserRound size={18} />
            Account
          </Link>
          <Link
            href="/cart"
            className="relative flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-grape"
          >
            <ShoppingBag size={18} />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-gold text-[11px] text-black">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
        {menuOpen && (
          <div className="border-t border-black/10 bg-white p-5 lg:hidden">
            <form onSubmit={submit} className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={19} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 w-full rounded-full border-0 bg-stone pl-12 pr-5 text-sm outline-none ring-grape focus:ring-2"
                placeholder="Search wine, beer, spirits..."
              />
            </form>
            <button className="mb-4 flex items-center gap-2 text-sm font-bold">
              <MapPin size={17} className="text-grape" /> Deliver to {address.split(',')[0] || 'Set address'}
            </button>
            <div className="flex gap-5 text-sm font-bold">
              <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link href="/search" onClick={() => setMenuOpen(false)}>Search</Link>
              <Link href="/orders" onClick={() => setMenuOpen(false)}>Orders</Link>
              <Link href="/account" onClick={() => setMenuOpen(false)}>Account</Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

function AgeGate() {
  const ageVerified = useApp((s) => s.ageVerified);
  const verifyAge = useApp((s) => s.verifyAge);
  if (ageVerified) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-5 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md bg-cream p-8 shadow-[10px_10px_0_#ffd45c] md:p-10"
      >
        <span className="mb-7 grid size-20 place-items-center rounded-full border-2 border-ink font-display text-3xl">
          21+
        </span>
        <h2 className="font-display text-4xl uppercase leading-[0.95] tracking-tight md:text-5xl">
          Hold up. Are you 21 or over?
        </h2>
        <p className="mt-4 text-sm leading-6 text-mist">
          You need to be of legal drinking age to browse SipDash. A courier will verify your government-issued ID at
          delivery.
        </p>
        <button
          onClick={verifyAge}
          className="mt-8 flex h-14 w-full items-center justify-center gap-3 bg-grape font-bold text-white transition hover:bg-ink"
        >
          <ShieldCheck size={19} /> I am 21 or older
        </button>
        <a
          href="https://www.responsibility.org"
          className="mt-3 flex h-12 w-full items-center justify-center border border-ink/15 bg-white text-sm font-bold transition hover:border-ink"
        >
          I am under 21
        </a>
      </motion.div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-black/10 bg-cream px-5 py-10 md:px-8">
      <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-6 md:flex-row md:items-center">
        <span className="font-display text-2xl uppercase">SipDash</span>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold">
          <a href="#">About</a>
          <a href="#">Help</a>
          <a href="#">Partner with us</a>
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
        </div>
        <p className="text-xs text-mist">© 2025 SipDash. Please enjoy responsibly.</p>
      </div>
    </footer>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const account = useApp((s) => s.account);

  useEffect(() => {
    setMounted(true);
    startEngine(); // guests can browse the catalog too
    void initSession();
    return () => stopEngine();
  }, []);

  if (!mounted) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream font-sans text-ink">
        <NavCapture />
        <div className="font-display text-5xl uppercase">SipDash</div>
      </div>
    );
  }

  if (account && account.role !== 'customer') {
    return (
      <div className="grid min-h-screen place-items-center bg-cream p-5 font-sans text-ink">
        <NavCapture />
        <div className="max-w-sm text-center">
          <h1 className="font-display text-3xl uppercase">Wrong app</h1>
          <p className="mt-3 text-sm text-mist">
            This account is registered as a {account.role}. Sign in with a customer account to order.
          </p>
          <button
            onClick={() => void signOut()}
            className="mt-6 h-12 w-full bg-ink font-bold text-white transition hover:bg-grape"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream font-sans text-ink">
      <NavCapture />
      <Header />
      {children}
      <Footer />
      <AgeGate />
    </div>
  );
}
