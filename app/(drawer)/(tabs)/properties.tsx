import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, SafeAreaView } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { Building2, Home, Search, Plus } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import StatCard from '@/components/StatCard';

// Static property data to prevent loading issues
const staticProperties = [
  {
    id: '1',
    title: 'فيلا فاخرة في الرياض',
    description: 'فيلا حديثة مع حديقة ومسبح',
    address: 'الملقا، الرياض',
    city: 'الرياض',
    price: 1200000,
    property_type: 'villa',
    status: 'available',
    bedrooms: 5,
    bathrooms: 4,
    area_sqm: 400,
    images: []
  },
  {
    id: '2', 
    title: 'شقة عصرية في جدة',
    description: 'شقة مطلة على البحر',
    address: 'الكورنيش، جدة',
    city: 'جدة',
    price: 850000,
    property_type: 'apartment',
    status: 'rented',
    bedrooms: 3,
    bathrooms: 2,
    area_sqm: 180,
    images: []
  },
  {
    id: '3',
    title: 'مكتب تجاري في الدمام',
    description: 'مكتب في المنطقة التجارية',
    address: 'الأعمال، الدمام',
    city: 'الدمام',
    price: 1500000,
    property_type: 'office',
    status: 'available',
    bedrooms: 0,
    bathrooms: 2,
    area_sqm: 250,
    images: []
  }
];

// Static stats
const staticStats = {
  total: '٣',
  available: '٢',
  rented: '١',
  maintenance: '٠'
};

export default function PropertiesScreen() {
  const router = useRouter();
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [searchQuery, setSearchQuery] = useState('');

  // Filter properties based on search
  const filteredProperties = staticProperties.filter(property =>
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Text style={[styles.propertyPrice, { color: theme.colors.primary }]}>
          {item.price.toLocaleString('ar-SA')} ريال
        </Text>
        <View style={[styles.typeTag, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.typeText, { color: theme.colors.onSurfaceVariant }]}>
            {item.property_type === 'villa' ? 'فيلا' : 
             item.property_type === 'apartment' ? 'شقة' : 'مكتب'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="العقارات" 
        showNotifications={true}
        showMenu={true}
        variant="dark"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            إحصائيات العقارات
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCardWrapper}>
              <StatCard
                title="إجمالي العقارات"
                value={staticStats.total}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.statCardWrapper}>
              <StatCard
                title="عقارات متاحة"
                value={staticStats.available}
                color="#4CAF50"
              />
            </View>
            <View style={styles.statCardWrapper}>
              <StatCard
                title="عقارات مؤجرة"
                value={staticStats.rented}
                color={theme.colors.secondary}
              />
            </View>
            <View style={styles.statCardWrapper}>
              <StatCard
                title="تحت الصيانة"
                value={staticStats.maintenance}
                color="#F44336"
              />
            </View>
          </View>
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
            قائمة العقارات ({filteredProperties.length})
          </Text>
          
          {filteredProperties.length > 0 ? (
            <FlatList
              data={filteredProperties}
              renderItem={renderProperty}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
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
          )}
        </View>
      </ScrollView>
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
});