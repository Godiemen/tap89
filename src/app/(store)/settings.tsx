import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, MY_STORE_ID } from '../../stores/app';
import { colors, font, radius, spacing } from '../../theme';
import { Badge, Card, Divider } from '../../components/ui';

const PREP_OPTIONS = [10, 15, 20, 30];

export default function StoreSettings() {
  const open = useApp((s) => s.storeOpen);
  const paused = useApp((s) => s.storePaused);
  const prepTime = useApp((s) => s.prepTimeMin);
  const toggleOpen = useApp((s) => s.toggleStoreOpen);
  const togglePaused = useApp((s) => s.toggleStorePaused);
  const setPrepTime = useApp((s) => s.setPrepTime);
  const setRole = useApp((s) => s.setRole);
  const store = useApp((s) => s.stores.find((x) => x.id === MY_STORE_ID));

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 80 }}>
        <Text style={font.h2}>Settings</Text>
        <Text style={font.small}>{store?.emoji} {store?.name} · {store?.address}</Text>

        {/* status */}
        <Card style={{ marginTop: spacing(3), gap: spacing(3) }}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>Store open</Text>
              <Text style={font.small}>{open ? 'Customers can order' : 'Hidden from the app'}</Text>
            </View>
            <Switch value={open} onValueChange={toggleOpen} trackColor={{ true: colors.accent }} thumbColor="#fff" />
          </View>
          <Divider />
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>Pause new orders</Text>
              <Text style={font.small}>Stay visible but stop incoming orders</Text>
            </View>
            <Switch value={paused} onValueChange={togglePaused} trackColor={{ true: colors.accent }} thumbColor="#fff" />
          </View>
        </Card>

        {/* prep time */}
        <Card style={{ marginTop: spacing(3) }}>
          <Text style={font.h3}>Estimated prep time</Text>
          <Text style={font.small}>Shown to customers as part of delivery ETA</Text>
          <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: spacing(3) }}>
            {PREP_OPTIONS.map((m) => (
              <Pressable
                key={m}
                onPress={() => setPrepTime(m)}
                style={[styles.prepBtn, prepTime === m && { backgroundColor: colors.ink }]}
              >
                <Text style={[font.h3, { color: prepTime === m ? '#fff' : colors.ink }]}>{m} min</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* compliance */}
        <Card style={{ marginTop: spacing(3) }}>
          <Text style={[font.h3, { marginBottom: spacing(2) }]}>Alcohol compliance</Text>
          {[
            'Liquor license #LL-2041-88 — valid until Dec 2026',
            'All drivers must verify customer ID at drop-off',
            'No deliveries to intoxicated customers',
            'Delivery hours restricted: 9am – 11pm',
          ].map((t) => (
            <View key={t} style={{ flexDirection: 'row', gap: spacing(2), paddingVertical: spacing(1) }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
              <Text style={[font.small, { flex: 1 }]}>{t}</Text>
            </View>
          ))}
        </Card>

        {/* payout */}
        <Card style={{ marginTop: spacing(3), flexDirection: 'row', alignItems: 'center', gap: spacing(3) }}>
          <Ionicons name="wallet-outline" size={20} color={colors.ink} />
          <View style={{ flex: 1 }}>
            <Text style={font.h3}>Payouts</Text>
            <Text style={font.small}>Weekly · Bank •••• 4410 · next payout R1,240</Text>
          </View>
          <Badge label="ON TIME" />
        </Card>

        <Card style={{ marginTop: spacing(3), flexDirection: 'row', alignItems: 'center', gap: spacing(3), backgroundColor: colors.ink }}>
          <Ionicons name="swap-horizontal" size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={[font.h3, { color: '#fff' }]}>Prototype: switch role</Text>
            <Text style={[font.small, { color: '#aaa' }]}>Try customer, driver & admin</Text>
          </View>
          <Text
            style={[font.small, { color: '#fff', fontWeight: '700' }]}
            onPress={() => { setRole(null); router.replace('/'); }}
          >
            Switch →
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  prepBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
  },
});
