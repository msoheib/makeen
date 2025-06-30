import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { Platform, View, ActivityIndicator } from 'react-native';
import { Home, FileText, Users, Building2, Settings as SettingsIcon, Shield, Lock, Wrench } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { theme } from '@/lib/theme';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useTabBadgeCount } from '@/hooks/useNotificationBadges';
import { useTranslation } from '@/lib/useTranslation';
import { useFilteredNavigation, TAB_PERMISSIONS } from '@/lib/permissions';

export default function TabLayout() {
  const paperTheme = useTheme();
  const { t } = useTranslation('navigation');
  const user = useAppStore(state => state.user);
  
  // Get role-based navigation permissions
  const { tabItems, userContext, loading, hasTabAccess } = useFilteredNavigation();

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
    tabBarShowLabel: false,
    tabBarActiveTintColor: theme.colors.tabBarActive,
    tabBarInactiveTintColor: theme.colors.tabBarInactive,
    tabBarStyle: {
      height: Platform.OS === 'ios' ? 70 : 56,
      paddingTop: 8,
      paddingBottom: Platform.OS === 'ios' ? 20 : 8,
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

  // Show loading while fetching permissions
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Role-based tab rendering
  return (
    <Tabs screenOptions={screenOptions}>
      {/* Dashboard - Always visible for authenticated users */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard'),
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
      
      {/* Reports - Only for owners and admins */}
      <Tabs.Screen
        name="reports"
        options={{
          title: t('reports'),
          href: hasTabAccess('reports') ? undefined : null,
          tabBarIcon: ({ size, color }) => (
            hasTabAccess('reports') ? (
              <TabIconWithBadge 
                Icon={FileText} 
                badgeCount={paymentBadges.count} 
                size={size} 
                color={color} 
              />
            ) : (
              <Lock size={size} color="#ccc" />
            )
          ),
        }}
      />
      
      {/* Tenants - Admin and Manager only */}
      <Tabs.Screen
        name="tenants"
        options={{
          title: t('tenants'),
          href: hasTabAccess('tenants') ? undefined : null,
          tabBarIcon: ({ size, color }) => (
            hasTabAccess('tenants') ? (
              <TabIconWithBadge 
                Icon={Users} 
                badgeCount={tenantBadges.count} 
                size={size} 
                color={color} 
              />
            ) : (
              <Lock size={size} color="#ccc" />
            )
          ),
        }}
      />
      
      {/* Properties - All roles have access but filtered content */}
      <Tabs.Screen
        name="properties"
        options={{
          title: t('properties'),
          href: hasTabAccess('properties') ? undefined : null,
          tabBarIcon: ({ size, color }) => (
            hasTabAccess('properties') ? (
              <TabIconWithBadge 
                Icon={Building2} 
                badgeCount={propertyBadges.count} 
                size={size} 
                color={color} 
              />
            ) : (
              <Lock size={size} color="#ccc" />
            )
          ),
        }}
      />
      
      {/* Maintenance - All roles have access */}
      <Tabs.Screen
        name="maintenance"
        options={{
          title: t('maintenance'),
          href: hasTabAccess('maintenance') ? undefined : null,
          tabBarIcon: ({ size, color }) => (
            hasTabAccess('maintenance') ? (
              <TabIconWithBadge 
                Icon={Wrench} 
                badgeCount={maintenanceBadges.count} 
                size={size} 
                color={color} 
              />
            ) : (
              <Lock size={size} color="#ccc" />
            )
          ),
        }}
      />
      
      {/* Settings - Always visible */}
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ size, color }) => (
            <SettingsIcon size={size} color={color} />
          ),
        }}
      />
      
      {/* Hide screens - temporarily disabled for all users */}
      <Tabs.Screen name="people" options={{ href: null }} />
      <Tabs.Screen name="finance" options={{ href: null }} />
      <Tabs.Screen name="payments" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
    </Tabs>
  );
}