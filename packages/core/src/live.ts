import { isLive, supabase } from './supabase';
import { useApp } from './store';
import { Account, Customer, Driver, Order, OrderStatus, Promo, Store, Trip } from './types';
import { LatLng, haversineKm, gridToLatLng, latLngToGrid } from './geo';
import { uid } from './format';

const ll = (lat: any, lng: any): LatLng | undefined =>
  lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : undefined;

/* ---------- row <-> entity mapping ---------- */

const toStore = (r: any): Store => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  categories: r.categories ?? [],
  rating: Number(r.rating),
  ratingCount: r.rating_count,
  deliveryTimeMin: r.delivery_time_min,
  deliveryTimeMax: r.delivery_time_max,
  deliveryFee: Number(r.delivery_fee),
  minOrder: Number(r.min_order),
  distanceKm: Number(r.distance_km),
  address: r.address,
  phone: r.phone ?? '',
  open: r.open,
  paused: r.paused ?? false,
  pausedUntil: r.paused_until ? Date.parse(r.paused_until) : undefined,
  openHours: r.open_hours ?? undefined,
  prepTimeMin: r.prep_time_min ?? 15,
  approved: r.approved,
  featured: r.featured,
  promo: r.promo ?? undefined,
  pos: { x: r.pos_x, y: r.pos_y },
  latLng: ll(r.lat, r.lng),
  busyLevel: r.busy_level as 0 | 1 | 2,
});

const toProduct = (r: any) => ({
  id: r.id,
  storeId: r.store_id,
  name: r.name,
  brand: r.brand,
  category: r.category,
  size: r.size,
  abv: r.abv ?? undefined,
  price: Number(r.price),
  image: r.image,
  description: r.description,
  tags: r.tags ?? [],
  available: r.available,
  popular: r.popular ?? false,
});

const toDriver = (r: any): Driver => ({
  id: r.id,
  name: r.name,
  vehicle: r.vehicle,
  plate: r.plate,
  phone: r.phone || undefined,
  rating: Number(r.rating),
  trips: r.trips,
  online: r.online,
  verified: r.verified,
  pos: { x: r.pos_x, y: r.pos_y },
  latLng: ll(r.lat, r.lng),
  avatarColor: r.avatar_color,
});

const toCustomer = (r: any): Customer => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  ageVerified: r.age_verified,
  latLng: ll(r.lat, r.lng),
  orders: r.orders_count,
  spent: Number(r.spent),
  joined: r.joined,
  status: r.status,
});

const toPromo = (r: any): Promo => ({
  code: r.code,
  description: r.description,
  type: r.type,
  value: Number(r.value),
  minSubtotal: Number(r.min_subtotal),
  active: r.active,
  uses: r.uses,
});

export const toOrder = (r: any): Order => ({
  id: r.id,
  customerId: r.customer_id,
  customerName: r.customer_name,
  customerAddress: r.customer_address,
  customerPos: { x: r.customer_pos_x, y: r.customer_pos_y },
  customerLatLng: ll(r.customer_lat, r.customer_lng),
  storeId: r.store_id,
  storeName: r.store_name,
  storePos: { x: r.store_pos_x, y: r.store_pos_y },
  storeLatLng: ll(r.store_lat, r.store_lng),
  driverId: r.driver_id ?? undefined,
  driverName: r.driver_name ?? undefined,
  items: r.items ?? [],
  subtotal: Number(r.subtotal),
  deliveryFee: Number(r.delivery_fee),
  serviceFee: Number(r.service_fee),
  surgeFee: Number(r.surge_fee),
  discount: Number(r.discount),
  tip: Number(r.tip),
  total: Number(r.total),
  promoCode: r.promo_code ?? undefined,
  status: r.status,
  placedAt: Number(r.placed_at),
  etaMinutes: r.eta_minutes,
  timeline: r.timeline ?? [],
  driverPos: r.driver_pos_x != null ? { x: r.driver_pos_x, y: r.driver_pos_y } : undefined,
  driverLatLng: ll(r.driver_lat, r.driver_lng),
  driverProgress: r.driver_progress ?? undefined,
  rating: r.rating ?? undefined,
  cancelReason: r.cancel_reason ?? undefined,
  flagged: r.flagged ?? false,
  flagReason: r.flag_reason ?? undefined,
  instructions: r.instructions || undefined,
  isLive: r.is_live,
});

