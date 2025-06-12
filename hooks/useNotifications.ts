import { useEffect, useState, useCallback } from 'react';
import { 
  notificationService, 
  NotificationPreferences, 
  NotificationResponse,
  PushNotificationData 
} from '../lib/notifications';
import { NotificationEvent } from '../lib/realtime';

/**
 * Hook options for notification configuration
 */
export interface UseNotificationsOptions {
  // Auto-initialize notification service (default: true)
  autoInitialize?: boolean;
  // Enable debug logging (default: false)
  debug?: boolean;
  // Handle real-time events automatically (default: true)
  handleRealtimeEvents?: boolean;
}

/**
 * Hook return interface
 */
export interface UseNotificationsReturn {
  // Initialization status
  isInitialized: boolean;
  // Push token from Expo
  pushToken: string | null;
  // Current notification preferences
  preferences: NotificationPreferences;
  // Initialization error if any
  error: string | null;
  // Whether service is currently initializing
  initializing: boolean;
  // Manually initialize service
  initialize: () => Promise<NotificationResponse>;
  // Send a notification
  sendNotification: (data: PushNotificationData) => Promise<boolean>;
  // Update notification preferences
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  // Clear all notifications
  clearNotifications: () => Promise<void>;
  // Schedule a test notification
  scheduleTestNotification: (title?: string, body?: string) => Promise<string | null>;
  // Handle a real-time event
  handleRealtimeEvent: (event: NotificationEvent) => Promise<void>;
}

/**
 * Custom hook for push notifications
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    autoInitialize = true,
    debug = false,
    handleRealtimeEvents = true
  } = options;

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    maintenanceRequests: true,
    paymentVouchers: true,
    contractChanges: true,
    propertyUpdates: true,
    systemAlerts: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  /**
   * Initialize notification service
   */
  const initialize = useCallback(async (): Promise<NotificationResponse> => {
    if (debug) {
      console.log('📱 Initializing notification service...');
    }

    setInitializing(true);
    setError(null);

    try {
      const result = await notificationService.initialize();
      
      if (result.success) {
        setIsInitialized(true);
        setPushToken(result.pushToken || null);
        
        // Load current preferences
        const currentPrefs = notificationService.getPreferences();
        setPreferences(currentPrefs);
        
        if (debug) {
          console.log('📱 Notification service initialized successfully');
        }
      } else {
        setError(result.error || 'Failed to initialize notifications');
        if (debug) {
          console.error('📱 Notification initialization failed:', result.error);
        }
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      if (debug) {
        console.error('📱 Notification initialization error:', err);
      }
      return { success: false, error: errorMessage };
    } finally {
      setInitializing(false);
    }
  }, [debug]);

  /**
   * Send a notification
   */
  const sendNotification = useCallback(async (data: PushNotificationData): Promise<boolean> => {
    if (!isInitialized) {
      console.warn('📱 Notification service not initialized');
      return false;
    }

    try {
      const success = await notificationService.sendNotification(data);
      if (debug) {
        console.log(`📱 Notification send result: ${success ? 'success' : 'failed'}`);
      }
      return success;
    } catch (err) {
      if (debug) {
        console.error('📱 Error sending notification:', err);
      }
      return false;
    }
  }, [isInitialized, debug]);

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>): Promise<void> => {
    try {
      await notificationService.savePreferences(newPreferences);
      const updatedPrefs = notificationService.getPreferences();
      setPreferences(updatedPrefs);
      
      if (debug) {
        console.log('📱 Notification preferences updated:', updatedPrefs);
      }
    } catch (err) {
      if (debug) {
        console.error('📱 Error updating preferences:', err);
      }
    }
  }, [debug]);

  /**
   * Clear all notifications
   */
  const clearNotifications = useCallback(async (): Promise<void> => {
    try {
      await notificationService.clearAllNotifications();
      if (debug) {
        console.log('📱 All notifications cleared');
      }
    } catch (err) {
      if (debug) {
        console.error('📱 Error clearing notifications:', err);
      }
    }
  }, [debug]);

  /**
   * Schedule a test notification
   */
  const scheduleTestNotification = useCallback(async (
    title = '🧪 Test Notification',
    body = 'This is a test notification from Real Estate Management'
  ): Promise<string | null> => {
    try {
      const id = await notificationService.scheduleLocalNotification(title, body);
      if (debug) {
        console.log('📱 Test notification scheduled:', id);
      }
      return id;
    } catch (err) {
      if (debug) {
        console.error('📱 Error scheduling test notification:', err);
      }
      return null;
    }
  }, [debug]);

  /**
   * Handle real-time event
   */
  const handleRealtimeEvent = useCallback(async (event: NotificationEvent): Promise<void> => {
    if (!isInitialized || !handleRealtimeEvents) {
      return;
    }

    try {
      const notificationData = notificationService.createNotificationFromEvent(event);
      
      if (notificationData) {
        await sendNotification(notificationData);
        if (debug) {
          console.log('📱 Real-time event converted to notification:', notificationData);
        }
      } else {
        if (debug) {
          console.log('📱 Real-time event not suitable for notification:', event.type);
        }
      }
    } catch (err) {
      if (debug) {
        console.error('📱 Error handling real-time event:', err);
      }
    }
  }, [isInitialized, handleRealtimeEvents, sendNotification, debug]);

  // Auto-initialize effect
  useEffect(() => {
    if (autoInitialize && !isInitialized && !initializing) {
      initialize();
    }
  }, [autoInitialize, isInitialized, initializing, initialize]);

  // Check service status effect
  useEffect(() => {
    const checkStatus = () => {
      const serviceInitialized = notificationService.isServiceInitialized();
      const token = notificationService.getPushToken();
      
      if (serviceInitialized && !isInitialized) {
        setIsInitialized(true);
        setPushToken(token);
        
        // Load preferences
        const currentPrefs = notificationService.getPreferences();
        setPreferences(currentPrefs);
      }
    };

    checkStatus();
    
    // Check periodically in case service was initialized externally
    const interval = setInterval(checkStatus, 5000);
    
    return () => clearInterval(interval);
  }, [isInitialized]);

  return {
    isInitialized,
    pushToken,
    preferences,
    error,
    initializing,
    initialize,
    sendNotification,
    updatePreferences,
    clearNotifications,
    scheduleTestNotification,
    handleRealtimeEvent
  };
}

