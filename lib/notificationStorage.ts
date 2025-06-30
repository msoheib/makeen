import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { NotificationEvent } from './realtime';
import { PushNotificationData } from './notifications';

// Storage key for notifications
const NOTIFICATIONS_STORAGE_KEY = 'app_notifications';
const MAX_NOTIFICATIONS = 100; // Keep only the latest 100 notifications
const RETENTION_DAYS = 30; // Keep notifications for 30 days

// Safe storage wrapper for web compatibility
const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        console.warn('Window not available, using memory storage fallback');
        return null;
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('AsyncStorage getItem failed, using fallback:', error);
      return null;
    }
  },
  
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        console.warn('Window not available, skipping storage save');
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn('AsyncStorage setItem failed:', error);
    }
  }
};

// Enhanced notification interface for storage
export interface StoredNotification {
  id: string;
  type: NotificationEvent['type'];
  title: string;
  body: string;
  data: any;
  timestamp: string;
  isRead: boolean;
  propertyId?: string;
  tenantId?: string;
  userId?: string;
  action?: string;
  source: 'realtime' | 'push' | 'local';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  expiresAt?: string;
}

// Filter options for notifications
export interface NotificationFilter {
  type?: NotificationEvent['type'];
  isRead?: boolean;
  propertyId?: string;
  tenantId?: string;
  startDate?: Date;
  endDate?: Date;
  priority?: StoredNotification['priority'];
  search?: string;
}

// Sort options
export type NotificationSortBy = 'timestamp' | 'priority' | 'type' | 'isRead';
export type SortOrder = 'asc' | 'desc';

class NotificationStorage {
  private cache: StoredNotification[] = [];
  private cacheLoaded = false;

