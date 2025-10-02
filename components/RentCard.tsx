import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { spacing, shadows, type AppTheme } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/lib/formatters';
import { useTranslation } from 'react-i18next';

interface RentCardProps {
  totalRent: number;
  collectedRent: number;
  pendingRent: number;
  loading?: boolean;
  theme?: AppTheme;
}

export default function RentCard({ 
  totalRent, 
  collectedRent, 
  pendingRent, 
  loading = false,
  theme: propTheme
}: RentCardProps) {
  const { theme: appTheme } = useAppTheme();
  const theme = propTheme || appTheme;
  const { t } = useTranslation(['dashboard','common']);

  if (loading) {
    return (
      <View 
        style={[
          styles.container, 
          { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
            minHeight: 200,
            padding: spacing.m,
            borderRadius: 12,
            ...shadows.small,
          }
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text 
            style={[
              styles.loadingText, 
              { 
                color: theme.colors.onSurfaceVariant,
                fontSize: 14,
                marginTop: spacing.s,
                textAlign: 'center',
              }
            ]}
          >
            {t('common:loading', { defaultValue: 'Loading...' })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
          minHeight: 200,
          padding: spacing.m,
          borderRadius: 12,
          ...shadows.small,
        }
      ]}
    >
      <Text 
        style={[
          styles.title, 
          { 
            color: theme.colors.onSurface,
            fontSize: 18,
            marginBottom: spacing.m,
            fontWeight: '700',
            textAlign: 'right',
          }
        ]}
      >
        {t('dashboard:rent.overview')}
      </Text>
      
      <View style={[styles.row, { marginBottom: spacing.s }]}>
        <View style={styles.bulletContainer}>
          <View style={[styles.bullet, { backgroundColor: theme.colors.primary }]} />
          <Text 
            style={[
              styles.label, 
              { 
                color: theme.colors.onSurfaceVariant,
                fontSize: 14,
                fontWeight: '500',
                textAlign: 'right',
              }
            ]}
          >
            {t('dashboard:rent.total')}
          </Text>
        </View>
        <Text 
          style={[
            styles.value, 
            { 
              color: theme.colors.primary,
              fontSize: 18,
              fontWeight: '600',
              textAlign: 'left',
            }
          ]}
        >
          {formatCurrency(totalRent)}
        </Text>
      </View>

      <View style={[styles.row, { marginBottom: spacing.s }]}>
        <View style={styles.bulletContainer}>
          <View style={[styles.bullet, { backgroundColor: '#4CAF50' }]} />
          <Text 
            style={[
              styles.label, 
              { 
                color: theme.colors.onSurfaceVariant,
                fontSize: 14,
                fontWeight: '500',
                textAlign: 'right',
              }
            ]}
          >
            {t('dashboard:rent.collected')}
          </Text>
        </View>
        <Text 
          style={[
            styles.value, 
            { 
              color: '#4CAF50',
              fontSize: 18,
              fontWeight: '600',
              textAlign: 'left',
            }
          ]}
        >
          {formatCurrency(collectedRent)}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.bulletContainer}>
          <View style={[styles.bullet, { backgroundColor: theme.colors.error }]} />
          <Text 
            style={[
              styles.label, 
              { 
                color: theme.colors.onSurfaceVariant,
                fontSize: 14,
                fontWeight: '500',
                textAlign: 'right',
              }
            ]}
          >
            {t('dashboard:rent.pending')}
          </Text>
        </View>
        <Text 
          style={[
            styles.value, 
            { 
              color: theme.colors.error,
              fontSize: 18,
              fontWeight: '600',
              textAlign: 'left',
            }
          ]}
        >
          {formatCurrency(pendingRent)}
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
    flex: 1,
  },
  value: {
    fontWeight: '600',
    marginLeft: 8,
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
