import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#4C2661' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 24 }}>لوحة التحكم</Text>
          <Text style={{ color: 'white', fontSize: 16, marginTop: 10 }}>Real Estate Management System</Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}