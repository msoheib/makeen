import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, I18nManager } from 'react-native';
import * as RNLocalize from 'react-native-localize';

// Import translation files
import commonEn from './translations/en/common.json';
import navigationEn from './translations/en/navigation.json';
import dashboardEn from './translations/en/dashboard.json';
import propertiesEn from './translations/en/properties.json';
import settingsEn from './translations/en/settings.json';
import reportsEn from './translations/en/reports.json';
import tenantsEn from './translations/en/tenants.json';
import maintenanceEn from './translations/en/maintenance.json';
import peopleEn from './translations/en/people.json';
import documentsEn from './translations/en/documents.json';
import financeEn from './translations/en/finance.json';
import paymentsEn from './translations/en/payments.json';

import commonAr from './translations/ar/common.json';
import navigationAr from './translations/ar/navigation.json';
import dashboardAr from './translations/ar/dashboard.json';
import propertiesAr from './translations/ar/properties.json';
import settingsAr from './translations/ar/settings.json';
import reportsAr from './translations/ar/reports.json';
import tenantsAr from './translations/ar/tenants.json';
import maintenanceAr from './translations/ar/maintenance.json';
import peopleAr from './translations/ar/people.json';
import documentsAr from './translations/ar/documents.json';
import financeAr from './translations/ar/finance.json';
import paymentsAr from './translations/ar/payments.json';

export type SupportedLanguage = 'en' | 'ar';

// Safe storage wrapper for web compatibility
const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        console.warn('Window not available, using memory storage fallback');
        return null;
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('AsyncStorage getItem failed, using fallback:', error);
      return null;
    }
  },
  
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        console.warn('Window not available, skipping storage');
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn('AsyncStorage setItem failed:', error);
    }
  }
};

// Translation resources
const resources = {
  en: {
    common: commonEn,
    navigation: navigationEn,
    dashboard: dashboardEn,
    properties: propertiesEn,
    settings: settingsEn,
    reports: reportsEn,
    tenants: tenantsEn,
    maintenance: maintenanceEn,
    people: peopleEn,
    documents: documentsEn,
    finance: financeEn,
    payments: paymentsEn,
  },
  ar: {
    common: commonAr,
    navigation: navigationAr,
    dashboard: dashboardAr,
    properties: propertiesAr,
    settings: settingsAr,
    reports: reportsAr,
    tenants: tenantsAr,
    maintenance: maintenanceAr,
    people: peopleAr,
    documents: documentsAr,
    finance: financeAr,
    payments: paymentsAr,
  },
};

/**
 * Applies the RTL layout direction natively.
 * This function is defined here to avoid circular dependencies.
 * @param isRTLLanguage - Whether the language requires RTL layout.
 */
const applyRTL = (isRTLLanguage: boolean): void => {
  try {
    console.log(`[i18n] Applying RTL config: isRTLLanguage=${isRTLLanguage}, Platform=${Platform.OS}`);
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(isRTLLanguage);
    console.log(`[i18n] Final state: I18nManager.isRTL=${I18nManager.isRTL}`);
  } catch (error) {
    console.error('[i18n] Error applying RTL configuration:', error);
  }
};

// Get device language (currently unused - app defaults to Arabic regardless of device)
const getDeviceLanguage = (): 'en' | 'ar' => {
  try {
    const locales = RNLocalize.getLocales();
    if (locales && locales.length > 0) {
      const deviceLanguage = locales[0].languageCode;
      // Default to Arabic if not specifically English
      return deviceLanguage === 'en' ? 'en' : 'ar';
    }
  } catch (error) {
    console.warn('Error getting device language:', error);
  }
  // Fallback to Arabic as the default
  return 'ar';
};

// Get stored language
const getStoredLanguage = async (): Promise<'en' | 'ar'> => {
  try {
    // Use consistent storage key throughout the app
    const stored = await safeStorage.getItem('app-language');
    if (stored === 'en' || stored === 'ar') {
      return stored;
    }
  } catch (error) {
    console.warn('Error getting stored language:', error);
  }
  // Always default to Arabic unless explicitly set to English
  return 'ar';
};

// Initialize i18next
const initializeI18n = async () => {
  try {
    console.log('Starting i18n initialization...');
    
    const language = await getStoredLanguage();
    console.log('Using language:', language);

    // CRITICAL FIX: Apply RTL settings immediately after language determination
    // This happens BEFORE React initialization to prevent race condition
    applyRTL(language === 'ar');
    
    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: language,
        fallbackLng: 'ar', // Consistent fallback language
        defaultNS: 'common',
        ns: ['common', 'navigation', 'dashboard', 'properties', 'settings', 'reports', 'tenants', 'maintenance', 'people', 'documents', 'finance', 'payments'],
        
        interpolation: {
          escapeValue: false, // React already escapes values
        },
        
        react: {
          useSuspense: false, // Disable suspense for React Native
        },
        
        debug: __DEV__, // Enable debug in development
      });
      
    console.log('i18n initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    return false;
  }
};

// Initialize immediately
initializeI18n();

// Get current language
export const getCurrentLanguage = (): 'en' | 'ar' => {
  return (i18n.language as 'en' | 'ar') || 'ar';
};

// Check if current language is RTL
export const isRTL = (): boolean => {
  return getCurrentLanguage() === 'ar';
};

// Change language function with proper error handling
export const changeLanguage = async (language: 'en' | 'ar'): Promise<void> => {
  try {
    console.log('Changing language to:', language);
    
    // Change i18next language
    await i18n.changeLanguage(language);
    
    // Store the language preference using consistent key
    await safeStorage.setItem('app-language', language);
    
    console.log('Language changed successfully to:', language);
  } catch (error) {
    console.error('Failed to change language:', error);
    throw error;
  }
};

export default i18n;