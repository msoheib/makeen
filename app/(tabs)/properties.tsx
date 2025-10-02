import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, FAB, Button, IconButton, Portal, Modal, Card, Title, Paragraph } from 'react-native-paper';
import MobileSearchBar from '@/components/MobileSearchBar';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { propertiesApi, propertyGroupsApi } from '@/lib/api';
import { spacing, type AppTheme } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import ModernHeader from '@/components/ModernHeader';
import TenantEmptyState from '@/components/TenantEmptyState';
import { HorizontalStatsShimmer, PropertyListShimmer } from '@/components/shimmer';
import { Building2, Home, Users, MessageSquare } from 'lucide-react-native';
import { formatDisplayNumber, toArabicNumerals } from '@/lib/formatters';
import { useTranslation } from 'react-i18next';

export default function PropertiesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useAppTheme();
  const { t } = useTranslation(['properties', 'common']);
  const styles = React.useMemo(() => createStyles(theme), [theme]);
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
    const result = await propertiesApi.getAll();
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
    total: formatDisplayNumber(dashboardStats.total_properties),
    available: formatDisplayNumber(dashboardStats.available), 
    rented: formatDisplayNumber(dashboardStats.occupied || 0),
    maintenance: formatDisplayNumber(dashboardStats.maintenance)
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
        'Permission Error',
        'You must be a tenant to request a rental contract',
        [{ text: 'OK', style: 'default' }]
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
          title={t('properties:title')} 
          showNotifications={true}
            variant="dark"
        />
        {user?.user_metadata?.role === 'tenant' ? (
          <TenantEmptyState type="properties" />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              Error loading data: {propertiesError || statsError || groupsError}
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleRefresh}
            >
              <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>
                Retry
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
                {item.group.group_type === 'villa_compound' ? t('properties:villaCompound') : item.group.group_type === 'apartment_block' ? t('properties:apartmentBlock') : t('properties:building')}
              </Text>
            </View>
          ) : (
            <>
              {item.group && (
                <View style={[styles.groupBadge, { backgroundColor: theme.colors.surfaceVariant }]}> 
                  <Text style={[styles.groupBadgeText, { color: theme.colors.onSurfaceVariant }]}> 
                    {item.group.group_type === 'villa_compound' ? t('properties:villaCompound') : item.group.group_type === 'apartment_block' ? t('properties:apartmentBlock') : t('properties:building')}: {item.group.name}
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
                  {item.status === 'available' ? t('properties:statusAvailable') : item.status === 'rented' ? t('properties:statusRented') : t('properties:statusMaintenance')}
                </Text>
              </View>
              
              {/* Property Type Badge */}
              <View style={[styles.typeBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.typeBadgeText, { color: theme.colors.onSurfaceVariant }]}>
                  {item.property_type === 'apartment' ? t('properties:typeApartment') : 
                   item.property_type === 'villa' ? t('properties:typeVilla') : 
                   item.property_type === 'office' ? t('properties:typeOffice') : 
                   item.property_type === 'retail' ? t('properties:typeRetail') : 
                   item.property_type === 'warehouse' ? t('properties:typeWarehouse') : t('properties:typeProperty')}
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
            {t('properties:bedrooms')}
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
            {item.bedrooms != null ? formatDisplayNumber(item.bedrooms) : '0'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
            {t('properties:bathrooms')}
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
            {item.bathrooms != null ? formatDisplayNumber(item.bathrooms) : '0'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
            {t('properties:area')}
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
            {formatDisplayNumber(item.area_sqm)} m²
          </Text>
        </View>
      </View>
      
      <View style={styles.propertyFooter}>
        <View style={styles.priceAndTypeContainer}>
          <Text style={[styles.propertyPrice, { color: theme.colors.primary }]}>
            {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(item.annual_rent || item.price))} SAR
            {item.annual_rent && '/year'}
          </Text>
          <View style={[styles.typeTag, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.typeText, { color: theme.colors.onSurfaceVariant }]}>
              {item.property_type === 'villa' ? t('properties:typeVilla') : 
               item.property_type === 'apartment' ? t('properties:typeApartment') : 
               item.property_type === 'office' ? t('properties:typeOffice') :
               item.property_type === 'retail' ? t('properties:typeRetail') :
               item.property_type === 'warehouse' ? t('properties:typeWarehouse') : (item.property_type || t('properties:unknown'))}
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
              Request Rental Contract
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
        title={t('properties:title')} 
        showNotifications={true}
        variant="dark"
      />

      {/* Top Search (keeps keyboard stable on mobile) */}
      <View style={[styles.searchSection, { paddingHorizontal: 16 }]}>
        <MobileSearchBar
          placeholder={t('properties:searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          iconColor={theme.colors.onSurfaceVariant}
          textAlign="right"
        />
      </View>

      {/* Properties List with FlatList */}
      {showInitialLoading ? (
        <PropertyListShimmer count={5} />
      ) : (
        <FlatList
          data={filteredProperties}
          renderItem={renderProperty}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          refreshControl={
            <RefreshControl
              refreshing={propertiesLoading || statsLoading || groupsLoading}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
              title="Pull to refresh"
              titleColor={theme.colors.onBackground}
            />
          }
          ListHeaderComponent={() => (
            <View>
              {/* Stats Section */}
              <View style={styles.statsSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                  {t('properties:statistics')}
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
                          {t('properties:totalProperties')}
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
                          {t('properties:available')}
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
                          {t('properties:rented')}
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
                          {t('properties:underMaintenance')}
                        </Text>
                        <Text style={[styles.horizontalStatValue, { color: '#F44336' }]}>
                          {statsLoading ? '...' : stats.maintenance}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Search moved above FlatList to avoid input unmount */}

              {/* Filter Section */}
              <View style={{ marginBottom: 12, flexDirection: 'row', gap: 8 }}>
                {[
                  { value: 'all', label: t('properties:filterAll') },
                  { value: 'units', label: t('properties:filterUnits') },
                  { value: 'groups', label: t('properties:filterBuildings') },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    onPress={() => setViewFilter(filter.value as any)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: viewFilter === filter.value ? theme.colors.primary : theme.colors.outlineVariant,
                      backgroundColor: viewFilter === filter.value ? theme.colors.primary : theme.colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: viewFilter === filter.value ? theme.colors.onPrimary : theme.colors.onSurface,
                      }}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Properties List Header */}
              <View style={styles.propertiesSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                  {t('properties:listTitle')} {!showInitialLoading && `(${filteredProperties.length})`}
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
                  No Properties Found
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {searchQuery ? 'Try searching with different words' : 'Start by adding a new property'}
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
        label={t('properties:addProperty')}
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
              <Title style={styles.modalTitle}>{t('properties:addTypeTitle', 'Choose Property Type to Add')}</Title>
              <Paragraph style={styles.modalDescription}>
                {t('properties:addTypeDesc', 'You can add a single property or a building with multiple units')}
              </Paragraph>
              
              <View style={styles.modalButtons}>
                <Button
                  mode="contained"
                  onPress={() => handleAddProperty('single')}
                  style={styles.modalButton}
                  icon="home"
                >
                  {t('properties:addSingleProperty', 'Add Single Property')}
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
                    {t('properties:createBuilding', 'Create New Building')}
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

const createStyles = (theme: AppTheme) => StyleSheet.create({
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
    color: theme.colors.onSurface,
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
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.onSurface,
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
    color: theme.colors.onSurfaceVariant,
  },
  propertyDescription: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'right',
    color: theme.colors.onSurfaceVariant,
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.outline,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
    color: theme.colors.onSurfaceVariant,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
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
    color: theme.colors.primary,
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
    color: theme.colors.onSurface,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
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
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.onSurfaceVariant,
  },
  horizontalStatValue: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: theme.colors.onSurface,
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
    color: theme.colors.onSurfaceVariant,
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
    color: theme.colors.error,
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
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.s,
    textAlign: 'center',
    color: theme.colors.onSurface,
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
