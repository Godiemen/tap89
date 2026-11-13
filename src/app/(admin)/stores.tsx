import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../stores/app';
import { colors, font, spacing } from '../../theme';
import { km, money } from '../../lib/format';
import { Badge, Card, Divider, Stars } from '../../components/ui';

export default function AdminStores() {
  const stores = useApp((s) => s.stores);
  const toggleApproved = useApp((s) => s.toggleStoreApproved);

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <View style={{ padding: spacing(4), paddingBottom: spacing(2) }}>
        <Text style={font.h2}>Stores</Text>
        <Text style={font.small}>{stores.filter((s) => s.approved).length} approved · {stores.filter((s) => !s.approved).length} pending/suspended</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingTop: 0, paddingBottom: 80 }}>
        <Card pad={false}>
          {stores.map((s, i) => (
            <View key={s.id}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.row}>
                <Text style={{ fontSize: 26 }}>{s.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2) }}>
                    <Text style={font.h3} numberOfLines={1}>{s.name}</Text>
                    {!s.open ? <Badge label="CLOSED" color={colors.red} soft={colors.redSoft} /> : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2) }}>
                    <Stars rating={s.rating} />
                    <Text style={font.small}>· {km(s.distanceKm)} · {s.address}</Text>
                  </View>
                  <Text style={font.tiny}>
                    Fee {money(s.deliveryFee)} · min {money(s.minOrder)} · {s.categories.join(', ')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Switch
                    value={s.approved}
                    onValueChange={() => toggleApproved(s.id)}
                    trackColor={{ true: colors.accent }}
                    thumbColor="#fff"
                  />
                  <Text style={font.tiny}>{s.approved ? 'APPROVED' : 'SUSPENDED'}</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
        <Text style={[font.tiny, { marginTop: spacing(3) }]}>
          Suspending a store immediately removes it from the customer app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), padding: spacing(3.5) },
});
