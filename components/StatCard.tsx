import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { lightTheme, darkTheme, spacing, borderRadius, shadows, rtlStyles } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { formatNumber } from '@/lib/formatters';
import { isRTL } from '@/lib/rtl';

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
        padding: spacing.m,
        borderRadius: borderRadius.medium,
        ...shadows.small,
      }
    ]}>
      <View style={[styles.header, rtlStyles.row()]}>
        {icon && (
          <View style={[styles.iconContainer, rtlStyles.marginEnd(8)]}>
            {icon}
          </View>
        )}
        <Text style={[
          styles.title, 
          rtlStyles.textAlign(),
          { 
            color: theme.colors.onSurfaceVariant,
            fontSize: 13,
          }
        ]} numberOfLines={2}>
          {title}
        </Text>
      </View>
      
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={color} />
          </View>
        ) : (
          <>
            <Text style={[
              styles.value, 
              { 
                color, 
                fontSize: 28,
                lineHeight: 32,
              }
            ]}>
              {typeof value === 'number' ? formatNumber(value) : value}
            </Text>
            {subtitle && (
              <Text style={[
                styles.subtitle, 
                { 
                  color: theme.colors.onSurfaceVariant,
                  fontSize: 11,
                }
              ]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    marginHorizontal: 0,
    marginVertical: 0,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 8,
    minHeight: 24,
  },
  iconContainer: {
    // RTL-aware margins are now handled by rtlStyles.marginEnd(8)
  },
  title: {
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 18,
    // RTL-aware text alignment is now handled by rtlStyles.textAlign()
  },
  value: {
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 8,
  },
  subtitle: {
    fontWeight: '400',
    lineHeight: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});