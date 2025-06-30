import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Searchbar, Chip, Surface, Menu, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import api from '@/lib/api';
import { spacing } from '@/lib/theme';
import { ModernHeader } from '@/components/ModernHeader';
import { Search, Filter, MapPin, Bed, Bath, Square, DollarSign, Clock, CheckCircle } from 'lucide-react-native';

export default function BrowseProperties() {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    listing_type: 'both' as 'sale' | 'rent' | 'both',
    property_type: '',
    min_price: '',
    max_price: '',
    bedrooms: '',
    city: ''
  });

  // Mock buyer ID - in real app, get from auth context
  const buyerId = 'buyer-id-placeholder';

  const { 
    data: properties, 
    loading, 
    error,
    refetch 
  } = useApi(() => api.buyer.getBrowseProperties(buildFiltersForAPI()), [filters]);

  const styles = getStyles(theme);

  function buildFiltersForAPI() {
    const apiFilters: any = {};
    
    if (filters.listing_type !== 'both') {
      apiFilters.listing_type = filters.listing_type;
    }
    if (filters.property_type) {
      apiFilters.property_type = filters.property_type;
    }
    if (filters.min_price) {
      apiFilters.min_price = parseInt(filters.min_price);
    }
    if (filters.max_price) {
      apiFilters.max_price = parseInt(filters.max_price);
    }
    if (filters.bedrooms) {
      apiFilters.bedrooms = parseInt(filters.bedrooms);
    }
    if (filters.city) {
      apiFilters.city = filters.city;
    }

    return apiFilters;
  }

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

  const handleSubmitBid = (property: any) => {
    router.push({
      pathname: '/buyer/submit-bid',
      params: {
        propertyId: property.id,
        propertyTitle: property.title,
        propertyPrice: property.price || property.annual_rent,
        listingType: property.listing_type,
        minBidAmount: property.minimum_bid_amount || 0,
        maxBidAmount: property.maximum_bid_amount || property.price || property.annual_rent
      }
    });
  };

  const handleViewProperty = (property: any) => {
    router.push({
      pathname: '/buyer/property-details',
      params: {
        propertyId: property.id,
        mode: 'browse'
      }
    });
  };

  const resetFilters = () => {
    setFilters({
      listing_type: 'both',
      property_type: '',
      min_price: '',
      max_price: '',
      bedrooms: '',
      city: ''
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.listing_type !== 'both') count++;
    if (filters.property_type) count++;
    if (filters.min_price) count++;
    if (filters.max_price) count++;
    if (filters.bedrooms) count++;
    if (filters.city) count++;
    return count;
  };

  const filteredProperties = properties?.filter(property => 
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading properties...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Error loading properties</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <Button mode="contained" onPress={refetch} style={styles.retryButton}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="Browse Properties" 
        subtitle="Find your perfect property"
      />
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search properties..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          icon={({ size, color }) => <Search size={size} color={color} />}
        />
        
        <Button
          mode="outlined"
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
          icon={({ size, color }) => <Filter size={size} color={color} />}
        >
          Filter {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
        </Button>
      </View>

      {showFilters && (
        <Surface style={styles.filtersContainer} elevation={1}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filters</Text>
            <Button mode="text" onPress={resetFilters} compact>
              Reset
            </Button>
          </View>
          
          <View style={styles.filterChips}>
            <Text style={styles.filterLabel}>Listing Type:</Text>
            <View style={styles.chipRow}>
              {['both', 'sale', 'rent'].map((type) => (
                <Chip
                  key={type}
                  selected={filters.listing_type === type}
                  onPress={() => setFilters({...filters, listing_type: type as any})}
                  style={styles.chip}
                >
                  {type === 'both' ? 'Both' : type === 'sale' ? 'For Sale' : 'For Rent'}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.filterChips}>
            <Text style={styles.filterLabel}>Property Type:</Text>
            <View style={styles.chipRow}>
              {['', 'apartment', 'villa', 'office', 'warehouse'].map((type) => (
                <Chip
                  key={type}
                  selected={filters.property_type === type}
                  onPress={() => setFilters({...filters, property_type: type})}
                  style={styles.chip}
                >
                  {type || 'All Types'}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.filterChips}>
            <Text style={styles.filterLabel}>Bedrooms:</Text>
            <View style={styles.chipRow}>
              {['', '1', '2', '3', '4', '5+'].map((beds) => (
                <Chip
                  key={beds}
                  selected={filters.bedrooms === beds}
                  onPress={() => setFilters({...filters, bedrooms: beds})}
                  style={styles.chip}
                >
                  {beds || 'Any'}
                </Chip>
              ))}
            </View>
          </View>
        </Surface>
      )}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredProperties.length} Properties Found
          </Text>
          {searchQuery && (
            <Text style={styles.searchInfo}>
              Searching for "{searchQuery}"
            </Text>
          )}
        </View>

        {filteredProperties.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={64} color={theme.colors.outline} />
            <Text style={styles.emptyTitle}>No Properties Found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search criteria or filters
            </Text>
            <Button mode="outlined" onPress={resetFilters} style={styles.resetButton}>
              Reset Filters
            </Button>
          </View>
        ) : (
          filteredProperties.map((property: any) => (
            <Card key={property.id} style={styles.propertyCard}>
              <View style={styles.propertyHeader}>
                {property.images && property.images.length > 0 ? (
                  <Image
                    source={{ uri: property.images[0] }}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <MapPin size={32} color={theme.colors.outline} />
                  </View>
                )}
                
                <View style={styles.propertyBadges}>
                  <Chip
                    style={[styles.statusChip, { backgroundColor: theme.colors.primaryContainer }]}
                    textStyle={{ color: theme.colors.onPrimaryContainer }}
                  >
                    {property.listing_type === 'sale' ? 'FOR SALE' : 
                     property.listing_type === 'rent' ? 'FOR RENT' : 'SALE/RENT'}
                  </Chip>
                  
                  {property.is_accepting_bids && (
                    <Chip
                      style={[styles.biddingChip, { backgroundColor: theme.colors.secondaryContainer }]}
                      textStyle={{ color: theme.colors.onSecondaryContainer }}
                      icon={({ size, color }) => <Clock size={size} color={color} />}
                    >
                      ACCEPTING BIDS
                    </Chip>
                  )}
                </View>
              </View>
              
              <Card.Content>
                <Text style={styles.propertyTitle} numberOfLines={2}>
                  {property.title}
                </Text>
                
                <Text style={styles.propertyAddress} numberOfLines={1}>
                  <MapPin size={14} color={theme.colors.primary} />
                  {' '}{property.address}, {property.city}
                </Text>
                
                <View style={styles.propertyDetails}>
                  <View style={styles.propertyInfo}>
                    <View style={styles.infoItem}>
                      <Bed size={16} color={theme.colors.primary} />
                      <Text style={styles.infoText}>{property.bedrooms || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Bath size={16} color={theme.colors.primary} />
                      <Text style={styles.infoText}>{property.bathrooms || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Square size={16} color={theme.colors.primary} />
                      <Text style={styles.infoText}>{property.area_sqm}m²</Text>
                    </View>
                  </View>
                  
                  <View style={styles.priceContainer}>
                    <Text style={styles.propertyPrice}>
                      {new Intl.NumberFormat('en-SA', {
                        style: 'currency',
                        currency: 'SAR',
                        minimumFractionDigits: 0
                      }).format(property.price || property.annual_rent)}
                    </Text>
                    {property.listing_type === 'rent' && (
                      <Text style={styles.priceUnit}>/year</Text>
                    )}
                  </View>
                </View>
                
                {property.owner && (
                  <View style={styles.ownerInfo}>
                    <Text style={styles.ownerLabel}>Owner:</Text>
                    <Text style={styles.ownerName}>
                      {property.owner.first_name} {property.owner.last_name}
                    </Text>
                  </View>
                )}
                
                <View style={styles.propertyActions}>
                  <Button
                    mode="outlined"
                    onPress={() => handleViewProperty(property)}
                    style={styles.actionButton}
                  >
                    View Details
                  </Button>
                  
                  {property.is_accepting_bids ? (
                    <Button
                      mode="contained"
                      onPress={() => handleSubmitBid(property)}
                      style={styles.actionButton}
                      icon={({ size, color }) => <DollarSign size={size} color={color} />}
                    >
                      Submit Bid
                    </Button>
                  ) : (
                    <Button
                      mode="outlined"
                      onPress={() => {/* Contact owner functionality */}}
                      style={styles.actionButton}
                      disabled
                    >
                      Contact Owner
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: spacing.m,
      color: theme.colors.onSurface,
    },
    errorText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.error,
      marginBottom: spacing.s,
    },
    errorSubtext: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing.l,
    },
    retryButton: {
      marginTop: spacing.m,
    },
    searchContainer: {
      flexDirection: 'row',
      padding: spacing.m,
      gap: spacing.s,
    },
    searchbar: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    filterButton: {
      alignSelf: 'center',
    },
    filtersContainer: {
      margin: spacing.m,
      marginTop: 0,
      padding: spacing.m,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
    },
    filtersHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.m,
    },
    filtersTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    filterChips: {
      marginBottom: spacing.m,
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: spacing.s,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.s,
    },
    chip: {
      marginRight: spacing.xs,
      marginBottom: spacing.xs,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.m,
      paddingTop: 0,
    },
    resultsHeader: {
      marginBottom: spacing.m,
    },
    resultsCount: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    searchInfo: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing.xs,
    },
    emptyState: {
      alignItems: 'center',
      padding: spacing.xl,
      marginTop: spacing.xl,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: spacing.m,
      marginBottom: spacing.s,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing.l,
    },
    resetButton: {
      marginTop: spacing.s,
    },
    propertyCard: {
      marginBottom: spacing.m,
      borderRadius: 12,
      overflow: 'hidden',
    },
    propertyHeader: {
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
    propertyBadges: {
      position: 'absolute',
      top: spacing.m,
      right: spacing.m,
      gap: spacing.s,
    },
    statusChip: {
      alignSelf: 'flex-end',
    },
    biddingChip: {
      alignSelf: 'flex-end',
    },
    propertyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: spacing.s,
    },
    propertyAddress: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.m,
      flexDirection: 'row',
      alignItems: 'center',
    },
    propertyDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.m,
    },
    propertyInfo: {
      flexDirection: 'row',
      gap: spacing.l,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    priceContainer: {
      alignItems: 'flex-end',
    },
    propertyPrice: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    priceUnit: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    ownerInfo: {
      flexDirection: 'row',
      marginBottom: spacing.m,
    },
    ownerLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginRight: spacing.s,
    },
    ownerName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    propertyActions: {
      flexDirection: 'row',
      gap: spacing.s,
    },
    actionButton: {
      flex: 1,
    },
  });
} 