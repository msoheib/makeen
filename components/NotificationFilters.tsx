import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform 
} from 'react-native';
import { 
  Text, 
  Button, 
  Chip, 
  IconButton, 
  Divider,
  Switch,
  Portal,
  Modal,
  DatePickerModal
} from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import { 
  NotificationCategory, 
  NotificationPriority, 
  CategoryFilter,
  CATEGORY_DEFINITIONS,
  notificationCategoryService 
} from '@/lib/notificationCategories';
import { 
  FilterPreset,
  notificationFilterEngine,
  SORT_OPTIONS,
  SortOption
} from '@/lib/notificationFilters';
import { 
  Filter, 
  X, 
  ChevronDown, 
  Calendar, 
  Star,
  Trash2,
  Plus,
  RotateCcw
} from 'lucide-react-native';

export interface NotificationFiltersProps {
  visible: boolean;
  onClose: () => void;
  onFilterChange: (filter: CategoryFilter) => void;
  onSortChange: (sortBy: SortOption, sortOrder: 'asc' | 'desc') => void;
  currentFilter: CategoryFilter;
  currentSort: { sortBy: SortOption; sortOrder: 'asc' | 'desc' };
}

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  visible,
  onClose,
  onFilterChange,
  onSortChange,
  currentFilter,
  currentSort
}) => {
  const [localFilter, setLocalFilter] = useState<CategoryFilter>(currentFilter);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [showNewPreset, setShowNewPreset] = useState(false);

  useEffect(() => {
    setLocalFilter(currentFilter);
    setPresets(notificationFilterEngine.getState().presets);
  }, [currentFilter, visible]);

  const handleCategoryToggle = (category: NotificationCategory) => {
    const newCategories = localFilter.categories.includes(category)
      ? localFilter.categories.filter(c => c !== category)
      : [...localFilter.categories, category];
    
    setLocalFilter({ ...localFilter, categories: newCategories });
  };

  const handlePriorityToggle = (priority: NotificationPriority) => {
    const newPriorities = localFilter.priorities.includes(priority)
      ? localFilter.priorities.filter(p => p !== priority)
      : [...localFilter.priorities, priority];
    
    setLocalFilter({ ...localFilter, priorities: newPriorities });
  };

  const handleDateRangeChange = (type: 'start' | 'end', date: Date) => {
    setLocalFilter({
      ...localFilter,
      dateRange: {
        start: type === 'start' ? date : localFilter.dateRange?.start || new Date(),
        end: type === 'end' ? date : localFilter.dateRange?.end || new Date()
      }
    });
    setShowDatePicker(null);
  };

  const handleClearDateRange = () => {
    setLocalFilter({ ...localFilter, dateRange: undefined });
  };

  const handleReadStatusChange = (status: 'all' | 'read' | 'unread') => {
    setLocalFilter({ ...localFilter, readStatus: status });
  };

  const handleApplyFilter = () => {
    onFilterChange(localFilter);
    onClose();
  };

  const handleClearFilter = () => {
    const defaultFilter = notificationCategoryService.createDefaultFilter();
    setLocalFilter(defaultFilter);
    onFilterChange(defaultFilter);
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    setLocalFilter(preset.filter);
    onFilterChange(preset.filter);
    notificationFilterEngine.applyPreset(preset.id);
    setShowPresets(false);
  };

  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      notificationFilterEngine.addPreset(
        newPresetName.trim(),
        'Custom filter preset',
        localFilter
      );
      setNewPresetName('');
      setShowNewPreset(false);
      setPresets(notificationFilterEngine.getState().presets);
    }
  };

  const handleDeletePreset = (presetId: string) => {
    notificationFilterEngine.removePreset(presetId);
    setPresets(notificationFilterEngine.getState().presets);
  };

  const getCategoryCount = (category: NotificationCategory) => {
    return localFilter.categories.includes(category) ? 1 : 0;
  };

  const getPriorityCount = (priority: NotificationPriority) => {
    return localFilter.priorities.includes(priority) ? 1 : 0;
  };

  const renderCategoryFilter = () => (
    <View style={styles.filterSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        Categories
      </Text>
      <View style={styles.chipContainer}>
        {Object.values(CATEGORY_DEFINITIONS).map((category) => {
          const isSelected = localFilter.categories.includes(category.id);
          const Icon = category.icon;
          
          return (
            <Chip
              key={category.id}
              mode={isSelected ? 'flat' : 'outlined'}
              selected={isSelected}
              onPress={() => handleCategoryToggle(category.id)}
              icon={() => <Icon size={16} color={isSelected ? '#fff' : category.color} />}
              style={[
                styles.chip,
                isSelected && { backgroundColor: category.color }
              ]}
              textStyle={[
                styles.chipText,
                isSelected && { color: '#fff' }
              ]}
            >
              {category.name}
            </Chip>
          );
        })}
      </View>
    </View>
  );

  const renderPriorityFilter = () => (
    <View style={styles.filterSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        Priority
      </Text>
      <View style={styles.chipContainer}>
        {(['urgent', 'high', 'medium', 'low'] as NotificationPriority[]).map((priority) => {
          const isSelected = localFilter.priorities.includes(priority);
          const priorityColors = {
            urgent: '#DC2626',
            high: '#EA580C',
            medium: '#F59E0B',
            low: '#6B7280'
          };
          
          return (
            <Chip
              key={priority}
              mode={isSelected ? 'flat' : 'outlined'}
              selected={isSelected}
              onPress={() => handlePriorityToggle(priority)}
              style={[
                styles.chip,
                isSelected && { backgroundColor: priorityColors[priority] }
              ]}
              textStyle={[
                styles.chipText,
                isSelected && { color: '#fff' }
              ]}
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Chip>
          );
        })}
      </View>
    </View>
  );

  const renderDateRangeFilter = () => (
    <View style={styles.filterSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        Date Range
      </Text>
      <View style={styles.dateRangeContainer}>
        <TouchableOpacity
          style={[styles.dateButton, { borderColor: theme.colors.outline }]}
          onPress={() => setShowDatePicker('start')}
        >
          <Calendar size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.dateButtonText, { color: theme.colors.onSurface }]}>
            {localFilter.dateRange?.start 
              ? localFilter.dateRange.start.toLocaleDateString()
              : 'Start Date'
            }
          </Text>
        </TouchableOpacity>
        
        <Text style={[styles.dateRangeSeparator, { color: theme.colors.onSurfaceVariant }]}>
          to
        </Text>
        
        <TouchableOpacity
          style={[styles.dateButton, { borderColor: theme.colors.outline }]}
          onPress={() => setShowDatePicker('end')}
        >
          <Calendar size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.dateButtonText, { color: theme.colors.onSurface }]}>
            {localFilter.dateRange?.end 
              ? localFilter.dateRange.end.toLocaleDateString()
              : 'End Date'
            }
          </Text>
        </TouchableOpacity>
        
        {localFilter.dateRange && (
          <IconButton
            icon={() => <X size={16} color={theme.colors.onSurfaceVariant} />}
            size={20}
            onPress={handleClearDateRange}
          />
        )}
      </View>
    </View>
  );

  const renderReadStatusFilter = () => (
    <View style={styles.filterSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        Read Status
      </Text>
      <View style={styles.chipContainer}>
        {(['all', 'read', 'unread'] as const).map((status) => {
          const isSelected = localFilter.readStatus === status;
          
          return (
            <Chip
              key={status}
              mode={isSelected ? 'flat' : 'outlined'}
              selected={isSelected}
              onPress={() => handleReadStatusChange(status)}
              style={[
                styles.chip,
                isSelected && { backgroundColor: theme.colors.primary }
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Chip>
          );
        })}
      </View>
    </View>
  );

  const renderSortOptions = () => (
    <View style={styles.filterSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        Sort By
      </Text>
      <View style={styles.sortContainer}>
        <View style={styles.chipContainer}>
          {SORT_OPTIONS.map((option) => {
            const isSelected = currentSort.sortBy.field === option.field;
            
            return (
              <Chip
                key={option.field}
                mode={isSelected ? 'flat' : 'outlined'}
                selected={isSelected}
                onPress={() => onSortChange(option, currentSort.sortOrder)}
                style={[
                  styles.chip,
                  isSelected && { backgroundColor: theme.colors.primary }
                ]}
              >
                {option.label}
              </Chip>
            );
          })}
        </View>
        
        <View style={styles.sortOrderContainer}>
          <TouchableOpacity
            style={[
              styles.sortOrderButton,
              currentSort.sortOrder === 'desc' && styles.sortOrderButtonActive
            ]}
            onPress={() => onSortChange(currentSort.sortBy, 'desc')}
          >
            <Text style={[
              styles.sortOrderText,
              currentSort.sortOrder === 'desc' && styles.sortOrderTextActive
            ]}>
              ↓ Desc
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.sortOrderButton,
              currentSort.sortOrder === 'asc' && styles.sortOrderButtonActive
            ]}
            onPress={() => onSortChange(currentSort.sortBy, 'asc')}
          >
            <Text style={[
              styles.sortOrderText,
              currentSort.sortOrder === 'asc' && styles.sortOrderTextActive
            ]}>
              ↑ Asc
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPresets = () => (
    <View style={styles.filterSection}>
      <View style={styles.presetHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Filter Presets
        </Text>
        <IconButton
          icon={() => <Plus size={16} color={theme.colors.primary} />}
          size={20}
          onPress={() => setShowNewPreset(true)}
        />
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.presetScrollView}
      >
        {presets.map((preset) => (
          <View key={preset.id} style={styles.presetItem}>
            <TouchableOpacity
              style={[styles.presetButton, { borderColor: theme.colors.outline }]}
              onPress={() => handleApplyPreset(preset)}
            >
              <Text style={[styles.presetName, { color: theme.colors.onSurface }]}>
                {preset.name}
              </Text>
              <Text style={[styles.presetDescription, { color: theme.colors.onSurfaceVariant }]}>
                {preset.description}
              </Text>
            </TouchableOpacity>
            
            {!preset.isDefault && (
              <IconButton
                icon={() => <Trash2 size={12} color={theme.colors.error} />}
                size={16}
                style={styles.deletePresetButton}
                onPress={() => handleDeletePreset(preset.id)}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Filter & Sort
          </Text>
          <IconButton
            icon={() => <X size={20} color={theme.colors.onSurface} />}
            onPress={onClose}
          />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderPresets()}
          <Divider style={styles.divider} />
          {renderCategoryFilter()}
          <Divider style={styles.divider} />
          {renderPriorityFilter()}
          <Divider style={styles.divider} />
          {renderDateRangeFilter()}
          <Divider style={styles.divider} />
          {renderReadStatusFilter()}
          <Divider style={styles.divider} />
          {renderSortOptions()}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={handleClearFilter}
            style={styles.footerButton}
            icon={() => <RotateCcw size={16} color={theme.colors.primary} />}
          >
            Clear
          </Button>
          <Button
            mode="contained"
            onPress={handleApplyFilter}
            style={styles.footerButton}
          >
            Apply Filters
          </Button>
        </View>

        {/* Date Picker Modals */}
        <DatePickerModal
          locale="en"
          mode="single"
          visible={showDatePicker === 'start'}
          onDismiss={() => setShowDatePicker(null)}
          date={localFilter.dateRange?.start || new Date()}
          onConfirm={(params) => handleDateRangeChange('start', params.date)}
        />
        
        <DatePickerModal
          locale="en"
          mode="single"
          visible={showDatePicker === 'end'}
          onDismiss={() => setShowDatePicker(null)}
          date={localFilter.dateRange?.end || new Date()}
          onConfirm={(params) => handleDateRangeChange('end', params.date)}
        />
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: spacing.lg,
    borderRadius: 12,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipText: {
    fontSize: 12,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    gap: spacing.sm,
    flex: 1,
  },
  dateButtonText: {
    fontSize: 14,
  },
  dateRangeSeparator: {
    fontSize: 14,
    paddingHorizontal: spacing.sm,
  },
  sortContainer: {
    gap: spacing.md,
  },
  sortOrderContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sortOrderButton: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  sortOrderButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sortOrderText: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  sortOrderTextActive: {
    color: '#fff',
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  presetScrollView: {
    marginTop: spacing.md,
  },
  presetItem: {
    position: 'relative',
    marginRight: spacing.md,
  },
  presetButton: {
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 120,
  },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  presetDescription: {
    fontSize: 10,
  },
  deletePresetButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.surface,
  },
  divider: {
    marginVertical: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  footerButton: {
    flex: 1,
  },
}); 