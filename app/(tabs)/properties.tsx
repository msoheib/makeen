import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, Searchbar, FAB, Button, IconButton, Portal, Modal, Card, Title, Paragraph, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { propertiesApi, propertyGroupsApi } from '@/lib/api';
import { theme, spacing } from '@/lib/theme';
import ModernHeader from '@/components/ModernHeader';
import TenantEmptyState from '@/components/TenantEmptyState';
import { HorizontalStatsShimmer, PropertyListShimmer } from '@/components/shimmer';
import { Building2, Home, Users, MessageSquare } from 'lucide-react-native';

export default function PropertiesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [viewFilter, setViewFilter] = useState<'all' | 'units' | 'groups'>('all');

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

  // Fetch property groups (buildings/compounds)
  const { 
    data: groups, 
    loading: groupsLoading, 
    error: groupsError, 
    refetch: refetchGroups 
  } = useApi(() => propertyGroupsApi.getAll(), []);

  // Merge properties and groups into one list
  const combinedItems = useMemo(() => {
    const groupItems = (groups || []).map((g: any) => ({
      __kind: 'group',
      id: g.id,
      title: g.name,
      address: g.address || '',
      city: g.city || '',
      group: { id: g.id, name: g.name, group_type: g.group_type },
      floors_count: g.floors_count,
      status: 'group',
    }));
    const propertyItems = properties || [];
    return [...groupItems, ...propertyItems];
  }, [groups, properties]);

  // Filter based on search across both kinds
  const filteredProperties = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    const base = (combinedItems || []).filter((item: any) => {
      return (
        (item.title || '').toLowerCase().includes(q) ||
        (item.address || '').toLowerCase().includes(q) ||
        (item.city || '').toLowerCase().includes(q)
      );
    });
    if (viewFilter === 'groups') return base.filter((i: any) => i.__kind === 'group');
    if (viewFilter === 'units') return base.filter((i: any) => i.__kind !== 'group');
    return base;
  }, [combinedItems, searchQuery, viewFilter]);

  // Fetch dashboard summary for stats
  const { 
    data: dashboardStats, 
    loading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useApi(() => propertiesApi.getDashboardSummary(), []);

  // Calculate stats from properties data
  const stats = dashboardStats ? {
    total: dashboardStats.total_properties.toString(),
    available: dashboardStats.available.toString(), 
    rented: (dashboardStats.occupied || 0).toString(),
    maintenance: dashboardStats.maintenance.toString()
  } : {
    total: statsLoading ? '...' : '0',
    available: statsLoading ? '...' : '0', 
    rented: statsLoading ? '...' : '0',
    maintenance: statsLoading ? '...' : '0'
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchProperties();
    refetchStats();
    refetchGroups();
  };

  // Handle rental contract request
  const handleRequestContract = async (property: any) => {
    if (!user || user.user_metadata?.role !== 'tenant') {
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
    return user && 
           user.user_metadata?.role === 'tenant' && 
           property.status === 'available' && 
           (property.listing_type === 'rent' || property.listing_type === 'both') &&
           property.is_accepting_bids;
  };

  // Loading state - show shimmer if no data yet
  const showInitialLoading = (propertiesLoading && !properties) || (statsLoading && !dashboardStats) || (groupsLoading && !groups);

  // Error state - show tenant-friendly message for tenants
  if (propertiesError || statsError || groupsError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title="العقارات" 
          showNotifications={true}
            variant="dark"
        />
        {user?.user_metadata?.role === 'tenant' ? (
          <TenantEmptyState type="properties" />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              خطأ في تحميل البيانات: {propertiesError || statsError || groupsError}
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
    <TouchableOpacity 
      style={[styles.propertyCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => item.__kind === 'group' ? router.push(`/buildings/${item.id}`) : router.push(`/properties/${item.id}`)}
    >
      <View style={styles.propertyHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {item.__kind === 'group' ? (
            <Building2 size={18} color={theme.colors.onSurfaceVariant} />
          ) : (
            (() => {
              switch (item.property_type) {
                case 'apartment':
                  return <Home size={18} color={theme.colors.onSurfaceVariant} />;
                case 'villa':
                  return <Home size={18} color={theme.colors.onSurfaceVariant} />;
                case 'office':
                  return <Building2 size={18} color={theme.colors.onSurfaceVariant} />;
                case 'retail':
                  return <Building2 size={18} color={theme.colors.onSurfaceVariant} />;
                case 'warehouse':
                  return <Building2 size={18} color={theme.colors.onSurfaceVariant} />;
                default:
                  return <Home size={18} color={theme.colors.onSurfaceVariant} />;
              }
            })()
          )}
          <Text style={[styles.propertyTitle, { color: theme.colors.onSurface }]}> 
            {item.title}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {item.__kind === 'group' ? (
            <View style={[styles.groupBadge, { backgroundColor: theme.colors.surfaceVariant }]}> 
              <Text style={[styles.groupBadgeText, { color: theme.colors.onSurfaceVariant }]}> 
                {item.group.group_type === 'villa_compound' ? 'مجمع فلل' : item.group.group_type === 'apartment_block' ? 'مجمع شقق' : 'مبنى'}
              </Text>
            </View>
          ) : (
            <>
              {item.group && (
                <View style={[styles.groupBadge, { backgroundColor: theme.colors.surfaceVariant }]}> 
                  <Text style={[styles.groupBadgeText, { color: theme.colors.onSurfaceVariant }]}> 
                    {item.group.group_type === 'villa_compound' ? 'مجمع فلل' : item.group.group_type === 'apartment_block' ? 'مجمع شقق' : 'مبنى'}: {item.group.name}
                  </Text>
                </View>
              )}
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
              
              {/* Property Type Badge */}
              <View style={[styles.typeBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.typeBadgeText, { color: theme.colors.onSurfaceVariant }]}>
                  {item.property_type === 'apartment' ? 'شقة' : 
                   item.property_type === 'villa' ? 'فيلا' : 
                   item.property_type === 'office' ? 'مكتب' : 
                   item.property_type === 'retail' ? 'محل تجاري' : 
                   item.property_type === 'warehouse' ? 'مستودع' : 'عقار'}
                </Text>
              </View>
            </>
          )}
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
        {user && (user.user_metadata?.role === 'owner' || user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'manager') && (
          <View style={styles.adminActions}>
            <IconButton
              icon={() => <Users size={20} color={theme.colors.onSurfaceVariant} />}
              onPress={() => item.__kind === 'group' ? router.push(`/buildings/${item.id}`) : router.push(`/properties/${item.id}`)}
              style={[styles.viewButton, { backgroundColor: theme.colors.surfaceVariant }]}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const handleAddProperty = (type: 'single' | 'building') => {
    setShowAddPropertyModal(false);
    if (type === 'single') {
      router.push('/properties/add');
    } else {
      router.push('/buildings/add');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="العقارات" 
        showNotifications={true}
        variant="dark"
      />

      {/* Properties List with FlatList */}
      {showInitialLoading ? (
        <PropertyListShimmer count={5} />
      ) : (
        <FlatList
          data={filteredProperties}
          renderItem={renderProperty}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={propertiesLoading || statsLoading || groupsLoading}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
              title="سحب للتحديث"
              titleColor={theme.colors.onBackground}
            />
          }
          ListHeaderComponent={() => (
            <View>
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

              {/* Filter Section */}
              <View style={{ marginBottom: 12 }}>
                <SegmentedButtons
                  value={viewFilter}
                  onValueChange={(v: any) => setViewFilter(v)}
                  buttons={[
                    { value: 'all', label: 'الكل' },
                    { value: 'units', label: 'وحدات' },
                    { value: 'groups', label: 'مبانٍ' },
                  ]}
                />
              </View>

              {/* Properties List Header */}
              <View style={styles.propertiesSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                  قائمة العقارات {!showInitialLoading && `(${filteredProperties.length})`}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            user?.user_metadata?.role === 'tenant' ? (
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
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Add Property FAB - Always visible for now */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        size="medium"
        onPress={() => setShowAddPropertyModal(true)}
        label="إضافة عقار"
      />

      {/* Add Property Type Selection Modal */}
      <Portal>
        <Modal
          visible={showAddPropertyModal}
          onDismiss={() => setShowAddPropertyModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <Title style={styles.modalTitle}>اختر نوع العقار المراد إضافته</Title>
              <Paragraph style={styles.modalDescription}>
                يمكنك إضافة عقار منفرد أو مبنى يحتوي على عدة شقق
              </Paragraph>
              
              <View style={styles.modalButtons}>
                <Button
                  mode="contained"
                  onPress={() => handleAddProperty('single')}
                  style={styles.modalButton}
                  icon="home"
                >
                  إضافة عقار منفرد
                </Button>
                
                <TouchableOpacity
                  style={[styles.modalButton, { 
                    borderWidth: 2, 
                    borderColor: theme.colors.primary,
                    borderRadius: 8,
                    padding: 16,
                    alignItems: 'center',
                    backgroundColor: 'transparent'
                  }]}
                  onPress={() => handleAddProperty('building')}
                >
                  <Text style={{ 
                    color: theme.colors.primary, 
                    fontSize: 16, 
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    إنشاء مبنى جديد
                  </Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
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
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  groupBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
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
    zIndex: 1000,
    elevation: 8,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.l,
    color: theme.colors.onSurfaceVariant,
  },
  modalButtons: {
    flexDirection: 'column',
    gap: spacing.s,
  },
  modalButton: {
    borderRadius: 12,
  },
});