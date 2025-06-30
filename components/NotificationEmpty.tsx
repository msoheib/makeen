import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import { Bell, Search, Filter } from 'lucide-react-native';

interface NotificationEmptyProps {
  hasFilter?: boolean;
  filterType?: string;
  searchQuery?: string;
  onClearFilter?: () => void;
}

export const NotificationEmpty: React.FC<NotificationEmptyProps> = ({
  hasFilter = false,
  filterType,
  searchQuery,
  onClearFilter,
}) => {
  const getEmptyMessage = () => {
    if (searchQuery) {
      return {
        title: 'No Results Found',
        message: `No notifications match "${searchQuery}". Try a different search term.`,
        icon: <Search size={64} color={theme.colors.onSurfaceVariant} />,
      };
    }
    
    if (filterType && filterType !== 'all') {
      const filterMessages = {
        unread: {
          title: 'No Unread Notifications',
          message: 'You\'re all caught up! No unread notifications at the moment.',
        },
        read: {
          title: 'No Read Notifications',
          message: 'No read notifications found in your history.',
        },
        maintenance: {
          title: 'No Maintenance Notifications',
          message: 'No maintenance-related notifications found.',
        },
        payment: {
          title: 'No Payment Notifications',
          message: 'No payment-related notifications found.',
        },
        tenant: {
          title: 'No Tenant Notifications',
          message: 'No tenant-related notifications found.',
        },
        property: {
          title: 'No Property Notifications',
          message: 'No property-related notifications found.',
        },
        system: {
          title: 'No System Notifications',
          message: 'No system notifications found.',
        },
        invoice: {
          title: 'No Invoice Notifications',
          message: 'No invoice-related notifications found.',
        },
        contract: {
          title: 'No Contract Notifications',
          message: 'No contract-related notifications found.',
        },
      };
      
      const filterInfo = filterMessages[filterType as keyof typeof filterMessages];
      return {
        title: filterInfo?.title || 'No Notifications',
        message: filterInfo?.message || 'No notifications found for this filter.',
        icon: <Filter size={64} color={theme.colors.onSurfaceVariant} />,
      };
    }
    
    return {
      title: 'No Notifications',
      message: 'You don\'t have any notifications yet. When you receive notifications, they\'ll appear here.',
      icon: <Bell size={64} color={theme.colors.onSurfaceVariant} />,
    };
  };

  const { title, message, icon } = getEmptyMessage();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        
        <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
          {message}
        </Text>
        
        {hasFilter && onClearFilter && (
          <Button
            mode="outlined"
            onPress={onClearFilter}
            style={styles.clearButton}
            contentStyle={styles.buttonContent}
          >
            Clear Filter
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: spacing.xl,
    opacity: 0.6,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  clearButton: {
    marginTop: spacing.lg,
  },
  buttonContent: {
    paddingHorizontal: spacing.md,
  },
});

export default NotificationEmpty; 