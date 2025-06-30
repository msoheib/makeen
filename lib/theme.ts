import { MD3LightTheme } from 'react-native-paper';
import { isRTL } from './i18n';

// Define light colors with purple theme
export const lightColors = {
  primary: '#4C2661', // Primary Purple
  onPrimary: '#FFFFFF',
  primaryContainer: '#E8D5F0', // Light purple container
  onPrimaryContainer: '#2A1436', // Dark purple text
  secondary: '#6B4C93', // Secondary purple
  onSecondary: '#FFFFFF',
  secondaryContainer: '#F0E8F7', // Very light purple container
  onSecondaryContainer: '#3A2452',
  tertiary: '#8E6BA8', // Lighter purple tertiary
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#F4EFFF',
  onTertiaryContainer: '#4A3860',
  error: '#D32F2F',
  onError: '#FFFFFF',
  errorContainer: '#FFCDD2',
  onErrorContainer: '#B71C1C',
  // Additional semantic colors
  success: '#4CAF50',
  onSuccess: '#FFFFFF',
  successContainer: '#C8E6C9',
  onSuccessContainer: '#2E7D32',
  warning: '#FF9800',
  onWarning: '#FFFFFF', 
  warningContainer: '#FFE0B2',
  onWarningContainer: '#E65100',
  notification: '#4C2661',
  // Tab bar colors (fixing broken references)
  tabBarActive: '#4C2661',
  tabBarInactive: '#A892B8',
  tabBarBackground: '#F8F5FA',
  background: '#FAFAFA',
  onBackground: '#1C1B1F',
  surface: '#FFFFFF',
  onSurface: '#1C1B1F',
  surfaceVariant: '#F5F5F5',
  onSurfaceVariant: '#49454F',
  outline: '#E0E0E0',
  outlineVariant: '#F0F0F0',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#313033',
  inverseOnSurface: '#F4EFF4',
  inversePrimary: '#B388D1', // Light purple for inverse elements
  elevation: {
    level0: 'transparent',
    level1: '#FFFFFF',
    level2: '#F8F9FA',
    level3: '#F1F3F4',
    level4: '#E8EAED',
    level5: '#E1E3E6',
  },
};

// Light theme (Material Design 3)
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
};

// Use light theme as the only theme (remove dark mode)
export const theme = lightTheme;

// For backwards compatibility, export the same theme as both light and dark
export const darkTheme = lightTheme;

// Spacing and sizing constants
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  // Add missing mappings for backwards compatibility
  s: 8,  // same as sm
  m: 16, // same as md
  l: 24, // same as lg
};

// Compact spacing for tighter layouts
export const compactSpacing = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 20,
  '4xl': 24,
};

export const borderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 24,
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Card styles
export const cardStyles = {
  elevation: 2,
  borderRadius: borderRadius.medium,
  backgroundColor: lightColors.surface,
  shadowColor: lightColors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
};

// Button styles
export const buttonStyles = {
  borderRadius: borderRadius.medium,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
};

// Input styles
export const inputStyles = {
  borderRadius: borderRadius.small,
  borderWidth: 1,
  borderColor: lightColors.outline,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
};

export default theme;

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

// Make rtlLayout a function to avoid calling isRTL at module initialization
export const rtlLayout = () => ({
  row: isRTL() ? 'row-reverse' : 'row',
  textAlign: isRTL() ? 'right' : 'left',
  alignItems: isRTL() ? 'flex-end' : 'flex-start',
} as const);

// Spacing system for backwards compatibility
export const spacingCompact = {
  xs: compactSpacing.xs,
  sm: compactSpacing.sm,
  md: compactSpacing.md,
  lg: compactSpacing.lg,
  xl: compactSpacing.xl,
  xxl: compactSpacing['2xl'],
  xxxl: compactSpacing['3xl'],
  xxxxl: compactSpacing['4xl'],
  // Add missing mappings for completeness
  s: compactSpacing.sm,
  m: compactSpacing.md,
  l: compactSpacing.lg,
};

// Shadow styles for backwards compatibility
export const shadowsCompact = {
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

// Export shadows as an alias for shadowsCompact for backwards compatibility
export const shadows = shadowsCompact;