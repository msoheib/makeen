import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { CustomLineChart, CustomPieChart } from '../../../components/charts';
import { reportsApi } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';

interface ExpenseData {
  totalExpenses: number;
  monthlyExpenses: Array<{
    month: string;
    amount: number;
  }>;
  categoryExpenses: Array<{
    category: string;
    amount: number;
  }>;
  vouchers: Array<{
    id: string;
    amount: number;
    description: string;
    date: string;
    accountName?: string;
  }>;
}

export default function ExpenseReportScreen() {
  const theme = useTheme();
  const [dateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
  });

  const { 
    data: expenseData, 
    loading, 
    error, 
    refetch 
  } = useApi<ExpenseData>(() => reportsApi.getExpenseReport(dateRange.startDate.toISOString(), dateRange.endDate.toISOString()), [dateRange]);

  // Prepare chart data
  const lineChartData = {
    labels: expenseData?.monthlyExpenses?.map(item => item.month.substring(0, 3)) || [],
    datasets: [{
      data: expenseData?.monthlyExpenses?.map(item => item.amount) || [0],
      color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`, // Red for expenses
      strokeWidth: 3,
    }],
  };

  const pieChartData = expenseData?.categoryExpenses?.map((item, index) => ({
    name: item.category,
    value: item.amount,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][index % 6],
  })) || [];

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
        <Stack.Screen 
          options={{ 
            title: 'Expense Report',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading expense data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen 
          options={{ 
            title: 'Expense Report',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
          }} 
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Failed to load expense data
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
      <Stack.Screen 
        options={{ 
          title: 'Expense Report',
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={[styles.summaryTitle, { color: theme.colors.onSurface }]}>
              Total Expenses
            </Text>
            <Text variant="headlineMedium" style={[styles.summaryAmount, { color: '#FF6B6B' }]}>
              {formatCurrency(expenseData?.totalExpenses || 0)}
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
              Monthly Expense Trend
            </Text>
            {expenseData?.monthlyExpenses && expenseData.monthlyExpenses.length > 0 ? (
              <CustomLineChart
                data={lineChartData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No expense data available for the selected period
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Category Breakdown */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Expenses by Category
            </Text>
            {expenseData?.categoryExpenses && expenseData.categoryExpenses.length > 0 ? (
              <CustomPieChart
                data={pieChartData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No category expense data available
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Recent Vouchers */}
        <Card style={[styles.vouchersCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Recent Payment Vouchers
            </Text>
            {expenseData?.vouchers && expenseData.vouchers.length > 0 ? (
              <View>
                {expenseData.vouchers.slice(0, 5).map((voucher, index) => (
                  <View key={voucher.id} style={styles.voucherRow}>
                    <View style={styles.voucherInfo}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                        {voucher.description}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {voucher.accountName || 'General'} • {formatDate(voucher.date)}
                      </Text>
                    </View>
                    <Text variant="bodyMedium" style={[styles.voucherAmount, { color: '#FF6B6B' }]}>
                      -{formatCurrency(voucher.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No recent expense vouchers found
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
              console.log('Date range picker coming soon');
            }}
            style={styles.actionButton}
            icon="calendar"
          >
            Change Date Range
          </Button>
          <Button
            mode="contained"
            onPress={() => {
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