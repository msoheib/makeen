import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, IconButton, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, CreditCard, DollarSign, FileText, Calendar, Building, Users, Receipt } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import AccountPicker from '@/components/AccountPicker';
import PropertyPicker from '@/components/PropertyPicker';
import CostCenterPicker from '@/components/CostCenterPicker';
import VendorPicker from '@/components/VendorPicker';
import api from '@/lib/api';

export default function PaymentVoucherScreen() {
  const router = useRouter();
  const { currency } = useAppStore();

  // Form state
  const [formData, setFormData] = useState({
    voucher_number: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
    payment_method: 'cash',
    cheque_number: '',
    bank_reference: '',
  });

  // Selection state
  const [debitAccount, setDebitAccount] = useState(null); // Expense account
  const [creditAccount, setCreditAccount] = useState(null); // Cash/Bank account
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedCostCenter, setSelectedCostCenter] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    generateVoucherNumber();
  }, []);

  const generateVoucherNumber = async () => {
    try {
      const number = await api.vouchers.generateVoucherNumber('payment');
      setFormData(prev => ({ ...prev, voucher_number: number }));
    } catch (error) {
      console.error('Failed to generate voucher number:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!debitAccount) {
      newErrors.debitAccount = 'Expense account is required';
    }

    if (!creditAccount) {
      newErrors.creditAccount = 'Payment account (cash/bank) is required';
    }

    if (formData.payment_method === 'cheque' && !formData.cheque_number.trim()) {
      newErrors.cheque_number = 'Cheque number is required';
    }

    if (formData.payment_method === 'bank_transfer' && !formData.bank_reference.trim()) {
      newErrors.bank_reference = 'Bank reference is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('خطأ في التحقق', 'يرجى تصحيح الأخطاء قبل الإرسال.');
      return;
    }

    setLoading(true);
    try {
      const paymentVoucher = {
        voucher_type: 'payment',
        voucher_number: formData.voucher_number,
        amount: parseFloat(formData.amount),
        currency: currency,
        description: formData.description,
        status: formData.status,
        property_id: selectedProperty?.id || null,
        created_by: null, // Will be set by backend
        payment_method: formData.payment_method,
        cheque_number: formData.cheque_number || null,
        bank_reference: formData.bank_reference || null,
        account_id: debitAccount?.id || null, // Expense account (debit)
        cost_center_id: selectedCostCenter?.id || null,
        created_at: new Date().toISOString(),
      };

      const response = await api.vouchers.create(paymentVoucher);

      if (response.success) {
        Alert.alert(
          'تم بنجاح',
          `تم ${formData.status === 'posted' ? 'إنشاء وترحيل' : 'حفظ'} سند الصرف ${formData.voucher_number} بنجاح!`,
          [
            {
              text: 'حسناً',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error(response.error || 'Failed to create payment voucher');
      }
    } catch (error) {
      console.error('Error creating payment voucher:', error);
      Alert.alert('خطأ', 'فشل إنشاء سند الصرف. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    return `${currency} ${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="سند صرف"
        subtitle="تسجيل المدفوعات والمصروفات"
        onBack={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Voucher Information */}
        <ModernCard title="معلومات السند" icon={FileText}>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>رقم السند</Text>
              <TextInput
                mode="outlined"
                value={formData.voucher_number}
                editable={false}
                style={styles.input}
                right={<TextInput.Icon icon="lock" />}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>التاريخ</Text>
              <TextInput
                mode="outlined"
                value={formData.date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                style={styles.input}
                right={<TextInput.Icon icon={() => <Calendar size={20} />} />}
              />
            </View>
          </View>

          <Text style={styles.label}>الوصف *</Text>
          <TextInput
            mode="outlined"
            placeholder="أدخل وصف الدفع (مثال: إيجار مكتب، أتعاب مقاول صيانة)"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
            style={styles.input}
            error={!!errors.description}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

          <Text style={styles.label}>المبلغ ({currency}) *</Text>
          <TextInput
            mode="outlined"
            placeholder="0.00"
            value={formData.amount}
            onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
            keyboardType="numeric"
            style={styles.input}
            left={<TextInput.Icon icon={() => <DollarSign size={20} />} />}
            error={!!errors.amount}
          />
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          {formData.amount && (
            <Text style={styles.amountPreview}>
              Amount: {formatAmount(formData.amount)}
            </Text>
          )}
        </ModernCard>

        {/* Account Selection */}
        <ModernCard title="اختيار الحسابات" icon={Receipt}>
          <Text style={styles.sectionNote}>
            اختر حساب المصروف (سبب الدفع) وحساب السداد (مصدر الأموال)
          </Text>
          
          <AccountPicker
            label="حساب المصروف (مدين) *"
            placeholder="اختر حساب المصروف"
            value={debitAccount}
            onValueChange={setDebitAccount}
            accountType="expense"
            error={!!errors.debitAccount}
          />
          {errors.debitAccount && <Text style={styles.errorText}>{errors.debitAccount}</Text>}

          <AccountPicker
            label="حساب السداد (دائن) *"
            placeholder="اختر حساب النقدية/البنك"
            value={creditAccount}
            onValueChange={setCreditAccount}
            accountType="asset"
            error={!!errors.creditAccount}
          />
          {errors.creditAccount && <Text style={styles.errorText}>{errors.creditAccount}</Text>}

          {debitAccount && creditAccount && (
            <View style={styles.accountingSummary}>
              <Text style={styles.accountingTitle}>القيد المحاسبي:</Text>
              <Text style={styles.accountingEntry}>
                مدين: {debitAccount.account_name} - {formatAmount(formData.amount)}
              </Text>
              <Text style={styles.accountingEntry}>
                دائن: {creditAccount.account_name} - {formatAmount(formData.amount)}
              </Text>
            </View>
          )}
        </ModernCard>

        {/* Vendor and Property Information */}
        <ModernCard title="معلومات إضافية" icon={Building}>
          <VendorPicker
            label="المورد/المتعهد"
            placeholder="اختر المورد أو المتعهد (اختياري)"
            value={selectedVendor}
            onValueChange={setSelectedVendor}
          />

          <PropertyPicker
            label="العقار"
            placeholder="اختر العقار (للمصروفات المرتبطة بالعقار)"
            value={selectedProperty}
            onValueChange={setSelectedProperty}
          />

          <CostCenterPicker
            label="مركز التكلفة"
            placeholder="اختر مركز التكلفة (اختياري)"
            value={selectedCostCenter}
            onValueChange={setSelectedCostCenter}
          />
        </ModernCard>

        {/* Payment Method */}
        <ModernCard title="طريقة الدفع" icon={CreditCard}>
          <SegmentedButtons
            value={formData.payment_method}
            onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
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
              <Text style={styles.label}>رقم الشيك *</Text>
              <TextInput
                mode="outlined"
                placeholder="أدخل رقم الشيك"
                value={formData.cheque_number}
                onChangeText={(text) => setFormData(prev => ({ ...prev, cheque_number: text }))}
                style={styles.input}
                error={!!errors.cheque_number}
              />
              {errors.cheque_number && <Text style={styles.errorText}>{errors.cheque_number}</Text>}
            </>
          )}

          {formData.payment_method === 'bank_transfer' && (
            <>
              <Text style={styles.label}>رقم المرجع البنكي *</Text>
              <TextInput
                mode="outlined"
                placeholder="أدخل رقم المرجع البنكي"
                value={formData.bank_reference}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bank_reference: text }))}
                style={styles.input}
                error={!!errors.bank_reference}
              />
              {errors.bank_reference && <Text style={styles.errorText}>{errors.bank_reference}</Text>}
            </>
          )}
        </ModernCard>

        {/* Status and Submit */}
        <ModernCard title="الحالة" icon={FileText}>
          <SegmentedButtons
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            buttons={[
              { value: 'draft', label: 'حفظ كمسودة' },
              { value: 'posted', label: 'ترحيل السند' },
            ]}
            style={styles.segmentedButtons}
          />

          <Text style={styles.statusNote}>
            {formData.status === 'draft' 
              ? 'سيتم حفظ السند كمسودة للمراجعة لاحقاً ولن يؤثر على الأرصدة.'
              : 'سيتم ترحيل السند وجعله نهائياً وسيؤثر على الأرصدة ولا يمكن التراجع.'
            }
          </Text>
        </ModernCard>

        <View style={styles.actions}>
          <Button 
            mode="outlined" 
            onPress={() => router.back()}
            style={styles.button}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            {formData.status === 'posted' ? 'إنشاء وترحيل' : 'حفظ كمسودة'}
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
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  amountPreview: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 8,
  },
  sectionNote: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  accountingSummary: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 8,
  },
  accountingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSecondaryContainer,
    marginBottom: spacing.xs,
  },
  accountingEntry: {
    fontSize: 14,
    color: theme.colors.onSecondaryContainer,
    fontFamily: 'monospace',
  },
  segmentedButtons: {
    marginBottom: spacing.md,
  },
  statusNote: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  button: {
    flex: 1,
  },
}); 