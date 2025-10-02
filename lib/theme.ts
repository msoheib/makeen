import { MD3LightTheme, MD3DarkTheme, MD3Theme, configureFonts } from 'react-native-paper';
import { Platform } from 'react-native';
import { isRTL, getTextDirection, getFlexDirection, getTextAlign } from './rtl';
const fontConfig = {
  displayLarge: { fontFamily: 'Cairo_700Bold', fontWeight: '700' },
  displayMedium: { fontFamily: 'Cairo_600SemiBold', fontWeight: '600' },
  displaySmall: { fontFamily: 'Cairo_600SemiBold', fontWeight: '600' },
  headlineLarge: { fontFamily: 'Cairo_700Bold', fontWeight: '700' },
  headlineMedium: { fontFamily: 'Cairo_600SemiBold', fontWeight: '600' },
  headlineSmall: { fontFamily: 'Cairo_600SemiBold', fontWeight: '600' },
  titleLarge: { fontFamily: 'Cairo_600SemiBold', fontWeight: '600' },
  titleMedium: { fontFamily: 'Cairo_500Medium', fontWeight: '500' },
  titleSmall: { fontFamily: 'Cairo_500Medium', fontWeight: '500' },
  labelLarge: { fontFamily: 'Cairo_500Medium', fontWeight: '500' },
  labelMedium: { fontFamily: 'Cairo_500Medium', fontWeight: '500' },
  labelSmall: { fontFamily: 'Cairo_400Regular', fontWeight: '400' },
  bodyLarge: { fontFamily: 'Cairo_400Regular', fontWeight: '400' },
  bodyMedium: { fontFamily: 'Cairo_400Regular', fontWeight: '400' },
  bodySmall: { fontFamily: 'Cairo_400Regular', fontWeight: '400' },
};

const paperFonts = configureFonts({ config: fontConfig });


// RTL-aware spacing system
export const rtlSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// RTL-aware layout system
export const rtlLayout = {
  // Container layouts
  container: {
    flex: 1,
    writingDirection: getTextDirection(),
  },
  
  // Row layouts with RTL support
  row: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
  },
  
  rowReverse: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
  },
  
  // Column layouts
  column: {
    flexDirection: 'column',
  },
  
  // Text alignment
  textStart: {
    textAlign: getTextAlign('left'),
  },
  
  textEnd: {
    textAlign: getTextAlign('right'),
  },
  
  textCenter: {
    textAlign: 'center',
  },
  
  // Margin utilities
  marginStart: (value: number) => ({
    [isRTL() ? 'marginRight' : 'marginLeft']: value,
  }),
  
  marginEnd: (value: number) => ({
    [isRTL() ? 'marginLeft' : 'marginRight']: value,
  }),
  
  // Padding utilities
  paddingStart: (value: number) => ({
    [isRTL() ? 'paddingRight' : 'paddingLeft']: value,
  }),
  
  paddingEnd: (value: number) => ({
    [isRTL() ? 'paddingLeft' : 'paddingRight']: value,
  }),
  
  // Position utilities
  positionStart: (value: number) => ({
    [isRTL() ? 'right' : 'left']: value,
  }),
  
  positionEnd: (value: number) => ({
    [isRTL() ? 'left' : 'right']: value,
  }),
};

