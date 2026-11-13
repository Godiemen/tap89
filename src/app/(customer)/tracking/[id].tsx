import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../stores/app';
import { colors, font, spacing } from '../../../theme';
import { clock, money, orderNo, STATUS_COLOR, STATUS_LABEL } from '../../../lib/format';
import { Avatar, Badge, Card, Progress, RateRow } from '../../../components/ui';
import SimMap from '../../../components/SimMap';
import { Header } from '../cart';
import { OrderStatus } from '../../../lib/types';

const STEPS: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'driver_assigned', 'picked_up', 'en_route', 'delivered'];

export default function Tracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useApp((s) => s.orders.find((o) => o.id === id));
  const rateOrder = useApp((s) => s.rateOrder);

  if (!order) {
    return (
      <SafeAreaView style={styles.wrap}>
        <Header title="Order" />
        <Text style={[font.body, { padding: spacing(4) }]}>Order not found.</Text>
      </SafeAreaView>
    );
  }

  const stepIdx = STEPS.indexOf(order.status);
  const done = order.status === 'delivered';
  const dead = ['rejected', 'cancelled'].includes(order.status);
  const remaining = order.status === 'en_route' && order.driverProgress !== undefined
    ? Math.max(1, Math.ceil((1 - order.driverProgress) * 20))
    : order.etaMinutes;

  return (
    <SafeAreaView style={styles.wrap}>
      <Header title={`Order ${orderNo(order.id)}`} />
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 40 }}>
        {/* map */}
        <View style={{ marginBottom: spacing(3) }}>
          <SimMap
            height={190}
            markers={[
              { ...order.storePos, emoji: '🏪', label: order.storeName },
              { ...order.customerPos, emoji: '🏠', label: 'You' },
            ]}
            route={{ from: order.storePos, to: order.customerPos, progress: order.driverProgress }}
            driver={order.driverPos ? { x: order.driverPos.x, y: order.driverPos.y } : undefined}
          />
        </View>

        {/* status hero */}
        <Card style={{ marginBottom: spacing(3), alignItems: 'center' }}>
          {dead ? (
            <>
              <Text style={{ fontSize: 36 }}>😞</Text>
              <Text style={[font.h2, { marginTop: spacing(2) }]}>{STATUS_LABEL[order.status]}</Text>
              <Text style={font.small}>{'You won\u2019t be charged.'}</Text>
            </>
          ) : done ? (
            <>
              <Text style={{ fontSize: 36 }}>🎉</Text>
              <Text style={[font.h2, { marginTop: spacing(2) }]}>Delivered!</Text>
              <Text style={font.small}>Enjoy responsibly 🥂</Text>
            </>
          ) : (
            <>
              <Badge label={STATUS_LABEL[order.status].toUpperCase()} color={STATUS_COLOR[order.status]} soft={colors.blueSoft} />
              <Text style={[font.h1, { fontSize: 40, marginTop: spacing(2) }]}>
                {order.status === 'en_route' ? `${remaining} min` : 'Soon'}
              </Text>
              <Text style={font.small}>
                {order.status === 'en_route' ? 'estimated arrival' : 'your driver will be assigned shortly'}
              </Text>
            </>
          )}
          <View style={{ alignSelf: 'stretch', marginTop: spacing(3) }}>
            <Progress value={dead ? 0 : Math.max(0.04, stepIdx / (STEPS.length - 1))} color={dead ? colors.red : colors.accent} />
          </View>
        </Card>

        {/* driver */}
        {order.driverName && !dead ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginBottom: spacing(3) }}>
            <Avatar name={order.driverName} color={colors.purple} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>{order.driverName}</Text>
              <Text style={font.small}>Your SipDash driver</Text>
            </View>
            <View style={styles.driverBtn}><Ionicons name="call" size={16} color={colors.accent} /></View>
            <View style={styles.driverBtn}><Ionicons name="chatbubble" size={16} color={colors.accent} /></View>
          </Card>
        ) : null}

        {/* rating */}
        {done && order.rating === undefined ? (
          <Card style={{ alignItems: 'center', marginBottom: spacing(3), gap: spacing(2) }}>
            <Text style={font.h3}>Rate your delivery</Text>
            <RateRow value={0} onRate={(n) => rateOrder(order.id, n)} />
          </Card>
        ) : null}

        {/* items */}
        <Card style={{ marginBottom: spacing(3) }}>
          <Text style={[font.h3, { marginBottom: spacing(2) }]}>{order.storeName}</Text>
          {order.items.map((i, idx) => (
            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
              <Text style={font.body}>{i.emoji} {i.qty}× {i.name}</Text>
              <Text style={font.body}>{money(i.price * i.qty)}</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.line, marginVertical: spacing(2) }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={font.h3}>Total</Text>
            <Text style={font.h3}>{money(order.total)}</Text>
          </View>
        </Card>

        {/* timeline */}
        <Card>
          <Text style={[font.h3, { marginBottom: spacing(3) }]}>Timeline</Text>
          {order.timeline.slice().reverse().map((t, i) => (
            <View key={i} style={styles.tlRow}>
              <View style={[styles.tlDot, { backgroundColor: STATUS_COLOR[t.status] ?? colors.sub }]} />
              <Text style={[font.body, { flex: 1 }]}>{STATUS_LABEL[t.status]}</Text>
              <Text style={font.small}>{clock(t.at)}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  driverBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), paddingVertical: spacing(1.5) },
  tlDot: { width: 10, height: 10, borderRadius: 5 },
});