const toTrip = (r: any): Trip => ({
  id: r.id,
  orderId: r.order_id,
  storeName: r.store_name,
  customerAddress: r.customer_address,
  distanceKm: Number(r.distance_km),
  payout: Number(r.payout),
  tip: Number(r.tip),
  at: Number(r.at),
  rating: r.rating ?? undefined,
});

export const orderToRow = (o: Order) => ({
  id: o.id,
  customer_id: o.customerId,
  customer_name: o.customerName,
  customer_address: o.customerAddress,
  customer_pos_x: o.customerPos.x,
  customer_pos_y: o.customerPos.y,
  customer_lat: o.customerLatLng?.lat ?? null,
  customer_lng: o.customerLatLng?.lng ?? null,
  store_id: o.storeId,
  store_name: o.storeName,
  store_pos_x: o.storePos.x,
  store_pos_y: o.storePos.y,
  store_lat: o.storeLatLng?.lat ?? null,
  store_lng: o.storeLatLng?.lng ?? null,
  driver_id: o.driverId ?? null,
  driver_name: o.driverName ?? null,
  items: o.items,
  subtotal: o.subtotal,
  delivery_fee: o.deliveryFee,
  service_fee: o.serviceFee,
  surge_fee: o.surgeFee,
  discount: o.discount,
  tip: o.tip,
  total: o.total,
  promo_code: o.promoCode ?? null,
  status: o.status,
  placed_at: o.placedAt,
  eta_minutes: o.etaMinutes,
  timeline: o.timeline,
  driver_pos_x: o.driverPos?.x ?? null,
  driver_pos_y: o.driverPos?.y ?? null,
  driver_progress: o.driverProgress ?? null,
  rating: o.rating ?? null,
  instructions: o.instructions ?? '',
  is_live: o.isLive ?? true,
});

const upsert = <T extends { id: string }>(list: T[], row: T): T[] => {
  const i = list.findIndex((x) => x.id === row.id);
  if (i === -1) return [row, ...list];
  const next = [...list];
  next[i] = row;
  return next;
};

const splitOrders = (rows: Order[]) => {
  const uid_ = useApp.getState().account?.userId;
  const mine = rows.filter((o) => o.customerId === uid_).sort((a, b) => b.placedAt - a.placedAt);
  const store = rows.filter((o) => o.storeId === uid_).sort((a, b) => b.placedAt - a.placedAt);
  return { mine, store, all: rows };
};

/* ---------- hydration ---------- */

