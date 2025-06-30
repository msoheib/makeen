import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  realTimeService, 
  EventHandler, 
  NotificationEvent, 
  RealTimeConnectionStatus 
} from '../lib/realtime';

/**
 * Hook options for filtering events
 */
export interface UseRealtimeOptions {
  // Filter by event types
  eventTypes?: NotificationEvent['type'][];
  // Filter by actions (INSERT, UPDATE, DELETE)
  actions?: NotificationEvent['action'][];
  // Filter by property ID
  propertyId?: string;
  // Filter by tenant ID
  tenantId?: string;
  // Filter by user ID
  userId?: string;
  // Auto-initialize service (default: true)
  autoInitialize?: boolean;
  // Enable debug logging (default: false)
  debug?: boolean;
}

/**
 * Hook return interface
 */
export interface UseRealtimeReturn {
  // Array of received events
  events: NotificationEvent[];
  // Latest event received
  latestEvent: NotificationEvent | null;
  // Connection status
  connectionStatus: RealTimeConnectionStatus;
  // Clear events array
  clearEvents: () => void;
  // Manually initialize service
  initialize: () => Promise<void>;
  // Force reconnection
  reconnect: () => Promise<void>;
  // Get active subscriptions
  getActiveSubscriptions: () => string[];
  // Check if subscribed to specific table
  isSubscribedTo: (tableName: string) => boolean;
}

/**
 * Custom hook for real-time notifications
 * 
 * @param options - Options for filtering and configuration
 * @returns Real-time hook interface
 */
export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const {
    eventTypes,
    actions,
    propertyId,
    tenantId,
    userId,
    autoInitialize = true,
    debug = false
  } = options;

  // State
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<NotificationEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<RealTimeConnectionStatus>(
    realTimeService.getConnectionStatus()
  );

  // Refs to maintain stable references
  const eventHandlerRef = useRef<EventHandler>();
  const statusCallbackRef = useRef<(status: RealTimeConnectionStatus) => void>();

  /**
   * Filter events based on options
   */
  const filterEvent = useCallback((event: NotificationEvent): boolean => {
    // Filter by event types
    if (eventTypes && !eventTypes.includes(event.type)) {
      return false;
    }

    // Filter by actions
    if (actions && !actions.includes(event.action)) {
      return false;
    }

    // Filter by property ID
    if (propertyId && event.propertyId !== propertyId) {
      return false;
    }

    // Filter by tenant ID
    if (tenantId && event.tenantId !== tenantId) {
      return false;
    }

    // Filter by user ID
    if (userId && event.userId !== userId) {
      return false;
    }

    return true;
  }, [eventTypes, actions, propertyId, tenantId, userId]);

  /**
   * Handle incoming real-time events
   */
  const handleEvent = useCallback((event: NotificationEvent) => {
    if (debug) {
      console.log('🔔 Real-time event received:', event);
    }

    // Apply filters
    if (!filterEvent(event)) {
      if (debug) {
        console.log('🚫 Event filtered out:', event);
      }
      return;
    }

    if (debug) {
      console.log('✅ Event passed filters:', event);
    }

    // Update state
    setLatestEvent(event);
    setEvents(prevEvents => {
      // Add new event and limit to last 100 events to prevent memory issues
      const newEvents = [event, ...prevEvents].slice(0, 100);
      return newEvents;
    });
  }, [filterEvent, debug]);

  /**
   * Handle connection status changes
   */
  const handleStatusChange = useCallback((status: RealTimeConnectionStatus) => {
    if (debug) {
      console.log('📡 Connection status changed:', status);
    }
    setConnectionStatus(status);
  }, [debug]);

  /**
   * Initialize real-time service
   */
  const initialize = useCallback(async () => {
    if (debug) {
      console.log('🚀 Initializing real-time service...');
    }
    await realTimeService.initialize();
  }, [debug]);

  /**
   * Force reconnection
   */
  const reconnect = useCallback(async () => {
    if (debug) {
      console.log('🔄 Forcing reconnection...');
    }
    await realTimeService.reconnect();
  }, [debug]);

  /**
   * Clear events array
   */
  const clearEvents = useCallback(() => {
    if (debug) {
      console.log('🧹 Clearing events...');
    }
    setEvents([]);
    setLatestEvent(null);
  }, [debug]);

  /**
   * Get active subscriptions
   */
  const getActiveSubscriptions = useCallback(() => {
    return realTimeService.getActiveSubscriptions();
  }, []);

  /**
   * Check if subscribed to specific table
   */
  const isSubscribedTo = useCallback((tableName: string) => {
    return realTimeService.isSubscribedTo(tableName);
  }, []);

  // Initialize and cleanup effects
  useEffect(() => {
    // Create stable handler references
    eventHandlerRef.current = handleEvent;
    statusCallbackRef.current = handleStatusChange;

    // Register handlers
    realTimeService.addEventHandler(eventHandlerRef.current);
    realTimeService.addStatusCallback(statusCallbackRef.current);

    // Auto-initialize if enabled
    if (autoInitialize) {
      initialize();
    }

    // Get initial connection status
    setConnectionStatus(realTimeService.getConnectionStatus());

    // Cleanup function
    return () => {
      if (eventHandlerRef.current) {
        realTimeService.removeEventHandler(eventHandlerRef.current);
      }
      if (statusCallbackRef.current) {
        realTimeService.removeStatusCallback(statusCallbackRef.current);
      }
    };
  }, [autoInitialize, initialize]);

  // Update handlers when dependencies change
  useEffect(() => {
    if (eventHandlerRef.current) {
      realTimeService.removeEventHandler(eventHandlerRef.current);
    }
    if (statusCallbackRef.current) {
      realTimeService.removeStatusCallback(statusCallbackRef.current);
    }

    eventHandlerRef.current = handleEvent;
    statusCallbackRef.current = handleStatusChange;

    realTimeService.addEventHandler(eventHandlerRef.current);
    realTimeService.addStatusCallback(statusCallbackRef.current);
  }, [handleEvent, handleStatusChange]);

  return {
    events,
    latestEvent,
    connectionStatus,
    clearEvents,
    initialize,
    reconnect,
    getActiveSubscriptions,
    isSubscribedTo
  };
}

