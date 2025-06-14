import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/useTranslation';
import { formatCurrency } from '@/lib/formatters';

interface RentCardProps {
  totalRent: string;
  collected: string;
  outstanding: string;
  loading?: boolean;
}

export default function RentCard({ 
  totalRent, 
  collected, 
  outstanding, 
  loading = false 
}: RentCardProps) {
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
        {t('dashboard.rentOverview')}
      </Text>
      
      <View style={[styles.row, { marginBottom: theme.spacing.sm }]}>
        <Text style={[
          styles.label, 
          { 
            color: theme.colors.onSurfaceVariant,
            fontSize: theme.fontSize.sm,
          }
        ]}>
          {t('dashboard.totalRent')}
        </Text>
        <Text style={[
          styles.value, 
          { 
            color: theme.colors.primary,
            fontSize: theme.fontSize.lg,
          }
        ]}>
          {totalRent}
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
          {t('dashboard.collected')}
        </Text>
        <Text style={[
          styles.value, 
          { 
            color: theme.colors.success,
            fontSize: theme.fontSize.lg,
          }
        ]}>
          {collected}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={[
          styles.label, 
          { 
            color: theme.colors.onSurfaceVariant,
            fontSize: theme.fontSize.sm,
          }
        ]}>
          {t('dashboard.outstanding')}
        </Text>
        <Text style={[
          styles.value, 
          { 
            color: theme.colors.error,
            fontSize: theme.fontSize.lg,
          }
        ]}>
          {outstanding}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
});