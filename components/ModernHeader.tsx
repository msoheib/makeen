import React from 'react';
import { View, StyleSheet, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { Text, IconButton, Badge } from 'react-native-paper';
import { lightTheme, darkTheme, spacing } from '@/lib/theme';
import { Bell, Search, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/lib/store';
import { useApi } from '@/hooks/useApi';
import { notificationsApi } from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rtlStyles, getFlexDirection } from '@/lib/rtl';
import { isRTL } from '@/lib/i18n';

/**
 * ModernHeader Component with Smart Back Navigation
 * 
 * This component implements intelligent back navigation that maps subsections
 * to their parent main sections instead of following the navigation stack
 * step-by-step. This provides a better user experience by taking users
 * directly to the relevant main section rather than through intermediate pages.
 * 
 * Smart Navigation Examples:
 * - /documents/[id] → /(drawer)/(tabs)/documents (Documents tab)
 * - /reports/revenue → /(drawer)/(tabs)/reports (Reports tab)
 * - /properties/[id] → /(drawer)/(tabs)/properties (Properties tab)
 * - /profile/ → /(drawer)/(tabs)/settings (Settings tab)
 * 
 * If no smart mapping is found, it falls back to standard router.back() behavior.
 */
interface ModernHeaderProps {
  title?: string;
  subtitle?: string;
  showNotifications?: boolean;
  showSearch?: boolean;
  showBackButton?: boolean;
  onNotificationPress?: () => void;
  onSearchPress?: () => void;
  onBackPress?: () => void;
  variant?: 'light' | 'dark';
}

export default function ModernHeader({
  title,
  subtitle,
  showNotifications = true,
  showSearch = false,
  showBackButton = false,
  onNotificationPress,
  onSearchPress,
  onBackPress,
  variant = 'dark'
}: ModernHeaderProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const { isDarkMode } = useAppStore();
  const insets = useSafeAreaInsets();
  
  const theme = isDarkMode ? darkTheme : lightTheme;
  const isDark = variant === 'dark';
  const textColor = isDark ? '#FFFFFF' : theme.colors.onPrimary;
  const iconColor = isDark ? '#FFFFFF' : theme.colors.onPrimary;
  const backgroundColor = isDark ? '#3A1D4E' : theme.colors.primary;

  // Get unread notifications count
  const { data: unreadCount } = useApi(() => notificationsApi.getUnreadCount(), []);

  // Calculate increased safe area padding
  // Base: safe area top inset + Additional padding for better spacing  
  const safeAreaPadding = Math.max(insets.top + 16, 24); // Minimum 24px, safe area + 16px extra for generous spacing


  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      // Smart back navigation that maps subsections to parent main sections
      const targetRoute = getSmartBackRoute();
      if (targetRoute) {
        router.push(targetRoute);
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/(drawer)/(tabs)/');
      }
    }
  };

  /**
   * Smart back navigation that maps subsections to their parent main sections
   * instead of following the navigation stack step-by-step
   */
  const getSmartBackRoute = (): string | null => {
    const currentRoute = router.pathname || '';
    
    // Map subsections to their parent main sections
    const routeMapping: { [key: string]: string } = {
      // Document subsections → Documents tab
      '/documents/': '/(drawer)/(tabs)/documents',
      '/(drawer)/documents/': '/(drawer)/(tabs)/documents',
      
      // Report subsections → Reports tab
      '/reports/': '/(drawer)/(tabs)/reports',
      '/(drawer)/reports/': '/(drawer)/(tabs)/reports',
      
      // Property subsections → Properties tab
      '/properties/': '/(drawer)/(tabs)/properties',
      '/(drawer)/properties/': '/(drawer)/(tabs)/properties',
      
      // Tenant subsections → Tenants tab
      '/tenants/': '/(drawer)/(tabs)/tenants',
      '/(drawer)/tenants/': '/(drawer)/(tabs)/tenants',
      
      // Finance subsections → Finance tab (if exists) or Dashboard
      '/finance/': '/(drawer)/(tabs)/',
      '/(drawer)/finance/': '/(drawer)/(tabs)/',
      
      // Maintenance subsections → Maintenance tab (if exists) or Dashboard
      '/maintenance/': '/(drawer)/(tabs)/',
      '/(drawer)/maintenance/': '/(drawer)/(tabs)/',
      
      // People subsections → Tenants tab (closest match)
      '/people/': '/(drawer)/(tabs)/tenants',
      '/(drawer)/people/': '/(drawer)/(tabs)/tenants',
      
      // Settings subsections → Settings tab
      '/profile/': '/(drawer)/(tabs)/settings',
      '/theme/': '/(drawer)/(tabs)/settings',
      '/language/': '/(drawer)/(tabs)/settings',
      '/currency/': '/(drawer)/(tabs)/settings',
      '/notifications/': '/(drawer)/(tabs)/settings',
      '/support/': '/(drawer)/(tabs)/settings',
      '/terms/': '/(drawer)/(tabs)/settings',
      '/privacy/': '/(drawer)/(tabs)/settings',
      '/help/': '/(drawer)/(tabs)/settings',
      
      // Auth and other pages → Dashboard
      '/': '/(drawer)/(tabs)/',
      '/(auth)/': '/(drawer)/(tabs)/',
      '/(drawer)/': '/(drawer)/(tabs)/'
    };

    // Find the best matching route
    for (const [pattern, targetRoute] of Object.entries(routeMapping)) {
      if (currentRoute.startsWith(pattern)) {
        console.log('🧭 Smart Navigation:', currentRoute, '→', targetRoute);
        return targetRoute;
      }
    }

    console.log('🧭 No smart route mapping found for:', currentRoute, '- falling back to router.back()');
    // If no specific mapping found, return null to fall back to router.back()
    return null;
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/notifications');
    }
  };

  // Determine if we should show back button based on navigation state
  const shouldShowBackButton = showBackButton || router.canGoBack();

  // Use proper RTL-aware arrow direction
  const BackArrowIcon = isRTL() ? ArrowRight : ArrowLeft;

  return (
    <>
      <StatusBar 
        backgroundColor={backgroundColor} 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent={true}
      />
      <View style={[styles.container, { backgroundColor, paddingTop: safeAreaPadding }]}>
        <View style={[styles.content, { flexDirection: 'row' }]}>
          {/* Start side - Navigation (Back/Menu) */}
          <View style={[styles.navigationSection, rtlStyles.alignItemsStart]}>
            {shouldShowBackButton ? (
              <IconButton
                icon={() => <BackArrowIcon size={24} color={iconColor} />}
                onPress={handleBackPress}
                style={styles.navButton}
                accessibilityLabel="العودة"
              />
            ) : null}
          </View>

          {/* Center - Title */}
          <View style={styles.titleSection}>
            {title && (
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: textColor }, rtlStyles.textAlign('center')]} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle && (
                  <Text style={[
                    styles.subtitle, 
                    { color: isDark ? '#94A3B8' : theme.colors.onSurfaceVariant },
                    rtlStyles.textAlign('center')
                  ]} numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* End side - Actions */}
          <View style={[styles.actionsSection, { flexDirection: 'row' }]}>
            {showSearch && (
              <IconButton
                icon={() => <Search size={24} color={iconColor} />}
                onPress={onSearchPress}
                style={styles.actionButton}
                accessibilityLabel="البحث"
              />
            )}
            {showNotifications && (
              <View style={styles.notificationContainer}>
                <IconButton
                  icon={() => <Bell size={24} color={iconColor} />}
                  onPress={handleNotificationPress}
                  style={styles.actionButton}
                  accessibilityLabel="الإشعارات"
                />
                {unreadCount && unreadCount > 0 && (
                  <Badge
                    style={[styles.notificationBadge, { backgroundColor: theme.colors.error }]}
                    size={18}
                  >
                    {unreadCount > 99 ? '99+' : String(unreadCount || 0)}
                  </Badge>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  navigationSection: {
    width: 48,
  },
  titleSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  actionsSection: {
    alignItems: 'center',
    width: 'auto',
    minWidth: 48,
  },
  navButton: {
    margin: 0,
    width: 40,
    height: 40,
  },
  actionButton: {
    margin: 0,
    marginHorizontal: spacing.xs,
    width: 40,
    height: 40,
  },
  titleContainer: {
    alignItems: 'center',
    maxWidth: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});