import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User, Property, MaintenanceRequest, Invoice, Voucher } from './types';
import i18n, { changeLanguage as changeI18nLanguage, syncStoreWithI18n } from './i18n';
import type { SupportedLanguage } from './translations/types';

// Platform-specific storage wrapper to prevent conflicts between web and mobile
const getPlatformStorageKey = (baseKey: string): string => {
  const platform = Platform.OS;
  return `${baseKey}-${platform}`;
};

// Function to clean up old non-platform-specific storage keys
const cleanupOldStorageKeys = async () => {
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    return;
  }
  
  try {
    const oldKeys = [
      'real-estate-app-storage',
      'app-language'
    ];
    
    for (const key of oldKeys) {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        // Ignore errors for keys that don't exist
      }
    }
  } catch (error) {
    console.warn('[Store] Failed to cleanup old storage keys:', error);
  }
};

const safeAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return null;
    }
    try {
      const platformKey = getPlatformStorageKey(key);
      return await AsyncStorage.getItem(platformKey);
    } catch (error) {
      console.warn('[Store] Failed to read from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return;
    }
    try {
      const platformKey = getPlatformStorageKey(key);
      await AsyncStorage.setItem(platformKey, value);
    } catch (error) {
      console.warn('[Store] Failed to write to storage:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return;
    }
    try {
      const platformKey = getPlatformStorageKey(key);
      await AsyncStorage.removeItem(platformKey);
    } catch (error) {
      console.warn('[Store] Failed to remove from storage:', error);
    }
  },
};

// Settings types
export interface NotificationSettings {
  maintenanceRequests: boolean;
  paymentReminders: boolean;
  contractExpirations: boolean;
  systemUpdates: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ar';
  currency: 'SAR';
  notifications: NotificationSettings;
  supportEmail: string;
}

// Notification preferences type
export interface NotificationPreferences {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  pushEnabled: boolean;
  
  // Category preferences
  maintenance: boolean;
  payments: boolean;
  contracts: boolean;
  reports: boolean;
  
  // Timing preferences
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string;   // HH:MM format
}

