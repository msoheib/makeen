import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, IconButton, Button, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, Mail, MessageSquare, Phone, HelpCircle } from 'lucide-react-native';
import ModernCard from '@/components/ModernCard';
import * as MailComposer from 'expo-mail-composer';

export default function ContactSupportScreen() {
  const router = useRouter();
  const { settings } = useAppStore();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please enter both subject and message before sending.');
      return;
    }

    setIsLoading(true);
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert(
          'Email Not Available',
          'Email is not configured on this device. Please set up your email app first.'
        );
        setIsLoading(false);
        return;
      }

      const result = await MailComposer.composeAsync({
        recipients: [settings.supportEmail],
        subject: `[Real Estate App] ${subject}`,
        body: `${message}\n\n---\nSent from Real Estate Management App\nApp Version: 1.0.0\nDevice Info: Mobile App`,
      });

      if (result.status === 'sent') {
        Alert.alert('Email Sent', 'Your message has been sent successfully!');
        setSubject('');
        setMessage('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send email. Please try again later.');
      console.error('Email error:', error);
    }
    setIsLoading(false);
  };

  const supportCategories = [
    {
      title: 'Technical Issues',
      description: 'App bugs, login problems, sync issues',
      icon: HelpCircle,
      color: theme.colors.primary,
    },
    {
      title: 'Account Support',
      description: 'Profile, settings, subscription questions',
      icon: MessageSquare,
      color: theme.colors.secondary,
    },
    {
      title: 'Feature Requests',
      description: 'Suggestions for new features or improvements',
      icon: Mail,
      color: theme.colors.tertiary,
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
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Support Info */}
        <ModernCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Mail size={24} color={theme.colors.primary} />
            <Text style={styles.infoTitle}>Get Help & Support</Text>
          </View>
          <Text style={styles.infoDescription}>
            Need assistance? Send us a message and our support team will get back to you 
            as soon as possible. We're here to help!
          </Text>
        </ModernCard>

        {/* Support Categories */}
        <ModernCard style={styles.categoriesCard}>
          <Text style={styles.sectionTitle}>Common Support Topics</Text>
          {supportCategories.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                <category.icon size={20} color={category.color} />
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
            </View>
          ))}
        </ModernCard>

        {/* Contact Form */}
        <ModernCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>Send a Message</Text>
          
          <View style={styles.supportEmail}>
            <Text style={styles.supportEmailLabel}>Support Email:</Text>
            <Text style={styles.supportEmailValue}>{settings.supportEmail}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Subject</Text>
            <TextInput
              mode="outlined"
              placeholder="What's this about?"
              value={subject}
              onChangeText={setSubject}
              style={styles.textInput}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              maxLength={100}
              right={<TextInput.Affix text={`${subject.length}/100`} />}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Message</Text>
            <TextInput
              mode="outlined"
              placeholder="Describe your issue or question in detail..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              style={[styles.textInput, styles.messageInput]}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              maxLength={1000}
            />
            <Text style={styles.charCount}>{message.length}/1000 characters</Text>
          </View>

          <Button
            mode="contained"
            onPress={handleSendEmail}
            loading={isLoading}
            disabled={!subject.trim() || !message.trim() || isLoading}
            style={styles.sendButton}
            buttonColor={theme.colors.primary}
            icon={() => <Mail size={20} color="white" />}
          >
            Send Message
          </Button>
        </ModernCard>

        {/* Response Time */}
        <ModernCard style={styles.responseCard}>
          <Text style={styles.responseTitle}>Response Time</Text>
          <Text style={styles.responseDescription}>
            We typically respond to support requests within 24-48 hours during business days. 
            For urgent issues, please mark your subject line with "[URGENT]".
          </Text>
          
          <View style={styles.businessHours}>
            <Text style={styles.businessHoursTitle}>Business Hours</Text>
            <Text style={styles.businessHoursText}>
              Sunday - Thursday: 9:00 AM - 6:00 PM (AST){'\n'}
              Friday - Saturday: Closed
            </Text>
          </View>
        </ModernCard>

        {/* Alternative Contact */}
        <ModernCard style={styles.alternativeCard}>
          <Text style={styles.alternativeTitle}>Alternative Contact Methods</Text>
          <View style={styles.alternativeList}>
            <View style={styles.alternativeItem}>
              <Phone size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.alternativeText}>
                Phone support available for premium accounts
              </Text>
            </View>
            <View style={styles.alternativeItem}>
              <MessageSquare size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.alternativeText}>
                In-app chat coming in a future update
              </Text>
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
  categoriesCard: {
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  formCard: {
    marginBottom: spacing.m,
  },
  supportEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
    padding: spacing.s,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  supportEmailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginRight: spacing.s,
  },
  supportEmailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  formGroup: {
    marginBottom: spacing.m,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.s,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
  },
  messageInput: {
    height: 120,
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  sendButton: {
    marginTop: spacing.s,
    paddingVertical: spacing.xs,
  },
  responseCard: {
    marginBottom: spacing.m,
    backgroundColor: `${theme.colors.primary}08`,
    borderColor: `${theme.colors.primary}20`,
    borderWidth: 1,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: spacing.s,
  },
  responseDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: spacing.m,
  },
  businessHours: {
    marginTop: spacing.s,
  },
  businessHoursTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  businessHoursText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  alternativeCard: {
    marginBottom: spacing.xl,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
  },
  alternativeList: {
    gap: spacing.s,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  alternativeText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    flex: 1,
  },
}); 