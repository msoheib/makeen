import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Text, List, Switch, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { 
  User, 
  Bell, 
  Globe, 
  Palette, 
  DollarSign, 
  HelpCircle, 
  Shield, 
  FileText,
  ChevronRight
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode, language, setLanguage } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const settingsItems = [
    {
      title: 'الملف الشخصي',
      description: 'إدارة معلوماتك الشخصية',
      icon: User,
      onPress: () => console.log('Navigate to profile'),
      showSwitch: false
    },
    {
      title: 'الإشعارات',
      description: 'إعدادات التنبيهات والإشعارات',
      icon: Bell,
      onPress: () => console.log('Navigate to notifications'),
      showSwitch: false
    },
    {
      title: 'اللغة',
      description: 'العربية',
      icon: Globe,
      onPress: () => console.log('Navigate to language'),
      showSwitch: false
    },
    {
      title: 'المظهر الداكن',
      description: isDarkMode ? 'مفعل' : 'معطل',
      icon: Palette,
      onPress: toggleDarkMode,
      showSwitch: true,
      switchValue: isDarkMode
    },
    {
      title: 'العملة',
      description: 'ريال سعودي (SAR)',
      icon: DollarSign,
      onPress: () => console.log('Navigate to currency'),
      showSwitch: false
    }
  ];

  const supportItems = [
    {
      title: 'المساعدة والدعم',
      description: 'الحصول على المساعدة',
      icon: HelpCircle,
      onPress: () => console.log('Navigate to support')
    },
    {
      title: 'الخصوصية',
      description: 'سياسة الخصوصية',
      icon: Shield,
      onPress: () => console.log('Navigate to privacy')
    },
    {
      title: 'الشروط والأحكام',
      description: 'شروط الاستخدام',
      icon: FileText,
      onPress: () => console.log('Navigate to terms')
    }
  ];

  const renderSettingItem = (item: any, index: number) => {
    const IconComponent = item.icon;
    
    return (
      <List.Item
        key={index}
        title={item.title}
        description={item.description}
        titleStyle={[styles.itemTitle, { color: theme.colors.onSurface }]}
        descriptionStyle={[styles.itemDescription, { color: theme.colors.onSurfaceVariant }]}
        left={() => (
          <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
            <IconComponent size={24} color={theme.colors.primary} />
          </View>
        )}
        right={() => (
          item.showSwitch ? (
            <Switch
              value={item.switchValue}
              onValueChange={item.onPress}
              color={theme.colors.primary}
            />
          ) : (
            <ChevronRight size={20} color={theme.colors.onSurfaceVariant} />
          )
        )}
        onPress={!item.showSwitch ? item.onPress : undefined}
        style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="الإعدادات" 
        showNotifications={true}
        showProfile={true}
        variant="dark"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.profileInfo}>
              <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primaryContainer }]}>
                <User size={32} color={theme.colors.primary} />
              </View>
              <View style={styles.profileDetails}>
                <Text style={[styles.profileName, { color: theme.colors.onSurface }]}>
                  مدير النظام
                </Text>
                <Text style={[styles.profileEmail, { color: theme.colors.onSurfaceVariant }]}>
                  admin@realestate.com
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.onSurfaceVariant} />
          </View>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            الإعدادات العامة
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
            {settingsItems.map((item, index) => (
              <View key={index}>
                {renderSettingItem(item, index)}
                {index < settingsItems.length - 1 && (
                  <Divider style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            الدعم والمساعدة
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
            {supportItems.map((item, index) => (
              <View key={index}>
                <List.Item
                  title={item.title}
                  description={item.description}
                  titleStyle={[styles.itemTitle, { color: theme.colors.onSurface }]}
                  descriptionStyle={[styles.itemDescription, { color: theme.colors.onSurfaceVariant }]}
                  left={() => (
                    <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.secondary}20` }]}>
                      <item.icon size={24} color={theme.colors.secondary} />
                    </View>
                  )}
                  right={() => <ChevronRight size={20} color={theme.colors.onSurfaceVariant} />}
                  onPress={item.onPress}
                  style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
                />
                {index < supportItems.length - 1 && (
                  <Divider style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <View style={[styles.appInfoCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.appName, { color: theme.colors.onSurface }]}>
              نظام إدارة العقارات
            </Text>
            <Text style={[styles.appVersion, { color: theme.colors.onSurfaceVariant }]}>
              الإصدار 1.0.0
            </Text>
            <Text style={[styles.appDescription, { color: theme.colors.onSurfaceVariant }]}>
              تطبيق شامل لإدارة العقارات والمستأجرين والمالية
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