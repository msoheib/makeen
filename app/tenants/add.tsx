import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, TextInput, Switch, HelperText, Divider, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { profilesApi } from '@/lib/api';
import { ArrowLeft, User, Mail, Phone, MapPin, FileText } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { useTranslation } from '@/lib/useTranslation';

interface TenantFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  nationality: string;
  id_number: string;
  status: 'active' | 'inactive' | 'suspended';
  is_foreign: boolean;
  role: string;
  profile_type: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  id_number?: string;
}

export default function AddTenantScreen() {
  const router = useRouter();
  const { t } = useTranslation('tenants');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TenantFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Saudi Arabia',
    nationality: 'Saudi',
    id_number: '',
    status: 'active',
    is_foreign: false,
    role: 'tenant',
    profile_type: 'tenant',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (formData.is_foreign && !formData.nationality.trim()) {
      newErrors.nationality = 'Nationality is required for foreign tenants';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors and try again.');
      return;
    }

    setLoading(true);
    try {
      const response = await profilesApi.create(formData);
      
      if (response.success && response.data) {
        Alert.alert(
          'Success',
          'Tenant created successfully!',
          [
            {
              text: 'View Details',
              onPress: () => router.push(`/tenants/${response.data.id}`),
            },
            {
              text: 'Back to List',
              onPress: () => router.push('/(drawer)/(tabs)/tenants'),
            },
          ]
        );
      } else {
        throw new Error(response.error || 'Failed to create tenant');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof TenantFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleForeignTenantToggle = (value: boolean) => {
    updateFormData('is_foreign', value);
    if (!value) {
      updateFormData('nationality', 'Saudi');
    }
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('add.title')}
        subtitle={t('add.subtitle')}
        variant="dark"
        showNotifications={false}
        isHomepage={false}
        leftIcon={<ArrowLeft size={24} color={theme.colors.onPrimary} />}
        onLeftPress={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Personal Information */}
        <ModernCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('details.personalInfo')}</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <TextInput
                label="First Name *"
                value={formData.first_name}
                onChangeText={(text) => updateFormData('first_name', text)}
                error={!!errors.first_name}
                mode="outlined"
                left={<TextInput.Icon icon={() => <User size={20} color={theme.colors.onSurfaceVariant} />} />}
              />
              <HelperText type="error" visible={!!errors.first_name}>
                {errors.first_name}
              </HelperText>
            </View>

            <View style={styles.halfWidth}>
              <TextInput
                label="Last Name *"
                value={formData.last_name}
                onChangeText={(text) => updateFormData('last_name', text)}
                error={!!errors.last_name}
                mode="outlined"
                left={<TextInput.Icon icon={() => <User size={20} color={theme.colors.onSurfaceVariant} />} />}
              />
              <HelperText type="error" visible={!!errors.last_name}>
                {errors.last_name}
              </HelperText>
            </View>
          </View>

          <TextInput
            label={`${t('details.email')} *`}
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
            error={!!errors.email}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon={() => <Mail size={20} color={theme.colors.onSurfaceVariant} />} />}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>

          <TextInput
            label={`${t('details.phone')} *`}
            value={formData.phone}
            onChangeText={(text) => updateFormData('phone', text)}
            error={!!errors.phone}
            mode="outlined"
            keyboardType="phone-pad"
            left={<TextInput.Icon icon={() => <Phone size={20} color={theme.colors.onSurfaceVariant} />} />}
          />
          <HelperText type="error" visible={!!errors.phone}>
            {errors.phone}
          </HelperText>

          <TextInput
            label={`${t('details.address')} *`}
            value={formData.address}
            onChangeText={(text) => updateFormData('address', text)}
            error={!!errors.address}
            mode="outlined"
            multiline
            numberOfLines={2}
            left={<TextInput.Icon icon={() => <MapPin size={20} color={theme.colors.onSurfaceVariant} />} />}
          />
          <HelperText type="error" visible={!!errors.address}>
            {errors.address}
          </HelperText>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <TextInput
                label="City *"
                value={formData.city}
                onChangeText={(text) => updateFormData('city', text)}
                error={!!errors.city}
                mode="outlined"
              />
              <HelperText type="error" visible={!!errors.city}>
                {errors.city}
              </HelperText>
            </View>

            <View style={styles.halfWidth}>
              <TextInput
                label="Country *"
                value={formData.country}
                onChangeText={(text) => updateFormData('country', text)}
                error={!!errors.country}
                mode="outlined"
              />
              <HelperText type="error" visible={!!errors.country}>
                {errors.country}
              </HelperText>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Foreign Tenant</Text>
            <Switch
              value={formData.is_foreign}
              onValueChange={handleForeignTenantToggle}
            />
          </View>

          {formData.is_foreign && (
            <View style={styles.foreignSection}>
              <TextInput
                label={`${t('details.nationality')} *`}
                value={formData.nationality}
                onChangeText={(text) => updateFormData('nationality', text)}
                error={!!errors.nationality}
                mode="outlined"
              />
              <HelperText type="error" visible={!!errors.nationality}>
                {errors.nationality}
              </HelperText>
            </View>
          )}

          <TextInput
            label={t('details.idNumber')}
            value={formData.id_number}
            onChangeText={(text) => updateFormData('id_number', text)}
            mode="outlined"
            left={<TextInput.Icon icon={() => <FileText size={20} color={theme.colors.onSurfaceVariant} />} />}
          />

          <Divider style={styles.divider} />

          <Text style={styles.fieldLabel}>Status</Text>
          <SegmentedButtons
            value={formData.status}
            onValueChange={(value) => updateFormData('status', value)}
            buttons={[
              { value: 'active', label: t('common:active') },
              { value: 'inactive', label: t('common:inactive') },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        </ModernCard>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.cancelButton}
            disabled={loading}
          >
            {t('common:cancel')}
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading}
            disabled={loading}
          >
            {t('add.createProfile')}
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
  sectionCard: {
    margin: spacing.m,
    padding: spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.l,
  },
  formInput: {
    marginBottom: spacing.s,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  halfWidth: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.m,
  },
  switchContent: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  switchDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  divider: {
    marginVertical: spacing.m,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
  },
  segmentedButtons: {
    marginBottom: spacing.m,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.m,
    padding: spacing.l,
    paddingBottom: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    borderColor: theme.colors.outline,
  },
  submitButton: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.m,
  },
  foreignSection: {
    marginBottom: spacing.m,
  },
}); 