import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CustomLineChart, CustomBarChart } from '@/components/charts';
import { reportsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import ModernHeader from '@/components/ModernHeader';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: {
    month: string;
    amount: number;
  }[];
  propertyRevenue: {
    propertyName: string;
    amount: number;
  }[];
  vouchers: {
    id: string;
    amount: number;
    description: string;
    date: string;
    propertyName?: string;
  }[];
}

export default function RevenueReportScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1), // Start of year
    endDate: new Date(), // Today
  });

  const [period, setPeriod] = useState<'monthly' | 'semiAnnual' | 'annual'>('annual');

  const computeRangeForPeriod = (p: 'monthly' | 'semiAnnual' | 'annual') => {
    const now = new Date();
    const year = now.getFullYear();
    if (p === 'monthly') {
      const start = new Date(year, now.getMonth(), 1);
      const end = new Date(year, now.getMonth() + 1, 0);
      return { startDate: start, endDate: end };
    }
    if (p === 'semiAnnual') {
      const month = now.getMonth();
      const halfStartMonth = month < 6 ? 0 : 6; // H1 or H2
      const halfEndMonth = month < 6 ? 5 : 11;  // inclusive end month
      const start = new Date(year, halfStartMonth, 1);
      const end = new Date(year, halfEndMonth + 1, 0);
      return { startDate: start, endDate: end };
    }
    // annual
    return { startDate: new Date(year, 0, 1), endDate: new Date(year, 11, 31) };
  };

  useEffect(() => {
    const range = computeRangeForPeriod(period);
    setDateRange(range);
  }, [period]);

  const { 
    data: revenueData, 
    loading, 
    error, 
    refetch 
  } = useApi<RevenueData>(() => reportsApi.getRevenueReport(dateRange.startDate.toISOString(), dateRange.endDate.toISOString()), [dateRange]);

  // Prepare chart data
  const lineChartData = {
    labels: revenueData?.monthlyRevenue?.map(item => item.month.substring(0, 3)) || [],
    datasets: [{
      data: revenueData?.monthlyRevenue?.map(item => item.amount) || [0],
      color: (opacity = 1) => `rgba(43, 92, 230, ${opacity})`, // Primary blue
      strokeWidth: 3,
    }],
  };

  const barChartData = {
    labels: revenueData?.propertyRevenue?.slice(0, 5).map(item => 
      item.propertyName.length > 10 ? item.propertyName.substring(0, 10) + '...' : item.propertyName
    ) || [],
    datasets: [{
      data: revenueData?.propertyRevenue?.slice(0, 5).map(item => item.amount) || [0],
    }],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader
          title="Revenue Report"
          subtitle="Loading revenue data..."
          showNotifications={false}
          showSearch={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading revenue data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader
          title="Revenue Report"
          subtitle="Failed to load data"
          showNotifications={false}
          showSearch={false}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Failed to load revenue data
          </Text>
          <Button mode="contained" onPress={refetch} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader
        title="Revenue Report"
        subtitle="Financial performance analysis"
        showNotifications={false}
        showSearch={false}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelectorContainer}>
          {[
            { id: 'monthly', label: 'Monthly' },
            { id: 'semiAnnual', label: 'Semi-Annual' },
            { id: 'annual', label: 'Annual' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.periodChip,
                { borderColor: theme.colors.outline },
                period === (opt.id as any) && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setPeriod(opt.id as any)}
            >
              <Text
                style={{
                  color: period === (opt.id as any) ? theme.colors.onPrimary : theme.colors.onSurface,
                  fontWeight: '600',
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Summary Card */}
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={[styles.summaryTitle, { color: theme.colors.onSurface }]}>
              Total Revenue
            </Text>
            <Text variant="headlineMedium" style={[styles.summaryAmount, { color: theme.colors.primary }]}>
              {formatCurrency(revenueData?.totalRevenue || 0)}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {dateRange.startDate.getFullYear()} to {dateRange.endDate.toLocaleDateString()}
            </Text>
          </Card.Content>
        </Card>

        {/* Monthly Trend Chart */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Monthly Revenue Trend
            </Text>
            {revenueData?.monthlyRevenue && revenueData.monthlyRevenue.length > 0 ? (
              <CustomLineChart
                data={lineChartData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No revenue data available for the selected period
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Property Revenue Breakdown */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Revenue by Property (Top 5)
            </Text>
            {revenueData?.propertyRevenue && revenueData.propertyRevenue.length > 0 ? (
              <CustomBarChart
                data={barChartData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No property revenue data available
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Recent Vouchers */}
        <Card style={[styles.vouchersCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Recent Receipt Vouchers
            </Text>
            {revenueData?.vouchers && revenueData.vouchers.length > 0 ? (
              <View>
                {revenueData.vouchers.slice(0, 5).map((voucher, index) => (
                  <View key={voucher.id} style={styles.voucherRow}>
                    <View style={styles.voucherInfo}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                        {voucher.description}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {voucher.propertyName || 'General'} • {formatDate(voucher.date)}
                      </Text>
                    </View>
                    <Text variant="bodyMedium" style={[styles.voucherAmount, { color: theme.colors.primary }]}>
                      {formatCurrency(voucher.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No recent vouchers found
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={() => {
              // set to monthly as a quick toggle for now (placeholder for full picker)
              setPeriod('monthly');
            }}
            style={styles.actionButton}
            icon="calendar"
          >
            Change Date Range
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              // Future: Implement export functionality
              console.log('Export functionality coming soon');
            }}
            style={styles.actionButton}
            icon="download"
          >
            Export Report
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  summaryCard: {
    marginBottom: 16,
    elevation: 2,
  },
  summaryTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  summaryAmount: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chartCard: {
    marginBottom: 16,
    elevation: 2,
  },
  chartTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  chart: {
    alignSelf: 'center',
  },
  noDataContainer: {
    padding: 32,
    alignItems: 'center',
  },
  vouchersCard: {
    marginBottom: 16,
    elevation: 2,
  },
  voucherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  voucherInfo: {
    flex: 1,
    marginRight: 16,
  },
  voucherAmount: {
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 32,
  },
  actionButton: {
    flex: 0.48,
  },
}); 