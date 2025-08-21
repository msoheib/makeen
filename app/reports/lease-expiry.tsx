import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { CustomLineChart, CustomBarChart, CustomPieChart } from '@/components/charts';
import { reportsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

interface LeaseExpiryData {
  summary: {
    totalActiveLeases: number;
    expiringThisMonth: number;
    expiringNext3Months: number;
    avgLeaseDuration: number;
    renewalRate: number;
    avgDaysNotice: number;
  };
  expiryTrends: {
    month: string;
    expiringLeases: number;
    renewedLeases: number;
    newLeases: number;
  }[];
  upcomingExpiries: {
    tenantName: string;
    propertyName: string;
    expiryDate: string;
    daysUntilExpiry: number;
    leaseDuration: number;
    monthlyRent: number;
    renewalStatus: 'pending' | 'renewed' | 'not-renewing' | 'undecided';
  }[];
  leaseDurationDistribution: {
    duration: string;
    count: number;
  }[];
}

export default function LeaseExpiryReportScreen() {
  const theme = useTheme();
  const [dateRange] = useState({
    startDate: new Date(),
    endDate: new Date(new Date().getFullYear() + 1, 11, 31),
  });

  const { 
    data: leaseData, 
    loading, 
    error, 
    refetch 
  } = useApi<LeaseExpiryData>(() => reportsApi.getTenantReport(
    dateRange.startDate.toISOString(), 
    dateRange.endDate.toISOString()
  ), [dateRange]);

  const dataToUse = leaseData;

  // Prepare chart data
  const expiryTrendData = {
    labels: dataToUse.expiryTrends?.map(item => item.month.substring(0, 3)) || [],
    datasets: [
      {
        data: dataToUse.expiryTrends?.map(item => item.expiringLeases) || [0],
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
        strokeWidth: 3,
      },
      {
        data: dataToUse.expiryTrends?.map(item => item.renewedLeases) || [0],
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const newLeasesData = {
    labels: dataToUse.expiryTrends?.map(item => item.month.substring(0, 3)) || [],
    datasets: [{
      data: dataToUse.expiryTrends?.map(item => item.newLeases) || [0],
    }],
  };

  const leaseDurationData = dataToUse.leaseDurationDistribution?.map((duration, index) => ({
    name: duration.duration,
    value: duration.count,
    color: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'][index % 4],
  })) || [];

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

  const getRenewalStatusColor = (status: string) => {
    switch (status) {
      case 'renewed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'not-renewing': return '#F44336';
      case 'undecided': return '#9E9E9E';
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getRenewalStatusLabel = (status: string) => {
    switch (status) {
      case 'renewed': return 'Renewed';
      case 'pending': return 'Pending';
      case 'not-renewing': return 'Not Renewing';
      case 'undecided': return 'Undecided';
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

  const getExpiryUrgency = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 30) return 'urgent';
    if (daysUntilExpiry <= 90) return 'warning';
    return 'normal';
  };

  const getExpiryUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return '#F44336';
      case 'warning': return '#FF9800';
      case 'normal': return '#4CAF50';
      default: return theme.colors.onSurfaceVariant;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen 
          options={{ 
            title: 'Lease Expiry',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading lease expiry data...
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
            title: 'Lease Expiry',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
          }} 
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Failed to load lease expiry data
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
          title: 'Lease Expiry',
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Lease Summary */}
        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Active Leases
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.primary, textAlign: 'center', fontWeight: 'bold' }}>
                {dataToUse.summary?.totalActiveLeases || 0}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Expiring This Month
              </Text>
              <Text variant="titleMedium" style={{ color: '#F44336', textAlign: 'center', fontWeight: 'bold' }}>
                {dataToUse.summary?.expiringThisMonth || 0}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Next 3 Months
              </Text>
              <Text variant="titleMedium" style={{ color: '#FF9800', textAlign: 'center', fontWeight: 'bold' }}>
                {dataToUse.summary?.expiringNext3Months || 0}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Renewal Rate
              </Text>
              <Text variant="titleMedium" style={{ color: '#4CAF50', textAlign: 'center', fontWeight: 'bold' }}>
                {formatPercentage(dataToUse.summary?.renewalRate || 0)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Lease Expiry & Renewal Trends */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Lease Expiry & Renewal Trends
            </Text>
            {dataToUse.expiryTrends && dataToUse.expiryTrends.length > 0 ? (
              <CustomLineChart
                data={expiryTrendData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No expiry trend data available
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* New Leases by Month */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              New Leases by Month
            </Text>
            {dataToUse.expiryTrends && dataToUse.expiryTrends.length > 0 ? (
              <CustomBarChart
                data={newLeasesData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No new lease data available
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Lease Duration Distribution */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Lease Duration Distribution
            </Text>
            {leaseDurationData && leaseDurationData.length > 0 ? (
              <CustomPieChart
                data={leaseDurationData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No lease duration data available
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Upcoming Lease Expiries */}
        <Card style={[styles.propertiesCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Upcoming Lease Expiries
            </Text>
            {dataToUse.upcomingExpiries && dataToUse.upcomingExpiries.length > 0 ? (
              <View>
                {dataToUse.upcomingExpiries.map((lease, index) => (
                  <View key={index} style={styles.propertyRow}>
                    <View style={styles.propertyInfo}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                        {lease.tenantName}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
                        {lease.propertyName}
                      </Text>
                      <View style={styles.propertyMetrics}>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Expires: {formatDate(lease.expiryDate)}
                        </Text>
                        <Text variant="bodySmall" style={{ 
                          color: getExpiryUrgencyColor(getExpiryUrgency(lease.daysUntilExpiry)) 
                        }}>
                          {lease.daysUntilExpiry} days remaining
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Monthly Rent: {formatCurrency(lease.monthlyRent)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.propertyValues}>
                      <Chip 
                        mode="outlined" 
                        textStyle={{ 
                          color: getRenewalStatusColor(lease.renewalStatus),
                          fontSize: 12 
                        }}
                        style={{ 
                          borderColor: getRenewalStatusColor(lease.renewalStatus),
                          marginBottom: 4 
                        }}
                      >
                        {getRenewalStatusLabel(lease.renewalStatus)}
                      </Chip>
                      <Text variant="bodySmall" style={{ 
                        color: getExpiryUrgencyColor(getExpiryUrgency(lease.daysUntilExpiry)),
                        textAlign: 'center' 
                      }}>
                        {lease.leaseDuration} months
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No upcoming expiries found
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
              console.log('Send renewal notifications coming soon');
            }}
            style={styles.actionButton}
            icon="bell-ring"
          >
            Send Notifications
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              console.log('Export expiry report coming soon');
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