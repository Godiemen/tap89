import { create } from 'zustand';
import {
  AppNotification,
  CartItem,
  Customer,
  DeliveryRequest,
  Driver,
  Order,
  OrderStatus,
  Promo,
  Role,
  Store,
  Trip,
} from '../lib/types';
import {
  CUSTOMERS,
  DRIVERS,
  PRODUCTS,
  PROMOS,
  STORES,
  USER_ADDRESS,
  USER_POS,
} from '../data/mock';
import { pick, randInt, uid } from '../lib/format';

const MY_STORE_ID = 's1'; // the store this account manages in store role
export { MY_STORE_ID };

const now = Date.now();

const seedOrder = (
  id: string,
  storeId: string,
  items: { productId: string; qty: number }[],
  hoursAgo: number,
  rating?: number
): Order => {
  const store = STORES.find((s) => s.id === storeId)!;
  const orderItems = items.map(({ productId, qty }) => {
    const p = PRODUCTS.find((x) => x.id === productId)!;
    return { productId, name: p.name, price: p.price, qty, emoji: p.image };
  });
  const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = store.deliveryFee;
  const serviceFee = Math.min(4, subtotal * 0.08);
  const placedAt = now - hoursAgo * 3600_000;
  return {
    id,
    customerId: 'me',
    customerName: 'You',
    customerAddress: USER_ADDRESS,
    customerPos: USER_POS,
    storeId,
    storeName: store.name,
    storePos: store.pos,
    items: orderItems,
    subtotal,
    deliveryFee,
    serviceFee,
    surgeFee: 0,
    discount: 0,
    tip: 3,
    total: subtotal + deliveryFee + serviceFee + 3,
    status: 'delivered',
    placedAt,
    etaMinutes: 0,
    timeline: [
      { status: 'placed', at: placedAt },
      { status: 'delivered', at: placedAt + 28 * 60_000 },
    ],
    driverName: pick(DRIVERS).name,
    rating,
  };
};

interface AppState {
  // session
  role: Role | null;
  ageVerified: boolean;
  userName: string;
  notifications: AppNotification[];

  // catalog (mutable for store/admin edits)
  stores: Store[];
  availability: Record<string, boolean>; // productId -> available override

  // customer
  cart: CartItem[];
  cartStoreId: string | null;
  orders: Order[];
  promoCode: string | null;

  // driver
  driverOnline: boolean;
  incomingRequest: DeliveryRequest | null;
  activeDelivery: Order | null;
  deliveryStage: 'to_store' | 'at_store' | 'to_customer' | 'at_customer' | null;
  driverPos: { x: number; y: number };
  trips: Trip[];
  driverEarnings: number;

  // store role
  storeOpen: boolean;
  storePaused: boolean;
  prepTimeMin: number;
  storeOrders: Order[];

  // admin
  adminDrivers: Driver[];
  adminCustomers: Customer[];
  promos: Promo[];
  surge: number; // city-wide surge multiplier
  platformFeePct: number;

  // ---- actions ----
  setRole: (r: Role | null) => void;
  verifyAge: () => void;
  pushNotification: (n: Omit<AppNotification, 'id' | 'at' | 'read'>) => void;
  markNotificationsRead: () => void;

  addToCart: (productId: string, qty?: number) => void;
  setCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  applyPromo: (code: string) => { ok: boolean; message: string };
  removePromo: () => void;
  placeOrder: (tip: number) => Order | null;
  updateOrder: (id: string, patch: Partial<Order>, opts?: { storeOrder?: boolean }) => void;
  rateOrder: (id: string, rating: number) => void;

  // driver actions
  setDriverOnline: (on: boolean) => void;
  receiveRequest: (r: DeliveryRequest) => void;
  acceptRequest: () => void;
  declineRequest: () => void;
  setDeliveryStage: (s: AppState['deliveryStage']) => void;
  setDriverPos: (p: { x: number; y: number }) => void;
  confirmPickup: () => void;
  completeDelivery: () => void;

  // store actions
  toggleStoreOpen: () => void;
  toggleStorePaused: () => void;
  setPrepTime: (m: number) => void;
  receiveStoreOrder: (o: Order) => void;
  storeOrderAction: (id: string, action: 'accept' | 'reject' | 'ready') => void;
  toggleProductAvailability: (productId: string) => void;

  // admin actions
  toggleStoreApproved: (storeId: string) => void;
  toggleDriverVerified: (driverId: string) => void;
  suspendCustomer: (customerId: string) => void;
  setSurge: (v: number) => void;
  togglePromo: (code: string) => void;
  setPlatformFee: (v: number) => void;
}