export async function hydrate() {
  const sb = supabase();
  // guests (signed-out browsers) only need the public catalog — private tables
  // would just come back empty via RLS, and any error there must not blank the storefront
  const {
    data: { session },
  } = await sb.auth.getSession();
  let results;
  try {
    results = await Promise.all([
      sb.from('stores').select('*'),
      sb.from('products').select('*'),
      sb.from('promos').select('*'),
      sb.from('settings').select('*'),
      ...(session
        ? [
            sb.from('drivers').select('*'),
            sb.from('customers').select('*'),
            sb.from('orders').select('*').order('placed_at', { ascending: false }).limit(200),
            sb.from('trips').select('*').order('at', { ascending: false }).limit(100),
          ]
        : []),
    ]);
  } catch (e) {
    console.warn('[sipdash] hydrate failed:', e);
    return false;
  }
  const [
    stores,
    products,
    promos,
    settings,
    drivers = { data: [], error: null },
    customers = { data: [], error: null },
    orders = { data: [], error: null },
    trips = { data: [], error: null },
  ] = results;
  const err = [stores, products, drivers, customers, promos, orders, trips, settings].find((r) => r.error);
  if (err?.error) {
    console.warn('[sipdash] hydrate failed:', err.error.message);
    return false;
  }
  const account = useApp.getState().account;
  const allOrders = (orders.data ?? []).map(toOrder);
  const { mine, store, all } = splitOrders(allOrders);
  const cfg = Object.fromEntries((settings.data ?? []).map((r: any) => [r.key, r.value]));
  const storeRows = (stores.data ?? []).map(toStore);
  const driverRows = (drivers.data ?? []).map(toDriver);
  const customerRows = (customers.data ?? []).map(toCustomer);
  const tripRows = (trips.data ?? []).map(toTrip);
  const myStoreRow = account ? storeRows.find((s) => s.id === account.userId) : undefined;
  const myDriverRow = account ? driverRows.find((d) => d.id === account.userId) : undefined;
  const myCustomerRow = account ? customerRows.find((c) => c.id === account.userId) : undefined;
  // RLS scopes trips to the signed-in driver (or all for admin)
  const myTrips = account?.role === 'driver' ? tripRows : [];
  // restore an in-flight delivery so a reload doesn't strand the driver with a
  // server-side active order the UI forgot about (claims would hit 'busy')
  const myActive =
    account?.role === 'driver'
      ? all.find(
          (o) =>
            o.driverId === account.userId &&
            ['driver_assigned', 'picked_up', 'en_route'].includes(o.status),
        )
      : undefined;
  useApp.setState({
    stores: storeRows,
    products: (products.data ?? []).map(toProduct),
    adminDrivers: driverRows,
    adminCustomers: customerRows,
    promos: (promos.data ?? []).map(toPromo),
    orders: mine,
    storeOrders: store,
    allOrders: all,
    trips: tripRows,
    driverEarnings: myTrips.reduce((sum, t) => sum + t.payout + t.tip, 0),
    surge: Number(cfg.surge ?? 1),
    platformFeePct: Number(cfg.platform_fee_pct ?? 22),
    acceptTimeoutSec: Number(cfg.accept_timeout_sec ?? 90),
    storeOpen: myStoreRow?.open ?? false,
    storePaused: myStoreRow?.paused ?? false,
    storePausedUntil: myStoreRow?.pausedUntil,
    prepTimeMin: myStoreRow?.prepTimeMin ?? 15,
    driverOnline: myDriverRow?.online ?? false,
    activeDelivery: myActive ?? null,
    // status only encodes the two legs; mid-point stages (at_store/at_customer)
    // are local UI state and reset to the start of the leg on rehydrate
    deliveryStage: myActive
      ? myActive.status === 'driver_assigned'
        ? 'to_store'
        : 'to_customer'
      : null,
    ageVerified: myCustomerRow?.ageVerified ?? false,
    hydrated: true,
  });
  return true;
}

/** Map a partial Order patch to DB columns (only known fields) */
export const orderPatchToRow = (p: Partial<Order>): Record<string, unknown> => {
  const r: Record<string, unknown> = {};
  if (p.status !== undefined) r.status = p.status;
  if (p.timeline !== undefined) r.timeline = p.timeline;
  if (p.driverId !== undefined) r.driver_id = p.driverId;
  if (p.driverName !== undefined) r.driver_name = p.driverName;
  if (p.driverPos !== undefined) {
    r.driver_pos_x = p.driverPos?.x ?? null;
    r.driver_pos_y = p.driverPos?.y ?? null;
  }
  if (p.driverProgress !== undefined) r.driver_progress = p.driverProgress;
  if (p.rating !== undefined) r.rating = p.rating;
  if (p.isLive !== undefined) r.is_live = p.isLive;
  if (p.total !== undefined) r.total = p.total;
  return r;
};

/* ---------- mutations (fire-and-forget) ---------- */

const posWriteAt = new Map<string, number>();

