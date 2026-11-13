import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../stores/app';
import { colors, font, spacing } from '../../theme';
import { Avatar, Badge, Card, Divider } from '../../components/ui';

export default function DriverAccount() {
  const setRole = useApp((s) => s.setRole);
  const online = useApp((s) => s.driverOnline);

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 80 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginBottom: spacing(4) }}>
          <Avatar name="Marcus Chen" color={colors.purple} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={font.h2}>Marcus Chen</Text>
            <Text style={font.small}>Toyota Corolla · SDX-4821</Text>
          </View>
          <Badge label={online ? 'ONLINE' : 'OFFLINE'} color={online ? colors.accent : colors.sub} soft={online ? colors.accentSoft : colors.bg} />
        </View>

        <Card pad={false} style={{ marginBottom: spacing(4) }}>
          {[
            { icon: 'shield-checkmark-outline' as const, label: 'Documents', sub: "Driver's license, 21+ cert, insurance — verified" },
            { icon: 'car-outline' as const, label: 'Vehicle', sub: '2019 Toyota Corolla · SDX-4821' },
            { icon: 'card-outline' as const, label: 'Payout method', sub: 'Bank •••• 6789 · weekly + instant' },
            { icon: 'thermometer-outline' as const, label: 'Delivery bag', sub: 'Insulated cooler — required for alcohol' },
            { icon: 'school-outline' as const, label: 'Alcohol delivery training', sub: 'ID verification certified ✓' },
          ].map((row, i) => (
            <View key={row.label}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.linkRow}>
                <Ionicons name={row.icon} size={20} color={colors.ink} />
                <View style={{ flex: 1 }}>
                  <Text style={font.h3}>{row.label}</Text>
                  <Text style={font.small} numberOfLines={2}>{row.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.sub} />
              </View>
            </View>
          ))}
        </Card>

        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), backgroundColor: colors.ink }}>
          <Ionicons name="swap-horizontal" size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={[font.h3, { color: '#fff' }]}>Prototype: switch role</Text>
            <Text style={[font.small, { color: '#aaa' }]}>Try customer, store & admin</Text>
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
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), padding: spacing(3.5) },
});
