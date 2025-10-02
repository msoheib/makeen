import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Alert, PanResponder, Animated, Platform } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { theme } from '../../lib/theme';
import { Text } from 'react-native-paper';
import { validateChartData, createEmptyChartData } from '../../lib/chartUtils';

interface CustomLineChartProps {
  data: any;
  width?: number;
  height?: number;
  style?: any;
  interactive?: boolean;
  onDataPointClick?: (data: any, index: number) => void;
  showDataPointTooltip?: boolean;
}

/**
 * Enhanced validation specifically for LineChart data
 */
const validateLineChartData = (data: any): any | null => {
  try {
    // First, use the general validation
    const validatedData = validateChartData(data);
    if (!validatedData) {
      console.log('LineChart validation failed: basic validation failed');
      return null;
    }

    // Additional LineChart-specific validation
    const { labels, datasets } = validatedData;
    
    // Ensure all datasets have data arrays that match the labels length
    const syncedDatasets = datasets.map(dataset => {
      const { data: dataArray, ...rest } = dataset;
      
      // Ensure data array matches labels length
      let syncedData = [...dataArray];
      
      if (syncedData.length < labels.length) {
        // Pad with zeros if data is shorter than labels
        while (syncedData.length < labels.length) {
          syncedData.push(0);
        }
      } else if (syncedData.length > labels.length) {
        // Truncate if data is longer than labels
        syncedData = syncedData.slice(0, labels.length);
      }
      
      // Ensure all values are valid numbers
      syncedData = syncedData.map(value => {
        const num = Number(value);
        return isNaN(num) || !isFinite(num) ? 0 : num;
      });
      
      return {
        ...rest,
        data: syncedData
      };
    });

    const result = {
      ...validatedData,
      datasets: syncedDatasets
    };

    console.log('LineChart validation success:', {
      labelsLength: labels.length,
      datasetsCount: syncedDatasets.length,
      dataLengths: syncedDatasets.map(d => d.data.length)
    });

    return result;
  } catch (error) {
    console.error('LineChart validation error:', error);
    return null;
  }
};

export const CustomLineChart: React.FC<CustomLineChartProps> = ({
  data,
  width = Dimensions.get('window').width - 32,
  height = 220,
  style,
  interactive = true,
  onDataPointClick,
  showDataPointTooltip = true,
}) => {
  // Comprehensive error boundary wrapper
  try {
    console.log('CustomLineChart received data:', {
      hasData: !!data,
      dataType: typeof data,
      labelsLength: data?.labels?.length,
      datasetsCount: data?.datasets?.length
    });

    // Enhanced validation for LineChart
    const validatedData = validateLineChartData(data);
    
    // If data is invalid, use empty chart data or show message
    const chartData = validatedData || createEmptyChartData();
    const hasValidData = validatedData !== null;

    console.log('CustomLineChart validation result:', {
      hasValidData,
      chartDataLabels: chartData?.labels?.length,
      chartDatasets: chartData?.datasets?.length
    });

    if (!hasValidData) {
      return (
        <View style={[styles.container, style, { height, width, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', fontSize: 14 }}>
            No chart data available
          </Text>
        </View>
      );
    }

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

      try {
        const { x, y, value, index } = dataPointClickData;
        const label = chartData.labels?.[index] || `Point ${index + 1}`;

        // Animate tooltip appearance
        Animated.spring(animatedValue, {
          toValue: 1,
          useNativeDriver: Platform.OS !== 'web',
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
            useNativeDriver: Platform.OS !== 'web',
          }).start(() => {
            setTooltipData(prev => ({ ...prev, visible: false }));
          });
        }, 3000);

        // Call custom callback if provided
        if (onDataPointClick) {
          onDataPointClick(dataPointClickData, index);
        }
      } catch (error) {
        console.error('Error handling data point click:', error);
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

    // Render the chart with error boundary
    const renderChart = () => {
      try {
        // Additional safety check before rendering
        if (!chartData || !chartData.labels || !chartData.datasets) {
          console.error('Invalid chartData structure:', chartData);
          return (
            <View style={[styles.container, { height, width, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: theme.colors.error, textAlign: 'center', fontSize: 14 }}>
                Invalid chart data structure
              </Text>
            </View>
          );
        }

        // Ensure datasets exist and have valid data
        if (chartData.datasets.length === 0) {
          console.error('No datasets available');
          return (
            <View style={[styles.container, { height, width, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', fontSize: 14 }}>
                No data to display
              </Text>
            </View>
          );
        }

        return (
          <LineChart
            data={chartData}
            width={width}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            onDataPointClick={interactive ? handleDataPointClick : undefined}
            withDots={true}
            withShadow={false}
            withScrollableDot={false} // Disabled to prevent height errors
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withInnerLines={true}
            withOuterLines={true}
          />
        );
      } catch (error) {
        console.error('LineChart rendering error:', error);
        return (
          <View style={[styles.container, { height, width, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: theme.colors.error, textAlign: 'center', fontSize: 14 }}>
              Chart rendering error
            </Text>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', fontSize: 12, marginTop: 8 }}>
              Please check data format
            </Text>
          </View>
        );
      }
    };

    return (
      <View style={[styles.container, style]} {...panResponder.panHandlers}>
        {renderChart()}

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
  } catch (error) {
    console.error('CustomLineChart error:', error);
    return (
      <View style={[styles.container, style, { height, width, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.error, textAlign: 'center', fontSize: 14 }}>
          An error occurred
        </Text>
        <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', fontSize: 12, marginTop: 8 }}>
          Please check the console for more details
        </Text>
      </View>
    );
  }
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
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
    }),
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