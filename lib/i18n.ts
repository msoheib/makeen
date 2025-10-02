import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import * as Updates from 'expo-updates';

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

const LANGUAGE_STORAGE_KEY = 'app-language';
const supportedLanguages: SupportedLanguage[] = ['en', 'ar'];

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

// Platform-specific storage key generator
const getPlatformStorageKey = (baseKey: string): string => {
  const platform = Platform.OS;
  return `${baseKey}-${platform}`;
};

const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        return null;
      }
      const platformKey = getPlatformStorageKey(key);
      return await AsyncStorage.getItem(platformKey);
    } catch (error) {
      console.warn('[i18n] Failed to read from storage:', error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        return;
      }
      const platformKey = getPlatformStorageKey(key);
      await AsyncStorage.setItem(platformKey, value);
    } catch (error) {
      console.warn('[i18n] Failed to write to storage:', error);
    }
  },
};

const shouldUseRTL = (language: SupportedLanguage): boolean => language === 'ar';

const setWebDirection = (language: SupportedLanguage) => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = shouldUseRTL(language) ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }
};

const ensureNativeDirection = async (
  language: SupportedLanguage
): Promise<boolean> => {
  const targetRTL = shouldUseRTL(language);

  // Always allow RTL so we can toggle both directions
  I18nManager.allowRTL(true);

  if (Platform.OS === 'web') {
    setWebDirection(language);
    return false;
  }

  const requiresReload = I18nManager.isRTL !== targetRTL;
  I18nManager.forceRTL(targetRTL);

  if (requiresReload) {
    try {
      await Updates.reloadAsync();
      return true;
    } catch (error) {
      console.warn('[i18n] Failed to reload after direction change:', error);
    }
  }

  return false;
};

const detectInitialLanguage = async (): Promise<SupportedLanguage> => {
  // First check if we have a stored language preference
  const stored = await safeStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'en' || stored === 'ar') {
    return stored;
  }

  // Default to English for new users to prevent Arabic showing unexpectedly
  // Only auto-detect Arabic if explicitly set in browser/system preferences
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    // Only use Arabic if the browser language is explicitly Arabic
    if (browserLang.startsWith('ar-') || browserLang === 'ar') {
      return 'ar';
    }
    return 'en';
  }

  // Native fallback - only try on native platforms
  if (Platform.OS !== 'web') {
    try {
      const device = RNLocalize.findBestAvailableLanguage(supportedLanguages);
      if (device?.languageTag?.startsWith('ar-') || device?.languageTag === 'ar') {
        return 'ar';
      }
    } catch (error) {
      console.warn('[i18n] RNLocalize not available, using fallback');
    }
  }

  return 'en';
};

const initializeI18n = async (): Promise<boolean> => {
  const initialLanguage = await detectInitialLanguage();
  const reloaded = await ensureNativeDirection(initialLanguage);
  if (reloaded) {
    return false;
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      supportedLngs: supportedLanguages,
      defaultNS: 'common',
      ns: [
        'common',
        'navigation',
        'dashboard',
        'properties',
        'settings',
        'reports',
        'tenants',
        'maintenance',
        'people',
        'documents',
        'finance',
        'payments',
      ],
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      compatibilityJSON: 'v3',
      returnEmptyString: false,
      returnNull: false,
      debug: false,
    });

  await safeStorage.setItem(LANGUAGE_STORAGE_KEY, initialLanguage);
  setWebDirection(initialLanguage);

  i18n.on('languageChanged', (language) => {
    const normalized = normalizeLanguage(language);
    setWebDirection(normalized);
  });

  return true;
};

const normalizeLanguage = (language: string | undefined | null): SupportedLanguage => {
  if (!language) {
    return 'en';
  }
  return language.startsWith('ar') ? 'ar' : 'en';
};

export const manualInitializeI18n = initializeI18n;

export const getCurrentLanguage = (): SupportedLanguage => {
  return normalizeLanguage(i18n.language as string);
};

export const isRTL = (): boolean => shouldUseRTL(getCurrentLanguage());

export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  const normalized: SupportedLanguage = supportedLanguages.includes(language)
    ? language
    : 'en';

  const current = getCurrentLanguage();
  if (current === normalized) {
    setWebDirection(normalized);
    await safeStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
    return;
  }

  // Store the language preference first
  await safeStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  
  // Then change the i18n language
  await i18n.changeLanguage(normalized);

  const reloaded = await ensureNativeDirection(normalized);
  if (!reloaded) {
    setWebDirection(normalized);
  }
};

// Function to sync store with current i18n language
export const syncStoreWithI18n = async (): Promise<void> => {
  try {
    const currentLang = getCurrentLanguage();
    // This will be called by the store during rehydration
    // to ensure both systems are in sync
    await safeStorage.setItem(LANGUAGE_STORAGE_KEY, currentLang);
  } catch (error) {
    console.warn('[i18n] Failed to sync with store:', error);
  }
};

// Force reset language to English (useful for debugging)
export const resetToEnglish = async (): Promise<void> => {
  await safeStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  await i18n.changeLanguage('en');
  setWebDirection('en');
  
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  }
};

export default i18n;
