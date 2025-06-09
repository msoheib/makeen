import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme, spacing, shadows } from '@/lib/theme';
import ModernCard from './ModernCard';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  color = theme.colors.primary,
  icon,
  trend 
}: StatCardProps) {
  return (
    <ModernCard style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>
            {title}
          </Text>
          {trend && (
            <View style={[
              styles.trendContainer,
              { backgroundColor: trend.isPositive ? theme.colors.successContainer : theme.colors.errorContainer }
            ]}>
              <Text style={[
                styles.trendText,
                { color: trend.isPositive ? theme.colors.success : theme.colors.error }
              ]}>
                {trend.isPositive ? '+' : ''}{trend.value}
              </Text>
            </View>
          )}
        </View>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            {icon}
          </View>
        )}
      </View>
      
      <Text style={[styles.value, { color }]}>
        {value}
      </Text>
      
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {subtitle}
        </Text>
      )}
    </ModernCard>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 160,
    marginRight: spacing.m,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  trendContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
});