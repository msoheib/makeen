import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, Chip, FAB, ActivityIndicator, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import api from '@/lib/api';
import { spacing } from '@/lib/theme';
import { ModernHeader } from '@/components/ModernHeader';
import { 
  Home,
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  Wifi,
  Shield,
  Zap,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
  Share2,
  Eye
} from 'lucide-react-native';

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { propertyId, mode = 'browse' } = useLocalSearchParams();

  // Mock buyer ID - in real app, get from auth context
  const buyerId = 'buyer-id-placeholder';

  // Get property details
  const { 
    data: property, 
    loading: propertyLoading, 
    error: propertyError,
    refetch
  } = useApi(() => api.properties.getById(propertyId as string), [propertyId]);

  // Get buyer's bids to check if already bid
  const { 
    data: myBids, 
    loading: bidsLoading 
  } = useApi(() => api.buyer.getMyBids(buyerId), [buyerId]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const styles = getStyles(theme);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) return <Wifi size={16} color={theme.colors.onSurfaceVariant} />;
    if (lowerAmenity.includes('parking') || lowerAmenity.includes('garage')) return <Car size={16} color={theme.colors.onSurfaceVariant} />;
    if (lowerAmenity.includes('ac') || lowerAmenity.includes('air')) return <Zap size={16} color={theme.colors.onSurfaceVariant} />;
    if (lowerAmenity.includes('security')) return <Shield size={16} color={theme.colors.onSurfaceVariant} />;
    return <CheckCircle size={16} color={theme.colors.onSurfaceVariant} />;
  };

  const hasMyBid = myBids?.data?.some(bid => bid.property_id === propertyId);
  const myBid = myBids?.data?.find(bid => bid.property_id === propertyId);

  const handleSubmitBid = () => {
    if (!propertyData.is_accepting_bids) {
      Alert.alert('Bidding Closed', 'This property is no longer accepting bids.');
      return;
    }

    router.push({
      pathname: '/buyer/submit-bid',
      params: {
        propertyId: propertyId as string,
        propertyTitle: propertyData.title,
        propertyPrice: propertyData.price || propertyData.annual_rent,
        listingType: propertyData.listing_type,
        minBidAmount: propertyData.minimum_bid_amount || 0,
        maxBidAmount: propertyData.maximum_bid_amount || propertyData.price || propertyData.annual_rent
      }
    });
  };

  const handleContactOwner = () => {
    if (propertyData.owner?.phone) {
      Alert.alert(
        'Contact Owner',
        `Would you like to call ${propertyData.owner.first_name} ${propertyData.owner.last_name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => {/* Implement phone call */} }
        ]
      );
    }
  };

  const handleShare = () => {
    // Implement sharing functionality
    Alert.alert('Share Property', 'Sharing functionality will be implemented here.');
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Implement favorite functionality with API
  };

  const nextImage = () => {
    if (propertyData.images && currentImageIndex < propertyData.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (propertyLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ModernHeader title="Property Details" showBack={true} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading property details...</Text>
      </View>
    );
  }

  if (propertyError || !property?.data) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ModernHeader title="Property Details" showBack={true} />
        <AlertCircle size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>Failed to load property details</Text>
        <Button mode="outlined" onPress={() => refetch()}>
          Retry
        </Button>
      </View>
    );
  }

  const propertyData = property.data;

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="Property Details" 
        showBack={true}
        rightContent={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.headerAction}>
              <Share2 size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleFavorite} style={styles.headerAction}>
              <Heart 
                size={24} 
                color={isFavorite ? theme.colors.error : theme.colors.onSurface}
                fill={isFavorite ? theme.colors.error : 'none'}
              />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {propertyData.images && propertyData.images.length > 0 ? (
            <>
              <Image 
                source={{ uri: propertyData.images[currentImageIndex] }} 
                style={styles.propertyImage}
                resizeMode="cover"
              />
              
              {propertyData.images.length > 1 && (
                <>
                  <TouchableOpacity
                    style={[styles.imageNavButton, styles.prevButton]}
                    onPress={prevImage}
                    disabled={currentImageIndex === 0}
                  >
                    <ChevronLeft size={24} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.imageNavButton, styles.nextButton]}
                    onPress={nextImage}
                    disabled={currentImageIndex === propertyData.images.length - 1}
                  >
                    <ChevronRight size={24} color="#fff" />
                  </TouchableOpacity>
                  
                  <View style={styles.imageIndicator}>
                    <Text style={styles.imageCounter}>
                      {currentImageIndex + 1} / {propertyData.images.length}
                    </Text>
                  </View>
                </>
              )}
              
              {/* Status Badges */}
              <View style={styles.statusBadges}>
                <Chip
                  style={[styles.statusChip, { backgroundColor: theme.colors.primaryContainer }]}
                  textStyle={{ color: theme.colors.onPrimaryContainer }}
                >
                  {propertyData.listing_type === 'sale' ? 'FOR SALE' : 
                   propertyData.listing_type === 'rent' ? 'FOR RENT' : 'SALE/RENT'}
                </Chip>
                
                {propertyData.is_accepting_bids && (
                  <Chip
                    style={[styles.biddingChip, { backgroundColor: theme.colors.secondaryContainer }]}
                    textStyle={{ color: theme.colors.onSecondaryContainer }}
                    icon={({ size, color }) => <Clock size={size} color={color} />}
                  >
                    ACCEPTING BIDS
                  </Chip>
                )}
              </View>
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <Home size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.placeholderText}>No images available</Text>
            </View>
          )}
        </View>

        {/* Property Information */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.propertyTitle}>{propertyData.title}</Text>
            
            <View style={styles.locationRow}>
              <MapPin size={16} color={theme.colors.primary} />
              <Text style={styles.locationText}>
                {propertyData.address}, {propertyData.city}, {propertyData.country}
              </Text>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>
                {formatPrice(propertyData.price || propertyData.annual_rent || 0)}
              </Text>
              {propertyData.listing_type === 'rent' && (
                <Text style={styles.priceUnit}>/year</Text>
              )}
            </View>

            {/* Property Features */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Bed size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>
                  {propertyData.bedrooms || 'N/A'} Bedrooms
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Bath size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>
                  {propertyData.bathrooms || 'N/A'} Bathrooms
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Square size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>
                  {propertyData.area_sqm}m²
                </Text>
              </View>
              {propertyData.parking_spaces > 0 && (
                <View style={styles.featureItem}>
                  <Car size={20} color={theme.colors.primary} />
                  <Text style={styles.featureText}>
                    {propertyData.parking_spaces} Parking
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Property Description */}
        {propertyData.description && (
          <Card style={styles.descriptionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{propertyData.description}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Amenities */}
        {propertyData.amenities && propertyData.amenities.length > 0 && (
          <Card style={styles.amenitiesCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesContainer}>
                {propertyData.amenities.map((amenity: string, index: number) => (
                  <View key={index} style={styles.amenityItem}>
                    {getAmenityIcon(amenity)}
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Bidding Information */}
        {propertyData.is_accepting_bids && (
          <Card style={styles.biddingCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Bidding Information</Text>
              
              {propertyData.minimum_bid_amount && (
                <View style={styles.bidInfoRow}>
                  <Text style={styles.bidInfoLabel}>Minimum Bid:</Text>
                  <Text style={styles.bidInfoValue}>
                    {formatPrice(propertyData.minimum_bid_amount)}
                  </Text>
                </View>
              )}
              
              {propertyData.maximum_bid_amount && (
                <View style={styles.bidInfoRow}>
                  <Text style={styles.bidInfoLabel}>Maximum Bid:</Text>
                  <Text style={styles.bidInfoValue}>
                    {formatPrice(propertyData.maximum_bid_amount)}
                  </Text>
                </View>
              )}
              
              {propertyData.bid_increment && (
                <View style={styles.bidInfoRow}>
                  <Text style={styles.bidInfoLabel}>Bid Increment:</Text>
                  <Text style={styles.bidInfoValue}>
                    {formatPrice(propertyData.bid_increment)}
                  </Text>
                </View>
              )}

              {propertyData.listing_expires_at && (
                <View style={styles.bidInfoRow}>
                  <Text style={styles.bidInfoLabel}>Bidding Closes:</Text>
                  <Text style={styles.bidInfoValue}>
                    {new Date(propertyData.listing_expires_at).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* My Bid Status */}
        {hasMyBid && myBid && (
          <Card style={[styles.myBidCard, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Card.Content>
              <Text style={styles.myBidTitle}>Your Bid</Text>
              <View style={styles.myBidInfo}>
                <View style={styles.myBidAmount}>
                  <Text style={styles.myBidLabel}>Amount:</Text>
                  <Text style={styles.myBidValue}>
                    {formatPrice(myBid.bid_amount)}
                  </Text>
                </View>
                <View style={styles.myBidStatus}>
                  <Text style={styles.myBidLabel}>Status:</Text>
                  <Chip
                    mode="outlined"
                    textStyle={{ 
                      fontSize: 12,
                      color: myBid.bid_status === 'owner_approved' ? theme.colors.onSecondaryContainer :
                             myBid.bid_status === 'rejected' ? theme.colors.error :
                             theme.colors.onSecondaryContainer
                    }}
                  >
                    {myBid.bid_status.replace('_', ' ').toUpperCase()}
                  </Chip>
                </View>
              </View>
              <Text style={styles.myBidDate}>
                Submitted: {new Date(myBid.created_at).toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Owner Information */}
        {propertyData.owner && (
          <Card style={styles.ownerCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Property Owner</Text>
              
              <View style={styles.ownerInfo}>
                <View style={styles.ownerAvatar}>
                  <User size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.ownerDetails}>
                  <Text style={styles.ownerName}>
                    {propertyData.owner.first_name} {propertyData.owner.last_name}
                  </Text>
                  {propertyData.owner.phone && (
                    <TouchableOpacity style={styles.ownerContact} onPress={handleContactOwner}>
                      <Phone size={16} color={theme.colors.primary} />
                      <Text style={styles.ownerContactText}>
                        {propertyData.owner.phone}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {propertyData.owner.email && (
                    <View style={styles.ownerContact}>
                      <Mail size={16} color={theme.colors.primary} />
                      <Text style={styles.ownerContactText}>
                        {propertyData.owner.email}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      {propertyData.status === 'available' && 
       propertyData.is_accepting_bids && 
       !hasMyBid && (
        <FAB
          icon={({ size, color }) => <DollarSign size={size} color={color} />}
          label="Submit Bid"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleSubmitBid}
        />
      )}

      {/* Contact Owner FAB */}
      {propertyData.status === 'available' && 
       !propertyData.is_accepting_bids && (
        <FAB
          icon={({ size, color }) => <Phone size={size} color={color} />}
          label="Contact Owner"
          style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
          onPress={handleContactOwner}
        />
      )}
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
    scrollView: {
      flex: 1,
    },
    loadingText: {
      marginTop: spacing.m,
      color: theme.colors.onSurface,
    },
    errorText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.error,
      marginVertical: spacing.m,
      textAlign: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      gap: spacing.s,
    },
    headerAction: {
      padding: spacing.xs,
    },
    imageContainer: {
      position: 'relative',
      height: 300,
    },
    propertyImage: {
      width: '100%',
      height: '100%',
    },
    placeholderImage: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      marginTop: spacing.s,
      color: theme.colors.onSurfaceVariant,
    },
    imageNavButton: {
      position: 'absolute',
      top: '50%',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: -20,
    },
    prevButton: {
      left: spacing.m,
    },
    nextButton: {
      right: spacing.m,
    },
    imageIndicator: {
      position: 'absolute',
      bottom: spacing.m,
      right: spacing.m,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: spacing.s,
      paddingVertical: spacing.xs,
      borderRadius: 16,
    },
    imageCounter: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '500',
    },
    statusBadges: {
      position: 'absolute',
      top: spacing.m,
      left: spacing.m,
      gap: spacing.s,
    },
    statusChip: {
      alignSelf: 'flex-start',
    },
    biddingChip: {
      alignSelf: 'flex-start',
    },
    infoCard: {
      margin: spacing.m,
      borderRadius: 16,
    },
    propertyTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: spacing.s,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.m,
    },
    locationText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: spacing.m,
    },
    priceText: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    priceUnit: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginLeft: spacing.xs,
    },
    featuresContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.m,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minWidth: '45%',
    },
    featureText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    descriptionCard: {
      marginHorizontal: spacing.m,
      marginBottom: spacing.m,
      borderRadius: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: spacing.m,
    },
    descriptionText: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.onSurface,
    },
    amenitiesCard: {
      marginHorizontal: spacing.m,
      marginBottom: spacing.m,
      borderRadius: 16,
    },
    amenitiesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.m,
    },
    amenityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minWidth: '45%',
    },
    amenityText: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    biddingCard: {
      marginHorizontal: spacing.m,
      marginBottom: spacing.m,
      borderRadius: 16,
    },
    bidInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.s,
    },
    bidInfoLabel: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    bidInfoValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    myBidCard: {
      marginHorizontal: spacing.m,
      marginBottom: spacing.m,
      borderRadius: 16,
    },
    myBidTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onSecondaryContainer,
      marginBottom: spacing.m,
    },
    myBidInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.s,
    },
    myBidAmount: {
      flex: 1,
    },
    myBidStatus: {
      alignItems: 'flex-end',
    },
    myBidLabel: {
      fontSize: 14,
      color: theme.colors.onSecondaryContainer,
      opacity: 0.8,
    },
    myBidValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSecondaryContainer,
    },
    myBidDate: {
      fontSize: 12,
      color: theme.colors.onSecondaryContainer,
      opacity: 0.8,
    },
    ownerCard: {
      marginHorizontal: spacing.m,
      marginBottom: spacing.m,
      borderRadius: 16,
    },
    ownerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ownerAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.m,
    },
    ownerDetails: {
      flex: 1,
    },
    ownerName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing.xs,
    },
    ownerContact: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    ownerContactText: {
      fontSize: 14,
      color: theme.colors.primary,
    },
    fab: {
      position: 'absolute',
      margin: spacing.m,
      right: 0,
      bottom: 0,
    },
    bottomSpacing: {
      height: 100,
    },
  });
} 