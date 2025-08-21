import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform , ActivityIndicator } from 'react-native';
import { Text, IconButton, Button, TextInput, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/lib/useTranslation';
import { ArrowLeft, User, Mail, Phone, MapPin, Edit3, Save, X, Camera, Shield } from 'lucide-react-native';
import ModernCard from '@/components/ModernCard';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import { useUserProfile } from '@/hooks/useUserProfile';

import ChangePasswordModal from '@/components/ChangePasswordModal';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation('settings');
  const { profile, loading, error, updateProfile } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    country: 'Saudi Arabia',
  });

  // Update edited profile when database profile loads
  React.useEffect(() => {
    if (profile) {
      setEditedProfile({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        company: '', // Not in database schema
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || 'Saudi Arabia',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!editedProfile.firstName.trim() && !editedProfile.lastName.trim()) {
      Alert.alert(t('profile.missingInformation'), t('profile.nameRequired'));
      return;
    }

    if (!editedProfile.email.trim()) {
      Alert.alert(t('profile.missingInformation'), t('profile.emailRequired'));
      return;
    }

    setSaving(true);
    try {
      const success = await updateProfile({
        first_name: editedProfile.firstName,
        last_name: editedProfile.lastName,
        email: editedProfile.email,
        phone: editedProfile.phone,
        address: editedProfile.address,
        city: editedProfile.city,
        country: editedProfile.country,
      });

      if (success) {
        setIsEditing(false);
        Alert.alert(t('profile.success'), t('profile.profileUpdateSuccess'));
      } else {
        Alert.alert(t('profile.error'), t('profile.updateFailed'));
      }
    } catch (err) {
      console.error('Profile save error:', err);
      Alert.alert(t('profile.error'), t('profile.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditedProfile({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        company: '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || 'Saudi Arabia',
      });
    }
    setIsEditing(false);
  };

  const handleProfilePictureChange = async (imageUrl: string | null) => {
    try {
      const success = await updateProfile({
        profile_picture_url: imageUrl,
      });

      if (!success) {
        Alert.alert('Error', 'Failed to update profile picture. Please try again.');
      }
    } catch (error: any) {
      console.error('Profile picture update error:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    }
  };

  const handleChangePassword = async (newPassword: string) => {
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
      throw error; // Re-throw to let modal handle the error state
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName.trim()[0] || '';
    const last = lastName.trim()[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getFullName = () => {
    return `${editedProfile.firstName} ${editedProfile.lastName}`.trim() || t('common:user');
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          {t('profile.loadingProfile')}
        </Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
        <Button
          mode="contained"
          onPress={() => window.location.reload()}
          style={styles.retryButton}
        >
          {t('common:retry')}
        </Button>
      </View>
    );
  }

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
            <ProfilePictureUpload
              currentImageUrl={profile?.profile_picture_url}
              onImageChange={handleProfilePictureChange}
              userId={profile?.id || ''}
              disabled={!profile}
              size={80}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {getFullName()}
              </Text>
              <Text style={styles.profileEmail}>
                {editedProfile.email || t('profile.noEmail')}
              </Text>
              <Text style={styles.profileCompany}>
                {profile?.role || t('profile.realEstateProfessional')}
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
                loading={saving}
                disabled={saving}
                style={styles.saveButton}
                buttonColor={theme.colors.primary}
                icon={() => <Save size={16} color="white" />}
                compact
              >
                {saving ? t('profile.saving') : t('profile.save')}
              </Button>
            )}
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <User size={20} color={theme.colors.onSurfaceVariant} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('profile.firstName')}</Text>
                {isEditing ? (
                  <TextInput
                    mode="outlined"
                    value={editedProfile.firstName}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, firstName: text }))}
                    placeholder={t('profile.enterFirstName')}
                    style={styles.textInput}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                ) : (
                  <Text style={styles.detailValue}>
                    {editedProfile.firstName || ''}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <User size={20} color={theme.colors.onSurfaceVariant} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('profile.lastName')}</Text>
                {isEditing ? (
                  <TextInput
                    mode="outlined"
                    value={editedProfile.lastName}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, lastName: text }))}
                    placeholder={t('profile.enterLastName')}
                    style={styles.textInput}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                  />
                ) : (
                  <Text style={styles.detailValue}>
                    {editedProfile.lastName || ''}
                  </Text>
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
                  <Text style={styles.detailValue}>
                    {editedProfile.email || ''}
                  </Text>
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
                  <Text style={styles.detailValue}>
                    {editedProfile.phone || ''}
                  </Text>
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
                  <Text style={styles.detailValue}>
                    {editedProfile.company || ''}
                  </Text>
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
                  <Text style={styles.detailValue}>
                    {editedProfile.address || ''}
                  </Text>
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
                  <Text style={styles.detailValue}>
                    {editedProfile.city || ''}
                  </Text>
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
            onPress={() => setShowPasswordModal(true)}
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

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onDismiss={() => setShowPasswordModal(false)}
        onChangePassword={handleChangePassword}
        loading={changingPassword}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.m,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  retryButton: {
    paddingHorizontal: spacing.l,
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
    gap: spacing.m,
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