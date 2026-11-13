import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../stores/app';
import { colors, font, spacing } from '../../theme';
import { clock, money, orderNo, STATUS_COLOR, STATUS_LABEL } from '../../lib/format';
import { Badge, Card, Chip, Divider, EmptyState } from '../../components/ui';

const FILTERS = ['all', 'live', 'delivered', 'problem'] as const;
const LIVE = ['placed', 'accepted', 'preparing', 'ready', 'driver_assigned', 'picked_up', 'en_route'];

export default function AdminOrders() {
  const orders = useApp((s) => s.orders);
  const storeOrders = useApp((s) => s.storeOrders);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  const all = useMemo(() => {
    let list = [...orders, ...storeOrders].sort((a, b) => b.placedAt - a.placedAt);
    if (filter === 'live') list = list.filter((o) => LIVE.includes(o.status));
    if (filter === 'delivered') list = list.filter((o) => o.status === 'delivered');
    if (filter === 'problem') list = list.filter((o) => ['rejected', 'cancelled'].includes(o.status));
    return list;
  }, [orders, storeOrders, filter]);

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <Text style={[font.h2, { padding: spacing(4), paddingBottom: spacing(2) }]}>All orders</Text>
      <View style={{ flexDirection: 'row', gap: spacing(2), paddingHorizontal: spacing(4), paddingBottom: spacing(2) }}>
        {FILTERS.map((f) => (
          <Chip key={f} label={{ all: 'All', live: 'Live', delivered: 'Delivered', problem: '⚠️ Issues' }[f]} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 80 }}>
        <Card pad={false}>
          {all.map((o, i) => (
            <View key={o.id}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2) }}>
                    <Text style={font.h3}>{orderNo(o.id)}</Text>
                    <Badge label={STATUS_LABEL[o.status]} color={STATUS_COLOR[o.status]} soft={colors.blueSoft} />
                  </View>
                  <Text style={font.small} numberOfLines={1}>
                    {o.storeName} → {o.customerName}
                  </Text>
                  <Text style={font.tiny}>
                    {clock(o.placedAt)} · {o.items.reduce((s, x) => s + x.qty, 0)} items
                    {o.driverName ? ` · ${o.driverName}` : ''}
                  </Text>
                </View>
                <Text style={font.h3}>{money(o.total)}</Text>
              </View>
            </View>
          ))}
          {!all.length ? <EmptyState emoji="📭" title="No orders in this view" /> : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), padding: spacing(3.5) },
});
