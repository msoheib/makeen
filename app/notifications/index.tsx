import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Switch, List, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/useTranslation';
import { ArrowLeft, Bell, Tool, DollarSign, FileText, Settings } from 'lucide-react-native';
import ModernCard from '@/components/ModernCard';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { settings, updateNotificationSettings } = useAppStore();
  const { t } = useTranslation('settings');

  const notificationTypes = [
    {
      key: 'maintenanceRequests' as const,
      title: t('notifications.maintenanceRequests.title'),
      description: t('notifications.maintenanceRequests.description'),
      icon: Tool,
    },
    {
      key: 'paymentReminders' as const,
      title: t('notifications.paymentReminders.title'),
      description: t('notifications.paymentReminders.description'),
      icon: DollarSign,
    },
    {
      key: 'contractExpirations' as const,
      title: t('notifications.contractExpirations.title'),
      description: t('notifications.contractExpirations.description'),
      icon: FileText,
    },
    {
      key: 'systemUpdates' as const,
      title: t('notifications.systemUpdates.title'),
      description: t('notifications.systemUpdates.description'),
      icon: Settings,
    },
  ];

  const handleToggle = (key: keyof typeof settings.notifications) => {
    updateNotificationSettings({
      [key]: !settings.notifications[key],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('notifications.notificationSettings')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* General Info */}
        <ModernCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Bell size={24} color={theme.colors.primary} />
            <Text style={styles.infoTitle}>{t('notifications.manageNotifications')}</Text>
          </View>
          <Text style={styles.infoDescription}>
            {t('notifications.manageDescription')}
          </Text>
        </ModernCard>

        {/* Notification Types */}
        <ModernCard style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>{t('notifications.notificationTypes')}</Text>
          {notificationTypes.map((item, index) => (
            <View key={item.key}>
              <List.Item
                title={item.title}
                description={item.description}
                left={() => (
                  <View style={styles.iconContainer}>
                    <item.icon size={20} color={theme.colors.primary} />
                  </View>
                )}
                right={() => (
                  <Switch
                    value={settings.notifications[item.key]}
                    onValueChange={() => handleToggle(item.key)}
                    color={theme.colors.primary}
                  />
                )}
                style={[
                  styles.listItem,
                  index < notificationTypes.length - 1 && styles.listItemBorder
                ]}
                titleStyle={styles.listItemTitle}
                descriptionStyle={styles.listItemDescription}
                onPress={() => handleToggle(item.key)}
              />
            </View>
          ))}
        </ModernCard>

        {/* Push Notification Settings */}
        <ModernCard style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>{t('notifications.pushNotificationStatus')}</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
              <Text style={styles.statusText}>{t('notifications.pushEnabled')}</Text>
            </View>
            <Text style={styles.statusDescription}>
              {t('notifications.pushDescription')}
            </Text>
          </View>
        </ModernCard>

        {/* Advanced Preferences */}
        <ModernCard style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>{t('notifications.advancedSettings')}</Text>
          <List.Item
            title={t('notifications.notificationPreferences.title')}
            description={t('notifications.notificationPreferences.description')}
            left={() => (
              <View style={styles.iconContainer}>
                <Settings size={20} color={theme.colors.primary} />
              </View>
            )}
            right={() => (
              <IconButton
                icon={() => <Settings size={20} color={theme.colors.onSurfaceVariant} />}
                onPress={() => router.push('/notifications/preferences')}
              />
            )}
            style={[styles.listItem]}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
            onPress={() => router.push('/notifications/preferences')}
          />
          
          <List.Item
            title={t('notifications.notificationCenter.title')}
            description={t('notifications.notificationCenter.description')}
            left={() => (
              <View style={styles.iconContainer}>
                <Bell size={20} color={theme.colors.primary} />
              </View>
            )}
            right={() => (
              <IconButton
                icon={() => <Bell size={20} color={theme.colors.onSurfaceVariant} />}
                onPress={() => router.push('/notifications/center')}
              />
            )}
            style={[styles.listItem]}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
            onPress={() => router.push('/notifications/center')}
          />
        </ModernCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingTop: spacing.l,
    paddingBottom: spacing.m,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginRight: 48, // Account for back button space
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    padding: spacing.m,
  },
  infoCard: {
    marginBottom: spacing.m,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginLeft: spacing.s,
  },
  infoDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  settingsCard: {
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
  },
  listItem: {
    paddingHorizontal: 0,
    paddingVertical: spacing.s,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  listItemDescription: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },
  statusContainer: {
    marginTop: spacing.s,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.s,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  statusDescription: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  futureCard: {
    marginBottom: spacing.xl,
    backgroundColor: `${theme.colors.secondary}08`,
    borderColor: `${theme.colors.secondary}20`,
    borderWidth: 1,
  },
  futureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: spacing.s,
  },
  futureDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
}); 