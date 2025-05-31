import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Platform } from 'react-native';
import { Text, Card, Button, IconButton, ActivityIndicator, Surface, Divider, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing, shadows } from '@/lib/theme';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useAppStore } from '@/lib/store';
import { Property, MaintenanceRequest, Voucher } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { UserCircle2 } from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAppStore(state => state.user);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [rentCollected, setRentCollected] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [collectionRate, setCollectionRate] = useState(0);
  const [occupancyRate, setOccupancyRate] = useState(0);
  
  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // Fetch properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .limit(3);
          
        if (propertiesError) throw propertiesError;
        
        // Fetch maintenance requests
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from('maintenance_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (maintenanceError) throw maintenanceError;
        
        // Fetch vouchers
        const { data: vouchersData, error: vouchersError } = await supabase
          .from('vouchers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (vouchersError) throw vouchersError;

        // Calculate metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from('vouchers')
          .select('amount, status')
          .eq('voucher_type', 'receipt');

        if (metricsError) throw metricsError;

        if (metricsData) {
          const collected = metricsData
            .filter(v => v.status === 'posted')
            .reduce((sum, v) => sum + v.amount, 0);
          
          const pending = metricsData
            .filter(v => v.status === 'draft')
            .reduce((sum, v) => sum + v.amount, 0);

          setRentCollected(collected);
          setPendingPayments(pending);
          setCollectionRate(Math.round((collected / (collected + pending)) * 100) || 0);
        }

        // Calculate occupancy rate
        const { data: propertyStats, error: statsError } = await supabase
          .from('properties')
          .select('status');

        if (statsError) throw statsError;

        if (propertyStats) {
          const total = propertyStats.length;
          const rented = propertyStats.filter(p => p.status === 'rented').length;
          setOccupancyRate(Math.round((rented / total) * 100) || 0);
        }
        
        // Set the data
        if (propertiesData) setProperties(propertiesData);
        if (maintenanceData) setMaintenanceRequests(maintenanceData);
        if (vouchersData) setVouchers(vouchersData);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.first_name || 'User'}</Text>
        </View>
        <View style={styles.profileContainer}>
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.profileImage}
            />
          ) : (
            <UserCircle2
              size={48}
              color={theme.colors.onSurfaceVariant}
              strokeWidth={1.5}
            />
          )}
        </View>
      </View>
      
      {/* Financial Overview */}
      <Text style={styles.sectionTitle}>Financial Overview</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.metricsContainer}>
          <Surface style={[styles.metricCard, shadows.medium, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={styles.metricLabel}>Rent Collected</Text>
            <Text style={styles.metricValue}>${rentCollected.toLocaleString()}</Text>
          </Surface>
          
          <Surface style={[styles.metricCard, shadows.medium, { backgroundColor: theme.colors.errorContainer }]}>
            <Text style={styles.metricLabel}>Pending Payments</Text>
            <Text style={styles.metricValue}>${pendingPayments.toLocaleString()}</Text>
          </Surface>
          
          <Surface style={[styles.metricCard, shadows.medium, { backgroundColor: theme.colors.tertiaryContainer }]}>
            <Text style={styles.metricLabel}>Collection Rate</Text>
            <Text style={styles.metricValue}>{collectionRate}%</Text>
            <ProgressBar progress={collectionRate/100} color={theme.colors.tertiary} style={styles.progressBar} />
          </Surface>
          
          <Surface style={[styles.metricCard, shadows.medium, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Text style={styles.metricLabel}>Occupancy Rate</Text>
            <Text style={styles.metricValue}>{occupancyRate}%</Text>
            <ProgressBar progress={occupancyRate/100} color={theme.colors.secondary} style={styles.progressBar} />
          </Surface>
        </View>
      </ScrollView>
      
      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsContainer}>
        <Button
          mode="outlined"
          icon="office-building-outline"
          style={styles.actionButton}
          onPress={() => router.push('/properties/add')}
        >
          Add Property
        </Button>
        
        <Button
          mode="outlined"
          icon="account-plus-outline"
          style={styles.actionButton}
          onPress={() => router.push('/tenants/add')}
        >
          Add Tenant
        </Button>
        
        <Button
          mode="outlined"
          icon="tools"
          style={styles.actionButton}
          onPress={() => router.push('/maintenance/add')}
        >
          Maintenance
        </Button>
        
        <Button
          mode="outlined"
          icon="cash-plus"
          style={styles.actionButton}
          onPress={() => router.push('/finance/vouchers/add')}
        >
          Add Voucher
        </Button>
      </View>
      
      {/* Properties */}
      <View style={styles.listHeaderContainer}>
        <Text style={styles.sectionTitle}>Properties</Text>
        <Button
          mode="text"
          onPress={() => router.push('/properties')}
          style={styles.viewAllButton}
          labelStyle={styles.viewAllLabel}
          contentStyle={{ flexDirection: 'row-reverse' }}
          icon="arrow-right"
        >
          View All
        </Button>
      </View>
      
      {properties.length > 0 ? (
        <View style={styles.propertiesContainer}>
          {properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </View>
      ) : (
        <Surface style={[styles.emptyStateContainer, shadows.small]}>
          <Text style={styles.emptyStateText}>No properties found</Text>
          <Button
            mode="contained"
            onPress={() => router.push('/properties/add')}
            icon="plus-circle-outline"
          >
            Add Property
          </Button>
        </Surface>
      )}
      
      {/* Maintenance Requests */}
      <View style={styles.listHeaderContainer}>
        <Text style={styles.sectionTitle}>Maintenance Requests</Text>
        <Button
          mode="text"
          onPress={() => router.push('/maintenance')}
          style={styles.viewAllButton}
          labelStyle={styles.viewAllLabel}
          contentStyle={{ flexDirection: 'row-reverse' }}
          icon="arrow-right"
        >
          View All
        </Button>
      </View>
      
      {maintenanceRequests.length > 0 ? (
        <View style={styles.maintenanceContainer}>
          {maintenanceRequests.map(request => (
            <MaintenanceRequestCard key={request.id} request={request} />
          ))}
        </View>
      ) : (
        <Surface style={[styles.emptyStateContainer, shadows.small]}>
          <Text style={styles.emptyStateText}>No maintenance requests</Text>
          <Button
            mode="contained"
            onPress={() => router.push('/maintenance/add')}
            icon="plus-circle-outline"
          >
            Create Request
          </Button>
        </Surface>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: spacing.m,
    color: theme.colors.onSurfaceVariant,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: Platform.OS === 'ios' ? spacing.xl : spacing.m,
  },
  greeting: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  profileContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadows.small,
  },
  profileImage: {
    width: 48,
    height: 48,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.m,
    color: theme.colors.onSurface,
  },
  metricsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    paddingRight: spacing.m,
  },
  metricCard: {
    width: 160,
    padding: spacing.m,
    borderRadius: 12,
    marginRight: spacing.m,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.s,
  },
  metricLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  metricTrend: {
    fontSize: 12,
    color: theme.colors.success,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: spacing.xs,
  },
  chartCard: {
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.xl,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.m,
    color: theme.colors.onSurface,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xl,
  },
  actionButton: {
    marginRight: spacing.s,
    marginBottom: spacing.s,
    borderRadius: 8,
    borderColor: theme.colors.outline,
  },
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  viewAllButton: {
    marginRight: -10,
  },
  viewAllLabel: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  propertiesContainer: {
    marginBottom: spacing.xl,
  },
  maintenanceContainer: {
    marginBottom: spacing.xl,
  },
  emptyStateContainer: {
    padding: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.m,
    marginBottom: spacing.m,
  },
  activityCard: {
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.xxl,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: spacing.s,
  },
  activityIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityUser: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  activityDivider: {
    marginVertical: spacing.s,
  },
});