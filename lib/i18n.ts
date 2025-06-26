import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, I18nManager } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import { getLocales } from 'expo-localization';
import * as Updates from 'expo-updates';

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
 * Applies the RTL layout direction using expo-localization and native I18nManager.
 * @param isRTLLanguage - Whether the language requires RTL layout.
 */
const applyRTLDirectly = (isRTLLanguage: boolean): void => {
  try {
    console.log(`[i18n] Applying RTL config: isRTLLanguage=${isRTLLanguage}, Platform=${Platform.OS}`);
    console.log(`[i18n] Current RTL state BEFORE: ${I18nManager.isRTL}`);
    
    // Get device locale information from expo-localization
    const locales = getLocales();
    const deviceTextDirection = locales[0]?.textDirection;
    console.log(`[i18n] Device locale info:`, {
      textDirection: deviceTextDirection,
      languageCode: locales[0]?.languageCode,
      isRTLDevice: deviceTextDirection === 'rtl'
    });
    
    // Step 1: Always allow RTL support (required for Expo RTL)
    I18nManager.allowRTL(true);
    
    // Step 2: Force RTL direction
    I18nManager.forceRTL(isRTLLanguage);
    
    // Step 3: Immediate verification and retry if needed
    setTimeout(() => {
      if (I18nManager.isRTL !== isRTLLanguage) {
        console.log('[i18n] ⚠️ Immediate RTL verification failed, retrying...');
        I18nManager.forceRTL(isRTLLanguage);
      }
    }, 1);
    
    console.log(`[i18n] RTL applied. Final state AFTER: ${I18nManager.isRTL}`);
    
    // Log detailed state for debugging
    console.log(`[i18n] RTL Configuration Details:`, {
      isRTLLanguage,
      'I18nManager.isRTL': I18nManager.isRTL,
      'Platform.OS': Platform.OS,
      '__DEV__': __DEV__,
      'Direction': I18nManager.isRTL ? 'RTL' : 'LTR',
      'DeviceDirection': deviceTextDirection
    });
    
  } catch (error) {
    console.error('[i18n] Error applying RTL configuration:', error);
  }
};

// Get device language (COMPLETELY UNUSED - app ignores device language entirely)
// This function exists but is NOT called anywhere - app defaults to Arabic always
const getDeviceLanguage = (): 'en' | 'ar' => {
  try {
    const locales = RNLocalize.getLocales();
    if (locales && locales.length > 0) {
      const deviceLanguage = locales[0].languageCode;
      // This logic is irrelevant since function is never called
      return deviceLanguage === 'en' ? 'en' : 'ar';
    }
  } catch (error) {
    console.warn('Error getting device language:', error);
  }
  // This fallback is irrelevant since function is never called
  return 'ar';
};

// Get stored language - ONLY returns English if explicitly set
const getStoredLanguage = async (): Promise<'en' | 'ar'> => {
  try {
    // Use consistent storage key throughout the app
    const stored = await safeStorage.getItem('app-language');
    // ONLY return English if explicitly stored as 'en'
    if (stored === 'en') {
      return 'en';
    }
    // ALL other cases (including 'ar', null, undefined, any other value) return Arabic
  } catch (error) {
    console.warn('Error getting stored language:', error);
  }
  // ALWAYS default to Arabic unless explicitly set to English
  return 'ar';
};

// Initialize i18next with aggressive RTL handling for production compatibility
const initializeI18n = async () => {
  try {
    console.log('[i18n] ========== I18N INITIALIZATION START ==========');
    console.log('[i18n] Build type:', __DEV__ ? 'development' : 'production');
    console.log('[i18n] Platform:', Platform.OS);
    console.log('[i18n] Current I18nManager.isRTL:', I18nManager.isRTL);
    
    const desiredLanguage = await getStoredLanguage();
    const isRTLLanguage = desiredLanguage === 'ar';
    
    console.log(`[i18n] 📱 Language config:`, {
      desiredLanguage,
      isRTLLanguage,
      currentNativeRTL: I18nManager.isRTL
    });

    // AGGRESSIVE RTL SETUP - Multiple attempts to ensure it works in production
    console.log('[i18n] 🔧 Applying aggressive RTL configuration...');
    
    // Step 1: Initial RTL setup
    applyRTLDirectly(isRTLLanguage);
    
    // Step 2: For production builds, apply multiple times with delays
    if (!__DEV__ && Platform.OS === 'android') {
      console.log('[i18n] 🔧 Production mode: Applying aggressive RTL configuration...');
      
      // Multiple attempts with increasing delays
      setTimeout(() => applyRTLDirectly(isRTLLanguage), 10);
      setTimeout(() => applyRTLDirectly(isRTLLanguage), 100);
      setTimeout(() => applyRTLDirectly(isRTLLanguage), 500);
      setTimeout(() => applyRTLDirectly(isRTLLanguage), 1000);
      
      // Final verification after 2 seconds
      setTimeout(() => {
        console.log('[i18n] 🔧 Final RTL verification:', {
          expected: isRTLLanguage,
          actual: I18nManager.isRTL,
          match: I18nManager.isRTL === isRTLLanguage
        });
        if (I18nManager.isRTL !== isRTLLanguage) {
          console.log('[i18n] ⚠️ RTL mismatch detected, applying one more time...');
          applyRTLDirectly(isRTLLanguage);
        }
      }, 2000);
    }
    
    // Initialize i18next
    console.log('[i18n] 🔧 Initializing i18next with language:', desiredLanguage);
    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: desiredLanguage,
        fallbackLng: 'ar',
        defaultNS: 'common',
        ns: ['common', 'navigation', 'dashboard', 'properties', 'settings', 'reports', 'tenants', 'maintenance', 'people', 'documents', 'finance', 'payments'],
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
        debug: __DEV__,
      });
      
    console.log('[i18n] ========== I18N INITIALIZATION COMPLETE ==========');
    console.log('[i18n] Final state:', {
      language: i18n.language,
      isRTL: I18nManager.isRTL,
      direction: I18nManager.isRTL ? 'RTL' : 'LTR'
    });
    return true;
  } catch (error) {
    console.log('[i18n] ❌ I18N INITIALIZATION FAILED:', error);
    console.log('[i18n] Stack trace:', error.stack);
    return false;
  }
};

// Don't auto-initialize - let app/_layout.tsx handle initialization with proper timing
// initializeI18n();

// Export the initialization function for manual control
export const manualInitializeI18n = initializeI18n;

// Get current language - ALWAYS defaults to Arabic
export const getCurrentLanguage = (): 'en' | 'ar' => {
  const current = i18n.language as 'en' | 'ar';
  // ONLY return English if explicitly set to 'en', otherwise ALWAYS Arabic
  return current === 'en' ? 'en' : 'ar';
};

// Check if current language is RTL
export const isRTL = (): boolean => {
  return getCurrentLanguage() === 'ar';
};

// Change language function with direct RTL application (no reload for production compatibility)
export const changeLanguage = async (language: 'en' | 'ar'): Promise<void> => {
  try {
    console.log('[i18n] Changing language to:', language);
    
    const newIsRTL = language === 'ar';
    
    // Change i18next language
    await i18n.changeLanguage(language);
    
    // Store the language preference using consistent key
    await safeStorage.setItem('app-language', language);
    
    // Apply RTL changes immediately without reload
    console.log('[i18n] Applying RTL direction directly...');
    applyRTLDirectly(newIsRTL);
    
    console.log('[i18n] Language changed successfully to:', language);
  } catch (error) {
    console.error('[i18n] Failed to change language:', error);
    throw error;
  }
};

export default i18n;