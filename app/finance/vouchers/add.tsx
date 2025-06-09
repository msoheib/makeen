import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { VoucherType, VoucherStatus } from '@/lib/types';
import { ArrowLeft, Receipt, DollarSign, FileText, Calendar } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';

export default function AddVoucherScreen() {
  const router = useRouter();
  const { property, tenant } = useLocalSearchParams();
  const user = useAppStore(state => state.user);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    voucher_type: 'receipt' as VoucherType,
    voucher_number: '',
    amount: '',
    currency: 'USD',
    status: 'draft' as VoucherStatus,
    description: '',
    property_id: property as string || '',
    tenant_id: tenant as string || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    generateVoucherNumber();
  }, [formData.voucher_type]);

  const generateVoucherNumber = () => {
    const prefix = formData.voucher_type.toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString().slice(-6);
    const voucherNumber = `${prefix}-${timestamp}`;
    setFormData(prev => ({ ...prev, voucher_number: voucherNumber }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.voucher_number.trim()) {
      newErrors.voucher_number = 'Voucher number is required';
    }
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a voucher');
      return;
    }

    setLoading(true);
    try {
      const voucherData = {
        voucher_type: formData.voucher_type,
        voucher_number: formData.voucher_number.trim(),
        amount: Number(formData.amount),
        currency: formData.currency,
        status: formData.status,
        description: formData.description.trim(),
        property_id: formData.property_id || null,
        tenant_id: formData.tenant_id || null,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('vouchers')
        .insert([voucherData])
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Success',
        'Voucher created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/finance'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating voucher:', error);
      if (error.code === '23505') {
        setErrors({ voucher_number: 'This voucher number already exists' });
      } else {
        Alert.alert('Error', error.message || 'Failed to create voucher');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>Add Voucher</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Voucher Type */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Receipt size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Voucher Type</Text>
          </View>

          <SegmentedButtons
            value={formData.voucher_type}
            onValueChange={(value) => setFormData({ ...formData, voucher_type: value as VoucherType })}
            buttons={[
              { value: 'receipt', label: 'Receipt' },
              { value: 'payment', label: 'Payment' },
              { value: 'journal', label: 'Journal' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.typeInfo}>
            {formData.voucher_type === 'receipt' && (
              <Text style={styles.typeDescription}>
                Receipt vouchers record money received from tenants or other sources.
              </Text>
            )}
            {formData.voucher_type === 'payment' && (
              <Text style={styles.typeDescription}>
                Payment vouchers record money paid out for expenses, maintenance, or other costs.
              </Text>
            )}
            {formData.voucher_type === 'journal' && (
              <Text style={styles.typeDescription}>
                Journal vouchers record internal transfers and adjustments.
              </Text>
            )}
          </View>
        </ModernCard>

        {/* Voucher Details */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={theme.colors.secondary} />
            <Text style={styles.sectionTitle}>Voucher Details</Text>
          </View>

          <TextInput
            label="Voucher Number *"
            value={formData.voucher_number}
            onChangeText={(text) => setFormData({ ...formData, voucher_number: text })}
            mode="outlined"
            style={styles.input}
            error={!!errors.voucher_number}
            right={<TextInput.Icon icon="refresh\" onPress={generateVoucherNumber} />}
          />
          {errors.voucher_number && <Text style={styles.errorText}>{errors.voucher_number}</Text>}

          <View style={styles.row}>
            <TextInput
              label="Amount *"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, styles.amountInput]}
              error={!!errors.amount}
              left={<TextInput.Icon icon="currency-usd" />}
            />
            <TextInput
              label="Currency"
              value={formData.currency}
              onChangeText={(text) => setFormData({ ...formData, currency: text })}
              mode="outlined"
              style={[styles.input, styles.currencyInput]}
            />
          </View>
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

          <TextInput
            label="Description *"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            error={!!errors.description}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </ModernCard>

        {/* Status */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={theme.colors.tertiary} />
            <Text style={styles.sectionTitle}>Status</Text>
          </View>

          <SegmentedButtons
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as VoucherStatus })}
            buttons={[
              { value: 'draft', label: 'Draft' },
              { value: 'posted', label: 'Posted' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.statusInfo}>
            {formData.status === 'draft' && (
              <Text style={styles.statusDescription}>
                Draft vouchers can be edited and are not included in financial reports.
              </Text>
            )}
            {formData.status === 'posted' && (
              <Text style={styles.statusDescription}>
                Posted vouchers are final and will be included in financial reports.
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
            Create Voucher
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
  headerSpacer: {
    width: 40,
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
  amountInput: {
    width: '70%',
  },
  currencyInput: {
    width: '25%',
  },
  segmentedButtons: {
    marginBottom: spacing.m,
  },
  typeInfo: {
    backgroundColor: theme.colors.primaryContainer,
    padding: spacing.m,
    borderRadius: 8,
  },
  typeDescription: {
    fontSize: 14,
    color: theme.colors.primary,
    lineHeight: 20,
  },
  statusInfo: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.m,
    borderRadius: 8,
  },
  statusDescription: {
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