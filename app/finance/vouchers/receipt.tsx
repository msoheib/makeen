import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, IconButton, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, Receipt, DollarSign, FileText, Calendar, Building, Users, CreditCard } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import AccountPicker from '@/components/AccountPicker';
import PropertyPicker from '@/components/PropertyPicker';
import CostCenterPicker from '@/components/CostCenterPicker';
import api from '@/lib/api';
import { navigateBack, navigateBackToSection } from '@/lib/navigation';

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  is_active: boolean;
}

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  property_code?: string;
  property_type: string;
  status: string;
}

interface CostCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface Tenant {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export default function ReceiptVoucherScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const user = useAppStore(state => state.user);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    voucher_number: '',
    amount: '',
    currency: 'SAR',
    status: 'draft' as 'draft' | 'posted',
    description: '',
    payment_method: 'cash' as 'cash' | 'bank_transfer' | 'cheque' | 'card',
    cheque_number: '',
    bank_reference: '',
    date: new Date().toISOString().split('T')[0], // Today's date
  });

  // Related entities state
  const [creditAccount, setCreditAccount] = useState<Account | null>(null); // Revenue account
  const [debitAccount, setDebitAccount] = useState<Account | null>(null); // Asset account (cash/bank)
  const [property, setProperty] = useState<Property | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [costCenter, setCostCenter] = useState<CostCenter | null>(null);
  
  // Tenants for selected property
  const [propertyTenants, setPropertyTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    generateVoucherNumber();
  }, []);

  // Load tenants when property changes
  useEffect(() => {
    if (property) {
      loadPropertyTenants();
    } else {
      setPropertyTenants([]);
      setTenant(null);
    }
  }, [property]);

  const generateVoucherNumber = async () => {
    try {
      const voucherNumber = await api.vouchers.generateVoucherNumber('receipt');
      setFormData(prev => ({ ...prev, voucher_number: voucherNumber }));
    } catch (error) {
      console.error('Error generating voucher number:', error);
      // Fallback generation
      const timestamp = Date.now().toString().slice(-6);
      setFormData(prev => ({ ...prev, voucher_number: `RCP-${timestamp}` }));
    }
  };

  const loadPropertyTenants = async () => {
    if (!property) return;
    
    setLoadingTenants(true);
    try {
      // Get contracts for this property to find tenants
      const contractsResponse = await api.contracts.getAll({
        property_id: property.id,
        status: 'active'
      });

      if (contractsResponse.data) {
        const tenantIds = contractsResponse.data
          .map(contract => contract.tenant_id)
          .filter(id => id !== null);
        
        if (tenantIds.length > 0) {
          const tenantsResponse = await api.profiles.getAll({
            role: 'tenant'
          });
          
          if (tenantsResponse.data) {
            const filteredTenants = tenantsResponse.data.filter(t => 
              tenantIds.includes(t.id)
            );
            setPropertyTenants(filteredTenants as Tenant[]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading property tenants:', error);
    } finally {
      setLoadingTenants(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.voucher_number.trim()) {
      newErrors.voucher_number = 'Voucher number is required';
    }
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Valid positive amount is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!creditAccount) {
      newErrors.creditAccount = 'Credit account (revenue) is required';
    }
    if (!debitAccount) {
      newErrors.debitAccount = 'Debit account (cash/bank) is required';
    }
    if (formData.payment_method === 'cheque' && !formData.cheque_number.trim()) {
      newErrors.cheque_number = 'Cheque number is required for cheque payments';
    }
    if (formData.payment_method === 'bank_transfer' && !formData.bank_reference.trim()) {
      newErrors.bank_reference = 'Bank reference is required for bank transfers';
    }
    if (tenant && !property) {
      newErrors.property = 'Property must be selected when tenant is specified';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول لإنشاء سند');
      return;
    }

    setLoading(true);
    try {
      const voucherData = {
        voucher_type: 'receipt' as const,
        voucher_number: formData.voucher_number.trim(),
        amount: Number(formData.amount),
        currency: formData.currency,
        status: formData.status,
        description: formData.description.trim(),
        property_id: property?.id || null,
        tenant_id: tenant?.id || null,
        account_id: creditAccount?.id || null, // Revenue account
        cost_center_id: costCenter?.id || null,
        payment_method: formData.payment_method,
        cheque_number: formData.payment_method === 'cheque' ? formData.cheque_number.trim() : null,
        bank_reference: formData.payment_method === 'bank_transfer' ? formData.bank_reference.trim() : null,
        created_by: user.id,
      };

      const response = await api.vouchers.create(voucherData);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create voucher');
      }

      Alert.alert(
        'تم بنجاح',
        'تم إنشاء سند القبض بنجاح!',
        [
          {
            text: 'حسناً',
            onPress: () => navigateBackToSection(),
          },
        ]
      );
      
      // Automatically navigate back after a short delay
      setTimeout(() => {
        navigateBackToSection();
      }, 1500);
    } catch (error: any) {
      console.error('Error creating receipt voucher:', error);
      if (error.code === '23505') {
        setErrors({ voucher_number: 'رقم السند هذا موجود بالفعل' });
      } else {
        Alert.alert('خطأ', error.message || 'فشل إنشاء سند القبض');
      }
    } finally {
      setLoading(false);
    }
  };

    const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginLeft: spacing.sm,
  },
  input: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  dateInput: {
    flex: 2,
  },
  currencyContainer: {
    flex: 1,
    alignItems: 'center',
  },
  currencyLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  currencyChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  currencyText: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  segmentedButtons: {
    marginBottom: spacing.sm,
  },
  statusInfo: {
    marginTop: spacing.xs,
  },
  statusDescription: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  tenantSection: {
    marginTop: spacing.sm,
  },
  tenantLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: spacing.md,
  },
  tenantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tenantChip: {
    marginBottom: spacing.xs,
  },
  noTenantsText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: spacing.sm,
  },
  submitContainer: {
    padding: spacing.md,
  },
  submitButton: {
    borderRadius: 12,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
});

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="سند قبض" 
        showBack 
        backAction={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Voucher Information */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Receipt size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>معلومات السند</Text>
          </View>

          <TextInput
            label="رقم السند *"
            value={formData.voucher_number}
            onChangeText={(text) => setFormData({ ...formData, voucher_number: text })}
            mode="outlined"
            style={styles.input}
            error={!!errors.voucher_number}
            right={<TextInput.Icon icon="refresh" onPress={generateVoucherNumber} />}
          />
          {errors.voucher_number && <Text style={styles.errorText}>{errors.voucher_number}</Text>}

          <View style={styles.row}>
            <TextInput
              label="التاريخ *"
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              mode="outlined"
              style={[styles.input, styles.dateInput]}
              placeholder="YYYY-MM-DD"
            />
            <View style={styles.currencyContainer}>
              <Text style={styles.currencyLabel}>العملة</Text>
              <Chip 
                style={styles.currencyChip}
                textStyle={styles.currencyText}
                mode="outlined"
              >
                SAR
              </Chip>
            </View>
          </View>

          <TextInput
            label="المبلغ *"
            value={formData.amount}
            onChangeText={(text) => setFormData({ ...formData, amount: text })}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            error={!!errors.amount}
            left={<TextInput.Icon icon="currency-sar" />}
            placeholder="0.00"
          />
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

          <TextInput
            label="الوصف *"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            error={!!errors.description}
            placeholder="أدخل وصف سند القبض..."
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </ModernCard>

        {/* Account Selection */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={theme.colors.secondary} />
            <Text style={styles.sectionTitle}>تصنيف الحساب</Text>
          </View>

          <AccountPicker
            label="حساب دائن (إيراد) *"
            value={creditAccount}
            onValueChange={setCreditAccount}
            accountType="revenue"
            error={!!errors.creditAccount}
            placeholder="اختر حساب الإيراد"
          />
          {errors.creditAccount && <Text style={styles.errorText}>{errors.creditAccount}</Text>}

          <AccountPicker
            label="حساب مدين (نقد/بنك) *"
            value={debitAccount}
            onValueChange={setDebitAccount}
            accountType="asset"
            error={!!errors.debitAccount}
            placeholder="اختر حساب النقدية أو البنك"
          />
          {errors.debitAccount && <Text style={styles.errorText}>{errors.debitAccount}</Text>}

          <CostCenterPicker
            label="مركز تكلفة (اختياري)"
            value={costCenter}
            onValueChange={setCostCenter}
            placeholder="اختر مركز التكلفة"
          />
        </ModernCard>

        {/* Property and Tenant Selection */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building size={20} color={theme.colors.tertiary} />
            <Text style={styles.sectionTitle}>العقار والمستأجر (اختياري)</Text>
          </View>

          <PropertyPicker
            label="العقار (اختياري)"
            value={property}
            onValueChange={setProperty}
            error={!!errors.property}
            placeholder="اختر العقار لسندات الإيجار"
          />
          {errors.property && <Text style={styles.errorText}>{errors.property}</Text>}

          {property && (
            <View style={styles.tenantSection}>
              <Text style={styles.tenantLabel}>المستأجر (اختياري)</Text>
              {loadingTenants ? (
                <Text style={styles.loadingText}>جاري تحميل المستأجرين...</Text>
              ) : propertyTenants.length > 0 ? (
                <View style={styles.tenantsList}>
                  {propertyTenants.map((t) => (
                    <Chip
                      key={t.id}
                      mode={tenant?.id === t.id ? 'flat' : 'outlined'}
                      selected={tenant?.id === t.id}
                      onPress={() => setTenant(tenant?.id === t.id ? null : t)}
                      style={styles.tenantChip}
                    >
                      {`${t.first_name || ''} ${t.last_name || ''}`.trim() || t.email || 'Unnamed Tenant'}
                    </Chip>
                  ))}
                </View>
              ) : (
                <Text style={styles.noTenantsText}>لا يوجد مستأجرون نشطون لهذا العقار</Text>
              )}
            </View>
          )}
        </ModernCard>

        {/* Payment Method */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>طريقة الدفع</Text>
          </View>

          <SegmentedButtons
            value={formData.payment_method}
            onValueChange={(value) => setFormData({ ...formData, payment_method: value as any })}
            buttons={[
              { value: 'cash', label: 'نقداً' },
              { value: 'bank_transfer', label: 'تحويل بنكي' },
              { value: 'cheque', label: 'شيك' },
              { value: 'card', label: 'بطاقة' },
            ]}
            style={styles.segmentedButtons}
          />

          {formData.payment_method === 'cheque' && (
            <>
              <TextInput
                label="رقم الشيك *"
                value={formData.cheque_number}
                onChangeText={(text) => setFormData({ ...formData, cheque_number: text })}
                mode="outlined"
                style={styles.input}
                error={!!errors.cheque_number}
                placeholder="أدخل رقم الشيك"
              />
              {errors.cheque_number && <Text style={styles.errorText}>{errors.cheque_number}</Text>}
            </>
          )}

          {formData.payment_method === 'bank_transfer' && (
            <>
              <TextInput
                label="رقم المرجع البنكي *"
                value={formData.bank_reference}
                onChangeText={(text) => setFormData({ ...formData, bank_reference: text })}
                mode="outlined"
                style={styles.input}
                error={!!errors.bank_reference}
                placeholder="أدخل رقم المرجع البنكي"
              />
              {errors.bank_reference && <Text style={styles.errorText}>{errors.bank_reference}</Text>}
            </>
          )}
        </ModernCard>

        {/* Status */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={theme.colors.secondary} />
            <Text style={styles.sectionTitle}>حالة السند</Text>
          </View>

          <SegmentedButtons
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as any })}
            buttons={[
              { value: 'draft', label: 'حفظ كمسودة' },
              { value: 'posted', label: 'ترحيل الآن' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.statusInfo}>
            {formData.status === 'draft' && (
              <Text style={styles.statusDescription}>
                يمكن تعديل السندات المسودة ولا تُحتسب في التقارير المالية.
              </Text>
            )}
            {formData.status === 'posted' && (
              <Text style={styles.statusDescription}>
                السندات المرحلة نهائية وتُحتسب في التقارير المالية.
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
            icon="receipt"
          >
            إنشاء سند قبض
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

 