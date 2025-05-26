import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Platform } from 'react-native';
import { Text, FAB, ActivityIndicator, Appbar, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing, shadows } from '@/lib/theme';
import { Plus, Search, Building2 } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import PropertyCard from '@/components/PropertyCard';
import PropertyFilter from '@/components/PropertyFilter';
import { Property, PropertyStatus, PropertyType } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function PropertiesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  
  // Fetch properties from Supabase
  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*');
          
        if (error) throw error;
        
        if (data) {
          setProperties(data as Property[]);
          setFilteredProperties(data as Property[]);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProperties();
  }, []);

  // For demo purposes, use mock data if Supabase data not available
  useEffect(() => {
    if (properties.length === 0 && !loading) {
      const mockProperties = [
        {
          id: '1',
          title: 'Modern Apartment in Downtown',
          description: 'A beautiful, modern apartment with city views located in the heart of downtown.',
          property_type: 'apartment',
          status: 'available',
          address: '123 Main St, Apt 4B',
          city: 'New York',
          country: 'USA',
          neighborhood: 'Downtown',
          area_sqm: 120,
          bedrooms: 2,
          bathrooms: 2,
          price: 2500,
          payment_method: 'cash',
          owner_id: '1',
          created_at: '2023-01-15T12:00:00Z',
          updated_at: '2023-01-15T12:00:00Z',
          images: ['https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg'],
        },
        {
          id: '2',
          title: 'Luxury Beachfront Villa',
          description: 'An exquisite villa with direct beach access and panoramic ocean views.',
          property_type: 'villa',
          status: 'rented',
          address: '456 Ocean Dr',
          city: 'Miami',
          country: 'USA',
          neighborhood: 'South Beach',
          area_sqm: 350,
          bedrooms: 4,
          bathrooms: 3,
          price: 5000,
          payment_method: 'installment',
          owner_id: '2',
          created_at: '2023-02-20T10:00:00Z',
          updated_at: '2023-02-20T10:00:00Z',
          images: ['https://images.pexels.com/photos/53610/large-home-residential-house-architecture-53610.jpeg'],
        },
        {
          id: '3',
          title: 'Cozy Studio in Trendy Neighborhood',
          description: 'A charming studio apartment in a vibrant, trendy neighborhood with cafes and shops.',
          property_type: 'apartment',
          status: 'available',
          address: '789 Trendy St',
          city: 'Chicago',
          country: 'USA',
          neighborhood: 'Wicker Park',
          area_sqm: 65,
          bedrooms: 0,
          bathrooms: 1,
          price: 1500,
          payment_method: 'cash',
          owner_id: '3',
          created_at: '2023-03-05T15:30:00Z',
          updated_at: '2023-03-05T15:30:00Z',
          images: ['https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg'],
        },
        {
          id: '4',
          title: 'Modern Office Space',
          description: 'A contemporary office space in a prime business district with amenities.',
          property_type: 'office',
          status: 'available',
          address: '101 Business Blvd',
          city: 'Los Angeles',
          country: 'USA',
          neighborhood: 'Financial District',
          area_sqm: 200,
          price: 3500,
          payment_method: 'cash',
          owner_id: '4',
          created_at: '2023-04-10T09:45:00Z',
          updated_at: '2023-04-10T09:45:00Z',
          images: ['https://images.pexels.com/photos/3504154/pexels-photo-3504154.jpeg'],
        },
        {
          id: '5',
          title: 'Retail Space in Shopping Center',
          description: 'A prime retail space in a popular shopping center with high foot traffic.',
          property_type: 'retail',
          status: 'reserved',
          address: '555 Shopping Mall Dr',
          city: 'Seattle',
          country: 'USA',
          neighborhood: 'Downtown',
          area_sqm: 150,
          price: 4000,
          payment_method: 'installment',
          owner_id: '5',
          created_at: '2023-05-20T13:15:00Z',
          updated_at: '2023-05-20T13:15:00Z',
          images: ['https://images.pexels.com/photos/264507/pexels-photo-264507.jpeg'],
        },
      ];
      
      setProperties(mockProperties);
      setFilteredProperties(mockProperties);
    }
  }, [properties, loading]);

  // Handle filter changes
  const handleFilter = (filters: {
    search: string;
    status: PropertyStatus[];
    propertyType: PropertyType[];
    location: string[];
  }) => {
    let filtered = [...properties];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        property => 
          property.title.toLowerCase().includes(searchLower) ||
          property.description.toLowerCase().includes(searchLower) ||
          property.address.toLowerCase().includes(searchLower) ||
          property.city.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(property => 
        filters.status.includes(property.status)
      );
    }
    
    // Apply property type filter
    if (filters.propertyType.length > 0) {
      filtered = filtered.filter(property => 
        filters.propertyType.includes(property.property_type)
      );
    }
    
    // Apply location filter
    if (filters.location.length > 0) {
      filtered = filtered.filter(property => 
        filters.location.includes(property.city)
      );
    }
    
    setFilteredProperties(filtered);
  };

  // Navigate to property details
  const handlePropertyPress = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Properties" />
        <Appbar.Action 
          icon={({ size, color }) => <Search size={size} color={color} />} 
          onPress={() => {}} 
        />
      </Appbar.Header>
      
      <PropertyFilter onFilter={handleFilter} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      ) : filteredProperties.length > 0 ? (
        <FlatList
          data={filteredProperties}
          renderItem={({ item }) => (
            <PropertyCard 
              property={item} 
              onPress={() => handlePropertyPress(item.id)}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Surface style={styles.emptyStateContainer}>
          <Building2 size={64} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.emptyStateTitle}>No properties found</Text>
          <Text style={styles.emptyStateSubtitle}>
            {properties.length > 0 
              ? 'Try adjusting your filters to see more results' 
              : 'Add your first property to get started'}
          </Text>
        </Surface>
      )}
      
      <FAB
        icon={({ size, color }) => <Plus size={size} color={color} />}
        style={styles.fab}
        onPress={() => router.push('/properties/add')}
        label="Add Property"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.m,
    color: theme.colors.onSurfaceVariant,
  },
  listContent: {
    padding: spacing.m,
    paddingBottom: spacing.xxl + 64, // Extra padding for FAB
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    margin: spacing.l,
    borderRadius: 12,
    ...shadows.medium,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: spacing.l,
    marginBottom: spacing.s,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});