import { I18nManager } from 'react-native';
import { Platform } from 'react-native';

/**
 * RTL Layout Utility System
 * Provides direction-aware styles, layout helpers, and RTL-aware components
 */

// Check if the app is currently in RTL mode
export const isRTL = () => I18nManager.isRTL;

// Get the current text direction
export const getTextDirection = () => isRTL() ? 'rtl' : 'ltr';

// RTL-aware flex direction
export const getFlexDirection = (defaultDirection: 'row' | 'column' = 'row') => {
  if (defaultDirection === 'row') {
    return isRTL() ? 'row-reverse' : 'row';
  }
  return defaultDirection;
};

// RTL-aware text alignment
export const getTextAlign = (defaultAlign: 'left' | 'right' | 'center' | 'justify' = 'left') => {
  if (defaultAlign === 'left') {
    return isRTL() ? 'right' : 'left';
  }
  if (defaultAlign === 'right') {
    return isRTL() ? 'left' : 'right';
  }
  return defaultAlign;
};

// RTL-aware margin/padding
export const getMarginStart = (value: number | string) => {
  return isRTL() ? { marginRight: value } : { marginLeft: value };
};

export const getMarginEnd = (value: number | string) => {
  return isRTL() ? { marginLeft: value } : { marginRight: value };
};

export const getPaddingStart = (value: number | string) => {
  return isRTL() ? { paddingRight: value } : { paddingLeft: value };
};

export const getPaddingEnd = (value: number | string) => {
  return isRTL() ? { paddingLeft: value } : { paddingRight: value };
};

// RTL-aware positioning
export const getStart = (value: number | string) => {
  return isRTL() ? { right: value } : { left: value };
};

export const getEnd = (value: number | string) => {
  return isRTL() ? { left: value } : { right: value };
};

// RTL-aware border radius
export const getBorderRadius = (
  topLeft: number = 0,
  topRight: number = 0,
  bottomRight: number = 0,
  bottomLeft: number = 0
) => {
  if (isRTL()) {
    return {
      borderTopLeftRadius: topRight,
      borderTopRightRadius: topLeft,
      borderBottomRightRadius: bottomLeft,
      borderBottomLeftRadius: bottomRight,
    };
  }
  return {
    borderTopLeftRadius: topLeft,
    borderTopRightRadius: topRight,
    borderBottomRightRadius: bottomRight,
    borderBottomLeftRadius: bottomLeft,
  };
};

// RTL-aware transform
export const getTransform = (translateX: number = 0) => {
  if (isRTL()) {
    return [{ translateX: -translateX }];
  }
  return [{ translateX }];
};

// RTL-aware shadow offset
export const getShadowOffset = (width: number = 0, height: number = 0) => {
  if (isRTL()) {
    return { width: -width, height };
  }
  return { width, height };
};

// Common RTL-aware layout styles
export const rtlStyles = {
  // Container styles
  container: {
    flex: 1,
    direction: getTextDirection(),
  },
  
  // Row layout with RTL support
  row: () => ({
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
  }),
  
  // Row reverse for RTL
  rowReverse: () => ({
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
  }),
  
  // Column layout
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

  // Backwards-compatible helpers used in existing components
  textAlign: (align: 'left' | 'right' | 'center' | 'justify' = 'left') => ({
    textAlign: getTextAlign(align),
  }),
  alignItemsStart: {
    alignItems: isRTL() ? 'flex-end' : 'flex-start',
  },
  alignItemsEnd: {
    alignItems: isRTL() ? 'flex-start' : 'flex-end',
  },
  
  // Margin utilities
  marginStart: (value: number) => getMarginStart(value),
  marginEnd: (value: number) => getMarginEnd(value),
  // Back-compat aliases
  marginLeft: (value: number) => getMarginStart(value),
  marginRight: (value: number) => getMarginEnd(value),
  
  // Padding utilities
  paddingStart: (value: number) => getPaddingStart(value),
  paddingEnd: (value: number) => getPaddingEnd(value),
  
  // Position utilities
  positionStart: (value: number) => getStart(value),
  positionEnd: (value: number) => getEnd(value),
  
  // Border radius utilities
  borderRadiusStart: (value: number) => ({
    ...getBorderRadius(value, 0, 0, 0),
  }),
  
  borderRadiusEnd: (value: number) => ({
    ...getBorderRadius(0, value, 0, 0),
  }),
  
  borderRadiusStartTop: (value: number) => ({
    ...getBorderRadius(value, 0, 0, 0),
  }),
  
  borderRadiusEndTop: (value: number) => ({
    ...getBorderRadius(0, value, 0, 0),
  }),
  
  borderRadiusStartBottom: (value: number) => ({
    ...getBorderRadius(0, 0, 0, value),
  }),
  
  borderRadiusEndBottom: (value: number) => ({
    ...getBorderRadius(0, 0, value, 0),
  }),
};

