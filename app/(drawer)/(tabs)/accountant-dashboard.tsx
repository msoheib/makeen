import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ModernHeader } from '@/components/ModernHeader';
import { StatCard } from '@/components/StatCard';
import { useApi } from '@/hooks/useApi';
import { reportsApi, vouchersApi, invoicesApi } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/lib/useTranslation';

export default function AccountantDashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation('dashboard');

  // Fetch financial data for accountant dashboard
  const { 
    data: financialStats, 
    loading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useApi(() => reportsApi.getStats(), []);

  const { 
    data: revenueData, 
    loading: revenueLoading, 
    error: revenueError, 
    refetch: refetchRevenue 
  } = useApi(() => reportsApi.getRevenueReport(), []);

  const { 
    data: expenseData, 
    loading: expenseLoading, 
    error: expenseError, 
    refetch: refetchExpense 
  } = useApi(() => reportsApi.getExpenseReport(), []);

  const { 
    data: voucherSummary, 
    loading: voucherLoading, 
    error: voucherError, 
    refetch: refetchVouchers 
  } = useApi(() => vouchersApi.getSummary(), []);

  const { 
    data: invoiceSummary, 
    loading: invoiceLoading, 
    error: invoiceError, 
    refetch: refetchInvoices 
  } = useApi(() => invoicesApi.getSummary(), []);

  // Combined refresh function
  const handleRefresh = () => {
    refetchStats();
    refetchRevenue();
    refetchExpense();
    refetchVouchers();
    refetchInvoices();
  };

  const isLoading = statsLoading || revenueLoading || expenseLoading || voucherLoading || invoiceLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ModernHeader 
        title="Accountant Dashboard"
        subtitle="Financial Data & Reports"
        showMenu={true}
      />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Financial Overview Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Financial Overview
          </Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Revenue"
              value={revenueData?.totalRevenue ? `SAR ${revenueData.totalRevenue.toLocaleString()}` : 'SAR 0'}
              subtitle="This month"
              color={theme.colors.primary}
              loading={revenueLoading}
            />
            
            <StatCard
              title="Total Expenses"
              value={expenseData?.totalExpenses ? `SAR ${expenseData.totalExpenses.toLocaleString()}` : 'SAR 0'}
              subtitle="This month"
              color={theme.colors.error}
              loading={expenseLoading}
            />
            
            <StatCard
              title="Net Income"
              value={revenueData && expenseData ? 
                `SAR ${(revenueData.totalRevenue - expenseData.totalExpenses).toLocaleString()}` : 'SAR 0'}
              subtitle="This month"
              color={theme.colors.tertiary}
              loading={revenueLoading || expenseLoading}
            />
            
            <StatCard
              title="Active Vouchers"
              value={voucherSummary?.totalVouchers?.toString() || '0'}
              subtitle="Posted status"
              color={theme.colors.secondary}
              loading={voucherLoading}
            />
          </View>
        </View>

        {/* Voucher Summary Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Voucher Summary
          </Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Receipt Vouchers"
              value={voucherSummary?.receiptVouchers?.toString() || '0'}
              subtitle="Income vouchers"
              color={theme.colors.primary}
              loading={voucherLoading}
            />
            
            <StatCard
              title="Payment Vouchers"
              value={voucherSummary?.paymentVouchers?.toString() || '0'}
              subtitle="Expense vouchers"
              color={theme.colors.error}
              loading={voucherLoading}
            />
            
            <StatCard
              title="Journal Entries"
              value={voucherSummary?.journalVouchers?.toString() || '0'}
              subtitle="Adjustment entries"
              color={theme.colors.tertiary}
              loading={voucherLoading}
            />
            
            <StatCard
              title="Draft Vouchers"
              value={voucherSummary?.draftVouchers?.toString() || '0'}
              subtitle="Pending approval"
              color={theme.colors.outline}
              loading={voucherLoading}
            />
          </View>
        </View>

        {/* Invoice Summary Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Invoice Summary
          </Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Invoices"
              value={invoiceSummary?.totalInvoices?.toString() || '0'}
              subtitle="All invoices"
              color={theme.colors.primary}
              loading={invoiceLoading}
            />
            
            <StatCard
              title="Paid Invoices"
              value={invoiceSummary?.paidInvoices?.toString() || '0'}
              subtitle="Completed payments"
              color={theme.colors.tertiary}
              loading={invoiceLoading}
            />
            
            <StatCard
              title="Overdue Invoices"
              value={invoiceSummary?.overdueInvoices?.toString() || '0'}
              subtitle="Past due date"
              color={theme.colors.error}
              loading={invoiceLoading}
            />
            
            <StatCard
              title="Pending Invoices"
              value={invoiceSummary?.pendingInvoices?.toString() || '0'}
              subtitle="Awaiting payment"
              color={theme.colors.outline}
              loading={invoiceLoading}
            />
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Quick Actions
          </Text>
          
          <View style={styles.quickActions}>
            <View style={[styles.actionCard, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.actionTitle, { color: theme.colors.onSurfaceVariant }]}>
                Financial Reports
              </Text>
              <Text style={[styles.actionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Generate comprehensive financial reports
              </Text>
            </View>
            
            <View style={[styles.actionCard, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.actionTitle, { color: theme.colors.onSurfaceVariant }]}>
                Voucher Management
              </Text>
              <Text style={[styles.actionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Create and manage financial vouchers
              </Text>
            </View>
            
            <View style={[styles.actionCard, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.actionTitle, { color: theme.colors.onSurfaceVariant }]}>
                Chart of Accounts
              </Text>
              <Text style={[styles.actionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                View and manage account structure
              </Text>
            </View>
            
            <View style={[styles.actionCard, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.actionTitle, { color: theme.colors.onSurfaceVariant }]}>
                Cost Centers
              </Text>
              <Text style={[styles.actionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Manage expense allocation centers
              </Text>
            </View>
          </View>
        </View>

        {/* Error Display */}
        {(statsError || revenueError || expenseError || voucherError || invoiceError) && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              Some data could not be loaded. Pull down to refresh.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActions: {
    gap: 12,
  },
  actionCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
