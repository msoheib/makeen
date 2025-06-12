import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Card, Button, IconButton } from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import { Trash2 } from 'lucide-react-native';
import { invoicesApi } from '@/lib/api';

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total?: number;
  vat_amount?: number;
  total_with_vat?: number;
}

interface InvoiceLineItemProps {
  item: LineItem;
  vatRate: number;
  onUpdate: (item: LineItem) => void;
  onRemove: () => void;
  canRemove?: boolean;
}

export default function InvoiceLineItem({
  item,
  vatRate,
  onUpdate,
  onRemove,
  canRemove = true
}: InvoiceLineItemProps) {
  const [description, setDescription] = useState(item.description || '');
  const [quantity, setQuantity] = useState(item.quantity?.toString() || '1');
  const [unitPrice, setUnitPrice] = useState(item.unit_price?.toString() || '0');
  const [calculations, setCalculations] = useState({
    line_total: 0,
    vat_amount: 0,
    total_with_vat: 0
  });

  // Recalculate totals when inputs change
  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    const lineTotal = qty * price;
    
    const vatCalc = invoicesApi.calculateVAT(lineTotal, vatRate);
    
    setCalculations({
      line_total: lineTotal,
      vat_amount: vatCalc.vatAmount,
      total_with_vat: vatCalc.grossAmount
    });

    // Update parent with calculated values
    onUpdate({
      description,
      quantity: qty,
      unit_price: price,
      line_total: lineTotal,
      vat_amount: vatCalc.vatAmount,
      total_with_vat: vatCalc.grossAmount
    });
  }, [description, quantity, unitPrice, vatRate, onUpdate]);

  const formatSAR = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleSmall" style={styles.headerText}>
            Line Item
          </Text>
          {canRemove && (
            <IconButton
              icon={({ size, color }) => (
                <Trash2 size={size} color={color} />
              )}
              iconColor={theme.colors.error}
              size={20}
              onPress={onRemove}
            />
          )}
        </View>

        {/* Description */}
        <View style={styles.inputContainer}>
          <Text variant="labelMedium" style={styles.label}>
            Description *
          </Text>
          <TextInput
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter item description"
            style={styles.input}
            dense
          />
        </View>

        {/* Quantity and Unit Price Row */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text variant="labelMedium" style={styles.label}>
              Quantity *
            </Text>
            <TextInput
              mode="outlined"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              keyboardType="numeric"
              style={styles.input}
              dense
            />
          </View>

          <View style={styles.halfWidth}>
            <Text variant="labelMedium" style={styles.label}>
              Unit Price (SAR) *
            </Text>
            <TextInput
              mode="outlined"
              value={unitPrice}
              onChangeText={setUnitPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              style={styles.input}
              dense
            />
          </View>
        </View>

        {/* Calculations Display */}
        <View style={styles.calculationsContainer}>
          <View style={styles.calculationRow}>
            <Text variant="bodyMedium" style={styles.calculationLabel}>
              Line Total:
            </Text>
            <Text variant="bodyMedium" style={styles.calculationValue}>
              {formatSAR(calculations.line_total)}
            </Text>
          </View>

          <View style={styles.calculationRow}>
            <Text variant="bodyMedium" style={styles.calculationLabel}>
              VAT ({vatRate}%):
            </Text>
            <Text variant="bodyMedium" style={styles.calculationValue}>
              {formatSAR(calculations.vat_amount)}
            </Text>
          </View>

          <View style={[styles.calculationRow, styles.totalRow]}>
            <Text variant="titleMedium" style={styles.totalLabel}>
              Total with VAT:
            </Text>
            <Text variant="titleMedium" style={styles.totalValue}>
              {formatSAR(calculations.total_with_vat)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: spacing.sm,
  },
  label: {
    marginBottom: spacing.xs,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  halfWidth: {
    flex: 1,
  },
  calculationsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  calculationLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  calculationValue: {
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary,
  },
  totalLabel: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  totalValue: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
}); 