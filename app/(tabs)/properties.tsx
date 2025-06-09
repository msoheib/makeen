import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import PropertyCard from '@/components/PropertyCard';
import { Property, PropertyStatus, PropertyType } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { Building2, Plus } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';

export default function PropertiesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    rented: 0,
    maintenance: 0,
  });
  
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
          
          // Calculate stats
          const available = data.filter(p => p.status === 'available').length;
          const rented = data.filter(p => p.status === 'rented').length;
          const maintenance = data.filter(p => p.status === 'maintenance').length;
          
          setStats({
            total: data.length,
            available,
            rented,
            maintenance,
          });
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchQuery]);

  const filterProperties = () => {
    let filtered = [...properties];
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        property => 
          property.title.toLowerCase().includes(searchLower) ||
          property.description?.toLowerCase().includes(searchLower) ||
          property.address.toLowerCase().includes(searchLower) ||
          property.city.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredProperties(filtered);
  };

  const handlePropertyPress = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Organisation"
        subtitle="Manage your properties"
        showLogo={true}
        onNotificationPress={() => router.push('/notifications')}
        onMenuPress={() => router.push('/menu')}
      />

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            {
              title: 'Total Properties',
              value: stats.total.toString(),
              color: theme.colors.primary,
              icon: <Building2 size={20} color={theme.colors.primary} />,
            },
            {
              title: 'Available',
              value: stats.available.toString(),
              color: theme.colors.success,
              icon: <Building2 size={20} color={theme.colors.success} />,
            },
            {
              title: 'Rented',
              value: stats.rented.toString(),
              color: theme.colors.secondary,
              icon: <Building2 size={20} color={theme.colors.secondary} />,
            },
            {
              title: 'Maintenance',
              value: stats.maintenance.toString(),
              color: theme.colors.warning,
              icon: <Building2 size={20} color={theme.colors.warning} />,
            },
          ]}
          renderItem={({ item }) => (
            <StatCard
              title={item.title}
              value={item.value}
              color={item.color}
              icon={item.icon}
            />
          )}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.statsContainer}
        />
      </View>
      
      {/* Search */}
      <View style={styles.filtersSection}>
        <Searchbar
          placeholder="Search properties..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </View>
      
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
        <ModernCard style={styles.emptyStateContainer}>
          <Plus size={48} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.emptyStateTitle}>No properties found</Text>
          <Text style={styles.emptyStateSubtitle}>
            {properties.length > 0 
              ? 'Try adjusting your search to see more results' 
              : 'Add your first property to get started'}
          </Text>
        </ModernCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsSection: {
    marginBottom: spacing.m,
  },
  statsContainer: {
    paddingHorizontal: spacing.m,
  },
  filtersSection: {
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  searchbar: {
    backgroundColor: theme.colors.surface,
  },
  listContent: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xxxl,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    margin: spacing.l,
    borderRadius: 12,
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
});