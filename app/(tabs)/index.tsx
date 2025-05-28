import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Platform } from 'react-native';
import { Text, Card, Button, IconButton, ActivityIndicator, Surface, Divider, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing, shadows } from '@/lib/theme';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
// import { Wallet, Building2, PlusCircle, ArrowRight, Clock, Tool, DollarSign, AlertCircle, User } from 'lucide-react-native'; // Commented out
import { useAppStore } from '@/lib/store';
// import PropertyCard from '@/components/PropertyCard'; // Commented out
// import MaintenanceRequestCard from '@/components/MaintenanceRequestCard'; // Commented out
// import VoucherCard from '@/components/VoucherCard'; // Commented out
import { Property, MaintenanceRequest, Voucher } from '@/lib/types';
import { supabase } from '@/lib/supabase';

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
  
  // Sample chart data (would fetch from API in a real app)
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [20500, 45000, 28000, 80000, 99000, 43000],
        color: () => theme.colors.primary,
        strokeWidth: 2
      }
    ],
  };

  // Recent activity data (sample)
  const recentActivity = [
    {
      id: '1',
      action: 'New tenant registered',
      timestamp: '2 hours ago',
      user: 'John Doe',
    },
    {
      id: '2',
      action: 'Maintenance request completed',
      timestamp: '5 hours ago',
      user: 'Maintenance Team',
    },
    {
      id: '3',
      action: 'Payment received',
      timestamp: 'Yesterday',
      user: 'Sarah Johnson',
    },
    {
      id: '4',
      action: 'Property inspection scheduled',
      timestamp: '2 days ago',
      user: 'Admin',
    },
  ];

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
        
        // Set the data
        if (propertiesData) setProperties(propertiesData as Property[]);
        if (maintenanceData) setMaintenanceRequests(maintenanceData as MaintenanceRequest[]);
        if (vouchersData) setVouchers(vouchersData as Voucher[]);
        
        // Calculate metrics (sample data for demo)
        setRentCollected(85000);
        setPendingPayments(15000);
        setCollectionRate(85);
        setOccupancyRate(78);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  // For demo purposes, use mock data if Supabase data not available
  useEffect(() => {
    if (properties.length === 0) {
      setProperties([
        {
          id: '1',
          title: 'Modern Apartment',
          description: 'Spacious 2-bedroom apartment with great amenities',
          property_type: 'apartment',
          status: 'available',
          address: '123 Main St',
          city: 'New York',
          country: 'USA',
          neighborhood: 'Downtown',
          area_sqm: 120,
          bedrooms: 2,
          bathrooms: 2,
          price: 2500,
          payment_method: 'cash',
          owner_id: '1',
          created_at: '2023-01-15T12:00:00Z',
          updated_at: '2023-01-15T12:00:00Z',
          images: ['https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg'],
        },
        {
          id: '2',
          title: 'Luxury Villa',
          description: 'Luxurious 4-bedroom villa with pool and garden',
          property_type: 'villa',
          status: 'rented',
          address: '456 Ocean Dr',
          city: 'Miami',
          country: 'USA',
          neighborhood: 'South Beach',
          area_sqm: 350,
          bedrooms: 4,
          bathrooms: 3,
          price: 5000,
          payment_method: 'installment',
          owner_id: '2',
          created_at: '2023-02-20T10:00:00Z',
          updated_at: '2023-02-20T10:00:00Z',
          images: ['https://images.pexels.com/photos/53610/large-home-residential-house-architecture-53610.jpeg'],
        },
      ]);
    }
    
    if (maintenanceRequests.length === 0) {
      setMaintenanceRequests([
        {
          id: '1',
          property_id: '1',
          tenant_id: '1',
          title: 'Leaking Faucet',
          description: 'The kitchen faucet is leaking and needs repair as soon as possible.',
          status: 'pending',
          priority: 'medium',
          created_at: '2023-06-15T09:30:00Z',
          updated_at: '2023-06-15T09:30:00Z',
          images: ['https://images.pexels.com/photos/5490903/pexels-photo-5490903.jpeg'],
        },
        {
          id: '2',
          property_id: '2',
          tenant_id: '2',
          title: 'AC Not Working',
          description: 'The air conditioning unit in the master bedroom is not working properly.',
          status: 'in_progress',
          priority: 'high',
          created_at: '2023-06-14T14:20:00Z',
          updated_at: '2023-06-15T10:15:00Z',
          images: ['https://images.pexels.com/photos/5490903/pexels-photo-5490903.jpeg'],
        },
      ]);
    }
    
    if (vouchers.length === 0) {
      setVouchers([
        {
          id: '1',
          voucher_type: 'receipt',
          voucher_number: 'RV-001',
          amount: 2500,
          currency: 'USD',
          status: 'posted',
          description: 'Monthly rent payment for Unit 101',
          property_id: '1',
          tenant_id: '1',
          created_by: '1',
          created_at: '2023-06-15T09:30:00Z',
          updated_at: '2023-06-15T09:30:00Z',
        },
        {
          id: '2',
          voucher_type: 'payment',
          voucher_number: 'PV-001',
          amount: 500,
          currency: 'USD',
          status: 'draft',
          description: 'Maintenance expense for Unit 202',
          property_id: '2',
          created_by: '1',
          created_at: '2023-06-14T14:20:00Z',
          updated_at: '2023-06-14T14:20:00Z',
        },
      ]);
    }
  }, [properties, maintenanceRequests, vouchers]);
  
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
          <Image
            source={{ uri: user?.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' }}
            style={styles.profileImage}
          />
        </View>
      </View>
      
      {/* Financial Overview */}
      <Text style={styles.sectionTitle}>Financial Overview</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.metricsContainer}>
          <Surface style={[styles.metricCard, shadows.medium, { backgroundColor: theme.colors.primaryContainer }]}>
            {/* <View style={styles.metricIconContainer}>
              <Wallet size={24} color={theme.colors.primary} />
            </View> */}
            <Text style={styles.metricLabel}>Rent Collected</Text>
            <Text style={styles.metricValue}>${rentCollected.toLocaleString()}</Text>
            <Text style={styles.metricTrend}>+5% from last month</Text>
          </Surface>
          
          <Surface style={[styles.metricCard, shadows.medium, { backgroundColor: theme.colors.errorContainer }]}>
            {/* <View style={styles.metricIconContainer}>
              <AlertCircle size={24} color={theme.colors.error} />
            </View> */}
            <Text style={styles.metricLabel}>Pending Payments</Text>
            <Text style={styles.metricValue}>${pendingPayments.toLocaleString()}</Text>
            <Text style={styles.metricTrend}>-2% from last month</Text>
          </Surface>
          
          <Surface style={[styles.metricCard, shadows.medium, { backgroundColor: theme.colors.tertiaryContainer }]}>
            {/* <View style={styles.metricIconContainer}>
              <DollarSign size={24} color={theme.colors.tertiary} />
            </View> */}
            <Text style={styles.metricLabel}>Collection Rate</Text>
            <Text style={styles.metricValue}>{collectionRate}%</Text>
            <ProgressBar progress={collectionRate/100} color={theme.colors.tertiary} style={styles.progressBar} />
          </Surface>
          
          <Surface style={[styles.metricCard, shadows.medium, { backgroundColor: theme.colors.secondaryContainer }]}>
            {/* <View style={styles.metricIconContainer}>
              <Building2 size={24} color={theme.colors.secondary} />
            </View> */}
            <Text style={styles.metricLabel}>Occupancy Rate</Text>
            <Text style={styles.metricValue}>{occupancyRate}%</Text>
            <ProgressBar progress={occupancyRate/100} color={theme.colors.secondary} style={styles.progressBar} />
          </Surface>
        </View>
      </ScrollView>
      
      {/* Revenue Chart */}
      <Surface style={[styles.chartCard, shadows.medium]}>
        <Text style={styles.chartTitle}>Monthly Revenue</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width > 500 ? 
              Dimensions.get('window').width - 40 : 
              Dimensions.get('window').width * 1.2}
            height={220}
            yAxisLabel="$"
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 0,
              color: () => theme.colors.primary,
              labelColor: () => theme.colors.onSurfaceVariant,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: theme.colors.primary,
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </ScrollView>
      </Surface>
      
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
          {/* {properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))} */}
        </View>
      ) : (
        <Surface style={[styles.emptyStateContainer, shadows.small]}>
          {/* <Building2 size={48} color={theme.colors.onSurfaceVariant} /> */}
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
          {/* {maintenanceRequests.map(request => (
            <MaintenanceRequestCard key={request.id} request={request} />
          ))} */}
        </View>
      ) : (
        <Surface style={[styles.emptyStateContainer, shadows.small]}>
          {/* <Tool size={48} color={theme.colors.onSurfaceVariant} /> */}
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
      
      {/* Vouchers Section - Assuming it exists, if not, this won't apply */}
      {/* If you have a similar vouchers mapping, comment it out:
      {vouchers.length > 0 ? (
        <View style={styles.vouchersContainer}> // Or similar style name
          {vouchers.map(voucher => (
            <VoucherCard key={voucher.id} voucher={voucher} />
          ))}
        </View>
      ) : (
        <Surface style={[styles.emptyStateContainer, shadows.small]}>
          <DollarSign size={48} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.emptyStateText}>No vouchers found</Text>
          <Button
            mode="contained"
            onPress={() => router.push('/finance/vouchers/add')}
            icon="plus-circle-outline"
          >
            Add Voucher
          </Button>
        </Surface>
      )}
      */}
      
      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <Surface style={[styles.activityCard, shadows.small]}>
        {recentActivity.map((activity, index) => (
          <React.Fragment key={activity.id}>
            <View style={styles.activityItem}>
              {/* <View style={styles.activityIconContainer}>
                <Clock size={16} color={theme.colors.onSurfaceVariant} />
              </View> */}
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{activity.action}</Text>
                <View style={styles.activityMeta}>
                  <Text style={styles.activityUser}>{activity.user}</Text>
                  <Text style={styles.activityTime}>{activity.timestamp}</Text>
                </View>
              </View>
            </View>
            {index < recentActivity.length - 1 && <Divider style={styles.activityDivider} />}
          </React.Fragment>
        ))}
      </Surface>
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