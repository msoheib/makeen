import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationEvent } from './realtime';

// Configuration for notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Types for notification system
export interface PushNotificationData {
  type: NotificationEvent['type'];
  entityId: string;
  propertyId?: string;
  tenantId?: string;
  action?: string;
  title: string;
  body: string;
}

export interface NotificationResponse {
  success: boolean;
  pushToken?: string;
  error?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  maintenanceRequests: boolean;
  paymentVouchers: boolean;
  contractChanges: boolean;
  propertyUpdates: boolean;
  systemAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  maintenanceRequests: true,
  paymentVouchers: true,
  contractChanges: true,
  propertyUpdates: true,
  systemAlerts: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

class NotificationService {
  private pushToken: string | null = null;
  private isInitialized = false;
  private preferences: NotificationPreferences = DEFAULT_PREFERENCES;
  private notificationQueue: PushNotificationData[] = [];
  private isProcessingQueue = false;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<NotificationResponse> {
    try {
      if (this.isInitialized) {
        return { success: true, pushToken: this.pushToken || undefined };
      }

      // Load preferences from storage
      await this.loadPreferences();

      // Request permissions
      const permissionResult = await this.requestPermissions();
      if (!permissionResult.success) {
        return permissionResult;
      }

      // Register for push notifications
      const tokenResult = await this.registerForPushNotifications();
      if (!tokenResult.success) {
        return tokenResult;
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('📱 Notification service initialized successfully');
      
      return { 
        success: true, 
        pushToken: this.pushToken || undefined 
      };
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<NotificationResponse> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return { success: false, error: 'Physical device required' };
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return { 
          success: false, 
          error: 'Notification permissions not granted' 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Permission error' 
      };
    }
  }

  /**
   * Register device for push notifications
   */
  private async registerForPushNotifications(): Promise<NotificationResponse> {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.pushToken = token;
      
      // Store token for future use
      await AsyncStorage.setItem('expoPushToken', token);
      
      console.log('📱 Push token obtained:', token);
      return { success: true, pushToken: token };
    } catch (error) {
      console.error('Error getting push token:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Token registration failed' 
      };
    }
  }

  /**
   * Set up notification listeners
   */
  private setupNotificationListeners(): void {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received in foreground:', notification);
      // Could show in-app notification here
    });

