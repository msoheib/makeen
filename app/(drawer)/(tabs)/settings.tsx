import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Surface, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { Settings, User, Bell, Globe, Moon, DollarSign, MessageSquare, FileText, ShieldCheck, LogOut, Building2, Users, CreditCard, ChartBar as BarChart3, PenTool as Tool } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';

export default function MoreScreen() {
  const router = useRouter();
  const { settings, setUser, setAuthenticated } = useAppStore();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              
              setUser(null);
              setAuthenticated(false);
              router.replace('/(auth)');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };

  const getThemeDisplayName = (themeMode: string) => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'Light';
    }
  };

  const getLanguageDisplayName = (languageCode: string) => {
    switch (languageCode) {
      case 'en': return 'English';
      case 'ar': return 'العربية (Coming Soon)';
      default: return 'English';
    }
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Settings"
        variant="dark"
        showNotifications
      />

      <ScrollView style={styles.content}>
        {/* Quick Access */}
        <ModernCard style={styles.section}>
          <List.Section>
            <List.Subheader>Quick Access</List.Subheader>
            <List.Item
              title="People"
              description="Manage tenants, owners, and contacts"
              left={props => <Users {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/people')}
            />
            <List.Item
              title="Maintenance"
              description="Work orders and maintenance requests"
              left={props => <Tool {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/maintenance')}
            />
            <List.Item
              title="Finance"
              description="Vouchers, invoices, and accounts"
              left={props => <CreditCard {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/finance')}
            />
          </List.Section>
        </ModernCard>

        {/* Account Settings */}
        <ModernCard style={styles.section}>
          <List.Section>
            <List.Subheader>Account Settings</List.Subheader>
            <List.Item
              title="My Profile"
              description={settings.userProfile?.name || 'Set up your profile'}
              left={props => <User {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/profile')}
            />
            <List.Item
              title="Notifications"
              description={
                settings.notifications?.enabled
                  ? `${Object.values(settings.notifications).filter(Boolean).length - 1} enabled`
                  : 'Configure your notification preferences'
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
            <List.Subheader>App Settings</List.Subheader>
            <List.Item
              title="Language"
              description={getLanguageDisplayName(settings.language)}
              left={props => <Globe {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/language')}
            />
            <List.Item
              title="Theme"
              description={getThemeDisplayName(settings.theme)}
              left={props => <Moon {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/theme')}
            />
            <List.Item
              title="Currency"
              description="Saudi Riyal (SAR) - Default"
              left={props => <DollarSign {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/currency')}
            />
          </List.Section>
        </ModernCard>

        {/* Support & Legal */}
        <ModernCard style={styles.section}>
          <List.Section>
            <List.Subheader>Support & Legal</List.Subheader>
            <List.Item
              title="Contact Support"
              description="Get help via email"
              left={props => <MessageSquare {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/support')}
            />
            <List.Item
              title="Terms of Service"
              description="Read our terms and conditions"
              left={props => <FileText {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/terms')}
            />
            <List.Item
              title="Privacy Policy"
              description="How we protect your data"
              left={props => <ShieldCheck {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/privacy')}
            />
          </List.Section>
        </ModernCard>

        {/* App Information */}
        <ModernCard style={styles.section}>
          <List.Section>
            <List.Subheader>App Information</List.Subheader>
            <List.Item
              title="Version"
              description="1.0.0 (Beta)"
              left={props => <Settings {...props} size={24} />}
            />
            <List.Item
              title="Last Updated"
              description="December 21, 2024"
              left={props => <FileText {...props} size={24} />}
            />
          </List.Section>
        </ModernCard>

        {/* Danger Zone */}
        <ModernCard style={[styles.section, styles.dangerZone]}>
          <List.Section>
            <List.Subheader style={styles.dangerZoneHeader}>Account</List.Subheader>
            <List.Item
              title="Sign Out"
              description="Sign out of your account"
              titleStyle={styles.signOutText}
              left={props => <LogOut {...props} size={24} color={theme.colors.error} />}
              onPress={handleSignOut}
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
  signOutText: {
    color: theme.colors.error,
  },
});