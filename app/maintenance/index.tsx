import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Button, FAB, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useApi } from '@/hooks/useApi';
import { maintenanceApi } from '@/lib/api';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatusUpdateModal from '@/components/StatusUpdateModal';
import { Wrench, Plus, Filter, Calendar, MapPin, User, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react-native';
import { useTranslation } from '@/lib/useTranslation';

type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  property?: {
    title: string;
    address: string;
    property_code: string;
  };
  tenant?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  work_orders?: any[];
};

const STATUS_COLORS = {
  pending: '#FF9800',
  approved: '#2196F3',
  in_progress: '#9C27B0',
  completed: '#4CAF50',
  cancelled: '#F44336',
};

const PRIORITY_COLORS = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#FF5722',
  urgent: '#F44336',
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle2,
  in_progress: Wrench,
  completed: CheckCircle2,
  cancelled: XCircle,
};

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export default function MaintenanceRequestsScreen() {
  const router = useRouter();
  const { t } = useTranslation('maintenance');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedRequestForUpdate, setSelectedRequestForUpdate] = useState<MaintenanceRequest | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const {
    data: maintenanceRequests,
    loading,
    error,
    refetch
  } = useApi(() => maintenanceApi.getRequests(), []);

  const filteredRequests = React.useMemo(() => {
    if (!maintenanceRequests) return [];

    return maintenanceRequests.filter((request: MaintenanceRequest) => {
      // Search filter
      const searchTerm = searchQuery.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        request.title.toLowerCase().includes(searchTerm) ||
        request.description.toLowerCase().includes(searchTerm) ||
        request.property?.title.toLowerCase().includes(searchTerm) ||
        `${request.tenant?.first_name} ${request.tenant?.last_name}`.toLowerCase().includes(searchTerm);

      // Status filter
      const matchesStatus = selectedStatus === '' || request.status === selectedStatus;

      // Priority filter
      const matchesPriority = selectedPriority === '' || request.priority === selectedPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [maintenanceRequests, searchQuery, selectedStatus, selectedPriority]);

  const handleStatusUpdate = useCallback(async (status: string, notes?: string, actualCost?: number) => {
    if (!selectedRequestForUpdate) return;

    setStatusUpdateLoading(true);
    try {
      const updateData: any = { status };
      if (notes) updateData.notes = notes;

      const result = await maintenanceApi.updateRequest(selectedRequestForUpdate.id, updateData);
      
      if (result.error) {
        Alert.alert(t('common:error'), result.error.message);
      } else {
        Alert.alert(t('common:success'), t('requestUpdated'));
        setStatusModalVisible(false);
        setSelectedRequestForUpdate(null);
        refetch();
      }
    } catch (error) {
      Alert.alert(t('common:error'), 'Failed to update status');
    } finally {
      setStatusUpdateLoading(false);
    }
  }, [selectedRequestForUpdate, refetch, t]);

  const openStatusModal = useCallback((request: MaintenanceRequest) => {
    setSelectedRequestForUpdate(request);
    setStatusModalVisible(true);
  }, []);

  const clearFilters = () => {
    setSelectedStatus('');
    setSelectedPriority('');
    setSearchQuery('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderMaintenanceCard = ({ item }: { item: MaintenanceRequest }) => {
    const StatusIcon = STATUS_ICONS[item.status];
    
    return (
      <ModernCard 
        style={styles.requestCard}
        onPress={() => router.push(`/maintenance/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.statusContainer}>
            <StatusIcon 
              size={16} 
              color={STATUS_COLORS[item.status]} 
            />
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
              {t(`statuses.${item.status}`).toUpperCase()}
            </Text>
          </View>
          <Chip 
            style={[styles.priorityChip, { backgroundColor: PRIORITY_COLORS[item.priority] + '20' }]}
            textStyle={{ color: PRIORITY_COLORS[item.priority], fontSize: 12 }}
          >
            {t(`priorities.${item.priority}`)}
          </Chip>
        </View>

        <Text style={styles.requestTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <Text style={styles.requestDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {item.property && (
          <View style={styles.infoRow}>
            <MapPin size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.property.title} - {item.property.address}
            </Text>
          </View>
        )}

        {item.tenant && (
          <View style={styles.infoRow}>
            <User size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.infoText}>
              {item.tenant.first_name} {item.tenant.last_name}
            </Text>
            {item.tenant.phone && (
              <Text style={styles.phoneText}>• {item.tenant.phone}</Text>
            )}
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.dateContainer}>
            <Calendar size={12} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.dateText}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          <Button 
            mode="outlined" 
            size="small"
            onPress={() => openStatusModal(item)}
          >
            {t('updateStatus')}
          </Button>
        </View>
      </ModernCard>
    );
  };

  const renderFilters = () => {
    if (!showFilters) return null;

    const statusOptions = ['pending', 'approved', 'in_progress', 'completed', 'cancelled'];
    const priorityOptions = ['low', 'medium', 'high', 'urgent'];

    return (
      <ModernCard style={styles.filtersCard}>
        <View style={styles.filtersHeader}>
          <Text style={styles.filtersTitle}>{t('filterByStatus')}</Text>
          <Button onPress={clearFilters} mode="text">
            {t('common:clear')}
          </Button>
        </View>
        
        <View style={styles.filterChips}>
          <Chip 
            selected={selectedStatus === ''}
            onPress={() => setSelectedStatus('')}
            style={styles.filterChip}
          >
            {t('common:all')}
          </Chip>
          {statusOptions.map(status => (
            <Chip
              key={status}
              selected={selectedStatus === status}
              onPress={() => setSelectedStatus(status)}
              style={styles.filterChip}
            >
              {t(`statuses.${status}`).toUpperCase()}
            </Chip>
          ))}
        </View>

        <Text style={styles.filtersTitle}>{t('filterByPriority')}</Text>
        <View style={styles.filterChips}>
          <Chip
            selected={selectedPriority === ''}
            onPress={() => setSelectedPriority('')}
            style={styles.filterChip}
          >
            {t('common:all')}
          </Chip>
          {priorityOptions.map(priority => (
            <Chip
              key={priority}
              selected={selectedPriority === priority}
              onPress={() => setSelectedPriority(priority)}
              style={styles.filterChip}
            >
              {t(`priorities.${priority}`)}
            </Chip>
          ))}
        </View>
      </ModernCard>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Wrench size={64} color={theme.colors.onSurfaceVariant} />
      <Text style={styles.emptyTitle}>
        {filteredRequests.length === 0 && maintenanceRequests?.length > 0 
          ? t('noMaintenanceRequests')
          : t('addFirstRequest')
        }
      </Text>
      <Text style={styles.emptySubtitle}>
        {filteredRequests.length === 0 && maintenanceRequests?.length > 0 
          ? t('adjustSearchOrFilters')
          : t('description')
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ModernHeader title={t('title')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('common:loading')}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ModernHeader title={t('title')} />
        <View style={styles.errorContainer}>
          <AlertTriangle size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>{t('common:error')}</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <Button mode="contained" onPress={refetch}>
            {t('common:retry')}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader 
        title={t('title')}
        subtitle={t('subtitle')}
      />
      
      <View style={styles.content}>
        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={t('searchPlaceholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          <Button 
            mode="outlined" 
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterButton}
          >
            <Filter size={16} />
          </Button>
        </View>

        {/* Filters */}
        {renderFilters()}

        {/* Requests List */}
        <FlatList
          data={filteredRequests}
          renderItem={renderMaintenanceCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} />
          }
          ListEmptyComponent={renderEmpty}
        />

        {/* Add Request FAB */}
        <FAB
          icon={() => <Plus size={24} color="white" />}
          style={styles.fab}
          onPress={() => router.push('/maintenance/add')}
          label={t('addRequest')}
        />

        {/* Status Update Modal */}
        <StatusUpdateModal
          visible={statusModalVisible}
          onDismiss={() => {
            setStatusModalVisible(false);
            setSelectedRequestForUpdate(null);
          }}
          onUpdate={handleStatusUpdate}
          currentStatus={selectedRequestForUpdate?.status || 'pending'}
          loading={statusUpdateLoading}
          title={t('updateStatus')}
          itemType="maintenance_request"
        />
      </View>
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
    paddingHorizontal: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  searchBar: {
    flex: 1,
    elevation: 2,
  },
  filterButton: {
    elevation: 2,
  },
  filtersCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 1,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: 0,
  },
  listContainer: {
    paddingBottom: 100,
  },
  requestCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  priorityChip: {
    height: 28,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  requestDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: spacing.xs,
    flex: 1,
  },
  phoneText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline + '30',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
}); 