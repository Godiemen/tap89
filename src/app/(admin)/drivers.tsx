import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../stores/app';
import { colors, font, spacing } from '../../theme';
import { Avatar, Badge, Card, Divider } from '../../components/ui';

export default function AdminDrivers() {
  const drivers = useApp((s) => s.adminDrivers);
  const toggleVerified = useApp((s) => s.toggleDriverVerified);

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <View style={{ padding: spacing(4), paddingBottom: spacing(2) }}>
        <Text style={font.h2}>Drivers</Text>
        <Text style={font.small}>{drivers.filter((d) => d.online).length} online · {drivers.filter((d) => !d.verified).length} pending verification</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingTop: 0, paddingBottom: 80 }}>
        <Card pad={false}>
          {drivers.map((d, i) => (
            <View key={d.id}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.row}>
                <Avatar name={d.name} color={d.avatarColor} size={40} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2) }}>
                    <Text style={font.h3}>{d.name}</Text>
                    <Badge
                      label={d.online ? 'ONLINE' : 'OFFLINE'}
                      color={d.online ? colors.accent : colors.sub}
                      soft={d.online ? colors.accentSoft : colors.bg}
                    />
                  </View>
                  <Text style={font.small}>{d.vehicle} · {d.plate}</Text>
                  <Text style={font.tiny}>★ {d.rating} · {d.trips.toLocaleString()} trips</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Switch
                    value={d.verified}
                    onValueChange={() => toggleVerified(d.id)}
                    trackColor={{ true: colors.accent }}
                    thumbColor="#fff"
                  />
                  <Text style={font.tiny}>{d.verified ? '21+ VERIFIED' : 'UNVERIFIED'}</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
        <Text style={[font.tiny, { marginTop: spacing(3) }]}>
          Alcohol deliveries require drivers to be 21+ verified with completed ID-check training.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), padding: spacing(3.5) },
});
