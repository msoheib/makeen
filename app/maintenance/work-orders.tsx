import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Chip, Searchbar, Button, Portal, Modal, FAB } from 'react-native-paper';
import { useTheme } from '../../lib/theme';
import { useApi } from '../../hooks/useApi';
import { maintenanceApi, profilesApi } from '../../lib/api';
import ModernHeader from '../../components/ModernHeader';
import { formatDisplayNumber, formatCurrency, toArabicNumerals } from '@/lib/formatters';

const WORK_ORDER_STATUSES = [
  { value: 'all', label: 'All', color: '#6750A4' },
  { value: 'assigned', label: 'Assigned', color: '#1976D2' },
  { value: 'in_progress', label: 'In Progress', color: '#F57C00' },
  { value: 'completed', label: 'Completed', color: '#388E3C' },
  { value: 'cancelled', label: 'Cancelled', color: '#D32F2F' },
];

interface WorkOrder {
  id: string;
  description: string;
  estimated_cost: number;
  actual_cost?: number;
  start_date: string;
  completion_date?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  maintenance_request: {
    id: string;
    title: string;
    priority: string;
    property: {
      id: string;
      title: string;
      address: string;
    };
    tenant: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };
  assigned_to: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

interface Contractor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
}

const WorkOrderCard: React.FC<{
  workOrder: WorkOrder;
  onStatusUpdate: (id: string, status: string) => void;
  onAssign: (id: string) => void;
  onViewDetails: (id: string) => void;
}> = ({ workOrder, onStatusUpdate, onAssign, onViewDetails }) => {
  const { theme } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return '#1976D2';
      case 'in_progress': return '#F57C00';
      case 'completed': return '#388E3C';
      case 'cancelled': return '#D32F2F';
      default: return theme.colors.primary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#D32F2F';
      case 'high': return '#FF9800';
      case 'medium': return '#1976D2';
      case 'low': return '#388E3C';
      default: return theme.colors.primary;
    }
  };

  const getProgressPercentage = () => {
    switch (workOrder.status) {
      case 'assigned': return 25;
      case 'in_progress': return 75;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.workOrderCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => onViewDetails(workOrder.id)}
      activeOpacity={0.7}
    >
      {/* Header with Status and Priority */}
      <View style={styles.cardHeader}>
        <View style={styles.statusContainer}>
          <Chip
            mode="flat"
            textStyle={{ color: 'white', fontSize: 12, fontWeight: '600' }}
            style={{ backgroundColor: getStatusColor(workOrder.status) }}
          >
            {workOrder.status.replace('_', ' ').toUpperCase()}
          </Chip>
          <Chip
            mode="flat"
            textStyle={{ color: 'white', fontSize: 12, fontWeight: '600' }}
            style={{ backgroundColor: getPriorityColor(workOrder.maintenance_request.priority) }}
          >
            {workOrder.maintenance_request.priority.toUpperCase()}
          </Chip>
        </View>
        <Text style={[styles.workOrderId, { color: theme.colors.onSurfaceVariant }]}>
          WO-{workOrder.id.slice(-8)}
        </Text>
      </View>

      {/* Description */}
      <Text style={[styles.description, { color: theme.colors.onSurface }]} numberOfLines={2}>
        {workOrder.description}
      </Text>

      {/* Related Maintenance Request */}
      <View style={styles.relatedRequest}>
        <MaterialIcons name="build" size={16} color={theme.colors.primary} />
        <Text style={[styles.relatedRequestText, { color: theme.colors.primary }]}>
          {workOrder.maintenance_request.title}
        </Text>
      </View>

      {/* Property and Tenant Info */}
      <View style={styles.propertyInfo}>
        <View style={styles.propertyRow}>
          <MaterialIcons name="location-on" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.propertyText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
            {workOrder.maintenance_request.property.title}
          </Text>
        </View>
        <View style={styles.propertyRow}>
          <MaterialIcons name="person" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.propertyText, { color: theme.colors.onSurfaceVariant }]}>
            {workOrder.maintenance_request.tenant.first_name} {workOrder.maintenance_request.tenant.last_name}
          </Text>
        </View>
      </View>

      {/* Assigned Contractor */}
      <View style={styles.assignedSection}>
        <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
          Assigned to:
        </Text>
        <View style={styles.contractorInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={[styles.avatarText, { color: theme.colors.onPrimaryContainer }]}>
              {workOrder.assigned_to.first_name[0]}{workOrder.assigned_to.last_name[0]}
            </Text>
          </View>
          <View style={styles.contractorDetails}>
            <Text style={[styles.contractorName, { color: theme.colors.onSurface }]}>
              {workOrder.assigned_to.first_name} {workOrder.assigned_to.last_name}
            </Text>
            <Text style={[styles.contractorContact, { color: theme.colors.onSurfaceVariant }]}>
              {workOrder.assigned_to.phone}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.reassignButton}
            onPress={() => onAssign(workOrder.id)}
          >
            <MaterialIcons name="swap-horiz" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: theme.colors.onSurfaceVariant }]}>
            Progress
          </Text>
          <Text style={[styles.progressPercentage, { color: theme.colors.primary }]}> 
            {toArabicNumerals(`${getProgressPercentage()}%`)}
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.outline }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: getStatusColor(workOrder.status),
                width: `${getProgressPercentage()}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Cost Information */}
      <View style={styles.costSection}>
        <View style={styles.costItem}>
          <Text style={[styles.costLabel, { color: theme.colors.onSurfaceVariant }]}>
            Estimated
          </Text>
          <Text style={[styles.costValue, { color: theme.colors.onSurface }]}> 
            {toArabicNumerals(new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(workOrder.estimated_cost))} ر.س
          </Text>
        </View>
        {workOrder.actual_cost && (
          <View style={styles.costItem}>
            <Text style={[styles.costLabel, { color: theme.colors.onSurfaceVariant }]}>
              Actual
            </Text>
            <Text style={[styles.costValue, { color: theme.colors.onSurface }]}> 
              {toArabicNumerals(new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(workOrder.actual_cost))} ر.س
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {workOrder.status === 'assigned' && (
          <Button
            mode="contained-tonal"
            onPress={() => onStatusUpdate(workOrder.id, 'in_progress')}
            style={styles.actionButton}
          >
            Start Work
          </Button>
        )}
        {workOrder.status === 'in_progress' && (
          <Button
            mode="contained"
            onPress={() => onStatusUpdate(workOrder.id, 'completed')}
            style={styles.actionButton}
          >
            Complete
          </Button>
        )}
        {(workOrder.status === 'assigned' || workOrder.status === 'in_progress') && (
          <Button
            mode="outlined"
            onPress={() => onStatusUpdate(workOrder.id, 'cancelled')}
            style={styles.actionButton}
            textColor={theme.colors.error}
          >
            Cancel
          </Button>
        )}
      </View>
    </TouchableOpacity>
  );
};

const AssignmentModal: React.FC<{
  visible: boolean;
  workOrderId: string | null;
  contractors: Contractor[];
  onDismiss: () => void;
  onAssign: (workOrderId: string, contractorId: string) => void;
}> = ({ visible, workOrderId, contractors, onDismiss, onAssign }) => {
  const { theme } = useTheme();

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[
        styles.modalContainer,
        { backgroundColor: theme.colors.surface }
      ]}>
        <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
          Assign Work Order
        </Text>
        <Text style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          Select a contractor to assign this work order to:
        </Text>
        
        <ScrollView style={styles.contractorsList}>
          {contractors.map((contractor) => (
            <TouchableOpacity
              key={contractor.id}
              style={[styles.contractorOption, { borderColor: theme.colors.outline }]}
              onPress={() => {
                if (workOrderId) {
                  onAssign(workOrderId, contractor.id);
                  onDismiss();
                }
              }}
            >
              <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text style={[styles.avatarText, { color: theme.colors.onPrimaryContainer }]}>
                  {contractor.first_name[0]}{contractor.last_name[0]}
                </Text>
              </View>
              <View style={styles.contractorDetails}>
                <Text style={[styles.contractorName, { color: theme.colors.onSurface }]}>
                  {contractor.first_name} {contractor.last_name}
                </Text>
                <Text style={[styles.contractorContact, { color: theme.colors.onSurfaceVariant }]}>
                  {contractor.email}
                </Text>
                <Text style={[styles.contractorContact, { color: theme.colors.onSurfaceVariant }]}>
                  {contractor.phone}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.modalActions}>
          <Button mode="outlined" onPress={onDismiss}>
            Cancel
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

export default function WorkOrdersScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);

  // API calls
  const {
    data: workOrders,
    loading: workOrdersLoading,
    error: workOrdersError,
    refetch: refetchWorkOrders,
  } = useApi(() => maintenanceApi.getWorkOrders(), []);

  const {
    data: contractors,
    loading: contractorsLoading,
  } = useApi(() => profilesApi.getAll({ role: 'contractor' }), []);

  // Filter and search work orders
  const filteredWorkOrders = useMemo(() => {
    if (!workOrders) return [];
    
    let filtered = workOrders;
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((wo: WorkOrder) => wo.status === selectedStatus);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((wo: WorkOrder) =>
        wo.description.toLowerCase().includes(query) ||
        wo.maintenance_request.title.toLowerCase().includes(query) ||
        wo.maintenance_request.property.title.toLowerCase().includes(query) ||
        `${wo.assigned_to.first_name} ${wo.assigned_to.last_name}`.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [workOrders, selectedStatus, searchQuery]);

  const handleStatusUpdate = async (workOrderId: string, newStatus: string) => {
    try {
      const result = await maintenanceApi.updateWorkOrder(workOrderId, {
        status: newStatus as any,
        ...(newStatus === 'completed' && { completion_date: new Date().toISOString() }),
      });

      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        Alert.alert('Success', `Work order ${newStatus.replace('_', ' ')} successfully`);
        refetchWorkOrders();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update work order status');
    }
  };

  const handleAssignWorkOrder = async (workOrderId: string, contractorId: string) => {
    try {
      const result = await maintenanceApi.updateWorkOrder(workOrderId, {
        assigned_to: contractorId,
      });

      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        Alert.alert('Success', 'Work order assigned successfully');
        refetchWorkOrders();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to assign work order');
    }
  };

  const handleViewDetails = (workOrderId: string) => {
    // Navigate to work order details screen (future implementation)
    console.log('View work order details:', workOrderId);
  };

  const openAssignmentModal = (workOrderId: string) => {
    setSelectedWorkOrderId(workOrderId);
    setAssignmentModalVisible(true);
  };

  if (workOrdersLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Work Orders" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading work orders...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (workOrdersError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Work Orders" />
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Failed to load work orders
          </Text>
          <Button mode="contained" onPress={refetchWorkOrders} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader title="Work Orders" />
      
      <View style={styles.centerContainer}>
        <Text style={[styles.comingSoonText, { color: theme.colors.onSurface }]}>
          Work Orders Management
        </Text>
        <Text style={[styles.comingSoonSubtext, { color: theme.colors.onSurfaceVariant }]}>
          Coming Soon
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  statusTabs: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statusTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    elevation: 1,
  },
  statusTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  workOrdersList: {
    padding: 16,
  },
  workOrderCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  workOrderId: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  relatedRequest: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  relatedRequestText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  propertyInfo: {
    marginBottom: 16,
    gap: 4,
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  propertyText: {
    fontSize: 14,
    flex: 1,
  },
  assignedSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  contractorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contractorDetails: {
    flex: 1,
  },
  contractorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  contractorContact: {
    fontSize: 12,
  },
  reassignButton: {
    padding: 8,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  costSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  costItem: {
    flex: 1,
  },
  costLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  contractorsList: {
    maxHeight: 300,
  },
  contractorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
}); 