import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { Platform } from 'react-native';
import { 
  Home,
  Building2,
  DollarSign,
  Settings,
  Users,
  Bell,
  MessageSquare,
  ClipboardList,
  Tool,
  FileText,
  CreditCard,
  BarChart3
} from 'lucide-react-native';
import { useAppStore } from '@/lib/store';

export default function TabLayout() {
  const theme = useTheme();
  const user = useAppStore(state => state.user);

  const screenOptions = {
    headerShown: false,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
    tabBarStyle: {
      height: Platform.OS === 'ios' ? 88 : 64,
      paddingTop: 6,
      paddingBottom: Platform.OS === 'ios' ? 28 : 12,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
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

  // Tenant navigation
  if (user?.role === 'tenant') {
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
          name="maintenance"
          options={{
            title: 'Maintenance',
            tabBarIcon: ({ size, color }) => (
              <Tool size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            title: 'Payments',
            tabBarIcon: ({ size, color }) => (
              <CreditCard size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="documents"
          options={{
            title: 'Documents',
            tabBarIcon: ({ size, color }) => (
              <FileText size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ size, color }) => (
              <Settings size={size} color={color} />
            ),
          }}
        />
        {/* Hide other screens for tenants */}
        <Tabs.Screen name="people" options={{ href: null }} />
        <Tabs.Screen name="properties" options={{ href: null }} />
        <Tabs.Screen name="tenants" options={{ href: null }} />
        <Tabs.Screen name="finance" options={{ href: null }} />
        <Tabs.Screen name="reports" options={{ href: null }} />
      </Tabs>
    );
  }

  // Property owner navigation
  if (user?.role === 'owner') {
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
          name="properties"
          options={{
            title: 'Properties',
            tabBarIcon: ({ size, color }) => (
              <Building2 size={size} color={color} />
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
          name="maintenance"
          options={{
            title: 'Maintenance',
            tabBarIcon: ({ size, color }) => (
              <Tool size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="finance"
          options={{
            title: 'Finance',
            tabBarIcon: ({ size, color }) => (
              <DollarSign size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ size, color }) => (
              <BarChart3 size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ size, color }) => (
              <Settings size={size} color={color} />
            ),
          }}
        />
        {/* Hide other screens for owners */}
        <Tabs.Screen name="people" options={{ href: null }} />
        <Tabs.Screen name="payments" options={{ href: null }} />
        <Tabs.Screen name="documents" options={{ href: null }} />
      </Tabs>
    );
  }

  // Manager navigation (default - shows all screens)
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
        name="people"
        options={{
          title: 'People',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Properties',
          tabBarIcon: ({ size, color }) => (
            <Building2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finance',
          tabBarIcon: ({ size, color }) => (
            <DollarSign size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          title: 'Operations',
          tabBarIcon: ({ size, color }) => (
            <Tool size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
      {/* Hide tenant-specific screens for managers */}
      <Tabs.Screen name="tenants" options={{ href: null }} />
      <Tabs.Screen name="payments" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
    </Tabs>
  );
}