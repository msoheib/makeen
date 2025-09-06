import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  TextInput,
  SegmentedButtons,
  Chip,
  ActivityIndicator,
  Divider,
  Menu,
  IconButton
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import { contractsApi, propertiesApi, profilesApi } from '@/lib/api';
import { spacing } from '@/lib/theme';
import ModernHeader from '@/components/ModernHeader';
import { 
  FileText, 
  MapPin, 
  User, 
  Calendar,
  DollarSign,
  Home,
  ChevronDown,
  Plus,
  Check
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
  contract_number?: string;
}

export default function AddContractScreen() {
  const router = useRouter();
  const { theme } = useTheme();

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
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Dropdown states
  const [propertyMenuVisible, setPropertyMenuVisible] = useState(false);
  const [tenantMenuVisible, setTenantMenuVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  // Data fetching
  const { data: properties, loading: propertiesLoading } = useApi(
    () => propertiesApi.getAll({ status: 'available' }), 
    []
  );

  const { data: tenants, loading: tenantsLoading } = useApi(
    () => profilesApi.getTenants(), 
    []
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
      const contractData = {
        ...form,
        rent_amount: Number(form.rent_amount),
        security_deposit: Number(form.security_deposit),
        notice_period_days: Number(form.notice_period_days),
        late_fee_percentage: Number(form.late_fee_percentage),
        is_foreign_tenant: selectedTenant?.is_foreign || false,
        status: 'draft' as const,
      };

      const response = await contractsApi.create(contractData);
      
      if (response.error) {
        Alert.alert('Error', response.error.message || 'Failed to create contract');
        return;
      }

      Alert.alert(
        'Success', 
        'Contract created successfully!',
        [
          {
            text: 'View Contract',
            onPress: () => router.replace(`/contracts/${response.data?.id}`)
          },
          {
            text: 'Back to Contracts',
            onPress: () => router.replace('/(tabs)/tenants')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  // Generate default end date (1 year from start)
  const updateEndDate = (startDate: string) => {
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setFullYear(start.getFullYear() + 1);
      setForm(prev => ({ ...prev, end_date: end.toISOString().split('T')[0] }));
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="إضافة عقد" 
        showBackButton={true}
      />

      <ScrollView style={styles.content}>
        {/* Contract Type Selection */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={theme.colors.primary} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                نوع العقد
              </Text>
            </View>
            
            <SegmentedButtons
              value={form.contract_type}
              onValueChange={(value) => setForm(prev => ({ ...prev, contract_type: value as any }))}
              buttons={[
                { value: 'rental', label: 'إيجار' },
                { value: 'sale', label: 'بيع' },
                { value: 'management', label: 'إدارة' },
              ]}
              style={{ marginTop: 8 }}
            />
          </Card.Content>
        </Card>

        {/* Property Selection */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={theme.colors.secondary} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                اختيار العقار
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
                  {selectedProperty ? selectedProperty.title : 'اختر العقار'}
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

            {errors.property_id && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                {errors.property_id}
              </Text>
            )}

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
                اختيار المستأجر
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
                  {selectedTenant ? `${selectedTenant.first_name} ${selectedTenant.last_name}` : 'اختر المستأجر'}
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

            {errors.tenant_id && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                {errors.tenant_id}
              </Text>
            )}

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
                الشروط المالية
              </Text>
            </View>

            <TextInput
              label="مبلغ الإيجار (ر.س)"
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
            {errors.rent_amount && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                {errors.rent_amount}
              </Text>
            )}

            <TextInput
              label="الوديعة (ر.س)"
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
            {errors.security_deposit && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                {errors.security_deposit}
              </Text>
            )}

            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 16, marginBottom: 8 }}>
              تكرار الدفع
            </Text>
            <SegmentedButtons
              value={form.payment_frequency}
              onValueChange={(value) => setForm(prev => ({ ...prev, payment_frequency: value as any }))}
              buttons={[
                { value: 'monthly', label: 'شهري' },
                { value: 'quarterly', label: 'ربعي' },
                { value: 'annually', label: 'سنوي' },
              ]}
            />

            <View style={styles.row}>
              <TextInput
                label="رسوم التأخير (%)"
                value={form.late_fee_percentage}
                onChangeText={(text) => setForm(prev => ({ ...prev, late_fee_percentage: text }))}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, { flex: 1, marginRight: 8 }]}
              />
              <TextInput
                label="فترة الإشعار (أيام)"
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
                مدة العقد
              </Text>
            </View>

            <TextInput
              label="تاريخ البداية"
              value={form.start_date}
              onChangeText={(text) => {
                setForm(prev => ({ ...prev, start_date: text }));
                updateEndDate(text);
              }}
              mode="outlined"
              style={styles.input}
              error={!!errors.start_date}
              placeholder="YYYY-MM-DD"
            />
            {errors.start_date && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                {errors.start_date}
              </Text>
            )}

            <TextInput
              label="تاريخ الانتهاء"
              value={form.end_date}
              onChangeText={(text) => setForm(prev => ({ ...prev, end_date: text }))}
              mode="outlined"
              style={styles.input}
              error={!!errors.end_date}
              placeholder="YYYY-MM-DD"
            />
            {errors.end_date && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                {errors.end_date}
              </Text>
            )}

            <View style={styles.checkboxRow}>
              <Chip
                mode={form.auto_renewal ? 'flat' : 'outlined'}
                selected={form.auto_renewal}
                onPress={() => setForm(prev => ({ ...prev, auto_renewal: !prev.auto_renewal }))}
                icon={form.auto_renewal ? 'check' : undefined}
              >
                تجديد تلقائي
              </Chip>
              <Chip
                mode={form.utilities_included ? 'flat' : 'outlined'}
                selected={form.utilities_included}
                onPress={() => setForm(prev => ({ ...prev, utilities_included: !prev.utilities_included }))}
                icon={form.utilities_included ? 'check' : undefined}
                style={{ marginLeft: 8 }}
              >
                المرافق مشمولة
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
            disabled={loading}
            style={styles.submitButton}
          >
            إنشاء العقد
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => router.back()}
            disabled={loading}
            style={styles.cancelButton}
          >
            إلغاء
          </Button>
        </View>
      </ScrollView>
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