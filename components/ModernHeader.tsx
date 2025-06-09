import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import { Bell, Search, Menu } from 'lucide-react-native';

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
  showLogo = false
}: ModernHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {showMenu && (
          <IconButton
            icon={() => <Menu size={24} color={theme.colors.onSurface} />}
            onPress={onMenuPress}
            style={styles.menuButton}
          />
        )}
        
        {showLogo && (
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <View style={[styles.logoSquare, { backgroundColor: theme.colors.primary }]} />
              <View style={[styles.logoSquare, { backgroundColor: theme.colors.secondary }]} />
            </View>
            <Text style={styles.logoText}>LandlordStudio</Text>
          </View>
        )}
        
        <View style={styles.rightSection}>
          {showSearch && (
            <IconButton
              icon={() => <Search size={24} color={theme.colors.onSurfaceVariant} />}
              onPress={onSearchPress}
              style={styles.iconButton}
            />
          )}
          {showNotifications && (
            <IconButton
              icon={() => <Bell size={24} color={theme.colors.onSurfaceVariant} />}
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
              <Text style={styles.title}>{title}</Text>
              {subtitle && (
                <Text style={styles.subtitle}>{subtitle}</Text>
              )}
            </View>
          )}
          {userName && (
            <View>
              <Text style={styles.greeting}>Hello {userName},</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.m,
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.m,
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
    color: theme.colors.onSurface,
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
    color: theme.colors.onSurface,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.onSurface,
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