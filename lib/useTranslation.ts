import { useTranslation as useI18nextTranslation } from 'react-i18next';
import i18nInstance, { changeLanguage as changeAppLanguage } from './i18n';
import type { TranslationKey, SupportedLanguage } from './translations/types';

// Type-safe translation hook
export const useTranslation = (namespace?: TranslationKey) => {
  const { t, i18n } = useI18nextTranslation(namespace);

  return {
    // Translation function with type safety
    t,
    
    // Current language (default to English when unclear)
    language: (i18n.language as SupportedLanguage) || ('en' as SupportedLanguage),
    
    // Check if current language is RTL
    isRTL: i18n.language === 'ar',
    
    // Change language function (persist + apply RTL)
    changeLanguage: async (lng: SupportedLanguage) => {
      await changeAppLanguage(lng);
    },
    
    // Translation with fallback
    ts: (key: string, fallback: string) => {
      const translation = t(key);
      return translation === key ? fallback : translation;
    },
    
    // i18n instance for advanced usage
    i18n,
  };
};

// Hook for common translations (most frequently used)
export const useCommonTranslation = () => {
  return useTranslation('common');
};

// Specific namespace hooks for convenience
export const useDashboardTranslation = () => {
  return useTranslation('dashboard');
};

export const usePropertiesTranslation = () => {
  return useTranslation('properties');
};

export const useTenantsTranslation = () => {
  return useTranslation('tenants');
};

export const useFinanceTranslation = () => {
  return useTranslation('finance');
};

export const useReportsTranslation = () => {
  return useTranslation('reports');
};

export const useMaintenanceTranslation = () => {
  return useTranslation('maintenance');
};

export const useSettingsTranslation = () => {
  return useTranslation('settings');
};

// Helper functions for RTL detection
export const getCurrentDirection = (language?: SupportedLanguage): 'ltr' | 'rtl' => {
  const currentLang = language || (i18nInstance.language as SupportedLanguage) || 'en';
  return currentLang === 'ar' ? 'rtl' : 'ltr';
};

export const isRTLLanguage = (language?: SupportedLanguage): boolean => {
  const currentLang = language || (i18nInstance.language as SupportedLanguage) || 'en';
  return currentLang === 'ar';
};
