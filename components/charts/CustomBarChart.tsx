import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme, Text } from 'react-native-paper';
import { createChartConfig, BarChartData } from './chartConfig';
import { validateChartData, createEmptyChartData } from '../../lib/chartUtils';

interface CustomBarChartProps {
  data: BarChartData;
  width?: number;
  height?: number;
  showValuesOnTopOfBars?: boolean;
  withInnerLines?: boolean;
  showBarTops?: boolean;
  flatColor?: boolean;
  fromZero?: boolean;
  style?: any;
}

export const CustomBarChart: React.FC<CustomBarChartProps> = ({
  data,
  width = Dimensions.get('window').width - 32,
  height = 220,
  showValuesOnTopOfBars = false,
  withInnerLines = true,
  showBarTops = true,
  flatColor = false,
  fromZero = true,
  style,
}) => {
  const theme = useTheme();
  const chartConfig = createChartConfig(theme.colors);

  // Validate chart data using utility function
  const validatedData = validateChartData(data);
  
  // If data is invalid, use empty chart data or show message
  const chartData = validatedData || createEmptyChartData();
  const hasValidData = validatedData !== null;

  if (!hasValidData) {
    return (
      <View style={[styles.container, style, { height, width, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', fontSize: 14 }}>
          No chart data available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <BarChart
        data={chartData}
        width={width}
        height={height}
        chartConfig={{
          ...chartConfig,
          barPercentage: 0.6,
        }}
        showValuesOnTopOfBars={showValuesOnTopOfBars}
        withInnerLines={withInnerLines}
        showBarTops={showBarTops}
        flatColor={flatColor}
        fromZero={fromZero}
        style={styles.chart}
        yAxisLabel="SAR "
        yAxisSuffix=""
      />
    </View>
  );
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
}); 