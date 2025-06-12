import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { CheckCircle, AlertCircle, Scale } from 'lucide-react-native';
import { theme, spacing } from '@/lib/theme';

interface BalanceDisplayProps {
  totalDebits: number;
  totalCredits: number;
  currency: string;
}

export default function BalanceDisplay({
  totalDebits,
  totalCredits,
  currency,
}: BalanceDisplayProps) {
  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference < 0.01; // Allow for minor floating point differences
  
  const formatAmount = (amount: number) => {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getBalanceStatus = () => {
    if (isBalanced && totalDebits > 0 && totalCredits > 0) {
      return {
        status: 'balanced',
        message: 'Entries are balanced',
        color: theme.colors.primary,
        icon: CheckCircle,
      };
    } else if (totalDebits === 0 && totalCredits === 0) {
      return {
        status: 'empty',
        message: 'No entries added',
        color: theme.colors.onSurfaceVariant,
        icon: Scale,
      };
    } else {
      return {
        status: 'unbalanced',
        message: `Out of balance by ${formatAmount(difference)}`,
        color: theme.colors.error,
        icon: AlertCircle,
      };
    }
  };

  const balanceInfo = getBalanceStatus();
  const IconComponent = balanceInfo.icon;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Journal Entry Balance</Text>
      
      <View style={styles.balanceRow}>
        {/* Debits */}
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Total Debits</Text>
          <Text style={[styles.balanceAmount, styles.debitAmount]}>
            {formatAmount(totalDebits)}
          </Text>
        </View>

        {/* Balance Indicator */}
        <View style={styles.balanceIndicator}>
          <IconComponent 
            size={24} 
            color={balanceInfo.color}
          />
        </View>

        {/* Credits */}
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Total Credits</Text>
          <Text style={[styles.balanceAmount, styles.creditAmount]}>
            {formatAmount(totalCredits)}
          </Text>
        </View>
      </View>

      {/* Balance Status */}
      <View style={styles.statusContainer}>
        <Chip 
          mode={isBalanced ? "flat" : "outlined"}
          style={[
            styles.statusChip,
            isBalanced ? styles.balancedChip : styles.unbalancedChip
          ]}
          textStyle={[
            styles.statusText,
            { color: balanceInfo.color }
          ]}
          icon={() => <IconComponent size={16} color={balanceInfo.color} />}
        >
          {balanceInfo.message}
        </Chip>
      </View>

      {/* Balance Equation */}
      <View style={styles.equationContainer}>
        <Text style={styles.equationText}>
          Dr. {formatAmount(totalDebits)} = Cr. {formatAmount(totalCredits)}
        </Text>
        {!isBalanced && difference > 0 && (
          <Text style={styles.differenceText}>
            Difference: {formatAmount(difference)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  debitAmount: {
    color: theme.colors.primary,
  },
  creditAmount: {
    color: theme.colors.secondary,
  },
  balanceIndicator: {
    marginHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
  },
  balancedChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  unbalancedChip: {
    backgroundColor: theme.colors.errorContainer,
  },
  statusText: {
    fontWeight: '600',
  },
  equationContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  equationText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  differenceText: {
    fontSize: 14,
    color: theme.colors.error,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
}); 