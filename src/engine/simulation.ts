import { useApp, MY_STORE_ID } from '../stores/app';
import { DRIVERS, FAKE_NAMES, FAKE_STREETS, PRODUCTS, STORES } from '../data/mock';
import { Order, OrderStatus } from '../lib/types';
import { pick, rand, randInt, uid } from '../lib/format';

const TICK_MS = 500;

// How long each status lasts before auto-advancing (prototype speed)
const FLOW_DELAY: Partial<Record<OrderStatus, number>> = {
  placed: 4000, // -> accepted (auto for customer orders)
  accepted: 6000, // -> preparing
  preparing: 10000, // -> ready
  ready: 5000, // -> driver_assigned
  driver_assigned: 4000, // -> picked_up
  picked_up: 2000, // -> en_route
};
const EN_ROUTE_MS = 38000;

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'driver_assigned',
  driver_assigned: 'picked_up',
  picked_up: 'en_route',
  en_route: 'delivered',
};

const TERMINAL: OrderStatus[] = ['delivered', 'rejected', 'cancelled'];

interface Plan {
  nextAt: number;
  routeStart?: number;
}

const plans = new Map<string, Plan>();
let started = false;
let interval: ReturnType<typeof setInterval> | null = null;
let nextStoreOrderAt = Date.now() + rand(8000, 15000);
let nextDriverRequestAt = Date.now() + rand(6000, 12000);

const NOTIFY_STATUS: Partial<Record<OrderStatus, string>> = {
  accepted: 'The store accepted your order',
  driver_assigned: 'A driver is heading to the store',
  picked_up: 'Your order was picked up',
  en_route: 'Your order is on the way',
  delivered: 'Order delivered — enjoy responsibly',
};

function advance(order: Order, isStoreOrder: boolean) {
  const st = useApp.getState();
  const next = NEXT[order.status];
  if (!next) return;
  const patch: Partial<Order> = {
    status: next,
    timeline: [...order.timeline, { status: next, at: Date.now() }],
  };
  if (next === 'driver_assigned') {
    const d = pick(DRIVERS.filter((x) => x.online));
    patch.driverId = d.id;
    patch.driverName = d.name;
    patch.driverPos = { ...order.storePos };
    patch.driverProgress = 0;
  }
  if (next === 'en_route') {
    patch.driverProgress = 0;
    plans.set(order.id, { nextAt: Date.now() + EN_ROUTE_MS, routeStart: Date.now() });
  } else {
    const delay = FLOW_DELAY[next];
    plans.set(order.id, { nextAt: delay ? Date.now() + delay : Number.MAX_SAFE_INTEGER });
  }
  st.updateOrder(order.id, patch, { storeOrder: isStoreOrder });
  if (!isStoreOrder && NOTIFY_STATUS[next]) {
    st.pushNotification({ title: order.id.slice(-5), body: `${NOTIFY_STATUS[next]} — ${order.storeName}`, kind: 'order' });
  }
}

function processOrders() {
  const st = useApp.getState();
  const nowMs = Date.now();

  for (const order of st.orders) {
    if (!order.isLive || TERMINAL.includes(order.status)) continue;
    let plan = plans.get(order.id);
    if (!plan) {
      const delay = FLOW_DELAY[order.status] ?? 5000;
      plan = { nextAt: nowMs + delay };
      plans.set(order.id, plan);
    }
    if (order.status === 'en_route' && plan.routeStart) {
      const t = Math.min(1, (nowMs - plan.routeStart) / EN_ROUTE_MS);
      const pos = {
        x: order.storePos.x + (order.customerPos.x - order.storePos.x) * t,
        y: order.storePos.y + (order.customerPos.y - order.storePos.y) * t,
      };
      if (order.driverProgress !== t)
        st.updateOrder(order.id, { driverProgress: t, driverPos: pos });
      if (t >= 1) {
        st.updateOrder(order.id, {
          status: 'delivered',
          timeline: [...useApp.getState().orders.find((o) => o.id === order.id)!.timeline, { status: 'delivered', at: nowMs }],
        });
        st.pushNotification({ title: order.id.slice(-5), body: 'Delivered — enjoy responsibly 🥂', kind: 'order' });
        plans.delete(order.id);
      }
    } else if (nowMs >= plan.nextAt) {
      advance(order, false);
    }
  }

  for (const order of st.storeOrders) {
    if (!order.isLive || TERMINAL.includes(order.status)) continue;
    let plan = plans.get(order.id);
    if (!plan) {
      plan = { nextAt: order.status === 'placed' ? nowMs + 60000 : nowMs + (FLOW_DELAY[order.status] ?? 5000) };
      plans.set(order.id, plan);
    }
    if (order.status === 'placed' && nowMs >= plan.nextAt) {
      // store never responded -> customer cancels
      st.updateOrder(order.id, {
        status: 'cancelled',
        timeline: [...order.timeline, { status: 'cancelled', at: nowMs }],
      }, { storeOrder: true });
      plans.delete(order.id);
    } else if (order.status === 'accepted' && nowMs >= plan.nextAt) {
      advance(order, true); // -> preparing
    } else if (['preparing', 'driver_assigned', 'picked_up'].includes(order.status) && nowMs >= plan.nextAt) {
      advance(order, true);
    } else if (order.status === 'ready' && nowMs >= plan.nextAt) {
      advance(order, true); // driver assigned then auto pickup
    } else if (order.status === 'en_route') {
      if (!plan.routeStart) plan.routeStart = nowMs;
      if (nowMs - plan.routeStart > EN_ROUTE_MS) {
        st.updateOrder(order.id, {
          status: 'delivered',
          timeline: [...order.timeline, { status: 'delivered', at: nowMs }],
        }, { storeOrder: true });
        plans.delete(order.id);
      }
    }
  }
}

