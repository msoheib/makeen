import { useMemo } from 'react';
import { usePathname, useSegments } from 'expo-router';

/**
 * Route type enumeration for navigation context
 */
export enum RouteType {
  TAB_PAGE = 'TAB_PAGE',
  NON_TAB_PAGE = 'NON_TAB_PAGE'
}

/**
 * Interface for route context information
 */
export interface RouteContext {
  routeType: RouteType;
  hasBottomNavbar: boolean;
  shouldShowHamburger: boolean;
  shouldShowBackButton: boolean;
  currentRoute: string;
  segments: string[];
}

/**
 * Tab page route patterns (pages with bottom navbar)
 */
const TAB_PAGE_PATTERNS = [
  '/(drawer)/(tabs)',
  '/(drawer)/(tabs)/',
  '/(drawer)/(tabs)/index',
  '/(drawer)/(tabs)/properties',
  '/(drawer)/(tabs)/tenants',
  '/(drawer)/(tabs)/reports',
  '/(drawer)/(tabs)/settings',
  '/(drawer)/(tabs)/documents'
];

/**
 * Non-tab page route patterns (pages without bottom navbar)
 */
const NON_TAB_PAGE_PATTERNS = [
  '/(drawer)/documents/',
  '/(drawer)/reports/',
  '/documents/',
  '/profile/',
  '/theme/',
  '/language/',
  '/notifications/',
  '/currency/',
  '/support/',
  '/terms/',
  '/privacy/',
  '/tenants/',
  '/finance/',
  '/maintenance/',
  '/properties/',
  '/people/',
  '/help/',
  '/reports/'
];

/**
 * Custom hook to detect route context and navigation requirements
 * @returns RouteContext object with navigation flags and route information
 */
export const useRouteContext = (): RouteContext => {
  const pathname = usePathname();
  const segments = useSegments();

  const routeContext = useMemo(() => {
    const currentRoute = pathname;
    
    // Temporary debug logging to see actual routes
    console.log('🔍 Route Debug:', {
      pathname,
      segments: segments.join('/'),
      currentRoute
    });
    
    // Check if current route is a tab page
    const isTabPage = TAB_PAGE_PATTERNS.some(pattern => {
      if (pattern.endsWith('/') || pattern.includes('index')) {
        // For root patterns, check exact match or with trailing slash
        const match = currentRoute === pattern.replace('/index', '') || 
               currentRoute === pattern.replace('index', '') ||
               currentRoute === pattern;
        if (match) console.log('✅ TAB PAGE MATCH:', pattern, '→', currentRoute);
        return match;
      } else {
        // For specific tab pages, check exact match
        const match = currentRoute === pattern;
        if (match) console.log('✅ TAB PAGE MATCH:', pattern, '→', currentRoute);
        return match;
      }
    });
    
    console.log('🎯 Is tab page?', isTabPage, 'for route:', currentRoute);

    // Check if current route is a non-tab page
    const isNonTabPage = NON_TAB_PAGE_PATTERNS.some(pattern => {
      return currentRoute.startsWith(pattern);
    });

    // Handle dynamic routes by checking segments
    const isDynamicNonTabPage = segments.some(segment => {
      // Check for dynamic route segments like [id]
      return segments.includes('documents') && segments.length > 2 ||
             segments.includes('tenants') && segments.length > 3 ||
             segments.includes('properties') && segments.length > 3 ||
             (segments.includes('finance') && segments.length > 2) ||
             (segments.includes('maintenance') && segments.length > 1);
    });

    // Determine route type
    let routeType: RouteType;
    let hasBottomNavbar: boolean;

    if (isTabPage) {
      routeType = RouteType.TAB_PAGE;
      hasBottomNavbar = true;
    } else if (isNonTabPage || isDynamicNonTabPage) {
      routeType = RouteType.NON_TAB_PAGE;
      hasBottomNavbar = false;
    } else {
      // Default fallback - assume non-tab page for safety
      routeType = RouteType.NON_TAB_PAGE;
      hasBottomNavbar = false;
    }

    return {
      routeType,
      hasBottomNavbar,
      shouldShowHamburger: hasBottomNavbar,
      shouldShowBackButton: !hasBottomNavbar,
      currentRoute,
      segments
    };
  }, [pathname, segments]);

  return routeContext;
};

/**
 * Type guard to check if route is a tab page
 */
export const isTabPage = (routeContext: RouteContext): boolean => {
  return routeContext.routeType === RouteType.TAB_PAGE;
};

/**
 * Type guard to check if route is a non-tab page
 */
export const isNonTabPage = (routeContext: RouteContext): boolean => {
  return routeContext.routeType === RouteType.NON_TAB_PAGE;
};

export default useRouteContext; 