/**
 * Specialized hook for maintenance request notifications
 */
export function useMaintenanceNotifications(propertyId?: string) {
  return useRealtime({
    eventTypes: ['maintenance_request'],
    propertyId,
    debug: process.env.NODE_ENV === 'development'
  });
}

/**
 * Specialized hook for financial voucher notifications
 */
export function useVoucherNotifications(propertyId?: string, tenantId?: string) {
  return useRealtime({
    eventTypes: ['voucher'],
    propertyId,
    tenantId,
    debug: process.env.NODE_ENV === 'development'
  });
}

/**
 * Specialized hook for property reservation notifications
 */
export function useReservationNotifications(propertyId?: string) {
  return useRealtime({
    eventTypes: ['property_reservation'],
    propertyId,
    debug: process.env.NODE_ENV === 'development'
  });
}

/**
 * Specialized hook for contract notifications
 */
export function useContractNotifications(propertyId?: string, tenantId?: string) {
  return useRealtime({
    eventTypes: ['contract'],
    propertyId,
    tenantId,
    debug: process.env.NODE_ENV === 'development'
  });
}

/**
 * Specialized hook for issue notifications
 */
export function useIssueNotifications(propertyId?: string) {
  return useRealtime({
    eventTypes: ['issue'],
    propertyId,
    debug: process.env.NODE_ENV === 'development'
  });
}

/**
 * Hook for monitoring real-time connection status only
 */
export function useRealtimeStatus() {
  const [connectionStatus, setConnectionStatus] = useState<RealTimeConnectionStatus>(
    realTimeService.getConnectionStatus()
  );

  useEffect(() => {
    const handleStatusChange = (status: RealTimeConnectionStatus) => {
      setConnectionStatus(status);
    };

    realTimeService.addStatusCallback(handleStatusChange);

    return () => {
      realTimeService.removeStatusCallback(handleStatusChange);
    };
  }, []);

  return {
    connectionStatus,
    isConnected: connectionStatus.isConnected,
    reconnect: () => realTimeService.reconnect(),
    getActiveSubscriptions: () => realTimeService.getActiveSubscriptions()
  };
} 