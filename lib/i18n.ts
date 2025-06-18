import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, I18nManager } from 'react-native';
import * as RNLocalize from 'react-native-localize';
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
 * Applies the RTL layout direction natively with reload support for Android.
 * @param isRTLLanguage - Whether the language requires RTL layout.
 */
const applyRTLWithReload = async (isRTLLanguage: boolean): Promise<void> => {
  try {
    console.log(`[i18n] Applying RTL config: isRTLLanguage=${isRTLLanguage}, Platform=${Platform.OS}`);
    
    // Check if there's a layout direction mismatch on Android
    if (Platform.OS === 'android' && I18nManager.isRTL !== isRTLLanguage) {
      console.log(`[i18n] Layout mismatch on Android. Native: ${I18nManager.isRTL}, Desired: ${isRTLLanguage}.`);
      
      // Apply the new direction
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(isRTLLanguage);
      
      // Force a native reload of the app for the change to take effect
      console.log('[i18n] Forcing app reload to apply RTL layout...');
      await Updates.reloadAsync();
      // The app will restart here, and the code below will not run until the next load.
    } else {
      // For iOS and Web, or when no mismatch, apply without reload
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(isRTLLanguage);
    }
    
    console.log(`[i18n] Final state: I18nManager.isRTL=${I18nManager.isRTL}`);
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

// Initialize i18next with improved RTL handling
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

    // This is the critical fix for Android RTL layout issues
    if (Platform.OS === 'android') {
      // Check if the current native layout direction mismatches the desired direction
      if (I18nManager.isRTL !== isRTLLanguage) {
        console.log(`[i18n] ⚠️  ANDROID RTL MISMATCH DETECTED!`);
        console.log(`[i18n] Native: ${I18nManager.isRTL} -> Desired: ${isRTLLanguage}`);
        
        // Apply the new direction
        console.log('[i18n] 🔧 Applying RTL configuration...');
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(isRTLLanguage);
        
        // Force a native reload of the app for the change to take effect
        console.log('[i18n] 🔄 FORCING APP RELOAD for RTL layout...');
        try {
          await Updates.reloadAsync();
        } catch (reloadError) {
          console.error('[i18n] ❌ Reload failed:', reloadError);
          // Continue anyway
        }
        // The app will restart here, and the code below will not run until the next load.
        return false; // Indicate reload occurred
      } else {
        console.log('[i18n] ✅ Android RTL layout already correct');
      }
    } else {
      // For iOS and Web, changes can be applied without a reload
      console.log('[i18n] 🍎 iOS/Web: Applying RTL without reload');
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(isRTLLanguage);
    }
    
    // The rest of the i18n initialization
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
    console.error('[i18n] ❌ I18N INITIALIZATION FAILED:', error);
    console.error('[i18n] Stack trace:', error.stack);
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

// Change language function with proper RTL reload handling
export const changeLanguage = async (language: 'en' | 'ar'): Promise<void> => {
  try {
    console.log('[i18n] Changing language to:', language);
    
    const currentIsRTL = I18nManager.isRTL;
    const newIsRTL = language === 'ar';
    
    // Change i18next language
    await i18n.changeLanguage(language);
    
    // Store the language preference using consistent key
    await safeStorage.setItem('app-language', language);
    
    // Apply RTL changes with reload if necessary
    if (Platform.OS === 'android' && currentIsRTL !== newIsRTL) {
      console.log('[i18n] RTL direction change detected on Android, applying with reload...');
      await applyRTLWithReload(newIsRTL);
    } else {
      // For iOS or when RTL direction doesn't change, apply immediately
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(newIsRTL);
    }
    
    console.log('[i18n] Language changed successfully to:', language);
  } catch (error) {
    console.error('[i18n] Failed to change language:', error);
    throw error;
  }
};

export default i18n;