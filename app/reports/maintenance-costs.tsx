import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import { useApi } from '@/hooks/useApi';
import { reportsApi } from '@/lib/api';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';
import { CustomLineChart, CustomBarChart, CustomPieChart } from '@/components/charts';
import DateRangePicker, { DateRange } from '@/components/DateRangePicker';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Wrench,
  Home,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react-native';

// Types for maintenance cost data
interface MaintenanceCostSummary {
  totalCosts: number;
  avgCostPerProperty: number;
  totalRequests: number;
  avgCostPerRequest: number;
  monthlyChange: number;
  lastUpdated: string;
}

interface PropertyMaintenanceCost {
  id: string;
  propertyName: string;
  totalCost: number;
  requestCount: number;
  avgCostPerRequest: number;
  costPerSqm: number;
  lastMaintenanceDate: string;
}

interface MaintenanceTrendData {
  month: string;
  totalCost: number;
  requestCount: number;
}

interface PriorityDistribution {
  priority: string;
  cost: number;
  percentage: number;
  color: string;
}

export default function MaintenanceCostsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // API calls for maintenance cost data
  const { 
    data: maintenanceData, 
    loading: maintenanceLoading, 
    error: maintenanceError,
    refetch: refetchMaintenance 
  } = useApi(() => reportsApi.getMaintenanceReport(), []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchMaintenance();
    setRefreshing(false);
  };

  // TODO: Integrate with maintenance API when available
  const costSummary: MaintenanceCostSummary = {
    totalCosts: 0,
    avgCostPerProperty: 0,
    totalRequests: 0,
    avgCostPerRequest: 0,
    monthlyChange: 0,
    lastUpdated: new Date().toISOString()
  };

  const propertyMaintenanceCosts: PropertyMaintenanceCost[] = [];
  const monthlyTrends: MaintenanceTrendData[] = [];
  const priorityDistribution: PriorityDistribution[] = [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyShort = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K SAR`;
    }
    return `${amount} SAR`;
  };

  const renderPropertyCard = (property: PropertyMaintenanceCost) => (
    <ModernCard key={property.id} style={styles.propertyCard}>
      <View style={styles.propertyHeader}>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>{property.propertyName}</Text>
          <Text style={styles.propertyTotal}>{formatCurrency(property.totalCost)}</Text>
        </View>
        <View style={styles.propertyStats}>
          <Text style={styles.statLabel}>{property.requestCount} requests</Text>
        </View>
      </View>
      
      <View style={styles.propertyMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Avg per Request</Text>
          <Text style={styles.metricValue}>{formatCurrencyShort(property.avgCostPerRequest)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Cost per sqm</Text>
          <Text style={styles.metricValue}>{property.costPerSqm.toFixed(1)} SAR</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Last Service</Text>
          <Text style={styles.metricValue}>
            {new Date(property.lastMaintenanceDate).toLocaleDateString('en-GB')}
          </Text>
        </View>
      </View>
    </ModernCard>
  );

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Maintenance Costs"
        subtitle="Cost analysis and spending insights"
        showBack
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Summary Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Cost Overview</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsContainer}
          >
            <StatCard
              title="Total Costs"
              value={formatCurrencyShort(costSummary.totalCosts)}
              color={theme.colors.primary}
              icon={<DollarSign size={20} color={theme.colors.primary} />}
              loading={maintenanceLoading}
            />
            <StatCard
              title="Avg per Property"
              value={formatCurrencyShort(costSummary.avgCostPerProperty)}
              color={theme.colors.secondary}
              icon={<Home size={20} color={theme.colors.secondary} />}
              loading={maintenanceLoading}
            />
            <StatCard
              title="Total Requests"
              value={costSummary.totalRequests.toString()}
              color={theme.colors.warning}
              icon={<Wrench size={20} color={theme.colors.warning} />}
              loading={maintenanceLoading}
            />
            <StatCard
              title="Monthly Change"
              value={`+${costSummary.monthlyChange}%`}
              subtitle="vs last month"
              color={theme.colors.success}
              icon={<TrendingUp size={20} color={theme.colors.success} />}
              loading={maintenanceLoading}
            />
          </ScrollView>
        </View>

        {/* Monthly Spending Trends */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Monthly Spending Trends</Text>
          <ModernCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Maintenance Costs Over Time</Text>
              <Text style={styles.chartSubtitle}>Last 5 months</Text>
            </View>
            <CustomLineChart
              data={monthlyTrends.map(item => ({
                label: item.month,
                value: item.totalCost
              }))}
              height={220}
              color={theme.colors.primary}
              showValues={true}
              formatValue={(value) => formatCurrencyShort(value)}
            />
          </ModernCard>
        </View>

        {/* Priority Distribution */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Cost by Priority</Text>
          <ModernCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Priority Distribution</Text>
              <Text style={styles.chartSubtitle}>Current month breakdown</Text>
            </View>
            <CustomPieChart
              data={priorityDistribution.map(item => ({
                label: item.priority,
                value: item.cost,
                color: item.color
              }))}
              height={250}
              showLegend={true}
              formatValue={(value) => formatCurrencyShort(value)}
            />
          </ModernCard>
        </View>

        {/* Request Volume Trends */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Request Volume</Text>
          <ModernCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Monthly Request Count</Text>
              <Text style={styles.chartSubtitle}>Maintenance requests over time</Text>
            </View>
            <CustomBarChart
              data={monthlyTrends.map(item => ({
                label: item.month,
                value: item.requestCount
              }))}
              height={200}
              color={theme.colors.secondary}
              showValues={true}
            />
          </ModernCard>
        </View>

        {/* Property-Specific Analysis */}
        <View style={styles.propertiesSection}>
          <Text style={styles.sectionTitle}>Property Analysis</Text>
          <Text style={styles.sectionSubtitle}>
            Maintenance costs and efficiency by property
          </Text>
          {propertyMaintenanceCosts.map(renderPropertyCard)}
        </View>

        {/* Key Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          <ModernCard style={styles.insightCard}>
            <View style={styles.insightItem}>
              <AlertTriangle size={20} color={theme.colors.warning} />
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>High Priority Focus</Text>
                <Text style={styles.insightDescription}>
                  40% of maintenance costs are urgent priority items. Consider preventive maintenance.
                </Text>
              </View>
            </View>
            
            <View style={styles.insightItem}>
              <TrendingUp size={20} color={theme.colors.success} />
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>Cost Efficiency</Text>
                <Text style={styles.insightDescription}>
                  Commercial properties show lower cost per sqm, indicating better maintenance efficiency.
                </Text>
              </View>
            </View>
            
            <View style={styles.insightItem}>
              <Calendar size={20} color={theme.colors.primary} />
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>Seasonal Pattern</Text>
                <Text style={styles.insightDescription}>
                  15.5% increase this month suggests seasonal maintenance spike in December.
                </Text>
              </View>
            </View>
          </ModernCard>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  statsSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  statsContainer: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chartSection: {
    padding: spacing.md,
    paddingTop: 0,
  },
  chartCard: {
    padding: spacing.md,
  },
  chartHeader: {
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  chartSubtitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  propertiesSection: {
    padding: spacing.md,
    paddingTop: 0,
  },
  propertyCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  propertyTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  propertyStats: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  propertyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  insightsSection: {
    padding: spacing.md,
    paddingTop: 0,
  },
  insightCard: {
    padding: spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  insightText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  insightDescription: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 16,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
}); 