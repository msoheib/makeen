import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

interface VoucherTypeIconProps {
  type: 'receipt' | 'payment' | 'journal';
  size?: number;
  color?: string;
  backgroundColor?: string;
  showBackground?: boolean;
}

const VoucherTypeIcon: React.FC<VoucherTypeIconProps> = ({
  type,
  size = 24,
  color,
  backgroundColor,
  showBackground = true,
}) => {
  const theme = useTheme();

  const getIconConfig = () => {
    switch (type) {
      case 'receipt':
        return {
          name: 'receipt' as keyof typeof MaterialIcons.glyphMap,
          defaultColor: '#4CAF50',
          defaultBackgroundColor: '#4CAF50' + '20',
        };
      case 'payment':
        return {
          name: 'payment' as keyof typeof MaterialIcons.glyphMap,
          defaultColor: '#FF9800',
          defaultBackgroundColor: '#FF9800' + '20',
        };
      case 'journal':
        return {
          name: 'book' as keyof typeof MaterialIcons.glyphMap,
          defaultColor: '#2196F3',
          defaultBackgroundColor: '#2196F3' + '20',
        };
      default:
        return {
          name: 'description' as keyof typeof MaterialIcons.glyphMap,
          defaultColor: theme.colors.onSurfaceVariant,
          defaultBackgroundColor: theme.colors.onSurfaceVariant + '20',
        };
    }
  };

  const iconConfig = getIconConfig();
  const iconColor = color || iconConfig.defaultColor;
  const bgColor = backgroundColor || iconConfig.defaultBackgroundColor;

  if (!showBackground) {
    return (
      <MaterialIcons
        name={iconConfig.name}
        size={size}
        color={iconColor}
      />
    );
  }

  const containerSize = size + 16;

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          backgroundColor: bgColor,
          borderRadius: containerSize / 2,
        },
      ]}
    >
      <MaterialIcons
        name={iconConfig.name}
        size={size}
        color={iconColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VoucherTypeIcon; 