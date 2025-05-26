import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Voucher } from '@/lib/types';
import { CreditCard, Calendar, FileText } from 'lucide-react-native';
import { theme, shadows } from '@/lib/theme';
import { format } from 'date-fns';
import StatusBadge from './StatusBadge';

// Voucher type icon mapping
const voucherTypeIcons = {
  receipt: <CreditCard size={16} color={theme.colors.success} />,
  payment: <CreditCard size={16} color={theme.colors.error} />,
  journal: <FileText size={16} color={theme.colors.tertiary} />,
};

interface VoucherCardProps {
  voucher: Voucher;
  onPress?: () => void;
}

export default function VoucherCard({ voucher, onPress }: VoucherCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/finance/vouchers/${voucher.id}`);
    }
  };

  // Format voucher type for display
  const voucherTypeDisplay = voucher.voucher_type.charAt(0).toUpperCase() + voucher.voucher_type.slice(1);

  return (
    <Card style={[styles.card, shadows.medium]} onPress={handlePress}>
      <Card.Content style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.voucherNumberContainer}>
            <Text style={styles.voucherLabel}>Voucher #</Text>
            <Text style={styles.voucherNumber}>{voucher.voucher_number}</Text>
          </View>
          <StatusBadge status={voucher.status} />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.iconTextRow}>
            {voucherTypeIcons[voucher.voucher_type]}
            <Text style={styles.typeText}>{voucherTypeDisplay} Voucher</Text>
          </View>
          
          <View style={styles.iconTextRow}>
            <Calendar size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.dateText}>
              {format(new Date(voucher.created_at), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>
            {voucher.currency} {voucher.amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </Text>
        </View>

        {voucher.description && (
          <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
            {voucher.description}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  content: {
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  voucherNumberContainer: {},
  voucherLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  voucherNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  divider: {
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    marginLeft: 4,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  dateText: {
    marginLeft: 4,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  amountContainer: {
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  description: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
});