  /**
   * Load notifications from storage
   */
  async loadNotifications(): Promise<StoredNotification[]> {
    try {
      if (this.cacheLoaded) {
        return this.cache;
      }

      const stored = await safeStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      let notifications: StoredNotification[] = [];

      if (stored) {
        notifications = JSON.parse(stored);
        // Clean up expired notifications
        notifications = this.cleanExpiredNotifications(notifications);
      }

      this.cache = notifications;
      this.cacheLoaded = true;
      return notifications;
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  /**
   * Save notifications to storage
   */
  private async saveNotifications(notifications: StoredNotification[]): Promise<void> {
    try {
      // Limit the number of stored notifications
      const limitedNotifications = notifications
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, MAX_NOTIFICATIONS);

      await safeStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(limitedNotifications));
      this.cache = limitedNotifications;
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  /**
   * Add a new notification
   */
  async addNotification(notification: Omit<StoredNotification, 'id' | 'timestamp' | 'isRead'>): Promise<StoredNotification> {
    await this.loadNotifications();

    const newNotification: StoredNotification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      expiresAt: notification.expiresAt || this.getExpirationDate(),
    };

    const updatedNotifications = [newNotification, ...this.cache];
    await this.saveNotifications(updatedNotifications);

    return newNotification;
  }

  /**
   * Add notification from real-time event
   */
  async addFromRealtimeEvent(event: NotificationEvent): Promise<StoredNotification | null> {
    try {
      const priority = this.determinePriority(event);
      const { title, body } = this.generateNotificationContent(event);

      const notification = await this.addNotification({
        type: event.type,
        title,
        body,
        data: event.data,
        propertyId: event.propertyId,
        tenantId: event.tenantId,
        userId: event.userId,
        action: 'view',
        source: 'realtime',
        priority,
        category: this.getCategoryFromType(event.type),
      });

      console.log('📱 Notification stored from real-time event:', notification.id);
      return notification;
    } catch (error) {
      console.error('Error adding notification from real-time event:', error);
      return null;
    }
  }

  /**
   * Add notification from push notification
   */
  async addFromPushNotification(pushData: PushNotificationData): Promise<StoredNotification | null> {
    try {
      const notification = await this.addNotification({
        type: pushData.type,
        title: pushData.title,
        body: pushData.body,
        data: pushData,
        propertyId: pushData.propertyId,
        tenantId: pushData.tenantId,
        action: pushData.action,
        source: 'push',
        priority: this.determinePriorityFromType(pushData.type),
        category: this.getCategoryFromType(pushData.type),
      });

      console.log('📱 Notification stored from push notification:', notification.id);
      return notification;
    } catch (error) {
      console.error('Error adding notification from push notification:', error);
      return null;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    await this.loadNotifications();

    const notificationIndex = this.cache.findIndex(n => n.id === notificationId);
    if (notificationIndex === -1) {
      return false;
    }

    this.cache[notificationIndex].isRead = true;
    await this.saveNotifications(this.cache);
    return true;
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(notificationId: string): Promise<boolean> {
    await this.loadNotifications();

    const notificationIndex = this.cache.findIndex(n => n.id === notificationId);
    if (notificationIndex === -1) {
      return false;
    }

    this.cache[notificationIndex].isRead = false;
    await this.saveNotifications(this.cache);
    return true;
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<number> {
    await this.loadNotifications();

    let updatedCount = 0;
    for (const id of notificationIds) {
      const notificationIndex = this.cache.findIndex(n => n.id === id);
      if (notificationIndex !== -1 && !this.cache[notificationIndex].isRead) {
        this.cache[notificationIndex].isRead = true;
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await this.saveNotifications(this.cache);
    }

    return updatedCount;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    await this.loadNotifications();

    const initialLength = this.cache.length;
    this.cache = this.cache.filter(n => n.id !== notificationId);

    if (this.cache.length < initialLength) {
      await this.saveNotifications(this.cache);
      return true;
    }

    return false;
  }

  /**
   * Delete multiple notifications
   */
  async deleteMultiple(notificationIds: string[]): Promise<number> {
    await this.loadNotifications();

    const initialLength = this.cache.length;
    this.cache = this.cache.filter(n => !notificationIds.includes(n.id));

    const deletedCount = initialLength - this.cache.length;
    if (deletedCount > 0) {
      await this.saveNotifications(this.cache);
    }

    return deletedCount;
  }

  /**
   * Get notifications with filtering and sorting
   */
  async getNotifications(
    filter?: NotificationFilter,
    sortBy: NotificationSortBy = 'timestamp',
    order: SortOrder = 'desc'
  ): Promise<StoredNotification[]> {
    await this.loadNotifications();

    let filtered = [...this.cache];

    // Apply filters
    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(n => n.type === filter.type);
      }
      if (filter.isRead !== undefined) {
        filtered = filtered.filter(n => n.isRead === filter.isRead);
      }
      if (filter.propertyId) {
        filtered = filtered.filter(n => n.propertyId === filter.propertyId);
      }
      if (filter.tenantId) {
        filtered = filtered.filter(n => n.tenantId === filter.tenantId);
      }
      if (filter.priority) {
        filtered = filtered.filter(n => n.priority === filter.priority);
      }
      if (filter.startDate) {
        filtered = filtered.filter(n => new Date(n.timestamp) >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(n => new Date(n.timestamp) <= filter.endDate!);
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filtered = filtered.filter(n => 
          n.title.toLowerCase().includes(searchLower) ||
          n.body.toLowerCase().includes(searchLower)
        );
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'isRead':
          comparison = (a.isRead ? 1 : 0) - (b.isRead ? 1 : 0);
          break;
        default:
          comparison = 0;
      }

      return order === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    await this.loadNotifications();
    return this.cache.filter(n => !n.isRead).length;
  }

  /**
   * Get unread count by type
   */
  async getUnreadCountByType(): Promise<Record<NotificationEvent['type'], number>> {
    await this.loadNotifications();
    
    const counts: Record<NotificationEvent['type'], number> = {
      maintenance_request: 0,
      voucher: 0,
      property_reservation: 0,
      contract: 0,
      issue: 0,
    };

    this.cache
      .filter(n => !n.isRead)
      .forEach(n => {
        counts[n.type] = (counts[n.type] || 0) + 1;
      });

    return counts;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    await this.loadNotifications();

    let updatedCount = 0;
    this.cache.forEach(notification => {
      if (!notification.isRead) {
        notification.isRead = true;
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await this.saveNotifications(this.cache);
    }

    return updatedCount;
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<number> {
    await this.loadNotifications();
    const count = this.cache.length;
    this.cache = [];
    await this.saveNotifications(this.cache);
    return count;
  }

  /**
   * Clean expired notifications
   */
  private cleanExpiredNotifications(notifications: StoredNotification[]): StoredNotification[] {
    const now = new Date();
    return notifications.filter(notification => {
      if (!notification.expiresAt) return true;
      return new Date(notification.expiresAt) > now;
    });
  }

  /**
   * Get expiration date (30 days from now)
   */
  private getExpirationDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + RETENTION_DAYS);
    return date.toISOString();
  }

  /**
   * Determine notification priority from event
   */
  private determinePriority(event: NotificationEvent): StoredNotification['priority'] {
    switch (event.type) {
      case 'maintenance_request':
        return event.data.priority === 'urgent' ? 'urgent' : 
               event.data.priority === 'high' ? 'high' : 'medium';
      case 'issue':
        return event.data.priority === 'urgent' ? 'urgent' :
               event.data.priority === 'high' ? 'high' : 'medium';
      case 'voucher':
        return event.data.amount && event.data.amount > 10000 ? 'high' : 'medium';
      case 'contract':
        return 'medium';
      case 'property_reservation':
        return 'medium';
      default:
        return 'medium';
    }
  }

  /**
   * Determine priority from type only
   */
  private determinePriorityFromType(type: NotificationEvent['type']): StoredNotification['priority'] {
    switch (type) {
      case 'maintenance_request':
      case 'issue':
        return 'high';
      case 'voucher':
        return 'medium';
      case 'contract':
      case 'property_reservation':
        return 'medium';
      default:
        return 'medium';
    }
  }

  /**
   * Get category from notification type
   */
  private getCategoryFromType(type: NotificationEvent['type']): string {
    switch (type) {
      case 'maintenance_request':
        return 'Maintenance';
      case 'voucher':
        return 'Finance';
      case 'property_reservation':
        return 'Property';
      case 'contract':
        return 'Contract';
      case 'issue':
        return 'Issue';
      default:
        return 'General';
    }
  }

  /**
   * Generate notification content from real-time event
   */
  private generateNotificationContent(event: NotificationEvent): { title: string; body: string } {
    switch (event.type) {
      case 'maintenance_request':
        return {
          title: '🔧 New Maintenance Request',
          body: `Priority: ${event.data.priority?.toUpperCase() || 'MEDIUM'} - ${event.data.title || 'Maintenance needed'}`
        };
      case 'voucher':
        const voucherType = event.data.voucher_type;
        const amount = event.data.amount ? `${event.data.amount} SAR` : '';
        return {
          title: voucherType === 'receipt' ? '💰 Payment Received' : '📄 New Voucher',
          body: `${event.data.description || 'Financial transaction'} ${amount}`
        };
      case 'property_reservation':
        return {
          title: '🏠 Property Reserved',
          body: `Deposit: ${event.data.deposit_amount || 0} SAR - ${event.data.notes || 'New reservation'}`
        };
      case 'contract':
        return {
          title: '📋 Contract Update',
          body: `${event.data.contract_type || 'Contract'} - ${event.data.status || 'Updated'}`
        };
      case 'issue':
        return {
          title: '⚠️ New Issue Reported',
          body: `Priority: ${event.data.priority?.toUpperCase() || 'MEDIUM'} - ${event.data.title || 'Issue reported'}`
        };
      default:
        return {
          title: '📢 New Notification',
          body: 'You have a new notification'
        };
    }
  }
}

// Create singleton instance
export const notificationStorage = new NotificationStorage();

// Export types
export type { NotificationFilter, NotificationSortBy, SortOrder }; 