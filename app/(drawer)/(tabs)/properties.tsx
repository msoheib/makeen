import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { propertiesApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { Property } from '@/lib/database.types';
import PropertyCard from '@/components/PropertyCard';
import { Building2, Plus } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';

export default function PropertiesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  
  // Fetch properties data
  const { data: properties, loading, error, refetch } = useApi(
    () => propertiesApi.getAll(),
    []
  );

  const { data: dashboardSummary, loading: summaryLoading } = useApi(
    () => propertiesApi.getDashboardSummary(),
    []
  );

  useEffect(() => {
    filterProperties();
  }, [properties, searchQuery]);

  const filterProperties = () => {
    if (!properties) {
      setFilteredProperties([]);
      return;
    }

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

  const stats = dashboardSummary ? [
    {
      title: 'Total Properties',
      value: dashboardSummary.total_properties?.toString() || '0',
      color: theme.colors.primary,
      icon: <Building2 size={20} color={theme.colors.primary} />,
    },
    {
      title: 'Available',
      value: dashboardSummary.available?.toString() || '0',
      color: theme.colors.secondary,
      icon: <Building2 size={20} color={theme.colors.secondary} />,
    },
    {
      title: 'Occupied',
      value: dashboardSummary.occupied?.toString() || '0',
      color: theme.colors.tertiary,
      icon: <Building2 size={20} color={theme.colors.tertiary} />,
    },
    {
      title: 'Maintenance',
      value: dashboardSummary.maintenance?.toString() || '0',
      color: theme.colors.error,
      icon: <Building2 size={20} color={theme.colors.error} />,
    },
  ] : [];

  if (loading) {
    return (
      <View style={styles.container}>
        <ModernHeader
          title="Properties"
          subtitle="Properties and units"
          variant="dark"
          showNotifications
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
          title="Properties"
          subtitle="Properties and units"
          variant="dark"
          showNotifications
        />
        <ModernCard style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading properties</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </ModernCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Properties"
        subtitle="Properties and units"
        variant="dark"
        showNotifications
      />

      {/* Stats Overview */}
      {!summaryLoading && dashboardSummary && (
        <View style={styles.statsSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={stats}
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
      )}
      
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
          refreshing={loading}
          onRefresh={refetch}
        />
      ) : (
        <ModernCard style={styles.emptyStateContainer}>
          <Plus size={48} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.emptyStateTitle}>No properties found</Text>
          <Text style={styles.emptyStateSubtitle}>
            {properties && properties.length > 0 
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.m,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    margin: spacing.m,
    padding: spacing.l,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.error,
    marginBottom: spacing.s,
  },
  errorSubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
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
    margin: spacing.m,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});