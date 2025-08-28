import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { Text, IconButton, Badge } from 'react-native-paper';
import { lightTheme, darkTheme, spacing } from '@/lib/theme';
import { Bell, Search, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { usePathname, useRouter, useFocusEffect } from 'expo-router';
import { useAppStore } from '@/lib/store';
import { useApi } from '@/hooks/useApi';
import { notificationsApi } from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rtlStyles, getFlexDirection } from '@/lib/rtl';
import { isRTL } from '@/lib/i18n';

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
  const { isDarkMode, lastNotificationUpdate } = useAppStore();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  
  const theme = isDarkMode ? darkTheme : lightTheme;
  const isDark = variant === 'dark';
  const textColor = isDark ? '#FFFFFF' : theme.colors.onPrimary;
  const iconColor = isDark ? '#FFFFFF' : theme.colors.onPrimary;
  const backgroundColor = isDark ? '#3A1D4E' : theme.colors.primary;

  // Get unread notifications count with refetch capability
  const { data: unreadCount, refetch: refetchUnreadCount } = useApi(() => notificationsApi.getUnreadCount(), []);

  // Refresh unread count when screen regains focus
  useFocusEffect(
    React.useCallback(() => {
      refetchUnreadCount();
    }, [refetchUnreadCount])
  );

  // Refresh unread count when store indicates notifications were updated
  useEffect(() => {
    if (lastNotificationUpdate > 0) {
      refetchUnreadCount();
    }
  }, [lastNotificationUpdate, refetchUnreadCount]);

  // Periodic refresh as fallback (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchUnreadCount]);

  // Calculate increased safe area padding
  // Base: safe area top inset + Additional padding for better spacing  
  const safeAreaPadding = Math.max(insets.top + 16, 24); // Minimum 24px, safe area + 16px extra for generous spacing


  const resolveSectionFallback = (path: string | null | undefined): string => {
    if (!path) return '/(tabs)/';
    // Normalize
    const p = path.toLowerCase();

    // Common section fallbacks (ensure users go back to the correct tab/section root)
    const mappings: { test: (s: string) => boolean; dest: string }[] = [
      { test: s => s.startsWith('/tenants') || s.includes('/tenants/'), dest: '/(tabs)/tenants' },
      { test: s => s.startsWith('/people') || s.includes('/people/'), dest: '/(tabs)/people' },
      { test: s => s.startsWith('/properties') || s.includes('/properties/') || s.startsWith('/buildings') || s.includes('/buildings/'), dest: '/(tabs)/properties' },
      { test: s => s.startsWith('/maintenance') || s.includes('/maintenance/'), dest: '/(tabs)/maintenance' },
      { test: s => s.startsWith('/finance') || s.includes('/finance/'), dest: '/(tabs)/finance' },
      { test: s => s.startsWith('/documents') || s.includes('/documents/'), dest: '/(tabs)/documents' },
      { test: s => s.startsWith('/reports') || s.includes('/reports/'), dest: '/(tabs)/reports' },
      { test: s => s.startsWith('/notifications') || s.includes('/notifications/'), dest: '/notifications' },
      { test: s => s.startsWith('/contracts') || s.includes('/contracts/'), dest: '/contracts' },
      { test: s => s.startsWith('/owner') || s.includes('/owner/'), dest: '/owner-dashboard' },
      { test: s => s.startsWith('/manager') || s.includes('/manager/'), dest: '/manager/user-management' },
      { test: s => s.startsWith('/profile') || s.includes('/profile/'), dest: '/profile' },
      { test: s => s.startsWith('/tenant') || s.includes('/tenant/'), dest: '/tenant-dashboard' },
    ];

    const found = mappings.find(m => m.test(p));
    return found ? found.dest : '/(tabs)/';
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      const dest = resolveSectionFallback(pathname);
      router.push(dest);
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/notifications');
      // Refresh unread count immediately after navigation
      setTimeout(() => refetchUnreadCount(), 100);
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
                    style={[
                      styles.notificationBadge,
                      { backgroundColor: theme.colors.error },
                      // Flip badge side for RTL
                      isRTL() ? { left: 8, right: undefined } : { right: 8, left: undefined },
                    ]}
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