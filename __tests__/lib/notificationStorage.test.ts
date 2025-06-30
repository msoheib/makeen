// Unit tests for notification storage system
import { notificationStorage } from '../../lib/notificationStorage';
import { createMockNotification, createMockNotifications } from '../utils/testData';
import { testUtils } from '../utils/mockServices';
import { Notification, NotificationCategory, NotificationPriority } from '../../types/notifications';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => 
  require('../utils/mockServices').mockAsyncStorage
);

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: require('../utils/mockServices').mockSupabaseClient,
}));

describe('NotificationStorage', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  describe('Basic CRUD Operations', () => {
    it('should add a new notification successfully', async () => {
      const notification = createMockNotification({
        title: 'Test Notification',
        message: 'Test message',
        category: 'maintenance',
      });

      const result = await notificationStorage.addNotification(notification);

      expect(result).toBeDefined();
      expect(result.id).toBe(notification.id);
      expect(result.title).toBe('Test Notification');
      expect(result.category).toBe('maintenance');
      expect(result.isRead).toBe(false);
    });

    it('should generate unique IDs for notifications', async () => {
      const notification1 = createMockNotification({ title: 'First' });
      const notification2 = createMockNotification({ title: 'Second' });

      const result1 = await notificationStorage.addNotification(notification1);
      const result2 = await notificationStorage.addNotification(notification2);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const notification = createMockNotification();
      const beforeTime = new Date().toISOString();
      
      const result = await notificationStorage.addNotification(notification);
      const afterTime = new Date().toISOString();

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.createdAt >= beforeTime).toBe(true);
      expect(result.createdAt <= afterTime).toBe(true);
    });

    it('should handle notification with custom data', async () => {
      const customData = {
        propertyId: 'property-123',
        tenantId: 'tenant-456',
        amount: 2500,
      };

      const notification = createMockNotification({
        category: 'payment',
        data: customData,
      });

      const result = await notificationStorage.addNotification(notification);

      expect(result.data).toEqual(customData);
    });
  });

  describe('Filtering and Search', () => {
    beforeEach(async () => {
      // Seed with test data
      const testNotifications = createMockNotifications(10);
      for (const notification of testNotifications) {
        await notificationStorage.addNotification(notification);
      }
    });

    it('should retrieve all notifications when no filters applied', async () => {
      const notifications = await notificationStorage.getNotifications();
      
      expect(notifications).toBeDefined();
      expect(notifications.length).toBe(10);
    });

    it('should filter notifications by category', async () => {
      const maintenanceNotifications = await notificationStorage.getNotifications({
        category: 'maintenance',
      });

      expect(maintenanceNotifications).toBeDefined();
      maintenanceNotifications.forEach(notification => {
        expect(notification.category).toBe('maintenance');
      });
    });

    it('should filter notifications by priority', async () => {
      const urgentNotifications = await notificationStorage.getNotifications({
        priority: 'urgent',
      });

      urgentNotifications.forEach(notification => {
        expect(notification.priority).toBe('urgent');
      });
    });

    it('should filter notifications by read status', async () => {
      const unreadNotifications = await notificationStorage.getNotifications({
        isRead: false,
      });

      unreadNotifications.forEach(notification => {
        expect(notification.isRead).toBe(false);
      });
    });

    it('should filter notifications by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const recentNotifications = await notificationStorage.getNotifications({
        startDate: yesterday.toISOString(),
        endDate: tomorrow.toISOString(),
      });

      recentNotifications.forEach(notification => {
        const notificationDate = new Date(notification.createdAt);
        expect(notificationDate >= yesterday).toBe(true);
        expect(notificationDate <= tomorrow).toBe(true);
      });
    });

    it('should apply multiple filters simultaneously', async () => {
      const filteredNotifications = await notificationStorage.getNotifications({
        category: 'maintenance',
        priority: 'high',
        isRead: false,
      });

      filteredNotifications.forEach(notification => {
        expect(notification.category).toBe('maintenance');
        expect(notification.priority).toBe('high');
        expect(notification.isRead).toBe(false);
      });
    });

    it('should return empty array when no notifications match filters', async () => {
      const notifications = await notificationStorage.getNotifications({
        category: 'nonexistent' as NotificationCategory,
      });

      expect(notifications).toEqual([]);
    });

    it('should sort notifications by creation date (newest first)', async () => {
      const notifications = await notificationStorage.getNotifications();
      
      for (let i = 1; i < notifications.length; i++) {
        const current = new Date(notifications[i].createdAt);
        const previous = new Date(notifications[i - 1].createdAt);
        expect(current <= previous).toBe(true);
      }
    });
  });

  describe('Data Validation', () => {
    it('should create notifications with required fields', () => {
      const notification = createMockNotification();

      expect(notification.id).toBeDefined();
      expect(notification.title).toBeDefined();
      expect(notification.message).toBeDefined();
      expect(notification.category).toBeDefined();
      expect(notification.priority).toBeDefined();
      expect(notification.createdAt).toBeDefined();
      expect(notification.updatedAt).toBeDefined();
      expect(typeof notification.isRead).toBe('boolean');
    });

    it('should handle different notification categories', () => {
      const categories: NotificationCategory[] = ['maintenance', 'payment', 'tenant', 'property', 'system'];
      
      categories.forEach(category => {
        const notification = createMockNotification({ category });
        expect(notification.category).toBe(category);
      });
    });

    it('should handle different priority levels', () => {
      const priorities = ['urgent', 'high', 'medium', 'low'] as const;
      
      priorities.forEach(priority => {
        const notification = createMockNotification({ priority });
        expect(notification.priority).toBe(priority);
      });
    });
  });

  describe('Performance Testing', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = Date.now();
      const largeDataset = createMockNotifications(1000);
      const endTime = Date.now();

      expect(largeDataset.length).toBe(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should filter large datasets efficiently', () => {
      const largeDataset = createMockNotifications(1000);
      
      const startTime = Date.now();
      const maintenanceNotifications = largeDataset.filter(n => n.category === 'maintenance');
      const endTime = Date.now();

      expect(maintenanceNotifications.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty notification list', () => {
      const emptyList = createMockNotifications(0);
      expect(emptyList).toEqual([]);
    });

    it('should handle notifications with minimal data', () => {
      const minimalNotification = createMockNotification({
        title: '',
        message: '',
      });

      expect(minimalNotification.id).toBeDefined();
      expect(minimalNotification.createdAt).toBeDefined();
    });

    it('should handle notifications with maximum data', () => {
      const maximalNotification = createMockNotification({
        title: 'A'.repeat(1000),
        message: 'B'.repeat(5000),
        data: {
          propertyId: 'property-123',
          tenantId: 'tenant-456',
          amount: 999999.99,
          metadata: {
            source: 'system',
            priority: 'urgent',
            tags: ['important', 'urgent', 'maintenance'],
          },
        },
      });

      expect(maximalNotification.title.length).toBe(1000);
      expect(maximalNotification.message.length).toBe(5000);
      expect(maximalNotification.data.metadata.tags).toHaveLength(3);
    });
  });

  describe('markAsRead', () => {
    let testNotification: Notification;

    beforeEach(async () => {
      testNotification = createMockNotification({ isRead: false });
      await notificationStorage.addNotification(testNotification);
    });

    it('should mark notification as read', async () => {
      const result = await notificationStorage.markAsRead(testNotification.id);

      expect(result).toBeDefined();
      expect(result?.isRead).toBe(true);
      expect(result?.updatedAt).toBeDefined();
    });

    it('should update the updatedAt timestamp', async () => {
      const originalUpdatedAt = testNotification.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      
      const result = await notificationStorage.markAsRead(testNotification.id);

      expect(result?.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should return null for non-existent notification', async () => {
      const result = await notificationStorage.markAsRead('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle already read notification', async () => {
      // Mark as read first time
      await notificationStorage.markAsRead(testNotification.id);
      
      // Mark as read second time
      const result = await notificationStorage.markAsRead(testNotification.id);

      expect(result?.isRead).toBe(true);
    });
  });

  describe('markAsUnread', () => {
    let testNotification: Notification;

    beforeEach(async () => {
      testNotification = createMockNotification({ isRead: true });
      await notificationStorage.addNotification(testNotification);
    });

    it('should mark notification as unread', async () => {
      const result = await notificationStorage.markAsUnread(testNotification.id);

      expect(result).toBeDefined();
      expect(result?.isRead).toBe(false);
      expect(result?.updatedAt).toBeDefined();
    });

    it('should return null for non-existent notification', async () => {
      const result = await notificationStorage.markAsUnread('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('deleteNotification', () => {
    let testNotification: Notification;

    beforeEach(async () => {
      testNotification = createMockNotification();
      await notificationStorage.addNotification(testNotification);
    });

    it('should delete notification successfully', async () => {
      const result = await notificationStorage.deleteNotification(testNotification.id);

      expect(result).toBe(true);

      // Verify notification is deleted
      const notifications = await notificationStorage.getNotifications();
      const deletedNotification = notifications.find(n => n.id === testNotification.id);
      expect(deletedNotification).toBeUndefined();
    });

    it('should return false for non-existent notification', async () => {
      const result = await notificationStorage.deleteNotification('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('clearAll', () => {
    beforeEach(async () => {
      const testNotifications = createMockNotifications(5);
      for (const notification of testNotifications) {
        await notificationStorage.addNotification(notification);
      }
    });

    it('should clear all notifications', async () => {
      const result = await notificationStorage.clearAll();

      expect(result).toBe(true);

      const notifications = await notificationStorage.getNotifications();
      expect(notifications).toEqual([]);
    });
  });

  describe('getUnreadCount', () => {
    beforeEach(async () => {
      // Add mix of read and unread notifications
      const notifications = [
        createMockNotification({ isRead: false }),
        createMockNotification({ isRead: false }),
        createMockNotification({ isRead: true }),
        createMockNotification({ isRead: false }),
        createMockNotification({ isRead: true }),
      ];

      for (const notification of notifications) {
        await notificationStorage.addNotification(notification);
      }
    });

    it('should return correct unread count', async () => {
      const count = await notificationStorage.getUnreadCount();

      expect(count).toBe(3); // 3 unread notifications
    });

    it('should return 0 when all notifications are read', async () => {
      // Mark all as read
      const notifications = await notificationStorage.getNotifications();
      for (const notification of notifications) {
        await notificationStorage.markAsRead(notification.id);
      }

      const count = await notificationStorage.getUnreadCount();
      expect(count).toBe(0);
    });
  });

  describe('getUnreadCountByCategory', () => {
    beforeEach(async () => {
      const notifications = [
        createMockNotification({ category: 'maintenance', isRead: false }),
        createMockNotification({ category: 'maintenance', isRead: false }),
        createMockNotification({ category: 'maintenance', isRead: true }),
        createMockNotification({ category: 'payment', isRead: false }),
        createMockNotification({ category: 'payment', isRead: true }),
      ];

      for (const notification of notifications) {
        await notificationStorage.addNotification(notification);
      }
    });

    it('should return correct unread count for specific category', async () => {
      const maintenanceCount = await notificationStorage.getUnreadCountByCategory('maintenance');
      const paymentCount = await notificationStorage.getUnreadCountByCategory('payment');

      expect(maintenanceCount).toBe(2);
      expect(paymentCount).toBe(1);
    });

    it('should return 0 for category with no unread notifications', async () => {
      const count = await notificationStorage.getUnreadCountByCategory('system');

      expect(count).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('should return subscription object with unsubscribe method', () => {
      const callback = jest.fn();
      const subscription = notificationStorage.subscribe(callback);

      expect(subscription).toBeDefined();
      expect(subscription.unsubscribe).toBeDefined();
      expect(typeof subscription.unsubscribe).toBe('function');
    });

    it('should call callback when new notification is added', async () => {
      const callback = jest.fn();
      notificationStorage.subscribe(callback);

      const notification = createMockNotification();
      await notificationStorage.addNotification(notification);

      expect(callback).toHaveBeenCalledWith(notification);
    });

    it('should call callback when notification is updated', async () => {
      const callback = jest.fn();
      const notification = createMockNotification();
      await notificationStorage.addNotification(notification);

      notificationStorage.subscribe(callback);
      await notificationStorage.markAsRead(notification.id);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock storage error
      const mockAsyncStorage = require('../utils/mockServices').mockAsyncStorage;
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      const notification = createMockNotification();
      
      await expect(notificationStorage.addNotification(notification)).rejects.toThrow('Storage error');
    });

    it('should handle invalid notification data', async () => {
      const invalidNotification = {
        // Missing required fields
        title: '',
        message: '',
      } as Notification;

      await expect(notificationStorage.addNotification(invalidNotification)).rejects.toThrow();
    });
  });
}); 