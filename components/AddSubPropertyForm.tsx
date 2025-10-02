import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, HelperText, Chip } from 'react-native-paper';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { subPropertiesApi } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Plus, X, Upload, Phone } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

interface AddSubPropertyFormProps {
  parentPropertyId: string;
  parentPropertyTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddSubPropertyForm({ 
  parentPropertyId, 
  parentPropertyTitle, 
  onSuccess, 
  onCancel 
}: AddSubPropertyFormProps) {
  const { theme } = useAppTheme();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    property_type: 'apartment',
    area_sqm: '',
    bedrooms: '',
    bathrooms: '',
    floor_number: '',
    unit_number: '',
    unit_label: '',
    base_price: '',
    rent_amount: '',
    payment_frequency: 'monthly' as 'monthly' | 'quarterly' | 'semi_annual' | 'annual',
    contract_duration_years: '1',
    contract_number: '',
    contract_pdf_url: '',
    description: '',
    amenities: [] as string[],
    is_furnished: false,
    parking_spaces: '',
    service_charge: '',
    meter_numbers: [] as string[],
    tenant_contact_numbers: [] as string[]
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.area_sqm || parseFloat(formData.area_sqm) <= 0) newErrors.area_sqm = 'Valid area is required';
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) newErrors.base_price = 'Valid base price is required';
    if (!formData.rent_amount || parseFloat(formData.rent_amount) <= 0) newErrors.rent_amount = 'Valid rent amount is required';
    if (!formData.contract_number.trim()) newErrors.contract_number = 'Contract number is required';
    if (!formData.contract_pdf_url.trim()) newErrors.contract_pdf_url = 'Contract PDF is required';
    if (formData.tenant_contact_numbers.length === 0) newErrors.tenant_contact_numbers = 'At least one tenant contact is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await subPropertiesApi.create({
        title: formData.title,
        parent_property_id: parentPropertyId,
        property_type: formData.property_type,
        area_sqm: parseFloat(formData.area_sqm),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        floor_number: formData.floor_number ? parseInt(formData.floor_number) : undefined,
        unit_number: formData.unit_number || undefined,
        unit_label: formData.unit_label || undefined,
        base_price: parseFloat(formData.base_price),
        rent_amount: parseFloat(formData.rent_amount),
        payment_frequency: formData.payment_frequency,
        contract_duration_years: parseInt(formData.contract_duration_years),
        contract_number: formData.contract_number,
        contract_pdf_url: formData.contract_pdf_url,
        tenant_contact_numbers: formData.tenant_contact_numbers,
        meter_numbers: formData.meter_numbers.length > 0 ? formData.meter_numbers : undefined,
        description: formData.description || undefined,
        amenities: formData.amenities.length > 0 ? formData.amenities : undefined,
        is_furnished: formData.is_furnished,
        parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : undefined,
        service_charge: formData.service_charge ? parseFloat(formData.service_charge) : undefined
      });

      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        Alert.alert('Success', 'Sub-property created successfully!', [
          { text: 'OK', onPress: () => onSuccess?.() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create sub-property');
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF upload
  const handlePDFUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      if (result.assets && result.assets[0]) {
        setFormData(prev => ({
          ...prev,
          contract_pdf_url: result.assets[0].uri
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick PDF file');
    }
  };

  // Add meter number
  const addMeterNumber = () => {
    setFormData(prev => ({
      ...prev,
      meter_numbers: [...prev.meter_numbers, '']
    }));
  };

  // Update meter number
  const updateMeterNumber = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      meter_numbers: prev.meter_numbers.map((meter, i) => i === index ? value : meter)
    }));
  };

  // Remove meter number
  const removeMeterNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      meter_numbers: prev.meter_numbers.filter((_, i) => i !== index)
    }));
  };

  // Add tenant contact
  const addTenantContact = () => {
    setFormData(prev => ({
      ...prev,
      tenant_contact_numbers: [...prev.tenant_contact_numbers, '']
    }));
  };

  // Update tenant contact
  const updateTenantContact = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      tenant_contact_numbers: prev.tenant_contact_numbers.map((contact, i) => i === index ? value : contact)
    }));
  };

  // Remove tenant contact
  const removeTenantContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tenant_contact_numbers: prev.tenant_contact_numbers.filter((_, i) => i !== index)
    }));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Add Sub-Property
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Adding to: {parentPropertyTitle}
        </Text>
      </View>

      <View style={styles.form}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Basic Information
          </Text>
          
          <TextInput
            label="Title *"
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            error={!!errors.title}
          />
          <HelperText type="error" visible={!!errors.title}>
            {errors.title}
          </HelperText>

          <SegmentedButtons
            value={formData.property_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, property_type: value }))}
            buttons={[
              { value: 'apartment', label: 'Apartment' },
              { value: 'office', label: 'Office' },
              { value: 'retail', label: 'Retail' },
              { value: 'warehouse', label: 'Warehouse' }
            ]}
            style={styles.segmentedButton}
          />

          <View style={styles.row}>
            <TextInput
              label="Area (sqm) *"
              value={formData.area_sqm}
              onChangeText={(text) => setFormData(prev => ({ ...prev, area_sqm: text }))}
              keyboardType="numeric"
              style={[styles.halfInput, { backgroundColor: theme.colors.surface }]}
              error={!!errors.area_sqm}
            />
            <TextInput
              label="Floor Number"
              value={formData.floor_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, floor_number: text }))}
              keyboardType="numeric"
              style={[styles.halfInput, { backgroundColor: theme.colors.surface }]}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              label="Bedrooms"
              value={formData.bedrooms}
              onChangeText={(text) => setFormData(prev => ({ ...prev, bedrooms: text }))}
              keyboardType="numeric"
              style={[styles.halfInput, { backgroundColor: theme.colors.surface }]}
            />
            <TextInput
              label="Bathrooms"
              value={formData.bathrooms}
              onChangeText={(text) => setFormData(prev => ({ ...prev, bathrooms: text }))}
              keyboardType="numeric"
              style={[styles.halfInput, { backgroundColor: theme.colors.surface }]}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              label="Unit Number"
              value={formData.unit_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, unit_number: text }))}
              style={[styles.halfInput, { backgroundColor: theme.colors.surface }]}
            />
            <TextInput
              label="Unit Label"
              value={formData.unit_label}
              onChangeText={(text) => setFormData(prev => ({ ...prev, unit_label: text }))}
              style={[styles.halfInput, { backgroundColor: theme.colors.surface }]}
            />
          </View>
        </View>

        {/* Financial Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Financial Information
          </Text>
          
          <View style={styles.row}>
            <TextInput
              label="Base Price (Total Contract) *"
              value={formData.base_price}
              onChangeText={(text) => setFormData(prev => ({ ...prev, base_price: text }))}
              keyboardType="numeric"
              style={[styles.halfInput, { backgroundColor: theme.colors.surface }]}
              error={!!errors.base_price}
            />
            <TextInput
              label="Rent Amount *"
              value={formData.rent_amount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, rent_amount: text }))}
              keyboardType="numeric"
              style={[styles.halfInput, { backgroundColor: theme.colors.surface }]}
              error={!!errors.rent_amount}
            />
          </View>

          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Payment Frequency *
          </Text>
          <SegmentedButtons
            value={formData.payment_frequency}
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              payment_frequency: value as 'monthly' | 'quarterly' | 'semi_annual' | 'annual' 
            }))}
            buttons={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'semi_annual', label: 'Semi-Annual' },
              { value: 'annual', label: 'Annual' }
            ]}
            style={styles.segmentedButton}
          />

          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Contract Duration *
          </Text>
          <SegmentedButtons
            value={formData.contract_duration_years}
            onValueChange={(value) => setFormData(prev => ({ ...prev, contract_duration_years: value }))}
            buttons={[
              { value: '1', label: '1 Year' },
              { value: '2', label: '2 Years' },
              { value: '3', label: '3 Years' },
              { value: '4', label: '4 Years' },
              { value: '5', label: '5 Years' }
            ]}
            style={styles.segmentedButton}
          />

          <TextInput
            label="Service Charge"
            value={formData.service_charge}
            onChangeText={(text) => setFormData(prev => ({ ...prev, service_charge: text }))}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
          />

          <TextInput
            label="Parking Spaces"
            value={formData.parking_spaces}
            onChangeText={(text) => setFormData(prev => ({ ...prev, parking_spaces: text }))}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
          />
        </View>

        {/* Contract Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Contract Information
          </Text>
          
          <TextInput
            label="Contract Number *"
            value={formData.contract_number}
            onChangeText={(text) => setFormData(prev => ({ ...prev, contract_number: text }))}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            error={!!errors.contract_number}
          />
          <HelperText type="error" visible={!!errors.contract_number}>
            {errors.contract_number}
          </HelperText>

          <Button
            mode="outlined"
            onPress={handlePDFUpload}
            icon={Upload}
            style={[styles.uploadButton, { borderColor: theme.colors.outline }]}
            textColor={theme.colors.onSurface}
          >
            {formData.contract_pdf_url ? 'Change Contract PDF' : 'Upload Contract PDF *'}
          </Button>
          
          {formData.contract_pdf_url && (
            <Text style={[styles.uploadedFile, { color: theme.colors.primary }]}>
              ✓ PDF uploaded successfully
            </Text>
          )}
          
          <HelperText type="error" visible={!!errors.contract_pdf_url}>
            {errors.contract_pdf_url}
          </HelperText>
        </View>

        {/* Meter Numbers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Meter Numbers (Optional)
          </Text>
          
          {formData.meter_numbers.map((meter, index) => (
            <View key={index} style={styles.chipRow}>
              <TextInput
                label={`Meter ${index + 1}`}
                value={meter}
                onChangeText={(text) => updateMeterNumber(index, text)}
                style={[styles.chipInput, { backgroundColor: theme.colors.surface }]}
              />
              <Button
                mode="text"
                onPress={() => removeMeterNumber(index)}
                icon={X}
                textColor={theme.colors.error}
              >
                Remove
              </Button>
            </View>
          ))}
          
          <Button
            mode="outlined"
            onPress={addMeterNumber}
            icon={Plus}
            style={[styles.addButton, { borderColor: theme.colors.outline }]}
            textColor={theme.colors.onSurface}
          >
            Add Meter Number
          </Button>
        </View>

        {/* Tenant Contact Numbers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Tenant Contact Numbers *
          </Text>
          
          {formData.tenant_contact_numbers.map((contact, index) => (
            <View key={index} style={styles.chipRow}>
              <TextInput
                label={index === 0 ? 'Primary Contact' : `Additional Contact ${index + 1}`}
                value={contact}
                onChangeText={(text) => updateTenantContact(index, text)}
                keyboardType="phone-pad"
                style={[styles.chipInput, { backgroundColor: theme.colors.surface }]}
                error={!!errors.tenant_contact_numbers}
              />
              {index > 0 && (
                <Button
                  mode="text"
                  onPress={() => removeTenantContact(index)}
                  icon={X}
                  textColor={theme.colors.error}
                >
                  Remove
                </Button>
              )}
            </View>
          ))}
          
          <HelperText type="error" visible={!!errors.tenant_contact_numbers}>
            {errors.tenant_contact_numbers}
          </HelperText>
          
          <Button
            mode="outlined"
            onPress={addTenantContact}
            icon={Plus}
            style={[styles.addButton, { borderColor: theme.colors.outline }]}
            textColor={theme.colors.onSurface}
          >
            Add Contact Number
          </Button>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Additional Information
          </Text>
          
          <TextInput
            label="Description"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
          />

          <Button
            mode={formData.is_furnished ? "contained" : "outlined"}
            onPress={() => setFormData(prev => ({ ...prev, is_furnished: !prev.is_furnished }))}
            style={styles.furnishedButton}
          >
            {formData.is_furnished ? '✓ Furnished' : 'Unfurnished'}
          </Button>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={[styles.actionButton, { borderColor: theme.colors.outline }]}
            textColor={theme.colors.onSurface}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            textColor="white"
          >
            Create Sub-Property
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.m,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.s,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    padding: spacing.m,
  },
  section: {
    marginBottom: spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.m,
  },
  input: {
    marginBottom: spacing.s,
  },
  halfInput: {
    flex: 1,
    marginRight: spacing.s,
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing.s,
  },
  segmentedButton: {
    marginBottom: spacing.m,
  },
  label: {
    fontSize: 16,
    marginBottom: spacing.s,
  },
  uploadButton: {
    marginBottom: spacing.s,
  },
  uploadedFile: {
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  chipInput: {
    flex: 1,
    marginRight: spacing.s,
  },
  addButton: {
    marginTop: spacing.s,
  },
  furnishedButton: {
    marginTop: spacing.s,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.l,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.s,
  },
});







