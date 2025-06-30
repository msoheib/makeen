import { supabase } from './supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Database } from './database.types';

// Type definitions for real-time events
export type DatabaseChange<T = any> = RealtimePostgresChangesPayload<T>;

export interface NotificationEvent {
  id: string;
  type: 'maintenance_request' | 'voucher' | 'property_reservation' | 'contract' | 'issue';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: string;
  userId?: string;
  propertyId?: string;
  tenantId?: string;
}

export interface RealTimeSubscription {
  table: string;
  channel: RealtimeChannel;
  isActive: boolean;
}

export interface RealTimeConnectionStatus {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  errorMessage?: string;
}

// Event handler type
export type EventHandler = (event: NotificationEvent) => void;

class RealTimeService {
  private subscriptions: Map<string, RealTimeSubscription> = new Map();
  private eventHandlers: Set<EventHandler> = new Set();
  private connectionStatus: RealTimeConnectionStatus = {
    isConnected: false,
    connectionState: 'disconnected'
  };
  private statusCallbacks: Set<(status: RealTimeConnectionStatus) => void> = new Set();
  private reconnectTimer?: NodeJS.Timeout;
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private notificationServiceEnabled = false;

  /**
   * Initialize real-time service and set up core subscriptions
   */
  async initialize(): Promise<void> {
    try {
      this.updateConnectionStatus('connecting');
      
      // Set up authentication state listener
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
          this.setupSubscriptions();
          this.enableNotificationService();
        } else if (event === 'SIGNED_OUT') {
          this.cleanup();
        }
      });

      // Check if user is already authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await this.setupSubscriptions();
        this.enableNotificationService();
      }
      
      this.updateConnectionStatus('connected');
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Failed to initialize real-time service:', error);
      this.updateConnectionStatus('error', error instanceof Error ? error.message : 'Unknown error');
      this.scheduleReconnect();
    }
  }

  /**
   * Enable notification service integration
   */
  private async enableNotificationService(): Promise<void> {
    try {
      // Dynamically import to avoid circular dependencies
      const { notificationService } = await import('./notifications');
      
      if (notificationService.isServiceInitialized()) {
        this.notificationServiceEnabled = true;
        console.log('📱 Notification service integration enabled');
      } else {
        // Try to initialize notification service
        const result = await notificationService.initialize();
        if (result.success) {
          this.notificationServiceEnabled = true;
          console.log('📱 Notification service initialized and integrated');
        } else {
          console.warn('📱 Failed to initialize notification service:', result.error);
        }
      }
    } catch (error) {
      console.error('📱 Error enabling notification service:', error);
    }
  }

  /**
   * Set up all table subscriptions
   */
  private async setupSubscriptions(): Promise<void> {
    const tables = [
      'maintenance_requests',
      'vouchers', 
      'property_reservations',
      'contracts',
      'issues'
    ];

    for (const table of tables) {
      await this.subscribe(table);
    }
  }

  /**
   * Subscribe to a specific table for real-time changes
   */
  async subscribe(tableName: string): Promise<boolean> {
    try {
      // Remove existing subscription if present
      if (this.subscriptions.has(tableName)) {
        await this.unsubscribe(tableName);
      }

      const channel = supabase
        .channel(`public:${tableName}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName
          },
          (payload) => this.handleDatabaseChange(tableName, payload)
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Subscribed to ${tableName} changes`);
            this.subscriptions.set(tableName, {
              table: tableName,
              channel,
              isActive: true
            });
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ Failed to subscribe to ${tableName}`);
            this.scheduleReconnect();
          }
        });

      return true;
    } catch (error) {
      console.error(`Failed to subscribe to ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Unsubscribe from a specific table
   */
  async unsubscribe(tableName: string): Promise<void> {
    const subscription = this.subscriptions.get(tableName);
    if (subscription) {
      await subscription.channel.unsubscribe();
      this.subscriptions.delete(tableName);
      console.log(`🔌 Unsubscribed from ${tableName}`);
    }
  }

  /**
   * Handle database changes and convert to notification events
   */
  private async handleDatabaseChange(
    tableName: string, 
    payload: RealtimePostgresChangesPayload<any>
  ): Promise<void> {
    try {
      const notificationEvent = await this.transformToNotificationEvent(tableName, payload);
      if (notificationEvent) {
        this.notifyEventHandlers(notificationEvent);
      }
    } catch (error) {
      console.error('Error handling database change:', error);
    }
  }

  /**
   * Transform database change payload to notification event
   */
  private async transformToNotificationEvent(
    tableName: string,
    payload: RealtimePostgresChangesPayload<any>
  ): Promise<NotificationEvent | null> {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    // Skip if no relevant data
    if (!newRecord && !oldRecord) return null;

    const record = newRecord || oldRecord;
    
    // Determine notification type based on table
    let notificationType: NotificationEvent['type'];
    switch (tableName) {
      case 'maintenance_requests':
        notificationType = 'maintenance_request';
        break;
      case 'vouchers':
        notificationType = 'voucher';
        break;
      case 'property_reservations':
        notificationType = 'property_reservation';
        break;
      case 'contracts':
        notificationType = 'contract';
        break;
      case 'issues':
        notificationType = 'issue';
        break;
      default:
        return null;
    }

    // Create notification event
    const event: NotificationEvent = {
      id: `${tableName}_${record.id}_${Date.now()}`,
      type: notificationType,
      action: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      data: record,
      timestamp: new Date().toISOString(),
      propertyId: record.property_id,
      tenantId: record.tenant_id,
      userId: record.created_by || record.assigned_to
    };

    console.log(`📢 Notification event generated:`, event);
    return event;
  }

  /**
   * Add event handler for real-time notifications
   */
  addEventHandler(handler: EventHandler): void {
    this.eventHandlers.add(handler);
  }

  /**
   * Remove event handler
   */
  removeEventHandler(handler: EventHandler): void {
    this.eventHandlers.delete(handler);
  }

  /**
   * Notify all registered event handlers and trigger push notifications
   */
  private async notifyEventHandlers(event: NotificationEvent): Promise<void> {
    // Notify registered event handlers
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    });

    // Trigger push notification if service is enabled
    if (this.notificationServiceEnabled) {
      try {
        // Dynamically import to avoid circular dependencies
        const { notificationService } = await import('./notifications');
        
        if (notificationService.isServiceInitialized()) {
          const notificationData = notificationService.createNotificationFromEvent(event);
          
          if (notificationData) {
            const success = await notificationService.sendNotification(notificationData);
            if (success) {
              console.log('📱 Push notification sent for real-time event:', event.type);
            } else {
              console.warn('📱 Failed to send push notification for event:', event.type);
            }
          }
        }
      } catch (error) {
        console.error('📱 Error sending push notification:', error);
      }
    }
  }

  /**
   * Add connection status callback
   */
  addStatusCallback(callback: (status: RealTimeConnectionStatus) => void): void {
    this.statusCallbacks.add(callback);
  }

  /**
   * Remove connection status callback
   */
  removeStatusCallback(callback: (status: RealTimeConnectionStatus) => void): void {
    this.statusCallbacks.delete(callback);
  }

  /**
   * Update connection status and notify callbacks
   */
  private updateConnectionStatus(
    state: RealTimeConnectionStatus['connectionState'],
    errorMessage?: string
  ): void {
    this.connectionStatus = {
      isConnected: state === 'connected',
      connectionState: state,
      lastConnected: state === 'connected' ? new Date() : this.connectionStatus.lastConnected,
      errorMessage
    };

    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.connectionStatus);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.initialize();
    }, delay);
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): RealTimeConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Get list of active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys()).filter(
      table => this.subscriptions.get(table)?.isActive
    );
  }

  /**
   * Force reconnection
   */
  async reconnect(): Promise<void> {
    this.reconnectAttempts = 0;
    await this.cleanup();
    await this.initialize();
  }

  /**
   * Clean up all subscriptions and timers
   */
  async cleanup(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    // Unsubscribe from all channels
    for (const [tableName] of this.subscriptions) {
      await this.unsubscribe(tableName);
    }

    this.subscriptions.clear();
    this.notificationServiceEnabled = false;
    this.updateConnectionStatus('disconnected');
    console.log('🧹 Real-time service cleaned up');
  }

  /**
   * Check if specific table subscription is active
   */
  isSubscribedTo(tableName: string): boolean {
    return this.subscriptions.get(tableName)?.isActive || false;
  }

  /**
   * Check if notification service is enabled
   */
  isNotificationServiceEnabled(): boolean {
    return this.notificationServiceEnabled;
  }
}

// Create singleton instance
export const realTimeService = new RealTimeService();

// Export types for external use
export type { EventHandler, NotificationEvent, RealTimeConnectionStatus }; 