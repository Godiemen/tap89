import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, productAvailable } from '../../stores/app';
import { CATEGORIES, PRODUCTS } from '../../data/mock';
import { colors, font, radius, spacing } from '../../theme';
import { money } from '../../lib/format';
import { Badge, Card, Chip, EmptyState } from '../../components/ui';
import { Category } from '../../lib/types';

const SUGGESTIONS = ['tequila', 'ipa', 'rosé', 'bourbon', 'tonic', 'ice', 'prosecco', 'vodka'];

export default function Search() {
  const stores = useApp((s) => s.stores);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [sort, setSort] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating'>('relevance');

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = PRODUCTS.filter(
      (p) =>
        (cat === 'all' || p.category === cat) &&
        (!needle ||
          p.name.toLowerCase().includes(needle) ||
          p.brand.toLowerCase().includes(needle) ||
          p.tags.some((t) => t.includes(needle)) ||
          p.category.includes(needle))
    );
    list = list.filter((p) => stores.find((s) => s.id === p.storeId)?.approved);
    if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'rating')
      list = [...list].sort(
        (a, b) =>
          (stores.find((s) => s.id === b.storeId)?.rating ?? 0) -
          (stores.find((s) => s.id === a.storeId)?.rating ?? 0)
      );
    return list.slice(0, 40);
  }, [q, cat, sort, stores]);

  const storeMatches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return stores.filter(
      (s) => s.approved && (s.name.toLowerCase().includes(needle) || s.categories.some((c) => c.includes(needle)))
    );
  }, [q, stores]);

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <View style={styles.searchRow}>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={18} color={colors.sub} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Search drinks, brands, stores…"
            placeholderTextColor={colors.sub}
            style={[font.body, { flex: 1, padding: 0 }]}
          />
          {q ? (
            <Pressable onPress={() => setQ('')}>
              <Ionicons name="close-circle" size={18} color={colors.sub} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((c) => (
          <Chip key={c.key} label={c.label} emoji={c.emoji} active={cat === c.key} onPress={() => setCat(c.key)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {(['relevance', 'price_asc', 'price_desc', 'rating'] as const).map((s) => (
          <Chip
            key={s}
            label={{ relevance: 'Relevance', price_asc: 'Price ↑', price_desc: 'Price ↓', rating: 'Top rated' }[s]}
            active={sort === s}
            onPress={() => setSort(s)}
          />
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing(4), paddingBottom: 80 }}>
        {!q ? (
          <>
            <Text style={[font.h3, { marginBottom: spacing(2) }]}>Popular searches</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) }}>
              {SUGGESTIONS.map((s) => (
                <Chip key={s} label={s} onPress={() => setQ(s)} />
              ))}
            </View>
          </>
        ) : (
          <>
            {storeMatches.length ? (
              <>
                <Text style={[font.h3, { marginBottom: spacing(2) }]}>Stores</Text>
                {storeMatches.map((s) => (
                  <Pressable key={s.id} onPress={() => router.push(`/(customer)/store/${s.id}` as any)}>
                    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginBottom: spacing(2) }}>
                      <Text style={{ fontSize: 26 }}>{s.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={font.h3}>{s.name}</Text>
                        <Text style={font.small}>{s.deliveryTimeMin}–{s.deliveryTimeMax} min · {s.rating}★</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.sub} />
                    </Card>
                  </Pressable>
                ))}
                <Text style={[font.h3, { marginVertical: spacing(2) }]}>Products ({results.length})</Text>
              </>
            ) : null}

            {results.map((p) => {
              const store = stores.find((s) => s.id === p.storeId);
              return (
                <Pressable key={p.id} onPress={() => router.push(`/(customer)/store/${p.storeId}` as any)}>
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginBottom: spacing(2) }}>
                    <Text style={{ fontSize: 26 }}>{p.image}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={font.h3} numberOfLines={1}>{p.name}</Text>
                      <Text style={font.small} numberOfLines={1}>{p.brand} · {store?.name}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[font.h3, { fontSize: 14 }]}>{money(p.price)}</Text>
                      {!productAvailable(p.id) ? <Badge label="SOLD OUT" color={colors.red} soft={colors.redSoft} /> : null}
                    </View>
                  </Card>
                </Pressable>
              );
            })}
            {!results.length && !storeMatches.length ? (
              <EmptyState emoji="🍾" title={`No results for "${q}"`} body="Try a different drink, brand, or category." />
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  searchRow: { paddingHorizontal: spacing(4), paddingTop: spacing(2) },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.card,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chips: { gap: spacing(2), paddingHorizontal: spacing(4), paddingVertical: spacing(2) },
});
