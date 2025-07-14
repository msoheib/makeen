import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Searchbar, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { lightTheme, darkTheme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { PenTool as Tool, Plus, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, Settings } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';
import MaintenanceRequestCard from '@/components/MaintenanceRequestCard';
import { useTranslation } from '@/lib/useTranslation';
import { getFlexDirection, getTextAlign, rtlStyles } from '@/lib/rtl';
import { useApi } from '@/hooks/useApi';
import { maintenanceApi } from '@/lib/api';
import { getCurrentUserContext } from '@/lib/security';
import TenantEmptyState from '@/components/TenantEmptyState';
import { HorizontalStatsShimmer, MaintenanceListShimmer } from '@/components/shimmer';

export default function MaintenanceScreen() {
  const router = useRouter();
  const { t } = useTranslation('maintenance');
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Get current user context for role-based functionality
  const { 
    data: userContext, 
    loading: userLoading, 
    error: userError 
  } = useApi(() => getCurrentUserContext(), []);

  // API Calls using useApi hook
  const { 
    data: requests, 
    loading, 
    error, 
    refetch 
  } = useApi(() => maintenanceApi.getRequests(), []);

  // Calculate stats from real data
  const stats = React.useMemo(() => {
    if (!requests) {
      return { total: 0, pending: 0, inProgress: 0, completed: 0 };
    }
    
    const pending = requests.filter(r => r.status === 'pending').length;
    const inProgress = requests.filter(r => r.status === 'in_progress').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    
    return {
      total: requests.length,
      pending,
      inProgress,
      completed,
    };
  }, [requests]);

  // Filter requests based on search and status
  const filteredRequests = React.useMemo(() => {
    if (!requests) return [];
    
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
        `${request.tenant?.first_name || ''} ${request.tenant?.last_name || ''}`.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [requests, searchQuery, activeFilter]);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Create dynamic styles with access to theme
  const dynamicStyles = StyleSheet.create({
    searchbar: {
      marginBottom: spacing.m,
      backgroundColor: theme.colors.surface,
    },
    segmentedButtons: {
      backgroundColor: theme.colors.surface,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  });


  // Show error state if there's an error - tenant-friendly for tenants
  if (error || userError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader
          title={t('title')}
          subtitle={t('subtitle')}
          onNotificationPress={() => router.push('/notifications')}
          onSearchPress={() => router.push('/search')}
        />
        {userContext?.role === 'tenant' ? (
          <TenantEmptyState type="maintenance" />
        ) : (
          <ModernCard style={styles.errorCard}>
            <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
              {t('common:error')}
            </Text>
            <Text style={[styles.errorMessage, { color: theme.colors.onSurfaceVariant }]}>
              {error?.message || userError?.message || t('common:errorLoadingData')}
            </Text>
            <Text 
              style={[styles.retryButton, { color: theme.colors.primary }]}
              onPress={refetch}
            >
              {t('common:retry')}
            </Text>
          </ModernCard>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader
        title={t('title')}
        subtitle={t('subtitle')}
        onNotificationPress={() => router.push('/notifications')}
        onSearchPress={() => router.push('/search')}
      />

      {/* Requests List */}
      {(loading && !requests) || userLoading ? (
        <MaintenanceListShimmer />
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={({ item }) => (
            <MaintenanceRequestCard
              request={item}
              theme={theme}
              onPress={() => router.push(`/maintenance/${item.id}`)}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListHeaderComponent={() => (
            <View>
              {/* Stats Overview */}
              <View style={styles.statsSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground, textAlign: getTextAlign() }]}>
                  إحصائيات الصيانة
                </Text>
                {(loading && !requests) || userLoading ? (
                  <HorizontalStatsShimmer />
                ) : (
                  <View style={[styles.horizontalStatsCard, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.horizontalStatsRow, rtlStyles.row()]}>
                      <View style={styles.horizontalStatItem}>
                        <View style={[styles.horizontalStatIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                          <Tool size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant, textAlign: 'center' }]}>
                          إجمالي الطلبات
                        </Text>
                        <Text style={[styles.horizontalStatValue, { color: theme.colors.primary, textAlign: 'center' }]}>
                          {stats.total.toString()}
                        </Text>
                      </View>
                      
                      <View style={styles.horizontalStatItem}>
                        <View style={[styles.horizontalStatIcon, { backgroundColor: '#FF980020' }]}>
                          <Clock size={24} color="#FF9800" />
                        </View>
                        <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant, textAlign: 'center' }]}>
                          قيد الانتظار
                        </Text>
                        <Text style={[styles.horizontalStatValue, { color: '#FF9800', textAlign: 'center' }]}>
                          {stats.pending.toString()}
                        </Text>
                      </View>
                      
                      <View style={styles.horizontalStatItem}>
                        <View style={[styles.horizontalStatIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                          <AlertTriangle size={24} color={theme.colors.secondary} />
                        </View>
                        <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant, textAlign: 'center' }]}>
                          قيد التنفيذ
                        </Text>
                        <Text style={[styles.horizontalStatValue, { color: theme.colors.secondary, textAlign: 'center' }]}>
                          {stats.inProgress.toString()}
                        </Text>
                      </View>
                      
                      <View style={styles.horizontalStatItem}>
                        <View style={[styles.horizontalStatIcon, { backgroundColor: '#4CAF5020' }]}>
                          <CheckCircle size={24} color="#4CAF50" />
                        </View>
                        <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant, textAlign: 'center' }]}>
                          مكتملة
                        </Text>
                        <Text style={[styles.horizontalStatValue, { color: '#4CAF50', textAlign: 'center' }]}>
                          {stats.completed.toString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Search and Filters */}
              <View style={styles.filtersSection}>
                <Searchbar
                  placeholder={t('searchPlaceholder')}
                  onChangeText={setSearchQuery}
                  value={searchQuery}
                  style={dynamicStyles.searchbar}
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
                  style={dynamicStyles.segmentedButtons}
                />
              </View>
            </View>
          )}
          ListEmptyComponent={
            userContext?.role === 'tenant' ? (
              <TenantEmptyState type="maintenance" />
            ) : (
              <ModernCard style={styles.emptyState}>
                <Plus size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurface, textAlign: getTextAlign() }]}>{t('noMaintenanceRequests')}</Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.colors.onSurfaceVariant, textAlign: getTextAlign() }]}>
                  {searchQuery || activeFilter !== 'all' 
                    ? t('adjustSearchOrFilters') 
                    : t('addFirstRequest')}
                </Text>
              </ModernCard>
            )
          }
        />
      )}

      {/* Add Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity onPress={() => router.push('/maintenance/add')}>
          <ModernCard style={dynamicStyles.fab}>
            <View style={styles.fabText}>
              <Plus size={24} color="white" />
            </View>
          </ModernCard>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorCard: {
    margin: spacing.m,
    padding: spacing.l,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.s,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  retryButton: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
  statsSection: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCardWrapper: {
    width: '48%',
    minHeight: 120,
  },
  // Horizontal stats styles
  horizontalStatsCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  horizontalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horizontalStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  horizontalStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  horizontalStatLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 16,
  },
  horizontalStatValue: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  filtersSection: {
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
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
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  emptyStateSubtitle: {
    fontSize: 14,
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.m,
    right: spacing.m,
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
});