export const db = {
  insertOrder: (o: Order) => void supabase().from('orders').insert(orderToRow(o)).then(() => {}),
  patchOrderRow: (id: string, rowPatch: Record<string, unknown>) =>
    supabase().from('orders').update(rowPatch).eq('id', id),
  claimOrder: (orderId: string) => supabase().rpc('claim_order', { p_order_id: orderId }),
  orderContacts: (orderId: string) => supabase().rpc('order_contacts', { p_order_id: orderId }),
  orderCode: (orderId: string) => supabase().rpc('order_code', { p_order_id: orderId }),
  verifyOrderCode: (orderId: string, code: string, step: 'pickup' | 'dropoff') =>
    supabase().rpc('verify_order_code', { p_order_id: orderId, p_code: code, p_step: step }),
  setProductAvailable: (id: string, available: boolean) =>
    void supabase().from('products').update({ available }).eq('id', id).then(() => {}),
  insertProduct: (p: import('./types').Product) =>
    void supabase()
      .from('products')
      .insert({
        id: p.id,
        store_id: p.storeId,
        name: p.name,
        brand: p.brand,
        category: p.category,
        size: p.size,
        abv: p.abv ?? null,
        price: p.price,
        image: p.image,
        description: p.description,
        tags: p.tags,
        available: p.available,
        popular: p.popular ?? false,
      })
      .then(() => {}),
  updateStore: (id: string, patch: Record<string, unknown>) =>
    void supabase().from('stores').update(patch).eq('id', id).then(() => {}),
  setDriverVerified: (id: string, verified: boolean) =>
    void supabase().from('drivers').update({ verified }).eq('id', id).then(() => {}),
  setDriverOnline: (id: string, online: boolean) =>
    void supabase().from('drivers').update({ online }).eq('id', id).then(() => {}),
  setAgeVerified: (id: string) =>
    void supabase().from('customers').update({ age_verified: true }).eq('id', id).then(() => {}),
  setCustomerStatus: (id: string, status: string) =>
    void supabase().from('customers').update({ status }).eq('id', id).then(() => {}),
  setPromoActive: (code: string, active: boolean) =>
    void supabase().from('promos').update({ active }).eq('code', code).then(() => {}),
  setSetting: (key: string, value: unknown) =>
    void supabase().from('settings').upsert({ key, value }).then(() => {}),
  /** Courier GPS → order row, throttled so watchPosition doesn't spam writes.
   *  Writes real lat/lng plus the derived grid coords (legacy readers). */
  updateDriverPos: (orderId: string, geo: LatLng) => {
    const last = posWriteAt.get(orderId) ?? 0;
    if (Date.now() - last < 2000) return;
    posWriteAt.set(orderId, Date.now());
    const grid = latLngToGrid(geo);
    void supabase()
      .from('orders')
      .update({
        driver_lat: geo.lat,
        driver_lng: geo.lng,
        driver_pos_x: grid.x,
        driver_pos_y: grid.y,
      })
      .eq('id', orderId)
      .then(() => {});
  },
  /** Courier's own geo → drivers.lat/lng (future nearest-dispatch + history) */
  setDriverGeo: (id: string, geo: LatLng) =>
    void supabase().from('drivers').update({ lat: geo.lat, lng: geo.lng }).eq('id', id).then(() => {}),
  setCustomerGeo: (id: string, geo: LatLng) =>
    void supabase().from('customers').update({ lat: geo.lat, lng: geo.lng }).eq('id', id).then(() => {}),
  setStoreGeo: (id: string, geo: LatLng) =>
    void supabase().from('stores').update({ lat: geo.lat, lng: geo.lng }).eq('id', id).then(() => {}),
  insertTrip: (t: Trip, account: Account) =>
    void supabase()
      .from('trips')
      .insert({
        id: t.id,
        order_id: t.orderId,
        driver_id: account.userId,
        driver_name: account.name,
        store_name: t.storeName,
        customer_address: t.customerAddress,
        distance_km: t.distanceKm,
        payout: t.payout,
        tip: t.tip,
        at: t.at,
        rating: t.rating ?? null,
      })
      .then(() => {}),
};

/* ---------- realtime ---------- */

const NOTIFY_STATUS: Partial<Record<OrderStatus, string>> = {
  accepted: 'The store accepted your order',
  driver_assigned: 'A driver is heading to the store',
  picked_up: 'Your order was picked up',
  en_route: 'Your order is on the way',
  delivered: 'Order delivered — enjoy responsibly',
  rejected: 'The store could not take your order',
  cancelled: 'Your order was cancelled',
};

const prevStatus = new Map<string, OrderStatus>();
const declinedReq = new Map<string, number>(); // orderId -> declinedAt

