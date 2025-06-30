import { I18nManager, Platform } from 'react-native';
import { changeLanguage, isRTL, SupportedLanguage } from './i18n';

/**
 * Applies the RTL layout direction natively.
 * @param isRTLLanguage - Whether the language requires RTL layout.
 */
export const applyRTL = (isRTLLanguage: boolean): void => {
  try {
    console.log(`[RTL] Applying RTL config: isRTLLanguage=${isRTLLanguage}, Platform=${Platform.OS}`);
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(isRTLLanguage);
    console.log(`[RTL] Final state: I18nManager.isRTL=${I18nManager.isRTL}`);
  } catch (error) {
    console.error('[RTL] Error applying RTL configuration:', error);
  }
};

/**
 * Changes the app's language with immediate RTL application.
 * @param language - The new language to switch to.
 */
export const switchLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    console.log(`[RTL] Switching to language: ${language}`);
    
    // Use the centralized language change function from i18n.ts
    await changeLanguage(language);
    
    console.log('[RTL] Language switched successfully');
  } catch (error) {
    console.error('[RTL] Error switching language:', error);
    throw error;
  }
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

// Enhanced RTL styles with consistent behavior across platforms
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
  textAlignStart: {
    textAlign: isRTL() ? 'right' : 'left' as const,
  },
  textAlignEnd: {
    textAlign: isRTL() ? 'left' : 'right' as const,
  },
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
  marginStart: (value: number) => ({
    [isRTL() ? 'marginRight' : 'marginLeft']: value,
  }),
  marginEnd: (value: number) => ({
    [isRTL() ? 'marginLeft' : 'marginRight']: value,
  }),
  paddingLeft: (value: number) => ({
    [isRTL() ? 'paddingRight' : 'paddingLeft']: value,
  }),
  paddingRight: (value: number) => ({
    [isRTL() ? 'paddingLeft' : 'paddingRight']: value,
  }),
  paddingStart: (value: number) => ({
    [isRTL() ? 'paddingRight' : 'paddingLeft']: value,
  }),
  paddingEnd: (value: number) => ({
    [isRTL() ? 'paddingLeft' : 'paddingRight']: value,
  }),
  justifyContentStart: {
    justifyContent: isRTL() ? 'flex-end' : 'flex-start' as const,
  },
  justifyContentEnd: {
    justifyContent: isRTL() ? 'flex-start' : 'flex-end' as const,
  },
  alignItemsStart: {
    alignItems: isRTL() ? 'flex-end' : 'flex-start' as const,
  },
  alignItemsEnd: {
    alignItems: isRTL() ? 'flex-start' : 'flex-end' as const,
  },
  borderLeftWidth: (value: number) => ({
    [isRTL() ? 'borderRightWidth' : 'borderLeftWidth']: value,
  }),
  borderRightWidth: (value: number) => ({
    [isRTL() ? 'borderLeftWidth' : 'borderRightWidth']: value,
  }),
  borderStartWidth: (value: number) => ({
    [isRTL() ? 'borderRightWidth' : 'borderLeftWidth']: value,
  }),
  borderEndWidth: (value: number) => ({
    [isRTL() ? 'borderLeftWidth' : 'borderRightWidth']: value,
  }),
};

// Platform-specific styles for RTL
export const platformRTLStyles = Platform.select({
  android: {
    writingDirection: isRTL() ? 'rtl' : 'ltr' as const,
  },
  ios: {
    writingDirection: isRTL() ? 'rtl' : 'ltr' as const,
  },
  default: {},
});

// Android-specific RTL fixes
export const androidRTLFix = () => {
  if (Platform.OS === 'android') {
    return {
      direction: isRTL() ? 'rtl' : 'ltr' as const,
    };
  }
  return {};
}; 