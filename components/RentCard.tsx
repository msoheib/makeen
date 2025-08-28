import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { lightTheme, darkTheme, spacing, shadows } from '@/lib/theme';
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
            جاري التحميل...
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
        نظرة عامة على الإيجارات
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
            إجمالي الإيجار
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
            المحصل
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
            المعلق
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