import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, RadioButton, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { rtlStyles } from '@/lib/rtl';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/useTranslation';
import { Globe } from 'lucide-react-native';
import ModernCard from '@/components/ModernCard';
import ModernHeader from '@/components/ModernHeader';
import type { SupportedLanguage } from '@/lib/i18n';

type LanguageOption = {
  name: string;
  nativeName: string;
  description: string;
  flag?: string;
};

const supportedLanguages: SupportedLanguage[] = ['ar', 'en'];

export default function LanguageSelectionScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { settings, changeLanguage, getCurrentLanguage } = useAppStore();
  const { t, i18n } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const [loading, setLoading] = useState(false);

  const languageOptions = useMemo(() => {
    const options = t('language.options', {
      returnObjects: true,
    }) as Record<SupportedLanguage, LanguageOption>;

    return supportedLanguages
      .map((code) => ({ code, ...(options?.[code] ?? {}) }))
      .filter((option) => option.name);
  }, [t, i18n.language]);

  const selectedLanguage = settings.language as SupportedLanguage | undefined;

  const handleLanguageSelect = async (languageCode: SupportedLanguage) => {
    if (loading || languageCode === getCurrentLanguage()) {
      return;
    }

    setLoading(true);

    try {
      await changeLanguage(languageCode);
      setTimeout(() => {
        setLoading(false);
        router.back();
      }, 400);
    } catch (error) {
      console.error('Failed to change language:', error);
      setLoading(false);
      Alert.alert(
        t('language.confirmChange.title'),
        t('language.confirmChange.error'),
        [{ text: tCommon('ok') }]
      );
    }
  };

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

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('language.title')}
        showBackButton
        onBackButtonPress={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ModernCard
          title={t('language.choose')}
          icon={<Globe size={24} color={theme.colors.primary} />}
        >
          <Text style={[styles.description, rtlStyles.textLeft]}>
            {t('language.description')}
          </Text>
        </ModernCard>

        <ModernCard title={t('language.available')}>
          <RadioButton.Group
            onValueChange={(value) => handleLanguageSelect(value as SupportedLanguage)}
            value={selectedLanguage ?? 'en'}
          >
            {languageOptions.map((lang) => (
              <List.Item
                key={lang.code}
                title={`${lang.flag ?? ''} ${lang.name} (${lang.nativeName})`.trim()}
                description={lang.description}
                style={styles.listItem}
                titleStyle={[styles.languageTitle, rtlStyles.textLeft]}
                descriptionStyle={[styles.languageDescription, rtlStyles.textLeft]}
                onPress={() => handleLanguageSelect(lang.code)}
                right={() => (
                  <RadioButton.Android
                    value={lang.code}
                    status={selectedLanguage === lang.code ? 'checked' : 'unchecked'}
                    onPress={() => handleLanguageSelect(lang.code)}
                    color={theme.colors.primary}
                  />
                )}
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


