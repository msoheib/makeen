import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { Platform, I18nManager } from 'react-native';
import { isRTL, getDirection, getTextAlign, getFlexDirection } from './rtl';

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

// Theme configuration function
export const createTheme = (mode: 'light' | 'dark') => {
  const baseTheme = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;
  
  return {
    ...baseTheme,
    fonts: fonts,
    colors: {
      ...baseTheme.colors,
      // Primary brand colors - consistent across themes
      primary: '#2B5CE6', // Blue from the logo and active elements
      primaryContainer: mode === 'dark' ? '#1A3B8F' : '#E8F0FF',
      secondary: '#4ECDC4', // Teal from the logo
      secondaryContainer: mode === 'dark' ? '#2A7A72' : '#E0FFF8',
      tertiary: '#FF6B6B', // Red for outstanding amounts
      tertiaryContainer: mode === 'dark' ? '#8B2635' : '#FFE8E8',
      error: '#FF4757',
      errorContainer: mode === 'dark' ? '#8B2635' : '#FFE8EA',
      success: '#2ED573',
      successContainer: mode === 'dark' ? '#1A5D3F' : '#E8F8F0',
      warning: '#FFA726',
      warningContainer: mode === 'dark' ? '#7A4A1A' : '#FFF3E0',
      
      // Background colors for light/dark modes
      background: mode === 'dark' ? '#121212' : '#F8FAFC',
      surface: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
      surfaceVariant: mode === 'dark' ? '#2A2A2A' : '#F1F5F9',
      onSurface: mode === 'dark' ? '#E1E1E1' : '#1E293B',
      onSurfaceVariant: mode === 'dark' ? '#B0B0B0' : '#64748B',
      outline: mode === 'dark' ? '#3A3A3A' : '#E2E8F0',
      outlineVariant: mode === 'dark' ? '#2A2A2A' : '#F1F5F9',
      
      // Custom colors for the modern design
      cardBackground: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
      gradientStart: '#2B5CE6',
      gradientEnd: '#4ECDC4',
      income: '#2ED573',
      expense: '#FF6B6B',
      neutral: mode === 'dark' ? '#B0B0B0' : '#64748B',
      
      // Tab bar colors
      tabBarActive: '#2B5CE6',
      tabBarInactive: mode === 'dark' ? '#B0B0B0' : '#64748B',
      tabBarBackground: mode === 'dark' ? '#1E1E1E' : '#1E293B',
      
      // Chart colors
      chartPrimary: '#2B5CE6',
      chartSecondary: '#4ECDC4',
      chartSuccess: '#2ED573',
      chartWarning: '#FFA726',
      chartError: '#FF6B6B',
      chartNeutral: mode === 'dark' ? '#B0B0B0' : '#64748B',
      chartGrid: mode === 'dark' ? '#3A3A3A' : '#E2E8F0',
      chartText: mode === 'dark' ? '#E1E1E1' : '#1E293B',
    },
    roundness: 16,
    animation: {
      scale: 1.0,
    },
  };
};

// Default light theme (for backwards compatibility)
export const theme = createTheme('light');

// Dark theme
export const darkTheme = createTheme('dark');

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

// RTL-aware styling utilities
export const rtlStyles = {
  // Flexbox direction utilities
  row: {
    flexDirection: getFlexDirection('row'),
  },
  rowReverse: {
    flexDirection: getFlexDirection('row') === 'row' ? 'row-reverse' : 'row',
  },
  
  // Text alignment utilities
  textLeft: {
    textAlign: getTextAlign('left'),
  },
  textRight: {
    textAlign: getTextAlign('right'),
  },
  textCenter: {
    textAlign: 'center' as const,
  },
  
  // Positioning utilities
  alignStart: {
    alignSelf: 'flex-start' as const,
  },
  alignEnd: {
    alignSelf: 'flex-end' as const,
  },
  
  // Margin utilities (RTL-aware)
  marginStart: (value: number) => ({
    [isRTL() ? 'marginRight' : 'marginLeft']: value,
  }),
  marginEnd: (value: number) => ({
    [isRTL() ? 'marginLeft' : 'marginRight']: value,
  }),
  
  // Padding utilities (RTL-aware)
  paddingStart: (value: number) => ({
    [isRTL() ? 'paddingRight' : 'paddingLeft']: value,
  }),
  paddingEnd: (value: number) => ({
    [isRTL() ? 'paddingLeft' : 'paddingRight']: value,
  }),
  
  // Border utilities (RTL-aware)
  borderStart: (width: number, color: string) => ({
    [isRTL() ? 'borderRightWidth' : 'borderLeftWidth']: width,
    [isRTL() ? 'borderRightColor' : 'borderLeftColor']: color,
  }),
  borderEnd: (width: number, color: string) => ({
    [isRTL() ? 'borderLeftWidth' : 'borderRightWidth']: width,
    [isRTL() ? 'borderLeftColor' : 'borderRightColor']: color,
  }),
  
  // Position utilities (RTL-aware)
  positionStart: (value: number) => ({
    [isRTL() ? 'right' : 'left']: value,
  }),
  positionEnd: (value: number) => ({
    [isRTL() ? 'left' : 'right']: value,
  }),
};

