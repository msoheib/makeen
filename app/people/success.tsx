import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from 'react-native-paper';
import ModernHeader from '@/components/ModernHeader';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { rtlStyles, isRTL } from '@/lib/rtl';

export default function SuccessPersonScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation('people');
  const params = useLocalSearchParams<{ id?: string; name?: string; email?: string }>();
  const fullName = params.name || '';
  const email = params.email || '';
  const id = params.id || '';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader
        title={t('success.title', { defaultValue: isRTL() ? 'تم إنشاء الحساب' : 'Account Created' })}
        showBackButton
        showNotifications={false}
        onBackPress={() => router.back()}
      />
      <View style={styles.content}>
        <Text style={[
          styles.title,
          { color: theme.colors.onBackground, writingDirection: isRTL() ? 'rtl' : 'ltr' },
          rtlStyles.textAlign('center')
        ]}> 
          {t('success.message', { defaultValue: isRTL() ? '✅ تم إنشاء حساب المستخدم بنجاح' : '✅ User account created successfully' })}
        </Text>
        {!!fullName && (
          <Text style={[
            styles.subtitle,
            { color: theme.colors.onSurfaceVariant, writingDirection: isRTL() ? 'rtl' : 'ltr' },
            rtlStyles.textAlign('right')
          ]}> 
            {t('success.nameLabel', { defaultValue: isRTL() ? 'الاسم:' : 'Name:' })} {fullName}
          </Text>
        )}
        {!!email && (
          <Text style={[
            styles.subtitle,
            { color: theme.colors.onSurfaceVariant, writingDirection: isRTL() ? 'rtl' : 'ltr' },
            rtlStyles.textAlign('right')
          ]}> 
            {t('success.emailLabel', { defaultValue: isRTL() ? 'البريد الإلكتروني:' : 'Email:' })} {email}
          </Text>
        )}

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => router.replace('/people/add')}
            style={styles.button}
          >
            {t('success.backToForm', { defaultValue: isRTL() ? 'العودة إلى النموذج' : 'Back to Form' })}
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.replace('/people/add')}
            style={styles.button}
          >
            {t('success.addAnotherUser', { defaultValue: isRTL() ? 'إضافة مستخدم آخر' : 'Add Another User' })}
          </Button>
          <Button
            mode="text"
            onPress={() => router.replace('/(tabs)/tenants')}
            style={styles.button}
          >
            {t('success.backToList', { defaultValue: isRTL() ? 'العودة إلى القائمة' : 'Back to List' })}
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 6
  },
  actions: {
    marginTop: 16
  },
  button: {
    marginBottom: 8
  }
});


