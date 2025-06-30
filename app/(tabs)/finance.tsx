import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Voucher, Invoice } from '@/lib/types';
import { DollarSign, Plus, TrendingUp, TrendingDown, Receipt, FileText } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';
import VoucherCard from '@/components/VoucherCard';
import { useTranslation } from 'react-i18next';

export default function FinanceScreen() {
  const router = useRouter();
  const { t } = useTranslation('finance');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vouchers');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    pendingPayments: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    fetchFinancialData();
  }, [activeTab]);

  useEffect(() => {
    filterData();
  }, [vouchers, invoices, searchQuery, activeTab]);

  const fetchFinancialData = async () => {
    try {
      if (activeTab === 'vouchers') {
        const { data, error } = await supabase
          .from('vouchers')
          .select(`
            *,
            property:properties(title),
            tenant:profiles(first_name, last_name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setVouchers(data);
      } else {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            property:properties(title),
            tenant:profiles(first_name, last_name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setInvoices(data);
      }

      // Calculate stats
      const { data: voucherStats } = await supabase
        .from('vouchers')
        .select('amount, voucher_type, status');

      if (voucherStats) {
        const income = voucherStats
          .filter(v => v.voucher_type === 'receipt' && v.status === 'posted')
          .reduce((sum, v) => sum + v.amount, 0);
        
        const expenses = voucherStats
          .filter(v => v.voucher_type === 'payment' && v.status === 'posted')
          .reduce((sum, v) => sum + v.amount, 0);
        
        const pending = voucherStats
          .filter(v => v.status === 'draft')
          .reduce((sum, v) => sum + v.amount, 0);

        setStats({
          totalIncome: income,
          totalExpenses: expenses,
          pendingPayments: pending,
          thisMonth: income - expenses,
        });
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    const data = activeTab === 'vouchers' ? vouchers : invoices;
    let filtered = [...data];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        if (activeTab === 'vouchers') {
          const voucher = item as Voucher;
          return voucher.voucher_number.toLowerCase().includes(query) ||
                 voucher.description?.toLowerCase().includes(query);
        } else {
          const invoice = item as Invoice;
          return invoice.invoice_number.toLowerCase().includes(query) ||
                 invoice.description?.toLowerCase().includes(query);
        }
      });
    }
    
    setFilteredData(filtered);
  };

  const renderVoucher = ({ item }: { item: Voucher }) => (
    <VoucherCard 
      voucher={item}
      onPress={() => router.push(`/finance/vouchers/${item.id}`)}
    />
  );

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <ModernCard style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
        <Text style={styles.invoiceAmount}>
          ${item.total_amount.toLocaleString()}
        </Text>
      </View>
      <Text style={styles.invoiceDescription}>{item.description}</Text>
      <View style={styles.invoiceFooter}>
        <Text style={styles.invoiceDate}>
          Due: {new Date(item.due_date).toLocaleDateString()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: `${theme.colors.primary}20` }]}>
          <Text style={[styles.statusText, { color: theme.colors.primary }]}>
            {item.status}
          </Text>
        </View>
      </View>
    </ModernCard>
  );

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('title')}
        subtitle={t('subtitle')}
        onNotificationPress={() => router.push('/notifications')}
        onSearchPress={() => router.push('/search')}
      />

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            {
              title: 'Total Income',
              value: `$${stats.totalIncome.toLocaleString()}`,
              color: theme.colors.success,
              icon: <TrendingUp size={20} color={theme.colors.success} />,
              trend: { value: '+12.5%', isPositive: true },
            },
            {
              title: 'Total Expenses',
              value: `$${stats.totalExpenses.toLocaleString()}`,
              color: theme.colors.error,
              icon: <TrendingDown size={20} color={theme.colors.error} />,
            },
            {
              title: 'Pending',
              value: `$${stats.pendingPayments.toLocaleString()}`,
              color: theme.colors.warning,
              icon: <Receipt size={20} color={theme.colors.warning} />,
            },
            {
              title: 'Net Income',
              value: `$${stats.thisMonth.toLocaleString()}`,
              color: theme.colors.primary,
              icon: <DollarSign size={20} color={theme.colors.primary} />,
              trend: { value: '+8.2%', isPositive: true },
            },
          ]}
          renderItem={({ item }) => (
            <StatCard
              title={item.title}
              value={item.value}
              color={item.color}
              icon={item.icon}
              trend={item.trend}
            />
          )}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.statsContainer}
        />
      </View>

      {/* Tab Selection */}
      <View style={styles.filtersSection}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'vouchers', label: 'Vouchers' },
            { value: 'invoices', label: 'Invoices' },
          ]}
          style={styles.segmentedButtons}
        />

        <Searchbar
          placeholder={`Search ${activeTab}...`}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </View>

      {/* Data List */}
      <FlatList
        data={filteredData}
        renderItem={activeTab === 'vouchers' ? renderVoucher : renderInvoice}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ModernCard style={styles.emptyState}>
            <FileText size={48} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyStateTitle}>No {activeTab} found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery 
                ? 'Try adjusting your search' 
                : `Create your first ${activeTab.slice(0, -1)} to get started`}
            </Text>
          </ModernCard>
        }
      />

      {/* Add Button */}
      <View style={styles.fabContainer}>
        <ModernCard style={styles.fab}>
          <Text
            style={styles.fabText}
            onPress={() => router.push(`/finance/${activeTab}/add`)}
          >
            <Plus size={24} color="white" />
          </Text>
        </ModernCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsSection: {
    marginBottom: spacing.m,
  },
  statsContainer: {
    paddingHorizontal: spacing.m,
  },
  filtersSection: {
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  segmentedButtons: {
    marginBottom: spacing.m,
    backgroundColor: theme.colors.surface,
  },
  searchbar: {
    backgroundColor: theme.colors.surface,
  },
  listContent: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xxxl,
  },
  invoiceCard: {
    marginBottom: spacing.m,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  invoiceDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.m,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  statusBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.m,
    right: spacing.m,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
});