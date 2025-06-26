import React, { useEffect, useState } from 'react';
import { View, I18nManager, Platform } from 'react-native';
import { getCurrentLanguage } from '../lib/i18n';
import { getLocales } from 'expo-localization';

interface RTLProviderProps {
  children: React.ReactNode;
}

/**
 * RTL Provider that ensures proper RTL layout in production builds
 * This component forces RTL layout for Arabic language regardless of environment
 */
export default function RTLProvider({ children }: RTLProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeRTL = async () => {
      try {
        // IMMEDIATE RTL RESTORATION from AsyncStorage
        let storedLanguage = 'ar'; // Default to Arabic
        
        // Try to read stored language from AsyncStorage immediately
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          
          // First try the i18n storage key
          let stored = await AsyncStorage.getItem('app-language');
          
          // If not found, try the Zustand store key
          if (!stored) {
            const storeData = await AsyncStorage.getItem('real-estate-app-storage');
            if (storeData) {
              const parsedStore = JSON.parse(storeData);
              stored = parsedStore?.state?.settings?.language || parsedStore?.state?.locale;
            }
          }
          
          if (stored === 'en') {
            storedLanguage = 'en';
          }
          console.log('[RTLProvider] 📦 Restored language from storage:', stored || 'none (using default)');
        } catch (storageError) {
          console.log('[RTLProvider] ⚠️ Storage read failed, using default:', storageError);
        }
        
        const shouldBeRTL = storedLanguage === 'ar';
        
        console.log('[RTLProvider] 🔧 Initializing RTL:', {
          storedLanguage,
          shouldBeRTL,
          currentRTL: I18nManager.isRTL,
          platform: Platform.OS,
          isDev: __DEV__
        });

        // IMMEDIATE RTL SETUP
        const forceRTLSetup = () => {
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(shouldBeRTL);
        };

        // Initial setup
        forceRTLSetup();

        // For all platforms, apply multiple RTL corrections to ensure persistence
        console.log('[RTLProvider] Applying aggressive RTL configuration...');
        
        // Multiple immediate attempts
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            forceRTLSetup();
            console.log(`[RTLProvider] RTL correction ${i + 1}/5, state:`, I18nManager.isRTL);
          }, i * 50); // 0ms, 50ms, 100ms, 150ms, 200ms
        }
        
        // Monitor and correct RTL state for the first few seconds
        const intervalId = setInterval(() => {
          if (I18nManager.isRTL !== shouldBeRTL) {
            console.log('[RTLProvider] 🔄 RTL mismatch detected, correcting...', {
              expected: shouldBeRTL,
              current: I18nManager.isRTL
            });
            forceRTLSetup();
          }
        }, 200);
        
        // Stop monitoring after 3 seconds
        setTimeout(() => {
          clearInterval(intervalId);
          console.log('[RTLProvider] ✅ RTL monitoring complete, final state:', I18nManager.isRTL);
        }, 3000);

        setIsReady(true);
        
      } catch (error) {
        console.error('[RTLProvider] ❌ Error initializing RTL:', error);
        // Fallback: Set RTL for Arabic
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
        setIsReady(true);
      }
    };

    initializeRTL();
  }, []);

  // Apply RTL styles to the container using expo-localization
  const locales = getLocales();
  const deviceTextDirection = locales[0]?.textDirection || 'ltr';
  const effectiveDirection = I18nManager.isRTL ? 'rtl' : 'ltr';
  
  const containerStyle = {
    flex: 1,
    direction: effectiveDirection,
    ...(Platform.OS === 'web' && {
      // For web, use expo-localization textDirection as recommended
      dir: effectiveDirection,
    })
  };

  if (!isReady) {
    // Return a simple view while RTL is being configured
    return <View style={{ flex: 1 }} />;
  }

  return <View style={containerStyle}>{children}</View>;
}