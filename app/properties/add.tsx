import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, I18nManager, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { PropertyType, PropertyStatus } from '@/lib/types';
import { getCurrentUserContext } from '@/lib/security';
import { useApi } from '@/hooks/useApi';
import { profilesApi, propertiesApi } from '@/lib/api';
import { ArrowLeft, Building2, MapPin, DollarSign, Chrome as Home } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';

export default function AddPropertyScreen() {
  const router = useRouter();
  const user = useAppStore(state => state.user);
  const [loading, setLoading] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');

  // Get user context for role-based functionality
  const { 
    data: userContext, 
    loading: userLoading 
  } = useApi(() => getCurrentUserContext(), []);

  // Get owner profiles for manager/admin selection
  const { 
    data: ownerProfiles, 
    loading: ownersLoading 
  } = useApi(() => {
    if (userContext?.role === 'manager' || userContext?.role === 'admin') {
      return profilesApi.getAll({ role: 'owner' });
    }
    return Promise.resolve({ data: [], error: null });
  }, [userContext?.role]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'apartment' as PropertyType,
    status: 'available' as PropertyStatus,
    listing_type: 'rent' as 'rent' | 'sale' | 'both',
    address: '',
    city: '',
    country: '',
    neighborhood: '',
    area_sqm: '',
    bedrooms: '',
    bathrooms: '',
    price: '',
    annual_rent: '',
    is_accepting_bids: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'عنوان العقار مطلوب';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'العنوان مطلوب';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'المدينة مطلوبة';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'الحي مطلوب';
    }
    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = 'الشارع مطلوب';
    }
    if (!formData.area_sqm || isNaN(Number(formData.area_sqm)) || Number(formData.area_sqm) <= 0) {
      newErrors.area_sqm = 'مساحة صحيحة مطلوبة';
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'سعر صحيح مطلوب';
    }
    if (formData.bedrooms && (isNaN(Number(formData.bedrooms)) || Number(formData.bedrooms) < 0)) {
      newErrors.bedrooms = 'عدد صحيح لغرف النوم مطلوب';
    }
    if (formData.bathrooms && (isNaN(Number(formData.bathrooms)) || Number(formData.bathrooms) < 0)) {
      newErrors.bathrooms = 'عدد صحيح للحمامات مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate form first
    if (!validateForm()) {
      return;
    }

    // Check user authentication
    if (!user || !user.id) {
      console.error('User authentication issue:', user);
      Alert.alert('خطأ', 'يجب أن تكون مسجل الدخول لإضافة عقار');
      return;
    }

    console.log('User authenticated:', user.id);

    setLoading(true);
    setErrors({}); // Clear previous errors

    try {
      // Determine owner ID based on user role
      let ownerId: string;
      
      if (userContext?.role === 'manager' || userContext?.role === 'admin') {
        // Property managers/admins can select any owner
        if (!selectedOwnerId) {
          Alert.alert('خطأ', 'يجب اختيار مالك العقار');
          setLoading(false);
          return;
        }
        ownerId = selectedOwnerId;
      } else {
        // Property owners can only create for themselves
        ownerId = user.id;
      }
      
      console.log('Using owner_id:', ownerId, 'for user role:', userContext?.role);

      // Prepare property data
      const propertyData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        property_type: formData.property_type,
        status: formData.status,
        listing_type: formData.listing_type,
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: 'السعودية',
        neighborhood: formData.neighborhood.trim(),
        area_sqm: Number(formData.area_sqm),
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
        price: Number(formData.price),
        annual_rent: formData.annual_rent ? Number(formData.annual_rent) : null,
        payment_method: 'cash',
        owner_id: ownerId,
        images: [], // Empty array for now
        is_accepting_bids: formData.is_accepting_bids,
      };

      console.log('Submitting property data:', propertyData);

      // Insert into database using enhanced API with notification support
      const result = await propertiesApi.create(propertyData, user.id);

      if (result.error) {
        console.error('Property creation error:', result.error);
        throw new Error(result.error.message);
      }

      const data = result.data;

      console.log('Property added successfully:', data);

      // Show success message and automatically navigate back
      Alert.alert(
        'نجح',
        'تم إضافة العقار بنجاح!',
        [
          {
            text: 'موافق',
            onPress: () => router.replace('/(tabs)/properties'),
          },
        ]
      );
      
      // Automatically navigate back after a short delay
      setTimeout(() => {
        router.replace('/(tabs)/properties');
      }, 1500);
    } catch (error: any) {
      console.error('Error adding property:', error);
      
      // More detailed error handling
      let errorMessage = 'فشل في إضافة العقار';
      
      if (error.message) {
        if (error.message.includes('owner_id')) {
          errorMessage = 'خطأ في معرف المالك';
        } else if (error.message.includes('duplicate')) {
          errorMessage = 'العقار موجود مسبقاً';
        } else if (error.message.includes('constraint')) {
          errorMessage = 'خطأ في البيانات المدخلة';
        } else if (error.message.includes('network')) {
          errorMessage = 'خطأ في الاتصال بالشبكة';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('خطأ', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="إضافة عقار"
        showBackButton={true}
        showNotifications={false}
        onBackPress={() => router.push('/(tabs)/properties')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>
          </View>

          <TextInput
            label="عنوان العقار *"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            mode="outlined"
            style={styles.input}
            error={!!errors.title}
            textAlign="right"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          <TextInput
            label="الوصف"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            textAlign="right"
          />

          <Text style={styles.fieldLabel}>نوع العقار *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propertyTypeScroll}>
            <SegmentedButtons
              value={formData.property_type}
              onValueChange={(value) => setFormData({ ...formData, property_type: value as PropertyType })}
              buttons={[
                { value: 'apartment', label: 'شقة' },
                { value: 'villa', label: 'فيلا' },
                { value: 'office', label: 'مكتب' },
                { value: 'retail', label: 'متجر' },
                { value: 'warehouse', label: 'مستودع' },
              ]}
              style={styles.segmentedButtons}
            />
          </ScrollView>

          <Text style={styles.fieldLabel}>الحالة *</Text>
          <SegmentedButtons
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as PropertyStatus })}
            buttons={[
              { value: 'available', label: 'متاح' },
              { value: 'rented', label: 'مؤجر' },
              { value: 'maintenance', label: 'صيانة' },
              { value: 'reserved', label: 'محجوز' },
            ]}
            style={styles.segmentedButtons}
          />

          <Text style={styles.fieldLabel}>نوع القائمة *</Text>
          <SegmentedButtons
            value={formData.listing_type}
            onValueChange={(value) => setFormData({ ...formData, listing_type: value as 'rent' | 'sale' | 'both' })}
            buttons={[
              { value: 'rent', label: 'للإيجار' },
              { value: 'sale', label: 'للبيع' },
              { value: 'both', label: 'للإيجار والبيع' },
            ]}
            style={styles.segmentedButtons}
          />

          {/* Owner Selection for Managers/Admins */}
          {(userContext?.role === 'manager' || userContext?.role === 'admin') && (
            <>
              <Text style={styles.fieldLabel}>مالك العقار *</Text>
              <View style={styles.ownerSelectionContainer}>
                {ownersLoading ? (
                  <Text style={styles.loadingText}>جاري تحميل قائمة الملاك...</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ownerScroll}>
                    {ownerProfiles?.data?.map((owner: any) => (
                      <TouchableOpacity
                        key={owner.id}
                        style={[
                          styles.ownerOption,
                          selectedOwnerId === owner.id && styles.selectedOwnerOption
                        ]}
                        onPress={() => setSelectedOwnerId(owner.id)}
                      >
                        <Text style={[
                          styles.ownerText,
                          selectedOwnerId === owner.id && styles.selectedOwnerText
                        ]}>
                          {owner.first_name} {owner.last_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
              {!selectedOwnerId && (userContext?.role === 'manager' || userContext?.role === 'admin') && (
                <Text style={styles.errorText}>يجب اختيار مالك العقار</Text>
              )}
            </>
          )}
        </ModernCard>

        {/* Location */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={theme.colors.secondary} />
            <Text style={styles.sectionTitle}>الموقع</Text>
          </View>

          <TextInput
            label="العنوان *"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            mode="outlined"
            style={styles.input}
            error={!!errors.address}
            textAlign="right"
          />
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

          <View style={styles.row}>
            <TextInput
              label="المدينة *"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              error={!!errors.city}
              textAlign="right"
            />
            <TextInput
              label="الحي *"
              value={formData.country}
              onChangeText={(text) => setFormData({ ...formData, country: text })}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              error={!!errors.country}
              textAlign="right"
            />
          </View>
          {(errors.city || errors.country) && (
            <Text style={styles.errorText}>{errors.city || errors.country}</Text>
          )}

          <TextInput
            label="الشارع *"
            value={formData.neighborhood}
            onChangeText={(text) => setFormData({ ...formData, neighborhood: text })}
            mode="outlined"
            style={styles.input}
            error={!!errors.neighborhood}
            textAlign="right"
          />
          {errors.neighborhood && <Text style={styles.errorText}>{errors.neighborhood}</Text>}
        </ModernCard>

        {/* Property Details */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Home size={20} color={theme.colors.tertiary} />
            <Text style={styles.sectionTitle}>تفاصيل العقار</Text>
          </View>

          <TextInput
            label="المساحة (متر مربع) *"
            value={formData.area_sqm}
            onChangeText={(text) => setFormData({ ...formData, area_sqm: text })}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            error={!!errors.area_sqm}
            textAlign="right"
          />
          {errors.area_sqm && <Text style={styles.errorText}>{errors.area_sqm}</Text>}

          <View style={styles.row}>
            <TextInput
              label="غرف النوم"
              value={formData.bedrooms}
              onChangeText={(text) => setFormData({ ...formData, bedrooms: text })}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, styles.halfInput]}
              error={!!errors.bedrooms}
              textAlign="right"
            />
            <TextInput
              label="الحمامات"
              value={formData.bathrooms}
              onChangeText={(text) => setFormData({ ...formData, bathrooms: text })}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, styles.halfInput]}
              error={!!errors.bathrooms}
              textAlign="right"
            />
          </View>
          {(errors.bedrooms || errors.bathrooms) && (
            <Text style={styles.errorText}>{errors.bedrooms || errors.bathrooms}</Text>
          )}
        </ModernCard>

        {/* Pricing */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color={theme.colors.success} />
            <Text style={styles.sectionTitle}>التسعير</Text>
          </View>

          <TextInput
            label={formData.listing_type === 'rent' ? 'الإيجار السنوي (ريال سعودي) *' : 'السعر (ريال سعودي) *'}
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            error={!!errors.price}
            textAlign="right"
          />
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

          {/* Annual Rent field for rent/both listing types */}
          {(formData.listing_type === 'rent' || formData.listing_type === 'both') && (
            <>
              <TextInput
                label="الإيجار السنوي (ريال سعودي)"
                value={formData.annual_rent}
                onChangeText={(text) => setFormData({ ...formData, annual_rent: text })}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                textAlign="right"
                placeholder="الإيجار المطلوب سنوياً"
              />
            </>
          )}

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
            إضافة العقار
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
  },
  section: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginRight: spacing.s,
    textAlign: 'right',
  },
  input: {
    marginBottom: spacing.m,
    backgroundColor: theme.colors.surface,
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: spacing.s,
    marginTop: spacing.s,
    textAlign: 'right',
  },
  segmentedButtons: {
    marginBottom: spacing.m,
  },
  propertyTypeScroll: {
    marginBottom: spacing.m,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: -spacing.s,
    marginBottom: spacing.s,
    textAlign: 'right',
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
  ownerSelectionContainer: {
    marginBottom: spacing.m,
  },
  ownerScroll: {
    marginBottom: spacing.s,
  },
  ownerOption: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    marginRight: spacing.s,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  selectedOwnerOption: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  ownerText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  selectedOwnerText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    padding: spacing.m,
  },
});