    // Handle user tapping on notification
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification tapped:', response);
      this.handleNotificationTap(response);
    });
  }

  /**
   * Handle notification tap and navigation
   */
  private handleNotificationTap(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data as PushNotificationData;
    
    if (!data || !data.type) {
      console.warn('Invalid notification data:', data);
      return;
    }

    // Navigate based on notification type
    // This would integrate with your navigation system
    this.navigateFromNotification(data);
  }

  /**
   * Navigate to appropriate screen based on notification
   */
  private navigateFromNotification(data: PushNotificationData): void {
    // This would use your navigation service to deep link
    // For now, we'll just log the intended navigation
    console.log('📱 Should navigate to:', {
      type: data.type,
      entityId: data.entityId,
      action: data.action
    });

    // Example navigation logic (would need actual navigation service):
    // switch (data.type) {
    //   case 'maintenance_request':
    //     navigation.navigate('Maintenance', { requestId: data.entityId });
    //     break;
    //   case 'voucher':
    //     navigation.navigate('Finance', { voucherId: data.entityId });
    //     break;
    //   case 'property_reservation':
    //     navigation.navigate('Properties', { propertyId: data.propertyId });
    //     break;
    //   case 'contract':
    //     navigation.navigate('Contracts', { contractId: data.entityId });
    //     break;
    //   default:
    //     navigation.navigate('Dashboard');
    // }
  }

  /**
   * Send push notification
   */
  async sendNotification(data: PushNotificationData): Promise<boolean> {
    if (!this.isInitialized || !this.pushToken) {
      console.warn('Notification service not initialized');
      return false;
    }

    // Check user preferences
    if (!this.shouldSendNotification(data.type)) {
      console.log(`Notification type ${data.type} disabled in preferences`);
      return false;
    }

    try {
      // Queue notification for processing
      this.notificationQueue.push(data);
      await this.processNotificationQueue();
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Process notification queue
   */
  private async processNotificationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notificationData = this.notificationQueue.shift();
        if (notificationData) {
          await this.sendSingleNotification(notificationData);
          // Small delay to prevent spam
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Send individual notification
   */
  private async sendSingleNotification(data: PushNotificationData): Promise<void> {
    if (!this.pushToken) return;

    const message = {
      to: this.pushToken,
      sound: this.preferences.soundEnabled ? 'default' : undefined,
      title: data.title,
      body: data.body,
      data: {
        type: data.type,
        entityId: data.entityId,
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        action: data.action
      },
      badge: await this.getBadgeCount() + 1,
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result.data && result.data[0] && result.data[0].status === 'error') {
        console.error('Push notification error:', result.data[0].message);
      } else {
        console.log('📱 Push notification sent successfully');
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Check if notification type should be sent based on preferences
   */
  private shouldSendNotification(type: NotificationEvent['type']): boolean {
    if (!this.preferences.enabled) return false;

    switch (type) {
      case 'maintenance_request':
        return this.preferences.maintenanceRequests;
      case 'voucher':
        return this.preferences.paymentVouchers;
      case 'contract':
        return this.preferences.contractChanges;
      case 'property_reservation':
        return this.preferences.propertyUpdates;
      case 'issue':
        return this.preferences.systemAlerts;
      default:
        return true;
    }
  }

  /**
   * Get current badge count
   */
  private async getBadgeCount(): Promise<number> {
    try {
      const count = await Notifications.getBadgeCountAsync();
      return count || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Create notification from real-time event
   */
  createNotificationFromEvent(event: NotificationEvent): PushNotificationData | null {
    let title: string;
    let body: string;

    switch (event.type) {
      case 'maintenance_request':
        title = '🔧 New Maintenance Request';
        body = `Priority: ${event.data.priority?.toUpperCase() || 'MEDIUM'} - ${event.data.title || 'Maintenance needed'}`;
        break;

      case 'voucher':
        const voucherType = event.data.voucher_type;
        const amount = event.data.amount ? `${event.data.amount} SAR` : '';
        title = voucherType === 'receipt' ? '💰 Payment Received' : '📄 New Voucher';
        body = `${event.data.description || 'Financial transaction'} ${amount}`;
        break;

      case 'property_reservation':
        title = '🏠 Property Reserved';
        body = `Deposit: ${event.data.deposit_amount || 0} SAR - ${event.data.notes || 'New reservation'}`;
        break;

      case 'contract':
        title = '📋 Contract Update';
        body = `${event.data.contract_type || 'Contract'} - ${event.data.status || 'Updated'}`;
        break;

      case 'issue':
        title = '⚠️ New Issue Reported';
        body = `Priority: ${event.data.priority?.toUpperCase() || 'MEDIUM'} - ${event.data.title || 'Issue reported'}`;
        break;

      default:
        return null;
    }

    return {
      type: event.type,
      entityId: event.data.id,
      propertyId: event.propertyId,
      tenantId: event.tenantId,
      action: 'view',
      title,
      body
    };
  }

  /**
   * Load notification preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notificationPreferences');
      if (stored) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      this.preferences = DEFAULT_PREFERENCES;
    }
  }

  /**
   * Save notification preferences to storage
   */
  async savePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
      console.log('📱 Notification preferences saved');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }

  /**
   * Get current notification preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.setBadgeCountAsync(0);
      console.log('📱 All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Schedule a local notification (for testing purposes)
   */
  async scheduleLocalNotification(
    title: string, 
    body: string, 
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: this.preferences.soundEnabled ? 'default' : undefined,
        },
        trigger: trigger || null,
      });
      console.log('📱 Local notification scheduled:', id);
      return id;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return null;
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Export types for external use
export type { NotificationPreferences, PushNotificationData, NotificationResponse }; 