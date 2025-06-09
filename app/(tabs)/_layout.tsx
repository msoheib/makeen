import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { Platform } from 'react-native';
import { 
  Home,
  FileText,
  Users,
  Building2,
  MoreHorizontal
} from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { theme } from '@/lib/theme';

export default function TabLayout() {
  const paperTheme = useTheme();
  const user = useAppStore(state => state.user);

  const screenOptions = {
    headerShown: false,
    tabBarActiveTintColor: theme.colors.tabBarActive,
    tabBarInactiveTintColor: theme.colors.tabBarInactive,
    tabBarStyle: {
      height: Platform.OS === 'ios' ? 88 : 64,
      paddingTop: 6,
      paddingBottom: Platform.OS === 'ios' ? 28 : 12,
      backgroundColor: theme.colors.tabBarBackground,
      borderTopWidth: 0,
      elevation: 0,
      shadowOpacity: 0,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    tabBarIconStyle: {
      marginBottom: 2,
    },
  };

  // All users get the same 5-tab layout matching LandlordStudio
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ size, color }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tenants"
        options={{
          title: 'Tenants',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Organisation',
          tabBarIcon: ({ size, color }) => (
            <Building2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'More',
          tabBarIcon: ({ size, color }) => (
            <MoreHorizontal size={size} color={color} />
          ),
        }}
      />
      
      {/* Hide other screens */}
      <Tabs.Screen name="people" options={{ href: null }} />
      <Tabs.Screen name="maintenance" options={{ href: null }} />
      <Tabs.Screen name="finance" options={{ href: null }} />
      <Tabs.Screen name="payments" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
    </Tabs>
  );
}