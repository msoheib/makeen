import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import { Bell, Search } from 'lucide-react-native';

interface ModernHeaderProps {
  title?: string;
  subtitle?: string;
  showNotifications?: boolean;
  showSearch?: boolean;
  onNotificationPress?: () => void;
  onSearchPress?: () => void;
  userAvatar?: string;
  userName?: string;
}

export default function ModernHeader({
  title,
  subtitle,
  showNotifications = true,
  showSearch = true,
  onNotificationPress,
  onSearchPress,
  userAvatar,
  userName
}: ModernHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
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
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        )}
      </View>
      
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.m,
    paddingBottom: spacing.m,
    backgroundColor: theme.colors.background,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: 4,
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