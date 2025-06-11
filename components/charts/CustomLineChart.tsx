import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Alert, PanResponder, Animated } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { theme } from '../../lib/theme';
import { Text } from 'react-native-paper';

interface CustomLineChartProps {
  data: any;
  width?: number;
  height?: number;
  style?: any;
  interactive?: boolean;
  onDataPointClick?: (data: any, index: number) => void;
  showDataPointTooltip?: boolean;
}

export const CustomLineChart: React.FC<CustomLineChartProps> = ({
  data,
  width = Dimensions.get('window').width - 32,
  height = 220,
  style,
  interactive = true,
  onDataPointClick,
  showDataPointTooltip = true,
}) => {
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    value: string;
    label: string;
    visible: boolean;
  }>({
    x: 0,
    y: 0,
    value: '',
    label: '',
    visible: false,
  });

  const animatedValue = new Animated.Value(0);

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
      fill: theme.colors.onSurfaceVariant,
    },
    propsForVerticalLabels: {
      fontSize: 10,
      fill: theme.colors.onSurfaceVariant,
    },
    propsForHorizontalLabels: {
      fontSize: 10,
      fill: theme.colors.onSurfaceVariant,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
      fill: theme.colors.surface,
    },
    fillShadowGradient: theme.colors.primary,
    fillShadowGradientOpacity: 0.1,
  };

  const handleDataPointClick = (dataPointClickData: any) => {
    if (!interactive || !showDataPointTooltip) return;

    const { x, y, value, index } = dataPointClickData;
    const label = data.labels?.[index] || `Point ${index + 1}`;

    // Animate tooltip appearance
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    setTooltipData({
      x: x - 50, // Offset to center tooltip
      y: y - 60, // Position above the point
      value: value.toString(),
      label,
      visible: true,
    });

    // Auto-hide tooltip after 3 seconds
    setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTooltipData(prev => ({ ...prev, visible: false }));
      });
    }, 3000);

    // Call custom callback if provided
    if (onDataPointClick) {
      onDataPointClick(dataPointClickData, index);
    }
  };

  const hideTooltip = () => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setTooltipData(prev => ({ ...prev, visible: false }));
    });
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: () => {
      // Hide tooltip when user starts panning
      if (tooltipData.visible) {
        hideTooltip();
      }
    },
  });

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      <LineChart
        data={data}
        width={width}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        onDataPointClick={interactive ? handleDataPointClick : undefined}
        withDots={true}
        withShadow={true}
        withScrollableDot={interactive}
        withVerticalLabels={true}
        withHorizontalLabels={true}
      />

      {/* Tooltip */}
      {tooltipData.visible && showDataPointTooltip && (
        <Animated.View
          style={[
            styles.tooltip,
            {
              left: tooltipData.x,
              top: tooltipData.y,
              opacity: animatedValue,
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.tooltipLabel}>{tooltipData.label}</Text>
          <Text style={styles.tooltipValue}>{tooltipData.value}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  chart: {
    borderRadius: 16,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    padding: 8,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  tooltipLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  tooltipValue: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
});

export default CustomLineChart; 