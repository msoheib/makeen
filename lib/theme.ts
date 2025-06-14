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