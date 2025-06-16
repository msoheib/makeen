import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/lib/types';
import { ArrowLeft, User, Mail, Phone, UserCheck } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';

export default function AddPersonScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: 'tenant' as UserRole,
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const personData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_number: formData.phone_number.trim() || null,
        role: formData.role,
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([personData])
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Success',
        'Person added successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(drawer)/(tabs)/people'),
          },
        ]
      );
      
      // Automatically navigate back after a short delay
      setTimeout(() => {
        router.replace('/(drawer)/(tabs)/people');
      }, 1500);
    } catch (error: any) {
      console.error('Error adding person:', error);
      if (error.code === '23505') {
        setErrors({ email: 'This email address is already in use' });
      } else {
        Alert.alert('Error', error.message || 'Failed to add person');
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
        showMenu={false}
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
            {formData.role === 'staff' && (
              <Text style={styles.roleDescription}>
                Staff members can handle maintenance requests, manage work orders, 
                and assist with day-to-day operations.
              </Text>
            )}
            {formData.role === 'manager' && (
              <Text style={styles.roleDescription}>
                Managers have full access to manage properties, tenants, staff, 
                financial records, and generate reports.
              </Text>
            )}
          </View>
        </ModernCard>

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
            Add Person
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