import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, cartSubtotal, storeById, productById } from '../../stores/app';
import { USER_ADDRESS } from '../../data/mock';
import { colors, font, radius, spacing } from '../../theme';
import { money } from '../../lib/format';
import { Button, Card, Divider } from '../../components/ui';
import { Header } from './cart';

const TIPS = [0, 2, 4, 6];
const PAYMENTS = [
  { id: 'p1', label: 'Visa •••• 4242', icon: 'card' as const },
  { id: 'p2', label: 'Apple Pay', icon: 'logo-apple' as const },
  { id: 'p3', label: 'Cash on delivery', icon: 'cash' as const },
];

export default function Checkout() {
  const cart = useApp((s) => s.cart);
  const cartStoreId = useApp((s) => s.cartStoreId);
  const placeOrder = useApp((s) => s.placeOrder);
  const surge = useApp((s) => s.surge);
  const promoCode = useApp((s) => s.promoCode);
  const promos = useApp((s) => s.promos);

  const [tip, setTip] = useState(2);
  const [pay, setPay] = useState('p1');
  const [leaveAtDoor, setLeaveAtDoor] = useState(true);

  const store = cartStoreId ? storeById(cartStoreId) : null;
  const subtotal = cartSubtotal(cart);
  const deliveryFee = store ? store.deliveryFee * surge : 0;
  const serviceFee = Math.min(4.99, subtotal * 0.08);
  const promo = promos.find((p) => p.code === promoCode);
  const discount = promo ? (promo.type === 'percent' ? (subtotal * promo.value) / 100 : promo.type === 'flat' ? promo.value : 0) : 0;
  const effDelivery = promo?.type === 'free_delivery' ? 0 : deliveryFee;
  const total = subtotal + effDelivery + serviceFee - discount + tip;

  const submit = () => {
    const order = placeOrder(tip);
    if (order) router.replace(`/(customer)/tracking/${order.id}` as any);
  };

  return (
    <SafeAreaView style={styles.wrap}>
      <Header title="Checkout" />
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 110 }}>
        {/* address */}
        <Card style={{ marginBottom: spacing(3) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3) }}>
            <View style={styles.iconCircle}><Ionicons name="location" size={18} color={colors.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={font.tiny}>DELIVER TO</Text>
              <Text style={font.h3}>{USER_ADDRESS}</Text>
            </View>
            <Text style={[font.small, { color: colors.accent, fontWeight: '700' }]}>Edit</Text>
          </View>
          <Divider />
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), paddingTop: spacing(3) }}
            onPress={() => setLeaveAtDoor(!leaveAtDoor)}
          >
            <Ionicons name={leaveAtDoor ? 'checkbox' : 'square-outline'} size={20} color={colors.accent} />
            <Text style={font.body}>Leave at door + verify ID on arrival 🪪</Text>
          </Pressable>
        </Card>

        {/* payment */}
        <Card style={{ marginBottom: spacing(3) }}>
          <Text style={[font.h3, { marginBottom: spacing(2) }]}>Payment</Text>
          {PAYMENTS.map((p) => (
            <Pressable key={p.id} style={styles.payRow} onPress={() => setPay(p.id)}>
              <Ionicons name={p.icon} size={18} color={colors.ink} />
              <Text style={[font.body, { flex: 1 }]}>{p.label}</Text>
              <Ionicons name={pay === p.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={pay === p.id ? colors.accent : colors.sub} />
            </Pressable>
          ))}
        </Card>

        {/* tip */}
        <Card style={{ marginBottom: spacing(3) }}>
          <Text style={[font.h3, { marginBottom: spacing(2) }]}>Driver tip</Text>
          <View style={{ flexDirection: 'row', gap: spacing(2) }}>
            {TIPS.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTip(t)}
                style={[styles.tipBtn, tip === t && { backgroundColor: colors.ink }]}
              >
                <Text style={[font.h3, { color: tip === t ? '#fff' : colors.ink }]}>{t === 0 ? 'None' : `R${t}`}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[font.tiny, { marginTop: spacing(2) }]}>100% of tips go to your driver.</Text>
        </Card>

        {/* summary */}
        <Card>
          <Text style={[font.h3, { marginBottom: spacing(2) }]}>Order summary · {store?.name}</Text>
          {cart.map((c) => {
            const p = productById(c.productId);
            return (
              <View key={c.productId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                <Text style={font.small}>{c.qty}× {p?.name}</Text>
                <Text style={font.small}>{money((p?.price ?? 0) * c.qty)}</Text>
              </View>
            );
          })}
          <Divider />
          <Row label="Subtotal" value={money(subtotal)} />
          <Row label={`Delivery${surge > 1 ? ` ⚡${surge.toFixed(1)}x` : ''}`} value={effDelivery === 0 ? 'Free' : money(effDelivery)} />
          <Row label="Service fee" value={money(serviceFee)} />
          {discount > 0 ? <Row label="Discount" value={`-${money(discount)}`} /> : null}
          <Row label="Tip" value={money(tip)} />
          <Row label="Total" value={money(total)} bold />
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button title={`Place order · ${money(total)}`} variant="accent" icon="checkmark" onPress={submit} style={{ flex: 1 }} />
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(1.5) }}>
      <Text style={bold ? font.h3 : font.body}>{label}</Text>
      <Text style={bold ? font.h3 : font.body}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingVertical: spacing(2.5),
  },
  tipBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
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
  },
});
