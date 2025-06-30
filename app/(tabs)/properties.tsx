import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PropertiesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4C2661' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 24 }}>العقارات</Text>
        <Text style={{ color: 'white', fontSize: 16 }}>Properties</Text>
      </View>
    </SafeAreaView>
  );
}