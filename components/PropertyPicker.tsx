import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, Modal, Portal, TextInput, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { Search, ChevronDown, X, Home } from 'lucide-react-native';
import { theme, spacing } from '@/lib/theme';
import { useApi } from '@/hooks/useApi';
import api from '@/lib/api';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  property_code?: string;
  property_type: string;
  status: string;
}

interface PropertyPickerProps {
  label: string;
  value?: Property | null;
  onValueChange: (property: Property | null) => void;
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function PropertyPicker({
  label,
  value,
  onValueChange,
  error = false,
  disabled = false,
  placeholder = 'Select property'
}: PropertyPickerProps) {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch properties
  const { 
    data: properties, 
    loading, 
    error: apiError, 
    refetch 
  } = useApi(() => api.properties.getAll(), []);

  // Filter properties based on search query
  const filteredProperties = properties?.filter(property => 
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (property.property_code && property.property_code.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const handlePropertySelect = (property: Property) => {
    onValueChange(property);
    setVisible(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onValueChange(null);
  };

  const displayValue = value ? value.title : placeholder;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return theme.colors.success || '#4CAF50';
      case 'rented': return theme.colors.warning || '#FF9800';
      case 'maintenance': return theme.colors.error;
      case 'reserved': return theme.colors.info || '#2196F3';
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'rented': return 'Rented';
      case 'maintenance': return 'Maintenance';
      case 'reserved': return 'Reserved';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

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
            <Home size={16} color={theme.colors.onSurfaceVariant} style={styles.icon} />
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

        {value && (
          <View style={styles.propertyDetails}>
            <Text style={styles.propertyAddress} numberOfLines={1}>
              {value.address}, {value.city}
            </Text>
            <View style={styles.propertyTags}>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(value.status) + '20' }]}
                textStyle={[styles.statusText, { color: getStatusColor(value.status) }]}
                compact
              >
                {getStatusLabel(value.status)}
              </Chip>
              <Chip 
                style={styles.typeChip}
                textStyle={styles.typeText}
                compact
              >
                {value.property_type.toUpperCase()}
              </Chip>
            </View>
          </View>
        )}
      </View>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Property</Text>
          </View>

          <TextInput
            mode="outlined"
            placeholder="Search properties..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            left={<TextInput.Icon icon={() => <Search size={20} />} />}
            style={styles.searchInput}
          />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Loading properties...</Text>
            </View>
          ) : apiError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load properties</Text>
              <Button onPress={refetch} mode="outlined">Retry</Button>
            </View>
          ) : (
            <FlatList
              data={filteredProperties}
              keyExtractor={(item) => item.id}
              style={styles.propertiesList}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.propertyItem,
                    value?.id === item.id && styles.selectedPropertyItem
                  ]}
                  onPress={() => handlePropertySelect(item)}
                >
                  <View style={styles.propertyInfo}>
                    <View style={styles.propertyHeader}>
                      <Text style={styles.propertyTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.property_code && (
                        <Text style={styles.propertyCode}>
                          {item.property_code}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.propertyAddress} numberOfLines={1}>
                      {item.address}, {item.city}
                    </Text>
                    <View style={styles.propertyTags}>
                      <Chip 
                        style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
                        textStyle={[styles.statusText, { color: getStatusColor(item.status) }]}
                        compact
                      >
                        {getStatusLabel(item.status)}
                      </Chip>
                      <Chip 
                        style={styles.typeChip}
                        textStyle={styles.typeText}
                        compact
                      >
                        {item.property_type.toUpperCase()}
                      </Chip>
                    </View>
                  </View>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery 
                      ? `No properties found for "${searchQuery}"`
                      : 'No properties available'
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
  propertyDetails: {
    marginTop: spacing.xs,
  },
  propertyAddress: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  propertyTags: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statusChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  typeChip: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  typeText: {
    fontSize: 10,
    color: theme.colors.onSecondaryContainer,
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
  propertiesList: {
    maxHeight: 400,
  },
  propertyItem: {
    padding: spacing.md,
  },
  selectedPropertyItem: {
    backgroundColor: theme.colors.primaryContainer,
  },
  propertyInfo: {
    width: '100%',
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  propertyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  propertyCode: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
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