import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Surface, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { Settings, User, Bell, Globe, Moon, DollarSign, MessageSquare, FileText, ShieldCheck, LogOut, Building2, Users, CreditCard, ChartBar as BarChart3, PenTool as Tool, Settings2, Palette, HelpCircle, Shield, ArrowRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { useTranslation } from '@/lib/useTranslation';

export default function MoreScreen() {
  const router = useRouter();
  const { t, language, isRTL } = useTranslation('settings');
  const { settings, setUser, setAuthenticated } = useAppStore();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout failed: ' + error.message);
    }
  };

  const getThemeDisplayName = (themeMode: string) => {
    switch (themeMode) {
      case 'light': return t('themeDesc.light');
      case 'dark': return t('themeDesc.dark');
      case 'system': return t('themeDesc.system');
      default: return t('themeDesc.light');
    }
  };

  const getLanguageDisplayName = (languageCode: string) => {
    switch (languageCode) {
      case 'en': return t('language.languages.en');
      case 'ar': return t('language.languages.ar');
      default: return t('language.languages.en');
    }
  };

  // Debug function to test translations
  const testTranslation = () => {
    try {
      console.log('=== Translation Test Started ===');
      console.log('Current language:', language);
      console.log('Is RTL:', isRTL);
      
      // Test cross-namespace translations
      const commonUserTranslation = t('common:user');
      console.log('common:user ->', commonUserTranslation);
      
      // Test current namespace translations  
      const settingsTitleTranslation = t('title');
      console.log('settings:title ->', settingsTitleTranslation);
      
      // Test if i18n is working
      const basicTest = t('language.title');
      console.log('language.title ->', basicTest);
      
      const currentTranslations = [
        `Language: ${language}`,
        `RTL: ${isRTL}`,
        `common:user -> "${commonUserTranslation}"`,
        `settings.title -> "${settingsTitleTranslation}"`,
        `language.title -> "${basicTest}"`
      ];
      
      console.log('Translation results:', currentTranslations);
      
      Alert.alert(
        'Translation Test Results',
        currentTranslations.join('\n'),
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Translation test error:', error);
      Alert.alert(
        'Translation Test Error',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const settingsSections = [
    {
      title: t('sections.account'),
      items: [
        {
          title: t('profile.title'),
          icon: <User size={24} color={theme.colors.primary} />,
          onPress: () => router.push('/profile'),
        },
        {
          title: t('notifications.title'),
          icon: <Bell size={24} color={theme.colors.primary} />,
          onPress: () => router.push('/notifications'),
        },
      ],
    },
    {
      title: t('sections.preferences'),
      items: [
        {
          title: t('language.title'),
          icon: <Globe size={24} color={theme.colors.primary} />,
          onPress: () => router.push('/language'),
        },
        {
          title: t('theme.title'),
          icon: <Palette size={24} color={theme.colors.primary} />,
          onPress: () => router.push('/theme'),
        },
        {
          title: t('currency.title'),
          icon: <DollarSign size={24} color={theme.colors.primary} />,
          onPress: () => router.push('/currency'),
        },
      ],
    },
    {
      title: t('sections.helpAndSupport'),
      items: [
        {
          title: t('help.title'),
          icon: <HelpCircle size={24} color={theme.colors.primary} />,
          onPress: () => router.push('/help'),
        },
        {
          title: t('support.title'),
          icon: <MessageSquare size={24} color={theme.colors.primary} />,
          onPress: () => router.push('/support'),
        },
      ],
    },
    {
      title: t('sections.legal'),
      items: [
        {
          title: t('privacy.title'),
          icon: <Shield size={24} color={theme.colors.primary} />,
          onPress: () => router.push('/privacy'),
        },
        {
          title: t('terms.title'),
          icon: <FileText size={24} color={theme.colors.primary} />,
          onPress: () => router.push('/terms'),
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('title')}
        subtitle={t('subtitle')}
        variant="dark"
        showNotifications
        isHomepage={false}
      />

      <ScrollView style={styles.content}>


        {settingsSections.map((section, sectionIndex) => (
          <ModernCard
            key={sectionIndex}
            title={section.title}
          >
            {section.items.map((item, itemIndex) => (
              <List.Item
                key={itemIndex}
                title={item.title}
                left={() => item.icon}
                right={() => <ArrowRight size={20} color={theme.colors.primary} />}
                onPress={item.onPress}
                style={styles.listItem}
              />
            ))}
          </ModernCard>
        ))}

        {/* Quick Access */}
        <ModernCard style={styles.section}>
          <List.Section>
            <List.Subheader>{t('quickAccess')}</List.Subheader>
            <List.Item
              title={t('people')}
              description={t('peopleDesc')}
              left={props => <Users {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/people')}
            />
            <List.Item
              title={t('maintenance')}
              description={t('maintenanceDesc')}
              left={props => <Tool {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/maintenance')}
            />
            <List.Item
              title={t('finance')}
              description={t('financeDesc')}
              left={props => <CreditCard {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/finance')}
            />
          </List.Section>
        </ModernCard>

        {/* Account Settings */}
        <ModernCard style={styles.section}>
          <List.Section>
            <List.Subheader>{t('accountSettings')}</List.Subheader>
            <List.Item
              title={t('myProfile')}
              description={settings.userProfile?.name || t('myProfileDesc')}
              left={props => <User {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/profile')}
            />
            <List.Item
              title={t('notifications')}
              description={
                settings.notifications?.enabled
                  ? `${Object.values(settings.notifications).filter(Boolean).length - 1} enabled`
                  : t('notificationsDesc')
              }
              left={props => <Bell {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/notifications')}
            />
          </List.Section>
        </ModernCard>

        {/* App Settings */}
        <ModernCard style={styles.section}>
          <List.Section>
            <List.Subheader>{t('appSettings')}</List.Subheader>
            <List.Item
              title={t('language')}
              description={getLanguageDisplayName(settings.language)}
              left={props => <Globe {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/language')}
            />
            <List.Item
              title={t('theme')}
              description={getThemeDisplayName(settings.theme)}
              left={props => <Moon {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/theme')}
            />
            <List.Item
              title={t('currency')}
              description={t('currencyDesc')}
              left={props => <DollarSign {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/currency')}
            />
          </List.Section>
        </ModernCard>

        {/* Support & Legal */}
        <ModernCard style={styles.section}>
          <List.Section>
            <List.Subheader>{t('supportAndLegal')}</List.Subheader>
            <List.Item
              title={t('contactSupport')}
              description={t('contactSupportDesc')}
              left={props => <MessageSquare {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/support')}
            />
            <List.Item
              title={t('termsOfService')}
              description={t('termsOfServiceDesc')}
              left={props => <FileText {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/terms')}
            />
            <List.Item
              title={t('privacyPolicy')}
              description={t('privacyPolicyDesc')}
              left={props => <ShieldCheck {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/privacy')}
            />
          </List.Section>
        </ModernCard>

        {/* App Information */}
        <ModernCard style={styles.section}>
          <List.Section>
            <List.Subheader>{t('appInformation')}</List.Subheader>
            <List.Item
              title={t('version')}
              description={t('versionDesc')}
              left={props => <Settings {...props} size={24} />}
            />
            <List.Item
              title={t('lastUpdated')}
              description={t('lastUpdatedDesc')}
              left={props => <FileText {...props} size={24} />}
            />
          </List.Section>
        </ModernCard>

        {/* Danger Zone */}
        <ModernCard style={[styles.section, styles.dangerZone]}>
          <List.Section>
            <List.Subheader style={styles.dangerZoneHeader}>{t('account')}</List.Subheader>
            <List.Item
              title={t('logout')}
              description="End your current session"
              left={props => <LogOut {...props} size={24} color={theme.colors.error} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={async () => {
                try {
                  const { error } = await supabase.auth.signOut();
                  if (error) throw error;
                  router.replace('/(auth)');
                } catch (error) {
                  console.error('Emergency logout error:', error);
                  alert('Emergency logout failed: ' + error.message);
                }
              }}
              titleStyle={styles.dangerText}
            />
          </List.Section>
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
  content: {
    flex: 1,
  },
  section: {
    margin: spacing.m,
    marginBottom: spacing.s,
  },
  dangerZone: {
    marginBottom: spacing.xl,
  },
  dangerZoneHeader: {
    color: theme.colors.onSurface,
  },
  dangerText: {
    color: theme.colors.error,
  },
  listItem: {
    paddingVertical: spacing.s,
  },
});