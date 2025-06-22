import { I18nManager } from 'react-native';
import { useCallback } from 'react';
import { isRTL as getIsRTL } from '@/lib/i18n';

/**
 * Hook for RTL-aware styling and utilities
 */
export const useRTL = () => {
  const isRTL = getIsRTL();

  // Get writing direction
  const getDirection = useCallback(() => {
    return isRTL ? 'rtl' : 'ltr';
  }, [isRTL]);

  // Get flex direction with RTL support
  const getFlexDirection = useCallback((direction: 'row' | 'column' = 'row') => {
    if (direction === 'column') return direction;
    return isRTL ? 'row-reverse' : 'row';
  }, [isRTL]);

  // Get text alignment with RTL support
  const getTextAlign = useCallback((align: 'left' | 'right' | 'center' = 'left') => {
    if (align === 'center') return align;
    if (!isRTL) return align;
    return align === 'left' ? 'right' : 'left';
  }, [isRTL]);

  // Get start position (left in LTR, right in RTL)
  const getStart = useCallback(() => {
    return isRTL ? 'right' : 'left';
  }, [isRTL]);

  // Get end position (right in LTR, left in RTL)
  const getEnd = useCallback(() => {
    return isRTL ? 'left' : 'right';
  }, [isRTL]);

  // Create RTL-aware margin styles
  const getMarginStart = useCallback((value: number) => ({
    [isRTL ? 'marginRight' : 'marginLeft']: value,
  }), [isRTL]);

  const getMarginEnd = useCallback((value: number) => ({
    [isRTL ? 'marginLeft' : 'marginRight']: value,
  }), [isRTL]);

  // Create RTL-aware padding styles
  const getPaddingStart = useCallback((value: number) => ({
    [isRTL ? 'paddingRight' : 'paddingLeft']: value,
  }), [isRTL]);

  const getPaddingEnd = useCallback((value: number) => ({
    [isRTL ? 'paddingLeft' : 'paddingRight']: value,
  }), [isRTL]);

  // Create RTL-aware positioning styles
  const getPositionStart = useCallback((value: number) => ({
    [getStart()]: value,
  }), [getStart]);

  const getPositionEnd = useCallback((value: number) => ({
    [getEnd()]: value,
  }), [getEnd]);

  // Create RTL-aware border styles
  const getBorderStartWidth = useCallback((value: number) => ({
    [isRTL ? 'borderRightWidth' : 'borderLeftWidth']: value,
  }), [isRTL]);

  const getBorderEndWidth = useCallback((value: number) => ({
    [isRTL ? 'borderLeftWidth' : 'borderRightWidth']: value,
  }), [isRTL]);

  return {
    isRTL,
    nativeIsRTL: I18nManager.isRTL,
    direction: getDirection(),
    
    // Utility functions
    getDirection,
    getFlexDirection,
    getTextAlign,
    getStart,
    getEnd,
    
    // Style generators
    getMarginStart,
    getMarginEnd,
    getPaddingStart,
    getPaddingEnd,
    getPositionStart,
    getPositionEnd,
    getBorderStartWidth,
    getBorderEndWidth,
    
    // Common style objects
    styles: {
      rowReverse: { flexDirection: getFlexDirection('row') },
      textStart: { textAlign: getTextAlign('left') },
      textEnd: { textAlign: getTextAlign('right') },
      absoluteStart: { position: 'absolute', ...getPositionStart(0) },
      absoluteEnd: { position: 'absolute', ...getPositionEnd(0) },
    },
  };
};

export default useRTL;