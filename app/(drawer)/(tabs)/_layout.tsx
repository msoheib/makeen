import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { Platform, View } from 'react-native';
import { Chrome as Home, FileText, Users, Building2, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { theme } from '@/lib/theme';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useTabBadgeCount } from '@/hooks/useNotificationBadges';

export default function TabLayout() {
  const paperTheme = useTheme();
  const user = useAppStore(state => state.user);

  // Badge counts for different tabs
  const totalBadges = useTabBadgeCount();
  const tenantBadges = useTabBadgeCount('tenant');
  const propertyBadges = useTabBadgeCount('property');
  const maintenanceBadges = useTabBadgeCount('maintenance');
  const paymentBadges = useTabBadgeCount('payment');

  // Helper component for tab icons with badges
  const TabIconWithBadge: React.FC<{
    Icon: React.ComponentType<{ size: number; color: string }>;
    badgeCount: number;
    size: number;
    color: string;
  }> = ({ Icon, badgeCount, size, color }) => (
    <NotificationBadge count={badgeCount} size="small" position="top-right">
      <Icon size={size} color={color} />
    </NotificationBadge>
  );

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
      ...Platform.select({
        web: {
          boxShadow: 'none',
        },
        default: {
          shadowOpacity: 0,
        },
      }),
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
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
            <TabIconWithBadge 
              Icon={Home} 
              badgeCount={totalBadges.count} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ size, color }) => (
            <TabIconWithBadge 
              Icon={FileText} 
              badgeCount={paymentBadges.count} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tenants"
        options={{
          title: 'Tenants',
          tabBarIcon: ({ size, color }) => (
            <TabIconWithBadge 
              Icon={Users} 
              badgeCount={tenantBadges.count} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Organisation',
          tabBarIcon: ({ size, color }) => (
            <TabIconWithBadge 
              Icon={Building2} 
              badgeCount={propertyBadges.count + maintenanceBadges.count} 
              size={size} 
              color={color} 
            />
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