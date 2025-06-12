import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import { useNotificationNavigation } from '@/hooks/useNotificationNavigation';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  DollarSign, 
  Wrench, 
  Users, 
  FileText,
  Home,
  X,
  ExternalLink
} from 'lucide-react-native';

export interface NotificationData {
  id: string;
  type: 'maintenance' | 'payment' | 'tenant' | 'property' | 'system' | 'invoice' | 'contract';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
}

interface NotificationCardProps {
  notification: NotificationData;
  onPress?: (notification: NotificationData) => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

const getNotificationIcon = (type: string, priority?: string) => {
  const iconSize = 22;
  
  switch (type) {
    case 'maintenance':
      return <Wrench size={iconSize} color={priority === 'urgent' ? theme.colors.error : theme.colors.warning} />;
    case 'payment':
      return <DollarSign size={iconSize} color={theme.colors.success} />;
    case 'tenant':
      return <Users size={iconSize} color={theme.colors.primary} />;
    case 'property':
      return <Home size={iconSize} color={theme.colors.secondary} />;
    case 'invoice':
      return <FileText size={iconSize} color={theme.colors.tertiary} />;
    case 'contract':
      return <FileText size={iconSize} color={theme.colors.primary} />;
    case 'system':
      if (priority === 'urgent' || priority === 'high') {
        return <AlertTriangle size={iconSize} color={theme.colors.error} />;
      }
      return <Info size={iconSize} color={theme.colors.onSurfaceVariant} />;
    default:
      return <Bell size={iconSize} color={theme.colors.onSurfaceVariant} />;
  }
};

const getTypeDisplayName = (type: string): string => {
  const types: Record<string, string> = {
    maintenance: 'Maintenance',
    payment: 'Payment',
    tenant: 'Tenant',
    property: 'Property',
    system: 'System',
    invoice: 'Invoice',
    contract: 'Contract',
  };
  return types[type] || 'Notification';
};

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'urgent':
      return theme.colors.error;
    case 'high':
      return theme.colors.warning;
    case 'medium':
      return theme.colors.primary;
    case 'low':
      return theme.colors.onSurfaceVariant;
    default:
      return theme.colors.onSurfaceVariant;
  }
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
  showActions = true,
}) => {
  const { id, type, title, message, timestamp, isRead, priority } = notification;
  const { navigateFromNotification, isNavigating, isNavigationSupported } = useNotificationNavigation();

  const handlePress = async () => {
    // First trigger custom onPress if provided
    if (onPress) {
      onPress(notification);
    }
    
    // Mark as read if not already read
    if (!isRead && onMarkAsRead) {
      onMarkAsRead(id);
    }
    
    // Attempt navigation if supported
    if (isNavigationSupported(notification as any)) {
      try {
        await navigateFromNotification(notification as any);
      } catch (error) {
        console.warn('Navigation failed:', error);
      }
    }
  };

  const handleMarkAsRead = (e: any) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isRead ? theme.colors.surface : theme.colors.surfaceVariant,
          borderColor: isRead ? theme.colors.outline : theme.colors.primary,
          borderWidth: isRead ? 1 : 2,
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Left side: Icon and content */}
        <View style={styles.leftContent}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: `${getPriorityColor(priority)}15` }
          ]}>
            {getNotificationIcon(type, priority)}
          </View>
          
          <View style={styles.textContent}>
            <View style={styles.header}>
              <Text 
                style={[
                  styles.title,
                  { 
                    color: isRead ? theme.colors.onSurfaceVariant : theme.colors.onSurface,
                    fontWeight: isRead ? '500' : '600'
                  }
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              <View style={styles.metadata}>
                <Text style={[styles.type, { color: getPriorityColor(priority) }]}>
                  {getTypeDisplayName(type)}
                </Text>
                {priority && priority !== 'medium' && (
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(priority) }
                  ]}>
                    <Text style={styles.priorityText}>
                      {priority.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <Text 
              style={[
                styles.message,
                { color: isRead ? theme.colors.onSurfaceVariant : theme.colors.onSurface }
              ]}
              numberOfLines={2}
            >
              {message}
            </Text>
            
            <View style={styles.timestampRow}>
              <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
                {formatTimestamp(timestamp)}
              </Text>
              {isNavigationSupported(notification as any) && (
                <View style={styles.navigationIndicator}>
                  <ExternalLink size={12} color={theme.colors.primary} />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Right side: Actions */}
        {showActions && (
          <View style={styles.actions}>
            {!isRead && (
              <IconButton
                icon={() => <CheckCircle size={18} color={theme.colors.primary} />}
                onPress={handleMarkAsRead}
                size={18}
                style={styles.actionButton}
              />
            )}
            <IconButton
              icon={() => <X size={18} color={theme.colors.error} />}
              onPress={handleDelete}
              size={18}
              style={styles.actionButton}
            />
          </View>
        )}

        {/* Unread indicator */}
        {!isRead && (
          <View style={[styles.unreadIndicator, { backgroundColor: theme.colors.primary }]} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    padding: spacing.md,
    position: 'relative',
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 16,
    flex: 1,
    marginRight: spacing.sm,
  },
  metadata: {
    alignItems: 'flex-end',
  },
  type: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  timestamp: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  actionButton: {
    margin: 0,
  },
  unreadIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationIndicator: {
    marginLeft: spacing.xs,
  },
});

export default NotificationCard; 