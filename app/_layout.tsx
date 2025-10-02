import 'react-native-gesture-handler';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
} from '@expo-google-fonts/cairo';
import * as SplashScreen from 'expo-splash-screen';

import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { manualInitializeI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import CustomSplashScreen from '@/components/SplashScreen';
import RTLProvider from '@/components/RTLProvider';
import LanguageDebugger from '@/components/LanguageDebugger';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {
    // Splash screen prevention can fail in dev reloads; ignore.
  });
}

export default function RootLayout() {
  const { isHydrated } = useAppStore();
  const { theme, isDark } = useAppTheme();
  const [isI18nReady, setI18nReady] = useState(false);
  const [showLanguageDebugger, setShowLanguageDebugger] = useState(false);
  const hasInitialized = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  // Keyboard shortcut for language debugger (Ctrl+Shift+L)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        setShowLanguageDebugger(true);
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    (async () => {
      try {
        const ready = await manualInitializeI18n();
        setI18nReady(ready);
      } catch (error) {
        console.warn('[Layout] Failed to initialize i18n', error);
        // Set a fallback language for web
        if (Platform.OS === 'web') {
          try {
            // Initialize with basic fallback
            const { i18n } = await import('i18next');
            await i18n.init({
              lng: 'en',
              fallbackLng: 'en',
              resources: {
                en: { translation: {} },
                ar: { translation: {} }
              }
            });
          } catch (fallbackError) {
            console.warn('[Layout] Fallback i18n init failed', fallbackError);
          }
        }
        setI18nReady(true);
      }
    })();
  }, [isHydrated]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isI18nReady) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore hide errors caused by rapid reloads
      });
    }
  }, [fontsLoaded, fontError, isI18nReady]);

  if (!fontsLoaded || !isI18nReady) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <CustomSplashScreen onFinish={() => {}} isInitialized={false} />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <RTLProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Slot />
          <LanguageDebugger 
            visible={showLanguageDebugger} 
            onClose={() => setShowLanguageDebugger(false)} 
          />
        </RTLProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
