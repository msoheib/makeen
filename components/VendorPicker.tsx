import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, Modal, Portal, TextInput, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { Search, ChevronDown, X, User, Building2 } from 'lucide-react-native';
import { theme, spacing } from '@/lib/theme';
import { useApi } from '@/hooks/useApi';
import api from '@/lib/api';

interface Vendor {
  id: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  client_type: string;
  status: string;
}

interface VendorPickerProps {
  label: string;
  value?: Vendor | null;
  onValueChange: (vendor: Vendor | null) => void;
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function VendorPicker({
  label,
  value,
  onValueChange,
  error = false,
  disabled = false,
  placeholder = 'Select vendor/supplier',
}: VendorPickerProps) {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    data: vendors, 
    loading, 
    error: apiError 
  } = useApi(() => api.clients.getAll({
    client_type: 'supplier'
  }), []);

  const filteredVendors = vendors?.filter((vendor: Vendor) => {
    const searchText = searchQuery.toLowerCase();
    const companyMatch = vendor.company_name?.toLowerCase().includes(searchText);
    const contactMatch = vendor.contact_person?.toLowerCase().includes(searchText);
    const emailMatch = vendor.email?.toLowerCase().includes(searchText);
    
    return companyMatch || contactMatch || emailMatch;
  }) || [];

  const handleVendorSelect = (vendor: Vendor) => {
    onValueChange(vendor);
    setVisible(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onValueChange(null);
  };

  const displayText = value 
    ? (value.company_name || value.contact_person || 'Unknown Vendor')
    : placeholder;

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <Pressable
      style={styles.vendorItem}
      onPress={() => handleVendorSelect(item)}
    >
      <View style={styles.vendorIcon}>
        {item.company_name ? (
          <Building2 size={20} color={theme.colors.primary} />
        ) : (
          <User size={20} color={theme.colors.primary} />
        )}
      </View>
      <View style={styles.vendorDetails}>
        <Text style={styles.vendorName} numberOfLines={1}>
          {item.company_name || item.contact_person || 'Unknown'}
        </Text>
        {item.contact_person && item.company_name && (
          <Text style={styles.vendorContact} numberOfLines={1}>
            Contact: {item.contact_person}
          </Text>
        )}
        {item.email && (
          <Text style={styles.vendorEmail} numberOfLines={1}>
            {item.email}
          </Text>
        )}
        {item.phone && (
          <Text style={styles.vendorPhone} numberOfLines={1}>
            📞 {item.phone}
          </Text>
        )}
      </View>
      <View style={styles.vendorBadge}>
        <Chip mode="outlined" compact>
          {item.client_type === 'supplier' ? 'Supplier' : 'Vendor'}
        </Chip>
      </View>
    </Pressable>
  );

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          style={[
            styles.picker,
            error && styles.pickerError,
            disabled && styles.pickerDisabled,
          ]}
          onPress={() => !disabled && setVisible(true)}
          disabled={disabled}
        >
          <Text 
            style={[
              styles.pickerText,
              !value && styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {displayText}
          </Text>
          <View style={styles.pickerActions}>
            {value && !disabled && (
              <Pressable onPress={handleClear} style={styles.clearButton}>
                <X size={20} color={theme.colors.onSurfaceVariant} />
              </Pressable>
            )}
            <ChevronDown size={20} color={theme.colors.onSurfaceVariant} />
          </View>
        </Pressable>
        {error && (
          <Text style={styles.errorText}>Please select a vendor</Text>
        )}
      </View>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Vendor/Supplier</Text>
            <Pressable onPress={() => setVisible(false)}>
              <X size={24} color={theme.colors.onSurface} />
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              mode="outlined"
              placeholder="Search vendors..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              left={<TextInput.Icon icon={() => <Search size={20} />} />}
              style={styles.searchInput}
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Loading vendors...</Text>
            </View>
          ) : apiError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load vendors</Text>
            </View>
          ) : (
            <FlatList
              data={filteredVendors}
              renderItem={renderVendorItem}
              keyExtractor={(item) => item.id}
              style={styles.vendorList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No vendors found matching your search' : 'No vendors available'}
                  </Text>
                </View>
              }
            />
          )}

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setVisible(false)}>
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
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    minHeight: 56,
  },
  pickerError: {
    borderColor: theme.colors.error,
  },
  pickerDisabled: {
    backgroundColor: theme.colors.surfaceDisabled,
    opacity: 0.6,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  placeholderText: {
    color: theme.colors.onSurfaceVariant,
  },
  pickerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clearButton: {
    padding: 2,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: spacing.xs,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    margin: spacing.lg,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  searchContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
  },
  vendorList: {
    maxHeight: 400,
  },
  vendorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  vendorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  vendorDetails: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  vendorContact: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  vendorEmail: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  vendorPhone: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  vendorBadge: {
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
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
}); 