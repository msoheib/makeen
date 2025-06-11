import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from 'react-native-paper';
import { PieChartData, chartColors } from './chartConfig';

interface CustomPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
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

export const CustomPieChart: React.FC<CustomPieChartProps> = ({
  data,
  width = Dimensions.get('window').width - 32,
  height = 220,
  accessor = 'value',
  backgroundColor = 'transparent',
  paddingLeft = '15',
  center,
  absolute = false,
  hasLegend = true,
  style,
}) => {
  const theme = useTheme();

  // Transform data to match react-native-chart-kit format
  const chartData: PieChartData = data.map((item, index) => ({
    name: item.name,
    population: item.value,
    color: item.color || chartColors[index % chartColors.length],
    legendFontColor: theme.colors.onSurface,
    legendFontSize: 12,
  }));

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.onSurface,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <View style={[styles.container, style]}>
      <PieChart
        data={chartData}
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