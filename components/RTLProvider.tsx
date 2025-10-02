import React, { useEffect, useMemo } from 'react';
import { View, Platform } from 'react-native';
import { useTranslation } from '@/lib/useTranslation';

interface RTLProviderProps {
  children: React.ReactNode;
}

export default function RTLProvider({ children }: RTLProviderProps) {
  // Call hooks at the top level
  const { isRTL } = useTranslation();
  
  const direction = useMemo(() => {
    // Use the hook result directly
    if (isRTL) return 'rtl';
    
    // Fallback to stored language or browser language
    if (typeof window !== 'undefined') {
      const stored = localStorage?.getItem('app-language');
      if (stored === 'ar') return 'rtl';
      if (stored === 'en') return 'ltr';
      
      // Check browser language
      const browserLang = navigator.language || navigator.languages?.[0] || 'en';
      return browserLang.startsWith('ar') ? 'rtl' : 'ltr';
    }
    
    return 'ltr';
  }, [isRTL]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.dir = direction;
    }
  }, [direction]);

  return (
    <View style={{ flex: 1, writingDirection: direction }}>
      {children}
    </View>
  );
}
