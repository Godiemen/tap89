import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, distKm } from '../../stores/app';
import { colors, font, spacing } from '../../theme';
import { km, money, orderNo } from '../../lib/format';
import { Badge, Button, Card } from '../../components/ui';
import SimMap from '../../components/SimMap';

const STAGE_LABEL: Record<string, { title: string; sub: string }> = {
  to_store: { title: 'Heading to store', sub: 'Drive to the pickup location' },
  at_store: { title: 'At the store', sub: 'Collect the order from staff' },
  to_customer: { title: 'Delivering', sub: 'Drive to the customer — verify ID at drop-off 🪪' },
  at_customer: { title: 'At drop-off', sub: 'Check ID, then complete delivery' },
};

export default function Delivery() {
  const order = useApp((s) => s.activeDelivery);
  const stage = useApp((s) => s.deliveryStage);
  const driverPos = useApp((s) => s.driverPos);
  const confirmPickup = useApp((s) => s.confirmPickup);
  const completeDelivery = useApp((s) => s.completeDelivery);

  if (!order || !stage) {
    return (
      <SafeAreaView style={styles.wrap}>
        <View style={{ padding: spacing(4) }}>
          <Text style={font.h2}>No active delivery</Text>
          <Button title="Back to dash" onPress={() => router.back()} style={{ marginTop: spacing(4) }} />
        </View>
      </SafeAreaView>
    );
  }

  const target = stage === 'to_store' || stage === 'at_store' ? order.storePos : order.customerPos;
  const info = STAGE_LABEL[stage];
  const dist = distKm(order.storePos, order.customerPos);
  const estPayout = 3.5 + dist * 1.9 + order.tip;

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 140 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(3) }}>
          <View>
            <Text style={font.h2}>{info.title}</Text>
            <Text style={font.small}>{info.sub}</Text>
          </View>
          <Badge label={orderNo(order.id)} color={colors.purple} soft={colors.purpleSoft} />
        </View>

        <View style={{ marginBottom: spacing(3) }}>
          <SimMap
            height={230}
            markers={[
              { ...order.storePos, emoji: '🏪', label: order.storeName },
              { ...order.customerPos, emoji: '🏠', label: 'Customer' },
            ]}
            route={{ from: driverPos, to: target }}
            driver={{ x: driverPos.x, y: driverPos.y }}
          />
        </View>

        {/* legs */}
        <Card style={{ marginBottom: spacing(3), gap: spacing(3) }}>
          <View style={styles.legRow}>
            <View style={[styles.legDot, { backgroundColor: colors.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={font.tiny}>PICK UP · {order.items.length || '—'} items</Text>
              <Text style={font.h3}>{order.storeName}</Text>
              <Text style={font.small}>{stage === 'at_store' ? 'Show order number to staff' : 'Head to the store'}</Text>
            </View>
            {stage === 'at_store' || stage === 'to_customer' || stage === 'at_customer' ? (
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing(3) }}>
            <View style={[styles.legDot, { backgroundColor: colors.blue }]} />
            <View style={{ flex: 1 }}>
              <Text style={font.tiny}>DROP OFF · ID CHECK REQUIRED</Text>
              <Text style={font.h3}>{order.customerAddress}</Text>
              <Text style={font.small}>Verify customer is 21+ before handing over</Text>
            </View>
          </View>
        </Card>

        {/* payout */}
        <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={font.tiny}>ESTIMATED PAYOUT</Text>
            <Text style={font.h1}>{money(estPayout)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={font.small}>{km(dist)} trip</Text>
            <Text style={font.small}>{money(order.tip)} tip included</Text>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        {stage === 'at_store' ? (
          <Button title="Confirm pickup 📦" variant="accent" onPress={confirmPickup} style={{ flex: 1 }} />
        ) : stage === 'at_customer' ? (
          <Button title="ID verified — complete delivery ✅" variant="accent" onPress={() => { completeDelivery(); router.back(); }} style={{ flex: 1 }} />
        ) : (
          <Card style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing(2), justifyContent: 'center' }}>
            <Ionicons name="navigate" size={16} color={colors.accent} />
            <Text style={font.h3}>Navigating…</Text>
          </Card>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  legRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing(3) },
  legDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing(4),
    paddingBottom: spacing(6),
    flexDirection: 'row',
  },
});
