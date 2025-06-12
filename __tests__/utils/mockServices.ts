// Mock services for notification system testing
import { Notification, NotificationCategory, NotificationPriority } from '../../types/notifications';
import { createMockNotification } from './testData';

// Mock AsyncStorage
export const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
};

// Mock Supabase client
export const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
  })),
  removeChannel: jest.fn(),
};

// Mock notification storage
export const mockNotificationStorage = {
  notifications: [] as Notification[],
  
  addNotification: jest.fn((notification: Notification) => {
    mockNotificationStorage.notifications.push(notification);
    return Promise.resolve(notification);
  }),
  
  getNotifications: jest.fn((filters?: any) => {
    let result = [...mockNotificationStorage.notifications];
    
    if (filters?.category) {
      result = result.filter(n => n.category === filters.category);
    }
    if (filters?.priority) {
      result = result.filter(n => n.priority === filters.priority);
    }
    if (filters?.isRead !== undefined) {
      result = result.filter(n => n.isRead === filters.isRead);
    }
    if (filters?.startDate) {
      result = result.filter(n => new Date(n.createdAt) >= new Date(filters.startDate));
    }
    if (filters?.endDate) {
      result = result.filter(n => new Date(n.createdAt) <= new Date(filters.endDate));
    }
    
    return Promise.resolve(result);
  }),
  
  markAsRead: jest.fn((id: string) => {
    const notification = mockNotificationStorage.notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      notification.updatedAt = new Date().toISOString();
    }
    return Promise.resolve(notification);
  }),
  
  markAsUnread: jest.fn((id: string) => {
    const notification = mockNotificationStorage.notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = false;
      notification.updatedAt = new Date().toISOString();
    }
    return Promise.resolve(notification);
  }),
  
  deleteNotification: jest.fn((id: string) => {
    const index = mockNotificationStorage.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      mockNotificationStorage.notifications.splice(index, 1);
    }
    return Promise.resolve(true);
  }),
  
  clearAll: jest.fn(() => {
    mockNotificationStorage.notifications = [];
    return Promise.resolve(true);
  }),
  
  getUnreadCount: jest.fn(() => {
    const count = mockNotificationStorage.notifications.filter(n => !n.isRead).length;
    return Promise.resolve(count);
  }),
  
  getUnreadCountByCategory: jest.fn((category: NotificationCategory) => {
    const count = mockNotificationStorage.notifications.filter(
      n => !n.isRead && n.category === category
    ).length;
    return Promise.resolve(count);
  }),
  
  subscribe: jest.fn(() => ({
    unsubscribe: jest.fn(),
  })),
  
  // Helper methods for testing
  reset: () => {
    mockNotificationStorage.notifications = [];
    jest.clearAllMocks();
  },
  
  seedWithTestData: (notifications: Notification[]) => {
    mockNotificationStorage.notifications = [...notifications];
  },
};

// Mock navigation service
export const mockNavigationService = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  dispatch: jest.fn(),
  
  navigateFromNotification: jest.fn((notification: Notification) => {
    // Mock navigation logic based on notification type
    switch (notification.category) {
      case 'maintenance':
        return mockNavigationService.navigate('maintenance', { id: notification.data?.requestId });
      case 'payment':
        return mockNavigationService.navigate('finance', { type: 'payment', id: notification.data?.paymentId });
      case 'tenant':
        return mockNavigationService.navigate('tenants', { id: notification.data?.tenantId });
      case 'property':
        return mockNavigationService.navigate('properties', { id: notification.data?.propertyId });
      default:
        return mockNavigationService.navigate('notifications');
    }
  }),
  
  generateNotificationRoute: jest.fn((notification: Notification) => {
    switch (notification.category) {
      case 'maintenance':
        return `/maintenance/${notification.data?.requestId}`;
      case 'payment':
        return `/finance/payments/${notification.data?.paymentId}`;
      case 'tenant':
        return `/tenants/${notification.data?.tenantId}`;
      case 'property':
        return `/properties/${notification.data?.propertyId}`;
      default:
        return '/notifications';
    }
  }),
  
  reset: () => {
    jest.clearAllMocks();
  },
};

// Mock badge service
export const mockBadgeService = {
  badgeCounts: {
    total: 0,
    maintenance: 0,
    payment: 0,
    tenant: 0,
    property: 0,
    system: 0,
    invoice: 0,
    contract: 0,
    communication: 0,
    reminder: 0,
    alert: 0,
  },
  
  updateBadges: jest.fn(() => {
    const unreadNotifications = mockNotificationStorage.notifications.filter(n => !n.isRead);
    mockBadgeService.badgeCounts.total = unreadNotifications.length;
    
    // Update category-specific counts
    Object.keys(mockBadgeService.badgeCounts).forEach(category => {
      if (category !== 'total') {
        mockBadgeService.badgeCounts[category as NotificationCategory] = 
          unreadNotifications.filter(n => n.category === category).length;
      }
    });
    
    return Promise.resolve(mockBadgeService.badgeCounts);
  }),
  
  getBadgeCount: jest.fn((category?: NotificationCategory) => {
    if (category) {
      return Promise.resolve(mockBadgeService.badgeCounts[category] || 0);
    }
    return Promise.resolve(mockBadgeService.badgeCounts.total);
  }),
  
  clearBadges: jest.fn(() => {
    Object.keys(mockBadgeService.badgeCounts).forEach(key => {
      mockBadgeService.badgeCounts[key as keyof typeof mockBadgeService.badgeCounts] = 0;
    });
    return Promise.resolve(true);
  }),
  
  formatBadgeCount: jest.fn((count: number) => {
    if (count > 99) return '99+';
    return count.toString();
  }),
  
  reset: () => {
    Object.keys(mockBadgeService.badgeCounts).forEach(key => {
      mockBadgeService.badgeCounts[key as keyof typeof mockBadgeService.badgeCounts] = 0;
    });
    jest.clearAllMocks();
  },
};