/**
 * Specialized hook for notification preferences management
 */
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = () => {
      const prefs = notificationService.getPreferences();
      setPreferences(prefs);
      setLoading(false);
    };

    if (notificationService.isServiceInitialized()) {
      loadPreferences();
    } else {
      // Wait for service to initialize
      const checkInterval = setInterval(() => {
        if (notificationService.isServiceInitialized()) {
          loadPreferences();
          clearInterval(checkInterval);
        }
      }, 1000);

      // Cleanup after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        setLoading(false);
      }, 10000);

      return () => clearInterval(checkInterval);
    }
  }, []);

  const updatePreference = useCallback(async (key: keyof NotificationPreferences, value: boolean): Promise<void> => {
    if (!preferences) return;

    const updated = { ...preferences, [key]: value };
    await notificationService.savePreferences({ [key]: value });
    setPreferences(updated);
  }, [preferences]);

  const updateMultiplePreferences = useCallback(async (updates: Partial<NotificationPreferences>): Promise<void> => {
    if (!preferences) return;

    const updated = { ...preferences, ...updates };
    await notificationService.savePreferences(updates);
    setPreferences(updated);
  }, [preferences]);

  return {
    preferences,
    loading,
    updatePreference,
    updateMultiplePreferences
  };
}

/**
 * Hook for notification status monitoring
 */
export function useNotificationStatus() {
  const [status, setStatus] = useState({
    isInitialized: false,
    hasPermissions: false,
    pushToken: null as string | null,
    error: null as string | null
  });

  useEffect(() => {
    const updateStatus = () => {
      setStatus({
        isInitialized: notificationService.isServiceInitialized(),
        hasPermissions: notificationService.isServiceInitialized(),
        pushToken: notificationService.getPushToken(),
        error: null
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 3000);

    return () => clearInterval(interval);
  }, []);

  return status;
} 