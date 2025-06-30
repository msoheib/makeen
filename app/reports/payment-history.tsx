import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { CustomLineChart, CustomBarChart, CustomPieChart } from '@/components/charts';
import { reportsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

interface PaymentHistoryData {
  summary: {
    totalTenants: number;
    onTimePayers: number;
    latePayers: number;
    totalReceived: number;
    totalOutstanding: number;
    avgPaymentDelay: number;
  };
  paymentTrends: Array<{
    month: string;
    onTimePayments: number;
    latePayments: number;
    totalAmount: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  tenantPayments: Array<{
    tenantName: string;
    paymentStatus: 'current' | 'late' | 'overdue';
    lastPaymentDate: string;
    amountDue: number;
    daysSincePayment: number;
  }>;
}

export default function PaymentHistoryReportScreen() {
  const theme = useTheme();
  const [dateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
  });

  const { 
    data: paymentData, 
    loading, 
    error, 
    refetch 
  } = useApi<PaymentHistoryData>(() => reportsApi.getTenantReport(dateRange.startDate.toISOString(), dateRange.endDate.toISOString()), [dateRange]);

  const dataToUse = paymentData;

  // Prepare chart data
  const paymentTrendData = {
    labels: dataToUse.paymentTrends?.map(item => item.month.substring(0, 3)) || [],
    datasets: [
      {
        data: dataToUse.paymentTrends?.map(item => item.onTimePayments) || [0],
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 3,
      },
      {
        data: dataToUse.paymentTrends?.map(item => item.latePayments) || [0],
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const paymentMethodsData = dataToUse.paymentMethods?.map((method, index) => ({
    name: method.method,
    value: method.amount,
    color: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'][index % 4],
  })) || [];

  const monthlyAmountData = {
    labels: dataToUse.paymentTrends?.map(item => item.month.substring(0, 3)) || [],
    datasets: [{
      data: dataToUse.paymentTrends?.map(item => item.totalAmount) || [0],
    }],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'current': return '#4CAF50';
      case 'late': return '#FF9800';
      case 'overdue': return '#F44336';
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'current': return 'Current';
      case 'late': return 'Late';
      case 'overdue': return 'Overdue';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen 
          options={{ 
            title: 'Payment History',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading payment history...
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
            title: 'Payment History',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
          }} 
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Failed to load payment data
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
          title: 'Payment History',
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Payment Summary */}
        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Total Tenants
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.primary, textAlign: 'center', fontWeight: 'bold' }}>
                {dataToUse.summary?.totalTenants || 0}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                On-Time Payers
              </Text>
              <Text variant="titleMedium" style={{ color: '#4CAF50', textAlign: 'center', fontWeight: 'bold' }}>
                {dataToUse.summary?.onTimePayers || 0}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Total Received
              </Text>
              <Text variant="titleMedium" style={{ color: '#4CAF50', textAlign: 'center', fontWeight: 'bold' }}>
                {formatCurrency(dataToUse.summary?.totalReceived || 0)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Outstanding
              </Text>
              <Text variant="titleMedium" style={{ color: '#F44336', textAlign: 'center', fontWeight: 'bold' }}>
                {formatCurrency(dataToUse.summary?.totalOutstanding || 0)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Average Payment Delay */}
        <Card style={[styles.fullWidthCard, { backgroundColor: theme.colors.surface, marginBottom: 16 }]}>
          <Card.Content>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Average Payment Delay
            </Text>
            <Text variant="titleLarge" style={{ color: '#FF9800', textAlign: 'center', fontWeight: 'bold' }}>
              {dataToUse.summary?.avgPaymentDelay || 0} days
            </Text>
          </Card.Content>
        </Card>

        {/* Payment Performance Trends */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Payment Performance Trends
            </Text>
            {dataToUse.paymentTrends && dataToUse.paymentTrends.length > 0 ? (
              <CustomLineChart
                data={paymentTrendData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No payment trend data available
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Monthly Payment Amounts */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Monthly Payment Amounts
            </Text>
            {dataToUse.paymentTrends && dataToUse.paymentTrends.length > 0 ? (
              <CustomBarChart
                data={monthlyAmountData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No payment amount data available
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Payment Methods Distribution */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Payment Methods Distribution
            </Text>
            {paymentMethodsData && paymentMethodsData.length > 0 ? (
              <CustomPieChart
                data={paymentMethodsData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No payment method data available
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Tenant Payment Details */}
        <Card style={[styles.propertiesCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Individual Tenant Payment Status
            </Text>
            {dataToUse.tenantPayments && dataToUse.tenantPayments.length > 0 ? (
              <View>
                {dataToUse.tenantPayments.map((tenant, index) => (
                  <View key={index} style={styles.propertyRow}>
                    <View style={styles.propertyInfo}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                        {tenant.tenantName}
                      </Text>
                      <View style={styles.propertyMetrics}>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Last Payment: {formatDate(tenant.lastPaymentDate)}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Amount Due: {formatCurrency(tenant.amountDue)}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Days Since Payment: {tenant.daysSincePayment}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.propertyValues}>
                      <Chip 
                        mode="outlined" 
                        textStyle={{ 
                          color: getPaymentStatusColor(tenant.paymentStatus),
                          fontSize: 12 
                        }}
                        style={{ 
                          borderColor: getPaymentStatusColor(tenant.paymentStatus),
                          marginBottom: 4 
                        }}
                      >
                        {getPaymentStatusLabel(tenant.paymentStatus)}
                      </Chip>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No tenant payment data available
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
              console.log('Send payment reminders coming soon');
            }}
            style={styles.actionButton}
            icon="email-send"
          >
            Send Reminders
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              console.log('Export payment report coming soon');
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
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 0.48,
    elevation: 2,
  },
  fullWidthCard: {
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
    padding: 32,
    alignItems: 'center',
  },
  propertiesCard: {
    marginBottom: 16,
    elevation: 2,
  },
  propertyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  propertyInfo: {
    flex: 1,
    marginRight: 16,
  },
  propertyMetrics: {
    marginTop: 8,
    gap: 4,
  },
  propertyValues: {
    alignItems: 'flex-end',
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