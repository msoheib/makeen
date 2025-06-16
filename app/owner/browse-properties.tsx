import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import ModernHeader from '../../components/ModernHeader';

interface BrowsePropertiesProps {}

export default function BrowseProperties({}: BrowsePropertiesProps) {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'sale' | 'rent' | 'both'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under_500k' | '500k_1m' | 'over_1m'>('all');
  
  // Mock buyer ID - in real app, get from auth context
  const buyerId = '1'; // Replace with actual buyer ID from auth

  const { 
    data: properties, 
    loading, 
    error,
    refetch 
  } = useApi(() => api.buyer.getBrowseProperties(buyerId), [buyerId]);

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

  const handlePlaceBid = (property: any) => {
    router.push({
      pathname: '/owner/place-bid',
      params: {
        propertyId: property.id,
        propertyTitle: property.title,
        propertyPrice: property.price || property.annual_rent,
        listingType: property.listing_type,
        biddingEnabled: property.bidding_enabled ? 'true' : 'false',
        minBidAmount: property.min_bid_amount || 0,
        maxBidAmount: property.max_bid_amount || 0
      }
    });
  };

  const handleViewProperty = (property: any) => {
    router.push({
      pathname: '/owner/property-details',
      params: {
        propertyId: property.id,
        mode: 'browse'
      }
    });
  };

  const handleContactOwner = async (property: any) => {
    Alert.alert(
      'Contact Owner',
      `Would you like to contact the owner of "${property.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Message', 
          onPress: () => {
            router.push({
              pathname: '/owner/contact-owner',
              params: {
                propertyId: property.id,
                ownerId: property.owner_id,
                propertyTitle: property.title
              }
            });
          }
        }
      ]
    );
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'villa': return 'home';
      case 'apartment': return 'apartment';
      case 'office': return 'business';
      case 'retail': return 'store';
      case 'warehouse': return 'warehouse';
      default: return 'home';
    }
  };

  const filterProperties = () => {
    let filtered = properties || [];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.title?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.neighborhood?.toLowerCase().includes(query)
      );
    }

    // Listing type filter
    if (filter !== 'all') {
      filtered = filtered.filter(property => 
        property.listing_type === filter || property.listing_type === 'both'
      );
    }

    // Price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(property => {
        const price = property.price || property.annual_rent || 0;
        switch (priceFilter) {
          case 'under_500k': return price < 500000;
          case '500k_1m': return price >= 500000 && price <= 1000000;
          case 'over_1m': return price > 1000000;
          default: return true;
        }
      });
    }

    return filtered;
  };

  const filteredProperties = filterProperties();

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <MaterialIcons name="search" size={20} color={theme.colors.onSurfaceVariant} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search properties..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
      >
        {/* Listing Type Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Type:</Text>
          {['all', 'sale', 'rent', 'both'].map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[
                styles.filterChip,
                filter === filterOption && styles.activeFilterChip
              ]}
              onPress={() => setFilter(filterOption as any)}
            >
              <Text style={[
                styles.filterChipText,
                filter === filterOption && styles.activeFilterChipText
              ]}>
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Price:</Text>
          {[
            { key: 'all', label: 'All' },
            { key: 'under_500k', label: '< 500K' },
            { key: '500k_1m', label: '500K-1M' },
            { key: 'over_1m', label: '> 1M' }
          ].map((filterOption) => (
            <TouchableOpacity
              key={filterOption.key}
              style={[
                styles.filterChip,
                priceFilter === filterOption.key && styles.activeFilterChip
              ]}
              onPress={() => setPriceFilter(filterOption.key as any)}
            >
              <Text style={[
                styles.filterChipText,
                priceFilter === filterOption.key && styles.activeFilterChipText
              ]}>
                {filterOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderPropertyCard = (property: any) => {
    const hasBidding = property.bidding_enabled;
    const isOwnProperty = property.owner_id === buyerId;
    
    return (
      <TouchableOpacity
        key={property.id}
        style={styles.propertyCard}
        onPress={() => handleViewProperty(property)}
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
              <MaterialIcons 
                name={getPropertyTypeIcon(property.property_type)} 
                size={40} 
                color={theme.colors.onSurfaceVariant} 
              />
            </View>
          )}
          
          <View style={styles.badgeContainer}>
            <View style={[styles.listingTypeBadge, { 
              backgroundColor: property.listing_type === 'sale' ? theme.colors.primary : 
                               property.listing_type === 'rent' ? theme.colors.secondary : 
                               theme.colors.tertiary 
            }]}>
              <Text style={styles.listingTypeText}>
                {property.listing_type?.toUpperCase()}
              </Text>
            </View>
            
            {hasBidding && (
              <View style={[styles.biddingBadge, { backgroundColor: theme.colors.warning }]}>
                <MaterialIcons name="gavel" size={12} color="#fff" />
                <Text style={styles.biddingText}>BIDDING</Text>
              </View>
            )}
          </View>

          {isOwnProperty && (
            <View style={styles.ownPropertyOverlay}>
              <Text style={styles.ownPropertyText}>YOUR PROPERTY</Text>
            </View>
          )}
        </View>

        <View style={styles.propertyContent}>
          <Text style={styles.propertyTitle} numberOfLines={2}>{property.title}</Text>
          
          <View style={styles.propertyLocation}>
            <MaterialIcons name="location-on" size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.locationText} numberOfLines={1}>
              {property.address}, {property.city}
            </Text>
          </View>

          <View style={styles.propertyDetails}>
            <View style={styles.detailItem}>
              <MaterialIcons name="square-foot" size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.detailText}>{property.area_sqm} m²</Text>
            </View>
            {property.bedrooms && (
              <View style={styles.detailItem}>
                <MaterialIcons name="bed" size={14} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.detailText}>{property.bedrooms} BR</Text>
              </View>
            )}
            {property.bathrooms && (
              <View style={styles.detailItem}>
                <MaterialIcons name="bathtub" size={14} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.detailText}>{property.bathrooms} BA</Text>
              </View>
            )}
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {property.listing_type === 'rent' || property.listing_type === 'both' 
                ? `${property.annual_rent?.toLocaleString()} SAR/year`
                : `${property.price?.toLocaleString()} SAR`
              }
            </Text>
            
            {hasBidding && property.min_bid_amount && (
              <Text style={styles.bidRange}>
                Bid: {property.min_bid_amount.toLocaleString()} - {property.max_bid_amount?.toLocaleString()} SAR
              </Text>
            )}
          </View>

          {!isOwnProperty && (
            <View style={styles.actionButtons}>
              {hasBidding ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.bidButton]}
                  onPress={() => handlePlaceBid(property)}
                >
                  <MaterialIcons name="gavel" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Place Bid</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.contactButton]}
                  onPress={() => handleContactOwner(property)}
                >
                  <MaterialIcons name="message" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Contact Owner</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => handleViewProperty(property)}
              >
                <MaterialIcons name="visibility" size={16} color={theme.colors.primary} />
                <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>View Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ModernHeader title="Browse Properties" />
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
        <ModernHeader title="Browse Properties" />
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
      <ModernHeader title="Browse Properties" />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        stickyHeaderIndices={[0]}
      >
        <View style={styles.searchAndFilters}>
          {renderSearchBar()}
          {renderFilters()}
        </View>

        <View style={styles.propertiesContainer}>
          {filteredProperties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search" size={64} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.emptyTitle}>No Properties Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || filter !== 'all' || priceFilter !== 'all'
                  ? 'Try adjusting your search criteria or filters'
                  : 'No properties are currently available for purchase'
                }
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultsText}>
                {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
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
  searchAndFilters: {
    backgroundColor: theme.colors.background,
    paddingBottom: 8,
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filtersContent: {
    gap: 16,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
  },
  activeFilterChipText: {
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
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 6,
  },
  listingTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  listingTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  biddingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 2,
  },
  biddingText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
  },
  ownPropertyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownPropertyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  propertyContent: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
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
  priceContainer: {
    marginBottom: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  bidRange: {
    fontSize: 12,
    color: theme.colors.warning,
    marginTop: 2,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  bidButton: {
    backgroundColor: theme.colors.warning,
  },
  contactButton: {
    backgroundColor: theme.colors.secondary,
  },
  viewButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
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
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
}); 