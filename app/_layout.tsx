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

// Early RTL setup - simplified and consistent
if (Platform.OS === 'android') {
  console.log('[App] Configuring Android RTL at startup...');
  I18nManager.allowRTL(true);
}

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

  // Initialize i18n and RTL
  useEffect(() => {
    const initializeApp = async () => {
      // Wait for i18n to be ready
      if (i18n.isInitialized) {
        setI18nReady(true);
      } else {
        const handleInitialized = () => setI18nReady(true);
        i18n.on('initialized', handleInitialized);
        
        // Cleanup listener
        return () => {
          i18n.off('initialized', handleInitialized);
        };
      }

      // Initialize RTL after i18n is ready
      if (i18n.isInitialized) {
        await initializeRTL();
        console.log('[App] RTL initialization complete:', {
          isRTL: I18nManager.isRTL,
          allowRTL: I18nManager.allowRTL,
          platform: Platform.OS
        });
      }
    };

    initializeApp();
  }, []);

  // Check if everything is ready
  const appReady = frameworkReady && fontsLoaded && i18nReady;

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
        <StatusBar style="auto" />
        <Slot />
      </PaperProvider>
    </SafeAreaProvider>
  );
}