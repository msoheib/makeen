import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/useTranslation';
import { ArrowLeft, DollarSign, MapPin, Lock, Info } from 'lucide-react-native';
import ModernCard from '@/components/ModernCard';

export default function CurrencyScreen() {
  const router = useRouter();
  const { settings } = useAppStore();
  const { t } = useTranslation('settings');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('currency.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Currency Info */}
        <ModernCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <DollarSign size={24} color={theme.colors.primary} />
            <Text style={styles.infoTitle}>{t('currency.regionalSetting')}</Text>
          </View>
          <Text style={styles.infoDescription}>
            {t('currency.regionalDescription')}
          </Text>
        </ModernCard>

        {/* Current Currency */}
        <ModernCard style={styles.currencyCard}>
          <View style={styles.currencyHeader}>
            <Text style={styles.sectionTitle}>{t('currency.currentCurrency')}</Text>
            <Chip
              mode="flat"
              style={styles.lockedChip}
              textStyle={styles.lockedChipText}
              icon={() => <Lock size={14} color={theme.colors.onSurfaceVariant} />}
            >
              {t('currency.locked')}
            </Chip>
          </View>
          
          <View style={styles.currencyDisplay}>
            <View style={styles.currencyIcon}>
              <Text style={styles.currencySymbol}>﷼</Text>
            </View>
            <View style={styles.currencyDetails}>
              <Text style={styles.currencyName}>{t('currency.saudiRiyal')}</Text>
              <Text style={styles.currencyCode}>{t('currency.currencyCode')}</Text>
              <Text style={styles.currencyRegion}>{t('currency.currencyRegion')}</Text>
            </View>
          </View>
        </ModernCard>

        {/* Regional Information */}
        <ModernCard style={styles.regionCard}>
          <View style={styles.regionHeader}>
            <MapPin size={20} color={theme.colors.secondary} />
            <Text style={styles.regionTitle}>{t('currency.regionalInformation')}</Text>
          </View>
          
          <View style={styles.regionDetails}>
            <View style={styles.regionItem}>
              <Text style={styles.regionLabel}>{t('currency.country')}</Text>
              <Text style={styles.regionValue}>{t('currency.saudiArabia')}</Text>
            </View>
            <View style={styles.regionItem}>
              <Text style={styles.regionLabel}>{t('currency.currencyCodeLabel')}</Text>
              <Text style={styles.regionValue}>SAR</Text>
            </View>
            <View style={styles.regionItem}>
              <Text style={styles.regionLabel}>{t('currency.currencySymbolLabel')}</Text>
              <Text style={styles.regionValue}>{t('currency.currencySymbolValue')}</Text>
            </View>
            <View style={styles.regionItem}>
              <Text style={styles.regionLabel}>{t('currency.decimalPlaces')}</Text>
              <Text style={styles.regionValue}>2</Text>
            </View>
            <View style={styles.regionItem}>
              <Text style={styles.regionLabel}>{t('currency.formatExample')}</Text>
              <Text style={styles.regionValue}>{t('currency.formatExampleValue')}</Text>
            </View>
          </View>
        </ModernCard>

        {/* Why Currency is Locked */}
        <ModernCard style={styles.explanationCard}>
          <View style={styles.explanationHeader}>
            <Info size={20} color={theme.colors.warning} />
            <Text style={styles.explanationTitle}>{t('currency.whyLocked')}</Text>
          </View>
          
          <View style={styles.explanationContent}>
            <Text style={styles.explanationText}>
              {t('currency.lockedExplanation')}
            </Text>
            <View style={styles.explanationList}>
              <Text style={styles.explanationItem}>
                {t('currency.complianceRegulations')}
              </Text>
              <Text style={styles.explanationItem}>
                {t('currency.consistencyValuations')}
              </Text>
              <Text style={styles.explanationItem}>
                {t('currency.taxCalculations')}
              </Text>
              <Text style={styles.explanationItem}>
                {t('currency.financialStatements')}
              </Text>
              <Text style={styles.explanationItem}>
                {t('currency.bankingIntegration')}
              </Text>
            </View>
          </View>
        </ModernCard>

        {/* Currency Features */}
        <ModernCard style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>{t('currency.currencyFeatures')}</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.success}15` }]}>
                <Text style={styles.featureCheck}>✓</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{t('currency.automaticFormatting.title')}</Text>
                <Text style={styles.featureDescription}>
                  {t('currency.automaticFormatting.description')}
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.success}15` }]}>
                <Text style={styles.featureCheck}>✓</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{t('currency.vatIntegration.title')}</Text>
                <Text style={styles.featureDescription}>
                  {t('currency.vatIntegration.description')}
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.success}15` }]}>
                <Text style={styles.featureCheck}>✓</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{t('currency.numberFormatting.title')}</Text>
                <Text style={styles.featureDescription}>
                  {t('currency.numberFormatting.description')}
                </Text>
              </View>
            </View>
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
  currencyCard: {
    marginBottom: spacing.m,
    backgroundColor: `${theme.colors.primary}08`,
    borderColor: `${theme.colors.primary}20`,
    borderWidth: 1,
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  lockedChip: {
    backgroundColor: theme.colors.surfaceVariant,
    height: 28,
  },
  lockedChipText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  currencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  currencyDetails: {
    flex: 1,
  },
  currencyName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  currencyCode: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  currencyRegion: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  regionCard: {
    marginBottom: spacing.m,
  },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  regionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginLeft: spacing.s,
  },
  regionDetails: {
    gap: spacing.s,
  },
  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  regionLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  regionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  explanationCard: {
    marginBottom: spacing.m,
    backgroundColor: `${theme.colors.warning}08`,
    borderColor: `${theme.colors.warning}20`,
    borderWidth: 1,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.warning,
    marginLeft: spacing.s,
  },
  explanationContent: {
    marginTop: spacing.s,
  },
  explanationText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.s,
  },
  explanationList: {
    marginLeft: spacing.s,
  },
  explanationItem: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 2,
  },
  featuresCard: {
    marginBottom: spacing.xl,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
  },
  featuresList: {
    gap: spacing.m,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },
  featureCheck: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
}); 