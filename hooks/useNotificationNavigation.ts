import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  notificationNavigationService, 
  NavigationResult,
  NavigationTarget 
} from '@/lib/notificationNavigation';
import { NotificationWithProfile } from '@/types/notification';

/**
 * Hook for handling notification navigation
 * 
 * Provides methods to navigate from notifications with loading states
 * and error handling integrated into React components.
 */

export interface UseNotificationNavigationReturn {
  // Navigation methods
  navigateFromNotification: (notification: NotificationWithProfile) => Promise<void>;
  navigateFromBadge: (category?: string) => Promise<void>;
  navigateToNotificationCenter: () => Promise<void>;
  
  // State
  isNavigating: boolean;
  lastNavigationTarget: NavigationTarget | null;
  navigationError: string | null;
  
  // Utility methods
  isNavigationSupported: (notification: NotificationWithProfile) => boolean;
  getNavigationPreview: (notification: NotificationWithProfile) => string | null;
  clearError: () => void;
}

export function useNotificationNavigation(): UseNotificationNavigationReturn {
  const [isNavigating, setIsNavigating] = useState(false);
  const [lastNavigationTarget, setLastNavigationTarget] = useState<NavigationTarget | null>(null);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  const handleNavigationResult = useCallback((result: NavigationResult) => {
    if (result.success) {
      setLastNavigationTarget(result.target || null);
      setNavigationError(null);
    } else {
      setNavigationError(result.error || 'Navigation failed');
      // Show error to user
      if (result.error) {
        notificationNavigationService.handleNavigationError(result.error);
      }
    }
  }, []);

  const navigateFromNotification = useCallback(async (notification: NotificationWithProfile) => {
    try {
      setIsNavigating(true);
      setNavigationError(null);
      
      const result = await notificationNavigationService.navigateFromNotification(notification);
      handleNavigationResult(result);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Navigation failed';
      setNavigationError(errorMessage);
      notificationNavigationService.handleNavigationError(errorMessage);
    } finally {
      setIsNavigating(false);
    }
  }, [handleNavigationResult]);

  const navigateFromBadge = useCallback(async (category?: string) => {
    try {
      setIsNavigating(true);
      setNavigationError(null);
      
      const result = await notificationNavigationService.navigateFromBadge(category);
      handleNavigationResult(result);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Badge navigation failed';
      setNavigationError(errorMessage);
      notificationNavigationService.handleNavigationError(errorMessage);
    } finally {
      setIsNavigating(false);
    }
  }, [handleNavigationResult]);

  const navigateToNotificationCenter = useCallback(async () => {
    try {
      setIsNavigating(true);
      setNavigationError(null);
      
      const result = await notificationNavigationService.navigateToNotificationCenter();
      handleNavigationResult(result);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to navigate to notification center';
      setNavigationError(errorMessage);
      notificationNavigationService.handleNavigationError(errorMessage);
    } finally {
      setIsNavigating(false);
    }
  }, [handleNavigationResult]);

  const isNavigationSupported = useCallback((notification: NotificationWithProfile) => {
    return notificationNavigationService.isNavigationSupported(notification);
  }, []);

  const getNavigationPreview = useCallback((notification: NotificationWithProfile) => {
    return notificationNavigationService.getNavigationPreview(notification);
  }, []);

  const clearError = useCallback(() => {
    setNavigationError(null);
  }, []);

  return {
    navigateFromNotification,
    navigateFromBadge,
    navigateToNotificationCenter,
    isNavigating,
    lastNavigationTarget,
    navigationError,
    isNavigationSupported,
    getNavigationPreview,
    clearError,
  };
}

/**
 * Hook for badge navigation only
 * Simplified version focused on badge-specific navigation
 */
export function useBadgeNavigation() {
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateFromBadge = useCallback(async (category?: string) => {
    try {
      setIsNavigating(true);
      const result = await notificationNavigationService.navigateFromBadge(category);
      
      if (!result.success && result.error) {
        notificationNavigationService.handleNavigationError(result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Badge navigation failed';
      notificationNavigationService.handleNavigationError(errorMessage);
    } finally {
      setIsNavigating(false);
    }
  }, []);

  return {
    navigateFromBadge,
    isNavigating,
  };
} 