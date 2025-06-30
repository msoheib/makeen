import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, Text } from 'react-native-paper';
import { theme } from '@/lib/theme';

// Define the status types
type PropertyStatus = 'available' | 'rented' | 'maintenance' | 'reserved';
type MaintenanceStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
type VoucherStatus = 'draft' | 'posted' | 'cancelled';
type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
type ContractStatus = 'active' | 'expired' | 'terminated' | 'renewal';

// Union type for all statuses
type Status = PropertyStatus | MaintenanceStatus | VoucherStatus | InvoiceStatus | ContractStatus;

// Color mapping for all status types
const statusColors = {
  // Property statuses
  available: theme.colors.success,
  rented: theme.colors.primary,
  maintenance: theme.colors.warning,
  reserved: theme.colors.tertiary,
  
  // Maintenance statuses
  pending: theme.colors.warning,
  approved: theme.colors.primary,
  in_progress: theme.colors.tertiary,
  completed: theme.colors.success,
  cancelled: theme.colors.error,
  
  // Voucher/Invoice statuses
  draft: theme.colors.tertiary,
  posted: theme.colors.success,
  sent: theme.colors.primary,
  paid: theme.colors.success,
  overdue: theme.colors.error,
  
  // Contract statuses
  active: theme.colors.success,
  expired: theme.colors.onSurfaceVariant,
  terminated: theme.colors.error,
  renewal: theme.colors.tertiary,
};

interface StatusBadgeProps {
  status: Status;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export default function StatusBadge({ status, size = 'medium', style }: StatusBadgeProps) {
  // Format the status text (convert snake_case to Title Case)
  const formattedStatus = status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Determine styles based on size
  const sizeStyles = {
    small: {
      container: styles.smallContainer,
      text: styles.smallText,
    },
    medium: {
      container: styles.mediumContainer,
      text: styles.mediumText,
    },
    large: {
      container: styles.largeContainer,
      text: styles.largeText,
    },
  };
  
  return (
    <View
      style={[
        styles.container,
        sizeStyles[size].container,
        { backgroundColor: `${statusColors[status]}20` },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          sizeStyles[size].text,
          { color: statusColors[status] },
        ]}
      >
        {formattedStatus}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '500',
  },
  // Size variations
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  smallText: {
    fontSize: 10,
  },
  mediumContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  mediumText: {
    fontSize: 12,
  },
  largeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  largeText: {
    fontSize: 14,
  },
});