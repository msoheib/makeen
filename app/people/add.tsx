import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, IconButton, Checkbox } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/lib/types';
import { ArrowLeft, User, Mail, Phone, UserCheck, Lock, Eye, EyeOff, MapPin } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { useAuth } from '@/hooks/useAuth';

export default function AddPersonScreen() {
  const router = useRouter();
  const { role: urlRole } = useLocalSearchParams<{ role?: UserRole }>();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    role: (urlRole as UserRole) || 'tenant' as UserRole,
    address: '',
    city: '',
    country: '',
    nationality: '',
    id_number: '',
    is_foreign: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Available roles for admins and managers
  const availableRoles: { value: UserRole; label: string; description: string }[] = [
    { value: 'owner', label: 'Property Owner', description: 'Can manage their own properties' },
    { value: 'tenant', label: 'Tenant', description: 'Can rent properties and manage contracts' },
    { value: 'manager', label: 'Property Manager', description: 'Can manage properties and tenants' },
    { value: 'staff', label: 'Staff Member', description: 'Limited access to system features' },
  ];

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
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Additional validation for address fields
    if (formData.role === 'owner' || formData.role === 'tenant') {
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required for owners and tenants';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City is required for owners and tenants';
      }
      if (!formData.country.trim()) {
        newErrors.country = 'Country is required for owners and tenants';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendWelcomeEmail = async (email: string, password: string, firstName: string) => {
    try {
      const emailData = {
        to: email,
        subject: 'Welcome to Real Estate Management System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2;">Welcome to Real Estate Management System</h2>
            <p>Hello ${firstName},</p>
            <p>Your account has been successfully created. Here are your login credentials:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>
            <p>Please keep your password secure and consider changing it after your first login.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>Real Estate Management Team</p>
          </div>
        `,
        firstName,
        password
      };

      // Call the Supabase Edge Function to send email
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) {
        console.error('Error calling email function:', error);
        // Don't fail the registration if email fails
        return false;
      }

      console.log('Email sent successfully:', data);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't fail the registration if email fails
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // First, create the user account with authentication
      const signUpResult = await signUp(
        formData.email.trim().toLowerCase(),
        formData.password,
        {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone_number.trim() || undefined,
          role: formData.role,
        }
      );

      if (!signUpResult.success) {
        throw new Error(signUpResult.error || 'Failed to create user account');
      }

      // Then, create the profile record in the database
      const personData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone_number.trim() || null,
        role: formData.role,
        status: 'active',
        profile_type: formData.role === 'owner' ? 'owner' : 
                     formData.role === 'tenant' ? 'tenant' : 
                     formData.role === 'manager' ? 'admin' : 'employee',
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        nationality: formData.nationality.trim() || null,
        id_number: formData.id_number.trim() || null,
        is_foreign: formData.is_foreign,
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([personData])
        .select()
        .single();

      if (error) {
        // If profile creation fails, we should handle this gracefully
        console.error('Error creating profile:', error);
        // Don't throw here as the auth account was created successfully
      }

      // Send welcome email
      await sendWelcomeEmail(
        formData.email.trim().toLowerCase(),
        formData.password,
        formData.first_name.trim()
      );

      Alert.alert(
        'Success',
        'User account created successfully! A welcome email has been sent with login credentials.',
        [
          {
            text: 'View Details',
            onPress: () => router.push(`/people/${data?.id}`),
          },
          {
            text: 'Add Another',
            onPress: () => {
              // Reset form for adding another person
              setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone_number: '',
                password: '',
                confirmPassword: '',
                role: 'tenant' as UserRole,
                address: '',
                city: '',
                country: '',
                nationality: '',
                id_number: '',
                is_foreign: false,
              });
              setErrors({});
            },
          },
          {
            text: 'Back to List',
            onPress: () => router.replace('/(tabs)/people'),
          },
        ]
      );
      
      // Automatically navigate back after a short delay
      setTimeout(() => {
        router.replace('/(tabs)/people');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.message?.includes('already registered')) {
        setErrors({ email: 'This email address is already registered' });
      } else if (error.message?.includes('password')) {
        setErrors({ password: 'Password must be at least 6 characters' });
      } else {
        Alert.alert('Error', error.message || 'Failed to create user account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Add Person"
        showBackButton={true}
        showNotifications={false}
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
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

          <Text style={styles.fieldLabel}>Role *</Text>
          <SegmentedButtons
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
            buttons={[
              { value: 'tenant', label: 'Tenant' },
              { value: 'owner', label: 'Owner' },
              { value: 'staff', label: 'Staff' },
              { value: 'manager', label: 'Manager' },
            ]}
            style={styles.segmentedButtons}
          />
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

        {/* Authentication Information */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color={theme.colors.tertiary} />
            <Text style={styles.sectionTitle}>Authentication</Text>
          </View>

          <TextInput
            label="Password *"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            error={!!errors.password}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TextInput
            label="Confirm Password *"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            style={styles.input}
            error={!!errors.confirmPassword}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? "eye-off" : "eye"}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          <Text style={styles.passwordNote}>
            Password must be at least 6 characters long. A welcome email will be sent with login credentials.
          </Text>
        </ModernCard>

        {/* Role Information */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <UserCheck size={20} color={theme.colors.tertiary} />
            <Text style={styles.sectionTitle}>Role Information</Text>
          </View>

          <View style={styles.roleInfo}>
            {formData.role === 'tenant' && (
              <Text style={styles.roleDescription}>
                Tenants can view their rental properties, submit maintenance requests, 
                make payments, and access their documents.
              </Text>
            )}
            {formData.role === 'owner' && (
              <Text style={styles.roleDescription}>
                Property owners can manage their properties, view financial reports, 
                communicate with tenants, and track maintenance requests.
              </Text>
            )}
            {formData.role === 'manager' && (
              <Text style={styles.roleDescription}>
                Property managers have full access to manage properties, tenants, 
                contracts, and financial operations.
              </Text>
            )}
            {formData.role === 'staff' && (
              <Text style={styles.roleDescription}>
                Staff members have limited access to view and manage basic operations 
                as assigned by managers.
              </Text>
            )}
          </View>
        </ModernCard>

        {/* Address and Additional Information */}
        {(formData.role === 'owner' || formData.role === 'tenant') && (
          <ModernCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Address & Additional Information</Text>
            </View>

            <TextInput
              label="Address *"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              mode="outlined"
              style={styles.input}
              error={!!errors.address}
              left={<TextInput.Icon icon="map-marker-outline" />}
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

            <View style={styles.row}>
              <TextInput
                label="City *"
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                error={!!errors.city}
              />
              <TextInput
                label="Country *"
                value={formData.country}
                onChangeText={(text) => setFormData({ ...formData, country: text })}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                error={!!errors.country}
              />
            </View>
            {(errors.city || errors.country) && (
              <Text style={styles.errorText}>{errors.city || errors.country}</Text>
            )}

            <View style={styles.row}>
              <TextInput
                label="Nationality"
                value={formData.nationality}
                onChangeText={(text) => setFormData({ ...formData, nationality: text })}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="ID Number"
                value={formData.id_number}
                onChangeText={(text) => setFormData({ ...formData, id_number: text })}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
            </View>

            <View style={styles.checkboxRow}>
              <Checkbox
                status={formData.is_foreign ? 'checked' : 'unchecked'}
                onPress={() => setFormData({ ...formData, is_foreign: !formData.is_foreign })}
              />
              <Text style={styles.checkboxLabel}>Foreign National</Text>
            </View>
          </ModernCard>
        )}

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            Create User Account
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

  content: {
    flex: 1,
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
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: spacing.s,
    marginTop: spacing.s,
  },
  segmentedButtons: {
    marginBottom: spacing.m,
  },
  roleInfo: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.m,
    borderRadius: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: -spacing.s,
    marginBottom: spacing.s,
  },
  passwordNote: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.s,
  },
  checkboxLabel: {
    marginLeft: spacing.s,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
});