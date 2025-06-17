import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Card, Divider } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useApi } from '@/hooks/useApi';
import { profilesApi, propertiesApi, contractsApi } from '@/lib/api';
import { ArrowLeft, UserPlus, Home, FileText } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';

interface TenantOption {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface PropertyOption {
  id: string;
  title: string;
  address: string;
  price: number;
  property_type: string;
}

export default function AssignTenantScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  
  // Contract form data
  const [contractData, setContractData] = useState({
    start_date: '',
    end_date: '',
    rent_amount: '',
    security_deposit: '',
    payment_frequency: 'monthly',
    contract_number: '',
    auto_renewal: false,
    notice_period_days: '30',
    utilities_included: false,
  });

  // Fetch available tenants and properties
  const { 
    data: tenants, 
    loading: tenantsLoading, 
    error: tenantsError 
  } = useApi(() => profilesApi.getTenants(), []);

  const { 
    data: properties, 
    loading: propertiesLoading, 
    error: propertiesError 
  } = useApi(() => propertiesApi.getAll(), []);

  // Filter available properties (not rented)
  const availableProperties = properties?.filter(p => p.status === 'available') || [];

  // Filter available tenants (those without active contracts)
  const [availableTenants, setAvailableTenants] = useState<TenantOption[]>([]);

  useEffect(() => {
    const getAvailableTenants = async () => {
      if (!tenants) return;
      
      try {
        // Get all active contracts to find tenants who are already renting
        const { data: activeContracts } = await supabase
          .from('contracts')
          .select('tenant_id')
          .eq('status', 'active');

        const rentedTenantIds = activeContracts?.map(c => c.tenant_id) || [];
        
        // Filter out tenants who already have active contracts
        const available = tenants
          .filter(tenant => !rentedTenantIds.includes(tenant.id))
          .map(tenant => ({
            id: tenant.id,
            name: `${tenant.first_name} ${tenant.last_name}`.trim(),
            email: tenant.email || '',
            phone: tenant.phone || undefined,
          }));
        
        setAvailableTenants(available);
      } catch (error) {
        console.error('Error fetching available tenants:', error);
      }
    };

    getAvailableTenants();
  }, [tenants]);

