export const money = (n: number) =>
  `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ---------- SAST helpers (South Africa = the market; pin, don't trust client TZ) ---------- */
const SAST = 'Africa/Johannesburg';

/** Calendar day key in SAST, e.g. '2026-11-13' — used for "today" bucketing. */
export const dayKeySAST = (ts: number) =>
  new Date(ts).toLocaleDateString('en-CA', { timeZone: SAST });

export const isTodaySAST = (ts: number) => dayKeySAST(ts) === dayKeySAST(Date.now());

export const hourSAST = (ts: number) =>
  Number(
    new Date(ts).toLocaleString('en-US', { timeZone: SAST, hour: 'numeric', hour12: false }),
  );

export const dowSAST = (ts: number) =>
  new Date(ts).toLocaleDateString('en-US', { timeZone: SAST, weekday: 'short' });

export const km = (n: number) => `${n.toFixed(1)} km`;

export const timeAgo = (ts: number) => {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const clock = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const etaRange = (min: number, max: number) => `${min}–${max} min`;

export const uid = (prefix = '') =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`.toUpperCase();

export const orderNo = (id: string) => `#${id.slice(-5).toUpperCase()}`;

export const STATUS_LABEL: Record<string, string> = {
  placed: 'Order placed',
  accepted: 'Store accepted',
  preparing: 'Preparing order',
  ready: 'Ready for pickup',
  driver_assigned: 'Driver assigned',
  picked_up: 'Picked up',
  en_route: 'On the way',
  delivered: 'Delivered',
  rejected: 'Rejected by store',
  cancelled: 'Cancelled',
};

export const STATUS_COLOR: Record<string, string> = {
  placed: '#276EF1',
  accepted: '#276EF1',
  preparing: '#F5A623',
  ready: '#F5A623',
  driver_assigned: '#735BF2',
  picked_up: '#735BF2',
  en_route: '#06C167',
  delivered: '#06C167',
  rejected: '#E23744',
  cancelled: '#6E6E6E',
};

export const rand = (min: number, max: number) => min + Math.random() * (max - min);
export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
export const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
