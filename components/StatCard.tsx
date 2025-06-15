import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { lightTheme, darkTheme, spacing, borderRadius, shadows } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { formatNumber } from '@/lib/formatters';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  color, 
  loading = false,
  icon
}: StatCardProps) {
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.outline,
        minHeight: 100,
        padding: spacing.m,
        borderRadius: borderRadius.medium,
        ...shadows.small,
      }
    ]}>
      <View style={styles.header}>
        {icon && (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}
        <Text style={[
          styles.title, 
          { 
            color: theme.colors.onSurfaceVariant,
            fontSize: 14,
            marginBottom: spacing.xs,
          }
        ]}>
          {title}
        </Text>
      </View>
      
      {loading ? (
        <View style={[styles.loadingContainer, { minHeight: 32 }]}>
          <ActivityIndicator size="small" color={color} />
        </View>
      ) : (
        <>
          <Text style={[
            styles.value, 
            { 
              color, 
              fontSize: 24,
              lineHeight: 28,
              marginBottom: spacing.xs,
            }
          ]}>
            {typeof value === 'number' ? formatNumber(value) : value}
          </Text>
          {subtitle && (
            <Text style={[
              styles.subtitle, 
              { 
                color: theme.colors.onSurfaceVariant,
                fontSize: 12,
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
    marginHorizontal: 4,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  title: {
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  value: {
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '400',
    lineHeight: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});