// Default notification preferences
const defaultNotificationPreferences: NotificationPreferences = {
  soundEnabled: true,
  vibrationEnabled: true,
  badgeEnabled: true,
  pushEnabled: true,
  
  maintenance: true,
  payments: true,
  contracts: true,
  reports: true,
  
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

// Define the state store structure
interface AppState {
  // Hydration state
  isHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  
  // Properties state
  properties: Property[];
  selectedProperty: Property | null;
  setProperties: (properties: Property[]) => void;
  setSelectedProperty: (property: Property | null) => void;
  addProperty: (property: Property) => void;
  updateProperty: (id: string, property: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  
  // Maintenance state
  maintenanceRequests: MaintenanceRequest[];
  selectedRequest: MaintenanceRequest | null;
  setMaintenanceRequests: (requests: MaintenanceRequest[]) => void;
  setSelectedRequest: (request: MaintenanceRequest | null) => void;
  addMaintenanceRequest: (request: MaintenanceRequest) => void;
  updateMaintenanceRequest: (id: string, request: Partial<MaintenanceRequest>) => void;
  deleteMaintenanceRequest: (id: string) => void;
  
  // Financial state
  invoices: Invoice[];
  vouchers: Voucher[];
  setInvoices: (invoices: Invoice[]) => void;
  setVouchers: (vouchers: Voucher[]) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addVoucher: (voucher: Voucher) => void;
  updateVoucher: (id: string, voucher: Partial<Voucher>) => void;
  deleteVoucher: (id: string) => void;
  
  // Settings state
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateNotificationSettings: (notifications: Partial<NotificationSettings>) => void;
  
  // Language management
  changeLanguage: (language: 'en' | 'ar') => Promise<void>;
  getCurrentLanguage: () => 'en' | 'ar';
  isRTL: () => boolean;
  
  // Legacy UI state (kept for backwards compatibility)
  locale: string;
  theme: 'light' | 'dark';
  setLocale: (locale: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // User authentication
  authenticated: boolean;
  loading: boolean;
  
  // Theme and preferences
  isDarkMode: boolean;
  
 // Notifications
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  maintenanceNotifications: boolean;
  financialNotifications: boolean;
  
  
  // Actions
  toggleDarkMode: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setEmailNotifications: (enabled: boolean) => void;
  setPushNotifications: (enabled: boolean) => void;
  setMaintenanceNotifications: (enabled: boolean) => void;
  setFinancialNotifications: (enabled: boolean) => void;
  
  // Language settings
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  
  // Currency settings 
  currency: string;
  setCurrency: (currency: string) => void;
  
  // Notification preferences
  notificationPreferences: NotificationPreferences;
  setNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void;
  updateNotificationPreference: (key: keyof NotificationPreferences, value: boolean | string) => void;
  
  // User profile
  userProfile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
  } | null;
  setUserProfile: (profile: AppState['userProfile']) => void;
  
  // App settings
  firstLaunch: boolean;
  setFirstLaunch: (firstLaunch: boolean) => void;
  
  // Reset function
  reset: () => void;
  
  // Notification state
  unreadNotificationCount: number;
  lastNotificationUpdate: number;
  
  // Notification actions
  setUnreadNotificationCount: (count: number) => void;
  triggerHeaderBadgeRefresh: () => void;
}

// Create the store with persistence
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Hydration state
      isHydrated: false,
      setHydrated: (isHydrated) => set({ isHydrated }),
      
      // Auth state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      
      // Properties state
      properties: [],
      selectedProperty: null,
      setProperties: (properties) => set({ properties }),
      setSelectedProperty: (selectedProperty) => set({ selectedProperty }),
      addProperty: (property) => 
        set((state) => ({ properties: [...state.properties, property] })),
      updateProperty: (id, updatedProperty) => 
        set((state) => ({
          properties: state.properties.map((property) => 
            property.id === id ? { ...property, ...updatedProperty } : property
          ),
        })),
      deleteProperty: (id) => 
        set((state) => ({
          properties: state.properties.filter((property) => property.id !== id),
        })),
      
      // Maintenance state
      maintenanceRequests: [],
      selectedRequest: null,
      setMaintenanceRequests: (maintenanceRequests) => set({ maintenanceRequests }),
      setSelectedRequest: (selectedRequest) => set({ selectedRequest }),
      addMaintenanceRequest: (request) => 
        set((state) => ({ maintenanceRequests: [...state.maintenanceRequests, request] })),
      updateMaintenanceRequest: (id, updatedRequest) => 
        set((state) => ({
          maintenanceRequests: state.maintenanceRequests.map((request) => 
            request.id === id ? { ...request, ...updatedRequest } : request
          ),
        })),
      deleteMaintenanceRequest: (id) => 
        set((state) => ({
          maintenanceRequests: state.maintenanceRequests.filter((request) => request.id !== id),
        })),
      
      // Financial state
      invoices: [],
      vouchers: [],
      setInvoices: (invoices) => set({ invoices }),
      setVouchers: (vouchers) => set({ vouchers }),
      addInvoice: (invoice) => 
        set((state) => ({ invoices: [...state.invoices, invoice] })),
      updateInvoice: (id, updatedInvoice) => 
        set((state) => ({
          invoices: state.invoices.map((invoice) => 
            invoice.id === id ? { ...invoice, ...updatedInvoice } : invoice
          ),
        })),
      deleteInvoice: (id) => 
        set((state) => ({
          invoices: state.invoices.filter((invoice) => invoice.id !== id),
        })),
      addVoucher: (voucher) => 
        set((state) => ({ vouchers: [...state.vouchers, voucher] })),
      updateVoucher: (id, updatedVoucher) => 
        set((state) => ({
          vouchers: state.vouchers.map((voucher) => 
            voucher.id === id ? { ...voucher, ...updatedVoucher } : voucher
          ),
        })),
      deleteVoucher: (id) => 
        set((state) => ({
          vouchers: state.vouchers.filter((voucher) => voucher.id !== id),
        })),
      
      // Settings state
      settings: {
        theme: 'system',
        language: 'en',
        currency: 'SAR',
        notifications: {
          maintenanceRequests: true,
          paymentReminders: true,
          contractExpirations: true,
          systemUpdates: false,
        },
        supportEmail: 'info@example.com',
      },
      updateSettings: (newSettings) => 
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      updateNotificationSettings: (newNotifications) => 
        set((state) => ({
          settings: {
            ...state.settings,
            notifications: { ...state.settings.notifications, ...newNotifications },
          },
        })),
      
      // Language management
      changeLanguage: async (language: 'en' | 'ar') => {
        // Skip language change during SSR
        if (Platform.OS === 'web' && typeof window === 'undefined') {
          return;
        }
        
        try {
          
          // Update i18n language and RTL (this will also persist it)
          await changeI18nLanguage(language);
          
          // Update ALL language-related state fields to keep them in sync
          set((state) => ({
            settings: { ...state.settings, language },
            locale: language, // Update legacy state too
            language: language, // Update the separate language field
          }));
          
        } catch (error) {
          console.error('Store: Failed to change language:', error);
          throw error; // Re-throw to handle in UI
        }
      },
      
      getCurrentLanguage: () => {
        const state = get();
        return state.settings.language;
      },
      
      isRTL: () => {
        const state = get();
        return state.settings.language === 'ar';
      },
      
      // Legacy UI state (kept for backwards compatibility)
      locale: 'ar',
      theme: 'light',
      setLocale: (locale) => {
        set({ locale });
        // Also update new settings and trigger proper language change
        const state = get();
        state.changeLanguage(locale as 'en' | 'ar');
      },
      setTheme: (theme) => {
        set({ theme });
        // Also update new settings
        const state = get();
        state.updateSettings({ theme });
      },
      
      // User authentication
      authenticated: false,
      loading: false,
      
      // Theme and preferences
      isDarkMode: false,
      language: 'en',
      currency: 'SAR',
      
      // Notifications
      notificationsEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      maintenanceNotifications: true,
      financialNotifications: true,
      
      
      // Actions
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setEmailNotifications: (enabled) => set({ emailNotifications: enabled }),
      setPushNotifications: (enabled) => set({ pushNotifications: enabled }),
      setMaintenanceNotifications: (enabled) => set({ maintenanceNotifications: enabled }),
      setFinancialNotifications: (enabled) => set({ financialNotifications: enabled }),
      
      // Language settings
      language: 'en' as SupportedLanguage,
      setLanguage: (language) => set({ language }),
      
      // Currency settings 
      currency: 'SAR',
      setCurrency: (currency) => set({ currency }),
      
      // Notification preferences
      notificationPreferences: defaultNotificationPreferences,
      setNotificationPreferences: (preferences) =>
        set((state) => ({
          notificationPreferences: { ...state.notificationPreferences, ...preferences },
        })),
      updateNotificationPreference: (key, value) =>
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            [key]: value,
          },
        })),
      
      // User profile
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      
      // App settings
      firstLaunch: true,
      setFirstLaunch: (firstLaunch) => set({ firstLaunch }),
      
      // Reset function
      reset: () =>
        set({
          language: 'en',
          currency: 'SAR',
          notificationPreferences: defaultNotificationPreferences,
          userProfile: null,
          firstLaunch: true,
        }),
      
      // Notification state
      unreadNotificationCount: 0,
      lastNotificationUpdate: Date.now(),
      
      // Notification actions
      setUnreadNotificationCount: (count) => set({ unreadNotificationCount: count }),
      triggerHeaderBadgeRefresh: () => set({ lastNotificationUpdate: Date.now() }),
    }),
    {
      name: 'real-estate-app-storage',
      storage: safeAsyncStorage,
      // Only persist settings, auth state, and some UI preferences
      partialize: (state) => ({
        settings: state.settings,
        locale: state.locale,
        language: state.language, // Include the separate language field
        theme: state.theme,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => async (state) => {
        // Skip rehydration during SSR
        if (Platform.OS === 'web' && typeof window === 'undefined') {
          return;
        }
        
        try {
          // Clean up old storage keys that might conflict
          await cleanupOldStorageKeys();
          
          // Mark as hydrated first
          state?.setHydrated(true);
          
          // Apply persisted language to i18n/RTL immediately after hydration
          // Check multiple sources for the language preference
          const settingsLang = state?.settings?.language as 'en' | 'ar' | undefined;
          const legacyLang = state?.language as 'en' | 'ar' | undefined;
          const localeLang = state?.locale as 'en' | 'ar' | undefined;
          
          // Use the most recent language setting (prioritize settings.language)
          const lang = settingsLang || legacyLang || localeLang || 'en';
          
          
          if (lang) {
            // Always sync the language, even if it's English
            await changeI18nLanguage(lang);
            // Keep all language fields in sync
            useAppStore.setState({ 
              locale: lang,
              language: lang,
              settings: { ...state?.settings, language: lang }
            });
            // Also sync the i18n storage
            await syncStoreWithI18n();
          }
          
          // Apply persisted theme to legacy isDarkMode for components reading it
          const themeMode = state?.settings?.theme as 'light' | 'dark' | 'system' | undefined;
          if (themeMode && themeMode !== 'system') {
            useAppStore.setState({ isDarkMode: themeMode === 'dark', theme: themeMode });
          }
        } catch (e) {
          console.warn('[store] Rehydrate apply settings failed:', e);
        }
      },
    }
  )
);