// Mock preferences service
export const mockPreferencesService = {
  preferences: {
    enablePushNotifications: true,
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    categories: {
      maintenance: { enabled: true, push: true, email: true, sms: false },
      payment: { enabled: true, push: true, email: true, sms: true },
      tenant: { enabled: true, push: true, email: false, sms: false },
      property: { enabled: true, push: false, email: true, sms: false },
      system: { enabled: true, push: true, email: false, sms: false },
      invoice: { enabled: true, push: true, email: true, sms: false },
      contract: { enabled: true, push: true, email: true, sms: false },
      communication: { enabled: true, push: false, email: true, sms: false },
      reminder: { enabled: true, push: true, email: false, sms: false },
      alert: { enabled: true, push: true, email: true, sms: true },
    },
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '07:00',
    },
    soundEnabled: true,
    vibrationEnabled: true,
  },
  
  getPreferences: jest.fn(() => Promise.resolve(mockPreferencesService.preferences)),
  
  updatePreferences: jest.fn((updates: any) => {
    mockPreferencesService.preferences = {
      ...mockPreferencesService.preferences,
      ...updates,
    };
    return Promise.resolve(mockPreferencesService.preferences);
  }),
  
  updateCategoryPreferences: jest.fn((category: NotificationCategory, settings: any) => {
    mockPreferencesService.preferences.categories[category] = {
      ...mockPreferencesService.preferences.categories[category],
      ...settings,
    };
    return Promise.resolve(mockPreferencesService.preferences.categories[category]);
  }),
  
  isNotificationEnabled: jest.fn((category: NotificationCategory, type: 'push' | 'email' | 'sms' = 'push') => {
    const categorySettings = mockPreferencesService.preferences.categories[category];
    return Promise.resolve(categorySettings?.enabled && categorySettings[type]);
  }),
  
  isInQuietHours: jest.fn(() => {
    if (!mockPreferencesService.preferences.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { startTime, endTime } = mockPreferencesService.preferences.quietHours;
    
    return currentTime >= startTime || currentTime <= endTime;
  }),
  
  reset: () => {
    mockPreferencesService.preferences = {
      enablePushNotifications: true,
      enableEmailNotifications: true,
      enableSMSNotifications: false,
      categories: {
        maintenance: { enabled: true, push: true, email: true, sms: false },
        payment: { enabled: true, push: true, email: true, sms: true },
        tenant: { enabled: true, push: true, email: false, sms: false },
        property: { enabled: true, push: false, email: true, sms: false },
        system: { enabled: true, push: true, email: false, sms: false },
        invoice: { enabled: true, push: true, email: true, sms: false },
        contract: { enabled: true, push: true, email: true, sms: false },
        communication: { enabled: true, push: false, email: true, sms: false },
        reminder: { enabled: true, push: true, email: false, sms: false },
        alert: { enabled: true, push: true, email: true, sms: true },
      },
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '07:00',
      },
      soundEnabled: true,
      vibrationEnabled: true,
    };
    jest.clearAllMocks();
  },
};

// Mock expo-notifications
export const mockExpoNotifications = {
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test-token]' }),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
};

// Test utilities
export const testUtils = {
  // Reset all mocks
  resetAllMocks: () => {
    mockNotificationStorage.reset();
    mockNavigationService.reset();
    mockBadgeService.reset();
    mockPreferencesService.reset();
    jest.clearAllMocks();
  },
  
  // Setup test environment with data
  setupTestEnvironment: (notifications: Notification[] = []) => {
    testUtils.resetAllMocks();
    mockNotificationStorage.seedWithTestData(notifications);
    mockBadgeService.updateBadges();
  },
  
  // Wait for async operations
  waitForAsync: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Create test notification and add to storage
  createAndAddNotification: async (overrides: Partial<Notification> = {}) => {
    const notification = createMockNotification(overrides);
    await mockNotificationStorage.addNotification(notification);
    await mockBadgeService.updateBadges();
    return notification;
  },
  
  // Simulate notification reception
  simulateNotificationReceived: async (notification: Notification) => {
    await mockNotificationStorage.addNotification(notification);
    await mockBadgeService.updateBadges();
    
    // Simulate real-time update
    if (mockNotificationStorage.subscribe.mock.calls.length > 0) {
      const callback = mockNotificationStorage.subscribe.mock.calls[0][0];
      if (callback) callback(notification);
    }
    
    return notification;
  },
  
  // Simulate user interaction
  simulateNotificationTap: async (notification: Notification) => {
    await mockNotificationStorage.markAsRead(notification.id);
    await mockBadgeService.updateBadges();
    mockNavigationService.navigateFromNotification(notification);
    return notification;
  },
}; 