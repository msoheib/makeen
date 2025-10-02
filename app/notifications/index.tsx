import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Chip, IconButton, Button, Divider, ActivityIndicator, Icon } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import { notificationsApi } from '@/lib/api';
import ModernHeader from '@/components/ModernHeader';
import { useNotificationBadges } from '@/hooks/useNotificationBadges';
import { useAppStore } from '@/lib/store';

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [filter, setFilter] = useState<
    'all' |
    'unread' |
    'bid_submitted' |
    'bid_approved' |
    'bid_rejected' |
    'maintenance_request' |
    'contract_expiring'
  >('all');
  const { markAllAsRead } = useNotificationBadges();
  const { triggerHeaderBadgeRefresh } = useAppStore();

  // Fetch notifications
  const { 
    data: notifications, 
    loading: notificationsLoading, 
    error: notificationsError, 
    refetch: refetchNotifications 
  } = useApi(() => notificationsApi.getAll(
    filter === 'all' ? {} : 
    filter === 'unread' ? { is_read: false } :
    { notification_type: filter }
  ), [filter]);

  // Get unread count
  const { 
    data: unreadCount, 
    loading: countLoading, 
    refetch: refetchCount 
  } = useApi(() => notificationsApi.getUnreadCount(), []);

  const styles = getStyles(theme);

  // Automatically mark all notifications as read when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Mark all notifications as read when user views the notifications page
      const markNotificationsAsViewed = async () => {
        try {
          await markAllAsRead();
          // Trigger header badge refresh
          triggerHeaderBadgeRefresh();
        } catch (error) {
          console.error('Error marking notifications as read:', error);
        }
      };
      
      markNotificationsAsViewed();
    }, [markAllAsRead, triggerHeaderBadgeRefresh])
  );

  // Handle refresh
  const handleRefresh = () => {
    refetchNotifications();
    refetchCount();
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      handleRefresh();
      // Trigger header badge refresh
      triggerHeaderBadgeRefresh();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      handleRefresh();
      // Trigger header badge refresh
      triggerHeaderBadgeRefresh();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bid_submitted':
        return <Icon source="message-text" size={20} color={theme.colors.primary} />;
      case 'bid_approved':
        return <Icon source="check-circle" size={20} color={theme.colors.secondary} />;
      case 'bid_rejected':
        return <Icon source="alert-circle" size={20} color={theme.colors.error} />;
      case 'contract_created':
        return <Icon source="file-document" size={20} color={theme.colors.tertiary} />;
      case 'maintenance_request':
        return <Icon source="home-repair" size={20} color={theme.colors.warning} />;
      case 'contract_expiring':
        return <Icon source="calendar-alert" size={20} color={theme.colors.error} />;
      default:
        return <Icon source="bell" size={20} color={theme.colors.onSurfaceVariant} />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return theme.colors.error;
      case 'high':
        return theme.colors.warning;
      case 'medium':
        return theme.colors.primary;
      case 'normal':
        return theme.colors.primary;
      case 'low':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'الآن';
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `منذ ${diffInDays} يوم`;
  };

  // Loading state
  if (notificationsLoading && !notifications) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title="الإشعارات" 
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
            جاري تحميل الإشعارات...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (notificationsError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title="الإشعارات" 
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            خطأ في تحميل الإشعارات: {notificationsError}
          </Text>
          <Button 
            mode="contained" 
            onPress={handleRefresh}
            style={styles.retryButton}
          >
            إعادة المحاولة
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const renderNotification = ({ item }: { item: any }) => (
    <Card 
      style={[
        styles.notificationCard, 
        { 
          backgroundColor: item.is_read ? theme.colors.surface : theme.colors.primaryContainer,
          borderLeftColor: getPriorityColor(item.priority),
          borderLeftWidth: 4
        }
      ]}
    >
      <Card.Content>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationTitleRow}>
            {getNotificationIcon(item.notification_type)}
            <Text style={[
              styles.notificationTitle, 
              { 
                color: item.is_read ? theme.colors.onSurface : theme.colors.onPrimaryContainer,
                fontWeight: item.is_read ? '500' : '700'
              }
            ]}>
              {item.title}
            </Text>
          </View>
          
          <View style={styles.notificationMeta}>
            <Text style={[
              styles.timeText, 
              { color: item.is_read ? theme.colors.onSurfaceVariant : theme.colors.onPrimaryContainer }
            ]}>
              {formatTime(item.created_at)}
            </Text>
            {!item.is_read && (
              <TouchableOpacity onPress={() => handleMarkAsRead(item.id)}>
                <Icon source="check" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={[
          styles.notificationMessage, 
          { color: item.is_read ? theme.colors.onSurfaceVariant : theme.colors.onPrimaryContainer }
        ]}>
          {item.message}
        </Text>

        <View style={styles.notificationFooter}>
          <Chip 
            icon={() => 
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
            }
            style={[styles.priorityChip, { backgroundColor: theme.colors.surfaceVariant }]}
            textStyle={{ fontSize: 10 }}
          >
            {item.priority === 'urgent' ? 'عاجل' : 
             item.priority === 'high' ? 'عالي' : 
             item.priority === 'medium' || item.priority === 'normal' ? 'عادي' : 'منخفض'}
          </Chip>
          
          {item.sender && (
            <Text style={[styles.senderText, { color: theme.colors.onSurfaceVariant }]}>
              من: {item.sender.first_name} {item.sender.last_name}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="الإشعارات" 
        showBackButton={true}
        onBackPress={() => router.back()}
        rightElement={
          <TouchableOpacity 
            onPress={handleMarkAllAsRead}
            style={styles.markAllButton}
          >
            <Icon source="check-all" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={notificationsLoading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {notifications?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              إجمالي الإشعارات
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.error }]}>
              {unreadCount || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              غير مقروءة
            </Text>
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {[
                { key: 'all', label: 'الكل' },
                { key: 'unread', label: 'غير مقروءة' },
                { key: 'bid_submitted', label: 'عروض جديدة' },
                { key: 'bid_approved', label: 'تم الموافقة' },
                { key: 'bid_rejected', label: 'تم الرفض' },
                { key: 'maintenance_request', label: 'طلبات الصيانة' },
                { key: 'contract_expiring', label: 'عقود تنتهي قريبًا' }
              ].map((filterItem) => (
                <Chip
                  key={filterItem.key}
                  selected={filter === filterItem.key}
                  onPress={() => setFilter(filterItem.key as any)}
                  style={[
                    styles.filterChip,
                    { 
                      backgroundColor: filter === filterItem.key 
                        ? theme.colors.primary 
                        : theme.colors.surface 
                    }
                  ]}
                  textStyle={{
                    color: filter === filterItem.key 
                      ? theme.colors.onPrimary 
                      : theme.colors.onSurface
                  }}
                >
                  {filterItem.label}
                </Chip>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          {notifications && notifications.length > 0 ? (
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
              <Icon source="bell-outline" size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurface }]}>
                لا توجد إشعارات
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                ستظهر الإشعارات الجديدة هنا
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  markAllButton: {
    padding: 8,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  notificationsSection: {
    marginBottom: 24,
  },
  notificationCard: {
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 12,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'right',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityChip: {
    height: 24,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  senderText: {
    fontSize: 10,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 
