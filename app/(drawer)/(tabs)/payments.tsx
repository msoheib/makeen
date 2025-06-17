import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Chip, Button, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { vouchersApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { TrendingUp, TrendingDown, DollarSign, Calendar, CheckCircle, Clock, XCircle, Filter, Plus } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { useTranslation } from 'react-i18next';

// Updated interface to match voucher data structure
interface Payment {
  id: string;
  amount: number;
  status: 'draft' | 'posted' | 'cancelled';
  type: 'receipt' | 'payment' | 'journal';
  description: string;
  voucher_number: string;
  currency: string;
  created_at: string;
  property_title?: string;
  tenant_name?: string;
  payment_method?: string;
}

export default function PaymentsScreen() {
  const router = useRouter();
  const { t } = useTranslation('payments');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'posted' | 'draft' | 'cancelled'>('all');
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);

  // Fetch vouchers from API
  const { 
    data: vouchers, 
    loading, 
    error, 
    refetch 
  } = useApi(() => vouchersApi.getAll(), []);

  // Transform vouchers to payment format
  const payments: Payment[] = vouchers ? vouchers.map(voucher => ({
    id: voucher.id,
    amount: voucher.amount,
    status: voucher.status,
    type: voucher.voucher_type,
    description: voucher.description || '',
    voucher_number: voucher.voucher_number,
    currency: voucher.currency,
    created_at: voucher.created_at,
    // These would come from joins in a real implementation
    property_title: 'Property', // placeholder - would need join
    tenant_name: 'Tenant', // placeholder - would need join
    payment_method: voucher.payment_method || 'bank',
  })) : [];

  // Calculate stats from real data
  const stats = {
    totalReceived: payments.filter(p => p.type === 'receipt' && p.status === 'posted').reduce((sum, p) => sum + p.amount, 0),
    totalPaid: payments.filter(p => p.type === 'payment' && p.status === 'posted').reduce((sum, p) => sum + p.amount, 0),
    pendingPayments: payments.filter(p => p.status === 'draft').length,
    completedPayments: payments.filter(p => p.status === 'posted').length,
  };

  useEffect(() => {
    filterPayments();
  }, [payments, searchQuery, activeFilter]);

  const filterPayments = () => {
    let filtered = [...payments];
    
    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === activeFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.description.toLowerCase().includes(query) ||
        payment.voucher_number.toLowerCase().includes(query) ||
        (payment.tenant_name && payment.tenant_name.toLowerCase().includes(query)) ||
        (payment.property_title && payment.property_title.toLowerCase().includes(query))
      );
    }
    
    setFilteredPayments(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted':
        return <CheckCircle size={16} color={theme.colors.success} />;
      case 'draft':
        return <Clock size={16} color={theme.colors.warning} />;
      case 'cancelled':
        return <XCircle size={16} color={theme.colors.error} />;
      default:
        return <Clock size={16} color={theme.colors.onSurfaceVariant} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted':
        return theme.colors.success;
      case 'draft':
        return theme.colors.warning;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'receipt':
        return <TrendingUp size={16} color={theme.colors.success} />;
      case 'payment':
        return <TrendingDown size={16} color={theme.colors.error} />;
      case 'journal':
        return <Calendar size={16} color={theme.colors.secondary} />;
      default:
        return <DollarSign size={16} color={theme.colors.onSurfaceVariant} />;
    }
  };

  const renderPayment = ({ item }: { item: Payment }) => (
    <ModernCard style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <View style={styles.paymentTitleRow}>
            <Text style={styles.paymentAmount}>
              {item.currency} {item.amount.toLocaleString()}
            </Text>
            <View style={styles.statusContainer}>
              {getStatusIcon(item.status)}
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              {getTypeIcon(item.type)}
              <Text style={styles.detailText}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {item.description || 'No description'}
            </Text>
            {item.tenant_name && (
              <Text style={styles.tenantName}>{item.tenant_name}</Text>
            )}
            {item.property_title && (
              <Text style={styles.propertyName}>{item.property_title}</Text>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.paymentFooter}>
        <Text style={styles.paymentDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        {item.payment_method && (
          <Chip
            mode="outlined"
            style={styles.methodChip}
            textStyle={styles.methodText}
          >
            {item.payment_method.toUpperCase()}
          </Chip>
        )}
        <Text style={styles.reference}>#{item.voucher_number}</Text>
      </View>
    </ModernCard>
  );

  if (error) {
    return (
      <View style={styles.container}>
        <ModernHeader
          title={t('title')}
          subtitle={t('subtitle')}
          variant="dark"
          showNotifications={true}
          showMenu={true}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load payments</Text>
          <Button mode="contained" onPress={refetch} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('title')}
        subtitle={t('subtitle')}
        variant="dark"
        showNotifications={true}
        showMenu={true}
      />

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            {
              title: 'Total Received',
              value: `SAR ${stats.totalReceived.toLocaleString()}`,
              color: theme.colors.success,
              icon: <TrendingUp size={20} color={theme.colors.success} />,
            },
            {
              title: 'Total Paid',
              value: `SAR ${stats.totalPaid.toLocaleString()}`,
              color: theme.colors.error,
              icon: <TrendingDown size={20} color={theme.colors.error} />,
            },
            {
              title: 'Pending',
              value: stats.pendingPayments.toString(),
              color: theme.colors.warning,
              icon: <Clock size={20} color={theme.colors.warning} />,
            },
            {
              title: 'Completed',
              value: stats.completedPayments.toString(),
              color: theme.colors.success,
              icon: <CheckCircle size={20} color={theme.colors.success} />,
            },
          ]}
          renderItem={({ item }) => (
            <ModernCard style={styles.statCard}>
              <View style={styles.statHeader}>
                {item.icon}
                <Text style={[styles.statValue, { color: item.color }]}>
                  {item.value}
                </Text>
              </View>
              <Text style={styles.statTitle}>{item.title}</Text>
            </ModernCard>
          )}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.statsContainer}
        />
      </View>

      {/* Filter and Search */}
      <View style={styles.filtersSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'all', label: 'All' },
            { key: 'posted', label: 'Posted' },
            { key: 'draft', label: 'Draft' },
            { key: 'cancelled', label: 'Cancelled' },
          ]}
          renderItem={({ item }) => (
            <Chip
              mode={activeFilter === item.key ? 'elevated' : 'outlined'}
              selected={activeFilter === item.key}
              onPress={() => setActiveFilter(item.key as any)}
              style={styles.filterChip}
              textStyle={styles.filterText}
            >
              {item.label}
            </Chip>
          )}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filtersContainer}
        />
      </View>

              <Searchbar
          placeholder="Search payments..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

      {/* Add Payment Button */}
      <View style={styles.addButtonContainer}>
        <Button
          mode="contained"
          onPress={() => router.push('/finance/vouchers/add')}
          icon={() => <Plus size={20} color="white" />}
          style={styles.addButton}
        >
          Add Payment
        </Button>
      </View>

      {/* Payments List */}
      <FlatList
        data={filteredPayments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.id}
        style={styles.paymentsList}
        contentContainerStyle={styles.paymentsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Loading payments...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No payments found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || activeFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding your first payment'
                }
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsSection: {
    paddingVertical: spacing.m,
  },
  statsContainer: {
    paddingHorizontal: spacing.m,
    gap: spacing.m,
  },
  statCard: {
    padding: spacing.m,
    minWidth: 140,
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statTitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  filtersSection: {
    paddingVertical: spacing.s,
  },
  filtersContainer: {
    paddingHorizontal: spacing.m,
    gap: spacing.s,
  },
  filterChip: {
    marginRight: spacing.s,
  },
  filterText: {
    fontSize: 12,
  },
  searchbar: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
    backgroundColor: theme.colors.surface,
  },
  addButtonContainer: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.m,
  },
  addButton: {
    borderRadius: 8,
  },
  paymentsList: {
    flex: 1,
  },
  paymentsContainer: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xl,
  },
  paymentCard: {
    marginBottom: spacing.m,
    padding: spacing.m,
  },
  paymentHeader: {
    marginBottom: spacing.m,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  paymentDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  description: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  tenantName: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  propertyName: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  paymentDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  methodChip: {
    height: 24,
  },
  methodText: {
    fontSize: 10,
  },
  reference: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontFamily: 'monospace',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.s,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    marginBottom: spacing.m,
  },
  retryButton: {
    borderRadius: 8,
  },
});