import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../stores/app';
import { colors, font, spacing } from '../../theme';
import { money, timeAgo } from '../../lib/format';
import { Badge, Card, Divider } from '../../components/ui';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK = [38.4, 52.1, 44.0, 61.75, 88.3, 102.4, 47.35];

export default function Earnings() {
  const earnings = useApp((s) => s.driverEarnings);
  const trips = useApp((s) => s.trips);
  const weekTotal = WEEK.reduce((a, b) => a + b, 0) + earnings;
  const max = Math.max(...WEEK, earnings);

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 80 }}>
        <Text style={font.small}>THIS WEEK</Text>
        <Text style={[font.h1, { fontSize: 40 }]}>{money(weekTotal)}</Text>
        <Text style={[font.small, { color: colors.accent }]}>▲ 12% vs last week</Text>

        {/* bar chart */}
        <Card style={{ marginTop: spacing(4) }}>
          <Text style={[font.h3, { marginBottom: spacing(3) }]}>Daily earnings</Text>
          <View style={styles.chart}>
            {WEEK.map((v, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: `${(v / max) * 100}%` }]} />
                <Text style={font.tiny}>{DAYS[i]}</Text>
              </View>
            ))}
            <View style={styles.barCol}>
              <View style={[styles.bar, { height: `${(earnings / max) * 100}%`, backgroundColor: colors.accent }]} />
              <Text style={[font.tiny, { color: colors.accent }]}>Now</Text>
            </View>
          </View>
        </Card>

        {/* boosts */}
        <Card style={{ marginTop: spacing(3), flexDirection: 'row', alignItems: 'center', gap: spacing(3) }}>
          <Text style={{ fontSize: 24 }}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={font.h3}>Surge earnings</Text>
            <Text style={font.small}>Downtown core · 1.5x until 9pm</Text>
          </View>
          <Badge label="+R14.20" />
        </Card>

        {/* trips */}
        <Text style={[font.h3, { marginTop: spacing(4), marginBottom: spacing(2) }]}>Recent trips</Text>
        <Card pad={false}>
          {trips.map((t, i) => (
            <View key={t.id}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.tripRow}>
                <View style={styles.tripIcon}>
                  <Ionicons name="bicycle" size={16} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={font.h3}>{t.storeName}</Text>
                  <Text style={font.small}>{t.customerAddress} · {timeAgo(t.at)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={font.h3}>{money(t.payout + t.tip)}</Text>
                  {t.rating ? <Text style={font.small}>★ {t.rating}</Text> : null}
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* cashout */}
        <Card style={{ marginTop: spacing(3), flexDirection: 'row', alignItems: 'center', gap: spacing(3), backgroundColor: colors.ink }}>
          <Ionicons name="flash" size={20} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[font.h3, { color: '#fff' }]}>Instant cash out</Text>
            <Text style={[font.small, { color: '#aaa' }]}>{money(weekTotal)} available</Text>
          </View>
          <Text style={[font.small, { color: colors.accent, fontWeight: '800' }]}>CASH OUT</Text>
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
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), padding: spacing(3.5) },
  tripIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