// RTL-aware spacing system
export const rtlSpacing = {
  // Horizontal spacing with RTL awareness
  hStart: (value: number) => getMarginStart(value),
  hEnd: (value: number) => getMarginEnd(value),
  
  // Vertical spacing
  vTop: (value: number) => ({ marginTop: value }),
  vBottom: (value: number) => ({ marginBottom: value }),
  
  // Combined spacing
  hStartVTop: (hValue: number, vValue: number) => ({
    ...getMarginStart(hValue),
    ...getMarginEnd(0),
    marginTop: vValue,
  }),
  
  hEndVTop: (hValue: number, vValue: number) => ({
    ...getMarginEnd(hValue),
    ...getMarginStart(0),
    marginTop: vValue,
  }),
};

// RTL-aware flex utilities
export const rtlFlex = {
  // Flex start/end with RTL awareness
  start: {
    alignSelf: 'flex-start',
    ...getMarginEnd('auto'),
  },
  
  end: {
    alignSelf: 'flex-end',
    ...getMarginStart('auto'),
  },
  
  // Justify content with RTL awareness
  justifyStart: {
    justifyContent: isRTL() ? 'flex-end' : 'flex-start',
  },
  
  justifyEnd: {
    justifyContent: isRTL() ? 'flex-start' : 'flex-end',
  },
  
  // Align items with RTL awareness
  itemsStart: {
    alignItems: isRTL() ? 'flex-end' : 'flex-start',
  },
  
  itemsEnd: {
    alignItems: isRTL() ? 'flex-start' : 'flex-end',
  },
};

// RTL-aware input styles
export const rtlInput = {
  // Text input with RTL support
  textInput: {
    textAlign: getTextAlign('left'),
    writingDirection: getTextDirection(),
  },
  
  // Text input with RTL right alignment
  textInputRTL: {
    textAlign: getTextAlign('right'),
    writingDirection: getTextDirection(),
  },
  
  // Label positioning
  labelStart: {
    ...getMarginEnd(8),
  },
  
  labelEnd: {
    ...getMarginStart(8),
  },
};

// RTL-aware button styles
export const rtlButton = {
  // Button with icon and text
  withIcon: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
  },
  
  // Button with icon on the right (LTR) or left (RTL)
  iconEnd: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
  },
  
  // Button with icon on the left (LTR) or right (RTL)
  iconStart: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
  },
};

// RTL-aware card styles
export const rtlCard = {
  // Card with RTL-aware shadow
  withShadow: {
    shadowOffset: getShadowOffset(0, 2),
    elevation: 3,
  },
  
  // Card with RTL-aware border radius
  withRadius: (value: number) => ({
    borderRadius: value,
  }),
  
  // Card with RTL-aware margins
  withMargin: (value: number) => ({
    marginHorizontal: value,
    marginVertical: value / 2,
  }),
};

// RTL-aware list styles
export const rtlList = {
  // List item with RTL support
  item: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // List item with avatar
  itemWithAvatar: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // List item with actions
  itemWithActions: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
};

// RTL-aware navigation styles
export const rtlNavigation = {
  // Header with back button
  headerWithBack: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // Tab bar with RTL support
  tabBar: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  
  // Drawer with RTL support
  drawer: {
    flex: 1,
    direction: getTextDirection(),
  },
};

