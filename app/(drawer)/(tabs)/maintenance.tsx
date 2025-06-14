import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { MaintenanceRequest } from '@/lib/types';
import { PenTool as Tool, Plus, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, Circle as XCircle } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';
import MaintenanceRequestCard from '@/components/MaintenanceRequestCard';
import { useTranslation } from '@/lib/useTranslation';

export default function MaintenanceScreen() {
  const router = useRouter();
  const { t } = useTranslation('maintenance');
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchMaintenanceRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, activeFilter]);

  const fetchMaintenanceRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          property:properties(title, address, city),
          tenant:profiles(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setRequests(data);
        
        // Calculate stats
        const pending = data.filter(r => r.status === 'pending').length;
        const inProgress = data.filter(r => r.status === 'in_progress').length;
        const completed = data.filter(r => r.status === 'completed').length;
        
        setStats({
          total: data.length,
          pending,
          inProgress,
          completed,
        });
      }
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];
    
    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(request => request.status === activeFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(query) ||
        request.description.toLowerCase().includes(query) ||
        request.property?.title?.toLowerCase().includes(query) ||
        `${request.tenant?.first_name} ${request.tenant?.last_name}`.toLowerCase().includes(query)
      );
    }
    
    setFilteredRequests(filtered);
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('title')}
        subtitle={t('subtitle')}
        onNotificationPress={() => router.push('/notifications')}
        onSearchPress={() => router.push('/search')}
      />

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            {
              title: t('totalRequests'),
              value: stats.total.toString(),
              color: theme.colors.primary,
              icon: <Tool size={20} color={theme.colors.primary} />,
            },
            {
              title: t('statuses.pending'),
              value: stats.pending.toString(),
              color: theme.colors.warning,
              icon: <Clock size={20} color={theme.colors.warning} />,
            },
            {
              title: t('statuses.inProgress'),
              value: stats.inProgress.toString(),
              color: theme.colors.secondary,
              icon: <AlertTriangle size={20} color={theme.colors.secondary} />,
            },
            {
              title: t('statuses.completed'),
              value: stats.completed.toString(),
              color: theme.colors.success,
              icon: <CheckCircle size={20} color={theme.colors.success} />,
            },
          ]}
          renderItem={({ item }) => (
            <StatCard
              title={item.title}
              value={item.value}
              color={item.color}
              icon={item.icon}
            />
          )}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.statsContainer}
        />
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersSection}>
        <Searchbar
          placeholder={t('searchPlaceholder')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={theme.colors.onSurfaceVariant}
        />
        
        <SegmentedButtons
          value={activeFilter}
          onValueChange={setActiveFilter}
          buttons={[
            { value: 'all', label: t('common:all') },
            { value: 'pending', label: t('statuses.pending') },
            { value: 'in_progress', label: t('statuses.inProgress') },
            { value: 'completed', label: t('statuses.completed') },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Requests List */}
      <FlatList
        data={filteredRequests}
        renderItem={({ item }) => (
          <MaintenanceRequestCard
            request={item}
            onPress={() => router.push(`/maintenance/${item.id}`)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ModernCard style={styles.emptyState}>
            <Plus size={48} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyStateTitle}>{t('noMaintenanceRequests')}</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery || activeFilter !== 'all' 
                ? t('adjustSearchOrFilters') 
                : t('addFirstRequest')}
            </Text>
          </ModernCard>
        }
      />

      {/* Add Button */}
      <View style={styles.fabContainer}>
        <ModernCard style={styles.fab}>
          <Text
            style={styles.fabText}
            onPress={() => router.push('/maintenance/add')}
          >
            <Plus size={24} color="white" />
          </Text>
        </ModernCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsSection: {
    marginBottom: spacing.m,
  },
  statsContainer: {
    paddingHorizontal: spacing.m,
  },
  filtersSection: {
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  searchbar: {
    marginBottom: spacing.m,
    backgroundColor: theme.colors.surface,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surface,
  },
  listContent: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xxxl,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.m,
    right: spacing.m,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
});