import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { CustomLineChart, CustomBarChart, CustomPieChart } from '../../../components/charts';
import { reportsApi } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';

interface OccupancyData {
  portfolioStats: {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number;
    avgVacancyDuration: number;
    revenuePerOccupiedUnit: number;
  };
  occupancyTrend: Array<{
    month: string;
    occupancyRate: number;
    occupiedUnits: number;
    vacantUnits: number;
  }>;
  propertyOccupancy: Array<{
    propertyName: string;
    totalUnits: number;
    occupiedUnits: number;
    occupancyRate: number;
    monthlyRevenue: number;
  }>;
}

export default function OccupancyAnalyticsScreen() {
  const theme = useTheme();
  const [dateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
  });

  const { 
    data: occupancyData, 
    loading, 
    error, 
    refetch 
  } = useApi<OccupancyData>(() => reportsApi.getPropertyPerformanceReport(dateRange.startDate, dateRange.endDate), [dateRange]);

  // Prepare chart data with mock structure for now
  const mockOccupancyData = {
    portfolioStats: {
      totalUnits: 20,
      occupiedUnits: 17,
      vacantUnits: 3,
      occupancyRate: 85,
      avgVacancyDuration: 45,
      revenuePerOccupiedUnit: 4500,
    },
    occupancyTrend: [
      { month: 'Jan', occupancyRate: 82, occupiedUnits: 16, vacantUnits: 4 },
      { month: 'Feb', occupancyRate: 85, occupiedUnits: 17, vacantUnits: 3 },
      { month: 'Mar', occupancyRate: 88, occupiedUnits: 18, vacantUnits: 2 },
      { month: 'Apr', occupancyRate: 85, occupiedUnits: 17, vacantUnits: 3 },
      { month: 'May', occupancyRate: 90, occupiedUnits: 18, vacantUnits: 2 },
      { month: 'Jun', occupancyRate: 85, occupiedUnits: 17, vacantUnits: 3 },
    ],
    propertyOccupancy: [
      { propertyName: 'Villa Riyadh', totalUnits: 1, occupiedUnits: 1, occupancyRate: 100, monthlyRevenue: 6000 },
      { propertyName: 'Apartment Jeddah', totalUnits: 1, occupiedUnits: 1, occupancyRate: 100, monthlyRevenue: 5000 },
      { propertyName: 'Office Dammam', totalUnits: 1, occupiedUnits: 0, occupancyRate: 0, monthlyRevenue: 0 },
      { propertyName: 'Studio Jeddah', totalUnits: 1, occupiedUnits: 0, occupancyRate: 0, monthlyRevenue: 0 },
    ],
  };

  const dataToUse = occupancyData || mockOccupancyData;

  const occupancyTrendData = {
    labels: dataToUse.occupancyTrend?.map(item => item.month.substring(0, 3)) || [],
    datasets: [
      {
        data: dataToUse.occupancyTrend?.map(item => item.occupancyRate) || [0],
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const propertyOccupancyData = {
    labels: dataToUse.propertyOccupancy?.slice(0, 6).map(item => 
      item.propertyName.length > 10 ? item.propertyName.substring(0, 10) + '...' : item.propertyName
    ) || [],
    datasets: [{
      data: dataToUse.propertyOccupancy?.slice(0, 6).map(item => item.occupancyRate) || [0],
    }],
  };

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
            title: 'Occupancy Analytics',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading occupancy analytics...
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
            title: 'Occupancy Analytics',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
          }} 
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Failed to load occupancy data
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
          title: 'Occupancy Analytics',
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Portfolio Overview */}
        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Total Units
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.primary, textAlign: 'center', fontWeight: 'bold' }}>
                {dataToUse.portfolioStats?.totalUnits || 0}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Occupancy Rate
              </Text>
              <Text variant="titleMedium" style={{ color: '#4CAF50', textAlign: 'center', fontWeight: 'bold' }}>
                {formatPercentage(dataToUse.portfolioStats?.occupancyRate || 0)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Vacant Units
              </Text>
              <Text variant="titleMedium" style={{ color: '#F44336', textAlign: 'center', fontWeight: 'bold' }}>
                {dataToUse.portfolioStats?.vacantUnits || 0}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Avg Vacancy Days
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.primary, textAlign: 'center', fontWeight: 'bold' }}>
                {Math.round(dataToUse.portfolioStats?.avgVacancyDuration || 0)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Revenue per Unit */}
        <Card style={[styles.fullWidthCard, { backgroundColor: theme.colors.surface, marginBottom: 16 }]}>
          <Card.Content>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Revenue per Occupied Unit
            </Text>
            <Text variant="titleLarge" style={{ color: '#4CAF50', textAlign: 'center', fontWeight: 'bold' }}>
              {formatCurrency(dataToUse.portfolioStats?.revenuePerOccupiedUnit || 0)}
            </Text>
          </Card.Content>
        </Card>

        {/* Occupancy Trend */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Portfolio Occupancy Trend
            </Text>
            {dataToUse.occupancyTrend && dataToUse.occupancyTrend.length > 0 ? (
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

        {/* Property-wise Occupancy */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Occupancy by Property
            </Text>
            {dataToUse.propertyOccupancy && dataToUse.propertyOccupancy.length > 0 ? (
              <CustomBarChart
                data={propertyOccupancyData}
                width={Dimensions.get('window').width - 64}
                height={220}
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No property occupancy data available
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Property Performance Details */}
        <Card style={[styles.propertiesCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Property Occupancy Details
            </Text>
            {dataToUse.propertyOccupancy && dataToUse.propertyOccupancy.length > 0 ? (
              <View>
                {dataToUse.propertyOccupancy.map((property, index) => (
                  <View key={index} style={styles.propertyRow}>
                    <View style={styles.propertyInfo}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                        {property.propertyName}
                      </Text>
                      <View style={styles.propertyMetrics}>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Units: {property.occupiedUnits}/{property.totalUnits}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Monthly Revenue: {formatCurrency(property.monthlyRevenue)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.propertyValues}>
                      <Text variant="bodyMedium" style={{ 
                        color: property.occupancyRate >= 90 ? '#4CAF50' : 
                               property.occupancyRate >= 70 ? '#FF9800' : '#F44336', 
                        fontWeight: '600' 
                      }}>
                        {formatPercentage(property.occupancyRate)}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Occupancy
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No property occupancy data available
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
              console.log('Vacancy optimization coming soon');
            }}
            style={styles.actionButton}
            icon="home-search"
          >
            Vacancy Solutions
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              console.log('Export occupancy report coming soon');
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