import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { isRTL } from './rtl';

// Compact sizing scale (reduced from original sizes)
const compactSpacing = {
  xs: 2,    // reduced from 4
  sm: 4,    // reduced from 8
  md: 8,    // reduced from 12
  lg: 12,   // reduced from 16
  xl: 16,   // reduced from 24
  '2xl': 20, // reduced from 32
  '3xl': 24, // reduced from 40
  '4xl': 28, // reduced from 48
};

const compactFontSizes = {
  xs: 10,   // reduced from 12
  sm: 12,   // reduced from 14
  md: 14,   // reduced from 16
  lg: 16,   // reduced from 18
  xl: 18,   // reduced from 20
  '2xl': 20, // reduced from 24
  '3xl': 22, // reduced from 28
  '4xl': 24, // reduced from 32
  '5xl': 26, // reduced from 36
};

const compactIconSizes = {
  xs: 12,   // reduced from 16
  sm: 16,   // reduced from 20
  md: 20,   // reduced from 24
  lg: 22,   // reduced from 28
  xl: 24,   // reduced from 32
};

// Extended theme with compact sizing
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976D2',
    primaryContainer: '#E3F2FD',
    secondary: '#424242',
    secondaryContainer: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceVariant: '#F8F9FA',
    background: '#FAFAFA',
    error: '#D32F2F',
    errorContainer: '#FFEBEE',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#212121',
    onSurfaceVariant: '#757575',
    onBackground: '#212121',
    outline: '#E0E0E0',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
  },
  spacing: compactSpacing,
  fontSize: compactFontSizes,
  iconSize: compactIconSizes,
  borderRadius: {
    xs: 2,    // reduced from 4
    sm: 4,    // reduced from 6
    md: 6,    // reduced from 8
    lg: 8,    // reduced from 12
    xl: 12,   // reduced from 16
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, // reduced from 0.1
      shadowRadius: 2,     // reduced from 3
      elevation: 1,        // reduced from 2
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, // reduced from 0.15
      shadowRadius: 3,     // reduced from 5
      elevation: 2,        // reduced from 4
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,  // reduced from 0.2
      shadowRadius: 6,     // reduced from 10
      elevation: 4,        // reduced from 8
    },
  },
  components: {
    card: {
      minHeight: 60,       // reduced from 80
      padding: compactSpacing.md,
      borderRadius: 6,     // reduced from 8
    },
    button: {
      height: 36,          // reduced from 44
      paddingHorizontal: compactSpacing.md,
      borderRadius: 6,     // reduced from 8
    },
    input: {
      height: 40,          // reduced from 48
      paddingHorizontal: compactSpacing.md,
      fontSize: compactFontSizes.md,
      borderRadius: 6,     // reduced from 8
    },
    header: {
      height: 50,          // reduced from 60
      paddingHorizontal: compactSpacing.md,
    },
    listItem: {
      minHeight: 48,       // reduced from 56
      paddingVertical: compactSpacing.sm,
      paddingHorizontal: compactSpacing.md,
    },
    fab: {
      size: 48,            // reduced from 56
      iconSize: compactIconSizes.lg,
    },
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90CAF9',
    primaryContainer: '#1565C0',
    secondary: '#BDBDBD',
    secondaryContainer: '#424242',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    background: '#121212',
    error: '#EF5350',
    errorContainer: '#B71C1C',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#BDBDBD',
    onBackground: '#FFFFFF',
    outline: '#424242',
    success: '#66BB6A',
    warning: '#FFB74D',
    info: '#64B5F6',
  },
  spacing: compactSpacing,
  fontSize: compactFontSizes,
  iconSize: compactIconSizes,
  borderRadius: lightTheme.borderRadius,
  shadows: lightTheme.shadows,
  components: lightTheme.components,
};

// Default theme export for backward compatibility
export const theme = lightTheme;

export { lightTheme, darkTheme };

// RTL-aware styling utilities
export const rtlStyles = {
  row: (isRtl: boolean = isRTL()) => ({
    flexDirection: isRtl ? 'row-reverse' : 'row' as const,
  }),
  textAlign: (isRtl: boolean = isRTL()) => ({
    textAlign: isRtl ? 'right' : 'left' as const,
  }),
  marginStart: (value: number, isRtl: boolean = isRTL()) => ({
    [isRtl ? 'marginRight' : 'marginLeft']: value,
  }),
  marginEnd: (value: number, isRtl: boolean = isRTL()) => ({
    [isRtl ? 'marginLeft' : 'marginRight']: value,
  }),
  paddingStart: (value: number, isRtl: boolean = isRTL()) => ({
    [isRtl ? 'paddingRight' : 'paddingLeft']: value,
  }),
  paddingEnd: (value: number, isRtl: boolean = isRTL()) => ({
    [isRtl ? 'paddingLeft' : 'paddingRight']: value,
  }),
};

export const rtlLayout = {
  row: isRTL() ? 'row-reverse' : 'row',
  textAlign: isRTL() ? 'right' : 'left',
  alignItems: isRTL() ? 'flex-end' : 'flex-start',
} as const;

// Spacing system for backwards compatibility
export const spacing = {
  xs: compactSpacing.xs,
  sm: compactSpacing.sm,
  md: compactSpacing.md,
  lg: compactSpacing.lg,
  xl: compactSpacing.xl,
  xxl: compactSpacing['2xl'],
  xxxl: compactSpacing['3xl'],
  xxxxl: compactSpacing['4xl'],
  s: compactSpacing.sm,
  m: compactSpacing.md,
  l: compactSpacing.lg,
};

// Shadow styles for backwards compatibility
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
};