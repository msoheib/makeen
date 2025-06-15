import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from '@/lib/theme';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import i18n from '@/lib/i18n'; // Initialize i18n
import { initializeRTL } from '@/lib/rtl';

// Initialize RTL support
initializeRTL();

// Prevent the splash screen from auto-hiding only on native platforms
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const { ready: frameworkReady } = useFrameworkReady();
  const [i18nReady, setI18nReady] = useState(false);
  
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

  useEffect(() => {
    if (appReady && Platform.OS !== 'web') {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  // Don't render the app until everything is ready
  if (!appReady) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="auto" />
      <Slot />
    </PaperProvider>
  );
}