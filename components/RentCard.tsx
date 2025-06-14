import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { theme, spacing, rtlStyles } from '@/lib/theme';
import { useTranslation } from '@/lib/useTranslation';
import ModernCard from './ModernCard';

interface RentCardProps {
  onRentPress?: () => void;
  loading?: boolean;
  financialSummary?: any;
}

export default function RentCard({ 
  onRentPress,
  loading = false,
  financialSummary
}: RentCardProps) {
  const { t } = useTranslation('dashboard');
  
  // Calculate financial metrics from real data
  const totalDue = financialSummary?.total_due || 0;
  const outstandingPayments = financialSummary?.outstanding_payments || 0;
  const collectedThisMonth = financialSummary?.collected_this_month || 0;

  return (
    <ModernCard style={styles.container}>
      <Text style={[styles.title, rtlStyles.textLeft]}>{t('finance.overview')}</Text>
      
      <View style={styles.content}>
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.value}>{totalDue.toLocaleString()} SAR</Text>
            <Text style={[styles.label, rtlStyles.textLeft]}>{t('finance.totalDue')}</Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={[styles.value, { color: theme.colors.error }]}>
              {outstandingPayments.toLocaleString()} SAR
            </Text>
            <Text style={[styles.label, rtlStyles.textLeft]}>{t('finance.outstandingPayments')}</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={[styles.value, { color: theme.colors.success }]}>
              {collectedThisMonth.toLocaleString()} SAR
            </Text>
            <Text style={[styles.label, rtlStyles.textLeft]}>{t('finance.collectedThisMonth')}</Text>
          </View>
        </View>
      </View>
      
      <Button
        mode="contained"
        onPress={onRentPress}
        style={styles.rentButton}
        contentStyle={styles.rentButtonContent}
        loading={loading}
      >
        {t('finance.rent')}
      </Button>
    </ModernCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.l,
  },
  content: {
    gap: spacing.l,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flex: 1,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '400',
  },
  rentButton: {
    marginTop: spacing.m,
  },
  rentButtonContent: {
    padding: spacing.m,
  },
});