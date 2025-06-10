import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Surface, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { Settings, User, Bell, Globe, Moon, DollarSign, CircleHelp as HelpCircle, MessageSquare, FileText, ShieldCheck, LogOut, Building2, Users, CreditCard, ChartBar as BarChart3, PenTool as Tool } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';

export default function MoreScreen() {
  const router = useRouter();
  const setUser = useAppStore(state => state.setUser);
  const setAuthenticated = useAppStore(state => state.setAuthenticated);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setAuthenticated(false);
      router.replace('/(auth)');
    } catch (error) {
      console.error('Error signing out:', error);
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
              left={props => <Users {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/people')}
            />
            <List.Item
              title="Maintenance"
              left={props => <Tool {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/maintenance')}
            />
            <List.Item
              title="Finance"
              left={props => <CreditCard {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/finance')}
            />
            <List.Item
              title="Documents"
              left={props => <FileText {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/documents')}
            />
          </List.Section>
        </ModernCard>

        {/* Account Settings */}
        <ModernCard style={styles.section}>
          <List.Section>
            <List.Subheader>Account Settings</List.Subheader>
            <List.Item
              title="Profile"
              left={props => <User {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/profile')}
            />
            <List.Item
              title="Notifications"
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
              description="English"
              left={props => <Globe {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/language')}
            />
            <List.Item
              title="Theme"
              description="Light"
              left={props => <Moon {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/theme')}
            />
            <List.Item
              title="Currency"
              description="USD"
              left={props => <DollarSign {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/currency')}
            />
          </List.Section>
        </ModernCard>

        {/* Support */}
        <ModernCard style={styles.section}>
          <List.Section>
            <List.Subheader>Support</List.Subheader>
            <List.Item
              title="Help Center"
              left={props => <HelpCircle {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/help')}
            />
            <List.Item
              title="Contact Support"
              left={props => <MessageSquare {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/support')}
            />
            <List.Item
              title="Terms of Service"
              left={props => <FileText {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/terms')}
            />
            <List.Item
              title="Privacy Policy"
              left={props => <ShieldCheck {...props} size={24} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/privacy')}
            />
          </List.Section>
        </ModernCard>

        {/* Danger Zone */}
        <ModernCard style={[styles.section, styles.dangerZone]}>
          <List.Section>
            <List.Subheader style={styles.dangerZoneHeader}>Account</List.Subheader>
            <List.Item
              title="Sign Out"
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