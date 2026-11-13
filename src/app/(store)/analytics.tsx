import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../stores/app';
import { colors, font, spacing } from '../../theme';
import { money } from '../../lib/format';
import { Badge, Card, Divider } from '../../components/ui';

const WEEK = [182, 240, 210, 305, 488, 612, 320];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TOP = [
  { name: 'Bourbon Whiskey', emoji: '🥃', sold: 34, revenue: 1189.66 },
  { name: 'Single Malt Scotch', emoji: '🥃', sold: 12, revenue: 719.88 },
  { name: 'Prosecco', emoji: '🍾', sold: 28, revenue: 447.72 },
  { name: 'Cabernet Sauvignon', emoji: '🍷', sold: 21, revenue: 398.79 },
];

export default function Analytics() {
  const orders = useApp((s) => s.storeOrders);
  const live = orders.filter((o) => o.status === 'delivered');
  const liveRevenue = live.reduce((s, o) => s + o.total, 0);
  const todayRevenue = 320 + liveRevenue;
  const max = Math.max(...WEEK, todayRevenue);

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 80 }}>
        <Text style={font.h2}>Analytics</Text>
        <Text style={font.small}>The Whiskey Barrel · this week</Text>

        <View style={{ flexDirection: 'row', gap: spacing(3), marginTop: spacing(3) }}>
          <Card style={{ flex: 1 }}>
            <Text style={font.tiny}>SALES</Text>
            <Text style={[font.h1, { fontSize: 22 }]}>{money(2577 + liveRevenue)}</Text>
            <Text style={[font.small, { color: colors.accent }]}>▲ 9%</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Text style={font.tiny}>ORDERS</Text>
            <Text style={[font.h1, { fontSize: 22 }]}>{126 + live.length}</Text>
            <Text style={[font.small, { color: colors.accent }]}>▲ 4%</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Text style={font.tiny}>RATING</Text>
            <Text style={[font.h1, { fontSize: 22 }]}>4.8★</Text>
            <Text style={font.small}>1,240 reviews</Text>
          </Card>
        </View>

        <Card style={{ marginTop: spacing(3) }}>
          <Text style={[font.h3, { marginBottom: spacing(3) }]}>Daily sales</Text>
          <View style={styles.chart}>
            {WEEK.map((v, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: `${(v / max) * 100}%` }]} />
                <Text style={font.tiny}>{DAYS[i]}</Text>
              </View>
            ))}
            <View style={styles.barCol}>
              <View style={[styles.bar, { height: `${(todayRevenue / max) * 100}%`, backgroundColor: colors.accent }]} />
              <Text style={[font.tiny, { color: colors.accent }]}>Now</Text>
            </View>
          </View>
        </Card>

        <Text style={[font.h3, { marginTop: spacing(4), marginBottom: spacing(2) }]}>Top sellers</Text>
        <Card pad={false}>
          {TOP.map((t, i) => (
            <View key={t.name}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.topRow}>
                <Text style={[font.small, { width: 18, fontWeight: '800' }]}>{i + 1}</Text>
                <Text style={{ fontSize: 20 }}>{t.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={font.h3}>{t.name}</Text>
                  <Text style={font.small}>{t.sold} sold</Text>
                </View>
                <Text style={font.h3}>{money(t.revenue)}</Text>
              </View>
            </View>
          ))}
        </Card>

        <Card style={{ marginTop: spacing(3), flexDirection: 'row', alignItems: 'center', gap: spacing(3) }}>
          <Text style={{ fontSize: 22 }}>⏱</Text>
          <View style={{ flex: 1 }}>
            <Text style={font.h3}>Avg. prep time</Text>
            <Text style={font.small}>12 min · faster than 82% of stores</Text>
          </View>
          <Badge label="GREAT" />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: spacing(2) },
  barCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '70%', backgroundColor: colors.line, borderRadius: 4, minHeight: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), padding: spacing(3.5) },
});
