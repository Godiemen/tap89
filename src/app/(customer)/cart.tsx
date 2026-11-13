import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, productById, cartSubtotal, storeById } from '../../stores/app';
import { colors, font, radius, spacing } from '../../theme';
import { money } from '../../lib/format';
import { Badge, Button, Card, Divider, EmptyState, QtyStepper } from '../../components/ui';

export default function Cart() {
  const cart = useApp((s) => s.cart);
  const cartStoreId = useApp((s) => s.cartStoreId);
  const setCartQty = useApp((s) => s.setCartQty);
  const clearCart = useApp((s) => s.clearCart);
  const promoCode = useApp((s) => s.promoCode);
  const applyPromo = useApp((s) => s.applyPromo);
  const removePromo = useApp((s) => s.removePromo);
  const promos = useApp((s) => s.promos);
  const surge = useApp((s) => s.surge);

  const [code, setCode] = useState('');
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; message: string } | null>(null);

  const store = cartStoreId ? storeById(cartStoreId) : null;
  const subtotal = cartSubtotal(cart);
  const deliveryFee = store ? store.deliveryFee * surge : 0;
  const serviceFee = Math.min(4.99, subtotal * 0.08);
  const promo = promos.find((p) => p.code === promoCode);
  const discount = promo
    ? promo.type === 'percent'
      ? (subtotal * promo.value) / 100
      : promo.type === 'flat'
        ? promo.value
        : 0
    : 0;
  const effectiveDelivery = promo?.type === 'free_delivery' ? 0 : deliveryFee;
  const belowMin = store ? subtotal < store.minOrder : false;

  if (!cart.length) {
    return (
      <SafeAreaView style={styles.wrap}>
        <Header title="Cart" />
        <EmptyState emoji="🛒" title="Your cart is empty" body="Add drinks from a store to get started." />
        <View style={{ padding: spacing(4) }}>
          <Button title="Browse stores" onPress={() => router.push('/(customer)' as any)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrap}>
      <Header title="Cart" right={<Pressable onPress={clearCart}><Text style={[font.small, { color: colors.red }]}>Clear</Text></Pressable>} />
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 100 }}>
        {store ? (
          <Pressable onPress={() => router.push(`/(customer)/store/${store.id}` as any)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginBottom: spacing(3) }}>
              <Text style={{ fontSize: 26 }}>{store.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={font.h3}>{store.name}</Text>
                <Text style={font.small}>{store.address}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.sub} />
            </Card>
          </Pressable>
        ) : null}

        <Card pad={false} style={{ marginBottom: spacing(3) }}>
          {cart.map((c, i) => {
            const p = productById(c.productId);
            if (!p) return null;
            return (
              <View key={c.productId}>
                {i > 0 ? <Divider /> : null}
                <View style={styles.itemRow}>
                  <Text style={{ fontSize: 24 }}>{p.image}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={font.h3}>{p.name}</Text>
                    <Text style={font.small}>{p.size} · {money(p.price)}</Text>
                  </View>
                  <QtyStepper qty={c.qty} onChange={(q) => setCartQty(c.productId, q)} small />
                  <Text style={[font.h3, { width: 56, textAlign: 'right' }]}>{money(p.price * c.qty)}</Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* promo */}
        <Card style={{ marginBottom: spacing(3) }}>
          <Text style={[font.h3, { marginBottom: spacing(2) }]}>Promo code</Text>
          {promoCode ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge label={`${promoCode} — ${promo?.description}`} />
              <Pressable onPress={removePromo}>
                <Ionicons name="close-circle" size={20} color={colors.sub} />
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: spacing(2) }}>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="e.g. FIRSTSIP"
                placeholderTextColor={colors.sub}
                autoCapitalize="characters"
                style={[font.body, styles.promoInput]}
              />
              <Button
                title="Apply"
                small
                onPress={() => setPromoMsg(applyPromo(code))}
              />
            </View>
          )}
          {promoMsg ? (
            <Text style={[font.small, { color: promoMsg.ok ? colors.accent : colors.red, marginTop: spacing(2) }]}>
              {promoMsg.message}
            </Text>
          ) : null}
        </Card>

        {/* totals */}
        <Card>
          <Row label="Subtotal" value={money(subtotal)} />
          <Row
            label={`Delivery fee${surge > 1 ? ` (⚡ ${surge.toFixed(1)}x)` : ''}`}
            value={effectiveDelivery === 0 ? 'Free' : money(effectiveDelivery)}
          />
          <Row label="Service fee" value={money(serviceFee)} />
          {discount > 0 ? <Row label="Promo discount" value={`-${money(discount)}`} accent /> : null}
          <Divider />
          <Row label="Total (before tip)" value={money(subtotal + effectiveDelivery + serviceFee - discount)} bold />
          {belowMin ? (
            <Text style={[font.small, { color: colors.red, marginTop: spacing(2) }]}>
              ${(store!.minOrder - subtotal).toFixed(2)} below the {money(store!.minOrder)} store minimum.
            </Text>
          ) : null}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={belowMin ? `Add ${money(store!.minOrder - subtotal)} more to checkout` : 'Go to checkout'}
          icon="arrow-forward"
          disabled={belowMin}
          onPress={() => router.push('/(customer)/checkout' as any)}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

export function Header({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
      </Pressable>
      <Text style={font.h2}>{title}</Text>
      <View style={{ width: 38, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(1.5) }}>
      <Text style={bold ? font.h3 : font.body}>{label}</Text>
      <Text style={[bold ? font.h3 : font.body, accent && { color: colors.accent, fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    padding: spacing(3.5),
  },
  promoInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2.5),
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing(4),
    paddingBottom: spacing(6),
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
  },
});
