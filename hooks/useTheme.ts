import { useColorScheme } from 'react-native';
import { useAppStore } from '@/lib/store';
import { lightTheme, darkTheme } from '@/lib/theme';

export interface ThemeContextType {
  theme: typeof lightTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  themeMode: 'light' | 'dark' | 'system';
}

export const useTheme = (): ThemeContextType => {
  const systemColorScheme = useColorScheme();
  const { 
    settings, 
    updateSettings, 
    isDarkMode, 
    toggleDarkMode 
  } = useAppStore();

  // Simplified theme resolution with proper fallbacks
  const getActualTheme = (): 'light' | 'dark' => {
    try {
      // Get theme preference with fallback
      const themePreference = settings?.theme || 'light';
      
      // Handle system theme
      if (themePreference === 'system') {
        return systemColorScheme === 'dark' ? 'dark' : 'light';
      }
      
      // Handle explicit light/dark preference
      return themePreference;
    } catch (error) {
      console.warn('useTheme: Error determining theme, falling back to light:', error);
      return 'light';
    }
  };

  // Get actual theme with error handling
  const actualTheme = getActualTheme();
  const isDark = actualTheme === 'dark';
  
  // Ensure we always return a valid theme object
  const theme = (() => {
    try {
      return isDark ? darkTheme : lightTheme;
    } catch (error) {
      console.warn('useTheme: Error loading theme object, falling back to lightTheme:', error);
      return lightTheme;
    }
  })();

  // Simplified toggle function with proper state synchronization
  const toggleTheme = () => {
    try {
      const newTheme = isDark ? 'light' : 'dark';
      
      // Update both new and legacy state simultaneously
      updateSettings({ theme: newTheme });
      
      // Ensure legacy isDarkMode state is synchronized
      useAppStore.setState({ 
        isDarkMode: newTheme === 'dark',
        theme: newTheme // Update legacy theme state too
      });
      
    } catch (error) {
      console.warn('useTheme: Error toggling theme:', error);
    }
  };

  // Simplified setTheme function with proper state synchronization
  const setTheme = (themeMode: 'light' | 'dark' | 'system') => {
    try {
      // Update settings
      updateSettings({ theme: themeMode });
      
      // Update legacy state for backwards compatibility
      if (themeMode !== 'system') {
        useAppStore.setState({ 
          isDarkMode: themeMode === 'dark',
          theme: themeMode
        });
      } else {
        // For system theme, determine actual theme and update legacy state
        const systemIsDark = systemColorScheme === 'dark';
        useAppStore.setState({ 
          isDarkMode: systemIsDark,
          theme: systemIsDark ? 'dark' : 'light'
        });
      }
    } catch (error) {
      console.warn('useTheme: Error setting theme:', error);
    }
  };

  // Return with proper fallbacks
  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
    themeMode: settings?.theme || 'light',
  };
}; 