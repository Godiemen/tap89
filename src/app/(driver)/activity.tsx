import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../stores/app';
import { colors, font, spacing } from '../../theme';
import { km, money, timeAgo } from '../../lib/format';
import { Card, Divider, EmptyState, Stars } from '../../components/ui';

export default function Activity() {
  const trips = useApp((s) => s.trips);

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <Text style={[font.h1, { padding: spacing(4), paddingBottom: 0 }]}>Activity</Text>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: 80 }}>
        {trips.length ? (
          <Card pad={false}>
            {trips.map((t, i) => (
              <View key={t.id}>
                {i > 0 ? <Divider /> : null}
                <View style={styles.tripRow}>
                  <Text style={{ fontSize: 22 }}>📦</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={font.h3}>{t.storeName}</Text>
                    <Text style={font.small}>{t.customerAddress}</Text>
                    <Text style={font.tiny}>{timeAgo(t.at)} · {km(t.distanceKm)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={font.h3}>{money(t.payout + t.tip)}</Text>
                    {t.rating ? <Stars rating={t.rating} /> : <Text style={font.tiny}>No rating</Text>}
                  </View>
                </View>
              </View>
            ))}
          </Card>
        ) : (
          <EmptyState emoji="🚗" title="No deliveries yet" body="Go online to start receiving requests." />
        )}

        <Card style={{ marginTop: spacing(3), flexDirection: 'row', gap: spacing(3) }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={font.tiny}>ACCEPTANCE</Text>
            <Text style={font.h2}>94%</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={font.tiny}>COMPLETION</Text>
            <Text style={font.h2}>99%</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={font.tiny}>RATING</Text>
            <Text style={font.h2}>4.9★</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), padding: spacing(3.5) },
});
