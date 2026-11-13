import { create } from 'zustand';
import {
  Account,
  AppNotification,
  CartItem,
  Customer,
  DeliveryRequest,
  Driver,
  Order,
  OrderStatus,
  Product,
  Promo,
  Store,
  Trip,
} from './types';
import { db, declineOrderRequest, hydrate, isLive, orderPatchToRow, toOrder } from './live';
import { LatLng, gridToLatLng, latLngToGrid } from './geo';
import { randInt, uid } from './format';

interface AppState {
  // session
  account: Account | null;
  authReady: boolean;
  connected: boolean; // realtime channel health
  ageVerified: boolean;
  notifications: AppNotification[];

  // live backend
  live: boolean;
  hydrated: boolean;

  // catalog (mutable for store/admin edits)
  stores: Store[];
  products: Product[];
  availability: Record<string, boolean>; // productId -> available override

  // customer
  cart: CartItem[];
  cartStoreId: string | null;
  orders: Order[];
  allOrders: Order[];
  promoCode: string | null;

  // driver
  driverOnline: boolean;
  incomingRequest: DeliveryRequest | null;
  activeDelivery: Order | null;
  deliveryStage: 'to_store' | 'at_store' | 'to_customer' | 'at_customer' | null;
  driverPos: { x: number; y: number };
  driverLatLng?: LatLng; // courier's real GPS fix
  trips: Trip[];
  driverEarnings: number;

  // store role
  storeOpen: boolean;
  storePaused: boolean;
  storePausedUntil?: number; // epoch ms; undefined = paused indefinitely
  prepTimeMin: number;
  acceptTimeoutSec: number; // seconds a store has to accept before auto-cancel
  storeOrders: Order[];

  // admin
  adminDrivers: Driver[];
  adminCustomers: Customer[];
  promos: Promo[];
  surge: number; // city-wide surge multiplier
  platformFeePct: number;

  // ---- actions ----
  setAccount: (a: Account | null) => void;
  setAuthReady: (ready: boolean) => void;
  verifyAge: () => void;
  pushNotification: (n: Omit<AppNotification, 'id' | 'at' | 'read'>) => void;
  markNotificationsRead: () => void;

  addToCart: (productId: string, qty?: number) => void;
  setCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  applyPromo: (code: string) => { ok: boolean; message: string };
  removePromo: () => void;
  placeOrder: (tip: number, instructions?: string) => Order | null;
  updateOrder: (id: string, patch: Partial<Order>, opts?: { storeOrder?: boolean }) => void;
  rateOrder: (id: string, rating: number) => void;

  // driver actions
  setDriverOnline: (on: boolean) => void;
  receiveRequest: (r: DeliveryRequest) => void;
  acceptRequest: () => Promise<void>;
  declineRequest: () => void;
  setDeliveryStage: (s: AppState['deliveryStage']) => void;
  setDriverPos: (p: { x: number; y: number }) => void;
  /** Real GPS fix — updates grid pos (legacy), writes lat/lng to the order + driver rows */
  setDriverGeoPos: (p: LatLng) => void;
  /** Pin-picked locations → customers/stores rows + local state */
  setMyLocation: (p: LatLng) => void;
  confirmPickup: (code?: string) => Promise<boolean>; // pickup code required in live mode; false = wrong/rejected
  completeDelivery: (code?: string) => Promise<boolean>; // dropoff code required in live mode

  // store actions
  toggleStoreOpen: () => void;
  toggleStorePaused: () => void;
  pauseStore: (minutes?: number) => void; // undefined = resume now; -1 = pause until resumed; >0 = timed pause
  setOpenHours: (hours: Record<string, [string, string]> | null) => void; // null = clear (no auto-pause by hours)
  setPrepTime: (m: number) => void;
  receiveStoreOrder: (o: Order) => void;
  storeOrderAction: (id: string, action: 'accept' | 'reject' | 'ready' | 'cancel', reason?: string) => Promise<void>;

