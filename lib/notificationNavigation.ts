import { router } from 'expo-router';
import { Alert } from 'react-native';
import { NotificationWithProfile } from '@/types/notification';

/**
 * Notification Navigation Service
 * 
 * Handles routing from notifications to relevant screens in the app.
 * Provides navigation methods for different notification types and contexts.
 */

export interface NavigationTarget {
  screen: string;
  params?: Record<string, any>;
  title?: string;
}

export interface NavigationResult {
  success: boolean;
  error?: string;
  target?: NavigationTarget;
}

export class NotificationNavigationService {
  private static instance: NotificationNavigationService;

  private constructor() {}

  public static getInstance(): NotificationNavigationService {
    if (!NotificationNavigationService.instance) {
      NotificationNavigationService.instance = new NotificationNavigationService();
    }
    return NotificationNavigationService.instance;
  }

  /**
   * Navigate to the appropriate screen based on notification data
   */
  public async navigateFromNotification(notification: NotificationWithProfile): Promise<NavigationResult> {
    try {
      const target = this.getNavigationTarget(notification);
      
      if (!target) {
        return {
          success: false,
          error: 'No navigation target available for this notification type'
        };
      }

      // Validate target data exists
      const isValid = await this.validateNavigationTarget(target);
      if (!isValid) {
        return {
          success: false,
          error: 'Target content is no longer available'
        };
      }

      // Perform navigation
      await this.performNavigation(target);

      return {
        success: true,
        target
      };
    } catch (error) {
      console.error('Navigation error:', error);
      return {
        success: false,
        error: 'Failed to navigate to target screen'
      };
    }
  }

  /**
   * Navigate from badge tap based on category
   */
  public async navigateFromBadge(category?: string): Promise<NavigationResult> {
    try {
      let target: NavigationTarget;

      switch (category) {
        case 'maintenance':
          target = { screen: '/(drawer)/(tabs)/maintenance', title: 'Maintenance' };
          break;
        case 'payment':
          target = { screen: '/(drawer)/(tabs)/finance', title: 'Finance' };
          break;
        case 'property':
          target = { screen: '/(drawer)/(tabs)/properties', title: 'Properties' };
          break;
        case 'tenant':
          target = { screen: '/(drawer)/(tabs)/tenants', title: 'Tenants' };
          break;
        case 'system':
          target = { screen: '/(drawer)/(tabs)/settings', title: 'Settings' };
          break;
        default:
          // Navigate to notification center for general notifications
          target = { screen: '/notifications/center', title: 'Notifications' };
      }

      await this.performNavigation(target);

      return {
        success: true,
        target
      };
    } catch (error) {
      console.error('Badge navigation error:', error);
      return {
        success: false,
        error: 'Failed to navigate from badge'
      };
    }
  }

  /**
   * Navigate to notification center
   */
  public async navigateToNotificationCenter(): Promise<NavigationResult> {
    try {
      const target: NavigationTarget = {
        screen: '/notifications/center',
        title: 'Notification Center'
      };

      await this.performNavigation(target);

      return {
        success: true,
        target
      };
    } catch (error) {
      console.error('Notification center navigation error:', error);
      return {
        success: false,
        error: 'Failed to navigate to notification center'
      };
    }
  }

