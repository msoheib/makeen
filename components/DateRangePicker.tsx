import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Button } from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import { Calendar, Clock, Filter } from 'lucide-react-native';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface DateRangePickerProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  onApply?: () => void;
  onClear?: () => void;
}

const QUICK_FILTERS: DateRange[] = [
  {
    startDate: new Date(new Date().setHours(0, 0, 0, 0)),
    endDate: new Date(new Date().setHours(23, 59, 59, 999)),
    label: 'Today'
  },
  {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    label: 'This Month'
  },
  {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    label: 'Last Month'
  },
  {
    startDate: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1),
    endDate: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3 + 3, 0),
    label: 'This Quarter'
  },
  {
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(new Date().getFullYear(), 11, 31),
    label: 'This Year'
  },
  {
    startDate: new Date(new Date().getFullYear() - 1, 0, 1),
    endDate: new Date(new Date().getFullYear() - 1, 11, 31),
    label: 'Last Year'
  }
];

export default function DateRangePicker({
  selectedRange,
  onRangeChange,
  onApply,
  onClear
}: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isRangeSelected = (range: DateRange) => {
    return (
      selectedRange.startDate.getTime() === range.startDate.getTime() &&
      selectedRange.endDate.getTime() === range.endDate.getTime()
    );
  };

  const handleQuickFilterSelect = (range: DateRange) => {
    onRangeChange(range);
    if (onApply) {
      onApply();
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Filter size={20} color={theme.colors.primary} />
        <Text style={styles.title}>Date Range</Text>
      </View>

      {/* Current Selection Display */}
      <View style={styles.currentSelection}>
        <View style={styles.dateDisplay}>
          <Calendar size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.dateText}>
            {formatDate(selectedRange.startDate)} - {formatDate(selectedRange.endDate)}
          </Text>
        </View>
        {selectedRange.label && (
          <Chip 
            mode="outlined" 
            style={styles.labelChip}
            textStyle={styles.chipText}
          >
            {selectedRange.label}
          </Chip>
        )}
      </View>

      {/* Quick Filters */}
      <View style={styles.quickFilters}>
        <Text style={styles.sectionTitle}>Quick Filters</Text>
        <View style={styles.filtersGrid}>
          {QUICK_FILTERS.map((range, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quickFilterButton,
                isRangeSelected(range) && styles.selectedFilter
              ]}
              onPress={() => handleQuickFilterSelect(range)}
            >
              <Text
                style={[
                  styles.quickFilterText,
                  isRangeSelected(range) && styles.selectedFilterText
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {onClear && (
          <Button
            mode="outlined"
            onPress={onClear}
            style={styles.actionButton}
            labelStyle={styles.clearButtonText}
          >
            Clear Filter
          </Button>
        )}
        {onApply && (
          <Button
            mode="contained"
            onPress={onApply}
            style={styles.actionButton}
            labelStyle={styles.applyButtonText}
          >
            Apply Filter
          </Button>
        )}
      </View>
    </Card>
  );
}

// Helper function to get default date ranges
export const getDefaultDateRange = (): DateRange => {
  return QUICK_FILTERS[1]; // This Month
};

export const getLastMonthRange = (): DateRange => {
  return QUICK_FILTERS[2]; // Last Month
};

export const getThisYearRange = (): DateRange => {
  return QUICK_FILTERS[4]; // This Year
};

const styles = StyleSheet.create({
  container: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginLeft: spacing.sm,
  },
  currentSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  labelChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  chipText: {
    fontSize: 12,
    color: theme.colors.onPrimaryContainer,
  },
  quickFilters: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickFilterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedFilter: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  quickFilterText: {
    fontSize: 12,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  selectedFilterText: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  clearButtonText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  applyButtonText: {
    fontSize: 14,
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
}); 