import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CustomLineChart, CustomBarChart } from '@/components/charts';
import { reportsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import ModernHeader from '@/components/ModernHeader';
import { MaterialIcons } from '@expo/vector-icons';

interface WaterMetersData {
  totalWaterMeters: number;
  totalConsumption: number;
  totalAmount: number;
  averageConsumption: number;
  monthlyBreakdown: { month: string; consumption: number; amount: number; year: number }[];
  propertyBreakdown: { propertyId: string; propertyTitle: string; consumption: number; amount: number; meterNumber: string }[];
  paymentStatusBreakdown: { pending: number; paid: number; overdue: number };
  lastGenerated: string;
}

export default function WaterMetersReportScreen() {
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
    data: waterData, 
    loading, 
    error, 
    refetch 
  } = useApi<WaterMetersData>(() => reportsApi.getWaterMetersReport(dateRange.startDate.toISOString(), dateRange.endDate.toISOString()), [dateRange]);

  // Prepare chart data
  const consumptionChartData = {
    labels: waterData?.monthlyBreakdown?.map(item => item.month.substring(0, 3)) || [],
    datasets: [{
      data: waterData?.monthlyBreakdown?.map(item => item.consumption) || [0],
      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue for water
      strokeWidth: 3,
    }],
  };

  const amountChartData = {
    labels: waterData?.monthlyBreakdown?.map(item => item.month.substring(0, 3)) || [],
    datasets: [{
      data: waterData?.monthlyBreakdown?.map(item => item.amount) || [0],
      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for amount
      strokeWidth: 3,
    }],
  };

  const propertyChartData = {
    labels: waterData?.propertyBreakdown?.slice(0, 5).map(item => 
      item.propertyTitle.length > 10 ? item.propertyTitle.substring(0, 10) + '...' : item.propertyTitle
    ) || [],
    datasets: [{
      data: waterData?.propertyBreakdown?.slice(0, 5).map(item => item.consumption) || [0],
    }],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatConsumption = (consumption: number) => {
    return `${consumption.toFixed(2)} m³`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <Card style={[styles.summaryCard, { backgroundColor: theme.colors.primaryContainer }]}>
        <Card.Content style={styles.summaryCardContent}>
          <MaterialIcons name="water-drop" size={32} color={theme.colors.primary} />
          <View style={styles.summaryTextContainer}>
            <Text style={[styles.summaryLabel, { color: theme.colors.onPrimaryContainer }]}>
              Total Water Meters
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.onPrimaryContainer }]}>
              {waterData?.totalWaterMeters || 0}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.summaryCard, { backgroundColor: theme.colors.secondaryContainer }]}>
        <Card.Content style={styles.summaryCardContent}>
          <MaterialIcons name="trending-up" size={32} color={theme.colors.secondary} />
          <View style={styles.summaryTextContainer}>
            <Text style={[styles.summaryLabel, { color: theme.colors.onSecondaryContainer }]}>
              Total Consumption
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.onSecondaryContainer }]}>
              {formatConsumption(waterData?.totalConsumption || 0)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.summaryCard, { backgroundColor: theme.colors.tertiaryContainer }]}>
        <Card.Content style={styles.summaryCardContent}>
          <MaterialIcons name="attach-money" size={32} color={theme.colors.tertiary} />
          <View style={styles.summaryTextContainer}>
            <Text style={[styles.summaryLabel, { color: theme.colors.onTertiaryContainer }]}>
              Total Amount
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.onTertiaryContainer }]}>
              {formatCurrency(waterData?.totalAmount || 0)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Content style={styles.summaryCardContent}>
          <MaterialIcons name="analytics" size={32} color={theme.colors.onSurfaceVariant} />
          <View style={styles.summaryTextContainer}>
            <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
              Avg Consumption
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.onSurfaceVariant }]}>
              {formatConsumption(waterData?.averageConsumption || 0)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  const renderPaymentStatusCard = () => (
    <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
          Payment Status Overview
        </Text>
        <View style={styles.paymentStatusContainer}>
          <View style={styles.paymentStatusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#FF9800' }]} />
            <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
              Pending: {waterData?.paymentStatusBreakdown?.pending || 0}
            </Text>
          </View>
          <View style={styles.paymentStatusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
              Paid: {waterData?.paymentStatusBreakdown?.paid || 0}
            </Text>
          </View>
          <View style={styles.paymentStatusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#F44336' }]} />
            <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
              Overdue: {waterData?.paymentStatusBreakdown?.overdue || 0}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderPropertyBreakdown = () => (
    <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
          Property-wise Water Consumption
        </Text>
        <View style={styles.propertyList}>
          {waterData?.propertyBreakdown?.slice(0, 5).map((property, index) => (
            <View key={property.propertyId} style={styles.propertyItem}>
              <View style={styles.propertyInfo}>
                <Text style={[styles.propertyTitle, { color: theme.colors.onSurface }]}>
                  {property.propertyTitle}
                </Text>
                <Text style={[styles.propertyMeter, { color: theme.colors.onSurfaceVariant }]}>
                  Meter: {property.meterNumber}
                </Text>
              </View>
              <View style={styles.propertyStats}>
                <Text style={[styles.propertyConsumption, { color: theme.colors.primary }]}>
                  {formatConsumption(property.consumption)}
                </Text>
                <Text style={[styles.propertyAmount, { color: theme.colors.secondary }]}>
                  {formatCurrency(property.amount)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Water Meters Report" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading water meters data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Water Meters Report" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.onSurface }]}>
            Failed to load water meters data
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.colors.onSurfaceVariant }]}>
            {error.message}
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
      <ModernHeader title="Water Meters Report" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selection */}
        <Card style={[styles.periodCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.periodTitle, { color: theme.colors.onSurface }]}>
              Report Period
            </Text>
            <View style={styles.periodButtons}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  period === 'monthly' && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => setPeriod('monthly')}
              >
                <Text style={[
                  styles.periodButtonText,
                  { color: period === 'monthly' ? theme.colors.onPrimary : theme.colors.onSurface }
                ]}>
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  period === 'semiAnnual' && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => setPeriod('semiAnnual')}
              >
                <Text style={[
                  styles.periodButtonText,
                  { color: period === 'semiAnnual' ? theme.colors.onPrimary : theme.colors.onSurface }
                ]}>
                  Semi-Annual
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  period === 'annual' && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => setPeriod('annual')}
              >
                <Text style={[
                  styles.periodButtonText,
                  { color: period === 'annual' ? theme.colors.onPrimary : theme.colors.onSurface }
                ]}>
                  Annual
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.dateRangeText, { color: theme.colors.onSurfaceVariant }]}>
              {formatDate(dateRange.startDate.toISOString())} - {formatDate(dateRange.endDate.toISOString())}
            </Text>
          </Card.Content>
        </Card>

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Payment Status */}
        {renderPaymentStatusCard()}

        {/* Charts */}
        {waterData?.monthlyBreakdown && waterData.monthlyBreakdown.length > 0 && (
          <>
            <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
                  Monthly Water Consumption
                </Text>
                <CustomLineChart
                  data={consumptionChartData}
                  width={Dimensions.get('window').width - 64}
                  height={200}
                />
              </Card.Content>
            </Card>

            <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
                  Monthly Water Costs
                </Text>
                <CustomLineChart
                  data={amountChartData}
                  width={Dimensions.get('window').width - 64}
                  height={200}
                />
              </Card.Content>
            </Card>

            <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
                  Top Properties by Consumption
                </Text>
                <CustomBarChart
                  data={propertyChartData}
                  width={Dimensions.get('window').width - 64}
                  height={200}
                />
              </Card.Content>
            </Card>
          </>
        )}

        {/* Property Breakdown */}
        {renderPropertyBreakdown()}

        {/* Last Generated Info */}
        <Card style={[styles.lastGeneratedCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.lastGeneratedText, { color: theme.colors.onSurfaceVariant }]}>
              Last Generated: {waterData?.lastGenerated ? formatDate(waterData.lastGenerated) : 'Never'}
            </Text>
          </Card.Content>
        </Card>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    marginTop: 16,
  },
  periodCard: {
    marginBottom: 16,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateRangeText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
  },
  summaryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  summaryTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartCard: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  paymentStatusContainer: {
    gap: 12,
  },
  paymentStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
  },
  propertyList: {
    gap: 12,
  },
  propertyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  propertyMeter: {
    fontSize: 12,
  },
  propertyStats: {
    alignItems: 'flex-end',
  },
  propertyConsumption: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  propertyAmount: {
    fontSize: 12,
  },
  lastGeneratedCard: {
    marginBottom: 16,
  },
  lastGeneratedText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
