import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, IconButton, Button, TextInput, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/useTranslation';
import { ArrowLeft, User, Mail, Phone, MapPin, Edit3, Save, X, Camera, Shield } from 'lucide-react-native';
import ModernCard from '@/components/ModernCard';

export default function ProfileScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useAppStore();
  const { t } = useTranslation('settings');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: settings.userProfile?.name || '',
    email: settings.userProfile?.email || '',
    phone: settings.userProfile?.phone || '',
    company: settings.userProfile?.company || '',
    address: settings.userProfile?.address || '',
    city: settings.userProfile?.city || '',
    country: settings.userProfile?.country || 'Saudi Arabia',
  });

  const handleSave = () => {
    if (!editedProfile.name.trim() || !editedProfile.email.trim()) {
      Alert.alert(t('profile.missingInformation'), t('profile.nameEmailRequired'));
      return;
    }

    updateSettings({
      userProfile: {
        ...settings.userProfile,
        ...editedProfile,
        updatedAt: new Date().toISOString(),
      },
    });
    
    setIsEditing(false);
    Alert.alert(t('profile.success'), t('profile.profileUpdateSuccess'));
  };

  const handleCancel = () => {
    setEditedProfile({
      name: settings.userProfile?.name || '',
      email: settings.userProfile?.email || '',
      phone: settings.userProfile?.phone || '',
      company: settings.userProfile?.company || '',
      address: settings.userProfile?.address || '',
      city: settings.userProfile?.city || '',
      country: settings.userProfile?.country || 'Saudi Arabia',
    });
    setIsEditing(false);
  };

  const handleChangePhoto = () => {
    Alert.alert(
      t('profile.changeProfilePhoto'),
      t('profile.photoUploadComingSoon'),
      [{ text: t('common:ok') }]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const profileStats = [
    { label: t('profile.propertiesManaged'), value: '0', icon: MapPin },
    { label: t('profile.activeTenants'), value: '0', icon: User },
    { label: t('profile.accountType'), value: t('profile.standard'), icon: Shield },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('profile.myProfile')}</Text>
        <IconButton
          icon={() => isEditing ? <X size={24} color={theme.colors.error} /> : <Edit3 size={24} color={theme.colors.primary} />}
          onPress={isEditing ? handleCancel : () => setIsEditing(true)}
          style={styles.editButton}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ModernCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Avatar.Text 
                size={80} 
                label={getInitials(editedProfile.name || 'U')}
                style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                labelStyle={{ color: 'white', fontSize: 24, fontWeight: '600' }}
              />
              <IconButton
                icon={() => <Camera size={18} color={theme.colors.onSurface} />}
                onPress={handleChangePhoto}
                style={styles.cameraButton}
                size={18}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {editedProfile.name || t('common:user')}
              </Text>
              <Text style={styles.profileEmail}>
                {editedProfile.email || 'user@example.com'}
              </Text>
              <Text style={styles.profileCompany}>
                {editedProfile.company || t('profile.realEstateProfessional')}
              </Text>
            </View>
          </View>
        </ModernCard>

        {/* Profile Stats */}
        <ModernCard style={styles.statsCard}>
          <Text style={styles.statsTitle}>{t('profile.accountOverview')}</Text>
          <View style={styles.statsContainer}>
            {profileStats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <stat.icon size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </ModernCard>

        {/* Profile Details */}
        <ModernCard style={styles.detailsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.personalInformation')}</Text>
            {isEditing && (
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.saveButton}
                buttonColor={theme.colors.primary}
                icon={() => <Save size={16} color="white" />}
                compact
              >
                {t('profile.save')}
              </Button>
            )}
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <User size={20} color={theme.colors.onSurfaceVariant} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('profile.fullName')}</Text>
                {isEditing ? (
                  <TextInput
                    mode="outlined"
                    value={editedProfile.name}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, name: text }))}
                    placeholder={t('profile.enterFullName')}
                    style={styles.textInput}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                ) : (
                  <Text style={styles.detailValue}>{editedProfile.name || t('profile.notSet')}</Text>
                )}
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Mail size={20} color={theme.colors.onSurfaceVariant} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('profile.emailAddress')}</Text>
                {isEditing ? (
                  <TextInput
                    mode="outlined"
                    value={editedProfile.email}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, email: text }))}
                    placeholder={t('profile.enterEmail')}
                    keyboardType="email-address"
                    style={styles.textInput}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                ) : (
                  <Text style={styles.detailValue}>{editedProfile.email || t('profile.notSet')}</Text>
                )}
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Phone size={20} color={theme.colors.onSurfaceVariant} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('profile.phoneNumber')}</Text>
                {isEditing ? (
                  <TextInput
                    mode="outlined"
                    value={editedProfile.phone}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, phone: text }))}
                    placeholder={t('profile.enterPhone')}
                    keyboardType="phone-pad"
                    style={styles.textInput}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                ) : (
                  <Text style={styles.detailValue}>{editedProfile.phone || t('profile.notSet')}</Text>
                )}
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MapPin size={20} color={theme.colors.onSurfaceVariant} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('profile.company')}</Text>
                {isEditing ? (
                  <TextInput
                    mode="outlined"
                    value={editedProfile.company}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, company: text }))}
                    placeholder={t('profile.enterCompany')}
                    style={styles.textInput}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                ) : (
                  <Text style={styles.detailValue}>{editedProfile.company || t('profile.notSet')}</Text>
                )}
              </View>
            </View>
          </View>
        </ModernCard>

        {/* Address Information */}
        <ModernCard style={styles.addressCard}>
          <Text style={styles.sectionTitle}>{t('profile.addressInformation')}</Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MapPin size={20} color={theme.colors.onSurfaceVariant} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('profile.streetAddress')}</Text>
                {isEditing ? (
                  <TextInput
                    mode="outlined"
                    value={editedProfile.address}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, address: text }))}
                    placeholder={t('profile.enterAddress')}
                    multiline
                    numberOfLines={2}
                    style={styles.textInput}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                ) : (
                  <Text style={styles.detailValue}>{editedProfile.address || t('profile.notSet')}</Text>
                )}
              </View>
            </View>

            <View style={styles.addressRow}>
              <View style={styles.addressColumn}>
                <Text style={styles.detailLabel}>{t('profile.city')}</Text>
                {isEditing ? (
                  <TextInput
                    mode="outlined"
                    value={editedProfile.city}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, city: text }))}
                    placeholder={t('profile.enterCity')}
                    style={styles.smallTextInput}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                ) : (
                  <Text style={styles.detailValue}>{editedProfile.city || t('profile.notSet')}</Text>
                )}
              </View>

              <View style={styles.addressColumn}>
                <Text style={styles.detailLabel}>{t('profile.country')}</Text>
                {isEditing ? (
                  <TextInput
                    mode="outlined"
                    value={editedProfile.country}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, country: text }))}
                    placeholder={t('profile.selectCountry')}
                    style={styles.smallTextInput}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                ) : (
                  <Text style={styles.detailValue}>{editedProfile.country}</Text>
                )}
              </View>
            </View>
          </View>
        </ModernCard>

        {/* Account Actions */}
        <ModernCard style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>{t('profile.accountActions')}</Text>
          
          <Button
            mode="outlined"
            onPress={() => Alert.alert(t('profile.changePassword'), t('profile.changePasswordDesc'), [{ text: t('common:ok') }])}
            style={styles.actionButton}
            icon={() => <Shield size={20} color={theme.colors.primary} />}
          >
            {t('profile.changePassword')}
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.push('/privacy')}
            style={styles.actionButton}
            icon={() => <Shield size={20} color={theme.colors.onSurfaceVariant} />}
          >
            {t('profile.privacySettings')}
          </Button>

          <Button
            mode="text"
            onPress={() => Alert.alert(
              t('profile.deleteAccount'),
              t('profile.deleteAccountDesc'),
              [{ text: t('common:ok') }]
            )}
            style={styles.deleteButton}
            textColor={theme.colors.error}
          >
            {t('profile.deleteAccount')}
          </Button>
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
  },
  editButton: {
    margin: 0,
  },
  content: {
    flex: 1,
    padding: spacing.m,
  },
  profileCard: {
    marginBottom: spacing.m,
    backgroundColor: `${theme.colors.primary}05`,
    borderColor: `${theme.colors.primary}15`,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.m,
  },
  avatar: {
    elevation: 4,
    ...Platform.select({
      web: {
        boxShadow: `0 2px 8px ${theme.colors.primary}1A`,
      },
      default: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  cameraButton: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.outline,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  profileCompany: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  statsCard: {
    marginBottom: spacing.m,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  detailsCard: {
    marginBottom: spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  saveButton: {
    paddingHorizontal: spacing.s,
  },
  detailsContainer: {
    gap: spacing.m,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: 40,
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    marginTop: 0,
  },
  addressCard: {
    marginBottom: spacing.m,
  },
  addressRow: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.m,
  },
  addressColumn: {
    flex: 1,
  },
  smallTextInput: {
    backgroundColor: theme.colors.surface,
    marginTop: spacing.xs,
  },
  actionsCard: {
    marginBottom: spacing.xl,
  },
  actionButton: {
    marginBottom: spacing.s,
    borderColor: theme.colors.outline,
  },
  deleteButton: {
    marginTop: spacing.m,
  },
});