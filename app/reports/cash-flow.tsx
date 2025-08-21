import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ModernHeader from '@/components/ModernHeader';
import { CustomLineChart, CustomBarChart } from '@/components/charts';
import { reportsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

interface CashFlowData {
  cashPosition: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  netCashFlow: number;
  monthlyCashFlow: {
    month: string;
    inflow: number;
    outflow: number;
    netFlow: number;
    position: number;
  }[];
}

export default function CashFlowReportScreen() {
  const theme = useTheme();
  const [dateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
  });

  // Fetch both revenue and expense data to calculate cash flow
  const { 
    data: revenueData, 
    loading: revenueLoading 
  } = useApi(() => reportsApi.getRevenueReport(dateRange.startDate.toISOString(), dateRange.endDate.toISOString()), [dateRange]);

  const { 
    data: expenseData, 
    loading: expenseLoading 
  } = useApi(() => reportsApi.getExpenseReport(dateRange.startDate.toISOString(), dateRange.endDate.toISOString()), [dateRange]);

  const loading = revenueLoading || expenseLoading;

  // Calculate derived values
  const totalInflow = revenueData?.totalRevenue || 0;
  const totalOutflow = expenseData?.totalExpenses || 0;
  const netCashFlow = totalInflow - totalOutflow;
  const runningCashPosition = 50000 + netCashFlow; // Starting with base cash position

  // Prepare chart data with proper validation  
  const cashFlowData = {
    labels: revenueData?.monthlyBreakdown?.map(item => item.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: revenueData?.monthlyBreakdown?.map((item, index) => {
        const inflow = item.revenue || 0;
        const outflow = expenseData?.monthlyBreakdown?.[index]?.expenses || 0;
        return 50000 + (inflow - outflow); // Cumulative cash position
      }) || [50000, 50000, 50000, 50000, 50000, 50000],
      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
      strokeWidth: 3,
    }],
  };

  const inflowOutflowData = {
    labels: revenueData?.monthlyBreakdown?.map(item => item.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: revenueData?.monthlyBreakdown?.map(item => item.revenue) || [0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(46, 213, 115, ${opacity})`,
      },
      {
        data: expenseData?.monthlyBreakdown?.map(item => item.expenses) || [0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
      },
    ],
    legend: ['Inflow', 'Outflow'],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader
          title="Cash Flow Report"
          subtitle="Loading cash flow data..."
          showNotifications={false}
          showSearch={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading cash flow data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader
        title="Cash Flow Report"
        subtitle="Cash inflows and outflows analysis"
        showNotifications={false}
        showSearch={false}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cash Flow Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleLarge" style={[styles.summaryTitle, { color: theme.colors.onSurface }]}>
                Current Cash Position
              </Text>
              <Text variant="headlineMedium" style={[styles.summaryAmount, { color: theme.colors.primary }]}>
                {formatCurrency(runningCashPosition)}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                As of {new Date().toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Total Inflow
              </Text>
              <Text variant="titleMedium" style={{ color: '#2ED573', textAlign: 'center', fontWeight: 'bold' }}>
                {formatCurrency(totalInflow)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Total Outflow
              </Text>
              <Text variant="titleMedium" style={{ color: '#FF6B6B', textAlign: 'center', fontWeight: 'bold' }}>
                {formatCurrency(totalOutflow)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Net Cash Flow
              </Text>
              <Text variant="titleMedium" style={{ 
                color: netCashFlow >= 0 ? '#2ED573' : '#FF6B6B', 
                textAlign: 'center', 
                fontWeight: 'bold' 
              }}>
                {formatCurrency(netCashFlow)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Liquidity Ratio
              </Text>
              <Text variant="titleMedium" style={{ 
                color: theme.colors.primary, 
                textAlign: 'center', 
                fontWeight: 'bold' 
              }}>
                {totalOutflow > 0 ? (totalInflow / totalOutflow).toFixed(2) : '∞'}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Cash Position Trend */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Cash Position Trend
            </Text>
            {cashFlowData.labels.length > 0 && cashFlowData.datasets[0].data.length > 0 ? (
              <CustomLineChart
                data={cashFlowData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  No data available for chart display
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Inflow vs Outflow Comparison */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Monthly Inflow vs Outflow (Last 6 Months)
            </Text>
            {inflowOutflowData.labels.length > 0 && inflowOutflowData.datasets[0].data.length > 0 ? (
              <CustomBarChart
                data={inflowOutflowData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  No data available for chart display
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Cash Flow Analysis */}
        <Card style={[styles.analysisCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Cash Flow Analysis
            </Text>
            
            <View style={styles.analysisRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                Operating Cash Flow
              </Text>
              <Text variant="bodyMedium" style={{ 
                color: netCashFlow >= 0 ? '#2ED573' : '#FF6B6B', 
                fontWeight: '600' 
              }}>
                {formatCurrency(netCashFlow)}
              </Text>
            </View>

            <View style={styles.analysisRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                Cash Flow Margin
              </Text>
              <Text variant="bodyMedium" style={{ 
                color: theme.colors.primary, 
                fontWeight: '600' 
              }}>
                {totalInflow > 0 ? ((netCashFlow / totalInflow) * 100).toFixed(1) : '0.0'}%
              </Text>
            </View>

            <View style={styles.analysisRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                Monthly Average Inflow
              </Text>
              <Text variant="bodyMedium" style={{ color: '#2ED573', fontWeight: '600' }}>
                {formatCurrency(totalInflow / 12)}
              </Text>
            </View>

            <View style={styles.analysisRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                Monthly Average Outflow
              </Text>
              <Text variant="bodyMedium" style={{ color: '#FF6B6B', fontWeight: '600' }}>
                {formatCurrency(totalOutflow / 12)}
              </Text>
            </View>

            <View style={[styles.analysisRow, styles.totalRow]}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                Cash Runway (Months)
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                {totalOutflow > 0 ? Math.floor(runningCashPosition / (totalOutflow / 12)) : '∞'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={() => {
              console.log('Cash flow forecast coming soon');
            }}
            style={styles.actionButton}
            icon="trending-up"
          >
            View Forecast
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              console.log('Export cash flow statement coming soon');
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
  summaryContainer: {
    marginBottom: 16,
  },
  summaryCard: {
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
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 0.48,
    elevation: 2,
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
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisCard: {
    marginBottom: 16,
    elevation: 2,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalRow: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 8,
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