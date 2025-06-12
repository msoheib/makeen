/**
 * Notification Categories Management System
 * 
 * Provides comprehensive category definitions, utilities, and management
 * for organizing notifications by type, priority, and context.
 */

import { LucideIcon } from 'lucide-react-native';
import { 
  Wrench, 
  DollarSign, 
  Users, 
  Home, 
  Bell, 
  FileText, 
  AlertTriangle,
  Calendar,
  MessageSquare,
  Settings
} from 'lucide-react-native';

export type NotificationCategory = 
  | 'maintenance' 
  | 'payment' 
  | 'tenant' 
  | 'property' 
  | 'system' 
  | 'invoice' 
  | 'contract'
  | 'communication'
  | 'reminder'
  | 'alert';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CategoryDefinition {
  id: NotificationCategory;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  backgroundColor: string;
  priority: NotificationPriority;
  keywords: string[];
  subcategories?: string[];
}

export interface CategoryStats {
  category: NotificationCategory;
  total: number;
  unread: number;
  urgent: number;
  recent: number; // last 24 hours
}

export interface CategoryFilter {
  categories: NotificationCategory[];
  priorities: NotificationPriority[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  readStatus?: 'all' | 'read' | 'unread';
  includeArchived?: boolean;
}

/**
 * Category Definitions
 * Comprehensive mapping of all notification categories with metadata
 */
export const CATEGORY_DEFINITIONS: Record<NotificationCategory, CategoryDefinition> = {
  maintenance: {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'Property maintenance requests and work orders',
    icon: Wrench,
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    priority: 'high',
    keywords: ['repair', 'fix', 'maintenance', 'work order', 'plumbing', 'electrical', 'hvac'],
    subcategories: ['Emergency Repair', 'Routine Maintenance', 'Inspection', 'Work Order']
  },
  payment: {
    id: 'payment',
    name: 'Payment',
    description: 'Rent payments, fees, and financial transactions',
    icon: DollarSign,
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    priority: 'high',
    keywords: ['payment', 'rent', 'fee', 'invoice', 'overdue', 'deposit', 'refund'],
    subcategories: ['Rent Payment', 'Late Fee', 'Security Deposit', 'Refund', 'Invoice']
  },
  tenant: {
    id: 'tenant',
    name: 'Tenant',
    description: 'Tenant-related notifications and communications',
    icon: Users,
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
    priority: 'medium',
    keywords: ['tenant', 'lease', 'renewal', 'move-in', 'move-out', 'complaint'],
    subcategories: ['Lease Renewal', 'Move-in', 'Move-out', 'Complaint', 'Request']
  },
  property: {
    id: 'property',
    name: 'Property',
    description: 'Property management and listing updates',
    icon: Home,
    color: '#8B5CF6',
    backgroundColor: '#EDE9FE',
    priority: 'medium',
    keywords: ['property', 'listing', 'vacancy', 'inspection', 'valuation'],
    subcategories: ['New Listing', 'Vacancy', 'Inspection', 'Valuation', 'Update']
  },
  system: {
    id: 'system',
    name: 'System',
    description: 'System updates and administrative notifications',
    icon: Settings,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    priority: 'low',
    keywords: ['system', 'update', 'backup', 'maintenance', 'security'],
    subcategories: ['Update', 'Backup', 'Security', 'Maintenance', 'Alert']
  },
  invoice: {
    id: 'invoice',
    name: 'Invoice',
    description: 'Billing and invoice notifications',
    icon: FileText,
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    priority: 'high',
    keywords: ['invoice', 'bill', 'payment due', 'overdue', 'statement'],
    subcategories: ['New Invoice', 'Payment Due', 'Overdue', 'Paid', 'Statement']
  },
  contract: {
    id: 'contract',
    name: 'Contract',
    description: 'Lease agreements and contract updates',
    icon: FileText,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    priority: 'medium',
    keywords: ['contract', 'lease', 'agreement', 'renewal', 'expiration'],
    subcategories: ['New Contract', 'Renewal', 'Expiration', 'Amendment', 'Termination']
  },
  communication: {
    id: 'communication',
    name: 'Communication',
    description: 'Messages and communication notifications',
    icon: MessageSquare,
    color: '#7C3AED',
    backgroundColor: '#F3E8FF',
    priority: 'medium',
    keywords: ['message', 'email', 'sms', 'call', 'communication'],
    subcategories: ['Email', 'SMS', 'Call', 'Letter', 'Notice']
  },
  reminder: {
    id: 'reminder',
    name: 'Reminder',
    description: 'Scheduled reminders and follow-ups',
    icon: Calendar,
    color: '#EA580C',
    backgroundColor: '#FED7AA',
    priority: 'medium',
    keywords: ['reminder', 'follow-up', 'deadline', 'appointment', 'schedule'],
    subcategories: ['Deadline', 'Appointment', 'Follow-up', 'Schedule', 'Task']
  },
  alert: {
    id: 'alert',
    name: 'Alert',
    description: 'Urgent alerts and critical notifications',
    icon: AlertTriangle,
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    priority: 'urgent',
    keywords: ['alert', 'urgent', 'critical', 'emergency', 'warning'],
    subcategories: ['Emergency', 'Critical', 'Warning', 'Security', 'System Alert']
  }
};

/**
 * Category Management Service
 * Provides utilities for category operations and management
 */
export class NotificationCategoryService {
  private static instance: NotificationCategoryService;

