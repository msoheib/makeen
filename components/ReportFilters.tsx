import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, Button, Chip, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import DateRangePicker from './DateRangePicker';

interface ReportFiltersProps {
  onFiltersChange: (filters: ReportFilters) => void;
  initialFilters?: ReportFilters;
  availablePropertyTypes?: string[];
  availableCities?: string[];
  showAdvancedFilters?: boolean;
}

export interface ReportFilters {
  dateRange: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  propertyTypes: string[];
  cities: string[];
  neighborhoods: string[];
  paymentStatuses: string[];
  minAmount?: number;
  maxAmount?: number;
  includeSubProperties: boolean;
}

const DEFAULT_PROPERTY_TYPES = [
  'apartment',
  'villa', 
  'office',
  'retail',
  'warehouse'
];

const DEFAULT_PAYMENT_STATUSES = [
  'pending',
  'paid',
  'overdue'
];

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  onFiltersChange,
  initialFilters,
  availablePropertyTypes = DEFAULT_PROPERTY_TYPES,
  availableCities = [],
  showAdvancedFilters = false
}) => {
  const theme = useTheme();
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(),
      label: 'This Year'
    },
    propertyTypes: [],
    cities: [],
    neighborhoods: [],
    paymentStatuses: [],
    includeSubProperties: true,
    ...initialFilters
  });

  const [showAdvanced, setShowAdvanced] = useState(showAdvancedFilters);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const togglePropertyType = (propertyType: string) => {
    setFilters(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(propertyType)
        ? prev.propertyTypes.filter(t => t !== propertyType)
        : [...prev.propertyTypes, propertyType]
    }));
  };

  const toggleCity = (city: string) => {
    setFilters(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city]
    }));
  };

  const togglePaymentStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      paymentStatuses: prev.paymentStatuses.includes(status)
        ? prev.paymentStatuses.filter(s => s !== status)
        : [...prev.paymentStatuses, status]
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: {
        startDate: new Date(new Date().getFullYear(), 0, 1),
        endDate: new Date(),
        label: 'This Year'
      },
      propertyTypes: [],
      cities: [],
      neighborhoods: [],
      paymentStatuses: [],
      includeSubProperties: true
    });
  };

  const hasActiveFilters = () => {
    return filters.propertyTypes.length > 0 ||
           filters.cities.length > 0 ||
           filters.neighborhoods.length > 0 ||
           filters.paymentStatuses.length > 0 ||
           filters.minAmount !== undefined ||
           filters.maxAmount !== undefined;
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialIcons name="filter-list" size={24} color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.title}>Report Filters</Text>
          {hasActiveFilters() && (
            <Chip 
              mode="outlined" 
              compact 
              style={styles.activeChip}
              textStyle={{ color: theme.colors.primary }}
            >
              Active
            </Chip>
          )}
        </View>

        {/* Date Range Filter */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Date Range</Text>
          <DateRangePicker
            selectedRange={filters.dateRange}
            onRangeChange={(dateRange) => updateFilter('dateRange', dateRange)}
          />
        </View>

        <Divider style={styles.divider} />

        {/* Property Types Filter */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Property Types</Text>
          <View style={styles.chipContainer}>
            {availablePropertyTypes.map(type => (
              <Chip
                key={type}
                mode={filters.propertyTypes.includes(type) ? 'flat' : 'outlined'}
                selected={filters.propertyTypes.includes(type)}
                onPress={() => togglePropertyType(type)}
                style={styles.chip}
                textStyle={{
                  color: filters.propertyTypes.includes(type) 
                    ? theme.colors.onPrimary 
                    : theme.colors.onSurface
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Chip>
            ))}
          </View>
        </View>

        {/* Cities Filter */}
        {availableCities.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>Cities</Text>
              <View style={styles.chipContainer}>
                {availableCities.map(city => (
                  <Chip
                    key={city}
                    mode={filters.cities.includes(city) ? 'flat' : 'outlined'}
                    selected={filters.cities.includes(city)}
                    onPress={() => toggleCity(city)}
                    style={styles.chip}
                    textStyle={{
                      color: filters.cities.includes(city) 
                        ? theme.colors.onPrimary 
                        : theme.colors.onSurface
                    }}
                  >
                    {city}
                  </Chip>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Advanced Filters Toggle */}
        <View style={styles.advancedToggle}>
          <Button
            mode="text"
            onPress={() => setShowAdvanced(!showAdvanced)}
            icon={showAdvanced ? 'chevron-up' : 'chevron-down'}
          >
            {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </Button>
        </View>

        {/* Advanced Filters */}
        {showAdvanced && (
          <>
            <Divider style={styles.divider} />
            
            {/* Payment Status Filter */}
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>Payment Status</Text>
              <View style={styles.chipContainer}>
                {DEFAULT_PAYMENT_STATUSES.map(status => (
                  <Chip
                    key={status}
                    mode={filters.paymentStatuses.includes(status) ? 'flat' : 'outlined'}
                    selected={filters.paymentStatuses.includes(status)}
                    onPress={() => togglePaymentStatus(status)}
                    style={styles.chip}
                    textStyle={{
                      color: filters.paymentStatuses.includes(status) 
                        ? theme.colors.onPrimary 
                        : theme.colors.onSurface
                    }}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Amount Range Filter */}
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>Amount Range (SAR)</Text>
              <View style={styles.amountContainer}>
                <View style={styles.amountInput}>
                  <Text variant="bodySmall">Min</Text>
                  <Text variant="bodyMedium">
                    {filters.minAmount ? `${filters.minAmount.toLocaleString()}` : 'Any'}
                  </Text>
                </View>
                <View style={styles.amountInput}>
                  <Text variant="bodySmall">Max</Text>
                  <Text variant="bodyMedium">
                    {filters.maxAmount ? `${filters.maxAmount.toLocaleString()}` : 'Any'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Sub-Properties Toggle */}
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>Include Sub-Properties</Text>
              <Chip
                mode={filters.includeSubProperties ? 'flat' : 'outlined'}
                selected={filters.includeSubProperties}
                onPress={() => updateFilter('includeSubProperties', !filters.includeSubProperties)}
                style={styles.chip}
                textStyle={{
                  color: filters.includeSubProperties 
                    ? theme.colors.onPrimary 
                    : theme.colors.onSurface
                }}
              >
                {filters.includeSubProperties ? 'Yes' : 'No'}
              </Chip>
            </View>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={clearFilters}
            style={styles.actionButton}
            disabled={!hasActiveFilters()}
          >
            Clear Filters
          </Button>
          <Button
            mode="contained"
            onPress={() => onFiltersChange(filters)}
            style={styles.actionButton}
          >
            Apply Filters
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginLeft: 8,
    flex: 1,
  },
  activeChip: {
    marginLeft: 'auto',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  advancedToggle: {
    alignItems: 'center',
    marginVertical: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  amountInput: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
});
