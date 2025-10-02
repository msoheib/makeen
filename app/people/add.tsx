import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, I18nManager, ActivityIndicator, BackHandler, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, IconButton, Checkbox, ProgressBar } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { supabase, isAuthenticated, signOut } from '@/lib/supabase';
import { UserRole } from '@/lib/types';
import { ArrowLeft, User, Mail, Phone, UserCheck, Lock, Eye, EyeOff, MapPin, CheckCircle, AlertCircle, Info } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { useAuth } from '@/hooks/useAuth';
import { createTenantComplete } from '@/lib/tenantCreation';
import { rtlStyles, getFlexDirection } from '@/lib/rtl';
import { navigateBack, navigateBackToSection, navigateToSection } from '@/lib/navigation';
import { isRTL } from '@/lib/rtl';

export default function AddPersonScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { role: urlRole } = useLocalSearchParams<{ role?: UserRole }>();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'validating' | 'creating' | 'emailing' | 'success' | 'error'>('idle');
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const initialData = {
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
    };

    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData]);

  // Handle back navigation with confirmation for unsaved changes
  const handleBackPress = useCallback(() => {
    if (hasUnsavedChanges() && !isSubmitting && submissionStatus === 'idle') {
      Alert.alert(
        'تأكيد الخروج',
        'هل تريد الخروج دون حفظ التغييرات؟',
        [
          {
            text: 'إلغاء',
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: 'نعم، خروج',
            style: 'destructive',
            onPress: () => {
              // Clean up all states before navigating
              setIsSubmitting(false);
              setLoading(false);
              setSubmissionStatus('idle');
              setProgress(0);
              navigateBack();
            },
          },
        ]
      );
      return true; // Prevent default back behavior
    } else if (isSubmitting || submissionStatus !== 'idle') {
      // If submitting, show message that operation is in progress
      Alert.alert(
        'عملية جارية',
        'يوجد عملية قيد التنفيذ، يرجى الانتظار قبل الخروج',
        [{ text: 'موافق', style: 'default' }]
      );
      return true; // Prevent back navigation during submission
    }
    return false; // Allow default back behavior
  }, [hasUnsavedChanges, isSubmitting, submissionStatus, router]);

  // Set up focus effect to handle back button
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

      return () => {
        subscription.remove();
        // Clean up states when leaving the screen
        if (!isSubmitting && submissionStatus === 'idle') {
          setIsSubmitting(false);
          setLoading(false);
          setSubmissionStatus('idle');
          setProgress(0);
        }
      };
    }, [handleBackPress, isSubmitting, submissionStatus])
  );

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
    roleButtonsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: spacing.m,
    },
    roleButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      flex: 1,
      minWidth: '22%',
      alignItems: 'center',
    },
    roleButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    roleButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      textAlign: 'center',
    },
    roleButtonTextActive: {
      color: theme.colors.onPrimary,
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
    progressContainer: {
      marginHorizontal: spacing.m,
      marginTop: spacing.s,
      marginBottom: spacing.m,
    },
    progressText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: spacing.s,
      textAlign: 'center',
    },
  });

  // Available roles for admins and managers
  const availableRoles: { value: UserRole; label: string; description: string }[] = [
    { value: 'owner', label: 'Property Owner', description: 'Can manage their own properties' },
    { value: 'tenant', label: 'Tenant', description: 'Can rent properties and manage contracts' },
    { value: 'manager', label: 'Property Manager', description: 'Can manage properties and tenants' },
    { value: 'staff', label: 'Staff Member', description: 'Limited access to system features' },
  ];

  const validateField = (field: string, value: string) => {
    const newErrors: Record<string, string> = {};

    switch (field) {
      case 'first_name':
        if (!value.trim()) {
          newErrors.first_name = 'First name is required';
        }
        break;
      case 'last_name':
        if (!value.trim()) {
          newErrors.last_name = 'Last name is required';
        }
        break;
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        }
        break;
      case 'phone_number':
        if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
          newErrors.phone_number = 'Please enter a valid phone number';
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
      case 'address':
        if ((formData.role === 'owner' || formData.role === 'tenant') && !value.trim()) {
          newErrors.address = 'Address is required for owners and tenants';
        }
        break;
      case 'city':
        if ((formData.role === 'owner' || formData.role === 'tenant') && !value.trim()) {
          newErrors.city = 'City is required for owners and tenants';
        }
        break;
      case 'country':
        if ((formData.role === 'owner' || formData.role === 'tenant') && !value.trim()) {
          newErrors.country = 'Country is required for owners and tenants';
        }
        break;
    }

    return newErrors;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate all fields
    Object.keys(formData).forEach(key => {
      if (key !== 'is_foreign') {
        const fieldErrors = validateField(key, formData[key as keyof typeof formData]);
        Object.assign(newErrors, fieldErrors);
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });

    // Mark field as touched
    const newTouched = new Set(touchedFields);
    newTouched.add(field);
    setTouchedFields(newTouched);

    // Validate field if it has been touched
    if (touchedFields.has(field)) {
      const fieldErrors = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        ...fieldErrors
      }));
    }
  };

  const handleFieldBlur = (field: string) => {
    const newTouched = new Set(touchedFields);
    newTouched.add(field);
    setTouchedFields(newTouched);

    // Validate field on blur
    const fieldErrors = validateField(field, formData[field as keyof typeof formData]);
    setErrors(prev => ({
      ...prev,
      ...fieldErrors
    }));
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
        // Don't fail the registration if email fails
        return false;
      }

      return true;
    } catch (error) {
      // Don't fail the registration if email fails
      return false;
    }
  };

  const handleSubmit = async () => {
    console.log('🚀 FORM SUBMISSION STARTED');
    
    // Ensure user session is valid before proceeding (web refresh token issues)
    const authed = await isAuthenticated();
    if (!authed) {
      console.log('❌ Authentication failed');
      Alert.alert(
        'الجلسة منتهية',
        'يرجى تسجيل الدخول مرة أخرى لمتابعة إضافة المستخدم.',
        [
          {
            text: 'موافق',
            onPress: async () => {
              await signOut();
              router.replace('/(auth)');
            },
          },
        ]
      );
      return;
    }
    console.log('✅ Authentication passed');
    // Prevent multiple submissions
    if (isSubmitting || submissionStatus === 'creating' || submissionStatus === 'emailing') {
      console.log('❌ Already submitting, ignoring');
      return;
    }

    // Validate all fields before submission
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      Alert.alert('خطأ في الإدخال', 'يرجى تصحيح الأخطاء قبل الإرسال');
      return;
    }
    console.log('✅ Form validation passed');

    setIsSubmitting(true);
    setSubmissionStatus('validating');
    setProgress(0.1);
    setLoading(true);

    try {

      // Check for duplicate email before submission
      const emailToCheck = formData.email.trim().toLowerCase();
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', emailToCheck)
        .maybeSingle();

      if (existingUser) {
        setErrors({ email: 'هذا البريد الإلكتروني مسجل مسبقاً' });
        Alert.alert('خطأ', 'البريد الإلكتروني مسجل مسبقاً، يرجى استخدام بريد آخر');
        setIsSubmitting(false);
        setLoading(false);
        return;
      }

      // Simulate validation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(0.3);

      setSubmissionStatus('creating');
      setProgress(0.4);

      console.log('🔄 Starting tenant creation...');
      
      const result = await Promise.race([
        createTenantComplete({
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
      }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Tenant creation timeout - please try again')), 30000)
        )
      ]);
      
      console.log('📊 Tenant creation result:', result);

      setProgress(0.7);

      if (!result.success) {
        console.log('❌ Tenant creation failed:', result.error);
        throw new Error(result.error || 'Failed to create user account');
      }

      console.log('✅ Tenant created successfully, proceeding to success...');

      setSubmissionStatus('emailing');
      setProgress(0.8);

      // Send welcome email (don't fail the process if email fails)
      try {
        await sendWelcomeEmail(
          formData.email.trim().toLowerCase(),
          formData.password,
          formData.first_name.trim()
        );
      } catch (emailError) {
        // Email failed but continue
      }

      setProgress(1.0);
      setSubmissionStatus('success');
      // Navigate to success confirmation screen
      const createdName = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();
      const createdEmail = formData.email.trim().toLowerCase();
      console.log('🎉 Navigating to success page with:', { id: result.userId, name: createdName, email: createdEmail });
      setIsSubmitting(false);
      setLoading(false);
      
      // Show immediate success feedback
      Alert.alert(
        'تم إنشاء المستخدم بنجاح!',
        `تم إنشاء حساب المستخدم ${createdName} (${createdEmail}) بنجاح.`,
        [
          {
            text: 'عرض التفاصيل',
            onPress: () => {
              router.replace({
                pathname: '/people/success',
                params: { id: result.userId, name: createdName, email: createdEmail }
              });
            }
          },
          {
            text: 'إضافة مستخدم آخر',
            onPress: () => {
              // Reset form
              setFormData({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                phone_number: '',
                role: 'tenant',
                address: '',
                city: '',
                country: '',
                nationality: '',
                id_number: '',
                is_foreign: false,
              });
              setErrors({});
              setSubmissionStatus('idle');
              setProgress(0);
            }
          }
        ]
      );
      
      // Also try navigation as backup
      setTimeout(() => {
        router.replace({
          pathname: '/people/success',
          params: { id: result.userId, name: createdName, email: createdEmail }
        });
      }, 1000);
    } catch (error: any) {
      console.log('💥 ERROR in form submission:', error);
      setSubmissionStatus('error');

      // Fallback: if profile exists despite error, poll briefly and then treat as success
      try {
        const emailToCheck = formData.email.trim().toLowerCase();
        let existingProfile: any = null;
        const maxAttempts = 6; // ~3s total
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const { data } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('email', emailToCheck)
            .maybeSingle();
          if (data?.id) {
            existingProfile = data;
            break;
          }
          await new Promise(r => setTimeout(r, 500));
        }

        if (existingProfile?.id) {
          const createdName = `${existingProfile.first_name || ''} ${existingProfile.last_name || ''}`.trim() || formData.first_name;
          const createdEmail = existingProfile.email || emailToCheck;

          Alert.alert(
            'تم إنشاء المستخدم بنجاح!',
            `تم إنشاء حساب المستخدم ${createdName} (${createdEmail}) بنجاح.`,
            [
              {
                text: 'عرض التفاصيل',
                onPress: () => {
                  router.replace({
                    pathname: '/people/success',
                    params: { id: existingProfile.id, name: createdName, email: createdEmail }
                  });
                }
              },
              {
                text: 'العودة إلى القائمة',
                onPress: () => {
                  router.replace('/(tabs)/tenants');
                }
              }
            ]
          );

          // Also navigate after a short delay as backup
          setTimeout(() => {
            router.replace({
              pathname: '/people/success',
              params: { id: existingProfile.id, name: createdName, email: createdEmail }
            });
          }, 800);

          return; // exit catch after handling as success
        }
      } catch (probeErr) {
        // ignore and continue to show specific error messages below
      }

      // Handle specific error messages with better user feedback
      if (error.message?.includes('already registered') || error.message?.includes('duplicate key')) {
        setErrors({ email: 'هذا البريد الإلكتروني مسجل مسبقاً' });
        Alert.alert('خطأ', 'البريد الإلكتروني مسجل مسبقاً، يرجى استخدام بريد آخر');
      } else if (error.message?.includes('password') || error.message?.includes('weak password')) {
        setErrors({ password: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' });
        Alert.alert('خطأ', 'كلمة المرور ضعيفة جدًا، يجب أن تكون 6 أحرف على الأقل');
      } else if (error.message?.includes('network') || error.message?.includes('connection')) {
        Alert.alert('خطأ في الاتصال', 'يوجد مشكلة في الاتصال بالإنترنت، يرجى المحاولة مرة أخرى');
      } else if (error.message?.includes('timeout')) {
        Alert.alert('انتهت المهلة', 'استغرق العمل وقتًا طويلاً، يرجى المحاولة مرة أخرى');
      } else {
        Alert.alert('خطأ', error.message || 'فشل إنشاء حساب المستخدم، يرجى المحاولة مرة أخرى');
      }
    } finally {
      if (submissionStatus !== 'success') {
        setIsSubmitting(false);
        setLoading(false);
        setProgress(0);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="إضافة شخص"
        showBackButton={true}
        showNotifications={false}
        onBackPress={() => {
          // Per user request: always go to Tenants tab instantly
          router.replace('/(tabs)/tenants');
        }}
      />

      {/* Progress Bar */}
      {loading && (
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} color={theme.colors.primary} />
          <Text style={styles.progressText}>
            {submissionStatus === 'validating' && 'جاري التحقق من البيانات...'}
            {submissionStatus === 'creating' && 'جاري إنشاء الحساب...'}
            {submissionStatus === 'emailing' && 'جاري إرسال رسالة الترحيب...'}
            {submissionStatus === 'success' && '✅ اكتمل بنجاح!'}
          </Text>
        </View>
      )}

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
              onChangeText={(text) => handleFieldChange('first_name', text)}
              onBlur={() => handleFieldBlur('first_name')}
              mode="outlined"
              style={[styles.input, styles.halfInput, rtlStyles.textAlign('right')]}
              error={!!errors.first_name}
              right={touchedFields.first_name && !errors.first_name ? <TextInput.Icon icon="check" color={theme.colors.success} /> : undefined}
              textAlign="right"
              writingDirection={isRTL() ? 'rtl' : 'ltr'}
            />
            <TextInput
              label="اسم العائلة *"
              value={formData.last_name}
              onChangeText={(text) => handleFieldChange('last_name', text)}
              onBlur={() => handleFieldBlur('last_name')}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              error={!!errors.last_name}
              right={touchedFields.last_name && !errors.last_name ? <TextInput.Icon icon="check" color={theme.colors.success} /> : undefined}
              textAlign={isRTL() ? 'right' : 'left'}
            />
          </View>
          {(errors.first_name || errors.last_name) && (
            <Text style={[styles.errorText, rtlStyles.textAlign()]}>{errors.first_name || errors.last_name}</Text>
          )}

          <Text style={[styles.fieldLabel, rtlStyles.textAlign()]}>الدور *</Text>
          <View style={styles.roleButtonsContainer}>
            {[
              { value: 'tenant', label: 'مستأجر' },
              { value: 'owner', label: 'مالك' },
              { value: 'staff', label: 'موظف' },
              { value: 'manager', label: 'مدير' },
            ].map((button) => (
              <TouchableOpacity
                key={button.value}
                style={[
                  styles.roleButton,
                  formData.role === button.value && styles.roleButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, role: button.value as UserRole })}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    formData.role === button.value && styles.roleButtonTextActive,
                  ]}
                >
                  {button.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
            onChangeText={(text) => handleFieldChange('email', text)}
            onBlur={() => handleFieldBlur('email')}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            error={!!errors.email}
            left={<TextInput.Icon icon="email-outline" />}
            right={touchedFields.email && !errors.email ? <TextInput.Icon icon="check" color={theme.colors.success} /> : undefined}
            textAlign={isRTL ? 'right' : 'left'}
          />
          {errors.email && <Text style={[styles.errorText, rtlStyles.textAlign()]}>{errors.email}</Text>}

          <TextInput
            label="رقم الجوال"
            value={formData.phone_number}
            onChangeText={(text) => handleFieldChange('phone_number', text)}
            onBlur={() => handleFieldBlur('phone_number')}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            error={!!errors.phone_number}
            left={<TextInput.Icon icon="phone-outline" />}
            right={touchedFields.phone_number && !errors.phone_number ? <TextInput.Icon icon="check" color={theme.colors.success} /> : undefined}
            textAlign={isRTL ? 'right' : 'left'}
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
            onChangeText={(text) => handleFieldChange('password', text)}
            onBlur={() => handleFieldBlur('password')}
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
            textAlign={isRTL ? 'right' : 'left'}
          />
          {errors.password && <Text style={[styles.errorText, rtlStyles.textAlign()]}>{errors.password}</Text>}

          <TextInput
            label="تأكيد كلمة المرور *"
            value={formData.confirmPassword}
            onChangeText={(text) => handleFieldChange('confirmPassword', text)}
            onBlur={() => handleFieldBlur('confirmPassword')}
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
            textAlign={isRTL ? 'right' : 'left'}
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
              textAlign={isRTL() ? 'right' : 'left'}
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
                textAlign={isRTL() ? 'right' : 'left'}
              />
              <TextInput
                label="الدولة *"
                value={formData.country}
                onChangeText={(text) => setFormData({ ...formData, country: text })}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                error={!!errors.country}
                textAlign={isRTL() ? 'right' : 'left'}
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
                textAlign={isRTL() ? 'right' : 'left'}
              />
              <TextInput
                label="رقم الهوية"
                value={formData.id_number}
                onChangeText={(text) => setFormData({ ...formData, id_number: text })}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                textAlign={isRTL() ? 'right' : 'left'}
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
            onPress={() => {
              console.log('🔘 SUBMIT BUTTON PRESSED');
              handleSubmit();
            }}
            loading={loading || isSubmitting}
            disabled={loading || isSubmitting || submissionStatus === 'creating' || submissionStatus === 'emailing'}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            {submissionStatus === 'creating' ? 'جاري إنشاء الحساب...' :
             submissionStatus === 'emailing' ? 'جاري الإرسال...' :
             'إنشاء حساب مستخدم'}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

