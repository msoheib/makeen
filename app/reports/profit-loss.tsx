import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { CustomLineChart, CustomBarChart } from '@/components/charts';
import { reportsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

interface ProfitLossData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  monthlyComparison: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  yearOverYear: {
    currentYear: number;
    previousYear: number;
    growth: number;
  };
}

export default function ProfitLossReportScreen() {
  const theme = useTheme();
  const [dateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
  });

  // Fetch both revenue and expense data
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
  const totalRevenue = revenueData?.totalRevenue || 0;
  const totalExpenses = expenseData?.totalExpenses || 0;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Prepare chart data with proper validation
  const comparisonData = {
    labels: revenueData?.monthlyData?.map(item => item.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: revenueData?.monthlyData?.map(item => {
          const amount = Number(item?.amount || 0);
          return isNaN(amount) ? 0 : amount;
        }) || [0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 3,
      },
      {
        data: expenseData?.monthlyData?.map(item => {
          const amount = Number(item?.amount || 0);
          return isNaN(amount) ? 0 : amount;
        }) || [0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
        strokeWidth: 3,
      },
    ],
    legend: ['Revenue', 'Expenses'],
  };

  const profitData = {
    labels: revenueData?.monthlyData?.map(item => item.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: revenueData?.monthlyData?.map((item, index) => {
        const revenue = Number(item?.amount || 0);
        const expense = Number(expenseData?.monthlyData?.[index]?.amount || 0);
        const profit = (isNaN(revenue) ? 0 : revenue) - (isNaN(expense) ? 0 : expense);
        return isNaN(profit) ? 0 : profit;
      }) || [0, 0, 0, 0, 0, 0],
      color: (opacity = 1) => `rgba(46, 213, 115, ${opacity})`,
      strokeWidth: 3,
    }],
  };

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen 
          options={{ 
            title: 'Profit & Loss Report',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading financial data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Profit & Loss Report',
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Key Metrics Cards */}
        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Total Revenue
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.primary, textAlign: 'center', fontWeight: 'bold' }}>
                {formatCurrency(totalRevenue)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Total Expenses
              </Text>
              <Text variant="titleMedium" style={{ color: '#FF6B6B', textAlign: 'center', fontWeight: 'bold' }}>
                {formatCurrency(totalExpenses)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Net Profit
              </Text>
              <Text variant="titleMedium" style={{ 
                color: netProfit >= 0 ? '#2ED573' : '#FF6B6B', 
                textAlign: 'center', 
                fontWeight: 'bold' 
              }}>
                {formatCurrency(netProfit)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Profit Margin
              </Text>
              <Text variant="titleMedium" style={{ 
                color: profitMargin >= 0 ? '#2ED573' : '#FF6B6B', 
                textAlign: 'center', 
                fontWeight: 'bold' 
              }}>
                {formatPercentage(profitMargin)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Revenue vs Expenses Comparison */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Revenue vs Expenses Comparison
            </Text>
            {comparisonData.labels.length > 0 && comparisonData.datasets[0].data.length > 0 ? (
              <CustomLineChart
                data={comparisonData}
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

        {/* Monthly Profit Trend */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Monthly Profit Trend
            </Text>
            {profitData.labels.length > 0 && profitData.datasets[0].data.length > 0 ? (
              <CustomLineChart
                data={profitData}
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

        {/* Financial Summary */}
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Financial Summary
            </Text>
            
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                Gross Revenue
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                {formatCurrency(totalRevenue)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                Total Operating Expenses
              </Text>
              <Text variant="bodyMedium" style={{ color: '#FF6B6B', fontWeight: '600' }}>
                -{formatCurrency(totalExpenses)}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                Net Income
              </Text>
              <Text variant="titleMedium" style={{ 
                color: netProfit >= 0 ? '#2ED573' : '#FF6B6B', 
                fontWeight: 'bold' 
              }}>
                {formatCurrency(netProfit)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Profit Margin Ratio
              </Text>
              <Text variant="bodyMedium" style={{ 
                color: profitMargin >= 0 ? '#2ED573' : '#FF6B6B', 
                fontWeight: '600' 
              }}>
                {formatPercentage(profitMargin)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={() => {
              console.log('Year comparison coming soon');
            }}
            style={styles.actionButton}
            icon="chart-line"
          >
            Year Comparison
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              console.log('Export P&L statement coming soon');
            }}
            style={styles.actionButton}
            icon="download"
          >
            Export P&L
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
  summaryCard: {
    marginBottom: 16,
    elevation: 2,
  },
  summaryRow: {
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