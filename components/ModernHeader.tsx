import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import { Bell, Search, Menu } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';

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
  variant = 'dark'
}: ModernHeaderProps) {
  const navigation = useNavigation();
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

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.topRow}>
        {showMenu && (
          <IconButton
            icon={() => <Menu size={24} color={iconColor} />}
            onPress={handleMenuPress}
            style={styles.menuButton}
          />
        )}
        
        {showLogo && (
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <View style={[styles.logoSquare, { backgroundColor: theme.colors.primary }]} />
              <View style={[styles.logoSquare, { backgroundColor: theme.colors.secondary }]} />
            </View>
            <Text style={[styles.logoText, { color: textColor }]}>LandlordStudio</Text>
          </View>
        )}
        
        <View style={styles.rightSection}>
          {showSearch && (
            <IconButton
              icon={() => <Search size={24} color={iconColor} />}
              onPress={onSearchPress}
              style={styles.iconButton}
            />
          )}
          {showNotifications && (
            <IconButton
              icon={() => <Bell size={24} color={iconColor} />}
              onPress={onNotificationPress}
              style={styles.iconButton}
            />
          )}
          {userAvatar && (
            <Image
              source={{ uri: userAvatar }}
              style={styles.avatar}
            />
          )}
        </View>
      </View>
      
      {(title || userName) && (
        <View style={styles.titleSection}>
          {title && (
            <View>
              <Text style={[styles.title, { color: textColor }]}>{title}</Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : theme.colors.onSurfaceVariant }]}>
                  {subtitle}
                </Text>
              )}
            </View>
          )}
          {userName && (
            <View>
              <Text style={[styles.greeting, { color: textColor }]}>Hello {userName},</Text>
            </View>
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  menuButton: {
    margin: 0,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: spacing.m,
  },
  logo: {
    flexDirection: 'row',
    marginRight: spacing.s,
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleSection: {
    marginTop: spacing.s,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
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