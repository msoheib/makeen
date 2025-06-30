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

interface MaintenanceManagementProps {}

export default function MaintenanceManagement({}: MaintenanceManagementProps) {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'in_progress' | 'completed'>('all');
  
  // Mock owner ID - in real app, get from auth context
  const ownerId = '1'; // Replace with actual owner ID from auth

  const { 
    data: maintenanceData, 
    loading, 
    error,
    refetch 
  } = useApi(() => api.ownerMaintenance.getMaintenanceRequests(ownerId), [ownerId]);

  const { 
    data: workOrders, 
    loading: workOrdersLoading,
    refetch: refetchWorkOrders 
  } = useApi(() => api.ownerMaintenance.getMyWorkOrders(ownerId), [ownerId]);

  const styles = getStyles(theme);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchWorkOrders()]);
    } catch (error) {
      console.error('Error refreshing maintenance data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const result = await api.ownerMaintenance.approveMaintenanceRequest(requestId, ownerId);
      if (result.success) {
        Alert.alert('Success', 'Maintenance request approved successfully');
        await refetch();
      } else {
        Alert.alert('Error', result.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleCreateWorkOrder = (request: any) => {
    router.push({
      pathname: '/owner/maintenance/create-work-order',
      params: {
        requestId: request.id,
        propertyId: request.property_id,
        tenantId: request.tenant_id,
        title: request.title,
        description: request.description
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'approved': return theme.colors.primary;
      case 'in_progress': return theme.colors.secondary;
      case 'completed': return theme.colors.tertiary;
      case 'cancelled': return theme.colors.error;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return theme.colors.error;
      case 'high': return '#FF6B35';
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.onSurfaceVariant;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  const filteredRequests = maintenanceData?.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  }) || [];

  const renderFilterTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {['all', 'pending', 'approved', 'in_progress', 'completed'].map((filterOption) => (
        <TouchableOpacity
          key={filterOption}
          style={[
            styles.filterTab,
            filter === filterOption && styles.activeFilterTab
          ]}
          onPress={() => setFilter(filterOption as any)}
        >
          <Text style={[
            styles.filterText,
            filter === filterOption && styles.activeFilterText
          ]}>
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1).replace('_', ' ')}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderMaintenanceCard = (request: any) => {
    const hasWorkOrder = workOrders?.some(wo => wo.maintenance_request_id === request.id);
    
    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.requestTitle} numberOfLines={2}>{request.title}</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                <Text style={styles.statusText}>{request.status.replace('_', ' ').toUpperCase()}</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) }]}>
                <Text style={styles.priorityText}>{request.priority.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.propertyInfo}>
            <MaterialIcons name="home" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.propertyText} numberOfLines={1}>
              {request.property?.title || 'Property'}
            </Text>
          </View>
          
          <View style={styles.tenantInfo}>
            <MaterialIcons name="person" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.tenantText}>
              {request.tenant?.first_name} {request.tenant?.last_name}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {request.description}
        </Text>

        <View style={styles.requestFooter}>
          <Text style={styles.timeText}>
            Submitted {formatTimeAgo(request.created_at)}
          </Text>

          <View style={styles.actionButtons}>
            {request.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApproveRequest(request.id)}
                >
                  <MaterialIcons name="check" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.createWorkOrderButton]}
                  onPress={() => handleCreateWorkOrder(request)}
                >
                  <MaterialIcons name="build" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Create Work Order</Text>
                </TouchableOpacity>
              </>
            )}

            {request.status === 'approved' && !hasWorkOrder && (
              <TouchableOpacity
                style={[styles.actionButton, styles.createWorkOrderButton]}
                onPress={() => handleCreateWorkOrder(request)}
              >
                <MaterialIcons name="build" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Create Work Order</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={() => router.push(`/owner/maintenance/${request.id}`)}
            >
              <MaterialIcons name="visibility" size={16} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {hasWorkOrder && (
          <View style={styles.workOrderNotice}>
            <MaterialIcons name="build" size={16} color={theme.colors.secondary} />
            <Text style={styles.workOrderText}>Work order created</Text>
          </View>
        )}
      </View>
    );
  };

  const renderStats = () => {
    const total = maintenanceData?.length || 0;
    const pending = maintenanceData?.filter(r => r.status === 'pending').length || 0;
    const inProgress = maintenanceData?.filter(r => r.status === 'in_progress').length || 0;
    const urgent = maintenanceData?.filter(r => r.priority === 'urgent').length || 0;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Total Requests</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, urgent > 0 && { color: theme.colors.error }]}>
            {urgent}
          </Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ModernHeader 
          title="Maintenance" 
          rightIcon="add"
          onRightPress={() => router.push('/owner/maintenance/create-request')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading maintenance requests...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ModernHeader 
          title="Maintenance" 
          rightIcon="add"
          onRightPress={() => router.push('/owner/maintenance/create-request')}
        />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>Failed to load maintenance requests</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="Maintenance" 
        rightIcon="add"
        onRightPress={() => router.push('/owner/maintenance/create-request')}
      />
      
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
        {renderStats()}
        {renderFilterTabs()}

        <View style={styles.requestsContainer}>
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="build" size={64} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.emptyTitle}>
                {filter === 'all' ? 'No maintenance requests' : `No ${filter.replace('_', ' ')} requests`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all' 
                  ? 'Maintenance requests from tenants will appear here'
                  : `No requests with ${filter.replace('_', ' ')} status at the moment`
                }
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultsText}>
                {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
                {filter !== 'all' && ` • ${filter.replace('_', ' ')}`}
              </Text>
              {filteredRequests.map(renderMaintenanceCard)}
            </>
          )}
        </View>

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  filterContainer: {
    marginTop: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
  },
  activeFilterTab: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
  },
  activeFilterText: {
    color: '#fff',
  },
  requestsContainer: {
    padding: 16,
  },
  resultsText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  requestCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  propertyText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 6,
    flex: 1,
  },
  tenantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tenantText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 6,
  },
  description: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
    marginBottom: 12,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  approveButton: {
    backgroundColor: theme.colors.secondary,
  },
  createWorkOrderButton: {
    backgroundColor: theme.colors.primary,
  },
  viewButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  workOrderNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  workOrderText: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
}); 