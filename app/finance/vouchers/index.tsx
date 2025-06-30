import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { vouchersApi } from '@/lib/api';
import VoucherCard from '@/components/VoucherCard';
import VoucherStatusBadge from '@/components/VoucherStatusBadge';
import VoucherTypeIcon from '@/components/VoucherTypeIcon';
import ModernHeader from '@/components/ModernHeader';
import StatCard from '@/components/StatCard';

interface FilterOptions {
  voucher_type?: 'receipt' | 'payment' | 'journal' | '';
  status?: 'draft' | 'posted' | 'cancelled' | '';
  search?: string;
  startDate?: string;
  endDate?: string;
}

const VoucherManagementScreen: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();

  // State management
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // API calls
  const {
    data: vouchers,
    loading: vouchersLoading,
    error: vouchersError,
    refetch: refetchVouchers,
  } = useApi(() => vouchersApi.getAllWithSearch({
    ...filters,
    search: searchText || undefined,
  }), [filters, searchText]);

  const {
    data: statistics,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useApi(() => vouchersApi.getStatistics(), []);

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchVouchers(), refetchStats()]);
    setRefreshing(false);
  };

  // Filter management
  const applyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchText('');
    setShowFilters(false);
  };

  // Voucher actions
  const handleVoucherPress = (voucher: any) => {
    router.push(`/finance/vouchers/${voucher.id}`);
  };

  const handleEditVoucher = (voucher: any) => {
    const routeMap = {
      receipt: '/finance/vouchers/receipt',
      payment: '/finance/vouchers/payment',
      journal: '/finance/vouchers/entry',
    };
    
    router.push({
      pathname: routeMap[voucher.voucher_type as keyof typeof routeMap],
      params: { edit: voucher.id },
    });
  };

  const handleDuplicateVoucher = async (voucher: any) => {
    try {
      const result = await vouchersApi.duplicate(voucher.id);
      if (result.data) {
        Alert.alert('Success', 'Voucher duplicated successfully');
        refetchVouchers();
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to duplicate voucher');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to duplicate voucher');
    }
  };

  const handlePostVoucher = async (voucher: any) => {
    try {
      const result = await vouchersApi.updateStatus(voucher.id, 'posted');
      if (result.data) {
        Alert.alert('Success', 'Voucher posted successfully');
        refetchVouchers();
        refetchStats();
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to post voucher');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post voucher');
    }
  };

  const handleCancelVoucher = async (voucher: any) => {
    try {
      const result = await vouchersApi.updateStatus(voucher.id, 'cancelled');
      if (result.data) {
        Alert.alert('Success', 'Voucher cancelled successfully');
        refetchVouchers();
        refetchStats();
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to cancel voucher');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel voucher');
    }
  };

  const handleDeleteVoucher = async (voucher: any) => {
    try {
      const result = await vouchersApi.delete(voucher.id);
      if (!result.error) {
        Alert.alert('Success', 'Voucher deleted successfully');
        refetchVouchers();
        refetchStats();
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to delete voucher');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete voucher');
    }
  };

  // Quick stats summary
  const getQuickStats = () => {
    if (!statistics) return null;

    return [
      {
        title: 'Total Vouchers',
        value: statistics.totalVouchers.toString(),
        icon: 'receipt',
        color: theme.colors.primary,
      },
      {
        title: 'Draft',
        value: statistics.draftVouchers.toString(),
        icon: 'edit',
        color: theme.colors.notification,
      },
      {
        title: 'Posted',
        value: statistics.postedVouchers.toString(),
        icon: 'check-circle',
        color: '#4CAF50',
      },
      {
        title: 'Total Amount',
        value: `${statistics.totalAmount.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })} SAR`,
        icon: 'account-balance',
        color: theme.colors.primary,
      },
    ];
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const quickStats = getQuickStats();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader title="Voucher Management" />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Quick Statistics */}
        {quickStats && (
          <View style={styles.statsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Overview
            </Text>
            <View style={styles.statsGrid}>
              {quickStats.map((stat, index) => (
                <StatCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                  loading={statsLoading}
                />
              ))}
            </View>
          </View>
        )}

        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
            <MaterialIcons name="search" size={20} color={theme.colors.onSurfaceVariant} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.onSurface }]}
              placeholder="Search vouchers..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <MaterialIcons name="clear" size={20} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: Object.keys(filters).length > 0 ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.outline 
              }
            ]}
            onPress={() => setShowFilters(true)}
          >
            <MaterialIcons 
              name="filter-list" 
              size={20} 
              color={Object.keys(filters).length > 0 ? theme.colors.onPrimary : theme.colors.onSurface} 
            />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
              onPress={() => router.push('/finance/vouchers/receipt')}
            >
              <VoucherTypeIcon type="receipt" size={20} showBackground={false} />
              <Text style={[styles.actionText, { color: theme.colors.onSurface }]}>
                Receipt Voucher
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
              onPress={() => router.push('/finance/vouchers/payment')}
            >
              <VoucherTypeIcon type="payment" size={20} showBackground={false} />
              <Text style={[styles.actionText, { color: theme.colors.onSurface }]}>
                Payment Voucher
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
              onPress={() => router.push('/finance/vouchers/entry')}
            >
              <VoucherTypeIcon type="journal" size={20} showBackground={false} />
              <Text style={[styles.actionText, { color: theme.colors.onSurface }]}>
                Journal Entry
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vouchers List */}
        <View style={styles.vouchersContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            All Vouchers
            {vouchers && ` (${vouchers.length})`}
          </Text>

          {vouchersLoading && (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                Loading vouchers...
              </Text>
            </View>
          )}

          {vouchersError && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                Error loading vouchers: {vouchersError.message}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                onPress={refetchVouchers}
              >
                <Text style={[styles.retryText, { color: theme.colors.primary }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {vouchers && vouchers.length === 0 && !vouchersLoading && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt-long" size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                No vouchers found
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Create your first voucher using the quick actions above
              </Text>
            </View>
          )}

          {vouchers && vouchers.length > 0 && (
            <View style={styles.vouchersList}>
              {vouchers.map((voucher) => (
                <VoucherCard
                  key={voucher.id}
                  voucher={voucher}
                  onPress={() => handleVoucherPress(voucher)}
                  onEdit={() => handleEditVoucher(voucher)}
                  onDuplicate={() => handleDuplicateVoucher(voucher)}
                  onPost={() => handlePostVoucher(voucher)}
                  onCancel={() => handleCancelVoucher(voucher)}
                  onDelete={() => handleDeleteVoucher(voucher)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModal, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.outline }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Filter Vouchers
              </Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Voucher Type Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>
                  Voucher Type
                </Text>
                <View style={styles.filterOptions}>
                  {[
                    { value: '', label: 'All Types' },
                    { value: 'receipt', label: 'Receipt' },
                    { value: 'payment', label: 'Payment' },
                    { value: 'journal', label: 'Journal' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        {
                          backgroundColor: filters.voucher_type === option.value ? theme.colors.primary : theme.colors.surface,
                          borderColor: theme.colors.outline,
                        },
                      ]}
                      onPress={() => setFilters({ ...filters, voucher_type: option.value as any })}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          {
                            color: filters.voucher_type === option.value ? theme.colors.onPrimary : theme.colors.onSurface,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>
                  Status
                </Text>
                <View style={styles.filterOptions}>
                  {[
                    { value: '', label: 'All Status' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'posted', label: 'Posted' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        {
                          backgroundColor: filters.status === option.value ? theme.colors.primary : theme.colors.surface,
                          borderColor: theme.colors.outline,
                        },
                      ]}
                      onPress={() => setFilters({ ...filters, status: option.value as any })}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          {
                            color: filters.status === option.value ? theme.colors.onPrimary : theme.colors.onSurface,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: theme.colors.outline }]}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.colors.outline }]}
                onPress={clearFilters}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.onSurface }]}>
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => applyFilters(filters)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.onPrimary }]}>
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 0,
    flex: 1,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  vouchersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  vouchersList: {
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  applyButton: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default VoucherManagementScreen; 