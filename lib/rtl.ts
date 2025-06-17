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

// Apply RTL layout to the app with Android-specific handling
export const applyRTL = (isRTLLanguage: boolean): void => {
  try {
    console.log(`[RTL] Applying RTL configuration: isRTLLanguage=${isRTLLanguage}, Platform=${Platform.OS}`);
    
    // Always allow RTL first
    I18nManager.allowRTL(true);
    
    // For Android, we need to be more aggressive with RTL configuration
    if (Platform.OS === 'android') {
      // Force RTL for Arabic regardless of current state
      if (isRTLLanguage) {
        I18nManager.forceRTL(true);
        console.log('[RTL] Android: Forced RTL enabled');
      } else {
        I18nManager.forceRTL(false);
        console.log('[RTL] Android: Forced RTL disabled');
      }
    } else {
      // For other platforms, only change if needed
      if (I18nManager.isRTL !== isRTLLanguage) {
        I18nManager.forceRTL(isRTLLanguage);
        console.log(`[RTL] ${Platform.OS}: RTL state changed to ${isRTLLanguage}`);
      }
    }
    
    console.log(`[RTL] Final state: I18nManager.isRTL=${I18nManager.isRTL}, allowRTL=${I18nManager.allowRTL}`);
  } catch (error) {
    console.error('[RTL] Error applying RTL configuration:', error);
  }
};

// Initialize RTL based on current language with early Android setup
export const initializeRTL = async (): Promise<void> => {
  try {
    console.log('[RTL] Starting RTL initialization...');
    
    // For Android, set up RTL immediately for Arabic
    if (Platform.OS === 'android') {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true); // Default to RTL for Arabic app
      console.log('[RTL] Android: Early RTL setup completed');
    }
    
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
    
    console.log(`[RTL] Initialization complete: Language=${language}, RTL=${isRTLLang}, I18nManager.isRTL=${I18nManager.isRTL}`);
  } catch (error) {
    console.error('[RTL] Error initializing RTL:', error);
  }
};

// Change language and update RTL layout
export const switchLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    console.log(`[RTL] Switching language to: ${language}`);
    
    // Save language preference
    await safeStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    
    // Change language in i18n
    await changeLanguage(language);
    
    // Apply RTL layout
    const isRTLLang = language === 'ar';
    applyRTL(isRTLLang);
    
    console.log(`[RTL] Language switch complete: ${language}, RTL: ${isRTLLang}`);
    
    // For Android, recommend app restart for full RTL effect
    if (Platform.OS === 'android') {
      console.log('[RTL] Android: Consider restarting app for complete RTL layout changes');
    }
  } catch (error) {
    console.error('[RTL] Error switching language:', error);
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
  
  // Android always benefits from restart for RTL changes
  if (Platform.OS === 'android' && currentIsRTL !== newIsRTL) {
    return true;
  }
  
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

export const rtlStyles = {
  row: (direction: 'row' | 'column' = 'row') => ({
    flexDirection: getFlexDirection(direction),
  }),
  rowReverse: (direction: 'row' | 'column' = 'row') => ({
    flexDirection: getFlexDirection(direction) === 'row' ? 'row-reverse' : 'row',
  }),
  textAlign: (align: 'left' | 'right' | 'center' = 'left') => ({
    textAlign: getTextAlign(align),
  }),
  start: {
    [getStart()]: 0,
  },
  end: {
    [getEnd()]: 0,
  },
  marginLeft: (value: number) => ({
    [isRTL() ? 'marginRight' : 'marginLeft']: value,
  }),
  marginRight: (value: number) => ({
    [isRTL() ? 'marginLeft' : 'marginRight']: value,
  }),
  paddingLeft: (value: number) => ({
    [isRTL() ? 'paddingRight' : 'paddingLeft']: value,
  }),
  paddingRight: (value: number) => ({
    [isRTL() ? 'paddingLeft' : 'paddingRight']: value,
  }),
  marginStart: (value: number) => ({
    [getStart()]: value,
  }),
  marginEnd: (value: number) => ({
    [getEnd()]: value,
  }),
};

// Android-specific RTL utilities
export const androidRTLFix = () => {
  if (Platform.OS === 'android') {
    // Ensure RTL is properly configured for Android
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    console.log('[RTL] Android RTL fix applied');
  }
};

// Re-export isRTL so other modules can import it directly from this file
export { isRTL }; 