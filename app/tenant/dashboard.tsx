import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, FAB, Chip, Avatar, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { lightTheme, darkTheme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { 
  Home, 
  Search, 
  HandCoins, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Wrench,
  MapPin,
  Bed,
  Bath,
  Car,
  Plus,
  Eye,
  Calendar
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import StatCard from '@/components/StatCard';
import { useApi } from '@/hooks/useApi';
import { tenantApi, bidsApi } from '@/lib/api';

export default function TenantDashboardScreen() {
  const router = useRouter();
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'mybids' | 'maintenance'>('browse');

  // API calls for tenant data
  const { 
    data: availableProperties, 
    loading: propertiesLoading, 
    error: propertiesError, 
    refetch: refetchProperties 
  } = useApi(() => tenantApi.getAvailableRentalProperties(), []);

  const { 
    data: myBids, 
    loading: bidsLoading, 
    error: bidsError, 
    refetch: refetchBids 
  } = useApi(() => tenantApi.getMyBids(), []);

  const { 
    data: maintenanceRequests, 
    loading: maintenanceLoading, 
    error: maintenanceError, 
    refetch: refetchMaintenance 
  } = useApi(() => tenantApi.getMyMaintenanceRequests(), []);

  const { 
    data: myContracts, 
    loading: contractsLoading, 
    refetch: refetchContracts 
  } = useApi(() => tenantApi.getMyContracts(), []);

  // Handle refresh
  const [refreshing, setRefreshing] = React.useState(false);
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchProperties(),
      refetchBids(),
      refetchMaintenance(),
      refetchContracts()
    ]);
    setRefreshing(false);
  }, [refetchProperties, refetchBids, refetchMaintenance, refetchContracts]);

  // Filter properties by search
  const filteredProperties = (availableProperties?.data || []).filter(property => {
    const query = searchQuery.toLowerCase();
    return property.title?.toLowerCase().includes(query) ||
           property.address?.toLowerCase().includes(query) ||
           property.city?.toLowerCase().includes(query);
  });

  // Calculate statistics
  const stats = {
    availableProperties: availableProperties?.data?.length || 0,
    myBids: myBids?.data?.length || 0,
    activeBids: myBids?.data?.filter(bid => ['pending', 'manager_approved'].includes(bid.bid_status))?.length || 0,
    maintenanceRequests: maintenanceRequests?.data?.length || 0,
    activeContracts: myContracts?.data?.filter(contract => contract.status === 'active')?.length || 0
  };

  const handlePlaceBid = (property: any) => {
    router.push({
      pathname: '/tenant/place-bid',
      params: { propertyId: property.id }
    });
  };

  const handleViewProperty = (property: any) => {
    router.push({
      pathname: '/tenant/property-details',
      params: { propertyId: property.id }
    });
  };

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderPropertyCard = (property: any) => {
    const hasMyBid = myBids?.data?.some(bid => bid.property_id === property.id);
    const myBidStatus = myBids?.data?.find(bid => bid.property_id === property.id)?.bid_status;

    return (
      <Card key={property.id} style={[styles.propertyCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.propertyHeader}>
            <View style={styles.propertyInfo}>
              <Text style={[styles.propertyTitle, { color: theme.colors.onSurface }]}>
                {property.title}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.locationText, { color: theme.colors.onSurfaceVariant }]}>
                  {property.address}, {property.city}
                </Text>
              </View>
            </View>
            <Text style={[styles.priceText, { color: theme.colors.primary }]}>
              {formatPrice(property.price)}
            </Text>
          </View>

          <View style={styles.propertyFeatures}>
            {property.bedrooms && (
              <View style={styles.featureItem}>
                <Bed size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                  {property.bedrooms} غرف
                </Text>
              </View>
            )}
            {property.bathrooms && (
              <View style={styles.featureItem}>
                <Bath size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                  {property.bathrooms} حمام
                </Text>
              </View>
            )}
            {property.parking_spaces > 0 && (
              <View style={styles.featureItem}>
                <Car size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                  {property.parking_spaces} مواقف
                </Text>
              </View>
            )}
          </View>

          {hasMyBid && (
            <View style={styles.bidStatus}>
              <Chip 
                mode="outlined" 
                style={{ backgroundColor: getStatusColor(myBidStatus) + '20' }}
                textStyle={{ color: getStatusColor(myBidStatus) }}
              >
                عرضي: {getStatusText(myBidStatus)}
              </Chip>
            </View>
          )}

          <View style={styles.propertyActions}>
            <Button 
              mode="outlined" 
              onPress={() => handleViewProperty(property)}
              style={styles.actionButton}
            >
              <Eye size={16} />
              عرض التفاصيل
            </Button>
            {!hasMyBid && (
              <Button 
                mode="contained" 
                onPress={() => handlePlaceBid(property)}
                style={styles.actionButton}
              >
                <HandCoins size={16} />
                تقديم عرض
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderBidCard = (bid: any) => (
    <Card key={bid.id} style={[styles.bidCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.bidHeader}>
          <View style={styles.bidInfo}>
            <Text style={[styles.bidPropertyTitle, { color: theme.colors.onSurface }]}>
              {bid.property?.title}
            </Text>
            <Text style={[styles.bidAmount, { color: theme.colors.primary }]}>
              {formatPrice(bid.bid_amount)}
            </Text>
          </View>
          <Chip 
            mode="flat" 
            style={{ backgroundColor: getStatusColor(bid.bid_status) + '20' }}
            textStyle={{ color: getStatusColor(bid.bid_status) }}
          >
            {getStatusText(bid.bid_status)}
          </Chip>
        </View>

        <View style={styles.bidDetails}>
          <View style={styles.bidDetailRow}>
            <Calendar size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.bidDetailText, { color: theme.colors.onSurfaceVariant }]}>
              تاريخ العرض: {new Date(bid.created_at).toLocaleDateString('ar-SA')}
            </Text>
          </View>
          {bid.rental_duration_months && (
            <View style={styles.bidDetailRow}>
              <Clock size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.bidDetailText, { color: theme.colors.onSurfaceVariant }]}>
                مدة الإيجار: {bid.rental_duration_months} شهر
              </Text>
            </View>
          )}
          {bid.message && (
            <Text style={[styles.bidMessage, { color: theme.colors.onSurfaceVariant }]}>
              "{bid.message}"
            </Text>
          )}
        </View>

        {['pending', 'manager_approved'].includes(bid.bid_status) && (
          <View style={styles.bidActions}>
            <Button 
              mode="text" 
              textColor={theme.colors.error}
              onPress={() => handleWithdrawBid(bid.id)}
            >
              سحب العرض
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const handleWithdrawBid = async (bidId: string) => {
    Alert.alert(
      'سحب العرض',
      'هل أنت متأكد من رغبتك في سحب هذا العرض؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'سحب',
          style: 'destructive',
          onPress: async () => {
            try {
              await bidsApi.withdraw(bidId);
              await refetchBids();
              Alert.alert('تم', 'تم سحب العرض بنجاح');
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ أثناء سحب العرض');
            }
          }
        }
      ]
    );
  };

  const renderMaintenanceCard = (request: any) => (
    <Card key={request.id} style={[styles.maintenanceCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.maintenanceHeader}>
          <View style={styles.maintenanceInfo}>
            <Text style={[styles.maintenanceTitle, { color: theme.colors.onSurface }]}>
              {request.title}
            </Text>
            <Text style={[styles.maintenanceProperty, { color: theme.colors.onSurfaceVariant }]}>
              {request.property?.title}
            </Text>
          </View>
          <Chip 
            mode="flat" 
            style={{ backgroundColor: getPriorityColor(request.priority) + '20' }}
            textStyle={{ color: getPriorityColor(request.priority) }}
          >
            {getPriorityText(request.priority)}
          </Chip>
        </View>

        <Text style={[styles.maintenanceDescription, { color: theme.colors.onSurfaceVariant }]}>
          {request.description}
        </Text>

        <View style={styles.maintenanceFooter}>
          <Text style={[styles.maintenanceDate, { color: theme.colors.onSurfaceVariant }]}>
            {new Date(request.created_at).toLocaleDateString('ar-SA')}
          </Text>
          <Chip 
            mode="outlined" 
            style={{ backgroundColor: getMaintenanceStatusColor(request.status) + '20' }}
            textStyle={{ color: getMaintenanceStatusColor(request.status) }}
          >
            {getMaintenanceStatusText(request.status)}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return priority;
    }
  };

  const getMaintenanceStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'approved': return '#2196F3';
      case 'in_progress': return '#673AB7';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getMaintenanceStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'approved': return 'موافق عليه';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="لوحة المستأجر" 
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
            الملخص
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="عقود نشطة"
              value={stats.activeContracts.toString()}
              color="#4CAF50"
              loading={contractsLoading}
            />
            <StatCard
              title="عروضي النشطة"
              value={stats.activeBids.toString()}
              color="#2196F3"
              loading={bidsLoading}
            />
            <StatCard
              title="عقارات متاحة"
              value={stats.availableProperties.toString()}
              color={theme.colors.primary}
              loading={propertiesLoading}
            />
            <StatCard
              title="طلبات الصيانة"
              value={stats.maintenanceRequests.toString()}
              color="#FF9800"
              loading={maintenanceLoading}
            />
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabSection}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'browse' && { backgroundColor: theme.colors.primaryContainer }
              ]}
              onPress={() => setActiveTab('browse')}
            >
              <Home size={20} color={activeTab === 'browse' ? theme.colors.primary : theme.colors.onSurfaceVariant} />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'browse' ? theme.colors.primary : theme.colors.onSurfaceVariant }
              ]}>
                تصفح العقارات
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'mybids' && { backgroundColor: theme.colors.primaryContainer }
              ]}
              onPress={() => setActiveTab('mybids')}
            >
              <HandCoins size={20} color={activeTab === 'mybids' ? theme.colors.primary : theme.colors.onSurfaceVariant} />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'mybids' ? theme.colors.primary : theme.colors.onSurfaceVariant }
              ]}>
                عروضي
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'maintenance' && { backgroundColor: theme.colors.primaryContainer }
              ]}
              onPress={() => setActiveTab('maintenance')}
            >
              <Wrench size={20} color={activeTab === 'maintenance' ? theme.colors.primary : theme.colors.onSurfaceVariant} />
              <Text style={[
                styles.tabText,
                { color: activeTab === 'maintenance' ? theme.colors.primary : theme.colors.onSurfaceVariant }
              ]}>
                الصيانة
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Content */}
        {activeTab === 'browse' && (
          <View style={styles.tabContent}>
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

            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              العقارات المتاحة للإيجار ({filteredProperties.length})
            </Text>

            {propertiesLoading ? (
              <View style={[styles.loadingState, { backgroundColor: theme.colors.surface }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                  جاري تحميل العقارات...
                </Text>
              </View>
            ) : filteredProperties.length > 0 ? (
              filteredProperties.map(renderPropertyCard)
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
                <Home size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurface }]}>
                  لا توجد عقارات متاحة
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {searchQuery ? 'جرب البحث بكلمات أخرى' : 'لا توجد عقارات متاحة للإيجار حالياً'}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'mybids' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              عروضي ({myBids?.data?.length || 0})
            </Text>

            {bidsLoading ? (
              <View style={[styles.loadingState, { backgroundColor: theme.colors.surface }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                  جاري تحميل العروض...
                </Text>
              </View>
            ) : myBids?.data && myBids.data.length > 0 ? (
              myBids.data.map(renderBidCard)
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
                <HandCoins size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurface }]}>
                  لا توجد عروض
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  ابدأ بتصفح العقارات وتقديم عروض الإيجار
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'maintenance' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              طلبات الصيانة ({maintenanceRequests?.data?.length || 0})
            </Text>

            {maintenanceLoading ? (
              <View style={[styles.loadingState, { backgroundColor: theme.colors.surface }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                  جاري تحميل طلبات الصيانة...
                </Text>
              </View>
            ) : maintenanceRequests?.data && maintenanceRequests.data.length > 0 ? (
              maintenanceRequests.data.map(renderMaintenanceCard)
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
                <Wrench size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurface }]}>
                  لا توجد طلبات صيانة
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  عندما تحتاج إلى صيانة في العقار المستأجر، يمكنك تقديم طلب صيانة
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Maintenance Request FAB - only show when on maintenance tab and user has active contracts */}
      {activeTab === 'maintenance' && stats.activeContracts > 0 && (
        <FAB
          icon="wrench"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          size="medium"
          onPress={() => router.push('/maintenance/add')}
          label="طلب صيانة"
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
  tabSection: {
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabContent: {
    marginBottom: 24,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchbar: {
    borderRadius: 12,
    elevation: 2,
  },
  propertyCard: {
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '700',
  },
  propertyFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
  },
  bidStatus: {
    marginBottom: 12,
  },
  propertyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  bidCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bidInfo: {
    flex: 1,
    marginRight: 12,
  },
  bidPropertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 4,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  bidDetails: {
    marginBottom: 12,
  },
  bidDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bidDetailText: {
    fontSize: 14,
  },
  bidMessage: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'right',
  },
  bidActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  maintenanceCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  maintenanceInfo: {
    flex: 1,
    marginRight: 12,
  },
  maintenanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 4,
  },
  maintenanceProperty: {
    fontSize: 14,
  },
  maintenanceDescription: {
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 20,
  },
  maintenanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maintenanceDate: {
    fontSize: 12,
  },
  loadingState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
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
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 