import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, RefreshControl } from 'react-native';
import { Text, Button, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { ChartBar as BarChart3, TrendingUp, DollarSign, Building2, Users, FileText, Calendar, Download, Eye } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';
import { reportsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useTranslation } from '@/lib/useTranslation';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  lastGenerated?: string;
  onView: () => void;
  onDownload: () => void;
}

export default function ReportsScreen() {
  const router = useRouter();
  const { t } = useTranslation('reports');
  const [activeCategory, setActiveCategory] = useState('financial');
  
  // API calls for real data
  const { 
    data: stats, 
    loading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useApi(() => reportsApi.getStats(), []);

  const { 
    data: revenueData, 
    loading: revenueLoading, 
    refetch: refetchRevenue 
  } = useApi(() => reportsApi.getRevenueReport(), []);

  const { 
    data: expenseData, 
    loading: expenseLoading, 
    refetch: refetchExpense 
  } = useApi(() => reportsApi.getExpenseReport(), []);

  const { 
    data: propertyData, 
    loading: propertyLoading, 
    refetch: refetchProperty 
  } = useApi(() => reportsApi.getPropertyPerformanceReport(), []);

  const { 
    data: tenantData, 
    loading: tenantLoading, 
    refetch: refetchTenant 
  } = useApi(() => reportsApi.getTenantReport(), []);

  const { 
    data: maintenanceData, 
    loading: maintenanceLoading, 
    refetch: refetchMaintenance 
  } = useApi(() => reportsApi.getMaintenanceReport(), []);

  const handleRefresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchRevenue(),
      refetchExpense(), 
      refetchProperty(),
      refetchTenant(),
      refetchMaintenance()
    ]);
  };

  const isLoading = statsLoading || revenueLoading || expenseLoading || propertyLoading || tenantLoading || maintenanceLoading;

  const formatLastGenerated = (isoString?: string) => {
    if (!isoString) return t('neverGenerated');
    const date = new Date(isoString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t('justNow');
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? t('hourAgo') : t('hoursAgo')}`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ${diffInDays === 1 ? t('dayAgo') : t('daysAgo')}`;
  };

  // Generate dynamic reports list based on available data
  const generateReportsList = (): ReportItem[] => {
    const reports: ReportItem[] = [];
    
    // Financial Reports (only if revenue or expense data exists)
    if (revenueData || expenseData) {
      reports.push(
        {
          id: 'revenue-report',
          title: t('revenueReport'),
          description: t('revenueReportDesc'),
          category: 'financial',
          icon: <TrendingUp size={20} color={theme.colors.success} />,
          color: theme.colors.success,
          lastGenerated: formatLastGenerated(revenueData?.lastGenerated),
          onView: () => router.push('/(drawer)/reports/revenue'),
          onDownload: () => console.log('Download revenue report'),
        },
        {
          id: 'expense-report',
          title: t('expenseReport'),
          description: t('expenseReportDesc'),
          category: 'financial',
          icon: <DollarSign size={20} color={theme.colors.error} />,
          color: theme.colors.error,
          lastGenerated: formatLastGenerated(expenseData?.lastGenerated),
          onView: () => router.push('/(drawer)/reports/expenses'),
          onDownload: () => console.log('Download expense report'),
        },
        {
          id: 'profit-loss',
          title: t('profitLoss'),
          description: t('profitLossDesc'),
          category: 'financial',
          icon: <BarChart3 size={20} color={theme.colors.primary} />,
          color: theme.colors.primary,
          lastGenerated: formatLastGenerated(revenueData?.lastGenerated),
          onView: () => router.push('/(drawer)/reports/profit-loss'),
          onDownload: () => console.log('Download P&L report'),
        },
        {
          id: 'cash-flow',
          title: t('cashFlow'),
          description: t('cashFlowDesc'),
          category: 'financial',
          icon: <DollarSign size={20} color={theme.colors.secondary} />,
          color: theme.colors.secondary,
          lastGenerated: formatLastGenerated(revenueData?.lastGenerated),
          onView: () => router.push('/(drawer)/reports/cash-flow'),
          onDownload: () => console.log('Download cash flow report'),
        }
      );
    }
    
    // Property Reports (only if property data exists)
    if (propertyData) {
      reports.push(
        {
          id: 'occupancy-report',
          title: t('occupancyReport'),
          description: t('occupancyReportDesc'),
          category: 'property',
          icon: <Building2 size={20} color={theme.colors.primary} />,
          color: theme.colors.primary,
          lastGenerated: formatLastGenerated(propertyData?.lastGenerated),
          onView: () => router.push('/(drawer)/reports/occupancy'),
          onDownload: () => console.log('Download occupancy report'),
        },
        {
          id: 'property-performance',
          title: t('propertyPerformance'),
          description: t('propertyPerformanceDesc'),
          category: 'property',
          icon: <TrendingUp size={20} color={theme.colors.success} />,
          color: theme.colors.success,
          lastGenerated: formatLastGenerated(propertyData?.lastGenerated),
          onView: () => router.push('/(drawer)/reports/property-performance'),
          onDownload: () => console.log('Download property performance report'),
        }
      );
    }
    
    // Add maintenance report if maintenance data exists
    if (maintenanceData) {
      reports.push({
        id: 'maintenance-report',
        title: t('maintenanceReport'),
        description: t('maintenanceReportDesc'),
        category: 'property',
        icon: <Building2 size={20} color={theme.colors.warning} />,
        color: theme.colors.warning,
        lastGenerated: formatLastGenerated(maintenanceData?.lastGenerated),
                  onView: () => router.push('/(drawer)/reports/maintenance-costs'),
        onDownload: () => console.log('Download maintenance report'),
      });
    }
    
    // Tenant Reports (only if tenant data exists)
    if (tenantData) {
      reports.push(
        {
          id: 'tenant-report',
          title: t('tenantReport'),
          description: t('tenantReportDesc'),
          category: 'tenant',
          icon: <Users size={20} color={theme.colors.secondary} />,
          color: theme.colors.secondary,
          lastGenerated: formatLastGenerated(tenantData?.lastGenerated),
          onView: () => alert('Tenant report details coming soon!'),
          onDownload: () => console.log('Download tenant report'),
        },
        {
          id: 'payment-history',
          title: t('paymentHistory'),
          description: t('paymentHistoryDesc'),
          category: 'tenant',
          icon: <DollarSign size={20} color={theme.colors.primary} />,
          color: theme.colors.primary,
          lastGenerated: formatLastGenerated(tenantData?.lastGenerated),
          onView: () => router.push('/(drawer)/reports/payment-history'),
          onDownload: () => console.log('Download payment history report'),
        },
        {
          id: 'lease-expiry',
          title: t('leaseExpiry'),
          description: t('leaseExpiryDesc'),
          category: 'tenant',
          icon: <Calendar size={20} color={theme.colors.warning} />,
          color: theme.colors.warning,
          lastGenerated: formatLastGenerated(tenantData?.lastGenerated),
          onView: () => router.push('/(drawer)/reports/lease-expiry'),
          onDownload: () => console.log('Download lease expiry report'),
        }
      );
    }
    
    // Operations Reports (only if maintenance data exists)
    if (maintenanceData) {
      reports.push(
        {
          id: 'operations-summary',
          title: t('operationsSummary'),
          description: t('operationsSummaryDesc'),
          category: 'operations',
          icon: <BarChart3 size={20} color={theme.colors.tertiary} />,
          color: theme.colors.tertiary,
          lastGenerated: formatLastGenerated(maintenanceData?.lastGenerated),
          onView: () => alert('Operations report details coming soon!'),
          onDownload: () => console.log('Download operations report'),
        },
        {
          id: 'vendor-report',
          title: t('vendorReport'),
          description: t('vendorReportDesc'),
          category: 'operations',
          icon: <Users size={20} color={theme.colors.primary} />,
          color: theme.colors.primary,
          lastGenerated: formatLastGenerated(maintenanceData?.lastGenerated),
          onView: () => alert('Vendor report details coming soon!'),
          onDownload: () => console.log('Download vendor report'),
        }
      );
    }
    
    return reports;
  };

  const reports = generateReportsList();

  const filteredReports = reports.filter(report => report.category === activeCategory);

  const renderReportCard = ({ item }: { item: ReportItem }) => (
    <ModernCard style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={[styles.reportIcon, { backgroundColor: `${item.color}15` }]}>
          {item.icon}
        </View>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{item.title}</Text>
          <Text style={styles.reportDescription}>{item.description}</Text>
          {item.lastGenerated && (
            <Text style={styles.lastGenerated}>{t('lastGenerated')}: {item.lastGenerated}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.reportActions}>
        <Button
          mode="outlined"
          onPress={item.onView}
          style={styles.actionButton}
          contentStyle={styles.actionContent}
          icon={() => <Eye size={16} color={theme.colors.primary} />}
        >
          {t('view')}
        </Button>
        <Button
          mode="contained"
          onPress={item.onDownload}
          style={[styles.actionButton, { backgroundColor: item.color }]}
          contentStyle={styles.actionContent}
          icon={() => <Download size={16} color="white" />}
        >
          {t('download')}
        </Button>
      </View>
    </ModernCard>
  );

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('title')}
        subtitle={t('subtitle')}
        variant="dark"
        showNotifications
        isHomepage={false}
      />

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          <StatCard
            title={t('totalReports')}
            value={stats?.totalReports?.toString() || '0'}
            color={theme.colors.primary}
            icon={<FileText size={20} color={theme.colors.primary} />}
            loading={statsLoading}
          />
          <StatCard
            title={t('thisMonth')}
            value={stats?.generatedThisMonth?.toString() || '0'}
            subtitle={t('generated')}
            color={theme.colors.success}
            icon={<TrendingUp size={20} color={theme.colors.success} />}
            loading={statsLoading}
          />
          <StatCard
            title={t('scheduled')}
            value={stats?.scheduledReports?.toString() || '0'}
            subtitle={t('autoGenerated')}
            color={theme.colors.secondary}
            icon={<Calendar size={20} color={theme.colors.secondary} />}
            loading={statsLoading}
          />
          <StatCard
            title={t('avgTime')}
            value={stats?.avgGenerationTime || '0s'}
            subtitle={t('generationTime')}
            color={theme.colors.warning}
            icon={<BarChart3 size={20} color={theme.colors.warning} />}
            loading={statsLoading}
          />
        </ScrollView>
      </View>

      {/* Category Filter */}
      <View style={styles.filtersSection}>
        <SegmentedButtons
          value={activeCategory}
          onValueChange={setActiveCategory}
          buttons={[
            { value: 'financial', label: t('categories.financial') },
            { value: 'property', label: t('categories.property') },
            { value: 'tenant', label: t('categories.tenant') },
            { value: 'operations', label: t('categories.operations') },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Reports List */}
      <FlatList
        data={filteredReports}
        renderItem={renderReportCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ModernCard style={styles.emptyState}>
            <FileText size={48} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyStateTitle}>{t('noReportsAvailable')}</Text>
            <Text style={styles.emptyStateSubtitle}>
              {t('noReportsDesc')}
            </Text>
          </ModernCard>
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
    backgroundColor: theme.colors.surface,
  },
  listContent: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xxxl,
  },
  reportCard: {
    marginBottom: spacing.m,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  lastGenerated: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  reportActions: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  actionButton: {
    flex: 1,
  },
  actionContent: {
    height: 40,
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
});