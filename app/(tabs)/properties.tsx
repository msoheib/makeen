import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, SafeAreaView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Text, Searchbar, FAB, Button, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { lightTheme, darkTheme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { Building2, Home, Search, Plus, MessageSquare, Users } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import StatCard from '@/components/StatCard';
import ModernCard from '@/components/ModernCard';
import { useApi } from '@/hooks/useApi';
import { propertiesApi, bidsApi } from '@/lib/api';
import { getCurrentUserContext } from '@/lib/security';
import { HorizontalStatsShimmer, PropertyListShimmer } from '@/components/shimmer';
import TenantEmptyState from '@/components/TenantEmptyState';

export default function PropertiesScreen() {
  const router = useRouter();
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');

  // Get current user context for role-based functionality
  const { 
    data: userContext, 
    loading: userLoading, 
    error: userError 
  } = useApi(() => getCurrentUserContext(), []);

  // Fetch properties from database
  const { 
    data: properties, 
    loading: propertiesLoading, 
    error: propertiesError, 
    refetch: refetchProperties 
  } = useApi(async () => {
    console.log('[PropertiesScreen] Calling propertiesApi.getAll()...');
    const result = await propertiesApi.getAll();
    console.log('[PropertiesScreen] API result:', result);
    return result;
  }, []);

  // Fetch dashboard summary for stats
  const { 
    data: dashboardStats, 
    loading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useApi(() => propertiesApi.getDashboardSummary(), []);

  // Filter properties based on search
  const filteredProperties = properties ? properties.filter((property: any) =>
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Calculate stats from properties data
  const stats = dashboardStats ? {
    total: dashboardStats.total_properties.toString(),
    available: dashboardStats.available.toString(), 
    rented: (dashboardStats.occupied || 0).toString(),
    maintenance: dashboardStats.maintenance.toString()
  } : {
    total: '٠',
    available: '٠', 
    rented: '٠',
    maintenance: '٠'
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchProperties();
    refetchStats();
  };

  // Handle rental contract request
  const handleRequestContract = async (property: any) => {
    if (!userContext || userContext.role !== 'tenant') {
      Alert.alert(
        'خطأ في الصلاحية',
        'يجب أن تكون مستأجرًا لطلب عقد إيجار',
        [{ text: 'موافق', style: 'default' }]
      );
      return;
    }

    // Navigate to bid submission screen with rental-specific parameters
    router.push({
      pathname: '/tenant/place-bid',
      params: {
        propertyId: property.id,
        propertyTitle: property.title,
        propertyPrice: property.annual_rent || property.price,
        listingType: 'rent',
        bidType: 'rental',
        minBidAmount: property.minimum_bid_amount || 0,
        maxBidAmount: property.maximum_bid_amount || 0
      }
    });
  };

  // Check if user can request contract for a property
  const canRequestContract = (property: any) => {
    return userContext && 
           userContext.role === 'tenant' && 
           property.status === 'available' && 
           (property.listing_type === 'rent' || property.listing_type === 'both') &&
           property.is_accepting_bids;
  };

  // Loading state - show shimmer if no data yet
  const showInitialLoading = (propertiesLoading && !properties) || (statsLoading && !dashboardStats);

  // Error state - show tenant-friendly message for tenants
  if (propertiesError || statsError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title="العقارات" 
          showNotifications={true}
            variant="dark"
        />
        {userContext?.role === 'tenant' ? (
          <TenantEmptyState type="properties" />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              خطأ في تحميل البيانات: {propertiesError || statsError}
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleRefresh}
            >
              <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>
                إعادة المحاولة
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const renderProperty = ({ item }: { item: any }) => (
    <View style={[styles.propertyCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.propertyHeader}>
        <Text style={[styles.propertyTitle, { color: theme.colors.onSurface }]}>
          {item.title}
        </Text>
        <View style={[
          styles.statusBadge, 
          { 
            backgroundColor: item.status === 'available' 
              ? theme.colors.primaryContainer 
              : item.status === 'rented'
              ? theme.colors.secondaryContainer
              : theme.colors.errorContainer
          }
        ]}>
          <Text style={[
            styles.statusText,
            {
              color: item.status === 'available'
                ? theme.colors.primary
                : item.status === 'rented' 
                ? theme.colors.secondary
                : theme.colors.error
            }
          ]}>
            {item.status === 'available' ? 'متاح' : item.status === 'rented' ? 'مؤجر' : 'صيانة'}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.propertyAddress, { color: theme.colors.onSurfaceVariant }]}>
        📍 {item.address}
      </Text>
      
      <Text style={[styles.propertyDescription, { color: theme.colors.onSurfaceVariant }]}>
        {item.description}
      </Text>
      
      <View style={styles.propertyDetails}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
            غرف النوم
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
            {item.bedrooms || '٠'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
            الحمامات
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
            {item.bathrooms || '٠'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
            المساحة
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
            {item.area_sqm} م²
          </Text>
        </View>
      </View>
      
      <View style={styles.propertyFooter}>
        <View style={styles.priceAndTypeContainer}>
          <Text style={[styles.propertyPrice, { color: theme.colors.primary }]}>
            {Number(item.annual_rent || item.price).toLocaleString('ar-SA')} ريال
            {item.annual_rent && '/سنة'}
          </Text>
          <View style={[styles.typeTag, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.typeText, { color: theme.colors.onSurfaceVariant }]}>
              {item.property_type === 'villa' ? 'فيلا' : 
               item.property_type === 'apartment' ? 'شقة' : 
               item.property_type === 'office' ? 'مكتب' :
               item.property_type === 'retail' ? 'تجاري' :
               item.property_type === 'warehouse' ? 'مستودع' : (item.property_type || 'غير محدد')}
            </Text>
          </View>
        </View>
        
        {/* Tenant Actions */}
        {canRequestContract(item) && (
          <View style={styles.tenantActions}>
            <Button
              mode="contained"
              icon={() => <MessageSquare size={16} color={theme.colors.onPrimary} />}
              onPress={() => handleRequestContract(item)}
              style={[styles.requestButton, { backgroundColor: theme.colors.primary }]}
              labelStyle={styles.requestButtonText}
              compact
            >
              طلب عقد إيجار
            </Button>
          </View>
        )}
        
        {/* Owner/Admin View Button */}
        {userContext && (userContext.role === 'owner' || userContext.role === 'admin' || userContext.role === 'manager') && (
          <View style={styles.adminActions}>
            <IconButton
              icon={() => <Users size={20} color={theme.colors.onSurfaceVariant} />}
              onPress={() => router.push(`/properties/${item.id}`)}
              style={[styles.viewButton, { backgroundColor: theme.colors.surfaceVariant }]}
            />
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="العقارات" 
        showNotifications={true}
        variant="dark"
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={propertiesLoading || statsLoading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            title="سحب للتحديث"
            titleColor={theme.colors.onBackground}
          />
        }
      >
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            إحصائيات العقارات
          </Text>
          {showInitialLoading ? (
            <HorizontalStatsShimmer />
          ) : (
            <View style={[styles.horizontalStatsCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.horizontalStatsRow}>
                <View style={styles.horizontalStatItem}>
                  <View style={[styles.horizontalStatIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                    <Building2 size={24} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                    إجمالي العقارات
                  </Text>
                  <Text style={[styles.horizontalStatValue, { color: theme.colors.primary }]}>
                    {statsLoading ? '...' : stats.total}
                  </Text>
                </View>
                
                <View style={styles.horizontalStatItem}>
                  <View style={[styles.horizontalStatIcon, { backgroundColor: '#4CAF5020' }]}>
                    <Home size={24} color="#4CAF50" />
                  </View>
                  <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                    عقارات متاحة
                  </Text>
                  <Text style={[styles.horizontalStatValue, { color: '#4CAF50' }]}>
                    {statsLoading ? '...' : stats.available}
                  </Text>
                </View>
                
                <View style={styles.horizontalStatItem}>
                  <View style={[styles.horizontalStatIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                    <Users size={24} color={theme.colors.secondary} />
                  </View>
                  <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                    عقارات مؤجرة
                  </Text>
                  <Text style={[styles.horizontalStatValue, { color: theme.colors.secondary }]}>
                    {statsLoading ? '...' : stats.rented}
                  </Text>
                </View>
                
                <View style={styles.horizontalStatItem}>
                  <View style={[styles.horizontalStatIcon, { backgroundColor: '#F4433620' }]}>
                    <MessageSquare size={24} color="#F44336" />
                  </View>
                  <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                    تحت الصيانة
                  </Text>
                  <Text style={[styles.horizontalStatValue, { color: '#F44336' }]}>
                    {statsLoading ? '...' : stats.maintenance}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="البحث في العقارات..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
            iconColor={theme.colors.onSurfaceVariant}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>

        {/* Properties List */}
        <View style={styles.propertiesSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            قائمة العقارات {!showInitialLoading && `(${filteredProperties.length})`}
          </Text>
          
          {showInitialLoading ? (
            <PropertyListShimmer count={5} />
          ) : filteredProperties.length > 0 ? (
            <>
              <FlatList
                data={filteredProperties}
                renderItem={renderProperty}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
              {/* Show additional shimmer for progressive loading */}
              {propertiesLoading && <PropertyListShimmer count={1} />}
            </>
          ) : (
            userContext?.role === 'tenant' ? (
              <TenantEmptyState type="properties" />
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
                <Home size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurface }]}>
                  لا توجد عقارات
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {searchQuery ? 'جرب البحث بكلمات أخرى' : 'ابدأ بإضافة عقار جديد'}
                </Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Add Property FAB - Only visible for admin, manager, or owner */}
      {userContext && ['admin', 'manager', 'owner'].includes(userContext.role) && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          size="medium"
          onPress={() => router.push('/properties/add')}
          label="إضافة عقار"
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
  searchSection: {
    marginBottom: 16,
  },
  searchbar: {
    borderRadius: 12,
    elevation: 2,
  },
  propertiesSection: {
    marginBottom: 24,
  },
  propertyCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginRight: 8,
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
  propertyAddress: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'right',
  },
  propertyDescription: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'right',
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  propertyFooter: {
    flexDirection: 'column',
    gap: 12,
  },
  priceAndTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tenantActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  requestButton: {
    borderRadius: 8,
    elevation: 2,
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  adminActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewButton: {
    borderRadius: 8,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  loadingText: {
    marginTop: spacing.m,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  retryButton: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: spacing.m,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.m,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    marginTop: spacing.s,
    textAlign: 'center',
  },
});