// Utility function to convert shadow properties to boxShadow for web
export const createShadowStyle = (shadowColor: string, shadowOffset: { width: number; height: number }, shadowOpacity: number, shadowRadius: number) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`,
    };
  }
  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation: shadowRadius,
  };
};

// RTL-aware component styles
export const rtlComponents = {
  // Card styles
  card: {
    marginHorizontal: rtlSpacing.md,
    marginBottom: rtlSpacing.md,
    borderRadius: 12,
    ...createShadowStyle('#000', { width: isRTL() ? -1 : 1, height: 2 }, 0.1, 4),
  },
  
  // Input styles
  input: {
    marginBottom: rtlSpacing.md,
    textAlign: getTextAlign('left'),
    writingDirection: getTextDirection(),
  },
  
  // Button styles
  button: {
    borderRadius: 8,
    paddingHorizontal: rtlSpacing.md,
    paddingVertical: rtlSpacing.sm,
  },
  
  buttonWithIcon: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    gap: rtlSpacing.sm,
  },
  
  // Header styles
  header: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingHorizontal: rtlSpacing.md,
    paddingVertical: rtlSpacing.sm,
  },
  
  headerWithBack: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingHorizontal: rtlSpacing.md,
    paddingVertical: rtlSpacing.sm,
  },
  
  // List styles
  listItem: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingHorizontal: rtlSpacing.md,
    paddingVertical: rtlSpacing.sm,
  },
  
  // Form styles
  formField: {
    marginBottom: rtlSpacing.md,
  },
  
  formActions: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'flex-end',
    gap: rtlSpacing.md,
    paddingHorizontal: rtlSpacing.md,
    paddingVertical: rtlSpacing.md,
  },
  
  // Modal styles
  modalHeader: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rtlSpacing.lg,
    paddingVertical: rtlSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  modalActions: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'flex-end',
    gap: rtlSpacing.md,
    paddingHorizontal: rtlSpacing.lg,
    paddingVertical: rtlSpacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  
  // Navigation styles
  tabBar: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: rtlSpacing.md,
    paddingVertical: rtlSpacing.sm,
  },
  
  drawer: {
    flex: 1,
    writingDirection: getTextDirection(),
  },
  
  // Search styles
  searchContainer: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingHorizontal: rtlSpacing.md,
    paddingBottom: rtlSpacing.md,
    gap: rtlSpacing.sm,
  },
  
  searchBar: {
    flex: 1,
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingHorizontal: rtlSpacing.sm,
    paddingVertical: rtlSpacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  
  // Filter styles
  filterContainer: {
    flexDirection: getFlexDirection('row'),
    flexWrap: 'wrap',
    gap: rtlSpacing.sm,
    paddingHorizontal: rtlSpacing.md,
    paddingBottom: rtlSpacing.md,
  },
  
  filterOption: {
    paddingHorizontal: rtlSpacing.md,
    paddingVertical: rtlSpacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  
  // Stats styles
  statsContainer: {
    padding: rtlSpacing.md,
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rtlSpacing.sm,
  },
  
  // Actions styles
  actionsContainer: {
    paddingHorizontal: rtlSpacing.md,
    paddingBottom: rtlSpacing.md,
  },
  
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rtlSpacing.sm,
  },
  
  actionButton: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingHorizontal: rtlSpacing.md,
    paddingVertical: rtlSpacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 0,
    flex: 1,
  },
  
  // Content styles
  content: {
    flex: 1,
  },
  
  section: {
    marginHorizontal: rtlSpacing.md,
    marginBottom: rtlSpacing.md,
  },
  
  sectionHeader: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    marginBottom: rtlSpacing.md,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: rtlSpacing.sm,
  },
  
  // Row layouts
  row: {
    flexDirection: getFlexDirection('row'),
    gap: rtlSpacing.md,
    alignItems: 'flex-end',
  },
  
  halfWidth: {
    flex: 1,
  },
  
  // Status styles
  statusInfo: {
    marginTop: rtlSpacing.xs,
  },
  
  statusDescription: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  
  // Error styles
  errorText: {
    fontSize: 12,
    marginTop: -rtlSpacing.sm,
    marginBottom: rtlSpacing.md,
  },
  
  // Submit styles
  submitContainer: {
    padding: rtlSpacing.md,
    paddingBottom: rtlSpacing.xxxl,
  },
  
  submitButton: {
    borderRadius: 12,
  },
  
  submitButtonContent: {
    paddingVertical: rtlSpacing.sm,
  },
  
  // Loading and empty states
  loadingContainer: {
    padding: rtlSpacing.lg,
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: 16,
  },
  
  errorContainer: {
    padding: rtlSpacing.lg,
    alignItems: 'center',
  },
  
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: rtlSpacing.sm,
  },
  
  retryButton: {
    paddingHorizontal: rtlSpacing.md,
    paddingVertical: rtlSpacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  
  retryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  emptyContainer: {
    padding: rtlSpacing.xxxl,
    alignItems: 'center',
  },
  
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: rtlSpacing.md,
    textAlign: 'center',
  },
  
  emptySubtitle: {
    fontSize: 14,
    marginTop: rtlSpacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // List styles
  vouchersList: {
    gap: rtlSpacing.sm,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  filterModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  
  modalContent: {
    padding: rtlSpacing.lg,
  },
  
  filterSection: {
    marginBottom: rtlSpacing.lg,
  },
  
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: rtlSpacing.sm,
  },
  
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rtlSpacing.sm,
  },
  
  modalButton: {
    flex: 1,
    paddingVertical: rtlSpacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  applyButton: {
    borderWidth: 0,
  },
};

// Enhanced spacing object with RTL awareness
export const spacing = {
  ...rtlSpacing,
  // RTL-aware margin helpers
  marginStart: rtlLayout.marginStart,
  marginEnd: rtlLayout.marginEnd,
  
  // RTL-aware padding helpers
  paddingStart: rtlLayout.paddingStart,
  paddingEnd: rtlLayout.paddingEnd,
  
  // RTL-aware position helpers
  positionStart: rtlLayout.positionStart,
  positionEnd: rtlLayout.positionEnd,
  
  // Backwards-compatible aliases
  s: rtlSpacing.sm,
  m: rtlSpacing.md,
  l: rtlSpacing.lg,
};

// Enhanced theme with RTL support
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: paperFonts,
  // Add RTL-aware colors and properties
  colors: {
    ...MD3LightTheme.colors,
    // RTL-aware accent colors
    primary: '#1976D2',
    secondary: '#424242',
    tertiary: '#9C27B0',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts: paperFonts,
  // Add RTL-aware colors and properties
  colors: {
    ...MD3DarkTheme.colors,
    // RTL-aware accent colors
    primary: '#90CAF9',
    secondary: '#BDBDBD',
    tertiary: '#CE93D8',
  },
};

// Export the theme object
export const theme = lightTheme;

export type AppTheme = typeof lightTheme;

// Export all RTL-aware utilities
export {
  rtlSpacing,
  rtlLayout,
  rtlComponents,
  spacing,
};

// Backwards-compatible shadow styles
export const shadows = {
  small: createShadowStyle('#000', { width: 0, height: 1 }, 0.05, 2),
  medium: createShadowStyle('#000', { width: 0, height: 2 }, 0.08, 3),
  large: createShadowStyle('#000', { width: 0, height: 4 }, 0.1, 6),
};