function deriveRequest() {
  const st = useApp.getState();
  if (!st.driverOnline || st.activeDelivery || st.incomingRequest) return;
  const nowMs = Date.now();
  const ready = st.allOrders
    .filter((o) => {
      if (o.status !== 'ready' || o.driverId) return false;
      const declinedAt = declinedReq.get(o.id);
      return !declinedAt || nowMs - declinedAt > 60_000;
    })
    .sort((a, b) => a.placedAt - b.placedAt)[0];
  if (!ready) return;
  const dx = ready.storePos.x - ready.customerPos.x;
  const dy = ready.storePos.y - ready.customerPos.y;
  // real km when both endpoints are geocoded, sim-grid estimate otherwise
  const distanceKm =
    ready.storeLatLng && ready.customerLatLng
      ? Math.max(0.5, haversineKm(ready.storeLatLng, ready.customerLatLng))
      : Math.max(0.8, Math.hypot(dx, dy) * 0.08);
  const surge = st.surge > 1 ? st.surge : 1;
  st.receiveRequest({
    id: uid('req'),
    orderId: ready.id,
    storeName: ready.storeName,
    storeAddress: ready.storeName,
    storePos: ready.storePos,
    customerAddress: ready.customerAddress,
    customerPos: ready.customerPos,
    distanceKm,
    payout: (3.5 + distanceKm * 1.9) * surge,
    items: ready.items.reduce((s, i) => s + i.qty, 0),
    expiresIn: 15,
    surge,
  });
}

export function declineOrderRequest(orderId: string) {
  declinedReq.set(orderId, Date.now());
}

function onOrderRow(row: Order, prev?: Order) {
  const st = useApp.getState();
  const uid_ = st.account?.userId;
  // split into the two buckets
  useApp.setState((s) => {
    const mine = row.customerId === uid_ ? upsert(s.orders, row) : s.orders;
    const store = row.storeId === uid_ ? upsert(s.storeOrders, row) : s.storeOrders;
    const allOrders = upsert(s.allOrders, row);
    // keep activeDelivery in sync if this row is the active one
    const activeDelivery =
      s.activeDelivery && s.activeDelivery.id === row.id ? { ...s.activeDelivery, ...row } : s.activeDelivery;
    return { orders: mine, storeOrders: store, allOrders, activeDelivery };
  });
  if (prev && prev.status !== row.status && row.customerId === uid_ && NOTIFY_STATUS[row.status]) {
    const cancelledBody =
      row.cancelReason === 'no_courier'
        ? `No couriers were available — ${row.storeName} order cancelled`
        : row.cancelReason === 'store_timeout' || row.cancelReason === 'store_abandoned'
          ? `${row.storeName} didn't respond in time — order cancelled`
          : `Your order was cancelled — ${row.storeName}`;
    st.pushNotification({
      title: row.id.slice(-5),
      body: row.status === 'cancelled' ? cancelledBody : `${NOTIFY_STATUS[row.status]} — ${row.storeName}`,
      kind: 'order',
    });
  }
  // re-dispatch: courier ghosted, order went back to the pool
  if (
    prev?.status === 'driver_assigned' &&
    row.status === 'ready' &&
    row.driverId == null &&
    row.customerId === uid_
  ) {
    st.pushNotification({
      title: row.id.slice(-5),
      body: `Your courier couldn't make it — finding another one for ${row.storeName}.`,
      kind: 'order',
    });
  }
  const stNow = useApp.getState();
  // this courier's active delivery was pulled back by the sweep
  if (
    stNow.account?.role === 'driver' &&
    stNow.activeDelivery?.id === row.id &&
    prev?.driverId === uid_ &&
    row.driverId == null &&
    row.status === 'ready'
  ) {
    useApp.setState({ activeDelivery: null, deliveryStage: null });
    stNow.pushNotification({
      title: 'Delivery reassigned',
      body: `Order ${row.id.slice(-5)} timed out and went back to the courier pool.`,
      kind: 'system',
    });
  }
  // clear an outstanding request if this order got claimed or left ready state
  if (stNow.incomingRequest?.orderId === row.id && (row.status !== 'ready' || row.driverId)) {
    useApp.setState({ incomingRequest: null });
  }
  deriveRequest();
}

