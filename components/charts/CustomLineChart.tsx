import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from 'react-native-paper';
import { createChartConfig, LineChartData } from './chartConfig';

interface CustomLineChartProps {
  data: LineChartData;
  width?: number;
  height?: number;
  withDots?: boolean;
  withShadow?: boolean;
  withScrollableDot?: boolean;
  withInnerLines?: boolean;
  withOuterLines?: boolean;
  withHorizontalLines?: boolean;
  withVerticalLines?: boolean;
  style?: any;
}

export const CustomLineChart: React.FC<CustomLineChartProps> = ({
  data,
  width = Dimensions.get('window').width - 32,
  height = 220,
  withDots = true,
  withShadow = true,
  withScrollableDot = false,
  withInnerLines = true,
  withOuterLines = false,
  withHorizontalLines = true,
  withVerticalLines = false,
  style,
}) => {
  const theme = useTheme();
  const chartConfig = createChartConfig(theme.colors);

  return (
    <View style={[styles.container, style]}>
      <LineChart
        data={data}
        width={width}
        height={height}
        chartConfig={chartConfig}
        bezier
        withDots={withDots}
        withShadow={withShadow}
        withScrollableDot={withScrollableDot}
        withInnerLines={withInnerLines}
        withOuterLines={withOuterLines}
        withHorizontalLines={withHorizontalLines}
        withVerticalLines={withVerticalLines}
        style={styles.chart}
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