import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import ModernHeader from '../../components/ModernHeader';
import StatCard from '../../components/StatCard';
import { toArabicNumerals, formatDisplayNumber } from '@/lib/formatters';

interface PropertyOwnerDashboardProps {}

export default function PropertyOwnerDashboard({}: PropertyOwnerDashboardProps) {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  
  // Mock owner ID - in real app, get from auth context
  const ownerId = '1'; // Replace with actual owner ID from auth

  // API calls for dashboard data
  const { 
    data: properties, 
    loading: propertiesLoading, 
    error: propertiesError,
    refetch: refetchProperties 
  } = useApi(() => api.ownerProperty.getMyProperties(ownerId), [ownerId]);

  const { 
    data: bids, 
    loading: bidsLoading, 
    error: bidsError,
    refetch: refetchBids 
  } = useApi(() => api.bidding.getBidsOnMyProperties(ownerId), [ownerId]);

  const { 
    data: maintenanceRequests, 
    loading: maintenanceLoading, 
    error: maintenanceError,
    refetch: refetchMaintenance 
  } = useApi(() => api.ownerMaintenance.getMaintenanceRequestsForMyProperties(ownerId), [ownerId]);

  const styles = getStyles(theme);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchProperties(),
        refetchBids(),
        refetchMaintenance()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate dashboard statistics
  const totalProperties = properties?.length || 0;
  const occupiedProperties = properties?.filter(p => p.contracts?.some(c => c.status === 'active')).length || 0;
  const vacantProperties = totalProperties - occupiedProperties;
  const pendingBids = bids?.filter(b => b.bid_status === 'manager_approved').length || 0;
  const urgentMaintenance = maintenanceRequests?.filter(r => r.priority === 'urgent' || r.priority === 'high').length || 0;

  // Calculate monthly revenue
  const monthlyRevenue = properties?.reduce((total, property) => {
    const activeContract = property.contracts?.find(c => c.status === 'active');
    return total + (activeContract?.rent_amount || 0);
  }, 0) || 0;

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/owner/properties')}
        >
          <MaterialIcons name="home" size={24} color={theme.colors.primary} />
          <Text style={styles.actionText}>My Properties</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/owner/add-property')}
        >
          <MaterialIcons name="add-home" size={24} color={theme.colors.primary} />
          <Text style={styles.actionText}>Add Property</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/owner/bids')}
        >
          <MaterialIcons name="gavel" size={24} color={theme.colors.primary} />
          <Text style={styles.actionText}>Manage Bids</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/owner/maintenance')}
        >
          <MaterialIcons name="build" size={24} color={theme.colors.primary} />
          <Text style={styles.actionText}>Maintenance</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/owner/browse-properties')}
        >
          <MaterialIcons name="search" size={24} color={theme.colors.primary} />
          <Text style={styles.actionText}>Buy Properties</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/owner/analytics')}
        >
          <MaterialIcons name="analytics" size={24} color={theme.colors.primary} />
          <Text style={styles.actionText}>Analytics</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentBids = () => {
    if (!bids || bids.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bids</Text>
          <Text style={styles.emptyText}>No pending bids</Text>
        </View>
      );
    }

    const recentBids = bids.slice(0, 3);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bids</Text>
          <TouchableOpacity onPress={() => router.push('/owner/bids')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {recentBids.map((bid) => (
          <TouchableOpacity 
            key={bid.id} 
            style={styles.bidCard}
            onPress={() => router.push(`/owner/bids/${bid.id}`)}
          >
            <View style={styles.bidHeader}>
              <Text style={styles.bidProperty}>{bid.property?.title}</Text>
              <Text style={styles.bidAmount}>{toArabicNumerals(new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(bid.bid_amount))} ر.س</Text>
            </View>
            <Text style={styles.bidBidder}>
              {bid.bidder?.first_name} {bid.bidder?.last_name}
            </Text>
            <View style={styles.bidFooter}>
              <Text style={styles.bidType}>{bid.bid_type === 'rental' ? 'Rental' : 'Purchase'}</Text>
              <Text style={styles.bidStatus}>{bid.bid_status.replace('_', ' ')}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMaintenanceAlerts = () => {
    if (!maintenanceRequests || maintenanceRequests.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance Alerts</Text>
          <Text style={styles.emptyText}>No maintenance requests</Text>
        </View>
      );
    }

    const urgentRequests = maintenanceRequests.filter(r => 
      r.priority === 'urgent' || r.priority === 'high'
    ).slice(0, 3);

    if (urgentRequests.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance Alerts</Text>
          <Text style={styles.emptyText}>No urgent maintenance</Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Maintenance Alerts</Text>
          <TouchableOpacity onPress={() => router.push('/owner/maintenance')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {urgentRequests.map((request) => (
          <TouchableOpacity 
            key={request.id} 
            style={[styles.maintenanceCard, { 
              borderLeftColor: request.priority === 'urgent' ? theme.colors.error : theme.colors.warning 
            }]}
            onPress={() => router.push(`/owner/maintenance/${request.id}`)}
          >
            <View style={styles.maintenanceHeader}>
              <Text style={styles.maintenanceTitle}>{request.title}</Text>
              <View style={[styles.priorityBadge, { 
                backgroundColor: request.priority === 'urgent' ? theme.colors.error : theme.colors.warning 
              }]}>
                <Text style={styles.priorityText}>{request.priority.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.maintenanceProperty}>{request.property?.title}</Text>
            <Text style={styles.maintenanceTenant}>
              Reported by: {request.tenant?.first_name} {request.tenant?.last_name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (propertiesLoading || bidsLoading || maintenanceLoading) {
    return (
      <View style={styles.container}>
        <ModernHeader title="Property Owner Dashboard" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader title="Property Owner Dashboard" />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Properties"
            value={totalProperties}
            subtitle={`${toArabicNumerals(occupiedProperties)} occupied`}
            color={theme.colors.primary}
            loading={propertiesLoading}
          />
          <StatCard
            title="Monthly Revenue"
            value={monthlyRevenue}
            subtitle="ر.س"
            color={theme.colors.secondary}
            loading={propertiesLoading}
          />
          <StatCard
            title="Pending Bids"
            value={pendingBids}
            subtitle="Need response"
            color={theme.colors.tertiary}
            loading={bidsLoading}
          />
          <StatCard
            title="Urgent Maintenance"
            value={urgentMaintenance}
            subtitle="High priority"
            color={urgentMaintenance > 0 ? theme.colors.error : theme.colors.primary}
            loading={maintenanceLoading}
          />
        </View>

        {renderQuickActions()}
        {renderRecentBids()}
        {renderMaintenanceAlerts()}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  section: {
    margin: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    aspectRatio: 1.2,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  bidCard: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bidProperty: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: 8,
  },
  bidAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  bidBidder: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  bidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidType: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  bidStatus: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  maintenanceCard: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  maintenanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  maintenanceProperty: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  maintenanceTenant: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  bottomSpacing: {
    height: 20,
  },
}); 