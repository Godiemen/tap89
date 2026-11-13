import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../stores/app';
import { colors, font, spacing } from '../../theme';
import { clock, money, orderNo, STATUS_COLOR, STATUS_LABEL } from '../../lib/format';
import { Badge, Card } from '../../components/ui';
import SimMap from '../../components/SimMap';

const HOURS = ['9a', '11a', '1p', '3p', '5p', '7p', '9p'];
const ORDERS_BY_HOUR = [12, 18, 26, 22, 38, 64, 52];
const ACTIVE = ['placed', 'accepted', 'preparing', 'ready', 'driver_assigned', 'picked_up', 'en_route'];

export default function AdminDash() {
  const orders = useApp((s) => s.orders);
  const storeOrders = useApp((s) => s.storeOrders);
  const stores = useApp((s) => s.stores);
  const drivers = useApp((s) => s.adminDrivers);
  const surge = useApp((s) => s.surge);

  const allOrders = useMemo(() => [...orders, ...storeOrders], [orders, storeOrders]);
  const liveOrders = allOrders.filter((o) => ACTIVE.includes(o.status));
  const deliveredToday = allOrders.filter((o) => o.status === 'delivered').length + 108;
  const gmv = allOrders.reduce((s, o) => s + o.total, 0) + 6840;
  const onlineDrivers = drivers.filter((d) => d.online).length;

  const feed = useMemo(
    () =>
      allOrders
        .flatMap((o) => o.timeline.map((t) => ({ ...t, orderId: o.id, storeName: o.storeName })))
        .sort((a, b) => b.at - a.at)
        .slice(0, 8),
    [allOrders]
  );
  const maxHour = Math.max(...ORDERS_BY_HOUR);

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={font.h2}>SipDash Admin</Text>
          <Text style={font.small}>Platform overview · live</Text>
        </View>
        <Badge label={surge > 1 ? `⚡ SURGE ${surge}x` : 'NORMAL'} color={surge > 1 ? colors.amber : colors.accent} soft={surge > 1 ? colors.amberSoft : colors.accentSoft} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 80 }}>
        {/* KPI grid */}
        <View style={styles.kpiGrid}>
          {[
            { label: 'GMV TODAY', value: money(gmv), delta: '▲ 14%', icon: 'cash' as const },
            { label: 'ORDERS', value: `${deliveredToday}`, delta: '▲ 8%', icon: 'receipt' as const },
            { label: 'LIVE ORDERS', value: `${liveOrders.length}`, delta: 'now', icon: 'pulse' as const },
            { label: 'DRIVERS ON', value: `${onlineDrivers}/${drivers.length}`, delta: 'online', icon: 'car' as const },
          ].map((k) => (
            <Card key={k.label} style={styles.kpi}>
              <Ionicons name={k.icon} size={16} color={colors.sub} />
              <Text style={[font.h1, { fontSize: 22, marginTop: 4 }]}>{k.value}</Text>
              <Text style={font.tiny}>{k.label}</Text>
              <Text style={[font.tiny, { color: colors.accent }]}>{k.delta}</Text>
            </Card>
          ))}
        </View>

        {/* city map */}
        <Text style={styles.section}>Live city map</Text>
        <SimMap
          height={200}
          markers={[
            ...stores.filter((s) => s.approved).map((s) => ({ ...s.pos, emoji: s.emoji })),
            ...drivers.filter((d) => d.online).map((d) => ({ ...d.pos, color: d.avatarColor })),
          ]}
          surgeZones={surge > 1 ? [{ x: 50, y: 50, r: 18, mult: surge }] : []}
        />
        <View style={{ flexDirection: 'row', gap: spacing(3), marginTop: spacing(2) }}>
          <Text style={font.tiny}>🏪 {stores.filter((s) => s.approved).length} stores live</Text>
          <Text style={font.tiny}>● {onlineDrivers} drivers online</Text>
        </View>

        {/* orders by hour */}
        <Text style={styles.section}>Orders today</Text>
        <Card>
          <View style={styles.chart}>
            {ORDERS_BY_HOUR.map((v, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={font.tiny}>{v}</Text>
                <View style={[styles.bar, { height: `${(v / maxHour) * 82}%` }, i === ORDERS_BY_HOUR.length - 1 && { backgroundColor: colors.accent }]} />
                <Text style={font.tiny}>{HOURS[i]}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* live feed */}
        <Text style={styles.section}>Live activity</Text>
        <Card pad={false}>
          {feed.map((e, i) => (
            <View key={i} style={styles.feedRow}>
              <View style={[styles.feedDot, { backgroundColor: STATUS_COLOR[e.status] }]} />
              <View style={{ flex: 1 }}>
                <Text style={font.small}>
                  <Text style={{ fontWeight: '700' }}>{orderNo(e.orderId)}</Text> — {STATUS_LABEL[e.status]}
                </Text>
                <Text style={font.tiny}>{e.storeName}</Text>
              </View>
              <Text style={font.tiny}>{clock(e.at)}</Text>
            </View>
          ))}
          {!feed.length ? (
            <Text style={[font.small, { padding: spacing(4) }]}>No activity yet — place an order as a customer.</Text>
          ) : null}
        </Card>
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
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(3) },
  kpi: { width: '47%', flexGrow: 1 },
  section: { ...font.h3, marginTop: spacing(4), marginBottom: spacing(2) },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: spacing(2) },
  barCol: { flex: 1, alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '70%', backgroundColor: colors.line, borderRadius: 4, minHeight: 6 },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    padding: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  feedDot: { width: 10, height: 10, borderRadius: 5 },
});
