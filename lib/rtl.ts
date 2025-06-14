import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLanguage, changeLanguage, isRTL } from './i18n';
import type { SupportedLanguage } from './translations/types';

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'user_language';

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

// Apply RTL layout to the app
export const applyRTL = (isRTLLanguage: boolean): void => {
  if (I18nManager.isRTL !== isRTLLanguage) {
    I18nManager.allowRTL(isRTLLanguage);
    I18nManager.forceRTL(isRTLLanguage);
  }
};

// Initialize RTL based on current language
export const initializeRTL = async (): Promise<void> => {
  try {
    const savedLanguage = await safeStorage.getItem(LANGUAGE_STORAGE_KEY);
    const currentLang = getCurrentLanguage();
    
    // Use saved language if available, otherwise use device language
    const language: SupportedLanguage = (savedLanguage as SupportedLanguage) || currentLang;
    
    // Apply the language
    if (language !== currentLang) {
      await changeLanguage(language);
    }
    
    // Apply RTL layout
    const isRTLLang = language === 'ar';
    applyRTL(isRTLLang);
    
    console.log(`RTL initialized: Language=${language}, RTL=${isRTLLang}, I18nManager.isRTL=${I18nManager.isRTL}`);
  } catch (error) {
    console.error('Error initializing RTL:', error);
  }
};

// Change language and update RTL layout
export const switchLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    // Save language preference
    await safeStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    
    // Change language in i18n
    await changeLanguage(language);
    
    // Apply RTL layout
    const isRTLLang = language === 'ar';
    applyRTL(isRTLLang);
    
    console.log(`Language switched to: ${language}, RTL: ${isRTLLang}`);
  } catch (error) {
    console.error('Error switching language:', error);
    throw error;
  }
};

// Get saved language from storage
export const getSavedLanguage = async (): Promise<SupportedLanguage | null> => {
  try {
    const savedLanguage = await safeStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage as SupportedLanguage;
  } catch (error) {
    console.error('Error getting saved language:', error);
    return null;
  }
};

// Check if app restart is needed for RTL changes
export const needsRestart = (newLanguage: SupportedLanguage): boolean => {
  const currentIsRTL = I18nManager.isRTL;
  const newIsRTL = newLanguage === 'ar';
  return currentIsRTL !== newIsRTL;
};

// Helper function to get direction for styles
export const getDirection = (): 'ltr' | 'rtl' => {
  return isRTL() ? 'rtl' : 'ltr';
};

// Helper function to flip start/end properties for RTL
export const getFlexDirection = (direction: 'row' | 'column' = 'row'): 'row' | 'row-reverse' | 'column' | 'column-reverse' => {
  if (direction === 'column') return direction;
  return isRTL() ? 'row-reverse' : 'row';
};

// Helper for text alignment
export const getTextAlign = (align: 'left' | 'right' | 'center' = 'left'): 'left' | 'right' | 'center' => {
  if (align === 'center') return align;
  if (!isRTL()) return align;
  return align === 'left' ? 'right' : 'left';
};

// Helper for positioning (start/end)
export const getStart = (): 'left' | 'right' => {
  return isRTL() ? 'right' : 'left';
};

export const getEnd = (): 'left' | 'right' => {
  return isRTL() ? 'left' : 'right';
};

// Re-export isRTL so other modules can import it directly from this file
export { isRTL }; 