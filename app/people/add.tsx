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
import { createTenantComplete } from '@/lib/tenantCreation';
import { rtlStyles, getFlexDirection } from '@/lib/rtl';

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
      console.log('[AddPerson] Starting tenant creation with ephemeral client');
      
      // Use the new ephemeral client approach to prevent session overwrite
      const result = await createTenantComplete({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone_number.trim() || undefined,
        role: formData.role,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country.trim() || undefined,
        nationality: formData.nationality.trim() || undefined,
        id_number: formData.id_number.trim() || undefined,
        is_foreign: formData.is_foreign,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create user account');
      }

      console.log('[AddPerson] Tenant created successfully:', result.userId);

      // Send welcome email
      await sendWelcomeEmail(
        formData.email.trim().toLowerCase(),
        formData.password,
        formData.first_name.trim()
      );

      Alert.alert(
        'تم بنجاح',
        'تم إنشاء حساب المستخدم بنجاح! تم إرسال رسالة ترحيبية تحتوي على بيانات الدخول.',
        [
          {
            text: 'عرض التفاصيل',
            onPress: () => router.push(`/people/${result.userId}`),
          },
          {
            text: 'إضافة مستخدم آخر',
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
            text: 'العودة إلى القائمة',
            onPress: () => router.replace('/(tabs)/people'),
          },
        ]
      );
      
      // Automatically navigate back after a short delay
      setTimeout(() => {
        router.replace('/(tabs)/people');
      }, 3000);
    } catch (error: any) {
      console.error('[AddPerson] Error creating person:', error);
      if (error.message?.includes('already registered')) {
        setErrors({ email: 'هذا البريد الإلكتروني مسجل مسبقاً' });
      } else if (error.message?.includes('password')) {
        setErrors({ password: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' });
      } else {
        Alert.alert('خطأ', error.message || 'فشل إنشاء حساب المستخدم');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="إضافة شخص"
        showBackButton={true}
        showNotifications={false}
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <ModernCard style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: getFlexDirection('row') }]}>
            <User size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, rtlStyles.textAlign()]}>المعلومات الشخصية</Text>
          </View>

          <View style={[styles.row, rtlStyles.row()]}>
            <TextInput
              label="الاسم الأول *"
              value={formData.first_name}
              onChangeText={(text) => setFormData({ ...formData, first_name: text })}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              error={!!errors.first_name}
            />
            <TextInput
              label="اسم العائلة *"
              value={formData.last_name}
              onChangeText={(text) => setFormData({ ...formData, last_name: text })}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              error={!!errors.last_name}
            />
          </View>
          {(errors.first_name || errors.last_name) && (
            <Text style={[styles.errorText, rtlStyles.textAlign()]}>{errors.first_name || errors.last_name}</Text>
          )}

          <Text style={[styles.fieldLabel, rtlStyles.textAlign()]}>الدور *</Text>
          <SegmentedButtons
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
            buttons={[
              { value: 'tenant', label: 'مستأجر' },
              { value: 'owner', label: 'مالك' },
              { value: 'staff', label: 'موظف' },
              { value: 'manager', label: 'مدير' },
            ]}
            style={styles.segmentedButtons}
          />
        </ModernCard>

        {/* Contact Information */}
        <ModernCard style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: getFlexDirection('row') }]}>
            <Mail size={20} color={theme.colors.secondary} />
            <Text style={[styles.sectionTitle, rtlStyles.textAlign()]}>معلومات الاتصال</Text>
          </View>

          <TextInput
            label="البريد الإلكتروني *"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            error={!!errors.email}
            left={<TextInput.Icon icon="email-outline" />}
          />
          {errors.email && <Text style={[styles.errorText, rtlStyles.textAlign()]}>{errors.email}</Text>}

          <TextInput
            label="رقم الجوال"
            value={formData.phone_number}
            onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            error={!!errors.phone_number}
            left={<TextInput.Icon icon="phone-outline" />}
          />
          {errors.phone_number && <Text style={[styles.errorText, rtlStyles.textAlign()]}>{errors.phone_number}</Text>}
        </ModernCard>

        {/* Authentication Information */}
        <ModernCard style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: getFlexDirection('row') }]}>
            <Lock size={20} color={theme.colors.tertiary} />
            <Text style={[styles.sectionTitle, rtlStyles.textAlign()]}>بيانات الدخول</Text>
          </View>

          <TextInput
            label="كلمة المرور *"
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
          {errors.password && <Text style={[styles.errorText, rtlStyles.textAlign()]}>{errors.password}</Text>}

          <TextInput
            label="تأكيد كلمة المرور *"
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
          {errors.confirmPassword && <Text style={[styles.errorText, rtlStyles.textAlign()]}>{errors.confirmPassword}</Text>}

          <Text style={styles.passwordNote}>
            يجب أن تكون كلمة المرور 6 أحرف على الأقل. سيتم إرسال رسالة ترحيبية تحتوي على بيانات الدخول.
          </Text>
        </ModernCard>

        {/* Role Information */}
        <ModernCard style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: getFlexDirection('row') }]}>
            <UserCheck size={20} color={theme.colors.tertiary} />
            <Text style={[styles.sectionTitle, rtlStyles.textAlign()]}>معلومات الدور</Text>
          </View>

          <View style={styles.roleInfo}>
            {formData.role === 'tenant' && (
              <Text style={[styles.roleDescription, rtlStyles.textAlign()]}>يمكن للمستأجرين عرض عقاراتهم، وإرسال طلبات الصيانة، وإجراء المدفوعات، والوصول إلى مستنداتهم.</Text>
            )}
            {formData.role === 'owner' && (
              <Text style={[styles.roleDescription, rtlStyles.textAlign()]}>يمكن لمالكي العقارات إدارة ممتلكاتهم، وعرض التقارير المالية، والتواصل مع المستأجرين، وتتبع طلبات الصيانة.</Text>
            )}
            {formData.role === 'manager' && (
              <Text style={[styles.roleDescription, rtlStyles.textAlign()]}>لدى مديري العقارات وصول كامل لإدارة العقارات والمستأجرين والعقود والعمليات المالية.</Text>
            )}
            {formData.role === 'staff' && (
              <Text style={[styles.roleDescription, rtlStyles.textAlign()]}>لدي الموظفين صلاحيات محدودة لعرض وإدارة العمليات الأساسية حسب ما يحدده المديرون.</Text>
            )}
          </View>
        </ModernCard>

        {/* Address and Additional Information */}
        {(formData.role === 'owner' || formData.role === 'tenant') && (
          <ModernCard style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection: getFlexDirection('row') }]}>
              <MapPin size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, rtlStyles.textAlign()]}>العنوان ومعلومات إضافية</Text>
            </View>

            <TextInput
              label="العنوان *"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              mode="outlined"
              style={styles.input}
              error={!!errors.address}
              left={<TextInput.Icon icon="map-marker-outline" />}
            />
            {errors.address && <Text style={[styles.errorText, rtlStyles.textAlign()]}>{errors.address}</Text>}

            <View style={[styles.row, rtlStyles.row()]}>
              <TextInput
                label="المدينة *"
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                error={!!errors.city}
              />
              <TextInput
                label="الدولة *"
                value={formData.country}
                onChangeText={(text) => setFormData({ ...formData, country: text })}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                error={!!errors.country}
              />
            </View>
            {(errors.city || errors.country) && (
              <Text style={[styles.errorText, rtlStyles.textAlign()]}>{errors.city || errors.country}</Text>
            )}

            <View style={[styles.row, rtlStyles.row()]}>
              <TextInput
                label="الجنسية"
                value={formData.nationality}
                onChangeText={(text) => setFormData({ ...formData, nationality: text })}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="رقم الهوية"
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
              <Text style={styles.checkboxLabel}>أجنبي</Text>
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
            إنشاء حساب مستخدم
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