import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  Searchbar, 
  SegmentedButtons, 
  FAB, 
  Badge,
  IconButton,
  Menu,
  Text
} from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import { useTheme } from '@/lib/theme';
import { router } from 'expo-router';
import ModernHeader from '@/components/ModernHeader';
import NotificationList from '@/components/NotificationList';
import { NotificationData } from '@/components/NotificationCard';
import { notificationStorage } from '@/lib/notificationStorage';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Bell, 
  BellOff, 
  CheckCheck, 
  Trash2, 
  Filter,
  Settings,
  MoreVertical,
  X
} from 'lucide-react-native';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'payment', label: 'Payment' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'property', label: 'Property' },
];

export default function NotificationCenter() {
  const { theme: currentTheme } = useTheme();
  const { status } = useNotifications();
  
  // State
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  // Load notifications
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
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh notifications
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await notificationStorage.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Delete notification
  const handleDelete = useCallback(async (id: string) => {
    try {
      await notificationStorage.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  }, []);

  // Handle notification press
  const handleNotificationPress = useCallback((notification: NotificationData) => {
    if (selectionMode) {
      const newSelection = new Set(selectedNotifications);
      if (newSelection.has(notification.id)) {
        newSelection.delete(notification.id);
      } else {
        newSelection.add(notification.id);
      }
      setSelectedNotifications(newSelection);
      
      if (newSelection.size === 0) {
        setSelectionMode(false);
      }
      return;
    }

    // Mark as read if not already read
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to relevant screen based on notification type and data
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else {
      // Default navigation based on type
      switch (notification.type) {
        case 'maintenance':
          router.push('/maintenance');
          break;
        case 'payment':
        case 'invoice':
          router.push('/finance');
          break;
        case 'tenant':
          router.push('/(tabs)/tenants');
          break;
        case 'property':
          router.push('/(tabs)/properties');
          break;
        default:
          // Show notification detail or stay in center
          break;
      }
    }
  }, [selectionMode, selectedNotifications, handleMarkAsRead]);

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
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

  // Clear all notifications
  const handleClearAll = useCallback(async () => {
    Alert.alert(
      'Clear All Notifications',
      'This will permanently delete all notifications. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationStorage.clear();
              setNotifications([]);
              Alert.alert('Success', 'All notifications cleared');
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  }, []);

  // Bulk operations
  const handleBulkMarkAsRead = useCallback(async () => {
    try {
      const selectedIds = Array.from(selectedNotifications);
      await notificationStorage.markMultipleAsRead(selectedIds);
      setNotifications(prev => 
        prev.map(n => selectedNotifications.has(n.id) ? { ...n, isRead: true } : n)
      );
      setSelectedNotifications(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('Error in bulk mark as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  }, [selectedNotifications]);

  const handleBulkDelete = useCallback(async () => {
    Alert.alert(
      'Delete Notifications',
      `Delete ${selectedNotifications.size} selected notifications?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const selectedIds = Array.from(selectedNotifications);
              await notificationStorage.deleteMultiple(selectedIds);
              setNotifications(prev => 
                prev.filter(n => !selectedNotifications.has(n.id))
              );
              setSelectedNotifications(new Set());
              setSelectionMode(false);
            } catch (error) {
              console.error('Error in bulk delete:', error);
              Alert.alert('Error', 'Failed to delete notifications');
            }
          },
        },
      ]
    );
  }, [selectedNotifications]);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Clear search and filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterType('all');
    setShowSearch(false);
  }, []);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Notifications"
        showBack={true}
        rightContent={
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <Badge style={styles.badge} size={20}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
            <IconButton
              icon={() => <Bell size={24} color={currentTheme.colors.onSurface} />}
              onPress={() => setShowSearch(!showSearch)}
            />
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon={() => <MoreVertical size={24} color={currentTheme.colors.onSurface} />}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  handleMarkAllAsRead();
                }}
                title="Mark All as Read"
                leadingIcon={() => <CheckCheck size={20} color={currentTheme.colors.onSurface} />}
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  handleClearAll();
                }}
                title="Clear All"
                leadingIcon={() => <Trash2 size={20} color={currentTheme.colors.error} />}
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/notifications');
                }}
                title="Settings"
                leadingIcon={() => <Settings size={20} color={currentTheme.colors.onSurface} />}
              />
            </Menu>
          </View>
        }
      />

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search notifications..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor={currentTheme.colors.onSurfaceVariant}
          />
        </View>
      )}

      {/* Filter Buttons */}
      <View style={styles.filtersContainer}>
        <SegmentedButtons
          value={filterType}
          onValueChange={setFilterType}
          buttons={FILTER_OPTIONS}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Selection Mode Header */}
      {selectionMode && (
        <View style={[styles.selectionHeader, { backgroundColor: currentTheme.colors.primaryContainer }]}>
          <View style={styles.selectionInfo}>
            <IconButton
              icon={() => <X size={20} color={currentTheme.colors.onPrimaryContainer} />}
              onPress={() => {
                setSelectionMode(false);
                setSelectedNotifications(new Set());
              }}
            />
            <Text style={[styles.selectionText, { color: currentTheme.colors.onPrimaryContainer }]}>
              {selectedNotifications.size} selected
            </Text>
          </View>
          <View style={styles.selectionActions}>
            <IconButton
              icon={() => <CheckCheck size={20} color={currentTheme.colors.onPrimaryContainer} />}
              onPress={handleBulkMarkAsRead}
            />
            <IconButton
              icon={() => <Trash2 size={20} color={currentTheme.colors.error} />}
              onPress={handleBulkDelete}
            />
          </View>
        </View>
      )}

      {/* Notifications List */}
      <NotificationList
        notifications={notifications}
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onNotificationPress={handleNotificationPress}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
        showActions={!selectionMode}
        groupByDate={true}
        filterType={filterType}
        searchQuery={searchQuery}
      />

      {/* FAB for bulk operations */}
      {notifications.length > 0 && !selectionMode && (
        <FAB
          icon={() => <Filter size={24} color="white" />}
          style={[styles.fab, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => setSelectionMode(true)}
          label="Select"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 44,
    zIndex: 1,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: theme.colors.surfaceVariant,
  },
  filtersContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  segmentedButtons: {
    marginVertical: spacing.xs,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    elevation: 2,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
  },
}); 