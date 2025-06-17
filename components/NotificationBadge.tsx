import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { isRTL } from '@/lib/i18n';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  position?: 'top-right' | 'top-left' | 'inline';
  maxCount?: number;
  children?: React.ReactNode;
}

const BADGE_SIZES = {
  small: { width: 16, height: 16, fontSize: 10, minWidth: 16 },
  medium: { width: 20, height: 20, fontSize: 12, minWidth: 20 },
  large: { width: 24, height: 24, fontSize: 14, minWidth: 24 },
};

const getPositionStyles = () => {
  const rtl = isRTL();
  return {
    'top-right': { 
      position: 'absolute' as const, 
      top: -8, 
      [rtl ? 'left' : 'right']: -8 
    },
    'top-left': { 
      position: 'absolute' as const, 
      top: -8, 
      [rtl ? 'right' : 'left']: -8 
    },
    'inline': { position: 'relative' as const },
  };
};

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = 'medium',
  color,
  position = 'top-right',
  maxCount = 99,
  children,
}) => {
  const theme = useTheme();
  const sizeStyle = BADGE_SIZES[size];
  const positionStyle = getPositionStyles()[position];

  const formatCount = (num: number): string => {
    if (num <= 0) return '';
    if (num <= maxCount) return num.toString();
    return `${maxCount}+`;
  };

  const displayCount = formatCount(count);
  const shouldShow = count > 0;
  const badgeColor = color || theme.colors.error;

  if (!shouldShow && !children) {
    return null;
  }

  return (
    <View style={styles.container}>
      {children}
      {shouldShow && (
        <View
          style={[
            styles.badge,
            sizeStyle,
            positionStyle,
            { backgroundColor: badgeColor },
            displayCount.length > 1 && styles.wideBadge,
          ]}
          accessibilityLabel={`${count} unread notification${count === 1 ? '' : 's'}`}
          accessibilityRole="text"
        >
          <Text
            style={[
              styles.badgeText,
              { fontSize: sizeStyle.fontSize, color: theme.colors.onError },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {displayCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 1,
  },
  wideBadge: {
    paddingHorizontal: 6,
  },
  badgeText: {
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default NotificationBadge; 