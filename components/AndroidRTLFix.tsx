import React, { useEffect, useState } from 'react';
import { Platform, I18nManager, Alert, BackHandler } from 'react-native';
import { androidRTLFix } from '@/lib/rtl';

/**
 * Android RTL Fix Component
 * 
 * This component ensures proper RTL layout on Android devices.
 * It should be rendered early in the app lifecycle to apply RTL fixes.
 */
export const AndroidRTLFix: React.FC = () => {
  const [rtlApplied, setRtlApplied] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      console.log('[AndroidRTLFix] Starting Android RTL configuration...');
      
      try {
        // Check current RTL state
        const currentRTL = I18nManager.isRTL;
        console.log('[AndroidRTLFix] Current RTL state:', {
          isRTL: currentRTL,
          allowRTL: I18nManager.allowRTL,
          platform: Platform.OS,
        });
        
        // Apply the Android RTL fix
        androidRTLFix();
        
        // Force RTL configuration
        I18nManager.allowRTL(true);
        
        // If RTL is not enabled, force it and show restart dialog
        if (!currentRTL) {
          console.log('[AndroidRTLFix] RTL not enabled, forcing RTL and requesting restart...');
          I18nManager.forceRTL(true);
          
          // Show restart dialog for RTL to take full effect
          setTimeout(() => {
            Alert.alert(
              'إعادة تشغيل مطلوبة',
              'لتطبيق التخطيط من اليمين إلى اليسار بشكل كامل، يجب إعادة تشغيل التطبيق.',
              [
                {
                  text: 'إعادة تشغيل الآن',
                  onPress: () => {
                    BackHandler.exitApp();
                  }
                },
                {
                  text: 'لاحقاً',
                  style: 'cancel'
                }
              ]
            );
          }, 1000);
        }
        
        setRtlApplied(true);
        
        // Final RTL state
        console.log('[AndroidRTLFix] RTL configuration complete:', {
          isRTL: I18nManager.isRTL,
          allowRTL: I18nManager.allowRTL,
          applied: true
        });
        
      } catch (error) {
        console.error('[AndroidRTLFix] Error applying RTL fixes:', error);
      }
    }
  }, []);

  // This component doesn't render anything
  return null;
};

export default AndroidRTLFix; 