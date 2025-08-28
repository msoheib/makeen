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
  const { settings, updateSettings } = useAppStore();

  // Determine the actual theme based on settings
  const getActualTheme = () => {
    if (settings?.theme === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return settings?.theme || 'light';
  };

  const actualTheme = getActualTheme();
  const isDark = actualTheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
    // keep legacy flag in sync for old components
    useAppStore.setState({ isDarkMode: newTheme === 'dark' });
  };

  const setTheme = (themeMode: 'light' | 'dark' | 'system') => {
    updateSettings({ theme: themeMode });
    if (themeMode !== 'system') {
      // Update the legacy isDarkMode state for backwards compatibility
      useAppStore.setState({ isDarkMode: themeMode === 'dark' });
    }
  };

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
    themeMode: settings?.theme || 'light',
  };
}; 