import { Stack } from 'expo-router';

export default function ReportsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="revenue" options={{ headerShown: false }} />
      <Stack.Screen name="expenses" options={{ headerShown: false }} />
      <Stack.Screen name="property-performance" options={{ headerShown: false }} />
      <Stack.Screen name="cash-flow" options={{ headerShown: false }} />
      <Stack.Screen name="profit-loss" options={{ headerShown: false }} />
      <Stack.Screen name="payment-history" options={{ headerShown: false }} />
      <Stack.Screen name="occupancy" options={{ headerShown: false }} />
      <Stack.Screen name="lease-expiry" options={{ headerShown: false }} />
      <Stack.Screen name="maintenance-costs" options={{ headerShown: false }} />
    </Stack>
  );
} 