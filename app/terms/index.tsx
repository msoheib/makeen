import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { ArrowLeft, FileText, Calendar } from 'lucide-react-native';
import ModernCard from '@/components/ModernCard';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const lastUpdated = "December 21, 2024";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <ModernCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <FileText size={24} color={theme.colors.primary} />
            <Text style={styles.infoTitle}>Terms of Service Agreement</Text>
          </View>
          <View style={styles.lastUpdated}>
            <Calendar size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.lastUpdatedText}>Last updated: {lastUpdated}</Text>
          </View>
        </ModernCard>

        {/* Terms Content */}
        <ModernCard style={styles.termsCard}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionContent}>
            By downloading, installing, or using the Real Estate Management App ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.
          </Text>

          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.sectionContent}>
            The Real Estate Management App provides tools and features for managing real estate properties, including but not limited to:
            {'\n'}• Property listings and management
            {'\n'}• Tenant and owner management
            {'\n'}• Financial tracking and reporting
            {'\n'}• Maintenance request management
            {'\n'}• Document storage and organization
            {'\n'}• Contract management
          </Text>

          <Text style={styles.sectionTitle}>3. User Accounts and Registration</Text>
          <Text style={styles.sectionContent}>
            To use certain features of the App, you must create an account. You are responsible for:
            {'\n'}• Providing accurate and complete information
            {'\n'}• Maintaining the security of your account credentials
            {'\n'}• All activities that occur under your account
            {'\n'}• Immediately notifying us of any unauthorized use
          </Text>

          <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
          <Text style={styles.sectionContent}>
            You agree to use the App only for lawful purposes and in accordance with these Terms. You may not:
            {'\n'}• Use the App for any illegal or unauthorized purpose
            {'\n'}• Violate any applicable laws or regulations
            {'\n'}• Infringe upon the rights of others
            {'\n'}• Transmit any harmful or malicious content
            {'\n'}• Attempt to gain unauthorized access to our systems
          </Text>

          <Text style={styles.sectionTitle}>5. Data and Privacy</Text>
          <Text style={styles.sectionContent}>
            Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information. By using the App, you consent to our collection and use of your information as described in our Privacy Policy.
          </Text>

          <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
          <Text style={styles.sectionContent}>
            The App and its content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </Text>

          <Text style={styles.sectionTitle}>7. Financial Transactions</Text>
          <Text style={styles.sectionContent}>
            The App may facilitate financial tracking and reporting related to your real estate business. You are solely responsible for:
            {'\n'}• The accuracy of financial information entered
            {'\n'}• Compliance with applicable tax laws and regulations
            {'\n'}• Proper record keeping and documentation
            {'\n'}• VAT calculations and reporting (where applicable)
          </Text>

          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.sectionContent}>
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.
          </Text>

          <Text style={styles.sectionTitle}>9. Service Availability</Text>
          <Text style={styles.sectionContent}>
            We strive to maintain the App's availability but do not guarantee uninterrupted service. We may temporarily suspend the service for maintenance, updates, or other operational reasons.
          </Text>

          <Text style={styles.sectionTitle}>10. Modifications to Terms</Text>
          <Text style={styles.sectionContent}>
            We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the App after changes constitutes acceptance of the new Terms.
          </Text>

          <Text style={styles.sectionTitle}>11. Termination</Text>
          <Text style={styles.sectionContent}>
            We may terminate or suspend your account and access to the App at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users.
          </Text>

          <Text style={styles.sectionTitle}>12. Governing Law</Text>
          <Text style={styles.sectionContent}>
            These Terms shall be governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia, without regard to its conflict of law provisions.
          </Text>

          <Text style={styles.sectionTitle}>13. Contact Information</Text>
          <Text style={styles.sectionContent}>
            If you have any questions about these Terms of Service, please contact us at info@example.com or through the Contact Support feature in the App.
          </Text>
        </ModernCard>

        {/* Disclaimer */}
        <ModernCard style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Important Notice</Text>
          <Text style={styles.disclaimerText}>
            This app is designed to assist with real estate management but does not constitute legal, financial, or professional advice. Always consult with qualified professionals for legal, financial, and business decisions.
          </Text>
        </ModernCard>

        {/* Compliance Note */}
        <ModernCard style={styles.complianceCard}>
          <Text style={styles.complianceTitle}>Saudi Arabia Compliance</Text>
          <Text style={styles.complianceText}>
            This application is designed to comply with Saudi Arabian business and financial regulations. Users are responsible for ensuring their use of the app meets all applicable local laws and requirements.
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
    backgroundColor: `${theme.colors.primary}08`,
    borderColor: `${theme.colors.primary}20`,
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
  termsCard: {
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
  disclaimerCard: {
    marginBottom: spacing.m,
    backgroundColor: `${theme.colors.warning}08`,
    borderColor: `${theme.colors.warning}20`,
    borderWidth: 1,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.warning,
    marginBottom: spacing.s,
  },
  disclaimerText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  complianceCard: {
    marginBottom: spacing.xl,
    backgroundColor: `${theme.colors.secondary}08`,
    borderColor: `${theme.colors.secondary}20`,
    borderWidth: 1,
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: spacing.s,
  },
  complianceText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
}); 