// RTL-aware form styles
export const rtlForm = {
  // Form field with label
  field: {
    marginBottom: 16,
  },
  
  // Form field with label on top
  fieldWithLabelTop: {
    marginBottom: 16,
  },
  
  // Form field with label on side
  fieldWithLabelSide: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    marginBottom: 16,
  },
  
  // Form actions
  actions: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'flex-end',
    gap: 12,
  },
  
  // Form actions with RTL-aware spacing
  actionsRTL: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'flex-end',
    gap: 12,
  },
};

// RTL-aware modal styles
export const rtlModal = {
  // Modal content
  content: {
    direction: getTextDirection(),
  },
  
  // Modal header
  header: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  // Modal actions
  actions: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
};

// RTL-aware table styles
export const rtlTable = {
  // Table header
  header: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  
  // Table row
  row: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  // Table cell
  cell: {
    flex: 1,
    paddingHorizontal: 8,
  },
};

// RTL-aware grid styles
export const rtlGrid = {
  // Grid container
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  
  // Grid item
  item: {
    flex: 1,
    minWidth: 150,
  },
  
  // Grid item with specific width
  itemWithWidth: (width: number) => ({
    width,
    flex: 0,
  }),
};

// RTL-aware animation utilities
export const rtlAnimation = {
  // Slide animation with RTL support
  slideIn: (direction: 'left' | 'right' = 'left') => {
    const isFromRight = direction === 'right';
    const translateX = isFromRight ? 100 : -100;
    
    return {
      transform: getTransform(translateX),
    };
  },
  
  slideOut: (direction: 'left' | 'right' = 'left') => {
    const isToRight = direction === 'right';
    const translateX = isToRight ? 100 : -100;
    
    return {
      transform: getTransform(translateX),
    };
  },
};

// RTL-aware icon positioning
export const rtlIcon = {
  // Icon on the left (LTR) or right (RTL)
  start: {
    ...getMarginEnd(8),
  },
  
  // Icon on the right (LTR) or left (RTL)
  end: {
    ...getMarginStart(8),
  },
  
  // Icon with RTL-aware positioning
  positioned: (position: 'start' | 'end') => {
    if (position === 'start') {
      return rtlIcon.start;
    }
    return rtlIcon.end;
  },
};

// RTL-aware badge styles
export const rtlBadge = {
  // Badge with RTL support
  container: {
    position: 'absolute',
    ...getStart(8),
    top: 8,
  },
  
  // Badge with RTL-aware positioning
  positioned: (position: 'start' | 'end', top: number = 8) => ({
    position: 'absolute',
    ...(position === 'start' ? getStart(8) : getEnd(8)),
    top,
  }),
};

// RTL-aware tooltip styles
export const rtlTooltip = {
  // Tooltip with RTL support
  container: {
    position: 'absolute',
    ...getStart(0),
    top: '100%',
    marginTop: 4,
  },
  
  // Tooltip with RTL-aware positioning
  positioned: (position: 'start' | 'end', top: string | number = '100%') => ({
    position: 'absolute',
    ...(position === 'start' ? getStart(0) : getEnd(0)),
    top,
    marginTop: 4,
  }),
};

// Export all RTL utilities
export default {
  // Core utilities
  isRTL,
  getTextDirection,
  getFlexDirection,
  getTextAlign,
  
  // Spacing utilities
  getMarginStart,
  getMarginEnd,
  getPaddingStart,
  getPaddingEnd,
  
  // Positioning utilities
  getStart,
  getEnd,
  getTransform,
  getShadowOffset,
  
  // Style collections
  rtlStyles,
  rtlSpacing,
  rtlFlex,
  rtlInput,
  rtlButton,
  rtlCard,
  rtlList,
  rtlNavigation,
  rtlForm,
  rtlModal,
  rtlTable,
  rtlGrid,
  rtlAnimation,
  rtlIcon,
  rtlBadge,
  rtlTooltip,
}; 