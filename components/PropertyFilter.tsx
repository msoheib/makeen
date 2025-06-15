import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Chip, Searchbar, Surface, Text } from 'react-native-paper';
import { Filter, MapPin, X } from 'lucide-react-native';
import { PropertyStatus, PropertyType } from '@/lib/types';
import { theme, spacing } from '@/lib/theme';

interface PropertyFilterProps {
  onFilter: (filters: {
    search: string;
    status: PropertyStatus[];
    propertyType: PropertyType[];
    location: string[];
  }) => void;
}

export default function PropertyFilter({ onFilter }: PropertyFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PropertyStatus[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<PropertyType[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const toggleStatus = (status: PropertyStatus) => {
    if (selectedStatus.includes(status)) {
      setSelectedStatus(selectedStatus.filter((s) => s !== status));
    } else {
      setSelectedStatus([...selectedStatus, status]);
    }
  };

  const toggleType = (type: PropertyType) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const toggleLocation = (location: string) => {
    if (selectedLocations.includes(location)) {
      setSelectedLocations(selectedLocations.filter((l) => l !== location));
    } else {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedStatus([]);
    setSelectedTypes([]);
    setSelectedLocations([]);
    onFilter({
      search: '',
      status: [],
      propertyType: [],
      location: [],
    });
  };

  const applyFilters = () => {
    onFilter({
      search,
      status: selectedStatus,
      propertyType: selectedTypes,
      location: selectedLocations,
    });
    setIsExpanded(false);
  };

  // TODO: Load locations from database/API
  const locations = ['الرياض', 'جدة', 'الدمام', 'المدينة المنورة', 'مكة المكرمة'];

  return (
    <Surface style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search properties..."
          onChangeText={setSearch}
          value={search}
          style={styles.searchbar}
          iconColor={theme.colors.onSurfaceVariant}
          clearIcon={search ? 'close' : ''}
        />
        <Button
          mode="contained"
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.filterButton}
          contentStyle={{ height: 40 }}
          icon={({ size, color }) => (
            <Filter size={size} color={color} />
          )}
        >
          Filter
        </Button>
      </View>

      {isExpanded && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipsRow}>
                <Chip
                  selected={selectedStatus.includes('available')}
                  onPress={() => toggleStatus('available')}
                  style={[
                    styles.chip,
                    selectedStatus.includes('available') && {
                      backgroundColor: `${theme.colors.success}20`,
                    },
                  ]}
                >
                  Available
                </Chip>
                <Chip
                  selected={selectedStatus.includes('rented')}
                  onPress={() => toggleStatus('rented')}
                  style={[
                    styles.chip,
                    selectedStatus.includes('rented') && {
                      backgroundColor: `${theme.colors.primary}20`,
                    },
                  ]}
                >
                  Rented
                </Chip>
                <Chip
                  selected={selectedStatus.includes('maintenance')}
                  onPress={() => toggleStatus('maintenance')}
                  style={[
                    styles.chip,
                    selectedStatus.includes('maintenance') && {
                      backgroundColor: `${theme.colors.warning}20`,
                    },
                  ]}
                >
                  Maintenance
                </Chip>
                <Chip
                  selected={selectedStatus.includes('reserved')}
                  onPress={() => toggleStatus('reserved')}
                  style={[
                    styles.chip,
                    selectedStatus.includes('reserved') && {
                      backgroundColor: `${theme.colors.tertiary}20`,
                    },
                  ]}
                >
                  Reserved
                </Chip>
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Property Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipsRow}>
                <Chip
                  selected={selectedTypes.includes('apartment')}
                  onPress={() => toggleType('apartment')}
                  style={styles.chip}
                >
                  Apartment
                </Chip>
                <Chip
                  selected={selectedTypes.includes('villa')}
                  onPress={() => toggleType('villa')}
                  style={styles.chip}
                >
                  Villa
                </Chip>
                <Chip
                  selected={selectedTypes.includes('office')}
                  onPress={() => toggleType('office')}
                  style={styles.chip}
                >
                  Office
                </Chip>
                <Chip
                  selected={selectedTypes.includes('retail')}
                  onPress={() => toggleType('retail')}
                  style={styles.chip}
                >
                  Retail
                </Chip>
                <Chip
                  selected={selectedTypes.includes('warehouse')}
                  onPress={() => toggleType('warehouse')}
                  style={styles.chip}
                >
                  Warehouse
                </Chip>
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Location</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipsRow}>
                {locations.map((location) => (
                  <Chip
                    key={location}
                    selected={selectedLocations.includes(location)}
                    onPress={() => toggleLocation(location)}
                    style={styles.chip}
                    icon={({ size, color }) => (
                      <MapPin size={size - 2} color={color} />
                    )}
                  >
                    {location}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.buttonsContainer}>
            <Button
              mode="outlined"
              onPress={clearFilters}
              style={styles.clearButton}
              icon={({ size, color }) => (
                <X size={size} color={color} />
              )}
            >
              Clear All
            </Button>
            <Button
              mode="contained"
              onPress={applyFilters}
              style={styles.applyButton}
            >
              Apply Filters
            </Button>
          </View>
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
    marginBottom: spacing.m,
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchbar: {
    flex: 1,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    height: 40,
  },
  filterButton: {
    marginLeft: spacing.s,
    borderRadius: 8,
    height: 40,
  },
  filtersContainer: {
    marginTop: spacing.m,
  },
  filterSection: {
    marginBottom: spacing.m,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.s,
    color: theme.colors.onSurface,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: spacing.s,
    marginBottom: spacing.s,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.s,
  },
  clearButton: {
    flex: 1,
    marginRight: spacing.s,
  },
  applyButton: {
    flex: 1,
    marginLeft: spacing.s,
  },
});