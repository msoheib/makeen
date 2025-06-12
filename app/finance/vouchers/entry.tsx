import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, FileText, Calendar, Plus, Scale, DollarSign } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import EntryLineItem from '@/components/EntryLineItem';
import BalanceDisplay from '@/components/BalanceDisplay';
import PropertyPicker from '@/components/PropertyPicker';
import api from '@/lib/api';

interface EntryLine {
  id: string;
  account: any;
  amount: string;
  description: string;
  costCenter: any;
}

export default function JournalEntryScreen() {
  const router = useRouter();
  const { currency } = useAppStore();

  // Form state
  const [formData, setFormData] = useState({
    voucher_number: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
  });

  // Entry lines state
  const [debitEntries, setDebitEntries] = useState<EntryLine[]>([
    { id: '1', account: null, amount: '', description: '', costCenter: null }
  ]);
  const [creditEntries, setCreditEntries] = useState<EntryLine[]>([
    { id: '2', account: null, amount: '', description: '', costCenter: null }
  ]);

  // Selection state
  const [selectedProperty, setSelectedProperty] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    generateVoucherNumber();
  }, []);

  const generateVoucherNumber = async () => {
    try {
      const number = await api.vouchers.generateVoucherNumber('journal');
      setFormData(prev => ({ ...prev, voucher_number: number }));
    } catch (error) {
      console.error('Failed to generate voucher number:', error);
    }
  };

  // Calculate totals
  const calculateTotal = (entries: EntryLine[]) => {
    return entries.reduce((total, entry) => {
      const amount = parseFloat(entry.amount) || 0;
      return total + amount;
    }, 0);
  };

  const totalDebits = calculateTotal(debitEntries);
  const totalCredits = calculateTotal(creditEntries);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  // Entry management functions
  const generateEntryId = () => Math.random().toString(36).substr(2, 9);

  const addDebitEntry = () => {
    const newEntry: EntryLine = {
      id: generateEntryId(),
      account: null,
      amount: '',
      description: '',
      costCenter: null
    };
    setDebitEntries(prev => [...prev, newEntry]);
  };

  const addCreditEntry = () => {
    const newEntry: EntryLine = {
      id: generateEntryId(),
      account: null,
      amount: '',
      description: '',
      costCenter: null
    };
    setCreditEntries(prev => [...prev, newEntry]);
  };

  const removeDebitEntry = (id: string) => {
    if (debitEntries.length > 1) {
      setDebitEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const removeCreditEntry = (id: string) => {
    if (creditEntries.length > 1) {
      setCreditEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const updateDebitEntry = (id: string, field: string, value: any) => {
    setDebitEntries(prev => 
      prev.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const updateCreditEntry = (id: string, field: string, value: any) => {
    setCreditEntries(prev => 
      prev.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic form validation
    if (!formData.description.trim()) {
      newErrors.description = 'Journal entry description is required';
    }

    // Entry validation
    if (debitEntries.length === 0 || creditEntries.length === 0) {
      newErrors.entries = 'At least one debit and one credit entry required';
    }

    // Balance validation
    if (!isBalanced) {
      newErrors.balance = 'Debit and credit entries must be balanced';
    }

    // Individual entry validation
    let hasValidEntries = false;
    [...debitEntries, ...creditEntries].forEach((entry, index) => {
      const entryType = index < debitEntries.length ? 'debit' : 'credit';
      
      if (!entry.account) {
        newErrors[`${entryType}_${entry.id}_account`] = 'Account is required';
      }
      if (!entry.amount || parseFloat(entry.amount) <= 0) {
        newErrors[`${entryType}_${entry.id}_amount`] = 'Amount must be greater than 0';
      }
      if (!entry.description.trim()) {
        newErrors[`${entryType}_${entry.id}_description`] = 'Description is required';
      }

      if (entry.account && entry.amount && parseFloat(entry.amount) > 0 && entry.description.trim()) {
        hasValidEntries = true;
      }
    });

    if (!hasValidEntries) {
      newErrors.entries = 'At least one complete entry is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting.');
      return;
    }

    setLoading(true);
    try {
      // Create the main journal entry voucher
      const journalEntry = {
        voucher_type: 'journal',
        voucher_number: formData.voucher_number,
        amount: totalDebits, // Total amount (debits should equal credits)
        currency: currency,
        description: formData.description,
        status: formData.status,
        property_id: selectedProperty?.id || null,
        created_by: null, // Will be set by backend
        created_at: new Date().toISOString(),
      };

      const response = await api.vouchers.create(journalEntry);

      if (response.success) {
        Alert.alert(
          'Success',
          `Journal entry ${formData.voucher_number} ${formData.status === 'posted' ? 'created and posted' : 'saved as draft'} successfully!\n\nTotal Amount: ${currency} ${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error(response.error || 'Failed to create journal entry');
      }
    } catch (error) {
      console.error('Error creating journal entry:', error);
      Alert.alert('Error', 'Failed to create journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getEntryErrors = (entryId: string, type: 'debit' | 'credit') => {
    return {
      account: errors[`${type}_${entryId}_account`],
      amount: errors[`${type}_${entryId}_amount`],
      description: errors[`${type}_${entryId}_description`],
    };
  };

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="Journal Entry"
        subtitle="Create manual accounting entries"
        onBack={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Journal Entry Information */}
        <ModernCard title="Journal Entry Information" icon={FileText}>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Voucher Number</Text>
              <TextInput
                mode="outlined"
                value={formData.voucher_number}
                editable={false}
                style={styles.input}
                right={<TextInput.Icon icon="lock" />}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                mode="outlined"
                value={formData.date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                style={styles.input}
                right={<TextInput.Icon icon={() => <Calendar size={20} />} />}
              />
            </View>
          </View>

          <Text style={styles.label}>Journal Entry Description *</Text>
          <TextInput
            mode="outlined"
            placeholder="Enter journal entry description (e.g., Month-end depreciation, Accrual adjustment)"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
            style={styles.input}
            error={!!errors.description}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

          <PropertyPicker
            label="Property (Optional)"
            placeholder="Select property for property-related entries"
            value={selectedProperty}
            onValueChange={setSelectedProperty}
          />
        </ModernCard>

        {/* Balance Display */}
        <BalanceDisplay
          totalDebits={totalDebits}
          totalCredits={totalCredits}
          currency={currency}
        />

        {/* Debit Entries */}
        <ModernCard title="Debit Entries" icon={DollarSign}>
          <Text style={styles.sectionNote}>
            Debit entries increase assets and expenses, decrease liabilities and equity
          </Text>
          
          {debitEntries.map((entry, index) => (
            <EntryLineItem
              key={entry.id}
              entry={entry}
              type="debit"
              currency={currency}
              onUpdate={updateDebitEntry}
              onRemove={removeDebitEntry}
              canRemove={debitEntries.length > 1}
              errors={getEntryErrors(entry.id, 'debit')}
            />
          ))}

          <Button
            mode="outlined"
            onPress={addDebitEntry}
            style={styles.addButton}
            icon={() => <Plus size={20} color={theme.colors.primary} />}
          >
            Add Debit Entry
          </Button>
        </ModernCard>

        {/* Credit Entries */}
        <ModernCard title="Credit Entries" icon={DollarSign}>
          <Text style={styles.sectionNote}>
            Credit entries increase liabilities, equity, and revenue, decrease assets
          </Text>
          
          {creditEntries.map((entry, index) => (
            <EntryLineItem
              key={entry.id}
              entry={entry}
              type="credit"
              currency={currency}
              onUpdate={updateCreditEntry}
              onRemove={removeCreditEntry}
              canRemove={creditEntries.length > 1}
              errors={getEntryErrors(entry.id, 'credit')}
            />
          ))}

          <Button
            mode="outlined"
            onPress={addCreditEntry}
            style={styles.addButton}
            icon={() => <Plus size={20} color={theme.colors.secondary} />}
          >
            Add Credit Entry
          </Button>
        </ModernCard>

        {/* Entry Summary */}
        <ModernCard title="Entry Summary" icon={Scale}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Debits:</Text>
              <Text style={[styles.summaryAmount, styles.debitColor]}>
                {formatAmount(totalDebits)}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Credits:</Text>
              <Text style={[styles.summaryAmount, styles.creditColor]}>
                {formatAmount(totalCredits)}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Balance Status:</Text>
              <Chip 
                mode={isBalanced ? "flat" : "outlined"}
                style={[
                  styles.balanceChip,
                  isBalanced ? styles.balancedChip : styles.unbalancedChip
                ]}
                textStyle={{
                  color: isBalanced ? theme.colors.primary : theme.colors.error
                }}
              >
                {isBalanced ? 'Balanced' : 'Unbalanced'}
              </Chip>
            </View>
          </View>
          
          {errors.balance && <Text style={styles.errorText}>{errors.balance}</Text>}
          {errors.entries && <Text style={styles.errorText}>{errors.entries}</Text>}
        </ModernCard>

        {/* Status and Submit */}
        <ModernCard title="Status" icon={FileText}>
          <SegmentedButtons
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            buttons={[
              { value: 'draft', label: 'Save as Draft' },
              { value: 'posted', label: 'Post Entry' },
            ]}
            style={styles.segmentedButtons}
          />

          <Text style={styles.statusNote}>
            {formData.status === 'draft' 
              ? 'Save as draft to review later. The entry will not affect account balances.'
              : 'Post entry to make it final. This will update account balances and cannot be undone.'
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
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSubmit}
            style={[
              styles.button,
              !isBalanced && styles.disabledButton
            ]}
            loading={loading}
            disabled={loading || !isBalanced}
          >
            {formData.status === 'posted' ? 'Create & Post' : 'Save Draft'}
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
  sectionNote: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  addButton: {
    marginTop: spacing.md,
    borderColor: theme.colors.primary,
  },
  summaryContainer: {
    padding: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  debitColor: {
    color: theme.colors.primary,
  },
  creditColor: {
    color: theme.colors.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.outline,
    marginVertical: spacing.sm,
  },
  balanceChip: {
    paddingHorizontal: spacing.sm,
  },
  balancedChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  unbalancedChip: {
    backgroundColor: theme.colors.errorContainer,
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
  disabledButton: {
    opacity: 0.6,
  },
}); 