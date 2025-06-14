import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { formatNumber } from '@/lib/formatters';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  loading?: boolean;
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  color, 
  loading = false 
}: StatCardProps) {
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.outline,
        minHeight: theme.components.card.minHeight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.sm,
      }
    ]}>
      <Text style={[
        styles.title, 
        { 
          color: theme.colors.onSurfaceVariant,
          fontSize: theme.fontSize.sm,
          marginBottom: theme.spacing.xs,
        }
      ]}>
        {title}
      </Text>
      
      {loading ? (
        <View style={[styles.loadingContainer, { minHeight: theme.fontSize['2xl'] + 8 }]}>
          <ActivityIndicator size="small" color={color} />
        </View>
      ) : (
        <>
          <Text style={[
            styles.value, 
            { 
              color, 
              fontSize: theme.fontSize['2xl'],
              lineHeight: theme.fontSize['2xl'] + 4,
              marginBottom: theme.spacing.xs,
            }
          ]}>
            {typeof value === 'number' ? formatNumber(value) : value}
          </Text>
          {subtitle && (
            <Text style={[
              styles.subtitle, 
              { 
                color: theme.colors.onSurfaceVariant,
                fontSize: theme.fontSize.xs,
              }
            ]}>
              {subtitle}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
  },
  title: {
    fontWeight: '500',
  },
  value: {
    fontWeight: '700',
  },
  subtitle: {
    fontWeight: '400',
    lineHeight: 14, // compact line height
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});