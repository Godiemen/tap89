import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../stores/app';
import { colors, font, radius, spacing } from '../../theme';
import { money } from '../../lib/format';
import { Avatar, Badge, Card, Divider } from '../../components/ui';

const SURGE_STEPS = [1.0, 1.25, 1.5, 2.0];
const FEE_STEPS = [15, 22, 28];

export default function AdminMore() {
  const customers = useApp((s) => s.adminCustomers);
  const suspendCustomer = useApp((s) => s.suspendCustomer);
  const promos = useApp((s) => s.promos);
  const togglePromo = useApp((s) => s.togglePromo);
  const surge = useApp((s) => s.surge);
  const setSurge = useApp((s) => s.setSurge);
  const fee = useApp((s) => s.platformFeePct);
  const setPlatformFee = useApp((s) => s.setPlatformFee);
  const setRole = useApp((s) => s.setRole);

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 80 }}>
        <Text style={font.h2}>Platform controls</Text>

        {/* surge */}
        <Card style={{ marginTop: spacing(3) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2) }}>
            <Text style={{ fontSize: 18 }}>⚡</Text>
            <Text style={font.h3}>Surge pricing</Text>
            <Badge label={`${surge.toFixed(2)}x`} color={surge > 1 ? colors.amber : colors.sub} soft={surge > 1 ? colors.amberSoft : colors.bg} />
          </View>
          <Text style={font.small}>Multiplies delivery fees city-wide. Customers and drivers see it instantly.</Text>
          <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: spacing(3) }}>
            {SURGE_STEPS.map((v) => (
              <Pressable key={v} onPress={() => setSurge(v)} style={[styles.pill, surge === v && { backgroundColor: colors.ink }]}>
                <Text style={[font.h3, { color: surge === v ? '#fff' : colors.ink }]}>{v}x</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* platform fee */}
        <Card style={{ marginTop: spacing(3) }}>
          <Text style={font.h3}>Platform commission</Text>
          <Text style={font.small}>{'SipDash\u2019s cut of each order\u2019s subtotal'}</Text>
          <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: spacing(3) }}>
            {FEE_STEPS.map((v) => (
              <Pressable key={v} onPress={() => setPlatformFee(v)} style={[styles.pill, fee === v && { backgroundColor: colors.ink }]}>
                <Text style={[font.h3, { color: fee === v ? '#fff' : colors.ink }]}>{v}%</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* promos */}
        <Text style={styles.section}>Promo codes</Text>
        <Card pad={false}>
          {promos.map((p, i) => (
            <View key={p.code}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2) }}>
                    <Text style={font.h3}>{p.code}</Text>
                    <Badge label={p.type === 'percent' ? `${p.value}% off` : p.type === 'flat' ? `${money(p.value)} off` : 'Free del.'} />
                  </View>
                  <Text style={font.small}>{p.description} · {p.uses} uses</Text>
                </View>
                <Switch value={p.active} onValueChange={() => togglePromo(p.code)} trackColor={{ true: colors.accent }} thumbColor="#fff" />
              </View>
            </View>
          ))}
        </Card>

        {/* customers */}
        <Text style={styles.section}>Customers</Text>
        <Card pad={false}>
          {customers.map((c, i) => (
            <View key={c.id}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.row}>
                <Avatar name={c.name} color={c.status === 'active' ? colors.blue : colors.sub} size={36} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2) }}>
                    <Text style={font.h3}>{c.name}</Text>
                    {c.ageVerified ? <Badge label="21+" /> : <Badge label="UNVERIFIED" color={colors.red} soft={colors.redSoft} />}
                  </View>
                  <Text style={font.small}>{c.orders} orders · {money(c.spent)} spent · joined {c.joined}</Text>
                </View>
                <Pressable onPress={() => suspendCustomer(c.id)}>
                  <Badge
                    label={c.status === 'active' ? 'ACTIVE' : 'SUSPENDED'}
                    color={c.status === 'active' ? colors.accent : colors.red}
                    soft={c.status === 'active' ? colors.accentSoft : colors.redSoft}
                  />
                </Pressable>
              </View>
            </View>
          ))}
        </Card>

        {/* broadcast */}
        <Card style={{ marginTop: spacing(3), flexDirection: 'row', alignItems: 'center', gap: spacing(3) }}>
          <Ionicons name="megaphone" size={20} color={colors.purple} />
          <View style={{ flex: 1 }}>
            <Text style={font.h3}>Push notification broadcast</Text>
            <Text style={font.small}>Send a promo to all customers</Text>
          </View>
          <Badge label="DRAFT" color={colors.purple} soft={colors.purpleSoft} />
        </Card>

        <Card style={{ marginTop: spacing(3), flexDirection: 'row', alignItems: 'center', gap: spacing(3), backgroundColor: colors.ink }}>
          <Ionicons name="swap-horizontal" size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={[font.h3, { color: '#fff' }]}>Prototype: switch role</Text>
            <Text style={[font.small, { color: '#aaa' }]}>Try customer, driver & store</Text>
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
  section: { ...font.h3, marginTop: spacing(4), marginBottom: spacing(2) },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), padding: spacing(3.5) },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
  },
});
