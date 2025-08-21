import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ModernHeader from '@/components/ModernHeader';
import { CustomLineChart, CustomBarChart, CustomPieChart } from '@/components/charts';
import { reportsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import DateRangePicker, { DateRange } from '@/components/DateRangePicker';
import { exportReportToPDF, ReportData } from '@/lib/pdfExport';

interface PropertyPerformanceData {
  totalProperties: number;
  avgOccupancyRate: number;
  totalRevenue: number;
  avgROI: number;
  properties: {
    id: string;
    title: string;
    occupancyRate: number;
    monthlyRevenue: number;
    annualROI: number;
    maintenanceCosts: number;
    netIncome: number;
    propertyValue: number;
  }[];
  occupancyTrend: {
    month: string;
    occupancyRate: number;
  }[];
  revenueByProperty: {
    propertyName: string;
    revenue: number;
  }[];
}

export default function PropertyPerformanceReportScreen() {
  const theme = useTheme();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
    label: 'This Year'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { 
    data: performanceData, 
    loading, 
    error, 
    refetch 
  } = useApi<PropertyPerformanceData>(() => reportsApi.getPropertyPerformanceReport(dateRange.startDate.toISOString(), dateRange.endDate.toISOString()), [dateRange]);

  // Prepare chart data
  const occupancyTrendData = {
    labels: performanceData?.occupancyTrend?.map(item => item.month.substring(0, 3)) || [],
    datasets: [{
      data: performanceData?.occupancyTrend?.map(item => item.occupancyRate) || [0],
      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for occupancy
      strokeWidth: 3,
    }],
  };

  const revenueByPropertyData = {
    labels: performanceData?.revenueByProperty?.slice(0, 5).map(item => 
      item.propertyName.length > 12 ? item.propertyName.substring(0, 12) + '...' : item.propertyName
    ) || [],
    datasets: [{
      data: performanceData?.revenueByProperty?.slice(0, 5).map(item => item.revenue) || [0],
    }],
  };

  const roiDistributionData = performanceData?.properties?.map((property, index) => ({
    name: property.title.length > 15 ? property.title.substring(0, 15) + '...' : property.title,
    value: property.annualROI,
    color: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#607D8B'][index % 6],
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

  const handleExportReport = async () => {
    if (!performanceData) return;

    const reportData: ReportData = {
      title: 'Property Performance Report',
      subtitle: 'Comprehensive analysis of property ROI, occupancy, and revenue metrics',
      dateRange,
      summary: [
        { label: 'Total Properties', value: performanceData.totalProperties.toString() },
        { label: 'Average Occupancy', value: formatPercentage(performanceData.avgOccupancyRate), color: '#4CAF50' },
        { label: 'Total Revenue', value: formatCurrency(performanceData.totalRevenue), color: '#2196F3' },
        { label: 'Average ROI', value: formatPercentage(performanceData.avgROI), color: '#4CAF50' },
      ],
      tables: [
        {
          title: 'Individual Property Performance',
          headers: ['Property', 'Occupancy', 'Monthly Revenue', 'ROI', 'Net Income'],
          rows: performanceData.properties.slice(0, 10).map(property => [
            property.title,
            formatPercentage(property.occupancyRate),
            formatCurrency(property.monthlyRevenue),
            formatPercentage(property.annualROI),
            formatCurrency(property.netIncome),
          ]),
        },
      ],
    };

    await exportReportToPDF(reportData);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader
          title="Property Performance"
          subtitle="Loading performance data..."
          showNotifications={false}
          showSearch={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading property performance data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader
          title="Property Performance"
          subtitle="Failed to load data"
          showNotifications={false}
          showSearch={false}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Failed to load property performance data
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
        title="Property Performance"
        subtitle="Portfolio analytics and ROI"
        showNotifications={false}
        showSearch={false}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Date Range Filter */}
        <Card style={[styles.filterCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Button 
              mode="outlined" 
              onPress={() => setShowDatePicker(!showDatePicker)}
              style={styles.dateButton}
            >
              {dateRange.label} ({dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()})
            </Button>
            {showDatePicker && (
              <DateRangePicker
                selectedRange={dateRange}
                onRangeChange={setDateRange}
                onApply={() => setShowDatePicker(false)}
                onClear={() => setShowDatePicker(false)}
              />
            )}
          </Card.Content>
        </Card>

        {/* Key Metrics */}
        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Total Properties
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.primary, textAlign: 'center', fontWeight: 'bold' }}>
                {performanceData?.totalProperties || 0}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Avg Occupancy
              </Text>
              <Text variant="titleMedium" style={{ color: '#4CAF50', textAlign: 'center', fontWeight: 'bold' }}>
                {formatPercentage(performanceData?.avgOccupancyRate || 0)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Total Revenue
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.primary, textAlign: 'center', fontWeight: 'bold' }}>
                {formatCurrency(performanceData?.totalRevenue || 0)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Average ROI
              </Text>
              <Text variant="titleMedium" style={{ color: '#4CAF50', textAlign: 'center', fontWeight: 'bold' }}>
                {formatPercentage(performanceData?.avgROI || 0)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Occupancy Trend Chart */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Portfolio Occupancy Trend
            </Text>
            {performanceData?.occupancyTrend && performanceData.occupancyTrend.length > 0 ? (
              <CustomLineChart
                data={occupancyTrendData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No occupancy trend data available
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Revenue by Property */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Revenue by Property (Top 5)
            </Text>
            {performanceData?.revenueByProperty && performanceData.revenueByProperty.length > 0 ? (
              <CustomBarChart
                data={revenueByPropertyData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No revenue data available
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* ROI Distribution */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              ROI Distribution by Property
            </Text>
            {performanceData?.properties && performanceData.properties.length > 0 ? (
              <CustomPieChart
                data={roiDistributionData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No ROI data available
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Property Performance Details */}
        <Card style={[styles.propertiesCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Individual Property Performance
            </Text>
            {performanceData?.properties && performanceData.properties.length > 0 ? (
              <View>
                {performanceData.properties.slice(0, 5).map((property, index) => (
                  <View key={property.id} style={styles.propertyRow}>
                    <View style={styles.propertyInfo}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                        {property.title}
                      </Text>
                      <View style={styles.propertyMetrics}>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Occupancy: {formatPercentage(property.occupancyRate)}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Monthly Revenue: {formatCurrency(property.monthlyRevenue)}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          ROI: {formatPercentage(property.annualROI)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.propertyValues}>
                      <Text variant="bodyMedium" style={{ 
                        color: property.netIncome >= 0 ? '#4CAF50' : '#F44336', 
                        fontWeight: '600' 
                      }}>
                        {formatCurrency(property.netIncome)}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Net Income
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No property performance data available
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
              console.log('Detailed property analysis coming soon');
            }}
            style={styles.actionButton}
            icon="chart-bar"
          >
            Detailed Analysis
          </Button>
          <Button
            mode="contained"
            onPress={handleExportReport}
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
  filterCard: {
    marginBottom: 16,
    elevation: 2,
  },
  dateButton: {
    marginBottom: 8,
  },
}); 