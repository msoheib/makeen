import { registerRootComponent } from 'expo';
import { Platform, I18nManager } from 'react-native';

// Force RTL configuration immediately for Android before any components load
if (Platform.OS === 'android') {
  console.log('[Entry] Forcing RTL configuration for Android at app entry...');
  
  // Enable RTL support immediately
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  
  console.log('[Entry] Android RTL forced at entry point:', {
    isRTL: I18nManager.isRTL,
    allowRTL: I18nManager.allowRTL,
    platform: Platform.OS
  });
}

import App from './app/_layout';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);