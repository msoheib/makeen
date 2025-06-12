import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, Modal, Portal, TextInput, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { Search, ChevronDown, X } from 'lucide-react-native';
import { theme, spacing } from '@/lib/theme';
import { useApi } from '@/hooks/useApi';
import api from '@/lib/api';

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  is_active: boolean;
}

interface AccountPickerProps {
  label: string;
  value?: Account | null;
  onValueChange: (account: Account | null) => void;
  accountType?: string; // 'revenue', 'expense', 'asset', 'liability', 'equity'
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function AccountPicker({
  label,
  value,
  onValueChange,
  accountType,
  error = false,
  disabled = false,
  placeholder = 'Select account'
}: AccountPickerProps) {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch accounts based on type
  const { 
    data: accounts, 
    loading, 
    error: apiError, 
    refetch 
  } = useApi(() => {
    if (accountType) {
      return api.accounts.getByType(accountType);
    }
    return api.accounts.getAll({ is_active: true });
  }, [accountType]);

  // Filter accounts based on search query
  const filteredAccounts = accounts?.filter(account => 
    account.account_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.account_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleAccountSelect = (account: Account) => {
    onValueChange(account);
    setVisible(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onValueChange(null);
  };

  const displayValue = value 
    ? `${value.account_code} - ${value.account_name}`
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
          <Chip 
            style={styles.accountTypeChip}
            textStyle={styles.accountTypeText}
            compact
          >
            {value.account_type.toUpperCase()}
          </Chip>
        )}
      </View>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Account</Text>
            {accountType && (
              <Chip style={styles.filterChip} compact>
                {accountType.toUpperCase()}
              </Chip>
            )}
          </View>

          <TextInput
            mode="outlined"
            placeholder="Search accounts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            left={<TextInput.Icon icon={() => <Search size={20} />} />}
            style={styles.searchInput}
          />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Loading accounts...</Text>
            </View>
          ) : apiError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load accounts</Text>
              <Button onPress={refetch} mode="outlined">Retry</Button>
            </View>
          ) : (
            <FlatList
              data={filteredAccounts}
              keyExtractor={(item) => item.id}
              style={styles.accountsList}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.accountItem,
                    value?.id === item.id && styles.selectedAccountItem
                  ]}
                  onPress={() => handleAccountSelect(item)}
                >
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountCode}>{item.account_code}</Text>
                    <Text style={styles.accountName} numberOfLines={2}>
                      {item.account_name}
                    </Text>
                  </View>
                  <Chip 
                    style={styles.accountTypeChip}
                    textStyle={styles.accountTypeText}
                    compact
                  >
                    {item.account_type.toUpperCase()}
                  </Chip>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery 
                      ? `No accounts found for "${searchQuery}"`
                      : 'No accounts available'
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
  accountTypeChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  accountTypeText: {
    fontSize: 10,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    margin: spacing.lg,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  filterChip: {
    backgroundColor: theme.colors.primaryContainer,
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
  accountsList: {
    maxHeight: 300,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  selectedAccountItem: {
    backgroundColor: theme.colors.primaryContainer,
  },
  accountInfo: {
    flex: 1,
  },
  accountCode: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  accountName: {
    fontSize: 14,
    color: theme.colors.onSurface,
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