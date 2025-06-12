import { useState, useEffect, useCallback } from 'react';
import { notificationBadgeService, BadgeCounts, BadgeUpdateEvent } from '@/lib/notificationBadges';

interface UseNotificationBadgesOptions {
  autoUpdate?: boolean;
  updateInterval?: number;
}

interface UseNotificationBadgesReturn {
  badgeCounts: BadgeCounts;
  totalCount: number;
  getCountByType: (type: keyof BadgeCounts) => number;
  formatCount: (count: number) => string;
  refreshCounts: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearBadgesForType: (type: keyof BadgeCounts) => Promise<void>;
  isLoading: boolean;
}

export const useNotificationBadges = (
  options: UseNotificationBadgesOptions = {}
): UseNotificationBadgesReturn => {
  const { autoUpdate = true, updateInterval = 30000 } = options;
  
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>(
    notificationBadgeService.getBadgeCounts()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Handle badge updates from the service
  const handleBadgeUpdate = useCallback((event: BadgeUpdateEvent) => {
    setBadgeCounts(event.counts);
  }, []);

  // Refresh counts manually
  const refreshCounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const counts = await notificationBadgeService.calculateBadgeCounts();
      setBadgeCounts(counts);
    } catch (error) {
      console.error('Error refreshing badge counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationBadgeService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationBadgeService.markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Clear badges for specific type
  const clearBadgesForType = useCallback(async (type: keyof BadgeCounts) => {
    try {
      await notificationBadgeService.clearBadgesForType(type);
    } catch (error) {
      console.error(`Error clearing badges for type ${type}:`, error);
    }
  }, []);

  // Get count by type
  const getCountByType = useCallback((type: keyof BadgeCounts) => {
    return badgeCounts[type] || 0;
  }, [badgeCounts]);

  // Format count for display
  const formatCount = useCallback((count: number) => {
    return notificationBadgeService.formatBadgeCount(count);
  }, []);

  // Set up listeners and automatic updates
  useEffect(() => {
    // Subscribe to badge updates
    notificationBadgeService.on('badge_update', handleBadgeUpdate);

    // Initial load
    refreshCounts();

    // Set up periodic updates if enabled
    let intervalId: NodeJS.Timeout | null = null;
    if (autoUpdate && updateInterval > 0) {
      intervalId = setInterval(refreshCounts, updateInterval);
    }

    // Cleanup function
    return () => {
      notificationBadgeService.off('badge_update', handleBadgeUpdate);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoUpdate, updateInterval, handleBadgeUpdate, refreshCounts]);

  return {
    badgeCounts,
    totalCount: badgeCounts.total,
    getCountByType,
    formatCount,
    refreshCounts,
    markAsRead,
    markAllAsRead,
    clearBadgesForType,
    isLoading,
  };
};

// Specialized hooks for common use cases
export const useTabBadgeCount = (tabType?: keyof BadgeCounts) => {
  const { badgeCounts, formatCount } = useNotificationBadges();
  
  if (!tabType) {
    return { count: badgeCounts.total, formattedCount: formatCount(badgeCounts.total) };
  }
  
  const count = badgeCounts[tabType] || 0;
  return { count, formattedCount: formatCount(count) };
};

export const useTotalBadgeCount = () => {
  const { totalCount, formatCount } = useNotificationBadges();
  return { count: totalCount, formattedCount: formatCount(totalCount) };
};

export default useNotificationBadges;
