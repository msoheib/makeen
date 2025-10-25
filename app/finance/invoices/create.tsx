import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Chip, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, FileText, Plus, Calendar } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import InvoiceLineItem from '@/components/InvoiceLineItem';
import VATCalculator from '@/components/VATCalculator';
import PropertyPicker from '@/components/PropertyPicker';
import { useApi } from '@/hooks/useApi';
import api, { invoicesApi } from '@/lib/api';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total?: number;
  vat_amount?: number;
  total_with_vat?: number;
}

export default function CreateInvoiceScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { currentUser } = useAppStore();
  
  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerType, setCustomerType] = useState<'tenant' | 'client'>('tenant');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState('30 days');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'sent'>('draft');
  const [vatRate, setVATRate] = useState(15);
  const [vatIncluded, setVATIncluded] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unit_price: 0,
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API hooks
  const { data: tenants, loading: tenantsLoading } = useApi(() => api.profiles.getTenants(), []);
  const { data: clients, loading: clientsLoading } = useApi(() => api.clients.getAll(), []);

  // Generate invoice number on component mount
  useEffect(() => {
    const generateInvoiceNumber = async () => {
      const number = await invoicesApi.generateInvoiceNumber();
      setInvoiceNumber(number);
    };
    generateInvoiceNumber();
  }, []);

  // Calculate due date when issue date or payment terms change
  useEffect(() => {
    if (issueDate && paymentTerms) {
      const calculatedDueDate = invoicesApi.calculateDueDate(issueDate, paymentTerms);
      setDueDate(calculatedDueDate);
    }
  }, [issueDate, paymentTerms]);

  const customerTypeOptions = [
    { value: 'tenant', label: 'Tenant' },
    { value: 'client', label: 'Client' },
  ];

  const paymentTermsOptions = [
    { value: '15 days', label: '15 Days' },
    { value: '30 days', label: '30 Days' },
    { value: '60 days', label: '60 Days' },
    { value: '90 days', label: '90 Days' },
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Send Now' },
  ];

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit_price: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, updatedItem: Partial<LineItem>) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, ...updatedItem } : item
    ));
  };

  const validateForm = () => {
    if (!selectedCustomer) {
      Alert.alert('Validation Error', 'Please select a customer');
      return false;
    }

    if (!lineItems.some(item => item.description && item.quantity > 0 && item.unit_price > 0)) {
      Alert.alert('Validation Error', 'Please add at least one valid line item');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Calculate invoice totals
      const calculations = invoicesApi.calculateInvoiceTotals(lineItems, vatRate);
      
      const invoiceData = {
        invoice_number: invoiceNumber,
        tenant_id: customerType === 'tenant' ? selectedCustomer.id : null,
        property_id: selectedProperty?.id || null,
        amount: calculations.subtotal,
        vat_amount: calculations.totalVAT,
        total_amount: calculations.totalAmount,
        issue_date: issueDate,
        due_date: dueDate,
        status,
        description: lineItems.map(item => item.description).join(', '),
        tax_rate: vatRate,
        discount_amount: discountAmount,
        payment_terms: paymentTerms,
      };

      const response = await api.invoices.create(invoiceData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          `Invoice ${invoiceNumber} created successfully!`,
          [
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      } else {
        throw new Error(response.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      Alert.alert('Error', 'Failed to create invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSAR = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.line_total || 0), 0);
  const calculations = invoicesApi.calculateInvoiceTotals(lineItems, vatRate);

    const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  headerCard: {
    marginBottom: spacing.md,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceTitle: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  invoiceNumber: {
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  controlContainer: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.sm,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  segmentedButtons: {
    marginTop: spacing.xs,
  },
  placeholder: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    padding: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  dateText: {
    color: theme.colors.onSurface,
    fontWeight: '500',
    padding: spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  lineItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  submitContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  submitButton: {
    marginBottom: spacing.sm,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
  totalPreview: {
    textAlign: 'center',
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Create VAT Invoice"
        leftButton={{
          icon: ArrowLeft,
          onPress: () => router.back(),
        }}
        rightButton={{
          icon: FileText,
          onPress: () => {},
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Invoice Header */}
        <ModernCard style={styles.headerCard}>
          <View style={styles.invoiceHeader}>
            <View>
              <Text variant="headlineSmall" style={styles.invoiceTitle}>
                VAT Invoice
              </Text>
              <Text variant="bodyLarge" style={styles.invoiceNumber}>
                {invoiceNumber}
              </Text>
            </View>
            <Chip icon="check-circle" mode="outlined">
              KSA VAT Compliant
            </Chip>
          </View>
        </ModernCard>

        {/* Customer Selection */}
        <ModernCard>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Customer Information
          </Text>
          
          <View style={styles.controlContainer}>
            <Text variant="labelMedium" style={styles.label}>
              Customer Type
            </Text>
            <SegmentedButtons
              value={customerType}
              onValueChange={setCustomerType}
              buttons={customerTypeOptions}
              style={styles.segmentedButtons}
            />
          </View>

          <View style={styles.controlContainer}>
            <Text variant="labelMedium" style={styles.label}>
              Select Customer *
            </Text>
            {/* Customer picker would go here - simplified for this implementation */}
            <Text variant="bodyMedium" style={styles.placeholder}>
              {selectedCustomer ? 
                `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : 
                'Tap to select customer'
              }
            </Text>
          </View>

          {/* Property Selection (for tenants) */}
          {customerType === 'tenant' && (
            <View style={styles.controlContainer}>
              <PropertyPicker
                selectedProperty={selectedProperty}
                onPropertyChange={setSelectedProperty}
                label="Related Property (Optional)"
              />
            </View>
          )}
        </ModernCard>

        {/* Invoice Details */}
        <ModernCard>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Invoice Details
          </Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text variant="labelMedium" style={styles.label}>
                Issue Date *
              </Text>
              <Text variant="bodyMedium" style={styles.dateText}>
                {new Date(issueDate).toLocaleDateString('en-US')}
              </Text>
            </View>

            <View style={styles.halfWidth}>
              <Text variant="labelMedium" style={styles.label}>
                Due Date
              </Text>
              <Text variant="bodyMedium" style={styles.dateText}>
                {new Date(dueDate).toLocaleDateString('en-US')}
              </Text>
            </View>
          </View>

          <View style={styles.controlContainer}>
            <Text variant="labelMedium" style={styles.label}>
              Payment Terms
            </Text>
            <SegmentedButtons
              value={paymentTerms}
              onValueChange={setPaymentTerms}
              buttons={paymentTermsOptions}
              style={styles.segmentedButtons}
            />
          </View>

          <View style={styles.controlContainer}>
            <Text variant="labelMedium" style={styles.label}>
              Invoice Status
            </Text>
            <SegmentedButtons
              value={status}
              onValueChange={setStatus}
              buttons={statusOptions}
              style={styles.segmentedButtons}
            />
          </View>
        </ModernCard>

        {/* Line Items */}
        <ModernCard>
          <View style={styles.lineItemsHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Line Items
            </Text>
            <Button
              mode="outlined"
              icon={({ size, color }) => <Plus size={size} color={color} />}
              onPress={addLineItem}
              compact
            >
              Add Item
            </Button>
          </View>

          {lineItems.map((item, index) => (
            <InvoiceLineItem
              key={item.id}
              item={item}
              vatRate={vatRate}
              onUpdate={(updatedItem) => updateLineItem(item.id, updatedItem)}
              onRemove={() => removeLineItem(item.id)}
              canRemove={lineItems.length > 1}
            />
          ))}
        </ModernCard>

        {/* VAT Calculator */}
        <VATCalculator
          subtotal={subtotal}
          vatRate={vatRate}
          discountAmount={discountAmount}
          vatIncluded={vatIncluded}
          onVATRateChange={setVATRate}
          onVATIncludedChange={setVATIncluded}
          lineItemTotals={calculations.lineItemTotals}
        />

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            {status === 'draft' ? 'Save as Draft' : 'Create & Send Invoice'}
          </Button>
          
          <Text variant="bodySmall" style={styles.totalPreview}>
            Total: {formatSAR(calculations.totalAmount)}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

 