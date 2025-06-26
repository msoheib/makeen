import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { Platform, I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import i18n, { manualInitializeI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import CustomSplashScreen from '@/components/SplashScreen';
import RTLProvider from '@/components/RTLProvider';

// Prevent the splash screen from auto-hiding only on native platforms
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

// CRITICAL: Set RTL IMMEDIATELY on app startup before any UI renders
// This ensures RTL persists across app restarts
const initializeRTLImmediately = () => {
  try {
    console.log('[Layout] 🚀 IMMEDIATE RTL initialization');
    
    // Try to get stored language synchronously if possible
    let storedLanguage = 'ar'; // Default to Arabic
    
    // For web, try localStorage synchronously
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('app-language');
        if (stored === 'en') {
          storedLanguage = 'en';
        }
      } catch (e) {
        console.log('[Layout] Web localStorage not available, using default');
      }
    }
    
    const shouldBeRTL = storedLanguage === 'ar';
    
    console.log('[Layout] 🔧 Setting immediate RTL:', { 
      storedLanguage, 
      shouldBeRTL, 
      platform: Platform.OS 
    });
    
    // Set RTL IMMEDIATELY
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(shouldBeRTL);
    
    console.log('[Layout] ✅ Immediate RTL set:', I18nManager.isRTL);
  } catch (error) {
    console.error('[Layout] ❌ Immediate RTL setup failed:', error);
    // Fallback: Default to RTL for Arabic
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  }
};

// Run RTL initialization IMMEDIATELY
initializeRTLImmediately();

export default function RootLayout() {
  const { settings, isHydrated } = useAppStore();
  const [isI18nReady, setI18nReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        console.log('[Layout] ========== APP PREPARATION START ==========');
        console.log('[Layout] Build type:', __DEV__ ? 'development' : 'production');
        console.log('[Layout] Platform:', Platform.OS);
        console.log('[Layout] Store hydrated:', isHydrated);
        console.log('[Layout] Current settings:', settings);
        console.log('[Layout] Updates available:', Updates.isAvailableAsync ? 'Yes' : 'No');
        
        // This effect should only run once the store has been rehydrated
        if (!isHydrated) {
          console.log('[Layout] ❌ Waiting for store hydration...');
          return;
        }

        // First, initialize i18n properly
        console.log('[Layout] 🔧 Initializing i18n...');
        await manualInitializeI18n();
        
        const currentLanguage = settings?.language || 'ar'; // Default to Arabic
        const isRTL = currentLanguage === 'ar';
        
        // Force RTL direction immediately after i18n initialization
        console.log('[Layout] 🔄 Forcing RTL direction:', { currentLanguage, isRTL });
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(isRTL);
        
        console.log('[Layout] 🌐 Language config:', { 
          currentLanguage, 
          isRTL, 
          nativeIsRTL: I18nManager.isRTL,
          i18nLanguage: i18n.language 
        });

        // Check layout direction (simplified for production compatibility)
        console.log('[Layout] ✅ Layout direction check:', {
          nativeRTL: I18nManager.isRTL,
          desiredRTL: isRTL,
          match: I18nManager.isRTL === isRTL
        });
        
        // Always set as ready since RTL is now applied during i18n initialization
        setI18nReady(true);
        
        console.log('[Layout] ========== APP PREPARATION COMPLETE ==========');
      } catch (e) {
        console.error('[Layout] ❌ Error during app preparation:', e);
        console.error('[Layout] Stack trace:', e.stack);
        // Even if there's an error, we should proceed to avoid getting stuck.
        setI18nReady(true);
      }
    }

    prepare();
  }, [isHydrated, settings?.language]); // Depend on hydration status and language

  useEffect(() => {
    // Hide the splash screen once fonts are loaded AND i18n is ready
    if ((fontsLoaded || fontError) && isI18nReady) {
      console.log('[Layout] All ready, hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isI18nReady]);

  if (!fontsLoaded || !isI18nReady) {
    // Return null or show splash while waiting
    console.log('[Layout] Still loading...', { fontsLoaded, isI18nReady });
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="light" />
          <CustomSplashScreen 
            onFinish={() => {}}
            isInitialized={false}
          />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <RTLProvider>
          <StatusBar style="auto" />
          <Slot />
        </RTLProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}