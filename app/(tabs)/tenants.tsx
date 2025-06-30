import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Avatar, FAB } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { lightTheme, darkTheme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { rtlStyles, getFlexDirection } from '@/lib/rtl';
import { Users, Phone, Mail, MapPin, Plus, Lock, Shield, UserCheck, UserClock, Globe2 } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import { StatCard } from '@/components/StatCard';
import ModernCard from '@/components/ModernCard';
import { useScreenAccess } from '@/lib/permissions';
import { useApi } from '@/hooks/useApi';
import { profilesApi } from '@/lib/api';
import { useFilteredNavigation } from '@/lib/permissions';

export default function TenantsScreen() {
  const router = useRouter();
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');

  // Check if user has access to tenants data
  const { hasAccess: canAccessTenants, loading: permissionLoading, userContext } = useScreenAccess('tenants');

  // API call for tenants (with role-based filtering)
  const { 
    data: tenants, 
    loading: tenantsLoading, 
    error: tenantsError, 
    refetch: refetchTenants 
  } = useApi(() => profilesApi.getTenants(), []);

  // DEBUG: Log tenants data for troubleshooting
  console.log('[Tenants Debug] API Response:', {
    tenants: tenants,
    loading: tenantsLoading,
    error: tenantsError,
    hasAccess: canAccessTenants,
    userContext: userContext
  });

  // If permission check fails, try to get tenants anyway for debugging
  const { 
    data: allTenants, 
    loading: allTenantsLoading,
    error: allTenantsError 
  } = useApi(() => profilesApi.getAll({ role: 'tenant' }), []);

  console.log('[Tenants Debug] All Tenants (fallback):', {
    allTenants: allTenants,
    loading: allTenantsLoading,
    error: allTenantsError
  });

  // Handle refresh
  const [refreshing, setRefreshing] = React.useState(false);
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetchTenants();
    setRefreshing(false);
  }, [refetchTenants]);

  // Show loading while checking permissions
  if (permissionLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title="المستأجرين" 
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
          title="المستأجرين" 
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

  // Use real data from API with fallback
  const tenantsData = tenants || allTenants || [];
  const isLoading = tenantsLoading || allTenantsLoading;
  const hasError = tenantsError && allTenantsError;

  // DEBUG: Log the corrected data structure
  console.log('[Tenants Debug] Fixed data access:', {
    tenantsData: tenantsData,
    tenantCount: tenantsData?.length || 0,
    isLoading: isLoading,
    hasError: hasError
  });

  // Filter tenants based on search
  const filteredTenants = tenantsData.filter(tenant => {
    const fullName = `${tenant.first_name || ''} ${tenant.last_name || ''}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) ||
           (tenant.email && tenant.email.toLowerCase().includes(query)) ||
           (tenant.phone && tenant.phone.includes(query));
  });

  // Calculate real-time statistics
  const tenantStats = {
    total: tenantsData.length,
    active: tenantsData.filter(t => t.status === 'active').length,
    pending: tenantsData.filter(t => t.status === 'pending').length,
    foreign: tenantsData.filter(t => t.is_foreign === true).length,
  };

  const renderTenant = ({ item }: { item: any }) => (
    <View style={[styles.tenantCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.tenantHeader, { flexDirection: getFlexDirection('row') }]}>
        <View style={[styles.tenantInfo, { flexDirection: getFlexDirection('row') }]}>
          <Avatar.Text
            size={60}
            label={`${(item.first_name || '').charAt(0)}${(item.last_name || '').charAt(0)}`}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.primary }}
          />
          <View style={styles.tenantDetails}>
            <Text style={[styles.tenantName, { color: theme.colors.onSurface }]}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={[styles.tenantNationality, { color: theme.colors.onSurfaceVariant }]}>
              {item.is_foreign ? `🌍 ${item.nationality || 'Foreign'}` : `🇸🇦 ${item.nationality || 'Saudi'}`}
            </Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          {
            backgroundColor: item.status === 'active'
              ? theme.colors.secondaryContainer
              : theme.colors.warningContainer
          }
        ]}>
          <Text style={[
            styles.statusText,
            {
              color: item.status === 'active'
                ? theme.colors.secondary
                : theme.colors.warning
            }
          ]}>
            {item.status === 'active' ? 'نشط' : 'معلق'}
          </Text>
        </View>
      </View>

      <View style={styles.contactInfo}>
        <View style={[styles.contactItem, { flexDirection: getFlexDirection('row') }]}>
          <Mail size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.contactText, { color: theme.colors.onSurfaceVariant }]}>
            {item.email || 'No email'}
          </Text>
        </View>
        <View style={[styles.contactItem, { flexDirection: getFlexDirection('row') }]}>
          <Phone size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.contactText, { color: theme.colors.onSurfaceVariant }]}>
            {item.phone || 'No phone'}
          </Text>
        </View>
        <View style={[styles.contactItem, { flexDirection: getFlexDirection('row') }]}>
          <MapPin size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.contactText, { color: theme.colors.onSurfaceVariant }]}>
            {item.address || 'No address'}
          </Text>
        </View>
      </View>

      {/* Property info - will be enhanced when contract integration is added */}
      <View style={styles.propertyInfo}>
        <Text style={[styles.propertyLabel, { color: theme.colors.onSurfaceVariant }]}>
          معلومات العقد:
        </Text>
        <Text style={[styles.propertyText, { color: theme.colors.onSurface }]}>
          {/* TODO: Add contract/property relationship data from API */}
          معلومات العقد ستكون متوفرة قريباً
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="المستأجرين" 
        showNotifications={true}
        variant="dark"
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            إحصائيات المستأجرين
          </Text>
          <View style={[styles.horizontalStatsCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.horizontalStatsRow, { flexDirection: getFlexDirection('row') }]}>
              <View style={styles.horizontalStatItem}>
                <View style={[styles.horizontalStatIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <Users size={24} color={theme.colors.primary} />
                </View>
                <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  إجمالي المستأجرين
                </Text>
                <Text style={[styles.horizontalStatValue, { color: theme.colors.primary }]}>
                  {isLoading ? '...' : String(tenantStats.total || 0)}
                </Text>
              </View>
              
              <View style={styles.horizontalStatItem}>
                <View style={[styles.horizontalStatIcon, { backgroundColor: '#4CAF5020' }]}>
                  <Phone size={24} color="#4CAF50" />
                </View>
                <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  مستأجرين نشطين
                </Text>
                <Text style={[styles.horizontalStatValue, { color: '#4CAF50' }]}>
                  {isLoading ? '...' : String(tenantStats.active || 0)}
                </Text>
              </View>
              
              <View style={styles.horizontalStatItem}>
                <View style={[styles.horizontalStatIcon, { backgroundColor: '#FF980020' }]}>
                  <Mail size={24} color="#FF9800" />
                </View>
                <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  مستأجرين معلقين
                </Text>
                <Text style={[styles.horizontalStatValue, { color: '#FF9800' }]}>
                  {isLoading ? '...' : String(tenantStats.pending || 0)}
                </Text>
              </View>
              
              <View style={styles.horizontalStatItem}>
                <View style={[styles.horizontalStatIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                  <MapPin size={24} color={theme.colors.secondary} />
                </View>
                <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  مستأجرين أجانب
                </Text>
                <Text style={[styles.horizontalStatValue, { color: theme.colors.secondary }]}>
                  {isLoading ? '...' : String(tenantStats.foreign || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="البحث في المستأجرين..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
            iconColor={theme.colors.onSurfaceVariant}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>

        {/* Tenants List */}
        <View style={styles.tenantsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            قائمة المستأجرين ({filteredTenants.length})
          </Text>
          
          {isLoading ? (
            <View style={[styles.loadingState, { backgroundColor: theme.colors.surface }]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                جاري تحميل المستأجرين...
              </Text>
            </View>
          ) : hasError ? (
            <View style={[styles.errorState, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                خطأ في تحميل البيانات
              </Text>
              <Text style={[styles.errorSubtext, { color: theme.colors.onSurfaceVariant }]}>
                {tenantsError?.message || allTenantsError?.message || 'حدث خطأ غير متوقع'}
              </Text>
            </View>
          ) : filteredTenants.length > 0 ? (
            <FlatList
              data={filteredTenants}
              renderItem={renderTenant}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
              <Users size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurface }]}>
                لا توجد مستأجرين
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {searchQuery ? 'جرب البحث بكلمات أخرى' : 'ابدأ بإضافة مستأجر جديد'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Tenant FAB - only show if user can access tenants */}
      {canAccessTenants && (
        <FAB
          icon="home-account"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          size="medium"
          onPress={() => router.push('/tenants/add')}
          label="إضافة مستأجر"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  accessDeniedSubtext: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  statsSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'right',
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
  searchSection: {
    marginBottom: 16,
  },
  searchbar: {
    borderRadius: 12,
    elevation: 2,
  },
  tenantsSection: {
    marginBottom: 24,
  },
  loadingState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  errorState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  tenantCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tenantHeader: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tenantInfo: {
    alignItems: 'center',
    flex: 1,
  },
  tenantDetails: {
    marginLeft: 12,
    flex: 1,
  },
  tenantName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
  tenantNationality: {
    fontSize: 14,
    marginTop: 2,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contactInfo: {
    marginBottom: 12,
  },
  contactItem: {
    alignItems: 'center',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 14,
    marginLeft: 8,
    textAlign: 'right',
    flex: 1,
  },
  propertyInfo: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  propertyLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'right',
  },
  propertyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});