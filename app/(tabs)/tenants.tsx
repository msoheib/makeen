import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Avatar, FAB } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { getFlexDirection, isRTL } from '@/lib/rtl';
import { Users, Phone, Mail, Plus, Lock, Shield } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import { useScreenAccess } from '@/lib/permissions';
import { useApi } from '@/hooks/useApi';
import { profilesApi } from '@/lib/api';
import MobileSearchBar from '@/components/MobileSearchBar';
import QuickStats from '@/components/QuickStats';

export default function TenantsScreen() {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - NO CONDITIONAL LOGIC BEFORE THIS POINT
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t } = useTranslation(['tenants','common']);
  
  // State hooks
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Permission and API hooks
  const { hasAccess: canAccessTenants, loading: permissionLoading, userContext } = useScreenAccess('tenants');
  const { 
    data: tenants, 
    loading: tenantsLoading, 
    error: tenantsError, 
    refetch: refetchTenants 
  } = useApi(() => profilesApi.getTenants(), []);

  // Get owners count for property managers and admins
  const { 
    data: owners, 
    loading: ownersLoading
  } = useApi(() => {
    // Only fetch owners if user is admin or manager
    if (userContext?.role === 'admin' || userContext?.role === 'manager') {
      return profilesApi.getOwners();
    }
    return Promise.resolve({ data: [], error: null });
  }, [userContext?.role]);

  // Computed values (not hooks, but derived state)
  const tenantsData = tenants || [];
  const isLoading = tenantsLoading;
  const hasError = !!tenantsError;
  
  // ALL CALLBACKS AND MEMOIZED VALUES (these are hooks and must be consistent)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchTenants();
    setRefreshing(false);
  }, [refetchTenants]);

  // Filter tenants based on search
  const filteredTenants = useMemo(() => {
    return tenantsData.filter(tenant => {
      const fullName = `${tenant.first_name || ''} ${tenant.last_name || ''}`.toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) ||
             (tenant.email && tenant.email.toLowerCase().includes(query)) ||
             (tenant.phone && tenant.phone.includes(query));
    });
  }, [tenantsData, searchQuery]);

  // Memoized real-time statistics
  const tenantStats = useMemo(() => ({
    total: tenantsData.length,
    active: tenantsData.filter(t => t.status === 'active').length,
    pending: tenantsData.filter(t => t.status === 'pending').length,
    owners: owners?.length || 0, // Add owners count for admins/managers
  }), [tenantsData, owners]);

  // Memoized render item function
  const renderTenantItem = useCallback(({ item: tenant }: { item: any }) => (
    <TouchableOpacity
      style={[styles.tenantCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
      onPress={() => router.push(`/tenants/${tenant.id}`)}
      activeOpacity={0.7}
    >
      {/* Tenant Header */}
      <View style={[styles.tenantHeader, { flexDirection: getFlexDirection('row') }]}>
        <View style={styles.tenantMainInfo}>
          <Avatar.Text
            size={50}
            label={`${tenant.first_name?.[0] || ''}${tenant.last_name?.[0] || ''}`.toUpperCase() || 'T'}
            style={[styles.tenantAvatar, { backgroundColor: theme.colors.primary }]}
            labelStyle={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
          />
          <View style={styles.tenantInfoContainer}>
            <Text style={[styles.tenantName, { color: theme.colors.onSurface }]}>
              {`${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 'Unspecified Tenant'}
            </Text>
            <View style={[styles.tenantStatus, { flexDirection: getFlexDirection('row') }]}>
              <Shield 
                size={14} 
                color={tenant.status === 'active' ? '#4CAF50' : '#FF9520'} 
              />
              <Text style={[
                styles.statusText,
                { 
                  color: tenant.status === 'active' ? '#4CAF50' : '#FF9520',
                  marginLeft: isRTL() ? 0 : 4,
                  marginRight: isRTL() ? 4 : 0
                }
              ]}>
                {tenant.status === 'active' 
                  ? t('tenants:activeStatus') 
                  : tenant.status === 'pending' 
                    ? t('tenants:pendingStatus') 
                    : t('tenants:unknownStatus')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.tenantContactInfo}>
        {tenant.email && (
          <View style={[styles.contactRow, { flexDirection: getFlexDirection('row') }]}>
            <Mail size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[
              styles.contactText,
              { 
                color: theme.colors.onSurfaceVariant,
                marginLeft: isRTL() ? 0 : 8,
                marginRight: isRTL() ? 8 : 0
              }
            ]}>
              {tenant.email}
            </Text>
          </View>
        )}
        
        {tenant.phone && (
          <View style={[styles.contactRow, { flexDirection: getFlexDirection('row') }]}>
            <Phone size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[
              styles.contactText,
              { 
                color: theme.colors.onSurfaceVariant,
                marginLeft: isRTL() ? 0 : 8,
                marginRight: isRTL() ? 8 : 0
              }
            ]}>
              {tenant.phone}
            </Text>
          </View>
        )}
      </View>

      {/* Property info - will be enhanced when contract integration is added */}
      <View style={styles.propertyInfo}>
        <Text style={[styles.propertyLabel, { color: theme.colors.onSurfaceVariant }]}>
          {t('tenants:contractInfo')}
        </Text>
        <Text style={[styles.propertyText, { color: theme.colors.onSurface }]}>
          {/* TODO: Add contract/property relationship data from API */}
          {t('tenants:contractAvailableSoon')}
        </Text>
      </View>
    </TouchableOpacity>
  ), [theme.colors, router]);

  // Memoized ListHeaderComponent with stable dependencies
  const ListHeaderComponent = useMemo(() => (
    <View>
      {/* Quick Stats Section */}
      <View style={styles.statsSection}>
        <QuickStats
          total={tenantStats.total}
          active={tenantStats.active}
          pending={tenantStats.pending}
          owners={tenantStats.owners}
          showOwners={userContext?.role === 'admin' || userContext?.role === 'manager'}
          loading={isLoading}
        />
      </View>
    </View>
  ), [theme.colors, tenantStats, isLoading, searchQuery, filteredTenants.length, ownersLoading, userContext?.role]);

  // EARLY RETURNS AFTER ALL HOOKS ARE CALLED
  // Show loading while checking permissions
  if (permissionLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title={t('tenants:title', { defaultValue: 'Tenants' })} 
          showNotifications={true}
            variant="dark"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            {t('loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If user doesn't have tenants access, show access denied
  if (!canAccessTenants) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title={t('tenants:title', { defaultValue: 'Tenants' })} 
          showNotifications={true}
            variant="dark"
        />
        <View style={styles.accessDeniedContainer}>
          <Lock size={64} color="#ccc" />
          <Text style={[styles.accessDeniedText, { color: theme.colors.onSurfaceVariant }]}>
            Access Denied
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}>
            You don't have permission to view tenant information. Tenants can only see their own profile, while owners can see tenants of their properties.
          </Text>
          {/* DEBUG: Show user context for troubleshooting */}
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
            Current Role: {userContext?.role || 'None'}
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}>
            Authenticated: {userContext?.isAuthenticated ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}>
            User ID: {userContext?.userId || 'None'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // MAIN RENDER LOGIC

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title={t('tenants:title', { defaultValue: 'Tenants' })} 
        showNotifications={true}
        showSearch={true}
        onNotificationPress={() => router.push('/notifications')}
        onSearchPress={() => router.push('/search')}
        variant="dark"
      />
      
      {/* Search UI outside FlatList to keep focus stable */}
      <View style={[styles.searchSection, { paddingHorizontal: spacing.m }]}> 
        <MobileSearchBar
          placeholder={t('tenants:searchPlaceholder', { defaultValue: 'Search for tenant...' })}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline
          }]}
          inputStyle={{ 
            color: theme.colors.onSurface
          }}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          iconColor={theme.colors.onSurfaceVariant}
          textAlign="right"
        />
        <Text style={[styles.resultCount, { color: theme.colors.onSurfaceVariant }]}>
          {isLoading ? t('common:loading') : t('tenants:results', { count: filteredTenants.length, defaultValue: '{{count}} results' })}
        </Text>
      </View>

      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Error loading data. Please try again.
          </Text>
          <Text style={[styles.errorDetails, { color: theme.colors.onSurfaceVariant }]}>
            {tenantsError}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTenants}
          keyExtractor={(item) => item.id}
          renderItem={renderTenantItem}
          ListHeaderComponent={ListHeaderComponent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={[
            styles.flatListContainer, 
            { paddingBottom: 80 } // Space for FAB
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.surface}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyStateContainer}>
                <Users size={64} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.emptyStateText, { color: theme.colors.onSurfaceVariant }]}>
                  {searchQuery 
                    ? t('tenants:noTenantsFound')
                    : t('tenants:noTenantsData', { defaultValue: 'No tenant data available.' })
                  }
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.onSurfaceVariant }]}>
                  {searchQuery 
                    ? t('tenants:adjustSearch')
                    : t('tenants:addOrCheckAccess', { defaultValue: 'Please add tenants or check access permissions.' })
                  }
                </Text>
              </View>
            ) : null
          }
        />
      )}

      <FAB
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: 56,
          },
        ]}
        icon={() => <Plus size={24} color="white" />}
        onPress={() => {
          if (userContext?.role === 'admin' || userContext?.role === 'manager') {
            router.push('/people/add');
          } else {
            router.push('/tenants/add');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  loadingText: {
    fontSize: 16,
    marginTop: spacing.m,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  accessDeniedText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.m,
    textAlign: 'center',
  },
  accessDeniedSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.s,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  errorDetails: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  flatListContainer: {
    padding: spacing.m,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.m,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.s,
    lineHeight: 20,
  },
  statsSection: {
    marginBottom: spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
  },

  searchSection: {
    marginBottom: spacing.m,
  },
  searchBar: {
    borderRadius: 8,
    borderWidth: 1,
    elevation: 0,
    marginBottom: spacing.s,
  },
  resultCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  tenantCard: {
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  tenantHeader: {
    alignItems: 'flex-start',
    marginBottom: spacing.m,
  },
  tenantMainInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tenantAvatar: {
    marginRight: spacing.m,
  },
  tenantInfoContainer: {
    flex: 1,
  },
  tenantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  tenantStatus: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tenantContactInfo: {
    marginBottom: spacing.m,
  },
  contactRow: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.s,
  },
  contactText: {
    fontSize: 14,
  },
  propertyInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: spacing.s,
  },
  propertyLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'right',
  },
  propertyText: {
    fontSize: 14,
    textAlign: 'right',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
