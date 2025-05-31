import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Platform } from 'react-native';
import { Text, Card, Button, IconButton, ActivityIndicator, Surface, Divider, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing, shadows } from '@/lib/theme';
import { LineChart } from 'react-native-chart-kit';
import { useAppStore } from '@/lib/store';
import { Property, MaintenanceRequest, Voucher } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { UserCircle2, Building2, DollarSign, Tool, FileText, Bell, Users } from 'lucide-react-native';

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
    fetchDashboardData();
  }, [user?.role]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      switch (user.role) {
        case 'tenant':
          await fetchTenantData();
          break;
        case 'owner':
          await fetchOwnerData();
          break;
        case 'manager':
          await fetchManagerData();
          break;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantData = async () => {
    // Fetch tenant's rented properties
    const { data: propertiesData } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'rented')
      .eq('tenant_id', user?.id)
      .limit(3);

    // Fetch tenant's maintenance requests
    const { data: maintenanceData } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('tenant_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(3);

    // Fetch tenant's payment history
    const { data: vouchersData } = await supabase
      .from('vouchers')
      .select('*')
      .eq('tenant_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (propertiesData) setProperties(propertiesData);
    if (maintenanceData) setMaintenanceRequests(maintenanceData);
    if (vouchersData) setVouchers(vouchersData);
  };

  const fetchOwnerData = async () => {
    // Fetch owner's properties
    const { data: propertiesData } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', user?.id)
      .limit(3);

    // Fetch maintenance requests for owner's properties
    const { data: maintenanceData } = await supabase
      .from('maintenance_requests')
      .select('*')
      .in('property_id', propertiesData?.map(p => p.id) || [])
      .order('created_at', { ascending: false })
      .limit(3);

    // Calculate owner's revenue
    const { data: vouchersData } = await supabase
      .from('vouchers')
      .select('*')
      .in('property_id', propertiesData?.map(p => p.id) || [])
      .order('created_at', { ascending: false });

    if (propertiesData) {
      setProperties(propertiesData);
      const rented = propertiesData.filter(p => p.status === 'rented').length;
      setOccupancyRate(Math.round((rented / propertiesData.length) * 100));
    }

    if (maintenanceData) setMaintenanceRequests(maintenanceData);
    if (vouchersData) {
      setVouchers(vouchersData);
      const collected = vouchersData
        .filter(v => v.status === 'posted')
        .reduce((sum, v) => sum + v.amount, 0);
      const pending = vouchersData
        .filter(v => v.status === 'draft')
        .reduce((sum, v) => sum + v.amount, 0);
      setRentCollected(collected);
      setPendingPayments(pending);
      setCollectionRate(Math.round((collected / (collected + pending)) * 100) || 0);
    }
  };

  const fetchManagerData = async () => {
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
  };

  const renderQuickActions = () => {
    switch (user?.role) {
      case 'tenant':
        return (
          <>
            <Button
              mode="outlined"
              icon={() => <Tool size={20} color={theme.colors.primary} />}
              style={styles.actionButton}
              onPress={() => router.push('/maintenance/add')}
            >
              Report Issue
            </Button>
            <Button
              mode="outlined"
              icon={() => <DollarSign size={20} color={theme.colors.primary} />}
              style={styles.actionButton}
              onPress={() => router.push('/payments')}
            >
              Make Payment
            </Button>
            <Button
              mode="outlined"
              icon={() => <FileText size={20} color={theme.colors.primary} />}
              style={styles.actionButton}
              onPress={() => router.push('/documents')}
            >
              Documents
            </Button>
          </>
        );

      case 'owner':
        return (
          <>
            <Button
              mode="outlined"
              icon={() => <Building2 size={20} color={theme.colors.primary} />}
              style={styles.actionButton}
              onPress={() => router.push('/properties/add')}
            >
              Add Property
            </Button>
            <Button
              mode="outlined"
              icon={() => <Bell size={20} color={theme.colors.primary} />}
              style={styles.actionButton}
              onPress={() => router.push('/maintenance')}
            >
              View Issues
            </Button>
            <Button
              mode="outlined"
              icon={() => <DollarSign size={20} color={theme.colors.primary} />}
              style={styles.actionButton}
              onPress={() => router.push('/finance')}
            >
              Financials
            </Button>
          </>
        );

      default:
        return (
          <>
            <Button
              mode="outlined"
              icon={() => <Building2 size={20} color={theme.colors.primary} />}
              style={styles.actionButton}
              onPress={() => router.push('/properties/add')}
            >
              Add Property
            </Button>
            <Button
              mode="outlined"
              icon={() => <Users size={20} color={theme.colors.primary} />}
              style={styles.actionButton}
              onPress={() => router.push('/tenants/add')}
            >
              Add Tenant
            </Button>
            <Button
              mode="outlined"
              icon={() => <Tool size={20} color={theme.colors.primary} />}
              style={styles.actionButton}
              onPress={() => router.push('/maintenance/add')}
            >
              Maintenance
            </Button>
            <Button
              mode="outlined"
              icon={() => <DollarSign size={20} color={theme.colors.primary} />}
              style={styles.actionButton}
              onPress={() => router.push('/finance/vouchers/add')}
            >
              Add Voucher
            </Button>
          </>
        );
    }
  };

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

      {/* Financial Overview - Show different metrics based on role */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.metricsContainer}>
          {user?.role !== 'tenant' && (
            <>
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
            </>
          )}
          
          {user?.role === 'tenant' && (
            <>
              <Surface style={[styles.metricCard, shadows.medium, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text style={styles.metricLabel}>Next Payment</Text>
                <Text style={styles.metricValue}>$1,200</Text>
                <Text style={styles.metricSubtext}>Due in 15 days</Text>
              </Surface>
              
              <Surface style={[styles.metricCard, shadows.medium, { backgroundColor: theme.colors.secondaryContainer }]}>
                <Text style={styles.metricLabel}>Open Issues</Text>
                <Text style={styles.metricValue}>{maintenanceRequests.length}</Text>
              </Surface>
              
              <Surface style={[styles.metricCard, shadows.medium, { backgroundColor: theme.colors.tertiaryContainer }]}>
                <Text style={styles.metricLabel}>Documents</Text>
                <Text style={styles.metricValue}>5</Text>
                <Text style={styles.metricSubtext}>2 need attention</Text>
              </Surface>
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsContainer}>
        {renderQuickActions()}
      </View>
      
      {/* Role-specific sections */}
      {user?.role === 'tenant' ? (
        <>
          <View style={styles.listHeaderContainer}>
            <Text style={styles.sectionTitle}>My Rentals</Text>
          </View>
          {/* Show tenant's rented properties */}
          
          <View style={styles.listHeaderContainer}>
            <Text style={styles.sectionTitle}>Maintenance Requests</Text>
          </View>
          {/* Show tenant's maintenance requests */}
          
          <View style={styles.listHeaderContainer}>
            <Text style={styles.sectionTitle}>Payment History</Text>
          </View>
          {/* Show tenant's payment history */}
        </>
      ) : user?.role === 'owner' ? (
        <>
          <View style={styles.listHeaderContainer}>
            <Text style={styles.sectionTitle}>My Properties</Text>
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
          {/* Show owner's properties */}
          
          <View style={styles.listHeaderContainer}>
            <Text style={styles.sectionTitle}>Recent Issues</Text>
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
          {/* Show maintenance issues for owner's properties */}
          
          <View style={styles.listHeaderContainer}>
            <Text style={styles.sectionTitle}>Financial Summary</Text>
            <Button
              mode="text"
              onPress={() => router.push('/finance')}
              style={styles.viewAllButton}
              labelStyle={styles.viewAllLabel}
              contentStyle={{ flexDirection: 'row-reverse' }}
              icon="arrow-right"
            >
              View All
            </Button>
          </View>
          {/* Show financial summary for owner's properties */}
        </>
      ) : (
        <>
          {/* Keep existing manager view sections */}
        </>
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
  metricSubtext: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: spacing.xs,
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
});