import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, MY_STORE_ID, productAvailable } from '../../stores/app';
import { PRODUCTS } from '../../data/mock';
import { colors, font, radius, spacing } from '../../theme';
import { money } from '../../lib/format';
import { Badge, Card, Divider, EmptyState } from '../../components/ui';

const CAT_LABEL: Record<string, string> = {
  beer: '🍺 Beer', wine: '🍷 Wine', spirits: '🥃 Spirits', mixers: '🫧 Mixers', snacks: '🥜 Snacks', extras: '🧊 Extras',
};

export default function Menu() {
  useApp((s) => s.availability); // subscribe so toggles re-render the list
  const toggle = useApp((s) => s.toggleProductAvailability);
  const [q, setQ] = useState('');

  const products = useMemo(() => PRODUCTS.filter((p) => p.storeId === MY_STORE_ID), []);
  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase())),
    [products, q]
  );
  const sections = useMemo(() => {
    const cats = [...new Set(filtered.map((p) => p.category))];
    return cats.map((c) => ({ cat: c, items: filtered.filter((p) => p.category === c) }));
  }, [filtered]);

  const inStock = products.filter((p) => productAvailable(p.id)).length;

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <View style={{ padding: spacing(4), paddingBottom: spacing(2) }}>
        <Text style={font.h2}>Menu</Text>
        <Text style={font.small}>{inStock}/{products.length} items in stock</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={16} color={colors.sub} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search your menu…"
            placeholderTextColor={colors.sub}
            style={[font.body, { flex: 1, padding: 0 }]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingTop: 0, paddingBottom: 80 }}>
        {sections.map(({ cat, items }) => (
          <View key={cat} style={{ marginBottom: spacing(3) }}>
            <Text style={[font.h3, { marginBottom: spacing(2) }]}>{CAT_LABEL[cat]}</Text>
            <Card pad={false}>
              {items.map((p, i) => {
                const on = productAvailable(p.id);
                return (
                  <View key={p.id}>
                    {i > 0 ? <Divider /> : null}
                    <View style={styles.row}>
                      <Text style={{ fontSize: 22 }}>{p.image}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[font.h3, !on && { color: colors.sub }]}>{p.name}</Text>
                        <Text style={font.small}>{p.brand} · {p.size} · {money(p.price)}</Text>
                      </View>
                      {p.popular ? <Badge label="POPULAR" color={colors.amber} soft={colors.amberSoft} /> : null}
                      <Switch
                        value={on}
                        onValueChange={() => toggle(p.id)}
                        trackColor={{ true: colors.accent, false: colors.line }}
                        thumbColor="#fff"
                      />
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        ))}
        {!sections.length ? <EmptyState emoji="🔍" title="No items match" /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2.5),
    marginTop: spacing(3),
    borderWidth: 1,
    borderColor: colors.line,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), padding: spacing(3.5) },
});
