import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { Platform, I18nManager } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import i18n from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import CustomSplashScreen from '@/components/SplashScreen';

// Prevent the splash screen from auto-hiding only on native platforms
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

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
        console.log('[Layout] Starting app preparation...');
        console.log('[Layout] Store hydrated:', isHydrated);
        console.log('[Layout] Current settings:', settings);
        
        // This effect should only run once the store has been rehydrated
        if (!isHydrated) {
          console.log('[Layout] Waiting for store hydration...');
          return;
        }

        const currentLanguage = settings?.language || 'ar'; // Default to Arabic
        const isRTL = currentLanguage === 'ar';
        
        console.log('[Layout] Language config:', { currentLanguage, isRTL, nativeIsRTL: I18nManager.isRTL });

        // Set the i18next language
        await i18n.changeLanguage(currentLanguage);
        console.log('[Layout] i18n language set to:', currentLanguage);

        // Check if layout direction needs to be changed
        if (I18nManager.isRTL !== isRTL) {
          console.log('[Layout] Layout direction mismatch detected. Native:', I18nManager.isRTL, 'Desired:', isRTL);
          
          // Apply the RTL change and reload the app.
          // This will cause a flicker on the first run after a language change.
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(isRTL);
          
          console.log('[Layout] Reloading app to apply RTL changes...');
          await Updates.reloadAsync();
        } else {
          // If the direction is already correct, we're ready to show the app.
          console.log('[Layout] Layout direction is correct, app ready');
          setI18nReady(true);
        }
      } catch (e) {
        console.warn('[Layout] Error during app preparation:', e);
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
        <StatusBar style="auto" />
        <Slot />
      </PaperProvider>
    </SafeAreaProvider>
  );
}