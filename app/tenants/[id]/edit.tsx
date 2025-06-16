import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, TextInput, Switch, HelperText, Divider, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { profilesApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { User, Mail, Phone, MapPin, FileText } from 'lucide-react-native';
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
}

export default function EditTenantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
    country: '',
    nationality: '',
    id_number: '',
    status: 'active',
    is_foreign: false,
  });

  // Fetch tenant data
  const { 
    data: tenant, 
    loading: tenantLoading, 
    error: tenantError,
    refetch: refetchTenant 
  } = useApi(() => profilesApi.getById(id!), [id]);

  // Pre-populate form when tenant data loads
  useEffect(() => {
    if (tenant) {
      setFormData({
        first_name: tenant.first_name || '',
        last_name: tenant.last_name || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
        city: tenant.city || '',
        country: tenant.country || '',
        nationality: tenant.nationality || '',
        id_number: tenant.id_number || '',
        status: tenant.status || 'active',
        is_foreign: tenant.is_foreign || false,
      });
    }
  }, [tenant]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await profilesApi.update(id!, formData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Tenant updated successfully!',
          [
            {
              text: 'View Details',
              onPress: () => router.push(`/tenants/${id}`),
            },
          ]
        );
      } else {
        throw new Error(response.error || 'Failed to update tenant');
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

  if (tenantLoading) {
    return (
      <View style={styles.container}>
        <ModernHeader
          title={t('edit.title')}
          subtitle={t('edit.loading')}
          showBackButton={true}
          showMenu={false}
          showNotifications={false}
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('edit.loading')}</Text>
        </View>
      </View>
    );
  }

  if (tenantError || !tenant) {
    return (
      <View style={styles.container}>
        <ModernHeader
          title={t('edit.title')}
          subtitle={t('edit.error')}
          showBackButton={true}
          showMenu={false}
          showNotifications={false}
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorTitle}>{t('edit.error')}</Text>
          <Button mode="contained" onPress={() => router.back()}>
            {t('common:back')}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('edit.title')}
        subtitle={`${t('common:edit')} ${tenant.first_name} ${tenant.last_name}`}
        showBackButton={true}
        showMenu={false}
        showNotifications={false}
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ModernCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('details.personalInfo')}</Text>
          
          <TextInput
            label="First Name"
            value={formData.first_name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
            mode="outlined"
            style={styles.formInput}
          />

          <TextInput
            label="Last Name"
            value={formData.last_name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
            mode="outlined"
            style={styles.formInput}
          />

          <TextInput
            label={t('details.email')}
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            mode="outlined"
            style={styles.formInput}
            keyboardType="email-address"
          />

          <TextInput
            label={t('details.phone')}
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            mode="outlined"
            style={styles.formInput}
            keyboardType="phone-pad"
          />

          <TextInput
            label={t('details.address')}
            value={formData.address}
            onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
            mode="outlined"
            style={styles.formInput}
            multiline
          />

          <View style={styles.row}>
            <TextInput
              label="City"
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              mode="outlined"
              style={[styles.formInput, styles.halfWidth]}
            />

            <TextInput
              label="Country"
              value={formData.country}
              onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
              mode="outlined"
              style={[styles.formInput, styles.halfWidth]}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Foreign Tenant</Text>
            <Switch
              value={formData.is_foreign}
              onValueChange={(value) => setFormData(prev => ({ ...prev, is_foreign: value }))}
            />
          </View>

          {formData.is_foreign && (
            <TextInput
              label={t('details.nationality')}
              value={formData.nationality}
              onChangeText={(text) => setFormData(prev => ({ ...prev, nationality: text }))}
              mode="outlined"
              style={styles.formInput}
            />
          )}

          <Text style={styles.fieldLabel}>Status</Text>
          <SegmentedButtons
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            buttons={[
              { value: 'active', label: t('common:active') },
              { value: 'inactive', label: t('common:inactive') },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        </ModernCard>

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
            {loading ? t('edit.savingChanges') : `${t('common:edit')} ${t('title').slice(0, -1)}`}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.m,
    color: theme.colors.onSurfaceVariant,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.error,
    marginBottom: spacing.m,
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
    marginBottom: spacing.m,
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
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
    marginTop: spacing.m,
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
}); 