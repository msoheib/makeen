import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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
import buildingsEn from './translations/en/buildings.json';
import profileEn from './translations/en/profile.json';

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
import buildingsAr from './translations/ar/buildings.json';
import profileAr from './translations/ar/profile.json';

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
    buildings: buildingsEn,
    profile: profileEn,
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
    buildings: buildingsAr,
    profile: profileAr,
  },
};

const shouldUseRTL = (language: SupportedLanguage): boolean => language === 'ar';

const setWebDirection = (language: SupportedLanguage) => {
  if (typeof document !== 'undefined') {
    const direction = shouldUseRTL(language) ? 'rtl' : 'ltr';

    // Set direction on html and body elements
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    document.documentElement.setAttribute('lang', language);

    if (document.body) {
      document.body.dir = direction;
    }

    // Force CSS direction to prevent override
    const style = document.getElementById('i18n-direction-style');
    if (style) {
      style.remove();
    }

    const newStyle = document.createElement('style');
    newStyle.id = 'i18n-direction-style';
    newStyle.textContent = `
      html, body {
        direction: ${direction} !important;
      }
    `;
    document.head.appendChild(newStyle);
  }
};

const detectInitialLanguage = (): SupportedLanguage => {
  console.log('[i18n] Starting language detection...');

  // First check localStorage
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    console.log(`[i18n] Stored language preference:`, stored);

    if (stored === 'en' || stored === 'ar') {
      console.log(`[i18n] Using stored language: ${stored}`);
      return stored;
    }
  }

  console.log('[i18n] No stored language found, detecting from browser...');

  // Check for Arabic preference in browser
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || 'en';
    console.log(`[i18n] Browser language:`, browserLang);

    if (browserLang.startsWith('ar-') || browserLang === 'ar') {
      console.log(`[i18n] Detected Arabic from browser: ${browserLang}`);
      return 'ar';
    }
  }

  // Default to Arabic (as this is an Arabic-first app)
  console.log('[i18n] Defaulting to Arabic');
  return 'ar';
};

const initializeI18n = async (): Promise<boolean> => {
  const initialLanguage = detectInitialLanguage();

  await i18n
    .use(LanguageDetector)
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
        'buildings',
        'profile',
      ],
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      },
      returnEmptyString: false,
      returnNull: false,
      debug: false,
    });

  setWebDirection(initialLanguage);

  i18n.on('languageChanged', (language) => {
    const normalized = normalizeLanguage(language);
    setWebDirection(normalized);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
    }
  });

  return true;
};

const normalizeLanguage = (language: string | undefined | null): SupportedLanguage => {
  if (!language) {
    return 'ar';
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
    : 'ar';

  console.log(`[i18n] Changing language to: ${normalized}`);

  const current = getCurrentLanguage();
  if (current === normalized) {
    console.log(`[i18n] Language already set to ${normalized}, applying direction...`);
    setWebDirection(normalized);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
    }
    return;
  }

  try {
    // Store the language preference first
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
      console.log(`[i18n] Language preference saved: ${normalized}`);
    }

    // Then change the i18n language
    await i18n.changeLanguage(normalized);
    console.log(`[i18n] i18n language changed to: ${normalized}`);

    // Apply direction changes
    setWebDirection(normalized);
    console.log(`[i18n] Web direction set to: ${shouldUseRTL(normalized) ? 'RTL' : 'LTR'}`);
  } catch (error) {
    console.error('[i18n] Error changing language:', error);
    throw error;
  }
};

// Function to sync store with current i18n language
export const syncStoreWithI18n = async (): Promise<void> => {
  try {
    const currentLang = getCurrentLanguage();
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLang);
    }
  } catch (error) {
    console.warn('[i18n] Failed to sync with store:', error);
  }
};

// Force reset language to English (useful for debugging)
export const resetToEnglish = async (): Promise<void> => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  }
  await i18n.changeLanguage('en');
  setWebDirection('en');

  if (typeof document !== 'undefined') {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  }
};

// Initialize i18n immediately when module is imported
initializeI18n().catch((error) => {
  console.error('[i18n] Failed to initialize:', error);
});

export default i18n;
