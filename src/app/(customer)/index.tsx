import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../stores/app';
import { CATEGORIES, USER_ADDRESS, USER_POS } from '../../data/mock';
import { colors, font, radius, spacing } from '../../theme';
import { etaRange, km, money } from '../../lib/format';
import { Card, Chip, SectionHeader, Stars } from '../../components/ui';
import SimMap from '../../components/SimMap';
import { Category, Store } from '../../lib/types';

export function StoreCard({ store, horizontal }: { store: Store; horizontal?: boolean }) {
  const surge = useApp((s) => s.surge);
  const fee = store.deliveryFee * surge;
  return (
    <Pressable onPress={() => router.push(`/(customer)/store/${store.id}` as any)}>
      <Card pad={false} style={[styles.storeCard, horizontal && { width: 230 }]}>
        <View style={styles.storeHero}>
          <Text style={{ fontSize: 34 }}>{store.emoji}</Text>
          {store.promo ? (
            <View style={styles.promoBadge}>
              <Text style={[font.tiny, { color: '#fff', fontWeight: '800' }]}>{store.promo}</Text>
            </View>
          ) : null}
          {!store.open ? (
            <View style={styles.closedOverlay}>
              <Text style={[font.small, { color: '#fff', fontWeight: '700' }]}>Closed</Text>
            </View>
          ) : null}
        </View>
        <View style={{ padding: spacing(3) }}>
          <Text style={font.h3} numberOfLines={1}>{store.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginTop: 4 }}>
            <Stars rating={store.rating} />
            <Text style={font.small}>({store.ratingCount})</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: 4, flexWrap: 'wrap' }}>
            <Text style={font.small}>
              {etaRange(store.deliveryTimeMin, store.deliveryTimeMax)} · {km(store.distanceKm)} ·{' '}
            </Text>
            {surge > 1 ? (
              <Text style={[font.small, { color: colors.amber, fontWeight: '700' }]}>
                {money(fee)} ⚡
              </Text>
            ) : (
              <Text style={font.small}>{fee === 0 ? 'Free' : money(fee)}</Text>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export default function CustomerHome() {
  const stores = useApp((s) => s.stores);
  const cart = useApp((s) => s.cart);
  const notifications = useApp((s) => s.notifications);
  const surge = useApp((s) => s.surge);
  const [cat, setCat] = useState<Category | 'all'>('all');

  const filtered = useMemo(
    () => stores.filter((s) => s.approved && (cat === 'all' || s.categories.includes(cat))),
    [stores, cat]
  );
  const featured = filtered.filter((s) => s.featured);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={font.tiny}>DELIVER TO</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location" size={14} color={colors.ink} />
              <Text style={[font.h3]} numberOfLines={1}>{USER_ADDRESS}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.sub} />
            </View>
          </View>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/(customer)/account')}>
            <Ionicons name="notifications-outline" size={20} color={colors.ink} />
            {unread ? <View style={styles.badgeDot} /> : null}
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/(customer)/cart')}>
            <Ionicons name="cart-outline" size={20} color={colors.ink} />
            {cartCount ? (
              <View style={styles.cartBadge}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{cartCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* search */}
        <Pressable style={styles.searchBar} onPress={() => router.push('/(customer)/search')}>
          <Ionicons name="search" size={18} color={colors.sub} />
          <Text style={[font.body, { color: colors.sub }]}>Search liquor, beer, wine…</Text>
        </Pressable>

        {surge > 1 ? (
          <View style={styles.surgeBanner}>
            <Text style={{ fontSize: 16 }}>⚡</Text>
            <Text style={[font.small, { flex: 1, color: colors.amber, fontWeight: '700' }]}>
              High demand — {surge.toFixed(1)}x surge pricing is active
            </Text>
          </View>
        ) : null}

        {/* categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((c) => (
            <Chip key={c.key} label={c.label} emoji={c.emoji} active={cat === c.key} onPress={() => setCat(c.key)} />
          ))}
        </ScrollView>

        {/* map */}
        <View style={{ marginHorizontal: spacing(4), marginTop: spacing(4) }}>
          <SimMap
            height={150}
            markers={[
              { ...USER_POS, emoji: '🏠', label: 'You' },
              ...filtered.slice(0, 6).map((s) => ({ ...s.pos, emoji: s.emoji })),
            ]}
          />
        </View>

        {/* featured */}
        <View style={{ marginHorizontal: spacing(4) }}>
          <SectionHeader title="Featured stores" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
          {featured.map((s) => (
            <StoreCard key={s.id} store={s} horizontal />
          ))}
        </ScrollView>

        {/* all stores */}
        <View style={{ marginHorizontal: spacing(4) }}>
          <SectionHeader title={`${cat === 'all' ? 'All' : CATEGORIES.find((c) => c.key === cat)?.label} stores near you`} />
          <View style={{ gap: spacing(3) }}>
            {filtered.map((s) => (
              <StoreCard key={s.id} store={s} />
            ))}
            {!filtered.length ? (
              <Text style={[font.small, { textAlign: 'center', paddingVertical: spacing(8) }]}>
                No stores in this category right now.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* floating cart bar */}
      {cartCount > 0 ? (
        <Pressable style={styles.cartBar} onPress={() => router.push('/(customer)/cart')}>
          <Text style={[font.h3, { color: '#fff' }]}>View cart · {cartCount} item{cartCount > 1 ? 's' : ''}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    paddingHorizontal: spacing(4),
    paddingTop: spacing(2),
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.card,
    marginHorizontal: spacing(4),
    marginTop: spacing(3),
    padding: spacing(3.5),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  surgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginHorizontal: spacing(4),
    marginTop: spacing(3),
    padding: spacing(3),
    borderRadius: radius.md,
    backgroundColor: colors.amberSoft,
  },
  chips: { gap: spacing(2), paddingHorizontal: spacing(4), paddingVertical: spacing(3) },
  storeCard: { overflow: 'hidden' },
  storeHero: {
    height: 90,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(2),
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredRow: { gap: spacing(3), paddingHorizontal: spacing(4) },
  cartBar: {
    position: 'absolute',
    bottom: spacing(5),
    left: spacing(4),
    right: spacing(4),
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    padding: spacing(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});
