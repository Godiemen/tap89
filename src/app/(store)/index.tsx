import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, MY_STORE_ID } from '../../stores/app';
import { STORES } from '../../data/mock';
import { colors, font, spacing } from '../../theme';
import { clock, money, orderNo, STATUS_COLOR, STATUS_LABEL } from '../../lib/format';
import { Badge, Button, Card, Divider, EmptyState } from '../../components/ui';
import { Order } from '../../lib/types';

function NewOrderCard({ order }: { order: Order }) {
  const act = useApp((s) => s.storeOrderAction);
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => {
    const update = () => setNowMs(Date.now());
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = nowMs ? Math.max(0, Math.ceil(60 - (nowMs - order.placedAt) / 1000)) : 60;
  return (
    <Card style={{ marginBottom: spacing(3), borderWidth: 1.5, borderColor: colors.amber }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Badge label="NEW ORDER" color={colors.amber} soft={colors.amberSoft} />
        <Text style={[font.small, { color: remaining < 18 ? colors.red : colors.sub }]}>
          ⏱ {remaining}s to accept
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing(3) }}>
        <Text style={font.h2}>{orderNo(order.id)}</Text>
        <Text style={font.h2}>{money(order.total)}</Text>
      </View>
      <Text style={font.small}>{order.customerName} · {order.customerAddress}</Text>
      <View style={{ marginTop: spacing(2), gap: 2 }}>
        {order.items.map((i, idx) => (
          <Text key={idx} style={font.body}>{i.emoji} {i.qty}× {i.name}</Text>
        ))}
      </View>
      {order.tip > 0 ? <Text style={[font.small, { color: colors.accent, marginTop: spacing(1) }]}>+ {money(order.tip)} tip</Text> : null}
      <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: spacing(3) }}>
        <Button title="Reject" variant="ghost" onPress={() => act(order.id, 'reject')} style={{ flex: 1 }} />
        <Button title="Accept" variant="accent" icon="checkmark" onPress={() => act(order.id, 'accept')} style={{ flex: 2 }} />
      </View>
    </Card>
  );
}

function ActiveOrderCard({ order }: { order: Order }) {
  const act = useApp((s) => s.storeOrderAction);
  return (
    <Card style={{ marginBottom: spacing(3) }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={font.h3}>{orderNo(order.id)}</Text>
        <Badge label={STATUS_LABEL[order.status]} color={STATUS_COLOR[order.status]} soft={colors.blueSoft} />
      </View>
      <Text style={font.small}>{order.customerName} · placed {clock(order.placedAt)}</Text>
      <View style={{ marginTop: spacing(2), gap: 2 }}>
        {order.items.map((i, idx) => (
          <Text key={idx} style={font.small}>{i.emoji} {i.qty}× {i.name}</Text>
        ))}
      </View>
      {order.status === 'preparing' ? (
        <Button
          title="Mark ready for pickup"
          small
          variant="outline"
          icon="cube-outline"
          onPress={() => act(order.id, 'ready')}
          style={{ marginTop: spacing(3) }}
        />
      ) : null}
      {order.status === 'ready' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginTop: spacing(3) }}>
          <Ionicons name="bicycle" size={16} color={colors.purple} />
          <Text style={[font.small, { color: colors.purple, fontWeight: '700' }]}>Waiting for driver pickup…</Text>
        </View>
      ) : null}
      {['driver_assigned', 'picked_up', 'en_route'].includes(order.status) && order.driverName ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginTop: spacing(3) }}>
          <Ionicons name="car" size={16} color={colors.accent} />
          <Text style={[font.small, { color: colors.accent, fontWeight: '700' }]}>
            {order.driverName} {order.status === 'picked_up' ? 'picked up — en route' : 'is on the way'}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

export default function StoreOrders() {
  const orders = useApp((s) => s.storeOrders);
  const open = useApp((s) => s.storeOpen);
  const paused = useApp((s) => s.storePaused);
  const store = STORES.find((s) => s.id === MY_STORE_ID)!;

  const fresh = orders.filter((o) => o.status === 'placed');
  const active = orders.filter((o) => ['accepted', 'preparing', 'ready', 'driver_assigned', 'picked_up', 'en_route'].includes(o.status));
  const done = orders.filter((o) => ['delivered', 'rejected', 'cancelled'].includes(o.status)).slice(0, 8);

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={font.h2}>{store.emoji} {store.name}</Text>
          <Text style={font.small}>Store dashboard</Text>
        </View>
        <Badge
          label={!open ? 'CLOSED' : paused ? 'PAUSED' : 'OPEN'}
          color={!open || paused ? colors.red : colors.accent}
          soft={!open || paused ? colors.redSoft : colors.accentSoft}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 80 }}>
        {fresh.length ? (
          <>
            <Text style={styles.section}>{`New (${fresh.length})`}</Text>
            {fresh.map((o) => <NewOrderCard key={o.id} order={o} />)}
          </>
        ) : null}

        <Text style={styles.section}>{`In progress (${active.length})`}</Text>
        {active.length ? active.map((o) => <ActiveOrderCard key={o.id} order={o} />) : (
          <Card>
            <EmptyState
              emoji={open ? '😴' : '🔒'}
              title={open ? 'No active orders' : 'Store is closed'}
              body={open ? 'New orders will appear here in real time.' : 'Open the store in Settings to receive orders.'}
            />
          </Card>
        )}

        {done.length ? (
          <>
            <Text style={styles.section}>Completed today</Text>
            <Card pad={false}>
              {done.map((o, i) => (
                <View key={o.id}>
                  {i > 0 ? <Divider /> : null}
                  <View style={styles.doneRow}>
                    <Text style={font.body}>{orderNo(o.id)}</Text>
                    <Text style={[font.small, { flex: 1 }]} numberOfLines={1}>{o.customerName}</Text>
                    <Badge
                      label={STATUS_LABEL[o.status]}
                      color={STATUS_COLOR[o.status]}
                      soft={o.status === 'delivered' ? colors.accentSoft : colors.redSoft}
                    />
                    <Text style={font.body}>{money(o.total)}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  section: { ...font.h3, marginBottom: spacing(2), marginTop: spacing(2) },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    padding: spacing(3),
  },
});
