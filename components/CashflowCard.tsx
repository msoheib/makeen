import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { lightTheme, darkTheme, spacing, borderRadius, shadows } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/formatters';

interface CashflowCardProps {
  income: number;
  expenses: number;
  netIncome: number;
  loading?: boolean;
  theme?: any;
}

export default function CashflowCard({ 
  income, 
  expenses, 
  netIncome, 
  loading = false,
  theme: propTheme
}: CashflowCardProps) {
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
          borderRadius: 12,
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
        borderRadius: 12,
        ...shadows.small,
      }
    ]}>
      <Text style={[
        styles.title, 
        { 
          color: theme.colors.onSurface,
          fontSize: 18,
          marginBottom: spacing.m,
          fontWeight: '700',
        }
      ]}>
        التدفق النقدي
      </Text>
      
      <View style={[styles.row, { marginBottom: spacing.s }]}>
        <View style={styles.bulletContainer}>
          <View style={[styles.bullet, { backgroundColor: '#4CAF50' }]} />
          <Text style={[
            styles.label, 
            { 
              color: theme.colors.onSurface,
              fontSize: 14,
              fontWeight: '500',
            }
          ]}>
            الدخل
          </Text>
        </View>
        <Text style={[
          styles.value, 
          { 
            color: '#4CAF50',
            fontSize: 18,
            fontWeight: '600',
          }
        ]}>
          {formatCurrency(income)}
        </Text>
      </View>

      <View style={[styles.row, { marginBottom: spacing.s }]}>
        <View style={styles.bulletContainer}>
          <View style={[styles.bullet, { backgroundColor: theme.colors.error }]} />
          <Text style={[
            styles.label, 
            { 
              color: theme.colors.onSurface,
              fontSize: 14,
              fontWeight: '500',
            }
          ]}>
            المصروفات
          </Text>
        </View>
        <Text style={[
          styles.value, 
          { 
            color: theme.colors.error,
            fontSize: 18,
            fontWeight: '600',
          }
        ]}>
          {formatCurrency(expenses)}
        </Text>
      </View>

      <View style={[styles.separator, { 
        backgroundColor: theme.colors.outline,
        marginVertical: spacing.s,
      }]} />

      <View style={styles.row}>
        <View style={styles.bulletContainer}>
          <View style={[styles.bullet, { backgroundColor: theme.colors.primary }]} />
          <Text style={[
            styles.label, 
            { 
              color: theme.colors.onSurface,
              fontSize: 16,
              fontWeight: '600',
            }
          ]}>
            صافي الدخل
          </Text>
        </View>
        <Text style={[
          styles.value, 
          { 
            color: theme.colors.primary,
            fontSize: 20,
            fontWeight: '700',
          }
        ]}>
          {formatCurrency(netIncome)}
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
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    fontWeight: '400',
    textAlign: 'right',
    flex: 1,
  },
  value: {
    fontWeight: '600',
    textAlign: 'left',
    marginLeft: 8,
  },
  separator: {
    height: 1,
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