// RTL layout utilities
export const rtlLayout = {
  // Check if current layout is RTL
  isRTL: () => isRTL(),
  
  // Get layout direction
  direction: () => getDirection(),
  
  // Transform values for RTL
  transform: {
    // Flip horizontal values for RTL
    scaleX: (value: number) => isRTL() ? -value : value,
    
    // Rotate icons/elements for RTL
    rotateY: () => isRTL() ? '180deg' : '0deg',
    
    // Translate horizontally accounting for RTL
    translateX: (value: number) => isRTL() ? -value : value,
  },
  
  // Icon mirroring for directional icons
  iconTransform: {
    // For directional icons (arrows, chevrons)
    mirror: {
      transform: [{ scaleX: isRTL() ? -1 : 1 }],
    },
    
    // For icons that should not be mirrored
    noMirror: {
      transform: [{ scaleX: 1 }],
    },
  },
  
  // Layout helpers
  justify: {
    start: isRTL() ? 'flex-end' : 'flex-start',
    end: isRTL() ? 'flex-start' : 'flex-end',
    center: 'center',
    spaceBetween: 'space-between',
    spaceAround: 'space-around',
    spaceEvenly: 'space-evenly',
  },
  
  // Text input direction
  textDirection: {
    auto: 'auto' as const,
    ltr: 'ltr' as const,
    rtl: 'rtl' as const,
    current: getDirection(),
  },
};

// Enhanced spacing with RTL support
export const rtlSpacing = {
  ...spacing,
  
  // Horizontal spacing with RTL awareness
  horizontal: {
    xs: { ...rtlStyles.paddingStart(spacing.xs), ...rtlStyles.paddingEnd(spacing.xs) },
    s: { ...rtlStyles.paddingStart(spacing.s), ...rtlStyles.paddingEnd(spacing.s) },
    m: { ...rtlStyles.paddingStart(spacing.m), ...rtlStyles.paddingEnd(spacing.m) },
    l: { ...rtlStyles.paddingStart(spacing.l), ...rtlStyles.paddingEnd(spacing.l) },
    xl: { ...rtlStyles.paddingStart(spacing.xl), ...rtlStyles.paddingEnd(spacing.xl) },
  },
  
  // Start/end specific spacing
  start: {
    xs: rtlStyles.paddingStart(spacing.xs),
    s: rtlStyles.paddingStart(spacing.s),
    m: rtlStyles.paddingStart(spacing.m),
    l: rtlStyles.paddingStart(spacing.l),
    xl: rtlStyles.paddingStart(spacing.xl),
  },
  
  end: {
    xs: rtlStyles.paddingEnd(spacing.xs),
    s: rtlStyles.paddingEnd(spacing.s),
    m: rtlStyles.paddingEnd(spacing.m),
    l: rtlStyles.paddingEnd(spacing.l),
    xl: rtlStyles.paddingEnd(spacing.xl),
  },
};

// Typography with RTL support
export const rtlTypography = {
  ...typography,
  
  // Text styles with proper alignment
  h1RTL: {
    ...typography.h1,
    textAlign: getTextAlign('left'),
    writingDirection: getDirection(),
  },
  h2RTL: {
    ...typography.h2,
    textAlign: getTextAlign('left'),
    writingDirection: getDirection(),
  },
  h3RTL: {
    ...typography.h3,
    textAlign: getTextAlign('left'),
    writingDirection: getDirection(),
  },
  body1RTL: {
    ...typography.body1,
    textAlign: getTextAlign('left'),
    writingDirection: getDirection(),
  },
  body2RTL: {
    ...typography.body2,
    textAlign: getTextAlign('left'),
    writingDirection: getDirection(),
  },
  
  // Specialized text styles
  input: {
    ...typography.body1,
    textAlign: getTextAlign('left'),
    writingDirection: getDirection(),
  },
  
  navigation: {
    ...typography.button,
    textAlign: getTextAlign('left'),
    writingDirection: getDirection(),
  },
};