import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, TextInput, Button, IconButton, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, User, Mail, Phone, Camera, Save } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAppStore(state => state.user);
  const setUser = useAppStore(state => state.setUser);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phone_number && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_number: formData.phone_number.trim() || null,
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update user in store
      setUser({ ...user, ...updateData });

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.code === '23505') {
        setErrors({ email: 'This email address is already in use' });
      } else {
        Alert.alert('Error', error.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    router.push('/profile/change-password');
  };

  const handleUploadPhoto = () => {
    Alert.alert(
      'Upload Photo',
      'Photo upload functionality will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ModernHeader
          title="Profile"
          showLogo={false}
          onNotificationPress={() => router.push('/notifications')}
          onMenuPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>Profile</Text>
        <IconButton
          icon={() => <Save size={24} color={theme.colors.primary} />}
          onPress={handleSave}
          style={styles.saveButton}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <ModernCard style={styles.photoSection}>
          <View style={styles.photoContainer}>
            <View style={styles.avatarContainer}>
              {user.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text
                  size={100}
                  label={`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`}
                  style={styles.avatar}
                />
              )}
              <IconButton
                icon={() => <Camera size={20} color="white" />}
                onPress={handleUploadPhoto}
                style={styles.cameraButton}
                iconColor="white"
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.first_name} {user.last_name}
              </Text>
              <Text style={styles.userRole}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
              <Text style={styles.memberSince}>
                Member since {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </ModernCard>

        {/* Personal Information */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.row}>
            <TextInput
              label="First Name *"
              value={formData.first_name}
              onChangeText={(text) => setFormData({ ...formData, first_name: text })}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              error={!!errors.first_name}
            />
            <TextInput
              label="Last Name *"
              value={formData.last_name}
              onChangeText={(text) => setFormData({ ...formData, last_name: text })}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              error={!!errors.last_name}
            />
          </View>
          {(errors.first_name || errors.last_name) && (
            <Text style={styles.errorText}>{errors.first_name || errors.last_name}</Text>
          )}
        </ModernCard>

        {/* Contact Information */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mail size={20} color={theme.colors.secondary} />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          <TextInput
            label="Email Address *"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            error={!!errors.email}
            left={<TextInput.Icon icon="email-outline" />}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            label="Phone Number"
            value={formData.phone_number}
            onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            error={!!errors.phone_number}
            left={<TextInput.Icon icon="phone-outline" />}
          />
          {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number}</Text>}
        </ModernCard>

        {/* Security */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Phone size={20} color={theme.colors.tertiary} />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>

          <Button
            mode="outlined"
            onPress={handleChangePassword}
            style={styles.passwordButton}
            icon="lock-outline"
          >
            Change Password
          </Button>
        </ModernCard>

        {/* Save Button */}
        <View style={styles.submitContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            icon={() => <Save size={20} color="white" />}
          >
            Save Changes
          </Button>
        </View>
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
    justifyContent: 'space-between',
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
  saveButton: {
    margin: 0,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoSection: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.l,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  section: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginLeft: spacing.s,
  },
  input: {
    marginBottom: spacing.m,
    backgroundColor: theme.colors.surface,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  passwordButton: {
    borderColor: theme.colors.tertiary,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: -spacing.s,
    marginBottom: spacing.s,
  },
  submitContainer: {
    padding: spacing.m,
    paddingBottom: spacing.xxxl,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  submitButtonContent: {
    paddingVertical: spacing.s,
  },
});