  // admin
  adminCancelOrder: (id: string, reason?: string) => Promise<void>;
  toggleProductAvailability: (productId: string) => void;
  addProduct: (p: Omit<Product, 'id' | 'storeId'>) => void;

  // admin actions
  toggleStoreApproved: (storeId: string) => void;
  toggleDriverVerified: (driverId: string) => void;
  suspendCustomer: (customerId: string) => void;
  setSurge: (v: number) => void;
  togglePromo: (code: string) => void;
  setPlatformFee: (v: number) => void;
}

export const useApp = create<AppState>((set, get) => ({
  account: null,
  authReady: false,
  connected: true, // flipped false while the realtime channel is down
  ageVerified: false,
  notifications: [],

  live: false,
  hydrated: false,

  stores: [],
  products: [],
  availability: {},

  cart: [],
  cartStoreId: null,
  allOrders: [],
  orders: [],
  promoCode: null,

  driverOnline: false,
  incomingRequest: null,
  activeDelivery: null,
  deliveryStage: null,
  driverPos: { x: 45, y: 45 },
  trips: [],
  driverEarnings: 0,

  storeOpen: false,
  storePaused: false,
  storePausedUntil: undefined,
  prepTimeMin: 15,
  acceptTimeoutSec: 90,
  storeOrders: [],

  adminDrivers: [],
  adminCustomers: [],
  promos: [],
  surge: 1.0,
  platformFeePct: 22,

  setAccount: (account) =>
    set((s) => ({
      account,
      // reset per-session state on sign out / account switch
      ...(account
        ? {}
        : {
            orders: [],
            storeOrders: [],
            allOrders: [],
            trips: [],
            driverEarnings: 0,
            driverOnline: false,
            incomingRequest: null,
            activeDelivery: null,
            deliveryStage: null,
            cart: [],
            cartStoreId: null,
            promoCode: null,
            notifications: [],
            ageVerified: false,
            hydrated: false,
          }),
      ...(s.account && account && s.account.userId !== account.userId
        ? {
            orders: [],
            storeOrders: [],
            trips: [],
            driverEarnings: 0,
            driverOnline: false,
            activeDelivery: null,
            deliveryStage: null,
            cart: [],
            cartStoreId: null,
          }
        : {}),
    })),
  setAuthReady: (authReady) => set({ authReady }),
  verifyAge: () => {
    const { account } = get();
    if (account?.role === 'customer' && isLive()) db.setAgeVerified(account.userId);
    set({ ageVerified: true });
  },
  pushNotification: (n) =>
    set((s) => ({
      notifications: [{ ...n, id: uid('n'), at: Date.now(), read: false }, ...s.notifications].slice(0, 30),
    })),
  markNotificationsRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

  addToCart: (productId, qty = 1) => {
    const p = get().products.find((x) => x.id === productId);
    if (!p) return;
    const { cartStoreId } = get();
    if (cartStoreId && cartStoreId !== p.storeId) {
      // Uber-style: one merchant per cart — auto-switch
      set({ cart: [{ productId, qty }], cartStoreId: p.storeId });
    } else {
      set((s) => {
        const existing = s.cart.find((i) => i.productId === productId);
        const cart = existing
          ? s.cart.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i))
          : [...s.cart, { productId, qty }];
        return { cart, cartStoreId: p.storeId };
      });
    }
  },
  setCartQty: (productId, qty) =>
    set((s) => {
      const cart = qty <= 0 ? s.cart.filter((i) => i.productId !== productId) : s.cart.map((i) => (i.productId === productId ? { ...i, qty } : i));
      return { cart, cartStoreId: cart.length ? s.cartStoreId : null };
    }),
  clearCart: () => set({ cart: [], cartStoreId: null, promoCode: null }),

  applyPromo: (code) => {
    const promo = get().promos.find((p) => p.code === code.toUpperCase() && p.active);
    if (!promo) return { ok: false, message: 'Invalid or expired promo code' };
    const subtotal = cartSubtotal(get().cart);
    if (subtotal < promo.minSubtotal)
      return { ok: false, message: `Requires R${promo.minSubtotal.toFixed(0)} minimum` };
    set({ promoCode: promo.code });
    return { ok: true, message: `Applied: ${promo.description}` };
  },
  removePromo: () => set({ promoCode: null }),

  placeOrder: (tip, instructions) => {
    const { cart, cartStoreId, promoCode, promos, surge, stores, products, account } = get();
    if (!cart.length || !cartStoreId || !account) return null;
    const store = stores.find((s) => s.id === cartStoreId)!;
    const items = cart.map((c) => {
      const p = products.find((x) => x.id === c.productId)!;
      return { productId: c.productId, name: p.name, price: p.price, qty: c.qty, emoji: p.image };
    });
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const baseDelivery = store.deliveryFee * surge;
    const surgeFee = store.deliveryFee * (surge - 1);
    const serviceFee = Math.min(4.99, subtotal * 0.08);
    const promo = promos.find((p) => p.code === promoCode);
    const discount = promo
      ? promo.type === 'percent'
        ? (subtotal * promo.value) / 100
        : promo.type === 'flat'
          ? promo.value
          : 0
      : 0;
    const deliveryFee = promo?.type === 'free_delivery' ? 0 : baseDelivery;
    const order: Order = {
      id: uid('ORD-'),
      customerId: account.userId,
      customerName: account.name,
      customerAddress: account.address ?? '',
      customerPos: account.pos ?? { x: 50, y: 50 },
      customerLatLng: account.latLng,
      storeId: store.id,
      storeName: store.name,
      storePos: store.pos,
      storeLatLng: store.latLng,
      items,
      subtotal,
      deliveryFee,
      serviceFee,
      surgeFee,
      discount,
      tip,
      total: subtotal + deliveryFee + serviceFee - discount + tip,
      promoCode: promoCode ?? undefined,
      instructions: instructions?.trim() ? instructions.trim().slice(0, 500) : undefined,
      status: 'placed',
      placedAt: Date.now(),
      etaMinutes: randInt(store.deliveryTimeMin, store.deliveryTimeMax),
      timeline: [{ status: 'placed', at: Date.now() }],
      isLive: true,
    };
    if (isLive()) db.insertOrder(order);
    set((s) => ({
      orders: [order, ...s.orders],
      allOrders: [order, ...s.allOrders],
      cart: [],
      cartStoreId: null,
      promoCode: null,
      notifications: [
        {
          id: uid('n'),
          title: 'Order placed',
          body: `${store.name} received your order ${order.id.slice(-5)}.`,
          at: Date.now(),
          read: false,
          kind: 'order',
        },
        ...s.notifications,
      ],
    }));
    return order;
  },

  updateOrder: (id, patch, opts) => {
    if (isLive()) db.patchOrderRow(id, orderPatchToRow(patch));
    set((s) => {
      const patchList = (list: Order[]) =>
        list.map((o) => (o.id === id ? { ...o, ...patch } : o));
      return {
        allOrders: patchList(s.allOrders),
        ...(opts?.storeOrder ? { storeOrders: patchList(s.storeOrders) } : { orders: patchList(s.orders) }),
      };
    });
  },

  rateOrder: (id, rating) => {
    if (isLive()) db.patchOrderRow(id, { rating });
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? { ...o, rating } : o)),
      allOrders: s.allOrders.map((o) => (o.id === id ? { ...o, rating } : o)),
    }));
  },

  // ---- driver ----
  setDriverOnline: (on) => {
    const { account } = get();
    if (on && account?.verified === false) return; // pending verification
    if (account && isLive()) db.setDriverOnline(account.userId, on);
    set({ driverOnline: on, ...(on ? {} : { incomingRequest: null }) });
  },
  receiveRequest: (r) => set({ incomingRequest: r }),
  acceptRequest: async () => {
    const { incomingRequest, allOrders, account } = get();
    if (!incomingRequest || !account) return;
    const local = allOrders.find((o) => o.id === incomingRequest.orderId);
    let delivery: Order | null = local ?? null;
    if (isLive()) {
      const { data, error } = await db.claimOrder(incomingRequest.orderId);
      if (error || !data?.ok) {
        const reason = (data as { reason?: string } | null)?.reason;
        declineOrderRequest(incomingRequest.orderId);
        set({ incomingRequest: null });
        if (reason === 'busy') void hydrate(); // stale server-side delivery — resync it into view
        get().pushNotification({
          title: 'Delivery unavailable',
          body:
            reason === 'busy'
              ? 'Finish your current delivery first.'
              : reason === 'already_taken'
                ? 'Another courier grabbed this one.'
                : 'This delivery is no longer available.',
          kind: 'system',
        });
        return;
      }
      if (data?.order) delivery = toOrder(data.order);
    }
    const timeline = [
      ...(delivery?.timeline ?? []),
      { status: 'driver_assigned' as const, at: Date.now() },
    ];
    set({
      activeDelivery: delivery
        ? {
            ...delivery,
            status: 'driver_assigned',
            driverId: account.userId,
            driverName: account.name,
            timeline,
          }
        : null,
      incomingRequest: null,
      deliveryStage: 'to_store',
    });
  },
  declineRequest: () => {
    const req = get().incomingRequest;
    if (req) declineOrderRequest(req.orderId);
    set({ incomingRequest: null });
  },
  setDeliveryStage: (deliveryStage) =>
    set((s) => ({
      deliveryStage,
      activeDelivery:
        s.activeDelivery && deliveryStage === 'at_customer'
          ? { ...s.activeDelivery, status: 'en_route' }
          : s.activeDelivery,
    })),
  setDriverPos: (driverPos) => {
    const { activeDelivery } = get();
    if (isLive() && activeDelivery) db.updateDriverPos(activeDelivery.id, gridToLatLng(driverPos));
    set({ driverPos });
  },
  setDriverGeoPos: (p) => {
    const { activeDelivery, account } = get();
    const driverPos = latLngToGrid(p);
    if (isLive()) {
      if (activeDelivery) db.updateDriverPos(activeDelivery.id, p);
      if (account) db.setDriverGeo(account.userId, p);
    }
    set({ driverPos, driverLatLng: p });
  },
  setMyLocation: (p) =>
    set((s) => {
      if (isLive() && s.account) {
        if (s.account.role === 'customer') db.setCustomerGeo(s.account.userId, p);
        if (s.account.role === 'store') db.setStoreGeo(s.account.userId, p);
      }
      return {
        account: s.account ? { ...s.account, latLng: p } : s.account,
        stores: s.stores.map((x) => (x.id === s.account?.userId ? { ...x, latLng: p } : x)),
      };
    }),
  confirmPickup: async (code) => {
    const prev = get().activeDelivery;
    const prevStage = get().deliveryStage;
    if (!prev) return false;
    if (isLive()) {
      if (!code) return false;
      const { data, error } = await db.verifyOrderCode(prev.id, code, 'pickup');
      if (error || !data?.ok) return false;
      const row = toOrder(data.order);
      set({ deliveryStage: 'to_customer', activeDelivery: row });
      return true;
    }
    const timeline = [...prev.timeline, { status: 'picked_up' as const, at: Date.now() }];
    set({
      deliveryStage: 'to_customer',
      activeDelivery: { ...prev, status: 'picked_up', timeline },
    });
    return true;
  },
  completeDelivery: async (code) => {
    const { activeDelivery, account, deliveryStage } = get();
    if (!activeDelivery) return false;
    if (isLive()) {
      if (!code) return false;
      const { data, error } = await db.verifyOrderCode(activeDelivery.id, code, 'dropoff');
      if (error || !data?.ok) return false;
    }
    const dist = distKm(activeDelivery.storePos, activeDelivery.customerPos);
    const payout = 3.5 + dist * 1.9 + activeDelivery.surgeFee;
    const trip: Trip = {
      id: uid('t'),
      orderId: activeDelivery.id,
      storeName: activeDelivery.storeName,
      customerAddress: activeDelivery.customerAddress,
      distanceKm: dist,
      payout,
      tip: activeDelivery.tip,
      at: Date.now(),
    };
    set((s) => ({
      trips: [trip, ...s.trips],
      driverEarnings: s.driverEarnings + payout + trip.tip,
      activeDelivery: null,
      deliveryStage: null,
    }));
    if (isLive() && account) db.insertTrip(trip, account);
    return true;
  },

  // ---- store role ----
  toggleStoreOpen: () =>
    set((s) => {
      if (s.account && isLive()) db.updateStore(s.account.userId, { open: !s.storeOpen });
      return { storeOpen: !s.storeOpen };
    }),
  toggleStorePaused: () => {
    get().pauseStore(get().storePaused ? undefined : -1);
  },
  pauseStore: (minutes) =>
    set((s) => {
      // minutes === -1 means "pause until I resume" (kept for toggle parity)
      const pausing = minutes !== undefined;
      const until = pausing && minutes > 0 ? Date.now() + minutes * 60_000 : undefined;
      if (s.account && isLive())
        db.updateStore(s.account.userId, {
          paused: pausing,
          paused_until: until ? new Date(until).toISOString() : null,
        });
      return { storePaused: pausing, storePausedUntil: until };
    }),
  setOpenHours: (hours) =>
    set((s) => {
      if (s.account && isLive()) db.updateStore(s.account.userId, { open_hours: hours });
      return {
        stores: s.stores.map((x) => (x.id === s.account?.userId ? { ...x, openHours: hours ?? undefined } : x)),
      };
    }),
  setPrepTime: (prepTimeMin) => {
    const { account } = get();
    if (account && isLive()) db.updateStore(account.userId, { prep_time_min: prepTimeMin });
    set({ prepTimeMin });
  },
  receiveStoreOrder: (o) =>
    set((s) => ({ storeOrders: [o, ...s.storeOrders], allOrders: [o, ...s.allOrders] })),
  storeOrderAction: async (id, action, reason) => {
    const order = get().storeOrders.find((o) => o.id === id);
    if (!order) return;
    const status: OrderStatus =
      action === 'accept'
        ? 'accepted'
        : action === 'reject'
          ? 'rejected'
          : action === 'cancel'
            ? 'cancelled'
            : 'ready';
    const timeline = [...order.timeline, { status, at: Date.now() }];
    set((s) => ({
      storeOrders: s.storeOrders.map((o) => (o.id === id ? { ...o, status, timeline } : o)),
    }));
    if (!isLive()) return;
    const { error } = await db.patchOrderRow(id, {
      status,
      // reason persists once the backend lets parties write cancel_reason;
      // the guard strips it for store actors until then — no error, just not saved yet
      ...(reason ? { cancel_reason: reason } : {}),
    });
    if (error) {
      const latest = get().storeOrders.find((o) => o.id === id) ?? order;
      const REASONS: Record<string, string> = {
        store_timeout: 'timed out waiting to be accepted',
        store_abandoned: 'timed out during preparation',
        no_courier: 'was cancelled — no courier available',
        dispute: 'was cancelled by ops',
      };
      const why =
        latest.status === 'cancelled'
          ? `Order ${REASONS[latest.cancelReason ?? ''] ?? 'was cancelled'}.`
          : `Order is now ${latest.status}.`;
      set((s) => ({
        storeOrders: s.storeOrders.map((o) => (o.id === id ? latest : o)),
      }));
      get().pushNotification({
        title: 'Update failed',
        body: `${why} Refreshing.`,
        kind: 'system',
      });
    }
  },
  toggleProductAvailability: (productId) =>
    set((s) => {
      const next = !(s.availability[productId] ?? productAvailable(productId));
      if (isLive()) db.setProductAvailable(productId, next);
      return { availability: { ...s.availability, [productId]: next } };
    }),
  addProduct: (p) => {
    const { account } = get();
    if (!account) return;
    const product: Product = { ...p, id: uid('p'), storeId: account.userId };
    if (isLive()) db.insertProduct(product);
    set((s) => ({ products: [...s.products, product] }));
  },

  // ---- admin ----
  adminCancelOrder: async (id, reason = 'dispute') => {
    const order = get().allOrders.find((o) => o.id === id);
    if (!order) return;
    const cancelled = { status: 'cancelled' as const, cancelReason: reason };
    set((s) => ({
      allOrders: s.allOrders.map((o) => (o.id === id ? { ...o, ...cancelled } : o)),
    }));
    if (!isLive()) return;
    const { error } = await db.patchOrderRow(id, { status: 'cancelled', cancel_reason: reason });
    if (error) {
      set((s) => ({
        allOrders: s.allOrders.map((o) => (o.id === id ? order : o)),
      }));
      get().pushNotification({
        title: 'Update failed',
        body: 'Could not cancel the order — try again.',
        kind: 'system',
      });
    }
  },
  toggleStoreApproved: (storeId) =>
    set((s) => {
      const st = s.stores.find((x) => x.id === storeId);
      if (st && isLive()) db.updateStore(storeId, { approved: !st.approved });
      return {
        stores: s.stores.map((x) => (x.id === storeId ? { ...x, approved: !x.approved } : x)),
      };
    }),
  toggleDriverVerified: (driverId) =>
    set((s) => {
      const d = s.adminDrivers.find((x) => x.id === driverId);
      if (d && isLive()) db.setDriverVerified(driverId, !d.verified);
      return {
        adminDrivers: s.adminDrivers.map((x) => (x.id === driverId ? { ...x, verified: !x.verified } : x)),
      };
    }),
  suspendCustomer: (customerId) =>
    set((s) => {
      const c = s.adminCustomers.find((x) => x.id === customerId);
      const status = c?.status === 'active' ? 'suspended' : 'active';
      if (c && isLive()) db.setCustomerStatus(customerId, status);
      return {
        adminCustomers: s.adminCustomers.map((x) => (x.id === customerId ? { ...x, status } : x)),
      };
    }),
  setSurge: (surge) => {
    if (isLive()) db.setSetting('surge', surge);
    set({ surge });
  },
  togglePromo: (code) =>
    set((s) => {
      const p = s.promos.find((x) => x.code === code);
      if (p && isLive()) db.setPromoActive(code, !p.active);
      return { promos: s.promos.map((x) => (x.code === code ? { ...x, active: !x.active } : x)) };
    }),
  setPlatformFee: (platformFeePct) => {
    if (isLive()) db.setSetting('platform_fee_pct', platformFeePct);
    set({ platformFeePct });
  },
}));

// ---------- helpers ----------

export const productById = (id: string) => useApp.getState().products.find((p) => p.id === id);
export const storeById = (id: string) => useApp.getState().stores.find((s) => s.id === id);

/** The store the signed-in merchant manages (their auth uid = stores.id). */
export const myStore = () => {
  const a = useApp.getState().account;
  return a?.role === 'store' ? useApp.getState().stores.find((s) => s.id === a.userId) : undefined;
};

export const productAvailable = (id: string): boolean => {
  const override = useApp.getState().availability[id];
  const p = useApp.getState().products.find((x) => x.id === id);
  return override ?? (p?.available ?? false);
};

export const cartSubtotal = (cart: CartItem[]) =>
  cart.reduce((s, c) => s + (productById(c.productId)?.price ?? 0) * c.qty, 0);

export const distKm = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y) * 0.08;

export const orderTotals = (order: Order) => order.total;