  /**
   * Get navigation target based on notification data
   */
  private getNavigationTarget(notification: NotificationWithProfile): NavigationTarget | null {
    const { category, related_entity_type, related_entity_id, title } = notification;

    // Navigation based on related entity
    if (related_entity_type && related_entity_id) {
      switch (related_entity_type) {
        case 'property':
          return {
            screen: `/properties/${related_entity_id}`,
            params: { id: related_entity_id },
            title: 'Property Details'
          };
        case 'tenant':
          return {
            screen: `/tenants/${related_entity_id}`,
            params: { id: related_entity_id },
            title: 'Tenant Profile'
          };
        case 'maintenance':
          return {
            screen: `/maintenance/${related_entity_id}`,
            params: { id: related_entity_id },
            title: 'Maintenance Request'
          };
        case 'voucher':
          return {
            screen: `/finance/vouchers/${related_entity_id}`,
            params: { id: related_entity_id },
            title: 'Voucher Details'
          };
        case 'invoice':
          return {
            screen: `/finance/invoices/${related_entity_id}`,
            params: { id: related_entity_id },
            title: 'Invoice Details'
          };
        case 'contract':
          return {
            screen: `/contracts/${related_entity_id}`,
            params: { id: related_entity_id },
            title: 'Contract Details'
          };
        case 'document':
          return {
            screen: `/documents/${related_entity_id}`,
            params: { id: related_entity_id },
            title: 'Document'
          };
        default:
          console.warn(`Unknown related entity type: ${related_entity_type}`);
      }
    }

    // Navigation based on category
    switch (category) {
      case 'maintenance':
        return {
          screen: '/(drawer)/(tabs)/maintenance',
          title: 'Maintenance'
        };
      case 'payment':
        return {
          screen: '/(drawer)/(tabs)/finance',
          title: 'Finance'
        };
      case 'property':
        return {
          screen: '/(drawer)/(tabs)/properties',
          title: 'Properties'
        };
      case 'tenant':
        return {
          screen: '/(drawer)/(tabs)/tenants',
          title: 'Tenants'
        };
      case 'system':
        return {
          screen: '/(drawer)/(tabs)/settings',
          title: 'Settings'
        };
      case 'contract':
        return {
          screen: '/(drawer)/(tabs)/contracts',
          title: 'Contracts'
        };
      case 'invoice':
        return {
          screen: '/(drawer)/(tabs)/finance',
          title: 'Finance'
        };
      default:
        // Default to notification center for unknown categories
        return {
          screen: '/notifications/center',
          title: 'Notifications'
        };
    }
  }

  /**
   * Validate that the navigation target still exists and is accessible
   */
  private async validateNavigationTarget(target: NavigationTarget): Promise<boolean> {
    try {
      // For entity-specific navigation, we should validate the entity exists
      if (target.params?.id) {
        // This would ideally check the database to ensure the entity still exists
        // For now, we'll assume it exists (in a real implementation, you'd make API calls)
        return true;
      }
      
      // For screen-only navigation, no validation needed
      return true;
    } catch (error) {
      console.error('Navigation target validation error:', error);
      return false;
    }
  }

  /**
   * Perform the actual navigation
   */
  private async performNavigation(target: NavigationTarget): Promise<void> {
    try {
      if (target.params) {
        router.push({
          pathname: target.screen as any,
          params: target.params
        });
      } else {
        router.push(target.screen as any);
      }
    } catch (error) {
      console.error('Navigation performance error:', error);
      throw error;
    }
  }

  /**
   * Handle navigation errors with user feedback
   */
  public handleNavigationError(error: string, title: string = 'Navigation Error'): void {
    Alert.alert(
      title,
      error,
      [
        {
          text: 'Go to Notifications',
          onPress: () => this.navigateToNotificationCenter()
        },
        {
          text: 'OK',
          style: 'cancel'
        }
      ]
    );
  }

  /**
   * Check if a navigation target is supported
   */
  public isNavigationSupported(notification: NotificationWithProfile): boolean {
    const target = this.getNavigationTarget(notification);
    return target !== null;
  }

  /**
   * Get a preview of where a notification would navigate to
   */
  public getNavigationPreview(notification: NotificationWithProfile): string | null {
    const target = this.getNavigationTarget(notification);
    return target?.title || null;
  }
}

// Export singleton instance
export const notificationNavigationService = NotificationNavigationService.getInstance();

// Export convenience functions
export const navigateFromNotification = (notification: NotificationWithProfile) =>
  notificationNavigationService.navigateFromNotification(notification);

export const navigateFromBadge = (category?: string) =>
  notificationNavigationService.navigateFromBadge(category);

export const navigateToNotificationCenter = () =>
  notificationNavigationService.navigateToNotificationCenter(); 