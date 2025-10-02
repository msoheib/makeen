import { useMemo } from 'react';
import { I18nManager } from 'react-native';
import { isRTL, getTextDirection, getFlexDirection, getTextAlign } from '../lib/rtl';

/**
 * RTL Hook - Provides RTL-aware styles and utilities
 * Automatically updates when RTL state changes
 */
export const useRTL = () => {
  const rtl = useMemo(() => {
    const isRTLMode = I18nManager.isRTL;
    
    return {
      // Core RTL state
      isRTL: isRTLMode,
      writingDirection: getTextDirection(),
      
      // Layout utilities
      flexDirection: {
        row: getFlexDirection('row'),
        column: getFlexDirection('column'),
        rowReverse: getFlexDirection('row'),
      },
      
      // Text alignment
      textAlign: {
        start: getTextAlign('left'),
        end: getTextAlign('right'),
        center: getTextAlign('center'),
        left: getTextAlign('left'),
        right: getTextAlign('right'),
      },
      
      // Margin utilities
      margin: {
        start: (value: number) => ({
          [isRTLMode ? 'marginRight' : 'marginLeft']: value,
        }),
        end: (value: number) => ({
          [isRTLMode ? 'marginLeft' : 'marginRight']: value,
        }),
        horizontal: (value: number) => ({
          marginHorizontal: value,
        }),
        vertical: (value: number) => ({
          marginVertical: value,
        }),
      },
      
      // Padding utilities
      padding: {
        start: (value: number) => ({
          [isRTLMode ? 'paddingRight' : 'paddingLeft']: value,
        }),
        end: (value: number) => ({
          [isRTLMode ? 'paddingLeft' : 'paddingRight']: value,
        }),
        horizontal: (value: number) => ({
          paddingHorizontal: value,
        }),
        vertical: (value: number) => ({
          paddingVertical: value,
        }),
      },
      
      // Position utilities
      position: {
        start: (value: number) => ({
          [isRTLMode ? 'right' : 'left']: value,
        }),
        end: (value: number) => ({
          [isRTLMode ? 'left' : 'right']: value,
        }),
        top: (value: number) => ({
          top: value,
        }),
        bottom: (value: number) => ({
          bottom: value,
        }),
      },
      
      // Border utilities
      border: {
        start: (value: number, color?: string) => ({
          [isRTLMode ? 'borderRightWidth' : 'borderLeftWidth']: value,
          [isRTLMode ? 'borderRightColor' : 'borderLeftColor']: color,
        }),
        end: (value: number, color?: string) => ({
          [isRTLMode ? 'borderLeftWidth' : 'borderRightWidth']: value,
          [isRTLMode ? 'borderLeftColor' : 'borderRightColor']: value,
        }),
        radius: {
          start: (value: number) => ({
            [isRTLMode ? 'borderTopRightRadius' : 'borderTopLeftRadius']: value,
            [isRTLMode ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: value,
          }),
          end: (value: number) => ({
            [isRTLMode ? 'borderTopLeftRadius' : 'borderTopRightRadius']: value,
            [isRTLMode ? 'borderBottomLeftRadius' : 'borderBottomRightRadius']: value,
          }),
          startTop: (value: number) => ({
            [isRTLMode ? 'borderTopRightRadius' : 'borderTopLeftRadius']: value,
          }),
          startBottom: (value: number) => ({
            [isRTLMode ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: value,
          }),
          endTop: (value: number) => ({
            [isRTLMode ? 'borderTopLeftRadius' : 'borderTopRightRadius']: value,
          }),
          endBottom: (value: number) => ({
            [isRTLMode ? 'borderBottomLeftRadius' : 'borderBottomRightRadius']: value,
          }),
        },
      },
      
      // Transform utilities
      transform: {
        translateX: (value: number) => ({
          transform: [{ translateX: isRTLMode ? -value : value }],
        }),
        scaleX: (value: number) => ({
          transform: [{ scaleX: isRTLMode ? -value : value }],
        }),
      },
      
      // Shadow utilities
      shadow: {
        offset: (width: number, height: number) => ({
          shadowOffset: {
            width: isRTLMode ? -width : width,
            height,
          },
        }),
      },
      
      // Common layout patterns
      layout: {
        // Row with RTL support
        row: {
          flexDirection: getFlexDirection('row'),
          alignItems: 'center',
        },
        
        // Row reverse for RTL
        rowReverse: {
          flexDirection: getFlexDirection('row'),
          alignItems: 'center',
        },
        
        // Column layout
        column: {
          flexDirection: 'column',
        },
        
        // Centered content
        center: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        
        // Space between items
        spaceBetween: {
          justifyContent: 'space-between',
        },
        
        // Space around items
        spaceAround: {
          justifyContent: 'space-around',
        },
        
        // Start alignment
        start: {
          alignItems: isRTLMode ? 'flex-end' : 'flex-start',
          justifyContent: isRTLMode ? 'flex-end' : 'flex-start',
        },
        
        // End alignment
        end: {
          alignItems: isRTLMode ? 'flex-start' : 'flex-end',
          justifyContent: isRTLMode ? 'flex-start' : 'flex-end',
        },
      },
      
      // Component-specific styles
      components: {
        // Card styles
        card: {
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 12,
          elevation: 2,
          shadowOffset: {
            width: isRTLMode ? -1 : 1,
            height: 2,
          },
        },
        
        // Input styles
        input: {
          marginBottom: 16,
          textAlign: getTextAlign('left'),
          writingDirection: getTextDirection(),
        },
        
        // Button styles
        button: {
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        
        buttonWithIcon: {
          flexDirection: getFlexDirection('row'),
          alignItems: 'center',
          gap: 8,
        },
        
        // Header styles
        header: {
          flexDirection: getFlexDirection('row'),
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        
        headerWithBack: {
          flexDirection: getFlexDirection('row'),
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        
        // List styles
        listItem: {
          flexDirection: getFlexDirection('row'),
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        
        // Form styles
        formField: {
          marginBottom: 16,
        },
        
        formActions: {
          flexDirection: getFlexDirection('row'),
          justifyContent: 'flex-end',
          gap: 16,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        
        // Modal styles
        modalHeader: {
          flexDirection: getFlexDirection('row'),
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
        },
        
        modalActions: {
          flexDirection: getFlexDirection('row'),
          justifyContent: 'flex-end',
          gap: 16,
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        
        // Navigation styles
        tabBar: {
          flexDirection: getFlexDirection('row'),
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        
        drawer: {
          flex: 1,
          writingDirection: getTextDirection(),
        },
        
        // Search styles
        searchContainer: {
          flexDirection: getFlexDirection('row'),
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingBottom: 16,
          gap: 8,
        },
        
        searchBar: {
          flex: 1,
          flexDirection: getFlexDirection('row'),
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingVertical: 8,
          borderRadius: 8,
          borderWidth: 1,
        },
        
        // Filter styles
        filterContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          paddingHorizontal: 16,
          paddingBottom: 16,
        },
        
        filterOption: {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
        },
        
        // Stats styles
        statsContainer: {
          padding: 16,
        },
        
        statsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        
        // Actions styles
        actionsContainer: {
          paddingHorizontal: 16,
          paddingBottom: 16,
        },
        
        quickActions: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        
        actionButton: {
          flexDirection: getFlexDirection('row'),
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 8,
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
          marginHorizontal: 16,
          marginBottom: 16,
        },
        
        sectionHeader: {
          flexDirection: getFlexDirection('row'),
          alignItems: 'center',
          marginBottom: 16,
        },
        
        sectionTitle: {
          fontSize: 18,
          fontWeight: '600',
          marginLeft: 8,
        },
        
        // Row layouts
        row: {
          flexDirection: getFlexDirection('row'),
          gap: 16,
          alignItems: 'flex-end',
        },
        
        halfWidth: {
          flex: 1,
        },
        
        // Status styles
        statusInfo: {
          marginTop: 4,
        },
        
        statusDescription: {
          fontSize: 12,
          fontStyle: 'italic',
        },
        
        // Error styles
        errorText: {
          fontSize: 12,
          marginTop: -8,
          marginBottom: 16,
        },
        
        // Submit styles
        submitContainer: {
          padding: 16,
          paddingBottom: 64,
        },
        
        submitButton: {
          borderRadius: 12,
        },
        
        submitButtonContent: {
          paddingVertical: 8,
        },
        
        // Loading and empty states
        loadingContainer: {
          padding: 24,
          alignItems: 'center',
        },
        
        loadingText: {
          fontSize: 16,
        },
        
        errorContainer: {
          padding: 24,
          alignItems: 'center',
        },
        
        errorText: {
          fontSize: 16,
          textAlign: 'center',
          marginBottom: 8,
        },
        
        retryButton: {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 8,
          borderWidth: 1,
        },
        
        retryText: {
          fontSize: 14,
          fontWeight: '500',
        },
        
        emptyContainer: {
          padding: 64,
          alignItems: 'center',
        },
        
        emptyTitle: {
          fontSize: 18,
          fontWeight: '600',
          marginTop: 16,
          textAlign: 'center',
        },
        
        emptySubtitle: {
          fontSize: 14,
          marginTop: 8,
          textAlign: 'center',
          lineHeight: 20,
        },
        
        // List styles
        vouchersList: {
          gap: 8,
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
          padding: 24,
        },
        
        filterSection: {
          marginBottom: 24,
        },
        
        filterLabel: {
          fontSize: 16,
          fontWeight: '500',
          marginBottom: 8,
        },
        
        filterOptions: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        
        modalButton: {
          flex: 1,
          paddingVertical: 8,
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
      },
      
      // Icon positioning
      icon: {
        start: {
          [isRTLMode ? 'marginRight' : 'marginLeft']: 8,
        },
        end: {
          [isRTLMode ? 'marginLeft' : 'marginRight']: 8,
        },
        positioned: (position: 'start' | 'end') => {
          if (position === 'start') {
            return {
              [isRTLMode ? 'marginRight' : 'marginLeft']: 8,
            };
          }
          return {
            [isRTLMode ? 'marginLeft' : 'marginRight']: 8,
          };
        },
      },
      
      // Badge positioning
      badge: {
        start: {
          position: 'absolute',
          [isRTLMode ? 'right' : 'left']: 8,
          top: 8,
        },
        end: {
          position: 'absolute',
          [isRTLMode ? 'left' : 'right']: 8,
          top: 8,
        },
        positioned: (position: 'start' | 'end', top: number = 8) => ({
          position: 'absolute',
          [position === 'start' ? (isRTLMode ? 'right' : 'left') : (isRTLMode ? 'left' : 'right')]: 8,
          top,
        }),
      },
      
      // Tooltip positioning
      tooltip: {
        start: {
          position: 'absolute',
          [isRTLMode ? 'right' : 'left']: 0,
          top: '100%',
          marginTop: 4,
        },
        end: {
          position: 'absolute',
          [isRTLMode ? 'left' : 'right']: 0,
          top: '100%',
          marginTop: 4,
        },
        positioned: (position: 'start' | 'end', top: string | number = '100%') => ({
          position: 'absolute',
          [position === 'start' ? (isRTLMode ? 'right' : 'left') : (isRTLMode ? 'left' : 'right')]: 0,
          top,
          marginTop: 4,
        }),
      },
    };
  }, []);
  
  return rtl;
};

export default useRTL;