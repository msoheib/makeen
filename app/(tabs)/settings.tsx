import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Surface, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { spacing, shadows } from '@/lib/theme';
import { 
  Settings, 
  User, 
  Bell, 
  Globe, 
  Moon, 
  DollarSign,
  HelpCircle,
  MessageSquare,
  FileText,
  ShieldCheck,
  LogOut
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
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
    <ScrollView style={styles.container}>
      <Surface style={[styles.section, shadows.small]}>
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
      </Surface>

      <Surface style={[styles.section, shadows.small]}>
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
      </Surface>

      <Surface style={[styles.section, shadows.small]}>
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
      </Surface>

      <Surface style={[styles.section, styles.dangerZone, shadows.small]}>
        <List.Section>
          <List.Subheader style={styles.dangerZoneHeader}>Danger Zone</List.Subheader>
          <List.Item
            title="Sign Out"
            titleStyle={styles.signOutText}
            left={props => <LogOut {...props} size={24} color={theme.colors.error} />}
            onPress={handleSignOut}
          />
        </List.Section>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    margin: spacing.m,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dangerZone: {
    marginBottom: spacing.xl,
  },
  dangerZoneHeader: {
    color: theme.colors.error,
  },
  signOutText: {
    color: theme.colors.error,
  },
});