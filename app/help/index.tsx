import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useTranslation } from '@/lib/useTranslation';
import { 
  ArrowLeft, 
  BookOpen, 
  MessageSquare, 
  Phone, 
  Mail, 
  FileText, 
  Video,
  CircleHelp as HelpCircle,
  ExternalLink,
  Download
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';

export default function HelpScreen() {
  const router = useRouter();
  const { t } = useTranslation('settings');

  const helpSections = [
    {
      title: t('help.gettingStarted'),
      items: [
        { title: t('help.quickStartGuide'), icon: BookOpen, action: () => console.log('Quick start') },
        { title: t('help.settingUpAccount'), icon: FileText, action: () => console.log('Account setup') },
        { title: t('help.addingFirstProperty'), icon: Video, action: () => console.log('First property') },
        { title: t('help.invitingTenants'), icon: Video, action: () => console.log('Invite tenants') },
      ]
    },
    {
      title: t('help.propertyManagement'),
      items: [
        { title: t('help.managingProperties'), icon: BookOpen, action: () => console.log('Manage properties') },
        { title: t('help.handlingMaintenance'), icon: FileText, action: () => console.log('Maintenance') },
        { title: t('help.rentCollection'), icon: Video, action: () => console.log('Rent collection') },
        { title: t('help.tenantCommunication'), icon: Video, action: () => console.log('Communication') },
      ]
    },
    {
      title: t('help.financialManagement'),
      items: [
        { title: t('help.creatingVouchers'), icon: BookOpen, action: () => console.log('Vouchers') },
        { title: t('help.generatingReports'), icon: FileText, action: () => console.log('Reports') },
        { title: t('help.managingInvoices'), icon: Video, action: () => console.log('Invoices') },
        { title: t('help.taxPreparation'), icon: Video, action: () => console.log('Tax prep') },
      ]
    },
    {
      title: t('help.troubleshooting'),
      items: [
        { title: t('help.commonIssues'), icon: HelpCircle, action: () => console.log('Common issues') },
        { title: t('help.errorMessages'), icon: FileText, action: () => console.log('Error messages') },
        { title: t('help.performanceTips'), icon: BookOpen, action: () => console.log('Performance') },
        { title: t('help.browserCompatibility'), icon: Video, action: () => console.log('Browser') },
      ]
    }
  ];

  const contactOptions = [
    {
      title: t('help.liveChat'),
      description: t('help.liveChatDescription'),
      icon: MessageSquare,
      action: () => console.log('Live chat'),
      available: true,
    },
    {
      title: t('help.phoneSupport'),
      description: t('help.phoneSupportDescription'),
      icon: Phone,
      action: () => console.log('Phone support'),
      available: true,
    },
    {
      title: t('help.emailSupport'),
      description: t('help.emailSupportDescription'),
      icon: Mail,
      action: () => console.log('Email support'),
      available: true,
    },
    {
      title: t('help.communityForum'),
      description: t('help.communityForumDescription'),
      icon: ExternalLink,
      action: () => console.log('Community forum'),
      available: true,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('help.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <ModernCard style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>{t('help.quickActions')}</Text>
          <View style={styles.quickActions}>
            <View style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Download size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.quickActionText}>{t('help.downloadManual')}</Text>
            </View>
            <View style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${theme.colors.secondary}15` }]}>
                <Video size={24} color={theme.colors.secondary} />
              </View>
              <Text style={styles.quickActionText}>{t('help.videoTutorials')}</Text>
            </View>
            <View style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${theme.colors.tertiary}15` }]}>
                <MessageSquare size={24} color={theme.colors.tertiary} />
              </View>
              <Text style={styles.quickActionText}>{t('help.contactSupport')}</Text>
            </View>
          </View>
        </ModernCard>

        {/* Help Sections */}
        {helpSections.map((section, index) => (
          <ModernCard key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <List.Item
                key={itemIndex}
                title={item.title}
                left={() => (
                  <View style={[styles.itemIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <item.icon size={20} color={theme.colors.primary} />
                  </View>
                )}
                right={() => <List.Icon icon="chevron-right" />}
                onPress={item.action}
                style={styles.listItem}
              />
            ))}
          </ModernCard>
        ))}

        {/* Contact Support */}
        <ModernCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('help.supportOptions')}</Text>
          <Text style={styles.sectionDescription}>
            {t('help.supportDescription')}
          </Text>
          
          {contactOptions.map((option, index) => (
            <List.Item
              key={index}
              title={option.title}
              description={option.description}
              left={() => (
                <View style={[styles.contactIcon, { backgroundColor: `${theme.colors.success}15` }]}>
                  <option.icon size={20} color={theme.colors.success} />
                </View>
              )}
              right={() => (
                <View style={styles.availabilityBadge}>
                  <Text style={styles.availabilityText}>
                    {option.available ? t('help.available') : t('help.offline')}
                  </Text>
                </View>
              )}
              onPress={option.action}
              style={styles.listItem}
            />
          ))}
        </ModernCard>

        {/* App Information */}
        <ModernCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('help.appInformation')}</Text>
          <View style={styles.appInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('help.version')}</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('help.lastUpdated')}</Text>
              <Text style={styles.infoValue}>January 2024</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('help.platform')}</Text>
              <Text style={styles.infoValue}>{t('help.webApplication')}</Text>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.s,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  quickActionsCard: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  quickActionText: {
    fontSize: 12,
    color: theme.colors.onSurface,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.m,
    lineHeight: 20,
  },
  listItem: {
    paddingVertical: spacing.s,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityBadge: {
    backgroundColor: theme.colors.successContainer,
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  appInfo: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.m,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
});