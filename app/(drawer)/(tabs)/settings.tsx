import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Alert, Platform, I18nManager, TouchableOpacity, Pressable } from 'react-native';
import { Text, List, Switch, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
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
  LogOut
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode, language, setLanguage } = useAppStore();
  const setUser = useAppStore(state => state.setUser);
  const setAuthenticated = useAppStore(state => state.setAuthenticated);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من رغبتك في تسجيل الخروج؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚀 Starting logout process...');
              console.log('Platform:', Platform.OS);
              
              // Get current session before logout
              const { data: sessionBefore } = await supabase.auth.getSession();
              console.log('Session before logout:', sessionBefore.session ? 'EXISTS' : 'NONE');
              
              // Sign out from Supabase
              console.log('📤 Calling supabase.auth.signOut()...');
              const { error } = await supabase.auth.signOut();
              
              if (error) {
                console.error('❌ Supabase signOut error:', error);
                Alert.alert('خطأ', `حدث خطأ أثناء تسجيل الخروج: ${error.message}`);
                return;
              }
              
              console.log('✅ Supabase signOut successful');
              
              // Verify session was cleared
              const { data: sessionAfter } = await supabase.auth.getSession();
              console.log('Session after logout:', sessionAfter.session ? 'STILL EXISTS' : 'CLEARED');
              
              // Clear user state
              console.log('🗑️ Clearing user state...');
              setUser(null);
              setAuthenticated(false);
              
              console.log('🧭 Navigating to auth screen...');
              
              // For web, try different navigation approaches
              if (Platform.OS === 'web') {
                // Try multiple navigation methods for web
                try {
                  console.log('🌐 Web platform detected, using replace navigation');
                  router.replace('/(auth)');
                } catch (navError) {
                  console.error('❌ Navigation error, trying push instead:', navError);
                  router.push('/(auth)');
                }
              } else {
                router.replace('/(auth)');
              }
              
              console.log('✅ Logout process completed successfully');
              
              // Additional verification after a short delay
              setTimeout(async () => {
                const { data: finalSession } = await supabase.auth.getSession();
                console.log('Final session check:', finalSession.session ? 'STILL EXISTS - PROBLEM!' : 'CLEARED - SUCCESS');
              }, 1000);
              
            } catch (error: any) {
              console.error('💥 Unexpected error during logout:', error);
              console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
              });
              Alert.alert('خطأ', `حدث خطأ غير متوقع: ${error.message || 'Unknown error'}`);
            }
          }
        }
      ]
    );
  };

  // Simple fallback logout for web debugging
  const handleSimpleLogout = async () => {
    console.log('🔧 SIMPLE LOGOUT FOR DEBUGGING');
    try {
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
      title: 'الملف الشخصي',
      description: 'إدارة معلوماتك الشخصية',
      icon: User,
      onPress: () => router.push('/profile'),
      showSwitch: false
    },
    {
      title: 'الإشعارات',
      description: 'إعدادات التنبيهات والإشعارات',
      icon: Bell,
      onPress: () => router.push('/notifications'),
      showSwitch: false
    },
    {
      title: 'اللغة',
      description: 'العربية',
      icon: Globe,
      onPress: () => router.push('/language'),
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
      onPress: () => router.push('/currency'),
      showSwitch: false
    }
  ];

  const supportItems = [
    {
      title: 'المساعدة والدعم',
      description: 'الحصول على المساعدة',
      icon: HelpCircle,
      onPress: () => router.push('/support')
    },
    {
      title: 'الخصوصية',
      description: 'سياسة الخصوصية',
      icon: Shield,
      onPress: () => router.push('/privacy')
    },
    {
      title: 'الشروط والأحكام',
      description: 'شروط الاستخدام',
      icon: FileText,
      onPress: () => router.push('/terms')
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
          <List.Item
            style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push('/profile')}
            left={() => (
              <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primaryContainer }]}>
                <User size={32} color={theme.colors.primary} />
              </View>
            )}
            title="مدير النظام"
            description="admin@realestate.com"
            titleStyle={[styles.profileName, { color: theme.colors.onSurface }]}
            descriptionStyle={[styles.profileEmail, { color: theme.colors.onSurfaceVariant }]}
            right={() => <ChevronRight size={20} color={theme.colors.onSurfaceVariant} />}
          />
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

        {/* RTL Debug Section (Android only) */}
        {Platform.OS === 'android' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              معلومات التخطيط (Android Debug)
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
              <List.Item
                title="حالة RTL"
                description={`isRTL: ${I18nManager.isRTL ? 'مفعل' : 'معطل'} | allowRTL: ${I18nManager.allowRTL ? 'مفعل' : 'معطل'}`}
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
                title="المنصة"
                description={`Platform: ${Platform.OS} | Version: ${Platform.Version}`}
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
              title="تسجيل الخروج"
              description="الخروج من التطبيق"
              titleStyle={[styles.itemTitle, { color: '#f44336' }]}
              descriptionStyle={[styles.itemDescription, { color: theme.colors.onSurfaceVariant }]}
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
                  title="تسجيل الخروج (تصحيح - ويب)"
                  description="خروج مبسط للويب"
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