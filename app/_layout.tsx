import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from '@/lib/theme';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import i18n from '@/lib/i18n'; // Initialize i18n
import { initializeRTL } from '@/lib/rtl';
import 'react-native-gesture-handler';

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
    const initI18n = async () => {
      try {
        // Check if i18next is already initialized
        if (i18n.isInitialized) {
          setI18nReady(true);
        } else {
          // Wait a short time for initialization to complete
          setTimeout(() => {
            if (i18n.isInitialized) {
              setI18nReady(true);
            } else {
              // Force ready state to prevent infinite loading
              console.warn('i18n not initialized within expected time, proceeding anyway');
              setI18nReady(true);
            }
          }, 500);
        }
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        // Fallback: assume ready to prevent infinite loading
        setI18nReady(true);
      }
    };
    
    initI18n();
  }, []);

  // Check if everything is ready
  const appReady = frameworkReady && fontsLoaded && i18nReady;

  useEffect(() => {
    if (appReady) {
      // Hide the splash screen once everything is ready
      if (Platform.OS !== 'web') {
        SplashScreen.hideAsync();
      }
    }
  }, [appReady]);

  // Don't render the app until everything is ready
  if (!appReady) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
        <Stack.Screen name="(drawer)" options={{ animation: 'fade' }} />
        <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
      </Stack>
    </PaperProvider>
  );
}