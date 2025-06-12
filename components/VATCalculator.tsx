import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Chip, SegmentedButtons } from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import { Calculator } from 'lucide-react-native';

interface VATCalculatorProps {
  subtotal: number;
  vatRate: number;
  discountAmount?: number;
  vatIncluded?: boolean;
  onVATRateChange?: (rate: number) => void;
  onVATIncludedChange?: (included: boolean) => void;
  lineItemTotals?: any[];
}

export default function VATCalculator({
  subtotal,
  vatRate,
  discountAmount = 0,
  vatIncluded = false,
  onVATRateChange,
  onVATIncludedChange,
  lineItemTotals = []
}: VATCalculatorProps) {
  const formatSAR = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate totals based on VAT inclusion
  const calculateTotals = () => {
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    
    if (vatIncluded) {
      // VAT is included in the subtotal
      const totalWithVAT = discountedSubtotal;
      const vatAmount = totalWithVAT / (1 + vatRate / 100) * (vatRate / 100);
      const netAmount = totalWithVAT - vatAmount;
      
      return {
        netAmount: Math.round(netAmount * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        totalAmount: Math.round(totalWithVAT * 100) / 100,
      };
    } else {
      // VAT is added to the subtotal
      const netAmount = discountedSubtotal;
      const vatAmount = netAmount * (vatRate / 100);
      const totalAmount = netAmount + vatAmount;
      
      return {
        netAmount: Math.round(netAmount * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
      };
    }
  };

  const totals = calculateTotals();

  const vatRateOptions = [
    { value: '0', label: '0%' },
    { value: '5', label: '5%' },
    { value: '15', label: '15%' },
  ];

  const vatInclusionOptions = [
    { value: 'exclusive', label: 'VAT Exclusive' },
    { value: 'inclusive', label: 'VAT Inclusive' },
  ];

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <Calculator size={20} color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.headerText}>
            VAT Calculation
          </Text>
        </View>

        {/* VAT Rate Selection */}
        {onVATRateChange && (
          <View style={styles.controlContainer}>
            <Text variant="labelMedium" style={styles.label}>
              VAT Rate
            </Text>
            <SegmentedButtons
              value={vatRate.toString()}
              onValueChange={(value) => onVATRateChange(parseFloat(value))}
              buttons={vatRateOptions}
              style={styles.segmentedButtons}
            />
          </View>
        )}

        {/* VAT Inclusion Toggle */}
        {onVATIncludedChange && (
          <View style={styles.controlContainer}>
            <Text variant="labelMedium" style={styles.label}>
              VAT Application
            </Text>
            <SegmentedButtons
              value={vatIncluded ? 'inclusive' : 'exclusive'}
              onValueChange={(value) => onVATIncludedChange(value === 'inclusive')}
              buttons={vatInclusionOptions}
              style={styles.segmentedButtons}
            />
          </View>
        )}

        {/* Calculation Breakdown */}
        <View style={styles.calculationContainer}>
          <View style={styles.calculationRow}>
            <Text variant="bodyMedium" style={styles.calculationLabel}>
              Subtotal:
            </Text>
            <Text variant="bodyMedium" style={styles.calculationValue}>
              {formatSAR(subtotal)}
            </Text>
          </View>

          {discountAmount > 0 && (
            <View style={styles.calculationRow}>
              <Text variant="bodyMedium" style={[styles.calculationLabel, styles.discountText]}>
                Discount:
              </Text>
              <Text variant="bodyMedium" style={[styles.calculationValue, styles.discountText]}>
                -{formatSAR(discountAmount)}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.calculationRow}>
            <Text variant="bodyMedium" style={styles.calculationLabel}>
              Net Amount:
            </Text>
            <Text variant="bodyMedium" style={styles.calculationValue}>
              {formatSAR(totals.netAmount)}
            </Text>
          </View>

          <View style={styles.calculationRow}>
            <Text variant="bodyMedium" style={styles.calculationLabel}>
              VAT ({vatRate}%):
            </Text>
            <Text variant="bodyMedium" style={styles.calculationValue}>
              {formatSAR(totals.vatAmount)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.calculationRow, styles.totalRow]}>
            <Text variant="titleMedium" style={styles.totalLabel}>
              Total Amount:
            </Text>
            <Text variant="titleMedium" style={styles.totalValue}>
              {formatSAR(totals.totalAmount)}
            </Text>
          </View>

          {/* VAT Compliance Information */}
          <View style={styles.complianceContainer}>
            <Chip
              icon="information"
              mode="outlined"
              compact
              style={styles.complianceChip}
              textStyle={styles.complianceText}
            >
              KSA VAT Compliant
            </Chip>
            <Text variant="bodySmall" style={styles.complianceNote}>
              Calculated according to Saudi Arabia VAT regulations
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    elevation: 3,
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  headerText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  controlContainer: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.sm,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  segmentedButtons: {
    marginTop: spacing.xs,
  },
  calculationContainer: {
    marginTop: spacing.md,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  calculationLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  calculationValue: {
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  discountText: {
    color: theme.colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.outline,
    marginVertical: spacing.sm,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary,
  },
  totalLabel: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  totalValue: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 18,
  },
  complianceContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  complianceChip: {
    marginBottom: spacing.xs,
    borderColor: theme.colors.primary,
  },
  complianceText: {
    color: theme.colors.primary,
    fontSize: 12,
  },
  complianceNote: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 