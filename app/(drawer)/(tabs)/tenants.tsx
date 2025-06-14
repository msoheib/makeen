import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Searchbar, Avatar, List, ActivityIndicator, Button, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { profilesApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { Users, UserPlus, Phone, Mail } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';
import { useTranslation } from '@/lib/useTranslation';

export default function TenantsScreen() {
  const router = useRouter();
  const { t } = useTranslation('tenants');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use the API hook for fetching tenants
  const { 
    data: tenants, 
    loading, 
    error, 
    refetch 
  } = useApi(() => profilesApi.getTenants(), []);

  // Filter tenants based on search query
  const filteredTenants = React.useMemo(() => {
    if (!tenants) return [];
    
    if (!searchQuery) return tenants;
    
    const query = searchQuery.toLowerCase();
    return tenants.filter(tenant => 
      `${tenant.first_name} ${tenant.last_name}`.toLowerCase().includes(query) ||
      tenant.email?.toLowerCase().includes(query) ||
      tenant.phone?.toLowerCase().includes(query)
    );
  }, [tenants, searchQuery]);

  // Calculate stats from real data
  const stats = React.useMemo(() => {
    if (!tenants) {
      return {
        total: 0,
        active: 0,
        pending: 0,
        late: 0,
      };
    }

    const activeCount = tenants.filter(tenant => tenant.status === 'active').length;
    const pendingCount = tenants.filter(tenant => tenant.status === 'pending').length;
    
    return {
      total: tenants.length,
      active: activeCount,
      pending: pendingCount,
      late: 0, // TODO: Calculate based on payment status from contracts
    };
  }, [tenants]);

  const renderTenant = ({ item }: { item: any }) => {
    const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim();
    const primaryContract = item.contracts?.[0];
    const propertyInfo = primaryContract?.property;
    
    return (
      <ModernCard style={styles.tenantCard}>
        <List.Item
          title={fullName || 'No Name'}
          description={item.email || 'No Email'}
          left={() => (
            <Avatar.Image
              size={48}
              source={{ 
                uri: item.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' 
              }}
            />
          )}
          right={() => (
            <View style={styles.tenantActions}>
              <View style={[
                styles.statusTag, 
                { 
                  backgroundColor: item.status === 'active' 
                    ? theme.colors.successContainer 
                    : theme.colors.warningContainer 
                }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { 
                    color: item.status === 'active' 
                      ? theme.colors.success 
                      : theme.colors.warning 
                  }
                ]}>
                  {item.status === 'active' ? t('activeStatus') : t('pendingStatus')}
                </Text>
              </View>
            </View>
          )}
          onPress={() => router.push(`/tenants/${item.id}`)}
          style={styles.listItem}
        />
        {propertyInfo && (
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyText}>
              📍 {propertyInfo.title} - {propertyInfo.address}
            </Text>
          </View>
        )}
      </ModernCard>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>{t('common:loading')}</Text>
    </View>
  );

  const renderErrorState = () => (
    <ModernCard style={styles.errorState}>
      <Text style={styles.errorTitle}>{t('common:error')}</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <Button mode="contained" onPress={refetch} style={styles.retryButton}>
        {t('common:tryAgain')}
      </Button>
    </ModernCard>
  );

  const renderEmptyState = () => (
    <ModernCard style={styles.emptyState}>
      <UserPlus size={48} color={theme.colors.onSurfaceVariant} />
      <Text style={styles.emptyStateTitle}>{t('noTenantsFound')}</Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery 
          ? t('adjustSearch') 
          : t('addFirstTenant')}
      </Text>
    </ModernCard>
  );

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('title')}
        subtitle={t('subtitle')}
        variant="dark"
        showNotifications
        isHomepage={false}
      />

      {/* Stats Overview - Only show when data is loaded */}
      {!loading && !error && (
        <View style={styles.statsSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              {
                title: t('totalTenants'),
                value: stats.total.toString(),
                color: theme.colors.primary,
                icon: <Users size={20} color={theme.colors.primary} />,
              },
              {
                title: t('activeTenants'),
                value: stats.active.toString(),
                color: theme.colors.success,
                icon: <Users size={20} color={theme.colors.success} />,
              },
              {
                title: t('pendingTenants'),
                value: stats.pending.toString(),
                color: theme.colors.warning,
                icon: <Users size={20} color={theme.colors.warning} />,
              },
              {
                title: t('latePayments'),
                value: stats.late.toString(),
                color: theme.colors.error,
                icon: <Users size={20} color={theme.colors.error} />,
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
      )}

      {/* Search - Only show when not loading */}
      {!loading && (
        <View style={styles.filtersSection}>
          <Searchbar
            placeholder={t('searchPlaceholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            iconColor={theme.colors.onSurfaceVariant}
          />
        </View>
      )}

      {/* Content */}
      {loading ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={filteredTenants}
          renderItem={renderTenant}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} />
          }
          ListEmptyComponent={renderEmptyState()}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/tenants/add')}
        label="Add Tenant"
      />
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
    gap: spacing.s,
  },
  filtersSection: {
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  searchbar: {
    backgroundColor: theme.colors.surface,
  },
  listContent: {
    padding: spacing.m,
    paddingTop: 0,
  },
  tenantCard: {
    marginBottom: spacing.s,
  },
  listItem: {
    paddingVertical: spacing.s,
  },
  tenantActions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTag: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  propertyInfo: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
  },
  propertyText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.m,
    color: theme.colors.onSurfaceVariant,
  },
  errorState: {
    margin: spacing.m,
    padding: spacing.l,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.error,
    marginBottom: spacing.s,
  },
  errorSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
  },
  emptyState: {
    margin: spacing.m,
    padding: spacing.xl,
    alignItems: 'center',
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
  fab: {
    position: 'absolute',
    margin: spacing.m,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});