import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Alert, Platform, I18nManager, TouchableOpacity, Pressable } from 'react-native';
import { Text, List, Switch, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Bell, 
  Globe, 
  Palette, 
  DollarSign, 
  HelpCircle, 
  Shield, 
  FileText,
  ChevronRight,
  ChevronLeft,
  LogOut
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation(['settings', 'common']);
  const { language, setLanguage } = useAppStore(state => ({
    language: state.language,
    setLanguage: state.setLanguage,
  }));
  const { theme, isDark, toggleTheme } = useAppTheme();
  const setUser = useAppStore(state => state.setUser);
  const setAuthenticated = useAppStore(state => state.setAuthenticated);
  const { profile } = useUserProfile();

  const handleLogout = async () => {
    Alert.alert(
      t('logoutConfirmTitle', { ns: 'settings' }),
      t('logoutConfirmMessage', { ns: 'settings' }),
      [
        {
          text: t('cancel', { ns: 'common' }),
          style: 'cancel'
        },
        {
          text: t('logout', { ns: 'common' }),
          style: 'destructive',
          onPress: async () => {
            try {              
              // Get current session before logout
              const { data: sessionBefore } = await supabase.auth.getSession();              
              // Sign out from Supabase...');
              const { error } = await supabase.auth.signOut();
              
              if (error) {
                console.error('❌ Supabase signOut error:', error);
                Alert.alert(t('error', { ns: 'common' }), error.message);
                return;
              }              
              // Verify session was cleared
              const { data: sessionAfter } = await supabase.auth.getSession();              
              // Clear user state              setUser(null);
              setAuthenticated(false);              
              // For web, try different navigation approaches
              if (Platform.OS === 'web') {
                // Try multiple navigation methods for web
                try {                  router.replace('/(auth)');
                } catch (navError) {
                  console.error('❌ Navigation error, trying push instead:', navError);
                  router.push('/(auth)');
                }
              } else {
                router.replace('/(auth)');
              }              
              // Additional verification after a short delay
              setTimeout(async () => {
                const { data: finalSession } = await supabase.auth.getSession();              }, 1000);
              
            } catch (error: any) {
              console.error('💥 Unexpected error during logout:', error);
              console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
              });
              Alert.alert(t('error', { ns: 'common' }), error.message || 'Unknown error');
            }
          }
        }
      ]
    );
  };

  // Simple fallback logout for web debugging
  const handleSimpleLogout = async () => {    try {
      await supabase.auth.signOut();
      setUser(null);
      setAuthenticated(false);
      
      // Force page reload on web as fallback
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.replace('/(auth)');
      }
    } catch (error) {
      console.error('Simple logout error:', error);
    }
  };

  const settingsItems = [
    {
      key: 'profile',
      icon: User,
      onPress: () => router.push('/profile'),
    },
    {
      key: 'notifications',
      icon: Bell,
      onPress: () => router.push('/notifications'),
    },
    {
      key: 'language',
      icon: Globe,
      onPress: () => router.push('/language'),
    },
    {
      key: 'theme',
      icon: Palette,
      onPress: toggleTheme,
      showSwitch: true,
      switchValue: isDark,
      description: t(isDark ? 'theme.darkTheme.title' : 'theme.lightTheme.title')
    },
    {
      key: 'currency',
      icon: DollarSign,
      onPress: () => router.push('/currency'),
    }
  ];

  const supportItems = [
    {
      key: 'support',
      icon: HelpCircle,
      onPress: () => router.push('/support')
    },
    {
      key: 'privacy',
      icon: Shield,
      onPress: () => router.push('/privacy')
    },
    {
      key: 'terms',
      icon: FileText,
      onPress: () => router.push('/terms')
    }
  ];

  const renderSettingItem = (item: any, index: number, total: number) => {
    const IconComponent = item.icon;
    const title = t(`${item.key}.title`);
    const description = item.description || t(`${item.key}.description`);
    
    return (
      <View key={item.key}>
        <List.Item
          title={title}
          description={description}
          titleStyle={[styles.itemTitle, { color: theme.colors.onSurface }]}
          descriptionStyle={[styles.itemDescription, { color: theme.colors.onSurfaceVariant }]}
          left={() => (
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
              <IconComponent size={24} color={theme.colors.primary} />
            </View>
          )}
          right={() => (
            item.showSwitch ? (
              <View style={styles.switchContainer}>
                <Switch
                  value={item.switchValue}
                  onValueChange={item.onPress}
                  color={theme.colors.primary}
                />
              </View>
            ) : (
              <View style={styles.chevronContainer}>
                <ChevronLeft size={20} color={theme.colors.onSurfaceVariant} />
              </View>
            )
          )}
          onPress={!item.showSwitch ? item.onPress : undefined}
          style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
        />
        {index < total - 1 && <Divider style={styles.divider} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title={t('title')}
        showNotifications={true}
        showProfile={true}
        variant="dark"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <List.Item
            style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push('/profile')}
            left={() => (
              <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primaryContainer }]}>
                <User size={32} color={theme.colors.primary} />
              </View>
            )}
            title={t('profile.myProfile')}
            description={profile?.email || t('profile.loadingEmail')}
            titleStyle={[styles.profileName, { color: theme.colors.onSurface }]}
            descriptionStyle={[styles.profileEmail, { color: theme.colors.onSurfaceVariant }]}
            right={() => <ChevronLeft size={20} color={theme.colors.onSurfaceVariant} />}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            {t('appSettings')}
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
            {settingsItems.map((item, index) => renderSettingItem(item, index, settingsItems.length))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            {t('helpSection')}
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
            {supportItems.map((item, index) => renderSettingItem(item, index, supportItems.length))}
          </View>
        </View>

        {/* RTL Debug Section (Android only) */}
        {Platform.OS === 'android' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              {t('debug.title', { ns: 'settings' })}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
              <List.Item
                title={t('debug.rtlStatus', { ns: 'settings' })}
                description={`${t('debug.isRTL', { ns: 'settings' })}: ${I18nManager.isRTL ? t('debug.enabled', { ns: 'settings' }) : t('debug.disabled', { ns: 'settings' })} | ${t('debug.allowRTL', { ns: 'settings' })}: ${I18nManager.allowRTL ? t('debug.enabled', { ns: 'settings' }) : t('debug.disabled', { ns: 'settings' })}`}
                titleStyle={[styles.itemTitle, { color: theme.colors.onSurface }]}
                descriptionStyle={[styles.itemDescription, { color: theme.colors.onSurfaceVariant }]}
                left={() => (
                  <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
                    <Globe size={24} color={theme.colors.primary} />
                  </View>
                )}
              />
              <Divider style={styles.divider} />
              <List.Item
                title={t('debug.platform', { ns: 'settings' })}
                description={`${t('debug.platform', { ns: 'settings' })}: ${Platform.OS} | ${t('debug.platformVersion', { ns: 'settings' })}: ${Platform.Version}`}
                titleStyle={[styles.itemTitle, { color: theme.colors.onSurface }]}
                descriptionStyle={[styles.itemDescription, { color: theme.colors.onSurfaceVariant }]}
                left={() => (
                  <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.secondary}20` }]}>
                    <Shield size={24} color={theme.colors.secondary} />
                  </View>
                )}
              />
            </View>
          </View>
        )}

        {/* Logout Section */}
        <View style={styles.section}>
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
            <List.Item
              title={t('logout', { ns: 'common' })}
              titleStyle={[styles.itemTitle, { color: '#f44336' }]}
              left={() => (
                <View style={[styles.iconContainer, { backgroundColor: '#f4433620' }]}>
                  <LogOut size={24} color="#f44336" />
                </View>
              )}
              onPress={handleLogout}
              style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
            />
            {/* Web Debug Logout - only show on web */}
            {Platform.OS === 'web' && (
              <>
                <Divider style={styles.divider} />
                <List.Item
                  title={t('debug.logoutDebug', { ns: 'settings' })}
                  description={t('debug.logoutDebugDesc', { ns: 'settings' })}
                  titleStyle={[styles.itemTitle, { color: '#ff9800' }]}
                  descriptionStyle={[styles.itemDescription, { color: theme.colors.onSurfaceVariant }]}
                  left={() => (
                    <View style={[styles.iconContainer, { backgroundColor: '#ff980020' }]}>
                      <LogOut size={24} color="#ff9800" />
                    </View>
                  )}
                  onPress={handleSimpleLogout}
                  style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
                />
              </>
            )}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <View style={[styles.appInfoCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.appName, { color: theme.colors.onSurface }]}>
              {t('propertyManagementSystem', { ns: 'common' })}
            </Text>
            <Text style={[styles.appVersion, { color: theme.colors.onSurfaceVariant }]}>
              {t('version', { ns: 'common' })} 1.0.0
            </Text>
            <Text style={[styles.appDescription, { color: theme.colors.onSurfaceVariant }]}>
              {t('propertyManagementSystemDescription', { ns: 'common' })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileSection: {
    marginVertical: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginLeft: 8, // Add spacing on the left side
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'right',
  },
  sectionCard: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginLeft: 8, // Add spacing on the left side
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
  },
  itemDescription: {
    fontSize: 14,
    textAlign: 'right',
  },
  divider: {
    marginLeft: 80,
  },
  switchContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 48,
    marginRight: 8,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    paddingRight: 8,
  },
  appInfoCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  appDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
