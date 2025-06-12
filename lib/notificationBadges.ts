import { notificationStorage, StoredNotification } from './notificationStorage';

export interface BadgeCounts {
  total: number;
  maintenance: number;
  payment: number;
  tenant: number;
  property: number;
  system: number;
  invoice: number;
  contract: number;
}

export interface BadgeUpdateEvent {
  type: 'badge_update';
  counts: BadgeCounts;
}

type BadgeUpdateListener = (event: BadgeUpdateEvent) => void;

class NotificationBadgeService {
  private static instance: NotificationBadgeService;
  private badgeCounts: BadgeCounts = {
    total: 0,
    maintenance: 0,
    payment: 0,
    tenant: 0,
    property: 0,
    system: 0,
    invoice: 0,
    contract: 0,
  };
  private updateTimer: NodeJS.Timeout | null = null;
  private listeners: Set<BadgeUpdateListener> = new Set();

  private constructor() {
    this.initializeBadgeService();
  }

  public static getInstance(): NotificationBadgeService {
    if (!NotificationBadgeService.instance) {
      NotificationBadgeService.instance = new NotificationBadgeService();
    }
    return NotificationBadgeService.instance;
  }

  // Event listener methods to replace EventEmitter
  public on(event: 'badge_update', listener: BadgeUpdateListener): void {
    if (event === 'badge_update') {
      this.listeners.add(listener);
    }
  }

  public off(event: 'badge_update', listener: BadgeUpdateListener): void {
    if (event === 'badge_update') {
      this.listeners.delete(listener);
    }
  }

  private emit(event: 'badge_update', data: BadgeUpdateEvent): void {
    if (event === 'badge_update') {
      this.listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in badge update listener:', error);
        }
      });
    }
  }

  private async initializeBadgeService(): Promise<void> {
    try {
      await this.calculateBadgeCounts();
      this.startPeriodicUpdates();
    } catch (error) {
      console.error('Failed to initialize badge service:', error);
    }
  }

  private startPeriodicUpdates(): void {
    // Update badge counts every 30 seconds
    this.updateTimer = setInterval(() => {
      this.calculateBadgeCounts();
    }, 30000);
  }

  private stopPeriodicUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  public async calculateBadgeCounts(): Promise<BadgeCounts> {
    try {
      // Get all unread notifications using the existing storage service
      const unreadNotifications = await notificationStorage.getNotifications(
        { isRead: false },
        'timestamp',
        'desc'
      );

      // Calculate counts by type
      const counts: BadgeCounts = {
        total: unreadNotifications.length,
        maintenance: 0,
        payment: 0,
        tenant: 0,
        property: 0,
        system: 0,
        invoice: 0,
        contract: 0,
      };

      unreadNotifications.forEach(notification => {
        const type = this.mapNotificationTypeToCategory(notification.type);
        if (type in counts && type !== 'total') {
          (counts as any)[type]++;
        }
      });

      // Update cached counts
      this.badgeCounts = counts;

      // Emit update event
      this.emit('badge_update', { type: 'badge_update', counts });

      return counts;
    } catch (error) {
      console.error('Error calculating badge counts:', error);
      return this.badgeCounts; // Return cached counts on error
    }
  }

  private mapNotificationTypeToCategory(notificationType: string): keyof BadgeCounts {
    // Map notification types to badge categories
    const typeMapping: { [key: string]: keyof BadgeCounts } = {
      maintenance_request: 'maintenance',
      maintenance_completed: 'maintenance',
      work_order_assigned: 'maintenance',
      work_order_completed: 'maintenance',
      payment_due: 'payment',
      payment_received: 'payment',
      payment_overdue: 'payment',
      rent_reminder: 'payment',
      tenant_registration: 'tenant',
      tenant_checkout: 'tenant',
      tenant_update: 'tenant',
      property_available: 'property',
      property_rented: 'property',
      property_maintenance: 'property',
      property_update: 'property',
      invoice_generated: 'invoice',
      invoice_sent: 'invoice',
      invoice_paid: 'invoice',
      contract_expiring: 'contract',
      contract_renewed: 'contract',
      contract_signed: 'contract',
      system_update: 'system',
      backup_completed: 'system',
      error_occurred: 'system',
    };

    return typeMapping[notificationType] || 'system';
  }

  public getBadgeCounts(): BadgeCounts {
    return { ...this.badgeCounts };
  }

  public getTotalBadgeCount(): number {
    return this.badgeCounts.total;
  }

  public getBadgeCountByType(type: keyof BadgeCounts): number {
    return this.badgeCounts[type] || 0;
  }

  public formatBadgeCount(count: number): string {
    if (count <= 0) return '';
    if (count <= 99) return count.toString();
    return '99+';
  }

  public async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await notificationStorage.markAsRead(notificationId);
      // Recalculate badges after marking as read
      await this.calculateBadgeCounts();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  public async markAllAsRead(): Promise<void> {
    try {
      await notificationStorage.markAllAsRead();
      await this.calculateBadgeCounts();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  public async clearBadgesForType(type: keyof BadgeCounts): Promise<void> {
    try {
      if (type === 'total') {
        await this.markAllAsRead();
        return;
      }

      // Get all unread notifications of this type
      const allNotifications = await notificationStorage.getNotifications(
        { isRead: false },
        'timestamp',
        'desc'
      );
      
      const typeNotificationIds = allNotifications
        .filter(n => this.mapNotificationTypeToCategory(n.type) === type)
        .map(n => n.id);
      
      if (typeNotificationIds.length > 0) {
        await notificationStorage.markMultipleAsRead(typeNotificationIds);
        await this.calculateBadgeCounts();
      }
    } catch (error) {
      console.error(`Error clearing badges for type ${type}:`, error);
    }
  }

  // Real-time notification handling
  public addNotification(notification: StoredNotification): void {
    try {
      // Update badge counts when new notification is added
      const type = this.mapNotificationTypeToCategory(notification.type);
      if (!notification.isRead) {
        this.badgeCounts.total++;
        if (type in this.badgeCounts && type !== 'total') {
          (this.badgeCounts as any)[type]++;
        }
        
        // Emit update
        this.emit('badge_update', { type: 'badge_update', counts: this.badgeCounts });
      }
    } catch (error) {
      console.error('Error updating badges for new notification:', error);
    }
  }

  public removeNotification(notificationId: string): void {
    // Recalculate badges when notification is removed
    this.calculateBadgeCounts();
  }

  public destroy(): void {
    this.stopPeriodicUpdates();
    this.listeners.clear();
  }
}

// Export singleton instance
export const notificationBadgeService = NotificationBadgeService.getInstance();

// Export class for testing
export { NotificationBadgeService }; 