import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { notificationStorage } from '@/lib/notificationStorage';
import { NotificationData } from '@/components/NotificationCard';

interface UseNotificationCenterOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseNotificationCenterReturn {
  // Data
  notifications: NotificationData[];
  loading: boolean;
  refreshing: boolean;
  unreadCount: number;
  
  // Actions
  loadNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Bulk operations
  markMultipleAsRead: (ids: string[]) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<void>;
  
  // Statistics
  getNotificationStats: () => {
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  };
}

export function useNotificationCenter(
  options: UseNotificationCenterOptions = {}
): UseNotificationCenterReturn {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  // State
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load notifications from storage
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const storedNotifications = await notificationStorage.getAll({
        limit: 1000,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      });
      setNotifications(storedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      throw new Error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      Alert.alert('Error', 'Failed to refresh notifications');
    } finally {
      setRefreshing(false);
    }
  }, [loadNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationStorage.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.isRead)
        .map(n => n.id);
      
      if (unreadIds.length === 0) {
        Alert.alert('Info', 'All notifications are already read');
        return;
      }

      await notificationStorage.markMultipleAsRead(unreadIds);
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      Alert.alert('Success', `Marked ${unreadIds.length} notifications as read`);
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  }, [notifications]);

  // Delete single notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationStorage.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      Alert.alert(
        'Clear All Notifications',
        'This will permanently delete all notifications. This action cannot be undone.',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => reject(new Error('User cancelled'))
          },
          {
            text: 'Clear All',
            style: 'destructive',
            onPress: async () => {
              try {
                await notificationStorage.clear();
                setNotifications([]);
                Alert.alert('Success', 'All notifications cleared');
                resolve();
              } catch (error) {
                console.error('Error clearing notifications:', error);
                Alert.alert('Error', 'Failed to clear notifications');
                reject(error);
              }
            },
          },
        ]
      );
    });
  }, []);

  // Mark multiple notifications as read
  const markMultipleAsRead = useCallback(async (ids: string[]) => {
    try {
      await notificationStorage.markMultipleAsRead(ids);
      setNotifications(prev => 
        prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking multiple as read:', error);
      throw new Error('Failed to mark notifications as read');
    }
  }, []);

  // Delete multiple notifications
  const deleteMultiple = useCallback(async (ids: string[]) => {
    try {
      await notificationStorage.deleteMultiple(ids);
      setNotifications(prev => 
        prev.filter(n => !ids.includes(n.id))
      );
    } catch (error) {
      console.error('Error deleting multiple notifications:', error);
      throw new Error('Failed to delete notifications');
    }
  }, []);

  // Get notification statistics
  const getNotificationStats = useCallback(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byPriority = notifications.reduce((acc, n) => {
      const priority = n.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      unread,
      byType,
      byPriority,
    };
  }, [notifications]);

  // Computed values
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refreshNotifications, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshNotifications]);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    // Data
    notifications,
    loading,
    refreshing,
    unreadCount,
    
    // Actions
    loadNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    
    // Bulk operations
    markMultipleAsRead,
    deleteMultiple,
    
    // Statistics
    getNotificationStats,
  };
}

export default useNotificationCenter; 