import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import VoucherStatusBadge from './VoucherStatusBadge';
import VoucherTypeIcon from './VoucherTypeIcon';

interface VoucherCardProps {
  voucher: {
    id: string;
    voucher_number: string;
    voucher_type: 'receipt' | 'payment' | 'journal';
    status: 'draft' | 'posted' | 'cancelled';
    amount: number;
    currency: string;
    description?: string;
    created_at: string;
    property?: { title: string; property_code?: string };
    tenant?: { first_name: string; last_name: string };
    account?: { account_name: string; account_code: string };
    created_by_user?: { first_name: string; last_name: string };
  };
  onPress?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onPost?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const VoucherCard: React.FC<VoucherCardProps> = ({
  voucher,
  onPress,
  onEdit,
  onDuplicate,
  onPost,
  onCancel,
  onDelete,
  showActions = true,
}) => {
  const theme = useTheme();

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVoucherTypeLabel = () => {
    switch (voucher.voucher_type) {
      case 'receipt':
        return 'Receipt Voucher';
      case 'payment':
        return 'Payment Voucher';
      case 'journal':
        return 'Journal Entry';
      default:
        return 'Voucher';
    }
  };

  const handleActionPress = (action: string) => {
    switch (action) {
      case 'edit':
        onEdit?.();
        break;
      case 'duplicate':
        onDuplicate?.();
        break;
      case 'post':
        Alert.alert(
          'Post Voucher',
          'Are you sure you want to post this voucher? Posted vouchers cannot be edited.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Post', style: 'default', onPress: onPost },
          ]
        );
        break;
      case 'cancel':
        Alert.alert(
          'Cancel Voucher',
          'Are you sure you want to cancel this voucher? This action cannot be undone.',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes, Cancel', style: 'destructive', onPress: onCancel },
          ]
        );
        break;
      case 'delete':
        Alert.alert(
          'Delete Voucher',
          'Are you sure you want to delete this voucher? This action cannot be undone.',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes, Delete', style: 'destructive', onPress: onDelete },
          ]
        );
        break;
    }
  };

  const getAvailableActions = () => {
    const actions = [];
    
    // Always available actions
    actions.push({ key: 'duplicate', icon: 'content-copy', label: 'Duplicate' });
    
    // Status-dependent actions
    if (voucher.status === 'draft') {
      actions.push({ key: 'edit', icon: 'edit', label: 'Edit' });
      actions.push({ key: 'post', icon: 'publish', label: 'Post' });
      actions.push({ key: 'delete', icon: 'delete', label: 'Delete' });
    } else if (voucher.status === 'posted') {
      actions.push({ key: 'cancel', icon: 'cancel', label: 'Cancel' });
    }
    
    return actions;
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <VoucherTypeIcon type={voucher.voucher_type} size={20} />
          <View style={styles.titleInfo}>
            <Text style={[styles.voucherType, { color: theme.colors.onSurface }]}>
              {getVoucherTypeLabel()}
            </Text>
            <Text style={[styles.voucherNumber, { color: theme.colors.onSurfaceVariant }]}>
              {voucher.voucher_number}
            </Text>
          </View>
        </View>
        <View style={styles.statusRow}>
          <VoucherStatusBadge status={voucher.status} size="small" />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.amountRow}>
          <Text style={[styles.amount, { color: theme.colors.primary }]}>
            {formatAmount(voucher.amount, voucher.currency)}
          </Text>
          <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
            {formatDate(voucher.created_at)}
          </Text>
        </View>

        {voucher.description && (
          <Text 
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {voucher.description}
          </Text>
        )}

        <View style={styles.details}>
          {voucher.property && (
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
              {' '}{voucher.property.title}
              {voucher.property.property_code && ` (${voucher.property.property_code})`}
            </Text>
            </View>
          )}
          
          {voucher.tenant && (
            <View style={styles.detailRow}>
              <MaterialIcons name="person" size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
              {' '}{voucher.tenant.first_name} {voucher.tenant.last_name}
            </Text>
            </View>
          )}
          
          {voucher.account && (
            <View style={styles.detailRow}>
              <MaterialIcons name="account-balance" size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
              {' '}{voucher.account.account_code} - {voucher.account.account_name}
            </Text>
            </View>
          )}
        </View>
      </View>

      {showActions && (
        <View style={[styles.actions, { borderTopColor: theme.colors.outline }]}>
          {getAvailableActions().map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.actionButton}
              onPress={() => handleActionPress(action.key)}
            >
              <MaterialIcons
                name={action.icon as keyof typeof MaterialIcons.glyphMap}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  voucherType: {
    fontSize: 16,
    fontWeight: '600',
  },
  voucherNumber: {
    fontSize: 14,
    marginTop: 2,
  },
  statusRow: {
    marginLeft: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  details: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default VoucherCard;