export type NotificationType = 
  | 'maintenance' 
  | 'payment' 
  | 'tenant' 
  | 'property' 
  | 'system' 
  | 'invoice' 
  | 'contract';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type DeliveryMethod = 'push' | 'inApp' | 'email';

export interface TimingConfig {
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
  doNotDisturb: {
    enabled: boolean;
    endTime?: string; // ISO string for temporary DND
  };
  weekendMode: {
    enabled: boolean;
    reducedTypes: NotificationType[];
  };
  businessHoursOnly: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    weekdaysOnly: boolean;
  };
}

export interface CategoryPreferences {
  [key: string]: {
    enabled: boolean;
    deliveryMethods: DeliveryMethod[];
    minimumPriority: NotificationPriority;
  };
}

export interface NotificationPreferences {
  // Global settings
  globalEnabled: boolean;
  
  // Category-specific preferences
  categories: CategoryPreferences;
  
  // Delivery method preferences
  deliveryMethods: {
    push: {
      enabled: boolean;
      sound: boolean;
      vibration: boolean;
      badge: boolean;
    };
    inApp: {
      enabled: boolean;
      showUnreadCount: boolean;
    };
    email: {
      enabled: boolean;
      address?: string;
      digest: boolean; // Send daily digest instead of immediate
    };
  };
  
  // Timing and filtering
  timing: TimingConfig;
  
  // Priority filtering
  priorityFilter: {
    minimumPriority: NotificationPriority;
    urgentOverride: boolean; // Always show urgent regardless of other settings
  };
  
  // Advanced settings
  advanced: {
    groupSimilar: boolean; // Group similar notifications
    autoMarkRead: boolean; // Auto-mark as read after viewing
    retentionDays: number; // How long to keep notifications
    maxNotifications: number; // Maximum stored notifications
  };
  
  // Metadata
  lastUpdated: string;
  version: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  globalEnabled: true,
  
  categories: {
    maintenance: {
      enabled: true,
      deliveryMethods: ['push', 'inApp'],
      minimumPriority: 'medium',
    },
    payment: {
      enabled: true,
      deliveryMethods: ['push', 'inApp'],
      minimumPriority: 'medium',
    },
    tenant: {
      enabled: true,
      deliveryMethods: ['push', 'inApp'],
      minimumPriority: 'medium',
    },
    property: {
      enabled: true,
      deliveryMethods: ['push', 'inApp'],
      minimumPriority: 'medium',
    },
    system: {
      enabled: true,
      deliveryMethods: ['push', 'inApp'],
      minimumPriority: 'high',
    },
    invoice: {
      enabled: true,
      deliveryMethods: ['push', 'inApp'],
      minimumPriority: 'medium',
    },
    contract: {
      enabled: true,
      deliveryMethods: ['push', 'inApp'],
      minimumPriority: 'high',
    },
  },
  
  deliveryMethods: {
    push: {
      enabled: true,
      sound: true,
      vibration: true,
      badge: true,
    },
    inApp: {
      enabled: true,
      showUnreadCount: true,
    },
    email: {
      enabled: false,
      digest: true,
    },
  },
  
  timing: {
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
    },
    doNotDisturb: {
      enabled: false,
    },
    weekendMode: {
      enabled: false,
      reducedTypes: ['system'],
    },
    businessHoursOnly: {
      enabled: false,
      startTime: '09:00',
      endTime: '17:00',
      weekdaysOnly: true,
    },
  },
  
  priorityFilter: {
    minimumPriority: 'medium',
    urgentOverride: true,
  },
  
  advanced: {
    groupSimilar: true,
    autoMarkRead: false,
    retentionDays: 30,
    maxNotifications: 1000,
  },
  
  lastUpdated: new Date().toISOString(),
  version: '1.0.0',
};

export const NOTIFICATION_CATEGORY_INFO = {
  maintenance: {
    title: 'Maintenance',
    description: 'Work orders, repair requests, completion updates',
    icon: 'wrench',
    examples: ['New maintenance request', 'Work order completed', 'Repair scheduled'],
  },
  payment: {
    title: 'Payments',
    description: 'Rent payments, payment confirmations, reminders',
    icon: 'dollar-sign',
    examples: ['Payment received', 'Payment overdue', 'Payment processed'],
  },
  tenant: {
    title: 'Tenants',
    description: 'Tenant applications, lease renewals, tenant updates',
    icon: 'users',
    examples: ['New tenant application', 'Lease renewal due', 'Tenant check-out'],
  },
  property: {
    title: 'Properties',
    description: 'Property status changes, listing updates, inquiries',
    icon: 'home',
    examples: ['Property listed', 'Viewing scheduled', 'Property inquiry'],
  },
  system: {
    title: 'System',
    description: 'App updates, system maintenance, important announcements',
    icon: 'info',
    examples: ['App update available', 'System maintenance', 'Important notice'],
  },
  invoice: {
    title: 'Invoices',
    description: 'VAT invoices, billing statements, payment due notices',
    icon: 'file-text',
    examples: ['Invoice generated', 'Payment due', 'Invoice overdue'],
  },
  contract: {
    title: 'Contracts',
    description: 'Lease agreements, contract renewals, legal notices',
    icon: 'file-text',
    examples: ['Contract signed', 'Contract expiring', 'Legal notice'],
  },
} as const;

export const PRIORITY_INFO = {
  low: {
    title: 'Low Priority',
    description: 'General updates and non-urgent information',
    color: '#6B7280',
  },
  medium: {
    title: 'Medium Priority', 
    description: 'Standard notifications requiring attention',
    color: '#3B82F6',
  },
  high: {
    title: 'High Priority',
    description: 'Important notifications requiring prompt attention',
    color: '#F59E0B',
  },
  urgent: {
    title: 'Urgent Priority',
    description: 'Critical notifications requiring immediate attention',
    color: '#EF4444',
  },
} as const; 