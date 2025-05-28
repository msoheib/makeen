import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Platform } from 'react-native';
import { Text, FAB, ActivityIndicator, Appbar, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing, shadows } from '@/lib/theme';
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
  
  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          setProperties(data);
          setFilteredProperties(data);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProperties();
  }, []);

  const handleFilter = (filters: {
    search: string;
    status: PropertyStatus[];
    propertyType: PropertyType[];
    location: string[];
  }) => {
    let filtered = [...properties];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        property => 
          property.title.toLowerCase().includes(searchLower) ||
          property.description?.toLowerCase().includes(searchLower) ||
          property.address.toLowerCase().includes(searchLower) ||
          property.city.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.status.length > 0) {
      filtered = filtered.filter(property => 
        filters.status.includes(property.status)
      );
    }
    
    if (filters.propertyType.length > 0) {
      filtered = filtered.filter(property => 
        filters.propertyType.includes(property.property_type)
      );
    }
    
    if (filters.location.length > 0) {
      filtered = filtered.filter(property => 
        filters.location.includes(property.city)
      );
    }
    
    setFilteredProperties(filtered);
  };

  const handlePropertyPress = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading properties...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Properties" />
      </Appbar.Header>
      
      <PropertyFilter onFilter={handleFilter} />
      
      {filteredProperties.length > 0 ? (
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
          <Text style={styles.emptyStateTitle}>No properties found</Text>
          <Text style={styles.emptyStateSubtitle}>
            {properties.length > 0 
              ? 'Try adjusting your filters to see more results' 
              : 'Add your first property to get started'}
          </Text>
        </Surface>
      )}
      
      <FAB
        icon="plus"
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