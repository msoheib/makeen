/**
 * Advanced Notification Filtering Engine
 * 
 * Provides comprehensive filtering capabilities with multi-criteria support,
 * real-time application, persistence, and complex query operations.
 */

import { 
  NotificationCategory, 
  NotificationPriority, 
  CategoryFilter,
  notificationCategoryService 
} from './notificationCategories';
import { NotificationWithProfile } from '@/types/notification';

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filter: CategoryFilter;
  isDefault: boolean;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

export interface FilterState {
  activeFilter: CategoryFilter;
  presets: FilterPreset[];
  searchQuery: string;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid' | 'compact';
}

export interface SortOption {
  field: 'timestamp' | 'priority' | 'category' | 'title' | 'read';
  label: string;
}

export interface FilterResult<T> {
  items: T[];
  totalCount: number;
  filteredCount: number;
  stats: FilterStats;
}

export interface FilterStats {
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  byReadStatus: { read: number; unread: number };
  recentCount: number; // last 24 hours
}

/**
 * Sort Options Available
 */
export const SORT_OPTIONS: SortOption[] = [
  { field: 'timestamp', label: 'Date' },
  { field: 'priority', label: 'Priority' },
  { field: 'category', label: 'Category' },
  { field: 'title', label: 'Title' },
  { field: 'read', label: 'Read Status' }
];

/**
 * Default Filter Presets
 */
export const DEFAULT_FILTER_PRESETS: Omit<FilterPreset, 'id' | 'createdAt' | 'lastUsed' | 'useCount'>[] = [
  {
    name: 'All Notifications',
    description: 'Show all notifications',
    filter: notificationCategoryService.createDefaultFilter(),
    isDefault: true
  },
  {
    name: 'Unread Only',
    description: 'Show only unread notifications',
    filter: {
      ...notificationCategoryService.createDefaultFilter(),
      readStatus: 'unread'
    },
    isDefault: false
  },
  {
    name: 'High Priority',
    description: 'High and urgent priority notifications',
    filter: {
      ...notificationCategoryService.createDefaultFilter(),
      priorities: ['high', 'urgent']
    },
    isDefault: false
  },
  {
    name: 'Maintenance & Payment',
    description: 'Maintenance and payment related notifications',
    filter: {
      ...notificationCategoryService.createDefaultFilter(),
      categories: ['maintenance', 'payment']
    },
    isDefault: false
  },
  {
    name: 'Recent Activity',
    description: 'Notifications from the last 7 days',
    filter: {
      ...notificationCategoryService.createDefaultFilter(),
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      }
    },
    isDefault: false
  },
  {
    name: 'Urgent Alerts',
    description: 'Urgent alerts and critical notifications',
    filter: {
      ...notificationCategoryService.createDefaultFilter(),
      categories: ['alert'],
      priorities: ['urgent']
    },
    isDefault: false
  }
];

/**
 * Advanced Notification Filter Engine
 */
export class NotificationFilterEngine {
  private static instance: NotificationFilterEngine;
  private filterState: FilterState;
  private listeners: Set<(state: FilterState) => void> = new Set();

  private constructor() {
    this.filterState = this.createDefaultState();
  }

  public static getInstance(): NotificationFilterEngine {
    if (!NotificationFilterEngine.instance) {
      NotificationFilterEngine.instance = new NotificationFilterEngine();
    }
    return NotificationFilterEngine.instance;
  }

  /**
   * Create default filter state
   */
  private createDefaultState(): FilterState {
    return {
      activeFilter: notificationCategoryService.createDefaultFilter(),
      presets: this.initializePresets(),
      searchQuery: '',
      sortBy: SORT_OPTIONS[0], // timestamp
      sortOrder: 'desc',
      viewMode: 'list'
    };
  }

  /**
   * Initialize default presets
   */
  private initializePresets(): FilterPreset[] {
    return DEFAULT_FILTER_PRESETS.map((preset, index) => ({
      ...preset,
      id: `preset-${index}`,
      createdAt: new Date(),
      useCount: 0
    }));
  }

  /**
   * Get current filter state
   */
  getState(): FilterState {
    return { ...this.filterState };
  }

