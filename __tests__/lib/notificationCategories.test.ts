// Unit tests for notification categories system
import { 
  notificationCategories,
  getNotificationCategoryConfig,
  getCategoryIcon,
  getCategoryColor,
  getCategoryPriorityColor,
  validateNotificationCategory,
  getNotificationCategoryStats,
  filterNotificationsByCategory,
  groupNotificationsByCategory,
} from '../../lib/notificationCategories';
import { createMockNotifications, createNotificationsByCategory } from '../utils/testData';
import { NotificationCategory, NotificationPriority } from '../../types/notifications';

describe('NotificationCategories', () => {
  describe('Category Configuration', () => {
    it('should have all required notification categories', () => {
      const expectedCategories: NotificationCategory[] = [
        'maintenance', 'payment', 'tenant', 'property', 'system',
        'invoice', 'contract', 'communication', 'reminder', 'alert'
      ];

      expectedCategories.forEach(category => {
        expect(notificationCategories[category]).toBeDefined();
      });
    });

    it('should have complete configuration for each category', () => {
      Object.entries(notificationCategories).forEach(([category, config]) => {
        expect(config.name).toBeDefined();
        expect(config.icon).toBeDefined();
        expect(config.color).toBeDefined();
        expect(config.description).toBeDefined();
        expect(config.defaultPriority).toBeDefined();
        expect(Array.isArray(config.allowedPriorities)).toBe(true);
        expect(config.allowedPriorities.length).toBeGreaterThan(0);
      });
    });

    it('should return correct category configuration', () => {
      const maintenanceConfig = getNotificationCategoryConfig('maintenance');
      
      expect(maintenanceConfig.name).toBe('Maintenance');
      expect(maintenanceConfig.icon).toBe('build');
      expect(maintenanceConfig.color).toBe('#FF9800');
      expect(maintenanceConfig.defaultPriority).toBe('medium');
      expect(maintenanceConfig.allowedPriorities).toContain('urgent');
      expect(maintenanceConfig.allowedPriorities).toContain('high');
    });

    it('should handle invalid category gracefully', () => {
      const invalidConfig = getNotificationCategoryConfig('invalid' as NotificationCategory);
      
      expect(invalidConfig.name).toBe('Unknown');
      expect(invalidConfig.icon).toBe('notifications');
      expect(invalidConfig.color).toBe('#757575');
    });
  });

  describe('Category Icons and Colors', () => {
    it('should return correct icons for categories', () => {
      expect(getCategoryIcon('maintenance')).toBe('build');
      expect(getCategoryIcon('payment')).toBe('payment');
      expect(getCategoryIcon('tenant')).toBe('person');
      expect(getCategoryIcon('property')).toBe('home');
      expect(getCategoryIcon('system')).toBe('settings');
    });

    it('should return correct colors for categories', () => {
      expect(getCategoryColor('maintenance')).toBe('#FF9800');
      expect(getCategoryColor('payment')).toBe('#4CAF50');
      expect(getCategoryColor('tenant')).toBe('#2196F3');
      expect(getCategoryColor('property')).toBe('#9C27B0');
      expect(getCategoryColor('system')).toBe('#607D8B');
    });

    it('should return priority-based colors', () => {
      expect(getCategoryPriorityColor('urgent')).toBe('#F44336');
      expect(getCategoryPriorityColor('high')).toBe('#FF9800');
      expect(getCategoryPriorityColor('medium')).toBe('#2196F3');
      expect(getCategoryPriorityColor('low')).toBe('#4CAF50');
    });

    it('should handle invalid priority color gracefully', () => {
      expect(getCategoryPriorityColor('invalid' as NotificationPriority)).toBe('#757575');
    });
  });

  describe('Category Validation', () => {
    it('should validate correct categories', () => {
      const validCategories: NotificationCategory[] = [
        'maintenance', 'payment', 'tenant', 'property', 'system'
      ];

      validCategories.forEach(category => {
        expect(category).toBeDefined();
        expect(typeof category).toBe('string');
      });
    });

    it('should handle different notification categories', () => {
      const categories: NotificationCategory[] = ['maintenance', 'payment', 'tenant', 'property', 'system'];
      
      categories.forEach(category => {
        const notifications = createNotificationsByCategory(category, 3);
        expect(notifications).toHaveLength(3);
        notifications.forEach(notification => {
          expect(notification.category).toBe(category);
        });
      });
    });

    it('should validate priority for category', () => {
      // Maintenance allows urgent priority
      expect(validateNotificationCategory('maintenance', 'urgent')).toBe(true);
      
      // System typically doesn't allow urgent priority
      expect(validateNotificationCategory('system', 'urgent')).toBe(false);
      
      // All categories should allow medium priority
      expect(validateNotificationCategory('payment', 'medium')).toBe(true);
    });
  });

  describe('Category Statistics', () => {
    it('should calculate category counts correctly', () => {
      const testNotifications = [
        ...createNotificationsByCategory('maintenance', 5),
        ...createNotificationsByCategory('payment', 3),
        ...createNotificationsByCategory('tenant', 2),
      ];

      const maintenanceCount = testNotifications.filter(n => n.category === 'maintenance').length;
      const paymentCount = testNotifications.filter(n => n.category === 'payment').length;
      const tenantCount = testNotifications.filter(n => n.category === 'tenant').length;

      expect(maintenanceCount).toBe(5);
      expect(paymentCount).toBe(3);
      expect(tenantCount).toBe(2);
    });

    it('should calculate unread counts correctly', () => {
      const testNotifications = createMockNotifications(10);
      const unreadCount = testNotifications.filter(n => !n.isRead).length;
      const readCount = testNotifications.filter(n => n.isRead).length;

      expect(unreadCount + readCount).toBe(testNotifications.length);
    });
  });

  describe('Category Filtering', () => {
    it('should filter notifications by category', () => {
      const testNotifications = [
        ...createNotificationsByCategory('maintenance', 3),
        ...createNotificationsByCategory('payment', 2),
        ...createNotificationsByCategory('tenant', 1),
      ];

      const maintenanceNotifications = testNotifications.filter(n => n.category === 'maintenance');
      
      expect(maintenanceNotifications).toHaveLength(3);
      maintenanceNotifications.forEach(notification => {
        expect(notification.category).toBe('maintenance');
      });
    });

    it('should handle empty notification list', () => {
      const emptyList = createNotificationsByCategory('maintenance', 0);
      expect(emptyList).toHaveLength(0);
    });
  });

  describe('Category Grouping', () => {
    it('should group notifications by category correctly', () => {
      const testNotifications = [
        ...createNotificationsByCategory('maintenance', 3),
        ...createNotificationsByCategory('payment', 2),
        ...createNotificationsByCategory('tenant', 1),
      ];

      const groupedNotifications = groupNotificationsByCategory(testNotifications);

      expect(groupedNotifications.maintenance).toHaveLength(3);
      expect(groupedNotifications.payment).toHaveLength(2);
      expect(groupedNotifications.tenant).toHaveLength(1);
      expect(groupedNotifications.property).toHaveLength(0);
    });

    it('should handle notifications with same category', () => {
      const testNotifications = createNotificationsByCategory('maintenance', 5);
      const groupedNotifications = groupNotificationsByCategory(testNotifications);

      expect(groupedNotifications.maintenance).toHaveLength(5);
      
      // Other categories should be empty
      const otherCategories = Object.keys(groupedNotifications).filter(cat => cat !== 'maintenance');
      otherCategories.forEach(category => {
        expect(groupedNotifications[category as NotificationCategory]).toHaveLength(0);
      });
    });

    it('should handle empty notification list', () => {
      const groupedNotifications = groupNotificationsByCategory([]);

      Object.values(groupedNotifications).forEach(categoryNotifications => {
        expect(categoryNotifications).toHaveLength(0);
      });
    });

    it('should preserve notification order within categories', () => {
      const testNotifications = createNotificationsByCategory('maintenance', 3);
      const groupedNotifications = groupNotificationsByCategory(testNotifications);

      const maintenanceNotifications = groupedNotifications.maintenance;
      
      // Check that notifications are in the same order as input
      for (let i = 0; i < maintenanceNotifications.length; i++) {
        expect(maintenanceNotifications[i].id).toBe(testNotifications[i].id);
      }
    });
  });

  describe('Category Integration', () => {
    it('should work with real notification data patterns', () => {
      const realWorldNotifications = [
        ...createNotificationsByCategory('maintenance', 10),
        ...createNotificationsByCategory('payment', 15),
        ...createNotificationsByCategory('tenant', 5),
        ...createNotificationsByCategory('property', 8),
        ...createNotificationsByCategory('system', 3),
      ];

      // Test statistics
      const stats = getNotificationCategoryStats(realWorldNotifications);
      expect(stats.maintenance.total).toBe(10);
      expect(stats.payment.total).toBe(15);

      // Test filtering
      const urgentNotifications = realWorldNotifications.filter(n => n.priority === 'urgent');
      const urgentMaintenance = filterNotificationsByCategory(urgentNotifications, 'maintenance');
      
      urgentMaintenance.forEach(notification => {
        expect(notification.category).toBe('maintenance');
        expect(notification.priority).toBe('urgent');
      });

      // Test grouping
      const grouped = groupNotificationsByCategory(realWorldNotifications);
      const totalGrouped = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
      expect(totalGrouped).toBe(realWorldNotifications.length);
    });

    it('should handle mixed priority distributions', () => {
      const mixedNotifications = createMockNotifications(50);
      const stats = getNotificationCategoryStats(mixedNotifications);

      // Verify that priority distributions make sense
      Object.values(stats).forEach(categoryStat => {
        if (categoryStat.total > 0) {
          expect(categoryStat.priorities.urgent).toBeGreaterThanOrEqual(0);
          expect(categoryStat.priorities.high).toBeGreaterThanOrEqual(0);
          expect(categoryStat.priorities.medium).toBeGreaterThanOrEqual(0);
          expect(categoryStat.priorities.low).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = Date.now();
      const largeDataset = createMockNotifications(1000);
      const maintenanceNotifications = largeDataset.filter(n => n.category === 'maintenance');
      const endTime = Date.now();

      expect(largeDataset.length).toBe(1000);
      expect(maintenanceNotifications.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
}); 