export const useApp = create<AppState>((set, get) => ({
  role: null,
  ageVerified: false,
  userName: 'Jordan Blake',
  notifications: [
    {
      id: 'n1',
      title: 'Welcome to SipDash',
      body: 'Alcohol delivered in minutes. Must be 21+ to order.',
      at: now - 3600_000,
      read: false,
      kind: 'system',
    },
  ],

  stores: STORES,
  availability: {},

  cart: [],
  cartStoreId: null,
  orders: [
    seedOrder('ORD-7F2K9', 's3', [{ productId: 's3-p0', qty: 2 }, { productId: 's3-p7', qty: 1 }], 26, 5),
    seedOrder('ORD-3M8XQ', 's1', [{ productId: 's1-p0', qty: 1 }, { productId: 's1-p9', qty: 1 }], 96, 4),
    seedOrder('ORD-9P4LA', 's4', [{ productId: 's4-p2', qty: 3 }], 170),
  ],
  promoCode: null,

  driverOnline: false,
  incomingRequest: null,
  activeDelivery: null,
  deliveryStage: null,
  driverPos: { x: 45, y: 45 },
  trips: [
    { id: 't1', orderId: 'ORD-2XK4P', storeName: 'Hops & Crafts Beer Co.', customerAddress: '88 Sunset Blvd', distanceKm: 3.1, payout: 8.4, tip: 3, at: now - 5 * 3600_000, rating: 5 },
    { id: 't2', orderId: 'ORD-6QM9Z', storeName: 'Liquor Express 24/7', customerAddress: '17 Harbor View', distanceKm: 4.6, payout: 11.2, tip: 5, at: now - 7 * 3600_000, rating: 5 },
    { id: 't3', orderId: 'ORD-8RT3W', storeName: 'The Whiskey Barrel', customerAddress: '56 Canyon Rd', distanceKm: 2.2, payout: 6.8, tip: 2, at: now - 26 * 3600_000 },
  ],
  driverEarnings: 47.35,

  storeOpen: true,
  storePaused: false,
  prepTimeMin: 15,
  storeOrders: [],

  adminDrivers: DRIVERS,
  adminCustomers: CUSTOMERS,
  promos: PROMOS,
  surge: 1.0,
  platformFeePct: 22,

  setRole: (role) => set({ role }),
  verifyAge: () => set({ ageVerified: true }),
  pushNotification: (n) =>
    set((s) => ({
      notifications: [{ ...n, id: uid('n'), at: Date.now(), read: false }, ...s.notifications].slice(0, 30),
    })),
  markNotificationsRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

  addToCart: (productId, qty = 1) => {
    const p = PRODUCTS.find((x) => x.id === productId);
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

  placeOrder: (tip) => {
    const { cart, cartStoreId, promoCode, promos, surge } = get();
    if (!cart.length || !cartStoreId) return null;
    const store = STORES.find((s) => s.id === cartStoreId)!;
    const items = cart.map((c) => {
      const p = PRODUCTS.find((x) => x.id === c.productId)!;
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
      customerId: 'me',
      customerName: 'You',
      customerAddress: USER_ADDRESS,
      customerPos: USER_POS,
      storeId: store.id,
      storeName: store.name,
      storePos: store.pos,
      items,
      subtotal,
      deliveryFee,
      serviceFee,
      surgeFee,
      discount,
      tip,
      total: subtotal + deliveryFee + serviceFee - discount + tip,
      promoCode: promoCode ?? undefined,
      status: 'placed',
      placedAt: Date.now(),
      etaMinutes: randInt(store.deliveryTimeMin, store.deliveryTimeMax),
      timeline: [{ status: 'placed', at: Date.now() }],
      isLive: true,
    };
    set((s) => ({
      orders: [order, ...s.orders],
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

  updateOrder: (id, patch, opts) =>
    set((s) => {
      const patchList = (list: Order[]) =>
        list.map((o) => (o.id === id ? { ...o, ...patch } : o));
      return opts?.storeOrder
        ? { storeOrders: patchList(s.storeOrders) }
        : { orders: patchList(s.orders) };
    }),

  rateOrder: (id, rating) =>
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, rating } : o)) })),

  // ---- driver ----
  setDriverOnline: (on) =>
    set({ driverOnline: on, ...(on ? {} : { incomingRequest: null }) }),
  receiveRequest: (r) => set({ incomingRequest: r }),
  acceptRequest: () => {
    const { incomingRequest, orders } = get();
    if (!incomingRequest) return;
    const order = orders.find((o) => o.id === incomingRequest.orderId);
    const delivery: Order =
      order ?? {
        id: incomingRequest.orderId,
        customerId: 'cust',
        customerName: 'Customer',
        customerAddress: incomingRequest.customerAddress,
        customerPos: incomingRequest.customerPos,
        storeId: 'ext',
        storeName: incomingRequest.storeName,
        storePos: incomingRequest.storePos,
        items: [],
        subtotal: 0,
        deliveryFee: 0,
        serviceFee: 0,
        surgeFee: 0,
        discount: 0,
        tip: randInt(0, 6),
        total: 0,
        status: 'driver_assigned',
        placedAt: Date.now(),
        etaMinutes: Math.ceil(incomingRequest.distanceKm * 4) + 5,
        timeline: [{ status: 'driver_assigned', at: Date.now() }],
        driverId: 'me',
        driverName: 'You',
        isLive: true,
      };
    set({
      activeDelivery: { ...delivery, status: 'driver_assigned' },
      incomingRequest: null,
      deliveryStage: 'to_store',
    });
  },
  declineRequest: () => set({ incomingRequest: null }),
  setDeliveryStage: (deliveryStage) =>
    set((s) => ({
      deliveryStage,
      activeDelivery:
        s.activeDelivery && deliveryStage === 'at_customer'
          ? { ...s.activeDelivery, status: 'en_route' }
          : s.activeDelivery,
    })),
  setDriverPos: (driverPos) => set({ driverPos }),
  confirmPickup: () =>
    set((s) =>
      s.activeDelivery
        ? {
            deliveryStage: 'to_customer',
            activeDelivery: {
              ...s.activeDelivery,
              status: 'picked_up',
              timeline: [...s.activeDelivery.timeline, { status: 'picked_up', at: Date.now() }],
            },
          }
        : {}
    ),
  completeDelivery: () => {
    const { activeDelivery } = get();
    if (!activeDelivery) return;
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
  },

  // ---- store role ----
  toggleStoreOpen: () => set((s) => ({ storeOpen: !s.storeOpen })),
  toggleStorePaused: () => set((s) => ({ storePaused: !s.storePaused })),
  setPrepTime: (prepTimeMin) => set({ prepTimeMin }),
  receiveStoreOrder: (o) =>
    set((s) => ({ storeOrders: [o, ...s.storeOrders] })),
  storeOrderAction: (id, action) =>
    set((s) => ({
      storeOrders: s.storeOrders.map((o) => {
        if (o.id !== id) return o;
        const status: OrderStatus =
          action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'ready';
        return { ...o, status, timeline: [...o.timeline, { status, at: Date.now() }] };
      }),
    })),
  toggleProductAvailability: (productId) =>
    set((s) => ({
      availability: {
        ...s.availability,
        [productId]: !(s.availability[productId] ?? productAvailable(productId)),
      },
    })),

  // ---- admin ----
  toggleStoreApproved: (storeId) =>
    set((s) => ({
      stores: s.stores.map((st) => (st.id === storeId ? { ...st, approved: !st.approved } : st)),
    })),
  toggleDriverVerified: (driverId) =>
    set((s) => ({
      adminDrivers: s.adminDrivers.map((d) => (d.id === driverId ? { ...d, verified: !d.verified } : d)),
    })),
  suspendCustomer: (customerId) =>
    set((s) => ({
      adminCustomers: s.adminCustomers.map((c) =>
        c.id === customerId ? { ...c, status: c.status === 'active' ? 'suspended' : 'active' } : c
      ),
    })),
  setSurge: (surge) => set({ surge }),
  togglePromo: (code) =>
    set((s) => ({
      promos: s.promos.map((p) => (p.code === code ? { ...p, active: !p.active } : p)),
    })),
  setPlatformFee: (platformFeePct) => set({ platformFeePct }),
}));

// ---------- helpers ----------

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
export const storeById = (id: string) => useApp.getState().stores.find((s) => s.id === id);

export const productAvailable = (id: string): boolean => {
  const override = useApp.getState().availability[id];
  const p = PRODUCTS.find((x) => x.id === id);
  return override ?? (p?.available ?? false);
};

export const cartSubtotal = (cart: CartItem[]) =>
  cart.reduce((s, c) => s + (productById(c.productId)?.price ?? 0) * c.qty, 0);

export const distKm = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y) * 0.08;

export const orderTotals = (order: Order) => order.total;
