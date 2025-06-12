// Test data factories for notification system testing
import { Notification, NotificationCategory, NotificationPriority } from '../../types/notifications';

export const createMockNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: `notification-${Date.now()}-${Math.random()}`,
  title: 'Test Notification',
  message: 'This is a test notification message',
  category: 'system' as NotificationCategory,
  priority: 'medium' as NotificationPriority,
  isRead: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  data: {},
  ...overrides,
});

export const createMockNotifications = (count: number = 5): Notification[] => {
  const categories: NotificationCategory[] = ['maintenance', 'payment', 'tenant', 'property', 'system'];
  const priorities: NotificationPriority[] = ['urgent', 'high', 'medium', 'low'];
  
  return Array.from({ length: count }, (_, index) => createMockNotification({
    id: `notification-${index}`,
    title: `Test Notification ${index + 1}`,
    message: `This is test notification message ${index + 1}`,
    category: categories[index % categories.length],
    priority: priorities[index % priorities.length],
    isRead: index % 3 === 0, // Every third notification is read
    createdAt: new Date(Date.now() - (index * 60000)).toISOString(), // Spread over time
  }));
};

export const createMaintenanceNotification = (overrides: Partial<Notification> = {}): Notification => 
  createMockNotification({
    category: 'maintenance',
    title: 'Maintenance Request',
    message: 'New maintenance request submitted for Property #123',
    priority: 'high',
    data: {
      propertyId: 'property-123',
      requestId: 'maintenance-456',
      type: 'plumbing',
    },
    ...overrides,
  });

export const createPaymentNotification = (overrides: Partial<Notification> = {}): Notification => 
  createMockNotification({
    category: 'payment',
    title: 'Payment Received',
    message: 'Rent payment received from John Doe',
    priority: 'medium',
    data: {
      tenantId: 'tenant-789',
      amount: 2500,
      currency: 'SAR',
      propertyId: 'property-123',
    },
    ...overrides,
  });

export const createTenantNotification = (overrides: Partial<Notification> = {}): Notification => 
  createMockNotification({
    category: 'tenant',
    title: 'New Tenant Application',
    message: 'New tenant application received for Villa in Riyadh',
    priority: 'medium',
    data: {
      tenantId: 'tenant-new-001',
      propertyId: 'property-villa-riyadh',
      applicationType: 'rental',
    },
    ...overrides,
  });

export const createPropertyNotification = (overrides: Partial<Notification> = {}): Notification => 
  createMockNotification({
    category: 'property',
    title: 'Property Status Update',
    message: 'Property status changed to Available',
    priority: 'low',
    data: {
      propertyId: 'property-456',
      oldStatus: 'maintenance',
      newStatus: 'available',
    },
    ...overrides,
  });

export const createUrgentNotification = (overrides: Partial<Notification> = {}): Notification => 
  createMockNotification({
    priority: 'urgent',
    title: 'URGENT: Emergency Maintenance',
    message: 'Emergency maintenance required - water leak reported',
    category: 'maintenance',
    data: {
      emergency: true,
      propertyId: 'property-emergency',
      contactNumber: '+966501234567',
    },
    ...overrides,
  });

export const createLargeNotificationDataset = (count: number = 1000): Notification[] => {
  const notifications: Notification[] = [];
  const categories: NotificationCategory[] = ['maintenance', 'payment', 'tenant', 'property', 'system', 'invoice', 'contract', 'communication', 'reminder', 'alert'];
  const priorities: NotificationPriority[] = ['urgent', 'high', 'medium', 'low'];
  
  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const priority = priorities[i % priorities.length];
    const isRead = Math.random() > 0.3; // 70% read rate
    const createdAt = new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(); // Random within last 30 days
    
    notifications.push(createMockNotification({
      id: `large-dataset-${i}`,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Notification ${i + 1}`,
      message: `This is a ${priority} priority ${category} notification for testing purposes. ID: ${i}`,
      category,
      priority,
      isRead,
      createdAt,
      data: {
        testId: i,
        category,
        priority,
        batchId: Math.floor(i / 100),
      },
    }));
  }
  
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const createNotificationsByCategory = (category: NotificationCategory, count: number = 10): Notification[] => {
  return Array.from({ length: count }, (_, index) => createMockNotification({
    id: `${category}-${index}`,
    category,
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} Notification ${index + 1}`,
    message: `Test ${category} notification message ${index + 1}`,
    isRead: index % 2 === 0,
  }));
};

export const createNotificationsByPriority = (priority: NotificationPriority, count: number = 10): Notification[] => {
  return Array.from({ length: count }, (_, index) => createMockNotification({
    id: `${priority}-${index}`,
    priority,
    title: `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority Notification ${index + 1}`,
    message: `Test ${priority} priority notification message ${index + 1}`,
    isRead: index % 3 === 0,
  }));
};

export const createMixedNotificationSet = (): Notification[] => [
  createMaintenanceNotification({ id: 'maintenance-1' }),
  createPaymentNotification({ id: 'payment-1' }),
  createTenantNotification({ id: 'tenant-1' }),
  createPropertyNotification({ id: 'property-1' }),
  createUrgentNotification({ id: 'urgent-1' }),
  createMockNotification({ 
    id: 'system-1', 
    category: 'system', 
    title: 'System Update', 
    message: 'System maintenance completed successfully' 
  }),
];

// Test data for filtering and search
export const searchTestNotifications: Notification[] = [
  createMockNotification({
    id: 'search-1',
    title: 'Maintenance Request for Villa',
    message: 'Plumbing issue reported in the main bathroom',
    category: 'maintenance',
  }),
  createMockNotification({
    id: 'search-2',
    title: 'Payment Confirmation',
    message: 'Monthly rent payment received from tenant John Smith',
    category: 'payment',
  }),
  createMockNotification({
    id: 'search-3',
    title: 'New Tenant Application',
    message: 'Application received for apartment in Jeddah downtown',
    category: 'tenant',
  }),
  createMockNotification({
    id: 'search-4',
    title: 'Property Inspection Scheduled',
    message: 'Annual inspection scheduled for commercial property',
    category: 'property',
  }),
];

export const filterTestNotifications: Notification[] = [
  // Urgent maintenance notifications
  createMockNotification({
    id: 'filter-1',
    category: 'maintenance',
    priority: 'urgent',
    isRead: false,
    createdAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
  }),
  // High priority payment notifications
  createMockNotification({
    id: 'filter-2',
    category: 'payment',
    priority: 'high',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  }),
  // Medium priority tenant notifications
  createMockNotification({
    id: 'filter-3',
    category: 'tenant',
    priority: 'medium',
    isRead: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  }),
  // Low priority property notifications
  createMockNotification({
    id: 'filter-4',
    category: 'property',
    priority: 'low',
    isRead: true,
    createdAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
  }),
]; 