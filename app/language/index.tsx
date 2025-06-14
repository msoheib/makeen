import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, IconButton, RadioButton, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing, rtlStyles } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/useTranslation';
import { ArrowLeft, Globe, Check } from 'lucide-react-native';
import ModernCard from '@/components/ModernCard';
import ModernHeader from '@/components/ModernHeader';

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const { settings, changeLanguage, getCurrentLanguage, isRTL } = useAppStore();
  const { t } = useTranslation('settings');
  const [loading, setLoading] = useState(false);

  const languages = [
    {
      code: 'en' as const,
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      description: 'Default language for the application',
    },
    {
      code: 'ar' as const,
      name: 'Arabic',
      nativeName: 'العربية',
      flag: '🇸🇦',
      description: 'Arabic language with full RTL support',
    },
  ];

  const handleLanguageSelect = async (languageCode: 'en' | 'ar') => {
    console.log('=== handleLanguageSelect called ===');
    console.log('Language code:', languageCode);
    console.log('Current language:', getCurrentLanguage());
    console.log('Loading state:', loading);
    
    if (loading || languageCode === getCurrentLanguage()) {
      console.log('Returning early - loading or same language');
      return;
    }
    
    // Test simple alert first
    try {
      console.log('About to show Alert...');
      Alert.alert('Test', 'This is a test alert');
      console.log('Alert shown successfully');
    } catch (error) {
      console.error('Alert error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('language.title')}
        showBackButton={true}
        onBackButtonPress={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ModernCard
          title={t('language.choose')}
          icon={<Globe size={24} color={theme.colors.primary} />}
        >
          <Text style={[styles.description, rtlStyles.textLeft]}>{t('language.description')}</Text>
        </ModernCard>
        
        <ModernCard title={t('language.available')}>
          <RadioButton.Group 
            onValueChange={(value) => handleLanguageSelect(value as 'en' | 'ar')} 
            value={settings.language}
          >
            {languages.map((lang) => (
              <List.Item
                key={lang.code}
                title={`${lang.flag} ${lang.name} (${lang.nativeName})`}
                description={lang.description}
                style={styles.listItem}
                titleStyle={[styles.languageTitle, rtlStyles.textLeft]}
                descriptionStyle={[styles.languageDescription, rtlStyles.textLeft]}
                onPress={() => handleLanguageSelect(lang.code)}
                right={() => 
                  <RadioButton.Android 
                    value={lang.code} 
                    status={settings.language === lang.code ? 'checked' : 'unchecked'}
                    onPress={() => handleLanguageSelect(lang.code)}
                    color={theme.colors.primary}
                  />
                }
              />
            ))}
          </RadioButton.Group>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
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
  scrollContent: {
    padding: spacing.m,
  },
  description: {
    marginBottom: spacing.m,
    color: theme.colors.onSurfaceVariant,
  },
  listItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    marginBottom: spacing.s,
    paddingVertical: spacing.s,
  },
  languageTitle: {
    fontWeight: 'bold',
  },
  languageDescription: {
    fontSize: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 