function spawnStoreOrder() {
  const st = useApp.getState();
  if (!st.storeOpen || st.storePaused) return;
  const active = st.storeOrders.filter((o) => !TERMINAL.includes(o.status)).length;
  if (active >= 4) return;
  const store = STORES.find((s) => s.id === MY_STORE_ID)!;
  const myProducts = PRODUCTS.filter((p) => p.storeId === MY_STORE_ID);
  const nItems = randInt(1, 3);
  const items = Array.from({ length: nItems }, () => {
    const p = pick(myProducts);
    return { productId: p.id, name: p.name, price: p.price, qty: randInt(1, 2), emoji: p.image };
  });
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const serviceFee = Math.min(4.99, subtotal * 0.08);
  const tip = randInt(0, 6);
  const order: Order = {
    id: uid('ORD-'),
    customerId: uid('c'),
    customerName: pick(FAKE_NAMES),
    customerAddress: pick(FAKE_STREETS),
    customerPos: { x: rand(15, 85), y: rand(15, 85) },
    storeId: MY_STORE_ID,
    storeName: store.name,
    storePos: store.pos,
    items,
    subtotal,
    deliveryFee: store.deliveryFee,
    serviceFee,
    surgeFee: 0,
    discount: 0,
    tip,
    total: subtotal + store.deliveryFee + serviceFee + tip,
    status: 'placed',
    placedAt: Date.now(),
    etaMinutes: randInt(20, 40),
    timeline: [{ status: 'placed', at: Date.now() }],
    isLive: true,
  };
  st.receiveStoreOrder(order);
}

function spawnDriverRequest() {
  const st = useApp.getState();
  if (!st.driverOnline || st.incomingRequest || st.activeDelivery) return;
  const store = pick(STORES.filter((s) => s.open));
  const surge = st.surge > 1 ? st.surge : Math.random() > 0.8 ? 1.5 : 1;
  const distance = rand(1.5, 6);
  const base = 3.5 + distance * 1.9;
  st.receiveRequest({
    id: uid('req'),
    orderId: uid('ORD-'),
    storeName: store.name,
    storeAddress: store.address,
    storePos: store.pos,
    customerAddress: pick(FAKE_STREETS),
    customerPos: { x: rand(15, 85), y: rand(15, 85) },
    distanceKm: distance,
    payout: base * surge,
    items: randInt(1, 6),
    expiresIn: 15,
    surge,
  });
}

function processDriver() {
  const st = useApp.getState();
  // countdown expiry
  if (st.incomingRequest) {
    const left = st.incomingRequest.expiresIn - TICK_MS / 1000;
    if (left <= 0) {
      useApp.setState({ incomingRequest: null });
    } else {
      useApp.setState({ incomingRequest: { ...st.incomingRequest, expiresIn: left } });
    }
  }
  // movement
  const d = st.activeDelivery;
  if (d && st.deliveryStage && ['to_store', 'to_customer'].includes(st.deliveryStage)) {
    const target = st.deliveryStage === 'to_store' ? d.storePos : d.customerPos;
    const travelMs = st.deliveryStage === 'to_store' ? 14000 : 22000;
    const dx = target.x - st.driverPos.x;
    const dy = target.y - st.driverPos.y;
    const dist = Math.hypot(dx, dy);
    const step = (TICK_MS / travelMs) * Math.max(dist, 1) * 8;
    if (dist <= step * 0.06 || dist < 0.4) {
      st.setDriverPos({ ...target });
      st.setDeliveryStage(st.deliveryStage === 'to_store' ? 'at_store' : 'at_customer');
    } else {
      const f = step / dist;
      st.setDriverPos({ x: st.driverPos.x + dx * f, y: st.driverPos.y + dy * f });
    }
  }
}

function tick() {
  const nowMs = Date.now();
  processOrders();
  processDriver();
  if (nowMs >= nextStoreOrderAt) {
    spawnStoreOrder();
    nextStoreOrderAt = nowMs + rand(18000, 40000);
  }
  if (nowMs >= nextDriverRequestAt) {
    spawnDriverRequest();
    nextDriverRequestAt = nowMs + rand(12000, 25000);
  }
}

export function startEngine() {
  if (started) return;
  started = true;
  interval = setInterval(tick, TICK_MS);
}

export function stopEngine() {
  if (interval) clearInterval(interval);
  interval = null;
  started = false;
}
