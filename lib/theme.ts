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

// Exact color palette from LandlordStudio
export const theme = {
  ...MD3LightTheme,
  fonts: fonts,
  colors: {
    ...MD3LightTheme.colors,
    // Primary brand colors from the screenshot
    primary: '#2B5CE6', // Blue from the logo and active elements
    primaryContainer: '#E8F0FF',
    secondary: '#4ECDC4', // Teal from the logo
    secondaryContainer: '#E0FFF8',
    tertiary: '#FF6B6B', // Red for outstanding amounts
    tertiaryContainer: '#FFE8E8',
    error: '#FF4757',
    errorContainer: '#FFE8EA',
    success: '#2ED573',
    successContainer: '#E8F8F0',
    warning: '#FFA726',
    warningContainer: '#FFF3E0',
    
    // Background colors matching the app
    background: '#F8FAFC', // Light gray background
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    onSurface: '#1E293B', // Dark navy text
    onSurfaceVariant: '#64748B', // Gray text
    outline: '#E2E8F0',
    outlineVariant: '#F1F5F9',
    
    // Custom colors for the modern design
    cardBackground: '#FFFFFF',
    gradientStart: '#2B5CE6',
    gradientEnd: '#4ECDC4',
    income: '#2ED573',
    expense: '#FF6B6B',
    neutral: '#64748B',
    
    // Tab bar colors
    tabBarActive: '#2B5CE6',
    tabBarInactive: '#64748B',
    tabBarBackground: '#1E293B', // Dark navy from bottom
  },
  roundness: 16,
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
  xxxl: 64,
};

// Shadow styles with modern elevation
export const shadows = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
    web: {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
    web: {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
    },
  }),
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
    },
    android: {
      elevation: 12,
    },
    web: {
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
    },
  }),
};

// Typography scale
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
};