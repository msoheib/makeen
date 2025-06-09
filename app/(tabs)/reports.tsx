import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, Button, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { ChartBar as BarChart3, TrendingUp, DollarSign, Building2, Users, FileText, Calendar, Download, Eye } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';

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
  const [activeCategory, setActiveCategory] = useState('financial');
  const [stats, setStats] = useState({
    totalReports: 24,
    generatedThisMonth: 8,
    scheduledReports: 3,
    avgGenerationTime: '2.3s',
  });

  const reports: ReportItem[] = [
    // Financial Reports
    {
      id: 'revenue-report',
      title: 'Revenue Report',
      description: 'Monthly revenue breakdown by property',
      category: 'financial',
      icon: <TrendingUp size={20} color={theme.colors.success} />,
      color: theme.colors.success,
      lastGenerated: '2 hours ago',
      onView: () => router.push('/reports/revenue'),
      onDownload: () => console.log('Download revenue report'),
    },
    {
      id: 'expense-report',
      title: 'Expense Report',
      description: 'Detailed breakdown of all expenses',
      category: 'financial',
      icon: <DollarSign size={20} color={theme.colors.error} />,
      color: theme.colors.error,
      lastGenerated: '1 day ago',
      onView: () => router.push('/reports/expenses'),
      onDownload: () => console.log('Download expense report'),
    },
    {
      id: 'profit-loss',
      title: 'Profit & Loss',
      description: 'P&L statement for the current period',
      category: 'financial',
      icon: <BarChart3 size={20} color={theme.colors.primary} />,
      color: theme.colors.primary,
      lastGenerated: '3 days ago',
      onView: () => router.push('/reports/profit-loss'),
      onDownload: () => console.log('Download P&L report'),
    },
    {
      id: 'cash-flow',
      title: 'Cash Flow Statement',
      description: 'Cash inflows and outflows analysis',
      category: 'financial',
      icon: <DollarSign size={20} color={theme.colors.secondary} />,
      color: theme.colors.secondary,
      lastGenerated: '1 week ago',
      onView: () => router.push('/reports/cash-flow'),
      onDownload: () => console.log('Download cash flow report'),
    },
    
    // Property Reports
    {
      id: 'occupancy-report',
      title: 'Occupancy Report',
      description: 'Property occupancy rates and trends',
      category: 'property',
      icon: <Building2 size={20} color={theme.colors.primary} />,
      color: theme.colors.primary,
      lastGenerated: '1 day ago',
      onView: () => router.push('/reports/occupancy'),
      onDownload: () => console.log('Download occupancy report'),
    },
    {
      id: 'maintenance-report',
      title: 'Maintenance Report',
      description: 'Maintenance costs and frequency analysis',
      category: 'property',
      icon: <Building2 size={20} color={theme.colors.warning} />,
      color: theme.colors.warning,
      lastGenerated: '2 days ago',
      onView: () => router.push('/reports/maintenance'),
      onDownload: () => console.log('Download maintenance report'),
    },
    {
      id: 'property-performance',
      title: 'Property Performance',
      description: 'Individual property ROI and metrics',
      category: 'property',
      icon: <TrendingUp size={20} color={theme.colors.success} />,
      color: theme.colors.success,
      lastGenerated: '3 days ago',
      onView: () => router.push('/reports/property-performance'),
      onDownload: () => console.log('Download property performance report'),
    },
    
    // Tenant Reports
    {
      id: 'tenant-report',
      title: 'Tenant Report',
      description: 'Tenant demographics and payment history',
      category: 'tenant',
      icon: <Users size={20} color={theme.colors.secondary} />,
      color: theme.colors.secondary,
      lastGenerated: '1 day ago',
      onView: () => router.push('/reports/tenants'),
      onDownload: () => console.log('Download tenant report'),
    },
    {
      id: 'payment-history',
      title: 'Payment History',
      description: 'Detailed payment tracking and late fees',
      category: 'tenant',
      icon: <DollarSign size={20} color={theme.colors.primary} />,
      color: theme.colors.primary,
      lastGenerated: '6 hours ago',
      onView: () => router.push('/reports/payment-history'),
      onDownload: () => console.log('Download payment history report'),
    },
    {
      id: 'lease-expiry',
      title: 'Lease Expiry Report',
      description: 'Upcoming lease renewals and expirations',
      category: 'tenant',
      icon: <Calendar size={20} color={theme.colors.warning} />,
      color: theme.colors.warning,
      lastGenerated: '2 days ago',
      onView: () => router.push('/reports/lease-expiry'),
      onDownload: () => console.log('Download lease expiry report'),
    },
    
    // Operations Reports
    {
      id: 'operations-summary',
      title: 'Operations Summary',
      description: 'Overall operational metrics and KPIs',
      category: 'operations',
      icon: <BarChart3 size={20} color={theme.colors.tertiary} />,
      color: theme.colors.tertiary,
      lastGenerated: '1 day ago',
      onView: () => router.push('/reports/operations'),
      onDownload: () => console.log('Download operations report'),
    },
    {
      id: 'vendor-report',
      title: 'Vendor Report',
      description: 'Vendor performance and cost analysis',
      category: 'operations',
      icon: <Users size={20} color={theme.colors.primary} />,
      color: theme.colors.primary,
      lastGenerated: '3 days ago',
      onView: () => router.push('/reports/vendors'),
      onDownload: () => console.log('Download vendor report'),
    },
  ];

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
            <Text style={styles.lastGenerated}>Last generated: {item.lastGenerated}</Text>
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
          View
        </Button>
        <Button
          mode="contained"
          onPress={item.onDownload}
          style={[styles.actionButton, { backgroundColor: item.color }]}
          contentStyle={styles.actionContent}
          icon={() => <Download size={16} color="white" />}
        >
          Download
        </Button>
      </View>
    </ModernCard>
  );

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Reports"
        subtitle="Analytics and insights"
        showLogo={true}
        onNotificationPress={() => router.push('/notifications')}
        onMenuPress={() => router.push('/menu')}
      />

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        >
          <StatCard
            title="Total Reports"
            value={stats.totalReports.toString()}
            color={theme.colors.primary}
            icon={<FileText size={20} color={theme.colors.primary} />}
          />
          <StatCard
            title="This Month"
            value={stats.generatedThisMonth.toString()}
            subtitle="Generated"
            color={theme.colors.success}
            icon={<TrendingUp size={20} color={theme.colors.success} />}
          />
          <StatCard
            title="Scheduled"
            value={stats.scheduledReports.toString()}
            subtitle="Auto-generated"
            color={theme.colors.secondary}
            icon={<Calendar size={20} color={theme.colors.secondary} />}
          />
          <StatCard
            title="Avg Time"
            value={stats.avgGenerationTime}
            subtitle="Generation time"
            color={theme.colors.warning}
            icon={<BarChart3 size={20} color={theme.colors.warning} />}
          />
        </ScrollView>
      </View>

      {/* Category Filter */}
      <View style={styles.filtersSection}>
        <SegmentedButtons
          value={activeCategory}
          onValueChange={setActiveCategory}
          buttons={[
            { value: 'financial', label: 'Financial' },
            { value: 'property', label: 'Property' },
            { value: 'tenant', label: 'Tenant' },
            { value: 'operations', label: 'Operations' },
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
            <Text style={styles.emptyStateTitle}>No reports available</Text>
            <Text style={styles.emptyStateSubtitle}>
              Reports for this category will appear here
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