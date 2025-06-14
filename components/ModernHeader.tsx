import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { theme, spacing, rtlStyles, rtlLayout } from '@/lib/theme';
import { Bell, Search, Menu, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { NotificationBadge } from './NotificationBadge';
import { useTotalBadgeCount } from '@/hooks/useNotificationBadges';
import { useBadgeNavigation } from '@/hooks/useNotificationNavigation';
import { useRouteContext } from '@/hooks/useRouteContext';
import { useTranslation } from '@/lib/useTranslation';

interface ModernHeaderProps {
  title?: string;
  subtitle?: string;
  showNotifications?: boolean;
  showSearch?: boolean;
  showMenu?: boolean;
  onNotificationPress?: () => void;
  onSearchPress?: () => void;
  onMenuPress?: () => void;
  userAvatar?: string;
  userName?: string;
  showLogo?: boolean;
  variant?: 'light' | 'dark';
  isHomepage?: boolean;
}

export default function ModernHeader({
  title,
  subtitle,
  showNotifications = true,
  showSearch = false,
  showMenu = true,
  onNotificationPress,
  onSearchPress,
  onMenuPress,
  userAvatar,
  userName,
  showLogo = false,
  variant = 'dark',
  isHomepage = false
}: ModernHeaderProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const { count: totalNotifications } = useTotalBadgeCount();
  const { navigateFromBadge, isNavigating } = useBadgeNavigation();
  const { shouldShowHamburger, shouldShowBackButton } = useRouteContext();
  const { t } = useTranslation('common');
  
  const isDark = variant === 'dark';
  const textColor = isDark ? '#FFFFFF' : theme.colors.onSurface;
  const iconColor = isDark ? '#FFFFFF' : theme.colors.onSurfaceVariant;
  const backgroundColor = isDark ? '#1E293B' : theme.colors.background;

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      // Open the drawer
      navigation.dispatch(DrawerActions.openDrawer());
    }
  };

  const handleBackPress = () => {
    // Try to go back, fallback to home if no back history
    if (router.canGoBack()) {
      router.back();
    } else {
      // Navigate to the main dashboard/home
      router.push('/(drawer)/(tabs)/');
    }
  };

  const handleNotificationPress = async () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      // Navigate to notification center via badge navigation
      try {
        await navigateFromBadge();
      } catch (error) {
        console.warn('Failed to navigate from badge:', error);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.topRow}>
        {showMenu && shouldShowHamburger && (
          <IconButton
            icon={() => <Menu size={24} color={iconColor} />}
            onPress={handleMenuPress}
            style={styles.menuButton}
            accessibilityLabel={t('navigation.openMenu')}
            accessibilityHint={t('navigation.openMenuHint')}
          />
        )}
        {showMenu && shouldShowBackButton && (
          <IconButton
            icon={() => <ArrowLeft size={24} color={iconColor} />}
            onPress={handleBackPress}
            style={styles.menuButton}
            accessibilityLabel={t('navigation.goBack')}
            accessibilityHint={t('navigation.goBackHint')}
          />
        )}
        
        <View style={styles.centerContent}>
          {isHomepage && showLogo ? (
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <View style={[styles.logoSquare, { backgroundColor: theme.colors.primary }]} />
                <View style={[styles.logoSquare, { backgroundColor: theme.colors.secondary }]} />
              </View>
              <Text style={[styles.logoText, { color: textColor }]}>LandlordStudio</Text>
            </View>
          ) : (
            title && (
              <View style={styles.pageTitleContainer}>
                <Text style={[styles.pageTitle, { color: textColor }]} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle && (
                  <Text style={[styles.pageSubtitle, { color: isDark ? '#94A3B8' : theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>
            )
          )}
        </View>
        
        <View style={styles.rightSection}>
          {showSearch && (
            <IconButton
              icon={() => <Search size={24} color={iconColor} />}
              onPress={onSearchPress}
              style={styles.iconButton}
            />
          )}
          {showNotifications && (
            <NotificationBadge count={totalNotifications} size="small" position="top-right">
              <IconButton
                icon={() => <Bell size={24} color={iconColor} />}
                onPress={handleNotificationPress}
                style={styles.iconButton}
              />
            </NotificationBadge>
          )}
          {userAvatar && (
            <Image
              source={{ uri: userAvatar }}
              style={styles.avatar}
            />
          )}
        </View>
      </View>
      
      {isHomepage && userName && (
        <View style={styles.greetingSection}>
          <Text style={[styles.greeting, { color: textColor, ...rtlStyles.textLeft }]}>
            {t('greetings.hello', { name: userName })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.m,
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.m,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  topRow: {
    ...rtlStyles.row,
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
  },
  menuButton: {
    margin: 0,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.m,
  },
  logoContainer: {
    ...rtlStyles.row,
    alignItems: 'center',
  },
  logo: {
    ...rtlStyles.row,
    ...rtlStyles.marginEnd(spacing.s),
  },
  logoSquare: {
    width: 12,
    height: 12,
    marginRight: 2,
    borderRadius: 2,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '600',
  },
  pageTitleContainer: {
    alignItems: 'center',
    maxWidth: '100%',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingSection: {
    marginTop: spacing.m,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
  },
  iconButton: {
    margin: 0,
    marginHorizontal: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: spacing.s,
  },
});