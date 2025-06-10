import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, IconButton, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, Sun, Moon, Monitor, Check } from 'lucide-react-native';
import ModernCard from '@/components/ModernCard';

export default function ThemeSelectionScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useAppStore();

  const themeOptions = [
    {
      value: 'light' as const,
      title: 'Light Theme',
      description: 'Clean and bright interface for day time use',
      icon: Sun,
      preview: '#F8FAFC',
    },
    {
      value: 'dark' as const,
      title: 'Dark Theme',
      description: 'Easy on the eyes for night time or low light environments',
      icon: Moon,
      preview: '#121212',
    },
    {
      value: 'system' as const,
      title: 'Follow Device Setting',
      description: 'Automatically switch between light and dark based on your device settings',
      icon: Monitor,
      preview: 'linear-gradient',
    },
  ];

  const handleThemeSelect = (themeValue: 'light' | 'dark' | 'system') => {
    updateSettings({ theme: themeValue });
  };

  const getThemeIcon = (themeValue: string) => {
    const option = themeOptions.find(opt => opt.value === themeValue);
    return option ? option.icon : Sun;
  };

  const getThemeTitle = (themeValue: string) => {
    const option = themeOptions.find(opt => opt.value === themeValue);
    return option ? option.title : 'Light Theme';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>Theme</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme Info */}
        <ModernCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Moon size={24} color={theme.colors.primary} />
            <Text style={styles.infoTitle}>Choose Your Theme</Text>
          </View>
          <Text style={styles.infoDescription}>
            Select your preferred appearance mode. The theme will be applied immediately 
            and saved for future app launches.
          </Text>
        </ModernCard>

        {/* Theme Options */}
        <ModernCard style={styles.themeCard}>
          <Text style={styles.sectionTitle}>Appearance Options</Text>
          {themeOptions.map((option, index) => (
            <View key={option.value}>
              <List.Item
                title={
                  <View style={styles.themeTitle}>
                    <Text style={styles.themeName}>{option.title}</Text>
                    {settings.theme === option.value && (
                      <Check size={16} color={theme.colors.primary} />
                    )}
                  </View>
                }
                description={option.description}
                left={() => (
                  <View style={styles.themeIconContainer}>
                    <View style={[
                      styles.themePreview,
                      { 
                        backgroundColor: option.preview === 'linear-gradient' 
                          ? theme.colors.surfaceVariant 
                          : option.preview 
                      }
                    ]}>
                      {option.preview === 'linear-gradient' && (
                        <View style={styles.gradientPreview}>
                          <View style={[styles.halfPreview, { backgroundColor: '#F8FAFC' }]} />
                          <View style={[styles.halfPreview, { backgroundColor: '#121212' }]} />
                        </View>
                      )}
                    </View>
                    <option.icon 
                      size={20} 
                      color={theme.colors.primary} 
                      style={styles.themeIcon}
                    />
                  </View>
                )}
                right={() => (
                  <RadioButton
                    value={option.value}
                    status={settings.theme === option.value ? 'checked' : 'unchecked'}
                    onPress={() => handleThemeSelect(option.value)}
                    color={theme.colors.primary}
                  />
                )}
                style={[
                  styles.listItem,
                  index < themeOptions.length - 1 && styles.listItemBorder,
                ]}
                titleStyle={styles.listItemTitle}
                descriptionStyle={styles.listItemDescription}
                onPress={() => handleThemeSelect(option.value)}
              />
            </View>
          ))}
        </ModernCard>

        {/* Current Theme */}
        <ModernCard style={styles.currentCard}>
          <Text style={styles.currentTitle}>Current Theme</Text>
          <View style={styles.currentSelection}>
            <View style={styles.currentIconContainer}>
              {React.createElement(getThemeIcon(settings.theme), {
                size: 24,
                color: theme.colors.primary,
              })}
            </View>
            <View style={styles.currentDetails}>
              <Text style={styles.currentName}>{getThemeTitle(settings.theme)}</Text>
              <Text style={styles.currentDescription}>
                {themeOptions.find(opt => opt.value === settings.theme)?.description}
              </Text>
            </View>
          </View>
        </ModernCard>

        {/* Theme Benefits */}
        <ModernCard style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Theme Benefits</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Sun size={16} color={theme.colors.warning} />
              <Text style={styles.benefitText}>
                <Text style={styles.benefitLabel}>Light Theme:</Text> Better visibility in bright environments, reduces eye strain during day time
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Moon size={16} color={theme.colors.primary} />
              <Text style={styles.benefitText}>
                <Text style={styles.benefitLabel}>Dark Theme:</Text> Reduces eye strain in low light, saves battery on OLED displays
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Monitor size={16} color={theme.colors.secondary} />
              <Text style={styles.benefitText}>
                <Text style={styles.benefitLabel}>Auto:</Text> Seamlessly adapts to your device's appearance settings
              </Text>
            </View>
          </View>
        </ModernCard>

        {/* Dark Mode Implementation Notice */}
        <ModernCard style={styles.implementationCard}>
          <Text style={styles.implementationTitle}>Implementation Status</Text>
          <Text style={styles.implementationDescription}>
            Dark theme is currently being implemented across all app screens. Some screens 
            may still display in light mode while the implementation is completed.
          </Text>
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
  themeCard: {
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
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  listItemDescription: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  themeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  themeIconContainer: {
    width: 60,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
    position: 'relative',
  },
  themePreview: {
    width: 40,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    overflow: 'hidden',
  },
  gradientPreview: {
    flex: 1,
    flexDirection: 'row',
  },
  halfPreview: {
    flex: 1,
  },
  themeIcon: {
    position: 'absolute',
    bottom: -2,
    right: 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 2,
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
  currentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
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
  currentDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  benefitsCard: {
    marginBottom: spacing.m,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
  },
  benefitsList: {
    gap: spacing.m,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  benefitLabel: {
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  implementationCard: {
    marginBottom: spacing.xl,
    backgroundColor: `${theme.colors.warning}08`,
    borderColor: `${theme.colors.warning}20`,
    borderWidth: 1,
  },
  implementationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.warning,
    marginBottom: spacing.s,
  },
  implementationDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
}); 