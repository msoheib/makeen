import React from 'react';
import { View, StyleSheet, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { Text, IconButton, Badge } from 'react-native-paper';
import { lightTheme, darkTheme, spacing } from '@/lib/theme';
import { Bell, Search, Menu, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/lib/store';
import { useApi } from '@/hooks/useApi';
import { notificationsApi } from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModernHeaderProps {
  title?: string;
  subtitle?: string;
  showNotifications?: boolean;
  showSearch?: boolean;
  showMenu?: boolean;
  showBackButton?: boolean;
  onNotificationPress?: () => void;
  onSearchPress?: () => void;
  onMenuPress?: () => void;
  onBackPress?: () => void;
  variant?: 'light' | 'dark';
}

export default function ModernHeader({
  title,
  subtitle,
  showNotifications = true,
  showSearch = false,
  showMenu = true,
  showBackButton = false,
  onNotificationPress,
  onSearchPress,
  onMenuPress,
  onBackPress,
  variant = 'dark'
}: ModernHeaderProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const { isDarkMode } = useAppStore();
  const insets = useSafeAreaInsets();
  
  const theme = isDarkMode ? darkTheme : lightTheme;
  const isDark = variant === 'dark';
  const textColor = isDark ? '#FFFFFF' : theme.colors.onSurface;
  const iconColor = isDark ? '#FFFFFF' : theme.colors.onSurfaceVariant;
  const backgroundColor = isDark ? '#1E293B' : theme.colors.surface;

  // Get unread notifications count
  const { data: unreadCount } = useApi(() => notificationsApi.getUnreadCount(), []);

  // Calculate increased safe area padding
  // Base: safe area top inset + Additional padding for better spacing  
  const safeAreaPadding = Math.max(insets.top + 16, 24); // Minimum 24px, safe area + 16px extra for generous spacing

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      const { setSidebarOpen } = useAppStore.getState();
      setSidebarOpen(true);
    }
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(drawer)/(tabs)/');
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/notifications');
    }
  };

  // Determine if we should show back button based on navigation state
  const shouldShowBackButton = showBackButton || (router.canGoBack() && !showMenu);

  return (
    <>
      <StatusBar 
        backgroundColor={backgroundColor} 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent={true}
      />
      <View style={[styles.container, { backgroundColor, paddingTop: safeAreaPadding }]}>
        <View style={styles.content}>
          {/* Right side - Navigation (Back/Menu) */}
          <View style={styles.navigationSection}>
            {shouldShowBackButton ? (
              <IconButton
                icon={() => <ArrowRight size={24} color={iconColor} />}
                onPress={handleBackPress}
                style={styles.navButton}
                accessibilityLabel="العودة"
              />
            ) : showMenu ? (
              <IconButton
                icon={() => <Menu size={24} color={iconColor} />}
                onPress={handleMenuPress}
                style={styles.navButton}
                accessibilityLabel="القائمة"
              />
            ) : null}
          </View>

          {/* Center - Title */}
          <View style={styles.titleSection}>
            {title && (
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle && (
                  <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Left side - Actions */}
          <View style={styles.actionsSection}>
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
                    {unreadCount > 99 ? '99+' : unreadCount.toString()}
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
    // paddingTop is now handled dynamically with safe area insets
    paddingHorizontal: spacing.l, // Increased padding from spacing.m to spacing.l
    paddingBottom: spacing.m,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row-reverse', // RTL layout
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56, // Standard app bar height
    paddingVertical: spacing.s, // Additional vertical padding
  },
  navigationSection: {
    width: 48,
    alignItems: 'flex-end', // Align to right for RTL
  },
  titleSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.m, // Padding around title
  },
  actionsSection: {
    flexDirection: 'row-reverse', // RTL for action buttons
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
    marginHorizontal: spacing.xs, // Small margin between action buttons
    width: 40,
    height: 40,
  },
  titleContainer: {
    alignItems: 'center',
    maxWidth: '100%',
  },
  title: {
    fontSize: 20, // Slightly larger for better readability
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl', // Ensure RTL text direction
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
    writingDirection: 'rtl',
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