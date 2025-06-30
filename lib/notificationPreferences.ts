import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  NotificationPreferences, 
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationType,
  NotificationPriority,
  DeliveryMethod 
} from '../types/notificationPreferences';

const PREFERENCES_KEY = '@notification_preferences';
const CACHE_EXPIRY_HOURS = 24; // Cache preferences for 24 hours

interface CachedPreferences {
  data: NotificationPreferences;
  timestamp: number;
  version: string;
}

class NotificationPreferencesService {
  private cache: NotificationPreferences | null = null;
  private cacheTimestamp: number = 0;
  private listeners: ((preferences: NotificationPreferences) => void)[] = [];

  /**
   * Load notification preferences from storage
   */
  async load(): Promise<NotificationPreferences> {
    try {
      // Check cache first
      if (this.cache && this.isCacheValid()) {
        return this.cache;
      }

      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      
      if (!stored) {
        // First time - save defaults
        const defaults = { ...DEFAULT_NOTIFICATION_PREFERENCES };
        await this.save(defaults);
        this.updateCache(defaults);
        return defaults;
      }

      const parsed: CachedPreferences = JSON.parse(stored);
      
      // Version check - migrate if needed
      const preferences = await this.migrateIfNeeded(parsed);
      
      this.updateCache(preferences);
      return preferences;
      
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      // Fallback to defaults
      const defaults = { ...DEFAULT_NOTIFICATION_PREFERENCES };
      this.updateCache(defaults);
      return defaults;
    }
  }

