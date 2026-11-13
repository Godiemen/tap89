import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, productAvailable, cartSubtotal } from '../../../stores/app';
import { PRODUCTS } from '../../../data/mock';
import { colors, font, radius, spacing } from '../../../theme';
import { etaRange, km, money } from '../../../lib/format';
import { Badge, Card, QtyStepper, Stars } from '../../../components/ui';
import { Product } from '../../../lib/types';

const CAT_LABEL: Record<string, string> = {
  beer: '🍺 Beer', wine: '🍷 Wine', spirits: '🥃 Spirits', mixers: '🫧 Mixers', snacks: '🥜 Snacks', extras: '🧊 Extras',
};

function ProductRow({ product, qty }: { product: Product; qty: number }) {
  const addToCart = useApp((s) => s.addToCart);
  const setCartQty = useApp((s) => s.setCartQty);
  const available = productAvailable(product.id);
  return (
    <View style={styles.productRow}>
      <View style={styles.productEmoji}>
        <Text style={{ fontSize: 26 }}>{product.image}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(1.5) }}>
          <Text style={font.h3} numberOfLines={1}>{product.name}</Text>
          {product.popular ? <Badge label="POPULAR" color={colors.amber} soft={colors.amberSoft} /> : null}
        </View>
        <Text style={font.small} numberOfLines={2}>{product.description}</Text>
        <Text style={[font.tiny, { marginTop: 2 }]}>
          {product.brand} · {product.size}{product.abv ? ` · ${product.abv}% ABV` : ''}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing(2) }}>
          <Text style={[font.h3, { fontSize: 15 }]}>{money(product.price)}</Text>
          {!available ? (
            <Badge label="SOLD OUT" color={colors.red} soft={colors.redSoft} />
          ) : qty > 0 ? (
            <QtyStepper qty={qty} onChange={(q) => setCartQty(product.id, q)} small />
          ) : (
            <Pressable style={styles.addBtn} onPress={() => addToCart(product.id)}>
              <Ionicons name="add" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export default function StoreDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useApp((s) => s.stores.find((x) => x.id === id));
  const cart = useApp((s) => s.cart);
  const surge = useApp((s) => s.surge);

  const products = useMemo(() => PRODUCTS.filter((p) => p.storeId === id), [id]);
  const sections = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))];
    return cats.map((c) => ({ cat: c, items: products.filter((p) => p.category === c) }));
  }, [products]);

  if (!store) return null;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartSubtotal(cart);
  const fee = store.deliveryFee * surge;

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      {/* hero */}
      <View style={styles.hero}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <Text style={{ fontSize: 56 }}>{store.emoji}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ padding: spacing(4) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={font.h1}>{store.name}</Text>
            {!store.open ? <Badge label="CLOSED" color={colors.red} soft={colors.redSoft} /> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginTop: spacing(1.5) }}>
            <Stars rating={store.rating} />
            <Text style={font.small}>({store.ratingCount}) · {store.address}</Text>
          </View>

          <Card style={{ flexDirection: 'row', marginTop: spacing(3), paddingVertical: spacing(3) }}>
            <View style={styles.infoCell}>
              <Text style={[font.h3, { fontSize: 15 }]}>{etaRange(store.deliveryTimeMin, store.deliveryTimeMax)}</Text>
              <Text style={font.tiny}>DELIVERY TIME</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={[font.h3, { fontSize: 15 }]}>{fee === 0 ? 'Free' : money(fee)}</Text>
              <Text style={font.tiny}>DELIVERY FEE{surge > 1 ? ' ⚡' : ''}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={[font.h3, { fontSize: 15 }]}>{km(store.distanceKm)}</Text>
              <Text style={font.tiny}>DISTANCE</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={[font.h3, { fontSize: 15 }]}>{money(store.minOrder)}</Text>
              <Text style={font.tiny}>MINIMUM</Text>
            </View>
          </Card>

          {store.promo ? (
            <View style={styles.promoRow}>
              <Ionicons name="pricetag" size={14} color={colors.accent} />
              <Text style={[font.small, { color: colors.accent, fontWeight: '700' }]}>{store.promo}</Text>
            </View>
          ) : null}
        </View>

        {/* menu */}
        {sections.map(({ cat, items }) => (
          <View key={cat} style={{ paddingHorizontal: spacing(4), marginBottom: spacing(2) }}>
            <Text style={[font.h2, { marginBottom: spacing(2) }]}>{CAT_LABEL[cat]}</Text>
            <Card pad={false}>
              {items.map((p, i) => (
                <View key={p.id}>
                  {i > 0 ? <View style={styles.divider} /> : null}
                  <ProductRow product={p} qty={cart.find((c) => c.productId === p.id)?.qty ?? 0} />
                </View>
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>

      {cartCount > 0 ? (
        <Pressable style={styles.cartBar} onPress={() => router.push('/(customer)/cart')}>
          <Text style={[font.h3, { color: '#fff' }]}>View cart · {cartCount}</Text>
          <Text style={[font.h3, { color: '#fff' }]}>{money(cartTotal)}</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  hero: {
    height: 140,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: spacing(3),
    left: spacing(4),
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  infoCell: { flex: 1, alignItems: 'center', gap: 2 },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginTop: spacing(3),
    backgroundColor: colors.accentSoft,
    padding: spacing(2.5),
    borderRadius: radius.md,
  },
  productRow: { flexDirection: 'row', gap: spacing(3), padding: spacing(3.5) },
  productEmoji: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: colors.line, marginHorizontal: spacing(3.5) },
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
