import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../stores/app';
import { Role } from '../lib/types';
import { colors, font, radius, spacing } from '../theme';
import { Card } from '../components/ui';

const ROLES: { key: Role; title: string; desc: string; emoji: string; route: string; color: string }[] = [
  { key: 'customer', title: 'Customer', desc: 'Browse stores & order alcohol delivery', emoji: '🛒', route: '/(customer)', color: colors.accent },
  { key: 'driver', title: 'Driver', desc: 'Go online, accept deliveries, earn money', emoji: '🚗', route: '/(driver)', color: colors.purple },
  { key: 'store', title: 'Store', desc: 'Manage orders, menu & store operations', emoji: '🏪', route: '/(store)', color: colors.amber },
  { key: 'admin', title: 'Admin', desc: 'Oversee the entire platform', emoji: '📊', route: '/(admin)', color: colors.blue },
];

export default function RolePicker() {
  const setRole = useApp((s) => s.setRole);
  const ageVerified = useApp((s) => s.ageVerified);

  const choose = (r: (typeof ROLES)[number]) => {
    setRole(r.key);
    if (r.key === 'customer' && !ageVerified) {
      router.push('/age-gate');
    }
    router.push(r.route as any);
  };

  return (
    <SafeAreaView style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={{ fontSize: 34 }}>🍸</Text>
        </View>
        <Text style={[font.h1, { fontSize: 34 }]}>SipDash</Text>
        <Text style={[font.body, { color: colors.sub, marginTop: spacing(1) }]}>
          Alcohol delivery, in minutes.
        </Text>
        <View style={styles.protoBadge}>
          <Ionicons name="flask" size={12} color={colors.purple} />
          <Text style={[font.tiny, { color: colors.purple, fontWeight: '800' }]}>PROTOTYPE — ALL DATA SIMULATED</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {ROLES.map((r) => (
          <Pressable key={r.key} onPress={() => choose(r)}>
            <Card style={styles.roleCard}>
              <View style={[styles.roleEmoji, { backgroundColor: r.color + '1A' }]}>
                <Text style={{ fontSize: 30 }}>{r.emoji}</Text>
              </View>
              <Text style={font.h3}>{r.title}</Text>
              <Text style={[font.small, { marginTop: 2 }]}>{r.desc}</Text>
              <View style={styles.roleGo}>
                <Ionicons name="arrow-forward-circle" size={22} color={r.color} />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Text style={[font.tiny, { textAlign: 'center', color: colors.sub, marginTop: spacing(4) }]}>
        21+ only · Please drink responsibly
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: spacing(5) },
  header: { alignItems: 'center', marginTop: spacing(6), marginBottom: spacing(6) },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(3),
  },
  protoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.purpleSoft,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radius.pill,
    marginTop: spacing(3),
  },
  grid: { gap: spacing(3) },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  roleEmoji: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleGo: { marginLeft: 'auto' },
});