  /**
   * Save notification preferences to storage
   */
  async save(preferences: NotificationPreferences): Promise<void> {
    try {
      const now = Date.now();
      const cached: CachedPreferences = {
        data: {
          ...preferences,
          lastUpdated: new Date().toISOString(),
        },
        timestamp: now,
        version: preferences.version,
      };

      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(cached));
      this.updateCache(cached.data);
      
      // Notify listeners
      this.notifyListeners(cached.data);
      
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  /**
   * Update specific category preferences
   */
  async updateCategory(
    category: NotificationType, 
    updates: Partial<{
      enabled: boolean;
      deliveryMethods: DeliveryMethod[];
      minimumPriority: NotificationPriority;
    }>
  ): Promise<void> {
    const preferences = await this.load();
    
    preferences.categories[category] = {
      ...preferences.categories[category],
      ...updates,
    };
    
    await this.save(preferences);
  }

  /**
   * Update delivery method preferences
   */
  async updateDeliveryMethod(
    method: 'push' | 'inApp' | 'email',
    updates: any
  ): Promise<void> {
    const preferences = await this.load();
    
    preferences.deliveryMethods[method] = {
      ...preferences.deliveryMethods[method],
      ...updates,
    };
    
    await this.save(preferences);
  }

  /**
   * Update timing preferences
   */
  async updateTiming(updates: Partial<NotificationPreferences['timing']>): Promise<void> {
    const preferences = await this.load();
    
    preferences.timing = {
      ...preferences.timing,
      ...updates,
    };
    
    await this.save(preferences);
  }

  /**
   * Update priority filter preferences
   */
  async updatePriorityFilter(updates: Partial<NotificationPreferences['priorityFilter']>): Promise<void> {
    const preferences = await this.load();
    
    preferences.priorityFilter = {
      ...preferences.priorityFilter,
      ...updates,
    };
    
    await this.save(preferences);
  }

  /**
   * Update advanced preferences
   */
  async updateAdvanced(updates: Partial<NotificationPreferences['advanced']>): Promise<void> {
    const preferences = await this.load();
    
    preferences.advanced = {
      ...preferences.advanced,
      ...updates,
    };
    
    await this.save(preferences);
  }

  /**
   * Toggle global notification state
   */
  async toggleGlobal(enabled: boolean): Promise<void> {
    const preferences = await this.load();
    preferences.globalEnabled = enabled;
    await this.save(preferences);
  }

  /**
   * Reset to default preferences
   */
  async reset(): Promise<void> {
    const defaults = { ...DEFAULT_NOTIFICATION_PREFERENCES };
    await this.save(defaults);
  }

  /**
   * Check if notification should be shown based on preferences
   */
  async shouldShowNotification(
    type: NotificationType,
    priority: NotificationPriority,
    timestamp?: Date
  ): Promise<{
    shouldShow: boolean;
    allowedMethods: DeliveryMethod[];
    reasons: string[];
  }> {
    const preferences = await this.load();
    const reasons: string[] = [];
    
    // Global enabled check
    if (!preferences.globalEnabled) {
      return {
        shouldShow: false,
        allowedMethods: [],
        reasons: ['Global notifications disabled'],
      };
    }

    // Category enabled check
    const categoryPref = preferences.categories[type];
    if (!categoryPref?.enabled) {
      return {
        shouldShow: false,
        allowedMethods: [],
        reasons: [`${type} notifications disabled`],
      };
    }

    // Priority check
    if (!this.isPriorityAllowed(priority, categoryPref.minimumPriority, preferences.priorityFilter)) {
      return {
        shouldShow: false,
        allowedMethods: [],
        reasons: [`Priority ${priority} below minimum threshold`],
      };
    }

    // Timing checks
    const timingResult = this.checkTiming(preferences.timing, timestamp);
    if (!timingResult.allowed) {
      return {
        shouldShow: false,
        allowedMethods: [],
        reasons: timingResult.reasons,
      };
    }

    // Determine allowed delivery methods
    const allowedMethods = categoryPref.deliveryMethods.filter(method => {
      return preferences.deliveryMethods[method]?.enabled === true;
    });

    return {
      shouldShow: allowedMethods.length > 0,
      allowedMethods,
      reasons: allowedMethods.length === 0 ? ['No delivery methods enabled'] : [],
    };
  }

  /**
   * Subscribe to preference changes
   */
  subscribe(listener: (preferences: NotificationPreferences) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current preferences (cached if available)
   */
  getCached(): NotificationPreferences | null {
    return this.cache;
  }

  /**
   * Force refresh from storage
   */
  async refresh(): Promise<NotificationPreferences> {
    this.cache = null;
    return await this.load();
  }

  // Private methods

  private updateCache(preferences: NotificationPreferences): void {
    this.cache = preferences;
    this.cacheTimestamp = Date.now();
  }

  private isCacheValid(): boolean {
    if (!this.cache || !this.cacheTimestamp) return false;
    
    const hoursPassed = (Date.now() - this.cacheTimestamp) / (1000 * 60 * 60);
    return hoursPassed < CACHE_EXPIRY_HOURS;
  }

  private async migrateIfNeeded(cached: CachedPreferences): Promise<NotificationPreferences> {
    const { data, version } = cached;
    const currentVersion = DEFAULT_NOTIFICATION_PREFERENCES.version;
    
    if (version === currentVersion) {
      return data;
    }

    // Migration logic for future versions
    let migrated = { ...data };
    
    // Example migration (for future use):
    // if (version === '1.0.0' && currentVersion === '1.1.0') {
    //   migrated = this.migrateFrom1_0_to1_1(migrated);
    // }
    
    migrated.version = currentVersion;
    migrated.lastUpdated = new Date().toISOString();
    
    return migrated;
  }

  private isPriorityAllowed(
    priority: NotificationPriority,
    categoryMinimum: NotificationPriority,
    priorityFilter: NotificationPreferences['priorityFilter']
  ): boolean {
    const priorityLevels = { low: 1, medium: 2, high: 3, urgent: 4 };
    
    // Urgent override
    if (priority === 'urgent' && priorityFilter.urgentOverride) {
      return true;
    }
    
    // Check category minimum
    if (priorityLevels[priority] < priorityLevels[categoryMinimum]) {
      return false;
    }
    
    // Check global minimum
    if (priorityLevels[priority] < priorityLevels[priorityFilter.minimumPriority]) {
      return false;
    }
    
    return true;
  }

  private checkTiming(timing: NotificationPreferences['timing'], timestamp?: Date): {
    allowed: boolean;
    reasons: string[];
  } {
    const now = timestamp || new Date();
    const reasons: string[] = [];
    
    // Do Not Disturb check
    if (timing.doNotDisturb.enabled) {
      if (!timing.doNotDisturb.endTime || new Date(timing.doNotDisturb.endTime) > now) {
        return { allowed: false, reasons: ['Do Not Disturb mode active'] };
      }
    }
    
    // Business hours only check
    if (timing.businessHoursOnly.enabled) {
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const startTime = this.parseTimeString(timing.businessHoursOnly.startTime);
      const endTime = this.parseTimeString(timing.businessHoursOnly.endTime);
      
      if (timing.businessHoursOnly.weekdaysOnly) {
        const dayOfWeek = now.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
          return { allowed: false, reasons: ['Outside business hours (weekend)'] };
        }
      }
      
      if (currentTime < startTime || currentTime > endTime) {
        return { allowed: false, reasons: ['Outside business hours'] };
      }
    }
    
    // Quiet hours check
    if (timing.quietHours.enabled) {
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const startTime = this.parseTimeString(timing.quietHours.startTime);
      const endTime = this.parseTimeString(timing.quietHours.endTime);
      
      // Handle overnight quiet hours (e.g., 22:00 to 07:00)
      if (startTime > endTime) {
        if (currentTime >= startTime || currentTime <= endTime) {
          return { allowed: false, reasons: ['Quiet hours active'] };
        }
      } else {
        if (currentTime >= startTime && currentTime <= endTime) {
          return { allowed: false, reasons: ['Quiet hours active'] };
        }
      }
    }
    
    return { allowed: true, reasons: [] };
  }

  private parseTimeString(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 100 + minutes;
  }

  private notifyListeners(preferences: NotificationPreferences): void {
    this.listeners.forEach(listener => {
      try {
        listener(preferences);
      } catch (error) {
        console.error('Error notifying preference listener:', error);
      }
    });
  }
}

// Export singleton instance
export const notificationPreferences = new NotificationPreferencesService();

// Export utility functions
export const createNotificationPreferences = (overrides?: Partial<NotificationPreferences>): NotificationPreferences => {
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...overrides,
    lastUpdated: new Date().toISOString(),
  };
};

export const validateNotificationPreferences = (preferences: any): preferences is NotificationPreferences => {
  try {
    return (
      typeof preferences === 'object' &&
      typeof preferences.globalEnabled === 'boolean' &&
      typeof preferences.categories === 'object' &&
      typeof preferences.deliveryMethods === 'object' &&
      typeof preferences.timing === 'object' &&
      typeof preferences.priorityFilter === 'object' &&
      typeof preferences.advanced === 'object' &&
      typeof preferences.lastUpdated === 'string' &&
      typeof preferences.version === 'string'
    );
  } catch {
    return false;
  }
}; 