  /**
   * Subscribe to filter state changes
   */
  subscribe(listener: (state: FilterState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  /**
   * Update active filter
   */
  setActiveFilter(filter: Partial<CategoryFilter>): void {
    this.filterState.activeFilter = {
      ...this.filterState.activeFilter,
      ...filter
    };
    this.notifyListeners();
  }

  /**
   * Apply preset filter
   */
  applyPreset(presetId: string): void {
    const preset = this.filterState.presets.find(p => p.id === presetId);
    if (preset) {
      this.filterState.activeFilter = { ...preset.filter };
      preset.lastUsed = new Date();
      preset.useCount++;
      this.notifyListeners();
    }
  }

  /**
   * Add custom filter preset
   */
  addPreset(name: string, description: string, filter?: CategoryFilter): string {
    const id = `custom-${Date.now()}`;
    const preset: FilterPreset = {
      id,
      name,
      description,
      filter: filter || { ...this.filterState.activeFilter },
      isDefault: false,
      createdAt: new Date(),
      useCount: 0
    };
    this.filterState.presets.push(preset);
    this.notifyListeners();
    return id;
  }

  /**
   * Remove custom preset
   */
  removePreset(presetId: string): boolean {
    const index = this.filterState.presets.findIndex(p => p.id === presetId && !p.isDefault);
    if (index >= 0) {
      this.filterState.presets.splice(index, 1);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Set search query
   */
  setSearchQuery(query: string): void {
    this.filterState.searchQuery = query;
    this.notifyListeners();
  }

  /**
   * Set sort options
   */
  setSortOptions(sortBy: SortOption, sortOrder: 'asc' | 'desc' = 'desc'): void {
    this.filterState.sortBy = sortBy;
    this.filterState.sortOrder = sortOrder;
    this.notifyListeners();
  }

  /**
   * Set view mode
   */
  setViewMode(mode: 'list' | 'grid' | 'compact'): void {
    this.filterState.viewMode = mode;
    this.notifyListeners();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterState.activeFilter = notificationCategoryService.createDefaultFilter();
    this.filterState.searchQuery = '';
    this.notifyListeners();
  }

  /**
   * Apply comprehensive filter to notifications
   */
  applyFilter(notifications: NotificationWithProfile[]): FilterResult<NotificationWithProfile> {
    let filteredNotifications = [...notifications];

    // Apply category and priority filters
    filteredNotifications = notificationCategoryService.applyFilter(
      filteredNotifications,
      this.filterState.activeFilter
    );

    // Apply search query
    if (this.filterState.searchQuery.trim()) {
      const query = this.filterState.searchQuery.toLowerCase().trim();
      filteredNotifications = filteredNotifications.filter(notification =>
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        notification.type.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filteredNotifications = this.applySorting(filteredNotifications);

    // Calculate statistics
    const stats = this.calculateStats(filteredNotifications);

    return {
      items: filteredNotifications,
      totalCount: notifications.length,
      filteredCount: filteredNotifications.length,
      stats
    };
  }

  /**
   * Apply sorting to notifications
   */
  private applySorting(notifications: NotificationWithProfile[]): NotificationWithProfile[] {
    return notifications.sort((a, b) => {
      let result = 0;

      switch (this.filterState.sortBy.field) {
        case 'timestamp':
          result = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'priority':
          const priorityA = notificationCategoryService.getPriorityWeight(a.priority);
          const priorityB = notificationCategoryService.getPriorityWeight(b.priority);
          result = priorityA - priorityB;
          break;
        case 'category':
          result = a.category.localeCompare(b.category);
          break;
        case 'title':
          result = a.title.localeCompare(b.title);
          break;
        case 'read':
          result = (a.isRead ? 1 : 0) - (b.isRead ? 1 : 0);
          break;
      }

      return this.filterState.sortOrder === 'desc' ? -result : result;
    });
  }

  /**
   * Calculate filter statistics
   */
  private calculateStats(notifications: NotificationWithProfile[]): FilterStats {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats: FilterStats = {
      byCategory: {} as Record<NotificationCategory, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      byReadStatus: { read: 0, unread: 0 },
      recentCount: 0
    };

    // Initialize counters
    notificationCategoryService.getAllCategories().forEach(cat => {
      stats.byCategory[cat.id] = 0;
    });
    ['low', 'medium', 'high', 'urgent'].forEach(priority => {
      stats.byPriority[priority as NotificationPriority] = 0;
    });

    // Calculate statistics
    notifications.forEach(notification => {
      stats.byCategory[notification.category]++;
      stats.byPriority[notification.priority]++;
      
      if (notification.isRead) {
        stats.byReadStatus.read++;
      } else {
        stats.byReadStatus.unread++;
      }

      if (new Date(notification.timestamp) > yesterday) {
        stats.recentCount++;
      }
    });

    return stats;
  }

  /**
   * Get popular presets (most used)
   */
  getPopularPresets(limit: number = 5): FilterPreset[] {
    return [...this.filterState.presets]
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, limit);
  }

  /**
   * Get recent presets (recently used)
   */
  getRecentPresets(limit: number = 5): FilterPreset[] {
    return [...this.filterState.presets]
      .filter(preset => preset.lastUsed)
      .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
      .slice(0, limit);
  }

  /**
   * Export filter state for persistence
   */
  exportState(): string {
    return JSON.stringify(this.filterState);
  }

  /**
   * Import filter state from persistence
   */
  importState(stateJson: string): boolean {
    try {
      const state = JSON.parse(stateJson);
      this.filterState = { ...this.createDefaultState(), ...state };
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to import filter state:', error);
      return false;
    }
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.filterState = this.createDefaultState();
    this.notifyListeners();
  }
}

/**
 * Filter engine singleton instance
 */
export const notificationFilterEngine = NotificationFilterEngine.getInstance(); 