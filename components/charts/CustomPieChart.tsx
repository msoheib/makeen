import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from 'react-native-paper';
import { PieChartData, chartColors } from './chartConfig';

interface PieChartDataItem {
  name: string;
  value: number;
  color?: string;
}

interface CustomPieChartProps {
  data: PieChartDataItem[];
  width?: number;
  height?: number;
  accessor?: string;
  backgroundColor?: string;
  paddingLeft?: string;
  center?: number[];
  absolute?: boolean;
  hasLegend?: boolean;
  style?: any;
}

/**
 * Validates pie chart data to prevent crashes
 */
const validatePieChartData = (data: PieChartDataItem[]): boolean => {
  try {
    // Check if data exists and is array
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('CustomPieChart: Invalid data - not array or empty:', data);
      return false;
    }

    // Check each item in the array
    const isValid = data.every((item, index) => {
      if (!item) {
        console.log(`CustomPieChart: Item ${index} is null/undefined`);
        return false;
      }
      
      if (typeof item.name !== 'string' || item.name.trim() === '') {
        console.log(`CustomPieChart: Item ${index} has invalid name:`, item.name);
        return false;
      }
      
      if (typeof item.value !== 'number' || isNaN(item.value) || item.value < 0) {
        console.log(`CustomPieChart: Item ${index} has invalid value:`, item.value);
        return false;
      }

      return true;
    });

    // Additional check: ensure we have meaningful data (sum > 0)
    const totalValue = data.reduce((sum, item) => sum + (item?.value || 0), 0);
    if (totalValue <= 0) {
      console.log('CustomPieChart: Total value is zero or negative:', totalValue);
      return false;
    }

    console.log('CustomPieChart: Data validation passed for', data.length, 'items with total:', totalValue);
    return isValid;
  } catch (error) {
    console.error('CustomPieChart: Validation error:', error);
    return false;
  }
};

/**
 * Creates empty pie chart data as fallback
 */
const createEmptyPieChartData = (): PieChartDataItem[] => [
  { name: 'No Data Available', value: 100, color: '#E0E0E0' }
];

export const CustomPieChart: React.FC<CustomPieChartProps> = ({
  data,
  width = Dimensions.get('window').width - 32,
  height = 220,
  accessor = 'population',
  backgroundColor = 'transparent',
  paddingLeft = '15',
  center,
  absolute = false,
  hasLegend = true,
  style,
}) => {
  const theme = useTheme();

  console.log('CustomPieChart: Rendering with data:', data);

  try {
    // Validate data
    const isValidData = validatePieChartData(data);
    const chartData = isValidData ? data : createEmptyPieChartData();

    console.log('CustomPieChart: Using chart data:', chartData);

    // Transform data to match react-native-chart-kit format with additional safety
    const formattedChartData: PieChartData = chartData.map((item, index) => {
      const safeItem = {
        name: String(item.name || 'Unknown'),
        population: Number(item.value || 0),
        color: item.color || chartColors[index % chartColors.length],
        legendFontColor: theme.colors.onSurface,
        legendFontSize: 12,
      };
      console.log(`CustomPieChart: Formatted item ${index}:`, safeItem);
      return safeItem;
    });

    // Additional validation of formatted data
    if (!formattedChartData || formattedChartData.length === 0) {
      console.error('CustomPieChart: Formatted data is empty, falling back to no data message');
      return (
        <View style={[styles.container, style]}>
          <View style={styles.fallbackContainer}>
            <Text style={[styles.fallbackText, { color: theme.colors.onSurfaceVariant }]}>
              Chart data unavailable
            </Text>
          </View>
        </View>
      );
    }

    const chartConfig = {
      backgroundGradientFrom: theme.colors.surface,
      backgroundGradientTo: theme.colors.surface,
      color: (opacity = 1) => theme.colors.primary,
      labelColor: (opacity = 1) => theme.colors.onSurface,
      strokeWidth: 2,
      barPercentage: 0.5,
      useShadowColorFromDataset: false,
    };

    // Show fallback message for invalid data
    if (!isValidData) {
      console.log('CustomPieChart: Showing fallback due to invalid data');
      return (
        <View style={[styles.container, style]}>
          <View style={styles.fallbackContainer}>
            <Text style={[styles.fallbackText, { color: theme.colors.onSurfaceVariant }]}>
              No chart data available
            </Text>
          </View>
        </View>
      );
    }

    console.log('CustomPieChart: Rendering PieChart component with config:', chartConfig);

    return (
      <View style={[styles.container, style]}>
        <PieChart
          data={formattedChartData}
          width={width}
          height={height}
          chartConfig={chartConfig}
          accessor={accessor}
          backgroundColor={backgroundColor}
          paddingLeft={paddingLeft}
          center={center}
          absolute={absolute}
          hasLegend={hasLegend}
          style={styles.chart}
        />
      </View>
    );
  } catch (error) {
    console.error('CustomPieChart: Rendering error:', error);
    return (
      <View style={[styles.container, style]}>
        <View style={styles.fallbackContainer}>
          <Text style={[styles.fallbackText, { color: theme.colors.onSurfaceVariant }]}>
            Chart rendering error
          </Text>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  fallbackContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  fallbackText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 