// Export a simpler hook that matches the expected interface
export const useStore = () => {
  const store = useAppStore();
  return {
    ...store,
    user: store.user ? {
      ...store.user,
      ownedPropertyIds: store.properties
        .filter(p => p.owner_id === store.user?.id)
        .map(p => p.id)
    } : null,
  };
};

// Notification badge state (separate store for better performance)
interface NotificationBadgeState {
  maintenanceBadge: number;
  paymentsBadge: number;
  contractsBadge: number;
  reportsBadge: number;
  totalBadge: number;
  
  setMaintenanceBadge: (count: number) => void;
  setPaymentsBadge: (count: number) => void;
  setContractsBadge: (count: number) => void;
  setReportsBadge: (count: number) => void;
  clearAllBadges: () => void;
}

export const useNotificationBadgeStore = create<NotificationBadgeState>((set, get) => ({
  maintenanceBadge: 0,
  paymentsBadge: 0,
  contractsBadge: 0,
  reportsBadge: 0,
  totalBadge: 0,
  
  setMaintenanceBadge: (count) => {
    set({ maintenanceBadge: count });
    const state = get();
    const total = state.maintenanceBadge + state.paymentsBadge + state.contractsBadge + state.reportsBadge;
    set({ totalBadge: total });
  },
  
  setPaymentsBadge: (count) => {
    set({ paymentsBadge: count });
    const state = get();
    const total = state.maintenanceBadge + state.paymentsBadge + state.contractsBadge + state.reportsBadge;
    set({ totalBadge: total });
  },
  
  setContractsBadge: (count) => {
    set({ contractsBadge: count });
    const state = get();
    const total = state.maintenanceBadge + state.paymentsBadge + state.contractsBadge + state.reportsBadge;
    set({ totalBadge: total });
  },
  
  setReportsBadge: (count) => {
    set({ reportsBadge: count });
    const state = get();
    const total = state.maintenanceBadge + state.paymentsBadge + state.contractsBadge + state.reportsBadge;
    set({ totalBadge: total });
  },
  
  clearAllBadges: () => {
    set({
      maintenanceBadge: 0,
      paymentsBadge: 0,
      contractsBadge: 0,
      reportsBadge: 0,
      totalBadge: 0,
    });
  },
}));

// Backwards compatibility: export isDarkMode as always false
export const isDarkMode = false;
