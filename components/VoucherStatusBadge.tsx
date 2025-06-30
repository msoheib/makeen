import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface VoucherStatusBadgeProps {
  status: 'draft' | 'posted' | 'cancelled';
  size?: 'small' | 'medium' | 'large';
}

const VoucherStatusBadge: React.FC<VoucherStatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'draft':
        return {
          backgroundColor: theme.colors.notification + '20',
          textColor: theme.colors.notification,
          borderColor: theme.colors.notification + '40',
        };
      case 'posted':
        return {
          backgroundColor: '#4CAF50' + '20',
          textColor: '#4CAF50',
          borderColor: '#4CAF50' + '40',
        };
      case 'cancelled':
        return {
          backgroundColor: '#F44336' + '20',
          textColor: '#F44336',
          borderColor: '#F44336' + '40',
        };
      default:
        return {
          backgroundColor: theme.colors.onSurfaceVariant + '20',
          textColor: theme.colors.onSurfaceVariant,
          borderColor: theme.colors.onSurfaceVariant + '40',
        };
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'posted':
        return 'Posted';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
          fontSize: 10,
          borderRadius: 8,
        };
      case 'large':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 14,
          borderRadius: 16,
        };
      default: // medium
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 12,
          borderRadius: 12,
        };
    }
  };

  const colors = getStatusColor();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: sizeStyles.borderRadius,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.textColor,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {getStatusText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default VoucherStatusBadge; 