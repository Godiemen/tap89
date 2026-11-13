import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function AdminLayout() {
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
        options={{ title: 'Overview', tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <Ionicons name="receipt" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="stores"
        options={{ title: 'Stores', tabBarIcon: ({ color, size }) => <Ionicons name="storefront" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="drivers"
        options={{ title: 'Drivers', tabBarIcon: ({ color, size }) => <Ionicons name="car" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal" color={color as string} size={size} /> }}
      />
    </Tabs>
  );
}
