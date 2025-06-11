import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from 'react-native-paper';
import { createChartConfig, BarChartData } from './chartConfig';

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

  return (
    <View style={[styles.container, style]}>
      <BarChart
        data={data}
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