import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/useTranslation';
import { formatCurrency } from '@/lib/formatters';

interface CashflowCardProps {
  income: string;
  expenses: string;
  netIncome: string;
  loading?: boolean;
}

export default function CashflowCard({ 
  income, 
  expenses, 
  netIncome, 
  loading = false 
}: CashflowCardProps) {
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { t } = useTranslation();

  if (loading) {
    return (
      <View style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
          minHeight: theme.components.card.minHeight * 2,
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.md,
          ...theme.shadows.sm,
        }
      ]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[
            styles.loadingText, 
            { 
              color: theme.colors.onSurfaceVariant,
              fontSize: theme.fontSize.sm,
              marginTop: theme.spacing.sm,
            }
          ]}>
            {t('common.loading')}
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
        minHeight: theme.components.card.minHeight * 2,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.sm,
      }
    ]}>
      <Text style={[
        styles.title, 
        { 
          color: theme.colors.onSurface,
          fontSize: theme.fontSize.lg,
          marginBottom: theme.spacing.md,
        }
      ]}>
        {t('dashboard.cashFlow')}
      </Text>
      
      <View style={[styles.row, { marginBottom: theme.spacing.sm }]}>
        <Text style={[
          styles.label, 
          { 
            color: theme.colors.onSurfaceVariant,
            fontSize: theme.fontSize.sm,
          }
        ]}>
          {t('dashboard.income')}
        </Text>
        <Text style={[
          styles.value, 
          { 
            color: theme.colors.success,
            fontSize: theme.fontSize.lg,
          }
        ]}>
          {income}
        </Text>
      </View>

      <View style={[styles.row, { marginBottom: theme.spacing.sm }]}>
        <Text style={[
          styles.label, 
          { 
            color: theme.colors.onSurfaceVariant,
            fontSize: theme.fontSize.sm,
          }
        ]}>
          {t('dashboard.expenses')}
        </Text>
        <Text style={[
          styles.value, 
          { 
            color: theme.colors.error,
            fontSize: theme.fontSize.lg,
          }
        ]}>
          {expenses}
        </Text>
      </View>

      <View style={[styles.separator, { 
        backgroundColor: theme.colors.outline,
        marginVertical: theme.spacing.sm,
      }]} />

      <View style={styles.row}>
        <Text style={[
          styles.label, 
          { 
            color: theme.colors.onSurface,
            fontSize: theme.fontSize.md,
            fontWeight: '600',
          }
        ]}>
          {t('dashboard.netIncome')}
        </Text>
        <Text style={[
          styles.value, 
          { 
            color: theme.colors.primary,
            fontSize: theme.fontSize.xl,
            fontWeight: '700',
          }
        ]}>
          {netIncome}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
  },
  title: {
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '400',
  },
  value: {
    fontWeight: '600',
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