import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../stores/app';
import { colors, font, spacing } from '../../theme';
import { money, orderNo, STATUS_COLOR, STATUS_LABEL, timeAgo } from '../../lib/format';
import { Badge, Card, Divider, EmptyState } from '../../components/ui';
import { Order } from '../../lib/types';

const ACTIVE = ['placed', 'accepted', 'preparing', 'ready', 'driver_assigned', 'picked_up', 'en_route'];

function OrderCard({ order, live }: { order: Order; live?: boolean }) {
  return (
    <Pressable onPress={() => router.push(`/(customer)/tracking/${order.id}` as any)}>
      <Card style={{ marginBottom: spacing(3) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3) }}>
          <Text style={{ fontSize: 26 }}>{order.items[0]?.emoji ?? '🧾'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={font.h3} numberOfLines={1}>{order.storeName}</Text>
            <Text style={font.small}>
              {orderNo(order.id)} · {order.items.reduce((s, i) => s + i.qty, 0)} items · {timeAgo(order.placedAt)}
            </Text>
          </View>
          <Badge
            label={STATUS_LABEL[order.status]}
            color={STATUS_COLOR[order.status]}
            soft={order.status === 'delivered' ? colors.accentSoft : colors.blueSoft}
          />
        </View>
        <Divider />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing(3) }}>
          <Text style={font.small}>
            {order.items.slice(0, 2).map((i) => `${i.qty}× ${i.name}`).join(', ')}
            {order.items.length > 2 ? ` +${order.items.length - 2} more` : ''}
          </Text>
          <Text style={font.h3}>{money(order.total)}</Text>
        </View>
        {live ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginTop: spacing(2) }}>
            <View style={styles.liveDot} />
            <Text style={[font.small, { color: colors.accent, fontWeight: '700' }]}>Live — tap to track</Text>
          </View>
        ) : order.rating ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing(2) }}>
            <Ionicons name="star" size={12} color={colors.amber} />
            <Text style={font.small}>You rated {order.rating}/5</Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

export default function Orders() {
  const orders = useApp((s) => s.orders);
  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const past = orders.filter((o) => !ACTIVE.includes(o.status));

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <Text style={[font.h1, { padding: spacing(4), paddingBottom: 0 }]}>Orders</Text>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 80 }}>
        {active.length ? (
          <>
            <Text style={[font.h3, { marginBottom: spacing(3) }]}>Active</Text>
            {active.map((o) => <OrderCard key={o.id} order={o} live />)}
          </>
        ) : null}
        <Text style={[font.h3, { marginBottom: spacing(3), marginTop: active.length ? spacing(2) : 0 }]}>Past orders</Text>
        {past.map((o) => <OrderCard key={o.id} order={o} />)}
        {!past.length && !active.length ? (
          <EmptyState emoji="🧾" title="No orders yet" body="Your order history will appear here." />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
});
