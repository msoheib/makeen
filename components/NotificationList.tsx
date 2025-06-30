import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import NotificationCard, { NotificationData } from './NotificationCard';
import NotificationEmpty from './NotificationEmpty';

interface NotificationListProps {
  notifications: NotificationData[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onNotificationPress?: (notification: NotificationData) => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  groupByDate?: boolean;
  filterType?: string;
  searchQuery?: string;
}

interface GroupedNotification {
  title: string;
  data: NotificationData[];
}

const groupNotificationsByDate = (notifications: NotificationData[]): GroupedNotification[] => {
  const groups: Record<string, NotificationData[]> = {};
  const now = new Date();
  
  notifications.forEach(notification => {
    const notificationDate = new Date(notification.timestamp);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    let groupKey: string;
    if (diffInDays === 0) {
      groupKey = 'Today';
    } else if (diffInDays === 1) {
      groupKey = 'Yesterday';
    } else if (diffInDays < 7) {
      groupKey = `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeksAgo = Math.floor(diffInDays / 7);
      groupKey = weeksAgo === 1 ? '1 week ago' : `${weeksAgo} weeks ago`;
    } else {
      groupKey = notificationDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  });
  
  // Sort groups by most recent first
  const sortedGroups = Object.entries(groups).map(([title, data]) => ({
    title,
    data: data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  }));
  
  // Custom sort order for group titles
  const order = ['Today', 'Yesterday'];
  return sortedGroups.sort((a, b) => {
    const aIndex = order.indexOf(a.title);
    const bIndex = order.indexOf(b.title);
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    } else if (aIndex !== -1) {
      return -1;
    } else if (bIndex !== -1) {
      return 1;
    } else {
      // For other groups, sort by the first notification timestamp
      const aTime = new Date(a.data[0].timestamp).getTime();
      const bTime = new Date(b.data[0].timestamp).getTime();
      return bTime - aTime;
    }
  });
};

const filterNotifications = (
  notifications: NotificationData[],
  filterType?: string,
  searchQuery?: string
): NotificationData[] => {
  let filtered = [...notifications];
  
  // Filter by type
  if (filterType && filterType !== 'all') {
    if (filterType === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (filterType === 'read') {
      filtered = filtered.filter(n => n.isRead);
    } else {
      filtered = filtered.filter(n => n.type === filterType);
    }
  }
  
  // Filter by search query
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(n => 
      n.title.toLowerCase().includes(query) ||
      n.message.toLowerCase().includes(query) ||
      n.type.toLowerCase().includes(query)
    );
  }
  
  return filtered;
};

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading = false,
  refreshing = false,
  onRefresh,
  onNotificationPress,
  onMarkAsRead,
  onDelete,
  showActions = true,
  groupByDate = true,
  filterType,
  searchQuery,
}) => {
  const filteredNotifications = useMemo(() => {
    return filterNotifications(notifications, filterType, searchQuery);
  }, [notifications, filterType, searchQuery]);
  
  const groupedNotifications = useMemo(() => {
    if (!groupByDate) {
      return null;
    }
    return groupNotificationsByDate(filteredNotifications);
  }, [filteredNotifications, groupByDate]);
  
  const sortedNotifications = useMemo(() => {
    if (groupByDate) {
      return null;
    }
    return [...filteredNotifications].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [filteredNotifications, groupByDate]);
  
  const renderNotificationCard = ({ item }: { item: NotificationData }) => (
    <NotificationCard
      notification={item}
      onPress={onNotificationPress}
      onMarkAsRead={onMarkAsRead}
      onDelete={onDelete}
      showActions={showActions}
    />
  );
  
  const renderGroupHeader = ({ item }: { item: GroupedNotification }) => (
    <View style={styles.groupHeader}>
      <Text style={[styles.groupTitle, { color: theme.colors.onSurfaceVariant }]}>
        {item.title}
      </Text>
    </View>
  );
  
  const renderGroupedItem = ({ item }: { item: GroupedNotification }) => (
    <View style={styles.groupContainer}>
      {renderGroupHeader({ item })}
      {item.data.map((notification, index) => (
        <View key={`${notification.id}-${index}`}>
          {renderNotificationCard({ item: notification })}
        </View>
      ))}
    </View>
  );
  
  const getItemLayout = (data: any, index: number) => ({
    length: 100, // Approximate item height
    offset: 100 * index,
    index,
  });
  
  if (filteredNotifications.length === 0 && !loading) {
    return (
      <NotificationEmpty
        hasFilter={!!filterType || !!searchQuery}
        filterType={filterType}
        searchQuery={searchQuery}
      />
    );
  }
  
  if (groupByDate && groupedNotifications) {
    return (
      <FlatList
        data={groupedNotifications}
        renderItem={renderGroupedItem}
        keyExtractor={(item, index) => `group-${index}-${item.title}`}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
      />
    );
  }
  
  return (
    <FlatList
      data={sortedNotifications}
      renderItem={renderNotificationCard}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        ) : undefined
      }
      getItemLayout={getItemLayout}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={10}
      initialNumToRender={10}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: spacing.lg,
  },
  groupContainer: {
    marginBottom: spacing.md,
  },
  groupHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: theme.colors.background,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default NotificationList; 