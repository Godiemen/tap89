import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function DriverLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.sub,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dash', tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="earnings"
        options={{ title: 'Earnings', tabBarIcon: ({ color, size }) => <Ionicons name="wallet" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="activity"
        options={{ title: 'Activity', tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Account', tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color as string} size={size} /> }}
      />
      <Tabs.Screen name="delivery" options={{ href: null }} />
    </Tabs>
  );
}
