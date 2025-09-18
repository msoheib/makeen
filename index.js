import { registerRootComponent } from 'expo';
import { Platform, I18nManager, LogBox } from 'react-native';

// Silence logs in production to improve performance
if (process.env.NODE_ENV === 'production') {
  // Keep error and warn; silence verbose logs
  const noop = () => {};
  // eslint-disable-next-line no-console
  console.log = noop;
  // eslint-disable-next-line no-console
  console.debug = noop;
  // eslint-disable-next-line no-console
  console.info = noop;

  // Ignore common noisy warnings
  try {
    LogBox.ignoreAllLogs(true);
  } catch (_) {
    // no-op
  }
}

// Force RTL configuration immediately for Android before any components load
if (Platform.OS === 'android') {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[Entry] Forcing RTL configuration for Android at app entry...');
  }
  
  // Enable RTL support immediately
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[Entry] Android RTL forced at entry point:', {
      isRTL: I18nManager.isRTL,
      allowRTL: I18nManager.allowRTL,
      platform: Platform.OS,
    });
  }
}

// Ensure proper RTL on web by setting <html dir="rtl" lang="ar">
if (Platform.OS === 'web') {
  try {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
      if (document.body) {
        document.body.style.direction = 'rtl';
        document.body.style.textAlign = 'right';
      }
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[Entry] Web document direction set to RTL and lang=ar');
      }
    }
  } catch (_) {
    // no-op
  }
}

import App from './app/_layout';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
