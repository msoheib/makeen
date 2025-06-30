import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Image, Dimensions } from 'react-native';
import { Text, Card, Button, Chip, FAB, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { 
  ArrowLeft,
  Home,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Shield,
  Zap,
  Car,
  Bed,
  Bath,
  Square,
  Wifi,
  Utensils,
  Wind,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  HandCoins
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import { useApi } from '@/hooks/useApi';
import { propertiesApi, tenantApi } from '@/lib/api';

const { width } = Dimensions.get('window');

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const { propertyId } = useLocalSearchParams();
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Get property details
  const { 
    data: property, 
    loading: propertyLoading, 
    error: propertyError 
  } = useApi(() => propertiesApi.getById(propertyId as string), [propertyId]);

  // Get my bids to check if I already bid on this property
  const { 
    data: myBids, 
    loading: bidsLoading 
  } = useApi(() => tenantApi.getMyBids(), []);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('انترنت')) return <Wifi size={16} color={theme.colors.onSurfaceVariant} />;
    if (lowerAmenity.includes('kitchen') || lowerAmenity.includes('مطبخ')) return <Utensils size={16} color={theme.colors.onSurfaceVariant} />;
    if (lowerAmenity.includes('ac') || lowerAmenity.includes('تكييف')) return <Wind size={16} color={theme.colors.onSurfaceVariant} />;
    return <CheckCircle size={16} color={theme.colors.onSurfaceVariant} />;
  };

  const hasMyBid = myBids?.data?.some(bid => bid.property_id === propertyId);
  const myBid = myBids?.data?.find(bid => bid.property_id === propertyId);

  const handlePlaceBid = () => {
    router.push({
      pathname: '/tenant/place-bid',
      params: { propertyId: propertyId as string }
    });
  };

  if (propertyLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title="تفاصيل العقار" 
          showBack={true}
          variant="dark"
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
            جاري تحميل تفاصيل العقار...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (propertyError || !property?.data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title="تفاصيل العقار" 
          showBack={true}
          variant="dark"
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            خطأ في تحميل تفاصيل العقار
          </Text>
          <Button mode="outlined" onPress={() => router.back()}>
            العودة
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const propertyData = property.data;
  const images = propertyData.images || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="تفاصيل العقار" 
        showBack={true}
        variant="dark"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Property Images */}
        {images.length > 0 && (
          <View style={styles.imageContainer}>
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.propertyImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            
            {images.length > 1 && (
              <View style={styles.imageIndicators}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      {
                        backgroundColor: index === currentImageIndex 
                          ? theme.colors.primary 
                          : theme.colors.outline
                      }
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Property Header */}
        <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.propertyHeader}>
              <View style={styles.propertyInfo}>
                <Text style={[styles.propertyTitle, { color: theme.colors.onSurface }]}>
                  {propertyData.title}
                </Text>
                <View style={styles.locationRow}>
                  <MapPin size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.locationText, { color: theme.colors.onSurfaceVariant }]}>
                    {propertyData.address}, {propertyData.city}
                  </Text>
                </View>
              </View>
              <Text style={[styles.priceText, { color: theme.colors.primary }]}>
                {formatPrice(propertyData.price)}
              </Text>
            </View>

            <View style={styles.statusContainer}>
              <Chip 
                mode="flat" 
                style={{ 
                  backgroundColor: propertyData.status === 'available' 
                    ? theme.colors.primaryContainer 
                    : theme.colors.errorContainer 
                }}
                textStyle={{ 
                  color: propertyData.status === 'available' 
                    ? theme.colors.primary 
                    : theme.colors.error 
                }}
              >
                {propertyData.status === 'available' ? 'متاح للإيجار' : 'غير متاح'}
              </Chip>
              
              {propertyData.listing_type && (
                <Chip mode="outlined">
                  {propertyData.listing_type === 'rent' && 'للإيجار'}
                  {propertyData.listing_type === 'sale' && 'للبيع'}
                  {propertyData.listing_type === 'both' && 'للإيجار والبيع'}
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* My Bid Status */}
        {hasMyBid && myBid && (
          <Card style={[styles.bidStatusCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.bidStatusHeader}>
                <HandCoins size={24} color={theme.colors.primary} />
                <Text style={[styles.bidStatusTitle, { color: theme.colors.onSurface }]}>
                  عرضي المقدم
                </Text>
              </View>
              
              <View style={styles.bidStatusDetails}>
                <View style={styles.bidDetailRow}>
                  <Text style={[styles.bidDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
                    مبلغ العرض:
                  </Text>
                  <Text style={[styles.bidDetailValue, { color: theme.colors.onSurface }]}>
                    {formatPrice(myBid.bid_amount)}
                  </Text>
                </View>
                
                <View style={styles.bidDetailRow}>
                  <Text style={[styles.bidDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
                    حالة العرض:
                  </Text>
                  <Chip 
                    mode="flat" 
                    style={{ backgroundColor: getBidStatusColor(myBid.bid_status) + '20' }}
                    textStyle={{ color: getBidStatusColor(myBid.bid_status) }}
                  >
                    {getBidStatusText(myBid.bid_status)}
                  </Chip>
                </View>
                
                {myBid.rental_duration_months && (
                  <View style={styles.bidDetailRow}>
                    <Text style={[styles.bidDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
                      مدة الإيجار:
                    </Text>
                    <Text style={[styles.bidDetailValue, { color: theme.colors.onSurface }]}>
                      {myBid.rental_duration_months} شهر
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Property Features */}
        <Card style={[styles.featuresCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              مواصفات العقار
            </Text>
            
            <View style={styles.featuresGrid}>
              {propertyData.bedrooms && (
                <View style={styles.featureItem}>
                  <Bed size={20} color={theme.colors.primary} />
                  <Text style={[styles.featureLabel, { color: theme.colors.onSurfaceVariant }]}>
                    غرف النوم
                  </Text>
                  <Text style={[styles.featureValue, { color: theme.colors.onSurface }]}>
                    {propertyData.bedrooms}
                  </Text>
                </View>
              )}
              
              {propertyData.bathrooms && (
                <View style={styles.featureItem}>
                  <Bath size={20} color={theme.colors.primary} />
                  <Text style={[styles.featureLabel, { color: theme.colors.onSurfaceVariant }]}>
                    دورات المياه
                  </Text>
                  <Text style={[styles.featureValue, { color: theme.colors.onSurface }]}>
                    {propertyData.bathrooms}
                  </Text>
                </View>
              )}
              
              {propertyData.area_sqm && (
                <View style={styles.featureItem}>
                  <Square size={20} color={theme.colors.primary} />
                  <Text style={[styles.featureLabel, { color: theme.colors.onSurfaceVariant }]}>
                    المساحة
                  </Text>
                  <Text style={[styles.featureValue, { color: theme.colors.onSurface }]}>
                    {propertyData.area_sqm} م²
                  </Text>
                </View>
              )}
              
              {propertyData.parking_spaces > 0 && (
                <View style={styles.featureItem}>
                  <Car size={20} color={theme.colors.primary} />
                  <Text style={[styles.featureLabel, { color: theme.colors.onSurfaceVariant }]}>
                    مواقف السيارات
                  </Text>
                  <Text style={[styles.featureValue, { color: theme.colors.onSurface }]}>
                    {propertyData.parking_spaces}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Property Description */}
        {propertyData.description && (
          <Card style={[styles.descriptionCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                وصف العقار
              </Text>
              <Text style={[styles.descriptionText, { color: theme.colors.onSurfaceVariant }]}>
                {propertyData.description}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Amenities */}
        {propertyData.amenities && propertyData.amenities.length > 0 && (
          <Card style={[styles.amenitiesCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                المرافق والخدمات
              </Text>
              <View style={styles.amenitiesList}>
                {propertyData.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityItem}>
                    {getAmenityIcon(amenity)}
                    <Text style={[styles.amenityText, { color: theme.colors.onSurfaceVariant }]}>
                      {amenity}
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Bidding Information */}
        {propertyData.is_accepting_bids && (
          <Card style={[styles.biddingCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                معلومات المزايدة
              </Text>
              
              {propertyData.minimum_bid_amount && (
                <View style={styles.bidInfoRow}>
                  <Text style={[styles.bidInfoLabel, { color: theme.colors.onSurfaceVariant }]}>
                    الحد الأدنى للعرض:
                  </Text>
                  <Text style={[styles.bidInfoValue, { color: theme.colors.primary }]}>
                    {formatPrice(propertyData.minimum_bid_amount)}
                  </Text>
                </View>
              )}
              
              {propertyData.maximum_bid_amount && (
                <View style={styles.bidInfoRow}>
                  <Text style={[styles.bidInfoLabel, { color: theme.colors.onSurfaceVariant }]}>
                    الحد الأقصى للعرض:
                  </Text>
                  <Text style={[styles.bidInfoValue, { color: theme.colors.primary }]}>
                    {formatPrice(propertyData.maximum_bid_amount)}
                  </Text>
                </View>
              )}
              
              {propertyData.bid_increment && (
                <View style={styles.bidInfoRow}>
                  <Text style={[styles.bidInfoLabel, { color: theme.colors.onSurfaceVariant }]}>
                    الحد الأدنى للزيادة:
                  </Text>
                  <Text style={[styles.bidInfoValue, { color: theme.colors.onSurface }]}>
                    {formatPrice(propertyData.bid_increment)}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Owner Information */}
        {propertyData.owner && (
          <Card style={[styles.ownerCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                معلومات المالك
              </Text>
              
              <View style={styles.ownerInfo}>
                <User size={20} color={theme.colors.primary} />
                <View style={styles.ownerDetails}>
                  <Text style={[styles.ownerName, { color: theme.colors.onSurface }]}>
                    {propertyData.owner.first_name} {propertyData.owner.last_name}
                  </Text>
                  {propertyData.owner.phone && (
                    <View style={styles.contactRow}>
                      <Phone size={14} color={theme.colors.onSurfaceVariant} />
                      <Text style={[styles.contactText, { color: theme.colors.onSurfaceVariant }]}>
                        {propertyData.owner.phone}
                      </Text>
                    </View>
                  )}
                  {propertyData.owner.email && (
                    <View style={styles.contactRow}>
                      <Mail size={14} color={theme.colors.onSurfaceVariant} />
                      <Text style={[styles.contactText, { color: theme.colors.onSurfaceVariant }]}>
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

      {/* Place Bid FAB */}
      {propertyData.status === 'available' && 
       propertyData.is_accepting_bids && 
       !hasMyBid && (
        <FAB
          icon="hand-coin"
          label="تقديم عرض"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handlePlaceBid}
        />
      )}
    </SafeAreaView>
  );
}

const getBidStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#FF9800';
    case 'manager_approved': return '#2196F3';
    case 'accepted': return '#4CAF50';
    case 'rejected': return '#F44336';
    case 'withdrawn': return '#9E9E9E';
    case 'expired': return '#9E9E9E';
    default: return '#9E9E9E';
  }
};

const getBidStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'قيد المراجعة';
    case 'manager_approved': return 'موافقة المدير';
    case 'accepted': return 'مقبول';
    case 'rejected': return 'مرفوض';
    case 'withdrawn': return 'منسحب';
    case 'expired': return 'منتهي الصلاحية';
    default: return status;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  imageContainer: {
    height: 250,
    position: 'relative',
  },
  propertyImage: {
    width: width,
    height: 250,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  propertyInfo: {
    flex: 1,
    marginRight: 12,
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  bidStatusCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
  },
  bidStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  bidStatusTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  bidStatusDetails: {
    gap: 12,
  },
  bidDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidDetailLabel: {
    fontSize: 14,
  },
  bidDetailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  featuresCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'right',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    gap: 8,
  },
  featureLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  featureValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  descriptionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  amenitiesCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 12,
  },
  biddingCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
  },
  bidInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bidInfoLabel: {
    fontSize: 14,
  },
  bidInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  ownerCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
  },
  bottomSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 