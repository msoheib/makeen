import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { Platform } from 'react-native';

const fontConfig = {
  fontFamily: 'Inter-Regular',
  headingFontFamily: 'Inter-Bold',
};

// Font configuration
export const fonts = configureFonts({
  config: {
    ...Platform.select({
      web: {
        regular: {
          fontFamily: fontConfig.fontFamily,
          fontWeight: '400' as const,
        },
        medium: {
          fontFamily: fontConfig.fontFamily,
          fontWeight: '500' as const,
        },
        bold: {
          fontFamily: fontConfig.headingFontFamily,
          fontWeight: '700' as const,
        },
      },
      default: {
        regular: {
          fontFamily: fontConfig.fontFamily,
          fontWeight: '400' as const,
        },
        medium: {
          fontFamily: fontConfig.fontFamily,
          fontWeight: '500' as const,
        },
        bold: {
          fontFamily: fontConfig.headingFontFamily,
          fontWeight: '700' as const,
        },
      },
    }),
  },
});

// Custom theme with our colors
export const theme = {
  ...MD3LightTheme,
  fonts: fonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4F46E5', // Indigo
    primaryContainer: '#EEF2FF',
    secondary: '#0D9488', // Teal
    secondaryContainer: '#CCFBF1',
    tertiary: '#F59E0B', // Gold
    tertiaryContainer: '#FEF3C7',
    error: '#DC2626',
    errorContainer: '#FEE2E2',
    success: '#10B981',
    successContainer: '#D1FAE5',
    warning: '#F59E0B',
    warningContainer: '#FEF3C7',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#F3F4F6',
    onSurface: '#1F2937',
    onSurfaceVariant: '#4B5563',
    outline: '#E5E7EB',
  },
  roundness: 12,
  animation: {
    scale: 1.0,
  },
};

// Spacing system
export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

// Shadow styles
export const shadows = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
    web: {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
  }),
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
    web: {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
  }),
};