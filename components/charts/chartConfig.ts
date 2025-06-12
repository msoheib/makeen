import { ChartConfig } from 'react-native-chart-kit/dist/HelperTypes';

export interface ChartTheme {
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  color: (opacity?: number) => string;
  strokeWidth: number;
  barPercentage: number;
  useShadowColorFromDataset: boolean;
  labelColor: (opacity?: number) => string;
  style: {
    borderRadius: number;
  };
  propsForDots: {
    r: string;
    strokeWidth: string;
    stroke: string;
  };
  propsForBackgroundLines: {
    strokeDasharray: string;
    stroke: string;
    strokeWidth: number;
  };
}

export const createChartConfig = (colors: any): ChartConfig => ({
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  backgroundGradientFromOpacity: 1,
  backgroundGradientToOpacity: 1,
  color: (opacity = 1) => colors.chartPrimary + Math.round(opacity * 255).toString(16).padStart(2, '0'),
  strokeWidth: 2,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  labelColor: (opacity = 1) => colors.chartText + Math.round(opacity * 255).toString(16).padStart(2, '0'),
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: colors.chartPrimary,
  },
  propsForBackgroundLines: {
    strokeDasharray: '5,5',
    stroke: colors.chartGrid,
    strokeWidth: 1,
  },
  propsForLabels: {
    fontSize: '12',
    fontWeight: '400',
  },
  decimalPlaces: 0,
  formatYLabel: (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return value;
  },
  formatXLabel: (value: string) => {
    // Truncate long labels
    return value.length > 8 ? value.substring(0, 6) + '...' : value;
  },
});

export const chartColors = [
  '#2B5CE6', // Primary blue
  '#4ECDC4', // Secondary teal
  '#2ED573', // Success green
  '#FFA726', // Warning orange
  '#FF6B6B', // Error red
  '#9C88FF', // Purple
  '#55A3FF', // Light blue
  '#26D0CE', // Cyan
];

export const getChartColor = (index: number): string => {
  return chartColors[index % chartColors.length];
};

export interface ChartDataPoint {
  value: number;
  label?: string;
  color?: string;
}

export interface LineChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

export interface BarChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
  }>;
}

export interface PieChartData extends Array<{
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}> {} 