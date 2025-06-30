import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, TextInput, IconButton } from 'react-native-paper';
import { Trash2, DollarSign } from 'lucide-react-native';
import { theme, spacing } from '@/lib/theme';
import AccountPicker from '@/components/AccountPicker';
import CostCenterPicker from '@/components/CostCenterPicker';

interface EntryLine {
  id: string;
  account: any;
  amount: string;
  description: string;
  costCenter: any;
}

interface EntryLineItemProps {
  entry: EntryLine;
  type: 'debit' | 'credit';
  currency: string;
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  errors?: {
    account?: string;
    amount?: string;
    description?: string;
  };
}

export default function EntryLineItem({
  entry,
  type,
  currency,
  onUpdate,
  onRemove,
  canRemove,
  errors = {},
}: EntryLineItemProps) {
  const formatAmount = (amount: string) => {
    const numericAmount = parseFloat(amount) || 0;
    return `${currency} ${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <View style={[styles.container, type === 'debit' ? styles.debitLine : styles.creditLine]}>
      <View style={styles.header}>
        <View style={styles.typeIndicator}>
          <Text style={[styles.typeText, type === 'debit' ? styles.debitText : styles.creditText]}>
            {type === 'debit' ? 'Dr.' : 'Cr.'}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.lineTitle}>
            {type === 'debit' ? 'Debit Entry' : 'Credit Entry'}
          </Text>
          {entry.amount && (
            <Text style={styles.amountPreview}>
              {formatAmount(entry.amount)}
            </Text>
          )}
        </View>
        {canRemove && (
          <IconButton
            icon={() => <Trash2 size={20} color={theme.colors.error} />}
            onPress={() => onRemove(entry.id)}
            style={styles.removeButton}
          />
        )}
      </View>

      <View style={styles.content}>
        {/* Account Selection */}
        <AccountPicker
          label="Account *"
          placeholder="Select account"
          value={entry.account}
          onValueChange={(account) => onUpdate(entry.id, 'account', account)}
          error={!!errors.account}
        />
        {errors.account && <Text style={styles.errorText}>{errors.account}</Text>}

        {/* Amount and Description Row */}
        <View style={styles.row}>
          <View style={styles.amountContainer}>
            <Text style={styles.label}>Amount ({currency}) *</Text>
            <TextInput
              mode="outlined"
              placeholder="0.00"
              value={entry.amount}
              onChangeText={(text) => onUpdate(entry.id, 'amount', text)}
              keyboardType="numeric"
              style={styles.amountInput}
              left={<TextInput.Icon icon={() => <DollarSign size={20} />} />}
              error={!!errors.amount}
            />
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              mode="outlined"
              placeholder="Enter description"
              value={entry.description}
              onChangeText={(text) => onUpdate(entry.id, 'description', text)}
              style={styles.descriptionInput}
              error={!!errors.description}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>
        </View>

        {/* Cost Center (Optional) */}
        <CostCenterPicker
          label="Cost Center"
          placeholder="Select cost center (optional)"
          value={entry.costCenter}
          onValueChange={(costCenter) => onUpdate(entry.id, 'costCenter', costCenter)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  debitLine: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  creditLine: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
  },
  typeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  debitText: {
    color: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  },
  creditText: {
    color: theme.colors.secondary,
    backgroundColor: theme.colors.secondaryContainer,
  },
  headerInfo: {
    flex: 1,
  },
  lineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  amountPreview: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  removeButton: {
    margin: 0,
  },
  content: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  amountContainer: {
    flex: 1,
  },
  descriptionContainer: {
    flex: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  amountInput: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.sm,
  },
  descriptionInput: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
}); 