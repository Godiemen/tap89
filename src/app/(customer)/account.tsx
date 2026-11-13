import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../stores/app';
import { USER_ADDRESS } from '../../data/mock';
import { colors, font, spacing } from '../../theme';
import { timeAgo } from '../../lib/format';
import { Avatar, Badge, Card, Divider } from '../../components/ui';

export default function Account() {
  const userName = useApp((s) => s.userName);
  const ageVerified = useApp((s) => s.ageVerified);
  const notifications = useApp((s) => s.notifications);
  const markNotificationsRead = useApp((s) => s.markNotificationsRead);
  const setRole = useApp((s) => s.setRole);
  const orders = useApp((s) => s.orders);

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 80 }}>
        {/* profile */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginBottom: spacing(4) }}>
          <Avatar name={userName} color={colors.ink} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={font.h2}>{userName}</Text>
            <Text style={font.small}>jordan.b@mail.com · {orders.length} orders</Text>
          </View>
          {ageVerified ? (
            <Badge label="21+ VERIFIED 🪪" />
          ) : (
            <Badge label="UNVERIFIED" color={colors.red} soft={colors.redSoft} />
          )}
        </View>

        {/* quick links */}
        <Card pad={false} style={{ marginBottom: spacing(4) }}>
          {[
            { icon: 'location-outline' as const, label: 'Delivery addresses', sub: USER_ADDRESS },
            { icon: 'card-outline' as const, label: 'Payment methods', sub: 'Visa •••• 4242, Apple Pay' },
            { icon: 'pricetag-outline' as const, label: 'Promotions', sub: '2 available' },
            { icon: 'shield-checkmark-outline' as const, label: 'Age verification', sub: ageVerified ? 'Verified — ID checked at delivery' : 'Not verified' },
            { icon: 'help-circle-outline' as const, label: 'Help & support', sub: 'Get help with an order' },
          ].map((row, i) => (
            <View key={row.label}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.linkRow}>
                <Ionicons name={row.icon} size={20} color={colors.ink} />
                <View style={{ flex: 1 }}>
                  <Text style={font.h3}>{row.label}</Text>
                  <Text style={font.small} numberOfLines={1}>{row.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.sub} />
              </View>
            </View>
          ))}
        </Card>

        {/* notifications */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) }}>
          <Text style={font.h3}>Notifications</Text>
          <Text style={[font.small, { color: colors.accent }]} onPress={markNotificationsRead}>
            Mark all read
          </Text>
        </View>
        <Card pad={false}>
          {notifications.slice(0, 8).map((n, i) => (
            <View key={n.id}>
              {i > 0 ? <Divider /> : null}
              <View style={[styles.linkRow, !n.read && { backgroundColor: colors.accentSoft }]}>
                <Ionicons
                  name={n.kind === 'order' ? 'receipt-outline' : n.kind === 'promo' ? 'pricetag-outline' : 'megaphone-outline'}
                  size={18}
                  color={colors.ink}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[font.h3, { fontSize: 14 }]}>{n.title}</Text>
                  <Text style={font.small} numberOfLines={2}>{n.body}</Text>
                </View>
                <Text style={font.tiny}>{timeAgo(n.at)}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* switch role */}
        <Card
          style={{ marginTop: spacing(4), flexDirection: 'row', alignItems: 'center', gap: spacing(3), backgroundColor: colors.ink }}
        >
          <Ionicons name="swap-horizontal" size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={[font.h3, { color: '#fff' }]}>Prototype: switch role</Text>
            <Text style={[font.small, { color: '#aaa' }]}>Try the driver, store & admin apps</Text>
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
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    padding: spacing(3.5),
  },
});
