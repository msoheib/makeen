import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { lightTheme, darkTheme, spacing, borderRadius, shadows } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/formatters';

interface RentCardProps {
  totalRent: number;
  collectedRent: number;
  pendingRent: number;
  loading?: boolean;
  theme?: any;
}

export default function RentCard({ 
  totalRent, 
  collectedRent, 
  pendingRent, 
  loading = false,
  theme: propTheme
}: RentCardProps) {
  const { isDarkMode } = useAppStore();
  const theme = propTheme || (isDarkMode ? darkTheme : lightTheme);

  if (loading) {
    return (
      <View style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
          minHeight: 200,
          padding: spacing.m,
          borderRadius: borderRadius.medium,
          ...shadows.small,
        }
      ]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[
            styles.loadingText, 
            { 
              color: theme.colors.onSurfaceVariant,
              fontSize: 14,
              marginTop: spacing.s,
            }
          ]}>
            جاري التحميل...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.outline,
        minHeight: 200,
        padding: spacing.m,
        borderRadius: borderRadius.medium,
        ...shadows.small,
      }
    ]}>
      <Text style={[
        styles.title, 
        { 
          color: theme.colors.onSurface,
          fontSize: 18,
          marginBottom: spacing.m,
        }
      ]}>
        نظرة عامة على الإيجارات
      </Text>
      
      <View style={[styles.row, { marginBottom: spacing.s }]}>
        <Text style={[
          styles.label, 
          { 
            color: theme.colors.onSurfaceVariant,
            fontSize: 14,
          }
        ]}>
          إجمالي الإيجار
        </Text>
        <Text style={[
          styles.value, 
          { 
            color: theme.colors.primary,
            fontSize: 18,
          }
        ]}>
          {formatCurrency(totalRent)} ريال
        </Text>
      </View>

      <View style={[styles.row, { marginBottom: spacing.s }]}>
        <Text style={[
          styles.label, 
          { 
            color: theme.colors.onSurfaceVariant,
            fontSize: 14,
          }
        ]}>
          المحصل
        </Text>
        <Text style={[
          styles.value, 
          { 
            color: '#4CAF50',
            fontSize: 18,
          }
        ]}>
          {formatCurrency(collectedRent)} ريال
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={[
          styles.label, 
          { 
            color: theme.colors.onSurfaceVariant,
            fontSize: 14,
          }
        ]}>
          المعلق
        </Text>
        <Text style={[
          styles.value, 
          { 
            color: theme.colors.error,
            fontSize: 18,
          }
        ]}>
          {formatCurrency(pendingRent)} ريال
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    marginVertical: 8,
  },
  title: {
    fontWeight: '600',
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '400',
    textAlign: 'right',
    flex: 1,
  },
  value: {
    fontWeight: '600',
    textAlign: 'left',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
});