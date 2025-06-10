import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, IconButton, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, Globe, Check } from 'lucide-react-native';
import ModernCard from '@/components/ModernCard';

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useAppStore();

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
      description: 'Arabic language support (Coming Soon)',
    },
  ];

  const handleLanguageSelect = (languageCode: 'en' | 'ar') => {
    updateSettings({ language: languageCode });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>Language</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Language Info */}
        <ModernCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Globe size={24} color={theme.colors.primary} />
            <Text style={styles.infoTitle}>Choose Your Language</Text>
          </View>
          <Text style={styles.infoDescription}>
            Select your preferred language for the app interface. Changes will take effect 
            immediately for supported languages.
          </Text>
        </ModernCard>

        {/* Language Options */}
        <ModernCard style={styles.languageCard}>
          <Text style={styles.sectionTitle}>Available Languages</Text>
          {languages.map((language, index) => (
            <View key={language.code}>
              <List.Item
                title={
                  <View style={styles.languageTitle}>
                    <Text style={styles.languageName}>{language.name}</Text>
                    {settings.language === language.code && (
                      <Check size={16} color={theme.colors.primary} />
                    )}
                  </View>
                }
                description={
                  <View style={styles.languageDescription}>
                    <Text style={styles.nativeName}>{language.nativeName}</Text>
                    <Text style={styles.description}>{language.description}</Text>
                  </View>
                }
                left={() => (
                  <View style={styles.flagContainer}>
                    <Text style={styles.flag}>{language.flag}</Text>
                  </View>
                )}
                right={() => (
                  <RadioButton
                    value={language.code}
                    status={settings.language === language.code ? 'checked' : 'unchecked'}
                    onPress={() => handleLanguageSelect(language.code)}
                    color={theme.colors.primary}
                    disabled={language.code === 'ar'} // Disable Arabic for now
                  />
                )}
                style={[
                  styles.listItem,
                  index < languages.length - 1 && styles.listItemBorder,
                  language.code === 'ar' && styles.disabledItem,
                ]}
                onPress={() => {
                  if (language.code !== 'ar') {
                    handleLanguageSelect(language.code);
                  }
                }}
              />
            </View>
          ))}
        </ModernCard>

        {/* Current Selection */}
        <ModernCard style={styles.currentCard}>
          <Text style={styles.currentTitle}>Current Language</Text>
          <View style={styles.currentSelection}>
            <Text style={styles.currentFlag}>
              {languages.find(l => l.code === settings.language)?.flag}
            </Text>
            <View style={styles.currentDetails}>
              <Text style={styles.currentName}>
                {languages.find(l => l.code === settings.language)?.name}
              </Text>
              <Text style={styles.currentNative}>
                {languages.find(l => l.code === settings.language)?.nativeName}
              </Text>
            </View>
          </View>
        </ModernCard>

        {/* RTL Support Notice */}
        <ModernCard style={styles.rtlCard}>
          <Text style={styles.rtlTitle}>Arabic Language Support</Text>
          <Text style={styles.rtlDescription}>
            Full Arabic language support including right-to-left (RTL) layout and localized 
            content is planned for a future update. The application structure is being prepared 
            to support Arabic seamlessly.
          </Text>
          <View style={styles.rtlFeatures}>
            <Text style={styles.rtlFeatureTitle}>Planned Features:</Text>
            <Text style={styles.rtlFeatureList}>
              • Complete Arabic translation{'\n'}
              • Right-to-left layout support{'\n'}
              • Arabic number formatting{'\n'}
              • Cultural date and time formats{'\n'}
              • Arabic calendar integration
            </Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingTop: spacing.l,
    paddingBottom: spacing.m,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginRight: 48,
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    padding: spacing.m,
  },
  infoCard: {
    marginBottom: spacing.m,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginLeft: spacing.s,
  },
  infoDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  languageCard: {
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
  },
  listItem: {
    paddingHorizontal: 0,
    paddingVertical: spacing.m,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  disabledItem: {
    opacity: 0.6,
  },
  languageTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  languageDescription: {
    marginTop: 4,
  },
  nativeName: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  flagContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },
  flag: {
    fontSize: 24,
  },
  currentCard: {
    marginBottom: spacing.m,
    backgroundColor: `${theme.colors.primary}08`,
    borderColor: `${theme.colors.primary}20`,
    borderWidth: 1,
  },
  currentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: spacing.s,
  },
  currentSelection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentFlag: {
    fontSize: 32,
    marginRight: spacing.m,
  },
  currentDetails: {
    flex: 1,
  },
  currentName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  currentNative: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  rtlCard: {
    marginBottom: spacing.xl,
    backgroundColor: `${theme.colors.secondary}08`,
    borderColor: `${theme.colors.secondary}20`,
    borderWidth: 1,
  },
  rtlTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: spacing.s,
  },
  rtlDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: spacing.m,
  },
  rtlFeatures: {
    marginTop: spacing.s,
  },
  rtlFeatureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.s,
  },
  rtlFeatureList: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
}); 