  private constructor() {}

  public static getInstance(): NotificationCategoryService {
    if (!NotificationCategoryService.instance) {
      NotificationCategoryService.instance = new NotificationCategoryService();
    }
    return NotificationCategoryService.instance;
  }

  /**
   * Get category definition by ID
   */
  getCategoryDefinition(category: NotificationCategory): CategoryDefinition {
    return CATEGORY_DEFINITIONS[category];
  }

  /**
   * Get all category definitions
   */
  getAllCategories(): CategoryDefinition[] {
    return Object.values(CATEGORY_DEFINITIONS);
  }

  /**
   * Get categories by priority
   */
  getCategoriesByPriority(priority: NotificationPriority): CategoryDefinition[] {
    return this.getAllCategories().filter(cat => cat.priority === priority);
  }

  /**
   * Auto-categorize notification based on content
   */
  categorizeNotification(title: string, message: string, type?: string): NotificationCategory {
    const content = `${title} ${message} ${type || ''}`.toLowerCase();
    
    // Check each category's keywords
    for (const [categoryId, definition] of Object.entries(CATEGORY_DEFINITIONS)) {
      const hasKeyword = definition.keywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      );
      
      if (hasKeyword) {
        return categoryId as NotificationCategory;
      }
    }
    
    // Default to system if no match found
    return 'system';
  }

  /**
   * Get category color scheme
   */
  getCategoryColors(category: NotificationCategory): { color: string; backgroundColor: string } {
    const definition = this.getCategoryDefinition(category);
    return {
      color: definition.color,
      backgroundColor: definition.backgroundColor
    };
  }

  /**
   * Get category icon
   */
  getCategoryIcon(category: NotificationCategory): LucideIcon {
    return this.getCategoryDefinition(category).icon;
  }

  /**
   * Validate category
   */
  isValidCategory(category: string): category is NotificationCategory {
    return Object.keys(CATEGORY_DEFINITIONS).includes(category);
  }

  /**
   * Get priority weight for sorting
   */
  getPriorityWeight(priority: NotificationPriority): number {
    const weights = { low: 1, medium: 2, high: 3, urgent: 4 };
    return weights[priority];
  }

  /**
   * Sort categories by priority
   */
  sortCategoriesByPriority(categories: NotificationCategory[]): NotificationCategory[] {
    return categories.sort((a, b) => {
      const priorityA = this.getPriorityWeight(CATEGORY_DEFINITIONS[a].priority);
      const priorityB = this.getPriorityWeight(CATEGORY_DEFINITIONS[b].priority);
      return priorityB - priorityA; // Descending order (urgent first)
    });
  }

  /**
   * Get category statistics structure
   */
  getEmptyCategoryStats(): CategoryStats[] {
    return this.getAllCategories().map(category => ({
      category: category.id,
      total: 0,
      unread: 0,
      urgent: 0,
      recent: 0
    }));
  }

  /**
   * Create default filter
   */
  createDefaultFilter(): CategoryFilter {
    return {
      categories: Object.keys(CATEGORY_DEFINITIONS) as NotificationCategory[],
      priorities: ['low', 'medium', 'high', 'urgent'],
      readStatus: 'all',
      includeArchived: false
    };
  }

  /**
   * Apply category filter to notification list
   */
  applyFilter<T extends { category: NotificationCategory; priority: NotificationPriority; isRead: boolean }>(
    notifications: T[],
    filter: CategoryFilter
  ): T[] {
    return notifications.filter(notification => {
      // Category filter
      if (!filter.categories.includes(notification.category)) {
        return false;
      }

      // Priority filter
      if (!filter.priorities.includes(notification.priority)) {
        return false;
      }

      // Read status filter
      if (filter.readStatus === 'read' && !notification.isRead) {
        return false;
      }
      if (filter.readStatus === 'unread' && notification.isRead) {
        return false;
      }

      // Date range filter
      if (filter.dateRange) {
        // Assuming notification has timestamp field
        const notificationDate = new Date((notification as any).timestamp);
        if (notificationDate < filter.dateRange.start || notificationDate > filter.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }
}

/**
 * Category service singleton instance
 */
export const notificationCategoryService = NotificationCategoryService.getInstance(); 