import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Surface } from 'react-native-paper';
import { theme, shadows } from '@/lib/theme';

interface ModernCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  elevation?: 'small' | 'medium' | 'large';
  gradient?: boolean;
}

export default function ModernCard({ 
  children, 
  style, 
  padding = 'medium',
  elevation = 'medium',
  gradient = false 
}: ModernCardProps) {
  const paddingStyles = {
    none: {},
    small: { padding: 12 },
    medium: { padding: 16 },
    large: { padding: 24 },
  };

  return (
    <Surface 
      style={[
        styles.card,
        shadows[elevation],
        paddingStyles[padding],
        gradient && styles.gradient,
        style
      ]}
    >
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.roundness,
    overflow: 'hidden',
  },
  gradient: {
    backgroundColor: 'transparent',
    // Note: For actual gradient, you'd use LinearGradient from expo-linear-gradient
  },
});