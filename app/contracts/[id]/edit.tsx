import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, BackHandler } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  TextInput,
  SegmentedButtons,
  Chip,
  ActivityIndicator,
  Menu,
  Dialog,
  Portal
} from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import { contractsApi, propertiesApi, profilesApi } from '@/lib/api';
import { spacing } from '@/lib/theme';
import { ModernHeader } from '@/components/ModernHeader';
import { 
  FileText, 
  MapPin, 
  User, 
  Calendar,
  DollarSign,
  ChevronDown,
  Save,
  X
} from 'lucide-react-native';

interface ContractForm {
  contract_type: 'rental' | 'sale' | 'management';
  property_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  rent_amount: string;
  security_deposit: string;
  payment_frequency: 'monthly' | 'quarterly' | 'biannually' | 'annually';
  auto_renewal: boolean;
  notice_period_days: string;
  late_fee_percentage: string;
  utilities_included: boolean;
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'renewal';
}

export default function EditContractScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Form state
  const [form, setForm] = useState<ContractForm>({
    contract_type: 'rental',
    property_id: '',
    tenant_id: '',
    start_date: '',
    end_date: '',
    rent_amount: '',
    security_deposit: '',
    payment_frequency: 'monthly',
    auto_renewal: false,
    notice_period_days: '30',
    late_fee_percentage: '0',
    utilities_included: false,
    status: 'draft',
  });

  const [initialForm, setInitialForm] = useState<ContractForm | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<() => void | null>(null);
  
  // Dropdown states
  const [propertyMenuVisible, setPropertyMenuVisible] = useState(false);
  const [tenantMenuVisible, setTenantMenuVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  // Data fetching
  const { 
    data: contract, 
    loading: contractLoading, 
    error: contractError 
  } = useApi(() => contractsApi.getById(id!), [id]);

  const { data: properties, loading: propertiesLoading } = useApi(
    () => propertiesApi.getAll(), 
    []
  );

  const { data: tenants, loading: tenantsLoading } = useApi(
    () => profilesApi.getTenants(), 
    []
  );

  // Populate form with contract data
  useEffect(() => {
    if (contract && properties && tenants) {
      const formData: ContractForm = {
        contract_type: contract.contract_type || 'rental',
        property_id: contract.property_id || '',
        tenant_id: contract.tenant_id || '',
        start_date: contract.start_date ? contract.start_date.split('T')[0] : '',
        end_date: contract.end_date ? contract.end_date.split('T')[0] : '',
        rent_amount: contract.rent_amount ? contract.rent_amount.toString() : '',
        security_deposit: contract.security_deposit ? contract.security_deposit.toString() : '',
        payment_frequency: contract.payment_frequency || 'monthly',
        auto_renewal: contract.auto_renewal || false,
        notice_period_days: contract.notice_period_days ? contract.notice_period_days.toString() : '30',
        late_fee_percentage: contract.late_fee_percentage ? contract.late_fee_percentage.toString() : '0',
        utilities_included: contract.utilities_included || false,
        status: contract.status || 'draft',
      };

      setForm(formData);
      setInitialForm(formData);

      // Set selected property and tenant
      const property = properties.find(p => p.id === contract.property_id);
      const tenant = tenants.find(t => t.id === contract.tenant_id);
      setSelectedProperty(property);
      setSelectedTenant(tenant);
    }
  }, [contract, properties, tenants]);

  // Track form changes
  useEffect(() => {
    if (initialForm) {
      const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);
      setIsDirty(hasChanges);
    }
  }, [form, initialForm]);

  // Handle back button with unsaved changes
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isDirty) {
          setShowUnsavedDialog(true);
          setPendingNavigation(() => () => router.back());
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isDirty, router])
  );

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.property_id) newErrors.property_id = 'Property is required';
    if (!form.tenant_id) newErrors.tenant_id = 'Tenant is required';
    if (!form.start_date) newErrors.start_date = 'Start date is required';
    if (!form.end_date) newErrors.end_date = 'End date is required';
    if (!form.rent_amount || isNaN(Number(form.rent_amount))) {
      newErrors.rent_amount = 'Valid rent amount is required';
    }
    if (!form.security_deposit || isNaN(Number(form.security_deposit))) {
      newErrors.security_deposit = 'Valid security deposit is required';
    }

    // Date validation
    if (form.start_date && form.end_date) {
      const startDate = new Date(form.start_date);
      const endDate = new Date(form.end_date);
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors in the form.');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        ...form,
        rent_amount: Number(form.rent_amount),
        security_deposit: Number(form.security_deposit),
        notice_period_days: Number(form.notice_period_days),
        late_fee_percentage: Number(form.late_fee_percentage),
        is_foreign_tenant: selectedTenant?.is_foreign || false,
      };

      const response = await contractsApi.update(id!, updateData);
      
      if (response.error) {
        Alert.alert('Error', response.error.message || 'Failed to update contract');
        return;
      }

      setInitialForm(form); // Reset dirty state
      Alert.alert(
        'Success', 
        'Contract updated successfully!',
        [
          {
            text: 'View Contract',
            onPress: () => router.replace(`/contracts/${id}`)
          },
          {
            text: 'Continue Editing',
            style: 'cancel'
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update contract');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = Number(amount);
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  if (contractLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Edit Contract" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Loading contract details...
          </Text>
        </View>
      </View>
    );
  }

  if (contractError || !contract) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Edit Contract" showBack />
        <View style={styles.errorContainer}>
          <X size={48} color={theme.colors.error} />
          <Text variant="headlineSmall" style={{ color: theme.colors.error, textAlign: 'center', marginTop: 16 }}>
            Contract Not Found
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
            The contract you're trying to edit doesn't exist or couldn't be loaded.
          </Text>
          <Button 
            mode="contained" 
            onPress={() => router.back()} 
            style={{ marginTop: 24 }}
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title={`Edit Contract`}
        subtitle={isDirty ? 'Unsaved changes' : undefined}
        showBack
        onBack={() => {
          if (isDirty) {
            setShowUnsavedDialog(true);
            setPendingNavigation(() => () => router.back());
          } else {
            router.back();
          }
        }}
        action={{
          icon: Save,
          onPress: handleSubmit,
          label: 'Save Changes',
          loading: loading
        }}
      />

      <ScrollView style={styles.content}>
        {/* Contract Type and Status */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={theme.colors.primary} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                Contract Type & Status
              </Text>
            </View>
            
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
              Contract Type
            </Text>
            <SegmentedButtons
              value={form.contract_type}
              onValueChange={(value) => setForm(prev => ({ ...prev, contract_type: value as any }))}
              buttons={[
                { value: 'rental', label: 'Rental' },
                { value: 'sale', label: 'Sale' },
                { value: 'management', label: 'Management' },
              ]}
              style={{ marginBottom: 16 }}
            />

            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
              Status
            </Text>
            <SegmentedButtons
              value={form.status}
              onValueChange={(value) => setForm(prev => ({ ...prev, status: value as any }))}
              buttons={[
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
                { value: 'terminated', label: 'Terminated' },
              ]}
            />
          </Card.Content>
        </Card>

        {/* Property Selection */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={theme.colors.secondary} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                Property Selection
              </Text>
            </View>

            <Menu
              visible={propertyMenuVisible}
              onDismiss={() => setPropertyMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setPropertyMenuVisible(true)}
                  icon={ChevronDown}
                  contentStyle={{ flexDirection: 'row-reverse' }}
                  style={[
                    styles.dropdownButton,
                    errors.property_id && { borderColor: theme.colors.error }
                  ]}
                  loading={propertiesLoading}
                >
                  {selectedProperty ? selectedProperty.title : 'Select Property'}
                </Button>
              }
            >
              {properties?.map((property) => (
                <Menu.Item
                  key={property.id}
                  onPress={() => {
                    setSelectedProperty(property);
                    setForm(prev => ({ ...prev, property_id: property.id }));
                    setPropertyMenuVisible(false);
                  }}
                  title={property.title}
                  titleStyle={{ fontSize: 14 }}
                />
              ))}
            </Menu>

            {selectedProperty && (
              <View style={styles.selectedItem}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {selectedProperty.title}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {selectedProperty.address}, {selectedProperty.city}
                </Text>
                <Chip mode="outlined" compact style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  {selectedProperty.property_type}
                </Chip>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Tenant Selection */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <User size={20} color={theme.colors.tertiary} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                Tenant Selection
              </Text>
            </View>

            <Menu
              visible={tenantMenuVisible}
              onDismiss={() => setTenantMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setTenantMenuVisible(true)}
                  icon={ChevronDown}
                  contentStyle={{ flexDirection: 'row-reverse' }}
                  style={[
                    styles.dropdownButton,
                    errors.tenant_id && { borderColor: theme.colors.error }
                  ]}
                  loading={tenantsLoading}
                >
                  {selectedTenant ? `${selectedTenant.first_name} ${selectedTenant.last_name}` : 'Select Tenant'}
                </Button>
              }
            >
              {tenants?.map((tenant) => (
                <Menu.Item
                  key={tenant.id}
                  onPress={() => {
                    setSelectedTenant(tenant);
                    setForm(prev => ({ ...prev, tenant_id: tenant.id }));
                    setTenantMenuVisible(false);
                  }}
                  title={`${tenant.first_name} ${tenant.last_name}`}
                  titleStyle={{ fontSize: 14 }}
                />
              ))}
            </Menu>

            {selectedTenant && (
              <View style={styles.selectedItem}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {selectedTenant.first_name} {selectedTenant.last_name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {selectedTenant.email}
                </Text>
                {selectedTenant.is_foreign && (
                  <Chip mode="outlined" compact style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                    Foreign Tenant
                  </Chip>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Financial Terms */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <DollarSign size={20} color={theme.colors.primary} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                Financial Terms
              </Text>
            </View>

            <TextInput
              label="Rent Amount (SAR)"
              value={form.rent_amount}
              onChangeText={(text) => setForm(prev => ({ ...prev, rent_amount: text }))}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              error={!!errors.rent_amount}
              right={
                form.rent_amount ? (
                  <TextInput.Affix text={formatCurrency(form.rent_amount)} />
                ) : null
              }
            />

            <TextInput
              label="Security Deposit (SAR)"
              value={form.security_deposit}
              onChangeText={(text) => setForm(prev => ({ ...prev, security_deposit: text }))}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              error={!!errors.security_deposit}
              right={
                form.security_deposit ? (
                  <TextInput.Affix text={formatCurrency(form.security_deposit)} />
                ) : null
              }
            />

            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 16, marginBottom: 8 }}>
              Payment Frequency
            </Text>
            <SegmentedButtons
              value={form.payment_frequency}
              onValueChange={(value) => setForm(prev => ({ ...prev, payment_frequency: value as any }))}
              buttons={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'annually', label: 'Annually' },
              ]}
            />

            <View style={styles.row}>
              <TextInput
                label="Late Fee (%)"
                value={form.late_fee_percentage}
                onChangeText={(text) => setForm(prev => ({ ...prev, late_fee_percentage: text }))}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, { flex: 1, marginRight: 8 }]}
              />
              <TextInput
                label="Notice Period (days)"
                value={form.notice_period_days}
                onChangeText={(text) => setForm(prev => ({ ...prev, notice_period_days: text }))}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, { flex: 1, marginLeft: 8 }]}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Contract Duration */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={theme.colors.outline} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                Contract Duration
              </Text>
            </View>

            <TextInput
              label="Start Date"
              value={form.start_date}
              onChangeText={(text) => setForm(prev => ({ ...prev, start_date: text }))}
              mode="outlined"
              style={styles.input}
              error={!!errors.start_date}
              placeholder="YYYY-MM-DD"
            />

            <TextInput
              label="End Date"
              value={form.end_date}
              onChangeText={(text) => setForm(prev => ({ ...prev, end_date: text }))}
              mode="outlined"
              style={styles.input}
              error={!!errors.end_date}
              placeholder="YYYY-MM-DD"
            />

            <View style={styles.checkboxRow}>
              <Chip
                mode={form.auto_renewal ? 'flat' : 'outlined'}
                selected={form.auto_renewal}
                onPress={() => setForm(prev => ({ ...prev, auto_renewal: !prev.auto_renewal }))}
                icon={form.auto_renewal ? 'check' : undefined}
              >
                Auto Renewal
              </Chip>
              <Chip
                mode={form.utilities_included ? 'flat' : 'outlined'}
                selected={form.utilities_included}
                onPress={() => setForm(prev => ({ ...prev, utilities_included: !prev.utilities_included }))}
                icon={form.utilities_included ? 'check' : undefined}
                style={{ marginLeft: 8 }}
              >
                Utilities Included
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button 
            mode="contained" 
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !isDirty}
            style={styles.submitButton}
          >
            Save Changes
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => {
              if (isDirty) {
                setShowUnsavedDialog(true);
                setPendingNavigation(() => () => router.back());
              } else {
                router.back();
              }
            }}
            disabled={loading}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>

      {/* Unsaved Changes Dialog */}
      <Portal>
        <Dialog visible={showUnsavedDialog} onDismiss={() => setShowUnsavedDialog(false)}>
          <Dialog.Title>Unsaved Changes</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowUnsavedDialog(false)}>
              Keep Editing
            </Button>
            <Button onPress={handleDiscardChanges}>
              Discard Changes
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.sm,
  },
  dropdownButton: {
    justifyContent: 'flex-start',
    marginBottom: spacing.sm,
  },
  selectedItem: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  actionsContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  submitButton: {
    marginBottom: spacing.sm,
  },
  cancelButton: {
    marginBottom: spacing.lg,
  },
}); 