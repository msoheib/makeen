import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { Platform, I18nManager } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import i18n from '@/lib/i18n'; // Initialize i18n
import { initializeRTL } from '@/lib/rtl';
import CustomSplashScreen from '@/components/SplashScreen';
import AndroidRTLFix from '@/components/AndroidRTLFix';

// Enable RTL support immediately for Android - must be done before any components render
if (Platform.OS === 'android') {
  console.log('[App] Configuring Android RTL at app startup...');
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true); // Force RTL for Arabic app
  console.log('[App] Android RTL configured:', {
    isRTL: I18nManager.isRTL,
    allowRTL: I18nManager.allowRTL
  });
}

// Initialize RTL support
initializeRTL();

// Prevent the splash screen from auto-hiding only on native platforms
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const { ready: frameworkReady } = useFrameworkReady();
  const [i18nReady, setI18nReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  // Load fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  // Initialize i18n
  useEffect(() => {
    if (i18n.isInitialized) {
      setI18nReady(true);
    } else {
      const handleInitialized = () => setI18nReady(true);
      i18n.on('initialized', handleInitialized);
      return () => {
        i18n.off('initialized', handleInitialized);
      };
    }
  }, []);

  // Check if everything is ready
  const appReady = frameworkReady && fontsLoaded && i18nReady;

  // Additional RTL verification for Android
  useEffect(() => {
    if (Platform.OS === 'android' && appReady) {
      console.log('[App] Verifying RTL configuration:', {
        isRTL: I18nManager.isRTL,
        allowRTL: I18nManager.allowRTL,
        platform: Platform.OS
      });
      
      // If RTL is still not enabled on Android, force it again
      if (!I18nManager.isRTL) {
        console.log('[App] RTL not detected, forcing RTL configuration...');
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
      }
    }
  }, [appReady]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Show custom splash screen while app is initializing or when explicitly shown
  if (!appReady || showSplash) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="light" />
          <CustomSplashScreen 
            onFinish={handleSplashFinish}
            isInitialized={appReady}
          />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AndroidRTLFix />
        <StatusBar style="auto" />
        <Slot />
      </PaperProvider>
    </SafeAreaProvider>
  );
}