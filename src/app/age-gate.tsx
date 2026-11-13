import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../stores/app';
import { colors, font, spacing } from '../theme';
import { Button, Card } from '../components/ui';

export default function AgeGate() {
  const verifyAge = useApp((s) => s.verifyAge);
  const [denied, setDenied] = useState(false);

  return (
    <SafeAreaView style={styles.wrap}>
      <View style={{ alignItems: 'center', marginTop: spacing(10) }}>
        <Text style={{ fontSize: 56 }}>🪪</Text>
        <Text style={[font.h1, { marginTop: spacing(3), textAlign: 'center' }]}>Are you 21 or older?</Text>
        <Text style={[font.body, { color: colors.sub, textAlign: 'center', marginTop: spacing(2) }]}>
          You must be of legal drinking age to order alcohol on SipDash. ID will be verified at delivery.
        </Text>
      </View>

      <Card style={{ marginTop: spacing(8), gap: spacing(3) }}>
        <Button
          title="Yes, I'm 21 or older"
          variant="accent"
          icon="checkmark-circle"
          onPress={() => {
            verifyAge();
            router.back();
          }}
        />
        <Button title="No, I'm under 21" variant="ghost" onPress={() => setDenied(true)} />
        {denied ? (
          <Text style={[font.small, { color: colors.red, textAlign: 'center' }]}>
            {'Sorry \u2014 you can\u2019t use SipDash. Come back when you\u2019re 21.'}
          </Text>
        ) : null}
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: spacing(5) },
});
