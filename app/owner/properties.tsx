import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import ModernHeader from '../../components/ModernHeader';

interface MyPropertiesProps {}

export default function MyProperties({}: MyPropertiesProps) {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'rented' | 'maintenance' | 'pending'>('all');
  
  // Mock owner ID - in real app, get from auth context
  const ownerId = '1'; // Replace with actual owner ID from auth

  const { 
    data: properties, 
    loading, 
    error,
    refetch 
  } = useApi(() => api.ownerProperty.getMyProperties(ownerId), [ownerId]);

  const styles = getStyles(theme);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing properties:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getPropertyStatus = (property: any) => {
    if (property.approval_status === 'pending') return 'pending';
    if (property.status === 'maintenance') return 'maintenance';
    if (property.contracts?.some((c: any) => c.status === 'active')) return 'rented';
    return 'available';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return theme.colors.primary;
      case 'rented': return theme.colors.secondary;
      case 'maintenance': return theme.colors.warning;
      case 'pending': return theme.colors.onSurfaceVariant;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const filteredProperties = properties?.filter(property => {
    if (filter === 'all') return true;
    return getPropertyStatus(property) === filter;
  }) || [];

  const renderFilterTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {['all', 'available', 'rented', 'maintenance', 'pending'].map((filterOption) => (
        <TouchableOpacity
          key={filterOption}
          style={[
            styles.filterTab,
            filter === filterOption && styles.activeFilterTab
          ]}
          onPress={() => setFilter(filterOption as any)}
        >
          <Text style={[
            styles.filterText,
            filter === filterOption && styles.activeFilterText
          ]}>
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderPropertyCard = (property: any) => {
    const status = getPropertyStatus(property);
    const activeContract = property.contracts?.find((c: any) => c.status === 'active');
    
    return (
      <TouchableOpacity
        key={property.id}
        style={styles.propertyCard}
        onPress={() => router.push(`/owner/properties/${property.id}`)}
      >
        <View style={styles.propertyImageContainer}>
          {property.images && property.images.length > 0 ? (
            <Image 
              source={{ uri: property.images[0] }} 
              style={styles.propertyImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialIcons name="home" size={40} color={theme.colors.onSurfaceVariant} />
            </View>
          )}
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.propertyContent}>
          <View style={styles.propertyHeader}>
            <Text style={styles.propertyTitle} numberOfLines={2}>{property.title}</Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                Alert.alert(
                  'Property Actions',
                  'Choose an action',
                  [
                    { text: 'View Details', onPress: () => router.push(`/owner/properties/${property.id}`) },
                    { text: 'Edit', onPress: () => router.push(`/owner/properties/${property.id}/edit`) },
                    { text: 'Analytics', onPress: () => router.push(`/owner/properties/${property.id}/analytics`) },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <MaterialIcons name="more-vert" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View style={styles.propertyLocation}>
            <MaterialIcons name="location-on" size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.locationText} numberOfLines={1}>
              {property.address}, {property.city}
            </Text>
          </View>

          <View style={styles.propertyDetails}>
            <View style={styles.detailItem}>
              <MaterialIcons name="square-foot" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.detailText}>{property.area_sqm} m²</Text>
            </View>
            {property.bedrooms && (
              <View style={styles.detailItem}>
                <MaterialIcons name="bed" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.detailText}>{property.bedrooms} BR</Text>
              </View>
            )}
            {property.bathrooms && (
              <View style={styles.detailItem}>
                <MaterialIcons name="bathtub" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.detailText}>{property.bathrooms} BA</Text>
              </View>
            )}
          </View>

          <View style={styles.propertyFooter}>
            <View style={styles.priceContainer}>
              {property.listing_type === 'rent' || property.listing_type === 'both' ? (
                <Text style={styles.price}>{property.annual_rent?.toLocaleString()} SAR/year</Text>
              ) : (
                <Text style={styles.price}>{property.price?.toLocaleString()} SAR</Text>
              )}
              <Text style={styles.priceType}>
                {property.listing_type === 'rent' ? 'Rental' : 
                 property.listing_type === 'sale' ? 'Sale' : 'Rent/Sale'}
              </Text>
            </View>

            {activeContract && (
              <View style={styles.tenantInfo}>
                <Text style={styles.tenantLabel}>Tenant:</Text>
                <Text style={styles.tenantName}>
                  {activeContract.tenant?.first_name} {activeContract.tenant?.last_name}
                </Text>
              </View>
            )}
          </View>

          {property.approval_status === 'pending' && (
            <View style={styles.pendingNotice}>
              <MaterialIcons name="schedule" size={16} color={theme.colors.warning} />
              <Text style={styles.pendingText}>Awaiting manager approval</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    const total = properties?.length || 0;
    const available = properties?.filter(p => getPropertyStatus(p) === 'available').length || 0;
    const rented = properties?.filter(p => getPropertyStatus(p) === 'rented').length || 0;
    const maintenance = properties?.filter(p => getPropertyStatus(p) === 'maintenance').length || 0;
    const pending = properties?.filter(p => getPropertyStatus(p) === 'pending').length || 0;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{available}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{rented}</Text>
          <Text style={styles.statLabel}>Rented</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{maintenance}</Text>
          <Text style={styles.statLabel}>Maintenance</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ModernHeader 
          title="My Properties" 
          rightIcon="add"
          onRightPress={() => router.push('/owner/add-property')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ModernHeader 
          title="My Properties" 
          rightIcon="add"
          onRightPress={() => router.push('/owner/add-property')}
        />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>Failed to load properties</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="My Properties" 
        rightIcon="add"
        onRightPress={() => router.push('/owner/add-property')}
      />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {renderStats()}
        {renderFilterTabs()}

        <View style={styles.propertiesContainer}>
          {filteredProperties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="home" size={64} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.emptyTitle}>
                {filter === 'all' ? 'No properties yet' : `No ${filter} properties`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all' 
                  ? 'Add your first property to get started'
                  : `You don't have any ${filter} properties at the moment`
                }
              </Text>
              {filter === 'all' && (
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => router.push('/owner/add-property')}
                >
                  <Text style={styles.addButtonText}>Add Property</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <Text style={styles.resultsText}>
                {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}
                {filter !== 'all' && ` • ${filter}`}
              </Text>
              {filteredProperties.map(renderPropertyCard)}
            </>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  filterContainer: {
    marginTop: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
  },
  activeFilterTab: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
  },
  activeFilterText: {
    color: '#fff',
  },
  propertiesContainer: {
    padding: 16,
  },
  resultsText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  propertyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  propertyImageContainer: {
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  propertyContent: {
    padding: 16,
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
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: 8,
  },
  menuButton: {
    padding: 4,
  },
  propertyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
    flex: 1,
  },
  propertyDetails: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  priceType: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  tenantInfo: {
    alignItems: 'flex-end',
  },
  tenantLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  tenantName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  pendingText: {
    fontSize: 12,
    color: theme.colors.warning,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 250,
  },
  addButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  bottomSpacing: {
    height: 20,
  },
}); 