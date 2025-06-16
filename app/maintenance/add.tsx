import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, ActivityIndicator, Chip, Modal, Portal, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useApi } from '@/hooks/useApi';
import { maintenanceApi, propertiesApi } from '@/lib/api';
import { Tables, TablesInsert } from '@/lib/database.types';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { Wrench, AlertTriangle, Building, Search, Check } from 'lucide-react-native';
import { useTranslation } from '@/lib/useTranslation';

type MaintenanceRequest = TablesInsert<'maintenance_requests'>;
type Property = Tables<'properties'>;

interface FormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  property_id: string;
  images: string[];
}

export default function AddMaintenanceRequestScreen() {
  const router = useRouter();
  const { t } = useTranslation('maintenance');
  const [loading, setLoading] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    priority: 'medium',
    property_id: '',
    images: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load properties for selection
  const { 
    data: properties, 
    loading: propertiesLoading, 
    error: propertiesError,
    refetch: refetchProperties 
  } = useApi(() => propertiesApi.getAll(), []);

  // Filter properties based on search
  const filteredProperties = properties?.filter(property =>
    property.title.toLowerCase().includes(propertySearch.toLowerCase()) ||
    property.address.toLowerCase().includes(propertySearch.toLowerCase()) ||
    property.property_code?.toLowerCase().includes(propertySearch.toLowerCase())
  ) || [];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('common:required');
    } else if (formData.title.trim().length < 5) {
      newErrors.title = t('common:minLength', { length: 5 });
    }

    if (!formData.description.trim()) {
      newErrors.description = t('common:required');
    } else if (formData.description.trim().length < 10) {
      newErrors.description = t('common:minLength', { length: 10 });
    }

    if (!formData.property_id) {
      newErrors.property_id = t('selectProperty') + ' ' + t('common:required');
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
      const requestData: MaintenanceRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: 'pending',
        property_id: formData.property_id,
        tenant_id: null, // Will be set based on property/contract later
        images: formData.images
      };

      const response = await maintenanceApi.createRequest(requestData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      Alert.alert(
        t('common:success'),
        t('requestCreated'),
        [
          {
            text: t('common:ok'),
            onPress: () => router.replace('/(drawer)/(tabs)/maintenance'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting maintenance request:', error);
      Alert.alert(t('common:error'), error.message || t('common:tryAgain'));
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setFormData({ ...formData, property_id: property.id });
    setShowPropertyModal(false);
    setPropertySearch('');
    // Clear property selection error if it exists
    if (errors.property_id) {
      setErrors({ ...errors, property_id: '' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return theme.colors.primary;
      case 'medium': return theme.colors.warning;
      case 'high': return theme.colors.error;
      case 'urgent': return '#d32f2f';
      default: return theme.colors.primary;
    }
  };

  const getPriorityDescription = (priority: string) => {
    const descriptions: Record<string, string> = {
      low: t('priorityDescriptions.low'),
      medium: t('priorityDescriptions.medium'),
      high: t('priorityDescriptions.high'),
      urgent: t('priorityDescriptions.urgent'),
    };
    return descriptions[priority] || '';
  };

  return (
    <View style={styles.container}>
      <ModernHeader 
        title={t('addRequest')}
        showBackButton={true}
        showMenu={false}
        showNotifications={false}
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Request Details Section */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wrench size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>{t('requestDetails')}</Text>
          </View>

          <TextInput
            label={`${t('common:title')} *`}
            value={formData.title}
            onChangeText={(text) => {
              setFormData({ ...formData, title: text });
              if (errors.title && text.trim().length >= 5) {
                setErrors({ ...errors, title: '' });
              }
            }}
            mode="outlined"
            style={styles.input}
            error={!!errors.title}
            placeholder={t('common:enterTitle')}
            maxLength={100}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          <TextInput
            label={`${t('description')} *`}
            value={formData.description}
            onChangeText={(text) => {
              setFormData({ ...formData, description: text });
              if (errors.description && text.trim().length >= 10) {
                setErrors({ ...errors, description: '' });
              }
            }}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            error={!!errors.description}
            placeholder={t('enterDescription')}
            maxLength={500}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          
          <Text style={styles.characterCount}>
            {formData.description.length}/500 {t('common:characters')}
          </Text>
        </ModernCard>

        {/* Priority Level Section */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color={getPriorityColor(formData.priority)} />
            <Text style={styles.sectionTitle}>{t('priorities.title')}</Text>
          </View>

          <SegmentedButtons
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
            buttons={[
              { 
                value: 'low', 
                label: t('priorities.low'),
                style: formData.priority === 'low' ? { backgroundColor: theme.colors.primaryContainer } : {}
              },
              { 
                value: 'medium', 
                label: t('priorities.medium'),
                style: formData.priority === 'medium' ? { backgroundColor: theme.colors.primaryContainer } : {}
              },
              { 
                value: 'high', 
                label: t('priorities.high'),
                style: formData.priority === 'high' ? { backgroundColor: theme.colors.errorContainer } : {}
              },
              { 
                value: 'urgent', 
                label: t('priorities.urgent'),
                style: formData.priority === 'urgent' ? { backgroundColor: theme.colors.errorContainer } : {}
              },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.priorityInfo}>
            <Text style={[styles.priorityDescription, { color: getPriorityColor(formData.priority) }]}>
              {getPriorityDescription(formData.priority)}
            </Text>
          </View>
        </ModernCard>

        {/* Property Selection Section */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building size={20} color={theme.colors.secondary} />
            <Text style={styles.sectionTitle}>{t('selectProperty')}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.propertySelector,
              { borderColor: errors.property_id ? theme.colors.error : theme.colors.outline }
            ]}
            onPress={() => setShowPropertyModal(true)}
          >
            {selectedProperty ? (
              <View style={styles.selectedPropertyContainer}>
                <View style={styles.selectedPropertyInfo}>
                  <Text style={styles.selectedPropertyTitle}>{selectedProperty.title}</Text>
                  <Text style={styles.selectedPropertyAddress}>{selectedProperty.address}</Text>
                  {selectedProperty.property_code && (
                    <Chip size="small" style={styles.propertyCodeChip}>
                      {selectedProperty.property_code}
                    </Chip>
                  )}
                </View>
                <Check size={20} color={theme.colors.primary} />
              </View>
            ) : (
              <View style={styles.emptyPropertySelector}>
                <Building size={24} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.placeholderText}>{t('tapToSelect')}</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.property_id && <Text style={styles.errorText}>{errors.property_id}</Text>}
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
            {loading ? t('common:submitting') : t('submitRequest')}
          </Button>
        </View>
      </ScrollView>

      {/* Property Selection Modal */}
      <Portal>
        <Modal
          visible={showPropertyModal}
          onDismiss={() => setShowPropertyModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('selectProperty')}</Text>
            <Button onPress={() => setShowPropertyModal(false)}>{t('common:cancel')}</Button>
          </View>

          <Searchbar
            placeholder={t('searchProperties')}
            onChangeText={setPropertySearch}
            value={propertySearch}
            style={styles.searchBar}
            icon={() => <Search size={20} color={theme.colors.onSurfaceVariant} />}
          />

          <ScrollView style={styles.modalContent}>
            {propertiesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>{t('common:loading')}</Text>
              </View>
            ) : propertiesError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('common:error')}</Text>
                <Button onPress={refetchProperties}>{t('common:retry')}</Button>
              </View>
            ) : filteredProperties.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Building size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.emptyText}>
                  {propertySearch ? t('noPropertiesMatch') : t('noPropertiesAvailable')}
                </Text>
              </View>
            ) : (
              filteredProperties.map((property) => (
                <TouchableOpacity
                  key={property.id}
                  style={styles.propertyItem}
                  onPress={() => handlePropertySelect(property)}
                >
                  <View style={styles.propertyItemContent}>
                    <Text style={styles.propertyItemTitle}>{property.title}</Text>
                    <Text style={styles.propertyItemAddress}>{property.address}</Text>
                    <View style={styles.propertyItemDetails}>
                      <Chip size="small" style={styles.statusChip}>
                        {property.status}
                      </Chip>
                      {property.property_code && (
                        <Chip size="small" style={styles.codeChip}>
                          {property.property_code}
                        </Chip>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Modal>
      </Portal>
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
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: spacing.sm,
    color: theme.colors.onSurface,
  },
  input: {
    marginBottom: spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'right',
    marginTop: 4,
  },
  segmentedButtons: {
    marginBottom: spacing.md,
  },
  priorityInfo: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.sm,
    borderRadius: 8,
  },
  priorityDescription: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  propertySelector: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    minHeight: 80,
    justifyContent: 'center',
  },
  selectedPropertyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedPropertyInfo: {
    flex: 1,
  },
  selectedPropertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  selectedPropertyAddress: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  propertyCodeChip: {
    alignSelf: 'flex-start',
  },
  emptyPropertySelector: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  placeholderText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  submitContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  submitButton: {
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    margin: spacing.lg,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  searchBar: {
    margin: spacing.md,
    marginBottom: spacing.sm,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  propertyItem: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  propertyItemContent: {
    padding: spacing.md,
  },
  propertyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  propertyItemAddress: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  propertyItemDetails: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  codeChip: {
    alignSelf: 'flex-start',
  },
});