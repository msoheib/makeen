import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { ArrowLeft, Shield, Calendar, Lock } from 'lucide-react-native';
import ModernCard from '@/components/ModernCard';

export default function PrivacyPolicyScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const lastUpdated = "December 21, 2024";

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
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
    borderWidth: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: spacing.s,
  },
  infoDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: spacing.s,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.s,
  },
  lastUpdatedText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: spacing.s,
  },
  privacyCard: {
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  sectionContent: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: spacing.s,
  },
  protectionCard: {
    marginBottom: spacing.m,
    backgroundColor: '#F5F5F5',
    borderColor: '#424242',
    borderWidth: 1,
  },
  protectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  protectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginLeft: spacing.s,
  },
  protectionList: {
    gap: spacing.s,
  },
  protectionItem: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  complianceCard: {
    marginBottom: spacing.m,
    backgroundColor: '#FFF8E1',
    borderColor: '#FF9800',
    borderWidth: 1,
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: spacing.s,
  },
  complianceText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  contactCard: {
    marginBottom: spacing.xl,
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: spacing.s,
  },
  contactText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <ModernCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Shield size={24} color={theme.colors.primary} />
            <Text style={styles.infoTitle}>Privacy Policy</Text>
          </View>
          <Text style={styles.infoDescription}>
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </Text>
          <View style={styles.lastUpdated}>
            <Calendar size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.lastUpdatedText}>Last updated: {lastUpdated}</Text>
          </View>
        </ModernCard>

        {/* Privacy Content */}
        <ModernCard style={styles.privacyCard}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.sectionContent}>
            We collect information you provide directly to us, such as:
            {'\n'}• Account registration information (name, email, phone)
            {'\n'}• Property and tenant data you enter
            {'\n'}• Financial records and transaction data
            {'\n'}• Communications with our support team
            {'\n'}• Usage data and app performance metrics
          </Text>

          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.sectionContent}>
            We use the information we collect to:
            {'\n'}• Provide and maintain our services
            {'\n'}• Process your transactions and requests
            {'\n'}• Send you important service notifications
            {'\n'}• Improve our app and develop new features
            {'\n'}• Comply with legal obligations
            {'\n'}• Prevent fraud and ensure security
          </Text>

          <Text style={styles.sectionTitle}>3. Information Sharing</Text>
          <Text style={styles.sectionContent}>
            We do not sell, trade, or otherwise transfer your personal information to third parties except:
            {'\n'}• With your explicit consent
            {'\n'}• To comply with legal requirements
            {'\n'}• To protect our rights and safety
            {'\n'}• With trusted service providers who assist us in operating our app
            {'\n'}• In connection with a business transfer or acquisition
          </Text>

          <Text style={styles.sectionTitle}>4. Data Storage and Security</Text>
          <Text style={styles.sectionContent}>
            We implement appropriate security measures to protect your personal information:
            {'\n'}• Data encryption in transit and at rest
            {'\n'}• Regular security audits and monitoring
            {'\n'}• Access controls and authentication
            {'\n'}• Secure cloud storage infrastructure
            {'\n'}• Employee training on data protection
          </Text>

          <Text style={styles.sectionTitle}>5. Data Retention</Text>
          <Text style={styles.sectionContent}>
            We retain your personal information for as long as necessary to:
            {'\n'}• Provide our services to you
            {'\n'}• Comply with legal obligations
            {'\n'}• Resolve disputes and enforce agreements
            {'\n'}• Meet business and regulatory requirements
            {'\n\n'}You may request deletion of your account and associated data at any time.
          </Text>

          <Text style={styles.sectionTitle}>6. Your Rights and Choices</Text>
          <Text style={styles.sectionContent}>
            You have the right to:
            {'\n'}• Access your personal information
            {'\n'}• Correct inaccurate or incomplete data
            {'\n'}• Request deletion of your account
            {'\n'}• Object to certain data processing
            {'\n'}• Data portability (export your data)
            {'\n'}• Opt-out of marketing communications
          </Text>

          <Text style={styles.sectionTitle}>7. Cookies and Analytics</Text>
          <Text style={styles.sectionContent}>
            Our app may use local storage and analytics tools to:
            {'\n'}• Remember your preferences and settings
            {'\n'}• Analyze app usage and performance
            {'\n'}• Provide personalized experiences
            {'\n'}• Identify and fix technical issues
            {'\n\n'}You can manage these preferences in your device settings.
          </Text>

          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.sectionContent}>
            Our app is not intended for use by children under 16 years of age. We do not knowingly collect personal information from children under 16. If we become aware of such collection, we will take steps to delete that information promptly.
          </Text>

          <Text style={styles.sectionTitle}>9. International Data Transfers</Text>
          <Text style={styles.sectionContent}>
            Your information may be processed and stored in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
          </Text>

          <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
          <Text style={styles.sectionContent}>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy in the app and updating the "Last updated" date.
          </Text>

          <Text style={styles.sectionTitle}>11. Contact Us</Text>
          <Text style={styles.sectionContent}>
            If you have any questions about this Privacy Policy or our data practices, please contact us:
            {'\n'}• Email: info@example.com
            {'\n'}• Through the Contact Support feature in the app
            {'\n'}• By mail: [Company Address]
          </Text>
        </ModernCard>

        {/* Data Protection Summary */}
        <ModernCard style={styles.protectionCard}>
          <View style={styles.protectionHeader}>
            <Lock size={20} color={theme.colors.secondary} />
            <Text style={styles.protectionTitle}>Data Protection Summary</Text>
          </View>
          <View style={styles.protectionList}>
            <Text style={styles.protectionItem}>✓ End-to-end encryption for sensitive data</Text>
            <Text style={styles.protectionItem}>✓ Regular security audits and monitoring</Text>
            <Text style={styles.protectionItem}>✓ Minimal data collection principle</Text>
            <Text style={styles.protectionItem}>✓ No data sharing without consent</Text>
            <Text style={styles.protectionItem}>✓ Compliance with GDPR and local laws</Text>
          </View>
        </ModernCard>

        {/* Regional Compliance */}
        <ModernCard style={styles.complianceCard}>
          <Text style={styles.complianceTitle}>Regional Privacy Compliance</Text>
          <Text style={styles.complianceText}>
            This app complies with applicable privacy laws including the Saudi Arabian Personal Data Protection Law (PDPL) and other relevant regulations. We are committed to protecting your privacy rights in accordance with local and international standards.
          </Text>
        </ModernCard>

        {/* Contact for Privacy */}
        <ModernCard style={styles.contactCard}>
          <Text style={styles.contactTitle}>Privacy Questions?</Text>
          <Text style={styles.contactText}>
            For specific privacy concerns or data protection requests, please contact our Data Protection Officer through the Contact Support feature or email us directly.
          </Text>
        </ModernCard>
      </ScrollView>
    </View>
  );
}

 