// Simple test to verify testing infrastructure
import { createMockNotification, createMockNotifications } from './utils/testData';

describe('Testing Infrastructure', () => {
  describe('Test Data Factories', () => {
    it('should create a mock notification with default values', () => {
      const notification = createMockNotification();
      
      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.title).toBeDefined();
      expect(notification.message).toBeDefined();
      expect(notification.category).toBeDefined();
      expect(notification.priority).toBeDefined();
      expect(notification.createdAt).toBeDefined();
      expect(notification.updatedAt).toBeDefined();
      expect(typeof notification.isRead).toBe('boolean');
    });

    it('should create a mock notification with custom values', () => {
      const customNotification = createMockNotification({
        title: 'Custom Title',
        message: 'Custom Message',
        category: 'maintenance',
        priority: 'urgent',
        isRead: true,
      });

      expect(customNotification.title).toBe('Custom Title');
      expect(customNotification.message).toBe('Custom Message');
      expect(customNotification.category).toBe('maintenance');
      expect(customNotification.priority).toBe('urgent');
      expect(customNotification.isRead).toBe(true);
    });

    it('should create multiple mock notifications', () => {
      const notifications = createMockNotifications(5);
      
      expect(notifications).toHaveLength(5);
      
      notifications.forEach((notification, index) => {
        expect(notification.id).toBe(`notification-${index}`);
        expect(notification.title).toBe(`Test Notification ${index + 1}`);
      });
    });

    it('should create notifications with different categories and priorities', () => {
      const notifications = createMockNotifications(10);
      
      const categories = [...new Set(notifications.map(n => n.category))];
      const priorities = [...new Set(notifications.map(n => n.priority))];
      
      expect(categories.length).toBeGreaterThan(1);
      expect(priorities.length).toBeGreaterThan(1);
    });
  });

  describe('Basic JavaScript/TypeScript functionality', () => {
    it('should handle arrays correctly', () => {
      const testArray = [1, 2, 3, 4, 5];
      
      expect(testArray.length).toBe(5);
      expect(testArray.filter(n => n > 3)).toEqual([4, 5]);
      expect(testArray.map(n => n * 2)).toEqual([2, 4, 6, 8, 10]);
    });

    it('should handle objects correctly', () => {
      const testObject = {
        name: 'Test',
        value: 42,
        active: true,
      };

      expect(testObject.name).toBe('Test');
      expect(testObject.value).toBe(42);
      expect(testObject.active).toBe(true);
    });

    it('should handle async operations', async () => {
      const asyncFunction = async () => {
        return new Promise(resolve => {
          setTimeout(() => resolve('async result'), 10);
        });
      };

      const result = await asyncFunction();
      expect(result).toBe('async result');
    });
  });

  describe('Mock functionality', () => {
    it('should create and use Jest mocks', () => {
      const mockFunction = jest.fn();
      mockFunction('test argument');
      
      expect(mockFunction).toHaveBeenCalledWith('test argument');
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    it('should mock return values', () => {
      const mockFunction = jest.fn();
      mockFunction.mockReturnValue('mocked value');
      
      const result = mockFunction();
      expect(result).toBe('mocked value');
    });

    it('should mock async functions', async () => {
      const mockAsyncFunction = jest.fn();
      mockAsyncFunction.mockResolvedValue('async mocked value');
      
      const result = await mockAsyncFunction();
      expect(result).toBe('async mocked value');
    });
  });
}); 