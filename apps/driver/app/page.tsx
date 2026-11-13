'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronUp,
  Clock3,
  List,
  Menu,
  Package,
  Power,
  ShieldCheck,
  Square,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useApp, distKm, isLive, km, money } from '@sipdash/core';
import { cn } from '../src/design';
import {
  LatLng,
  OsrmRoute,
  SURGE_ZONES,
  fetchRoute,
  formatDist,
  formatEta,
  gridToLatLng,
  latLngToGrid,
} from '../src/lib/mock';
import BottomSheet from '../src/components/BottomSheet';
import RequestSheet from '../src/components/RequestSheet';
import NavigationBar from '../src/components/NavigationBar';

const LiveMap = dynamic(() => import('../src/components/LiveMap'), {
  ssr: false,
  loading: () => <div className="grid h-full w-full place-items-center bg-sand text-mist">Loading map…</div>,
});

const NAV_LINKS = [
  { href: '/', label: 'Dash' },
  { href: '/earnings', label: 'Earnings' },
  { href: '/activity', label: 'Activity' },
  { href: '/account', label: 'Account' },
];

export default function DriverDash() {
  const online = useApp((s) => s.driverOnline);
  const setOnline = useApp((s) => s.setDriverOnline);
  const driverPos = useApp((s) => s.driverPos);
  const activeDelivery = useApp((s) => s.activeDelivery);
  const deliveryStage = useApp((s) => s.deliveryStage);
  const incoming = useApp((s) => s.incomingRequest);
  const earnings = useApp((s) => s.driverEarnings);
  const trips = useApp((s) => s.trips);
  const surge = useApp((s) => s.surge);
  const initials = useApp((s) =>
    (s.account?.name ?? '?')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  );
  const acceptRequest = useApp((s) => s.acceptRequest);
  const declineRequest = useApp((s) => s.declineRequest);
  const setDeliveryStage = useApp((s) => s.setDeliveryStage);
  const confirmPickup = useApp((s) => s.confirmPickup);
  const completeDelivery = useApp((s) => s.completeDelivery);

  const [expanded, setExpanded] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const courierRef = useRef<LatLng>(gridToLatLng(driverPos));
  const setDriverGeoPos = useApp((s) => s.setDriverGeoPos);
  const handleCourierPos = (p: LatLng) => {
    courierRef.current = p;
    if (isLive()) setDriverGeoPos(p); // real GPS → lat/lng on the order + driver rows
  };

  /* OSRM route — fetched once per delivery, never on GPS ticks */
  const [route, setRoute] = useState<OsrmRoute | null>(null);
  useEffect(() => {
    if (!activeDelivery) {
      setRoute(null);
      return;
    }
    let alive = true;
    fetchRoute([
      courierRef.current,
      activeDelivery.storeLatLng ?? gridToLatLng(activeDelivery.storePos),
      activeDelivery.customerLatLng ?? gridToLatLng(activeDelivery.customerPos),
    ]).then((r) => {
      if (alive) setRoute(r);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDelivery?.id]);

  const leg: 'to_pickup' | 'to_dropoff' =
    deliveryStage === 'to_store' || deliveryStage === 'at_store' ? 'to_pickup' : 'to_dropoff';
  const activeLeg = route?.legs[leg === 'to_pickup' ? 0 : 1];
  const etaText = activeLeg
    ? `${formatEta(activeLeg.durationS)} · ${formatDist(activeLeg.distanceM)}`
    : activeDelivery
      ? km(distKm(activeDelivery.storePos, activeDelivery.customerPos))
      : '—';

  const deliveryRoute = useMemo(
    () =>
      activeDelivery
        ? {
            pickup: activeDelivery.storeLatLng ?? gridToLatLng(activeDelivery.storePos),
            dropoff: activeDelivery.customerLatLng ?? gridToLatLng(activeDelivery.customerPos),
            leg,
          }
        : null,
    [activeDelivery, leg],
  );

  // live mode: real GPS drives the marker; mock mode: the simulator moves driverPos
  const courierOverride = activeDelivery && !isLive() ? gridToLatLng(driverPos) : undefined;

  const onStageAction = async (
    stage: NonNullable<typeof deliveryStage>,
    code?: string,
  ): Promise<boolean> => {
    if (stage === 'to_store') {
      setDeliveryStage('at_store');
      return true;
    }
    if (stage === 'at_store') return confirmPickup(code);
    if (stage === 'to_customer') {
      setDeliveryStage('at_customer');
      return true;
    }
    if (stage === 'at_customer') return completeDelivery(code);
    return false;
  };

  const mode: 'idle' | 'request' | 'nav' = incoming && !activeDelivery ? 'request' : activeDelivery && deliveryStage ? 'nav' : 'idle';

  /* overlay above the sheet: GO/Stop button (idle) or ETA chip (nav) */
  const overlay =
    mode === 'nav' ? (
      <span className="pointer-events-auto mb-3 flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white shadow-[0_6px_20px_rgba(0,0,0,0.3)]">
        <Clock3 size={13} className="text-gold" />
        <span className="tabular">{etaText}</span>
      </span>
    ) : mode === 'idle' && !expanded ? (
      online ? (
        <button
          onClick={() => setOnline(false)}
          aria-label="Stop and go offline"
          className="pointer-events-auto mb-4 grid size-12 place-items-center rounded-full bg-ink text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <Square size={15} fill="currentColor" />
        </button>
      ) : (
        <button
          onClick={() => setOnline(true)}
          aria-label="Go online"
          className="go-glow pointer-events-auto mb-4 grid size-[72px] place-items-center rounded-full bg-gold font-display text-xl uppercase text-ink transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white"
        >
          GO
        </button>
      )
    ) : null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-stone">
      {/* full-viewport driver surface */}
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-white">
        {/* slim safety banner */}
        <div className="z-[680] bg-gold py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
          Check every ID. Never hand off to a minor.
        </div>

        {/* map area */}
        <div className="relative flex-1">
          <div className="absolute inset-0">
            <LiveMap
              className="h-full w-full"
              courierOverride={courierOverride}
              surgeZones={online ? SURGE_ZONES : []}
              delivery={online ? deliveryRoute : null}
              route={route}
              dimmed={!online}
              onCourierPos={handleCourierPos}
            />
          </div>

          {/* floating top bar */}
          <div className="absolute inset-x-3 top-3 z-[660] flex items-center justify-between sm:inset-x-5 sm:top-5 lg:inset-x-8">
            <div className="relative">
              <button
                onClick={() => setNavOpen(!navOpen)}
                aria-label="Open menu"
                aria-expanded={navOpen}
                className="grid size-11 place-items-center rounded-full bg-white text-ink shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition hover:bg-stone focus:outline-none focus:ring-2 focus:ring-grape"
              >
                {navOpen ? <X size={19} /> : <Menu size={19} />}
              </button>
              {navOpen && (
                <>
                  <button
                    aria-label="Close menu"
                    className="fixed inset-0 z-[665] cursor-default"
                    onClick={() => setNavOpen(false)}
                  />
                  <div className="absolute left-0 top-13 z-[670] w-44 overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
                    {NAV_LINKS.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setNavOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-ink transition hover:bg-stone"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* earnings pill */}
            <Link
              href="/earnings"
              aria-label={`Today's earnings ${money(earnings)}`}
              className="flex flex-col items-center rounded-full bg-ink px-5 py-1.5 text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition hover:bg-ink3 focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <span className="tabular text-sm font-bold">{money(earnings)}</span>
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/60">Today</span>
            </Link>

            {/* avatar */}
            <Link
              href="/account"
              aria-label="Account"
              className="grid size-11 place-items-center rounded-full bg-white font-bold text-ink shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition hover:bg-stone focus:outline-none focus:ring-2 focus:ring-grape"
            >
              <span className="grid size-8 place-items-center rounded-full bg-ink text-[11px] font-bold text-gold">
                {initials}
              </span>
            </Link>
          </div>

          {/* bottom sheet */}
          <BottomSheet overlay={overlay}>
            {mode === 'request' && incoming && (
              <RequestSheet req={incoming} onAccept={acceptRequest} onDecline={declineRequest} />
            )}

            {mode === 'nav' && activeDelivery && deliveryStage && (
              <NavigationBar
                stage={deliveryStage}
                orderId={activeDelivery.id}
                storeName={activeDelivery.storeName}
                tip={activeDelivery.tip}
                etaText={etaText}
                onStageAction={onStageAction}
              />
            )}

            {mode === 'idle' && (
              <div>
                {/* collapsed row */}
                <div className="flex items-center gap-3 px-5 pb-3 pt-2">
                  <button
                    onClick={() => setExpanded(!expanded)}
                    aria-expanded={expanded}
                    className="flex flex-1 items-center gap-3 text-left focus:outline-none"
                  >
                    <span
                      className={cn('size-2.5 rounded-full', online ? 'animate-pulse bg-mint' : 'bg-ink/30')}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-sm font-bold text-ink">
                      {online ? "You're online · Finding trips…" : "You're offline"}
                    </span>
                    <ChevronUp
                      size={18}
                      className={cn('text-ink/50 transition-transform duration-200', expanded && 'rotate-180')}
                    />
                  </button>
                  <Link
                    href="/activity"
                    aria-label="Trip history"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-stone text-ink transition hover:bg-sand focus:outline-none focus:ring-2 focus:ring-grape"
                  >
                    <List size={16} />
                  </Link>
                </div>

                {/* expanded content */}
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      key="sheet-expanded"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 px-5 pb-6 pt-1">
                        {/* stats */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-2xl bg-stone p-4 text-center">
                            <p className="tabular font-display text-2xl text-ink">{trips.length}</p>
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-mist">Trips</p>
                          </div>
                          <div className="rounded-2xl bg-stone p-4 text-center">
                            <p className={cn('tabular font-display text-2xl', surge > 1 ? 'text-grape' : 'text-ink')}>
                              {surge.toFixed(1)}x
                            </p>
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-mist">Surge</p>
                          </div>
                        </div>

                        {/* shift intel */}
                        <div className="rounded-2xl border border-ink/10 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-grape">Shift intel</p>
                          <ul className="mt-3 space-y-2.5 text-[13px] leading-5 text-ink/80">
                            <li className="flex gap-2.5">
                              <Zap size={14} className="mt-0.5 shrink-0 text-gold" />
                              Downtown 1.5x surge until 9pm — stage near Cork &amp; Barrel.
                            </li>
                            <li className="flex gap-2.5">
                              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-grape" />
                              ID check on every alcohol drop-off. No ID, no handoff.
                            </li>
                            <li className="flex gap-2.5">
                              <Package size={14} className="mt-0.5 shrink-0 text-grape" />
                              Keep the insulated bag — stores may refuse handoff.
                            </li>
                          </ul>
                        </div>

                        {/* quick links */}
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href="/earnings"
                            className="flex items-center justify-center gap-2 rounded-full bg-ink py-3 text-xs font-bold text-white transition hover:bg-ink3 focus:outline-none focus:ring-2 focus:ring-gold"
                          >
                            <Wallet size={14} /> Earnings
                          </Link>
                          <button
                            onClick={() => setOnline(!online)}
                            className={cn(
                              'flex items-center justify-center gap-2 rounded-full py-3 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-ink',
                              online ? 'bg-stone text-ink hover:bg-sand' : 'bg-gold text-ink hover:-translate-y-0.5',
                            )}
                          >
                            <Power size={14} /> {online ? 'Go offline' : 'Go online'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </BottomSheet>
        </div>
      </div>
    </main>
  );
}
