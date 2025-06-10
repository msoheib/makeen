import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { theme, spacing, shadows } from '@/lib/theme';
import ModernCard from './ModernCard';

interface RentCardProps {
  outstandingAmount: number;
  totalDue: number;
  collectedAmount: number;
  currency?: string;
  loading?: boolean;
}

export default function RentCard({ 
  outstandingAmount, 
  totalDue, 
  collectedAmount,
  currency = '$',
  loading = false
}: RentCardProps) {
  if (loading) {
    return (
      <ModernCard style={styles.container}>
        <Text style={styles.title}>Rent</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading financial data...</Text>
        </View>
      </ModernCard>
    );
  }

  return (
    <ModernCard style={styles.container}>
      <Text style={styles.title}>Financial Overview</Text>
      
      <View style={styles.amountsContainer}>
        <View style={styles.amountRow}>
          <View style={styles.amountItem}>
            <Text style={[styles.amount, { color: theme.colors.error }]}>
              {currency}{outstandingAmount.toFixed(2)}
            </Text>
            <Text style={styles.label}>Outstanding Payments</Text>
          </View>
          
          <View style={styles.amountItem}>
            <Text style={[styles.amount, { color: theme.colors.primary }]}>
              {currency}{totalDue.toFixed(2)}
            </Text>
            <Text style={styles.label}>Total Due</Text>
          </View>
        </View>
        
        <View style={styles.collectedRow}>
          <Text style={[styles.collectedText, { color: theme.colors.primary }]}>
            {currency}{collectedAmount.toFixed(2)} collected this month
          </Text>
        </View>
      </View>
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
  amountsContainer: {
    gap: spacing.l,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountItem: {
    flex: 1,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '400',
  },
  collectedRow: {
    alignItems: 'flex-start',
  },
  collectedText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.m,
    color: theme.colors.onSurfaceVariant,
  },
});