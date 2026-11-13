import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../stores/app';
import { STORES } from '../../data/mock';
import { colors, font, radius, spacing } from '../../theme';
import { km, money } from '../../lib/format';
import { Badge, Button, Card, Divider } from '../../components/ui';
import SimMap from '../../components/SimMap';

const SURGE_ZONES = [
  { x: 45, y: 55, r: 14, mult: 1.5 },
  { x: 78, y: 55, r: 10, mult: 1.3 },
];

function RequestCard() {
  const req = useApp((s) => s.incomingRequest);
  const acceptRequest = useApp((s) => s.acceptRequest);
  const declineRequest = useApp((s) => s.declineRequest);
  if (!req) return null;
  const pct = req.expiresIn / 15;
  return (
    <View style={styles.requestWrap}>
      <Card style={styles.requestCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Badge label={req.surge > 1 ? `⚡ ${req.surge.toFixed(1)}x SURGE` : 'DELIVERY REQUEST'} color={req.surge > 1 ? colors.amber : colors.purple} soft={req.surge > 1 ? colors.amberSoft : colors.purpleSoft} />
          <View style={styles.countdown}>
            <Text style={[font.h3, { color: pct < 0.3 ? colors.red : colors.ink }]}>{Math.ceil(req.expiresIn)}s</Text>
          </View>
        </View>

        <Text style={[font.h1, { marginTop: spacing(2) }]}>{money(req.payout)}</Text>
        <Text style={font.small}>includes estimated tip</Text>

        <View style={{ marginTop: spacing(3), gap: spacing(2.5) }}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: colors.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={font.tiny}>PICK UP</Text>
              <Text style={font.h3}>{req.storeName}</Text>
              <Text style={font.small}>{req.storeAddress}</Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: colors.blue }]} />
            <View style={{ flex: 1 }}>
              <Text style={font.tiny}>DROP OFF</Text>
              <Text style={font.body}>{req.customerAddress}</Text>
            </View>
          </View>
        </View>

        <Divider />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(2) }}>
          <Text style={font.small}>{km(req.distanceKm)} trip</Text>
          <Text style={font.small}>{req.items} item{req.items > 1 ? 's' : ''} · alcohol (ID check)</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing(2) }}>
          <Button title="Decline" variant="ghost" onPress={declineRequest} style={{ flex: 1 }} />
          <Button
            title="Accept"
            variant="accent"
            icon="checkmark"
            style={{ flex: 2 }}
            onPress={() => {
              acceptRequest();
              router.push('/(driver)/delivery' as any);
            }}
          />
        </View>
      </Card>
    </View>
  );
}

export default function DriverDash() {
  const online = useApp((s) => s.driverOnline);
  const setOnline = useApp((s) => s.setDriverOnline);
  const driverPos = useApp((s) => s.driverPos);
  const activeDelivery = useApp((s) => s.activeDelivery);
  const earnings = useApp((s) => s.driverEarnings);
  const trips = useApp((s) => s.trips);
  const surge = useApp((s) => s.surge);

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <View style={styles.header}>
        <Text style={font.h2}>Driver Dash</Text>
        <Badge label={online ? '🟢 ONLINE' : '⚫ OFFLINE'} color={online ? colors.accent : colors.sub} soft={online ? colors.accentSoft : colors.bg} />
      </View>

      <View style={{ flex: 1, margin: spacing(4), gap: spacing(3) }}>
        <SimMap
          height={280}
          markers={[
            ...(online ? STORES.filter((s) => s.open).slice(0, 5).map((s) => ({ ...s.pos, emoji: s.emoji })) : []),
          ]}
          driver={{ x: driverPos.x, y: driverPos.y }}
          surgeZones={online ? SURGE_ZONES : []}
        />

        {activeDelivery ? (
          <Pressable onPress={() => router.push('/(driver)/delivery' as any)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), borderWidth: 1.5, borderColor: colors.accent }}>
              <Text style={{ fontSize: 24 }}>📦</Text>
              <View style={{ flex: 1 }}>
                <Text style={font.h3}>Delivery in progress</Text>
                <Text style={font.small}>{activeDelivery.storeName} → {activeDelivery.customerAddress}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.sub} />
            </Card>
          </Pressable>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing(3) }}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={font.tiny}>TODAY</Text>
            <Text style={[font.h1, { fontSize: 24 }]}>{money(earnings)}</Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={font.tiny}>TRIPS</Text>
            <Text style={[font.h1, { fontSize: 24 }]}>{trips.length}</Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={font.tiny}>SURGE</Text>
            <Text style={[font.h1, { fontSize: 24, color: surge > 1 ? colors.amber : colors.ink }]}>{surge.toFixed(1)}x</Text>
          </Card>
        </View>

        {online && !activeDelivery && !useApp.getState().incomingRequest ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3) }}>
            <Ionicons name="radio" size={18} color={colors.accent} />
            <Text style={[font.body, { flex: 1 }]}>Listening for delivery requests…</Text>
          </Card>
        ) : null}
      </View>

      {/* go online/offline */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => setOnline(!online)}
          style={[styles.powerBtn, { backgroundColor: online ? colors.red : colors.accent }]}
        >
          <Ionicons name="power" size={20} color="#fff" />
          <Text style={[font.h3, { color: '#fff' }]}>{online ? 'Go offline' : 'Go online'}</Text>
        </Pressable>
      </View>

      <RequestCard />
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
  footer: { padding: spacing(4), paddingTop: 0 },
  powerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    paddingVertical: spacing(4),
    borderRadius: radius.pill,
  },
  requestWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: spacing(4),
    paddingBottom: spacing(8),
  },
  requestCard: { padding: spacing(4) },
  countdown: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing(3) },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  routeLine: { width: 2, height: 14, backgroundColor: colors.line, marginLeft: 5 },
});
