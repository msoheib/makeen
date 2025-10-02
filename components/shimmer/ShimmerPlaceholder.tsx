import React, { useEffect, useRef } from 'react';
import { ViewStyle, AppState, AppStateStatus } from 'react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { isRTL } from '@/lib/rtl';
import { useTheme as useAppTheme } from '@/hooks/useTheme';

const ShimmerPlaceholderBase = createShimmerPlaceholder(LinearGradient);

interface ShimmerPlaceholderProps {
  width?: number | string;
  height?: number | string;
  shimmerColors?: string[];
  duration?: number;
  shimmerWidthPercent?: number;
  visible?: boolean;
  style?: ViewStyle;
  borderRadius?: number;
  children?: React.ReactNode;
  isLoading?: boolean;
}

export const ShimmerPlaceholder: React.FC<ShimmerPlaceholderProps> = ({
  width,
  height,
  shimmerColors,
  duration = 1000,
  shimmerWidthPercent = 0.3,
  visible = false,
  style,
  borderRadius = 4,
  children,
  isLoading = true,
}) => {
  const { isDark } = useAppTheme();
  const appState = useRef(AppState.currentState);
  const shimmerRef = useRef<any>(null);

  // Determine shimmer colors based on theme
  const colors = shimmerColors || (isDark 
    ? ['#2A2A2A', '#3A3A3A', '#2A2A2A'] // Dark mode colors
    : ['#F0F0F0', '#E0E0E0', '#F0F0F0'] // Light mode colors
  );

  // Determine animation direction based on RTL
  const animationDirection = isRTL() ? 'right' : 'left';

  // Handle app state changes to pause/resume animation
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground - resume animation
        if (shimmerRef.current?.getAnimated) {
          shimmerRef.current.getAnimated().start();
        }
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App going to background - pause animation
        if (shimmerRef.current?.getAnimated) {
          shimmerRef.current.getAnimated().stop();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const containerStyle: ViewStyle = {
    width,
    height,
    borderRadius,
    overflow: 'hidden',
    ...style,
  };

  if (!isLoading || visible) {
    return children ? <>{children}</> : null;
  }

  return (
    <ShimmerPlaceholderBase
      ref={shimmerRef}
      shimmerColors={colors}
      duration={duration}
      shimmerWidthPercent={shimmerWidthPercent}
      visible={visible}
      style={containerStyle}
      shimmerStyle={{
        borderRadius,
      }}
      isReversed={animationDirection === 'right'}
      stopAutoRun={false}
    >
      {children}
    </ShimmerPlaceholderBase>
  );
};

// Line shimmer for text
export const ShimmerLine: React.FC<{
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  isLoading?: boolean;
}> = ({ width = '100%', height = 12, style, isLoading = true }) => {
  return (
    <ShimmerPlaceholder
      width={width}
      height={height}
      style={style}
      isLoading={isLoading}
    />
  );
};

// Box shimmer for images/cards
export const ShimmerBox: React.FC<{
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  isLoading?: boolean;
}> = ({ width = '100%', height = 100, borderRadius = 8, style, isLoading = true }) => {
  return (
    <ShimmerPlaceholder
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
      isLoading={isLoading}
    />
  );
};

// Circle shimmer for avatars/icons
export const ShimmerCircle: React.FC<{
  size?: number;
  style?: ViewStyle;
  isLoading?: boolean;
}> = ({ size = 40, style, isLoading = true }) => {
  return (
    <ShimmerPlaceholder
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
      isLoading={isLoading}
    />
  );
};
