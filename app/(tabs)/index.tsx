import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { Property, MaintenanceRequest, Voucher } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  DollarSign, 
  Tool, 
  Users, 
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import StatCard from '@/components/StatCard';
import ModernCard from '@/components/ModernCard';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAppStore(state => state.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    occupiedProperties: 0,
    totalRevenue: 0,
    pendingMaintenance: 0,
    monthlyGrowth: '+12.5%',
    occupancyRate: 85,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch properties
      const { data: properties } = await supabase
        .from('properties')
        .select('*');

      // Fetch maintenance requests
      const { data: maintenance } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('status', 'pending');

      // Fetch revenue data
      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('amount')
        .eq('voucher_type', 'receipt')
        .eq('status', 'posted');

      if (properties) {
        const occupied = properties.filter(p => p.status === 'rented').length;
        setStats(prev => ({
          ...prev,
          totalProperties: properties.length,
          occupiedProperties: occupied,
          occupancyRate: Math.round((occupied / properties.length) * 100) || 0,
        }));
      }

      if (maintenance) {
        setStats(prev => ({
          ...prev,
          pendingMaintenance: maintenance.length,
        }));
      }

      if (vouchers) {
        const total = vouchers.reduce((sum, v) => sum + v.amount, 0);
        setStats(prev => ({
          ...prev,
          totalRevenue: total,
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Add Property',
      icon: <Building2 size={24} color={theme.colors.primary} />,
      onPress: () => router.push('/properties/add'),
      color: theme.colors.primary,
    },
    {
      title: 'New Tenant',
      icon: <Users size={24} color={theme.colors.secondary} />,
      onPress: () => router.push('/tenants/add'),
      color: theme.colors.secondary,
    },
    {
      title: 'Maintenance',
      icon: <Tool size={24} color={theme.colors.warning} />,
      onPress: () => router.push('/maintenance/add'),
      color: theme.colors.warning,
    },
    {
      title: 'Add Voucher',
      icon: <DollarSign size={24} color={theme.colors.success} />,
      onPress: () => router.push('/finance/vouchers/add'),
      color: theme.colors.success,
    },
  ];

  return (
    <View style={styles.container}>
      <ModernHeader
        userName={user?.first_name || 'User'}
        userAvatar="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"
        onNotificationPress={() => router.push('/notifications')}
        onSearchPress={() => router.push('/search')}
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsContainer}
          >
            <StatCard
              title="Total Revenue"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              subtitle="This month"
              color={theme.colors.success}
              icon={<TrendingUp size={20} color={theme.colors.success} />}
              trend={{ value: stats.monthlyGrowth, isPositive: true }}
            />
            <StatCard
              title="Properties"
              value={stats.totalProperties.toString()}
              subtitle={`${stats.occupiedProperties} occupied`}
              color={theme.colors.primary}
              icon={<Building2 size={20} color={theme.colors.primary} />}
            />
            <StatCard
              title="Occupancy Rate"
              value={`${stats.occupancyRate}%`}
              subtitle="Current rate"
              color={theme.colors.secondary}
              icon={<CheckCircle size={20} color={theme.colors.secondary} />}
            />
            <StatCard
              title="Pending Issues"
              value={stats.pendingMaintenance.toString()}
              subtitle="Maintenance requests"
              color={theme.colors.warning}
              icon={<AlertCircle size={20} color={theme.colors.warning} />}
            />
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <ModernCard key={index} style={styles.actionCard}>
                <Button
                  mode="text"
                  onPress={action.onPress}
                  contentStyle={styles.actionContent}
                  labelStyle={[styles.actionLabel, { color: action.color }]}
                  icon={() => action.icon}
                >
                  {action.title}
                </Button>
              </ModernCard>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Button
              mode="text"
              onPress={() => router.push('/activity')}
              labelStyle={styles.viewAllLabel}
            >
              View All
            </Button>
          </View>
          
          <ModernCard>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: theme.colors.successContainer }]}>
                <DollarSign size={16} color={theme.colors.success} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Payment Received</Text>
                <Text style={styles.activitySubtitle}>Apartment 2A - $1,200</Text>
              </View>
              <Text style={styles.activityTime}>2h ago</Text>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: theme.colors.warningContainer }]}>
                <Tool size={16} color={theme.colors.warning} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Maintenance Request</Text>
                <Text style={styles.activitySubtitle}>Villa 5B - Plumbing issue</Text>
              </View>
              <Text style={styles.activityTime}>4h ago</Text>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                <Users size={16} color={theme.colors.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>New Tenant</Text>
                <Text style={styles.activitySubtitle}>John Smith - Office 3C</Text>
              </View>
              <Text style={styles.activityTime}>1d ago</Text>
            </View>
          </ModernCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  viewAllLabel: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  statsContainer: {
    paddingHorizontal: spacing.m,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.m,
    gap: spacing.m,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
  },
  actionContent: {
    flexDirection: 'column',
    height: 80,
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.s,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  activitySubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
});