function subscribe() {
  const sb = supabase();
  // unique topic per subscribe: supabase-js reuses channel objects by name, so a
  // restarted session re-using 'sipdash-live' would .on() an already-subscribed
  // channel and throw. The stale channel is removed by stopLive's removeAllChannels.
  sb.channel(`sipdash-live-${Math.random().toString(36).slice(2, 10)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, (e) => {
      if (e.eventType === 'DELETE') return;
      const row = toStore(e.new);
      useApp.setState((s) => ({
        stores: upsert(s.stores, row),
        // keep the merchant's own flags + approval state in sync
        ...(s.account && row.id === s.account.userId
          ? {
              account: { ...s.account, name: s.account.name, approved: row.approved },
              storeOpen: row.open,
              storePaused: row.paused,
              storePausedUntil: row.pausedUntil,
              prepTimeMin: row.prepTimeMin,
            }
          : {}),
      }));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (e) => {
      if (e.eventType === 'DELETE') {
        useApp.setState((s) => ({ products: s.products.filter((p) => p.id !== (e.old as any).id) }));
        return;
      }
      useApp.setState((s) => ({ products: upsert(s.products, toProduct(e.new)) }));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, (e) => {
      if (e.eventType === 'DELETE') return;
      const row = toDriver(e.new);
      useApp.setState((s) => ({
        adminDrivers: upsert(s.adminDrivers, row),
        ...(s.account && row.id === s.account.userId
          ? {
              account: { ...s.account, verified: row.verified },
              driverOnline: row.online,
            }
          : {}),
      }));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (e) => {
      if (e.eventType === 'DELETE') return;
      useApp.setState((s) => ({ adminCustomers: upsert(s.adminCustomers, toCustomer(e.new)) }));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'promos' }, (e) => {
      if (e.eventType === 'DELETE') return;
      const p = toPromo(e.new);
      useApp.setState((s) => ({
        promos: s.promos.some((x) => x.code === p.code)
          ? s.promos.map((x) => (x.code === p.code ? p : x))
          : [...s.promos, p],
      }));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (e) => {
      if (e.eventType === 'DELETE') {
        const id = (e.old as any).id;
        useApp.setState((s) => ({
          orders: s.orders.filter((o) => o.id !== id),
          storeOrders: s.storeOrders.filter((o) => o.id !== id),
          allOrders: s.allOrders.filter((o) => o.id !== id),
        }));
        return;
      }
      const row = toOrder(e.new);
      const prev = prevStatus.get(row.id);
      prevStatus.set(row.id, row.status);
      onOrderRow(row, prev !== undefined ? ({ status: prev } as Order) : undefined);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, (e) => {
      if (e.eventType === 'DELETE') return;
      useApp.setState((s) => ({ trips: upsert(s.trips, toTrip(e.new)) }));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (e) => {
      if (e.eventType === 'DELETE') return;
      const { key, value } = e.new as { key: string; value: unknown };
      const map: Record<string, () => Partial<ReturnType<typeof useApp.getState>>> = {
        surge: () => ({ surge: Number(value) }),
        platform_fee_pct: () => ({ platformFeePct: Number(value) }),
      };
      const patch = map[key]?.();
      if (patch) useApp.setState(patch);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        useApp.setState({ connected: true });
        // (re)join after a drop: events during the gap are never replayed,
        // so refetch everything — a missed 'placed' order must surface here
        void hydrate();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        useApp.setState({ connected: false });
      }
    });
}

/* ---------- live engine (replaces the simulator when online) ---------- */

let started = false;
let liveToken: object | null = null; // invalidates a superseded async start
let countdown: ReturnType<typeof setInterval> | null = null;

export async function startLive() {
  if (started) return;
  started = true;
  const token = {};
  liveToken = token;
  useApp.setState({ live: true });
  const ok = await hydrate();
  if (liveToken !== token) return; // stopLive ran while hydrating — do not subscribe
  if (!ok) {
    started = false; // allow retry
    useApp.setState({ live: false });
    return;
  }
  // prime prev-status map so hydration doesn't fire notifications
  for (const o of [...useApp.getState().orders, ...useApp.getState().storeOrders]) {
    prevStatus.set(o.id, o.status);
  }
  subscribe();
  deriveRequest();
  countdown = setInterval(() => {
    const st = useApp.getState();
    if (st.incomingRequest) {
      const left = st.incomingRequest.expiresIn - 1;
      if (left <= 0) {
        declineOrderRequest(st.incomingRequest.orderId);
        useApp.setState({ incomingRequest: null });
      } else {
        useApp.setState({ incomingRequest: { ...st.incomingRequest, expiresIn: left } });
      }
    } else {
      deriveRequest();
    }
  }, 1000);
}

export function stopLive() {
  if (countdown) clearInterval(countdown);
  countdown = null;
  started = false;
  liveToken = null;
  void supabase().removeAllChannels();
}

/* ---------- engine entry points (called by app shells) ---------- */

export function startEngine() {
  if (!isLive()) return;
  void startLive();
}

export function stopEngine() {
  if (!isLive()) return;
  stopLive();
}

export { isLive };
