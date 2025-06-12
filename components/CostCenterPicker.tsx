import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, Modal, Portal, TextInput, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { Search, ChevronDown, X, Building2 } from 'lucide-react-native';
import { theme, spacing } from '@/lib/theme';
import { useApi } from '@/hooks/useApi';
import api from '@/lib/api';

interface CostCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface CostCenterPickerProps {
  label: string;
  value?: CostCenter | null;
  onValueChange: (costCenter: CostCenter | null) => void;
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function CostCenterPicker({
  label,
  value,
  onValueChange,
  error = false,
  disabled = false,
  placeholder = 'Select cost center'
}: CostCenterPickerProps) {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch cost centers
  const { 
    data: costCenters, 
    loading, 
    error: apiError, 
    refetch 
  } = useApi(() => api.costCenters.getActive(), []);

  // Filter cost centers based on search query
  const filteredCostCenters = costCenters?.filter(costCenter => 
    costCenter.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    costCenter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (costCenter.description && costCenter.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const handleCostCenterSelect = (costCenter: CostCenter) => {
    onValueChange(costCenter);
    setVisible(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onValueChange(null);
  };

  const displayValue = value 
    ? `${value.code} - ${value.name}`
    : placeholder;

  return (
    <>
      <View style={styles.container}>
        <Text style={[
          styles.label,
          { color: error ? theme.colors.error : theme.colors.onSurfaceVariant }
        ]}>
          {label}
        </Text>
        
        <Pressable
          onPress={() => !disabled && setVisible(true)}
          style={[
            styles.picker,
            {
              borderColor: error 
                ? theme.colors.error 
                : theme.colors.outline,
              backgroundColor: disabled 
                ? theme.colors.surfaceDisabled 
                : theme.colors.surface
            }
          ]}
        >
          <View style={styles.pickerContent}>
            <Building2 size={16} color={theme.colors.onSurfaceVariant} style={styles.icon} />
            <Text
              style={[
                styles.pickerText,
                {
                  color: value 
                    ? theme.colors.onSurface 
                    : theme.colors.onSurfaceVariant
                }
              ]}
              numberOfLines={1}
            >
              {displayValue}
            </Text>
          </View>
          
          <View style={styles.pickerActions}>
            {value && !disabled && (
              <Pressable onPress={handleClear} style={styles.clearButton}>
                <X size={16} color={theme.colors.onSurfaceVariant} />
              </Pressable>
            )}
            <ChevronDown size={20} color={theme.colors.onSurfaceVariant} />
          </View>
        </Pressable>

        {value && value.description && (
          <Text style={styles.description} numberOfLines={2}>
            {value.description}
          </Text>
        )}
      </View>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Cost Center</Text>
          </View>

          <TextInput
            mode="outlined"
            placeholder="Search cost centers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            left={<TextInput.Icon icon={() => <Search size={20} />} />}
            style={styles.searchInput}
          />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Loading cost centers...</Text>
            </View>
          ) : apiError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load cost centers</Text>
              <Button onPress={refetch} mode="outlined">Retry</Button>
            </View>
          ) : (
            <FlatList
              data={filteredCostCenters}
              keyExtractor={(item) => item.id}
              style={styles.costCentersList}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.costCenterItem,
                    value?.id === item.id && styles.selectedCostCenterItem
                  ]}
                  onPress={() => handleCostCenterSelect(item)}
                >
                  <View style={styles.costCenterInfo}>
                    <View style={styles.costCenterHeader}>
                      <Text style={styles.costCenterCode}>{item.code}</Text>
                      <Chip 
                        style={styles.activeChip}
                        textStyle={styles.activeText}
                        compact
                      >
                        ACTIVE
                      </Chip>
                    </View>
                    <Text style={styles.costCenterName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text style={styles.costCenterDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery 
                      ? `No cost centers found for "${searchQuery}"`
                      : 'No cost centers available'
                    }
                  </Text>
                </View>
              )}
            />
          )}

          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setVisible(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: spacing.sm,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
  },
  pickerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs,
  },
  description: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  modal: {
    backgroundColor: theme.colors.surface,
    margin: spacing.lg,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  searchInput: {
    margin: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
  },
  costCentersList: {
    maxHeight: 300,
  },
  costCenterItem: {
    padding: spacing.md,
  },
  selectedCostCenterItem: {
    backgroundColor: theme.colors.primaryContainer,
  },
  costCenterInfo: {
    width: '100%',
  },
  costCenterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  costCenterCode: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  activeChip: {
    backgroundColor: '#4CAF50' + '20',
  },
  activeText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  costCenterName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  costCenterDescription: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.outline,
    marginHorizontal: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  cancelButton: {
    minWidth: 100,
  },
}); 