  const validateForm = () => {
    const errors: string[] = [];

    if (!selectedTenant) errors.push('يرجى اختيار مستأجر');
    if (!selectedProperty) errors.push('يرجى اختيار عقار');
    if (!contractData.start_date) errors.push('يرجى إدخال تاريخ بداية العقد');
    if (!contractData.end_date) errors.push('يرجى إدخال تاريخ نهاية العقد');
    if (!contractData.rent_amount || Number(contractData.rent_amount) <= 0) errors.push('يرجى إدخال مبلغ الإيجار');
    if (!contractData.security_deposit || Number(contractData.security_deposit) < 0) errors.push('يرجى إدخال مبلغ التأمين');

    if (errors.length > 0) {
      Alert.alert('خطأ في البيانات', errors.join('\n'));
      return false;
    }

    // Validate dates
    const startDate = new Date(contractData.start_date);
    const endDate = new Date(contractData.end_date);
    
    if (startDate >= endDate) {
      Alert.alert('خطأ في التواريخ', 'تاريخ نهاية العقد يجب أن يكون بعد تاريخ البداية');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get selected property details for rent amount validation
      const selectedPropertyData = availableProperties.find(p => p.id === selectedProperty);
      
      const contractPayload = {
        property_id: selectedProperty,
        tenant_id: selectedTenant,
        start_date: new Date(contractData.start_date).toISOString(),
        end_date: new Date(contractData.end_date).toISOString(),
        rent_amount: Number(contractData.rent_amount),
        security_deposit: Number(contractData.security_deposit),
        payment_frequency: contractData.payment_frequency,
        contract_number: contractData.contract_number || `CTR-${Date.now()}`,
        contract_type: 'rental',
        status: 'active',
        auto_renewal: contractData.auto_renewal,
        notice_period_days: Number(contractData.notice_period_days),
        utilities_included: contractData.utilities_included,
      };

      console.log('Creating contract:', contractPayload);

      // Create the contract
      const { data, error } = await supabase
        .from('contracts')
        .insert([contractPayload])
        .select()
        .single();

      if (error) {
        console.error('Contract creation error:', error);
        Alert.alert('خطأ', `فشل في إنشاء العقد: ${error.message}`);
        return;
      }

      // Update property status to 'rented'
      await supabase
        .from('properties')
        .update({ status: 'rented' })
        .eq('id', selectedProperty);

      console.log('Contract created successfully:', data);
      
      Alert.alert(
        'تم بنجاح',
        'تم إنشاء عقد الإيجار بنجاح وتخصيص المستأجر للعقار',
        [
          {
            text: 'موافق',
            onPress: () => router.replace('/(drawer)/(tabs)/tenants')
          }
        ]
      );
      
      // Automatically navigate back after a short delay
      setTimeout(() => {
        router.replace('/(drawer)/(tabs)/tenants');
      }, 1500);

    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('خطأ', 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPropertyData = availableProperties.find(p => p.id === selectedProperty);
  const selectedTenantData = availableTenants.find(t => t.id === selectedTenant);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader
        title="تخصيص مستأجر لعقار"
        showBackButton
        onBackPress={() => router.push('/(drawer)/(tabs)/tenants')}
      />

      <View style={styles.content}>
        {/* Tenant Selection */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <UserPlus size={24} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              اختيار المستأجر
            </Text>
          </View>
          
          {tenantsLoading ? (
            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              جاري تحميل المستأجرين...
            </Text>
          ) : availableTenants.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.error }]}>
              لا توجد مستأجرين متاحين (جميع المستأجرين لديهم عقود نشطة)
            </Text>
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedTenant}
                onValueChange={setSelectedTenant}
                style={[styles.picker, { color: theme.colors.onBackground }]}
              >
                <Picker.Item label="اختر مستأجر..." value="" />
                {availableTenants.map((tenant) => (
                  <Picker.Item 
                    key={tenant.id} 
                    label={`${tenant.name} (${tenant.email})`} 
                    value={tenant.id} 
                  />
                ))}
              </Picker>
            </View>
          )}

          {selectedTenantData && (
            <View style={styles.selectedInfo}>
              <Text style={[styles.selectedLabel, { color: theme.colors.primary }]}>
                المستأجر المختار:
              </Text>
              <Text style={[styles.selectedValue, { color: theme.colors.onBackground }]}>
                {selectedTenantData.name}
              </Text>
              <Text style={[styles.selectedDetail, { color: theme.colors.onSurfaceVariant }]}>
                {selectedTenantData.email}
              </Text>
              {selectedTenantData.phone && (
                <Text style={[styles.selectedDetail, { color: theme.colors.onSurfaceVariant }]}>
                  {selectedTenantData.phone}
                </Text>
              )}
            </View>
          )}
        </ModernCard>

        {/* Property Selection */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Home size={24} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              اختيار العقار
            </Text>
          </View>
          
          {propertiesLoading ? (
            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              جاري تحميل العقارات...
            </Text>
          ) : availableProperties.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.error }]}>
              لا توجد عقارات متاحة للإيجار
            </Text>
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedProperty}
                onValueChange={setSelectedProperty}
                style={[styles.picker, { color: theme.colors.onBackground }]}
              >
                <Picker.Item label="اختر عقار..." value="" />
                {availableProperties.map((property) => (
                  <Picker.Item 
                    key={property.id} 
                    label={`${property.title} - ${property.price.toLocaleString()} ريال`} 
                    value={property.id} 
                  />
                ))}
              </Picker>
            </View>
          )}

          {selectedPropertyData && (
            <View style={styles.selectedInfo}>
              <Text style={[styles.selectedLabel, { color: theme.colors.primary }]}>
                العقار المختار:
              </Text>
              <Text style={[styles.selectedValue, { color: theme.colors.onBackground }]}>
                {selectedPropertyData.title}
              </Text>
              <Text style={[styles.selectedDetail, { color: theme.colors.onSurfaceVariant }]}>
                {selectedPropertyData.address}
              </Text>
              <Text style={[styles.selectedDetail, { color: theme.colors.onSurfaceVariant }]}>
                السعر: {selectedPropertyData.price.toLocaleString()} ريال
              </Text>
              <Text style={[styles.selectedDetail, { color: theme.colors.onSurfaceVariant }]}>
                النوع: {
                  selectedPropertyData.property_type === 'villa' ? 'فيلا' : 
                  selectedPropertyData.property_type === 'apartment' ? 'شقة' : 
                  selectedPropertyData.property_type === 'office' ? 'مكتب' : 
                  (selectedPropertyData.property_type || 'غير محدد')
                }
              </Text>
            </View>
          )}
        </ModernCard>

        {/* Contract Details */}
        {selectedTenant && selectedProperty && (
          <ModernCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={24} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                تفاصيل العقد
              </Text>
            </View>

            <TextInput
              label="تاريخ بداية العقد *"
              value={contractData.start_date}
              onChangeText={(text) => setContractData(prev => ({ ...prev, start_date: text }))}
              mode="outlined"
              style={styles.input}
              placeholder="YYYY-MM-DD"
              right={<TextInput.Icon icon="calendar" />}
            />

            <TextInput
              label="تاريخ نهاية العقد *"
              value={contractData.end_date}
              onChangeText={(text) => setContractData(prev => ({ ...prev, end_date: text }))}
              mode="outlined"
              style={styles.input}
              placeholder="YYYY-MM-DD"
              right={<TextInput.Icon icon="calendar" />}
            />

            <TextInput
              label="مبلغ الإيجار الشهري (ريال) *"
              value={contractData.rent_amount}
              onChangeText={(text) => setContractData(prev => ({ ...prev, rent_amount: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              placeholder={selectedPropertyData ? selectedPropertyData.price.toString() : '0'}
            />

            <TextInput
              label="مبلغ التأمين (ريال) *"
              value={contractData.security_deposit}
              onChangeText={(text) => setContractData(prev => ({ ...prev, security_deposit: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              placeholder="0"
            />

            <TextInput
              label="رقم العقد"
              value={contractData.contract_number}
              onChangeText={(text) => setContractData(prev => ({ ...prev, contract_number: text }))}
              mode="outlined"
              style={styles.input}
              placeholder="سيتم إنشاؤه تلقائياً إذا ترك فارغاً"
            />

            <Text style={[styles.inputLabel, { color: theme.colors.onBackground }]}>
              تكرار الدفع
            </Text>
            <SegmentedButtons
              value={contractData.payment_frequency}
              onValueChange={(value) => setContractData(prev => ({ ...prev, payment_frequency: value }))}
              buttons={[
                { value: 'monthly', label: 'شهري' },
                { value: 'quarterly', label: 'ربع سنوي' },
                { value: 'annually', label: 'سنوي' },
              ]}
              style={styles.segmentedButtons}
            />

            <TextInput
              label="فترة الإشعار (أيام)"
              value={contractData.notice_period_days}
              onChangeText={(text) => setContractData(prev => ({ ...prev, notice_period_days: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
            />
          </ModernCard>
        )}

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !selectedTenant || !selectedProperty || availableProperties.length === 0 || availableTenants.length === 0}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          إنشاء عقد الإيجار
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.m,
  },
  section: {
    marginBottom: spacing.m,
    padding: spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: spacing.s,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    marginBottom: spacing.m,
  },
  picker: {
    height: 50,
  },
  selectedInfo: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.m,
    borderRadius: 8,
    marginTop: spacing.s,
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  selectedValue: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  selectedDetail: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  input: {
    marginBottom: spacing.m,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.s,
    marginTop: spacing.s,
  },
  segmentedButtons: {
    marginBottom: spacing.m,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    padding: spacing.l,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    padding: spacing.l,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: spacing.l,
    marginBottom: spacing.xl,
  },
  submitButtonContent: {
    paddingVertical: spacing.s,
  },
}); 