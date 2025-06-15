import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, I18nManager } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { PropertyType, PropertyStatus, PaymentMethod } from '@/lib/types';
import { ArrowLeft, Building2, MapPin, DollarSign, Chrome as Home } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';

export default function AddPropertyScreen() {
  const router = useRouter();
  const user = useAppStore(state => state.user);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'apartment' as PropertyType,
    status: 'available' as PropertyStatus,
    address: '',
    city: '',
    country: '',
    neighborhood: '',
    area_sqm: '',
    bedrooms: '',
    bathrooms: '',
    price: '',
    payment_method: 'cash' as PaymentMethod,
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
      newErrors.country = 'الدولة مطلوبة';
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
      // Get all profiles to find a valid owner_id (temporary workaround)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'owner')
        .limit(1);

      const ownerId = profiles && profiles.length > 0 ? profiles[0].id : user.id;
      console.log('Using owner_id:', ownerId);

      // Prepare property data
      const propertyData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        property_type: formData.property_type,
        status: formData.status,
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        neighborhood: formData.neighborhood.trim() || null,
        area_sqm: Number(formData.area_sqm),
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
        price: Number(formData.price),
        payment_method: formData.payment_method,
        owner_id: ownerId,
        images: [], // Empty array for now
      };

      console.log('Submitting property data:', propertyData);

      // Insert into database
      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Property added successfully:', data);

      // Show success message and navigate back
      Alert.alert(
        'نجح',
        'تم إضافة العقار بنجاح!',
        [
          {
            text: 'موافق',
            onPress: () => router.replace('/(drawer)/(tabs)/properties'),
          },
        ]
      );
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
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.push('/(drawer)/(tabs)/properties')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>إضافة عقار</Text>
        <View style={styles.headerSpacer} />
      </View>

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
              label="الدولة *"
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
            label="الحي"
            value={formData.neighborhood}
            onChangeText={(text) => setFormData({ ...formData, neighborhood: text })}
            mode="outlined"
            style={styles.input}
            textAlign="right"
          />
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
            label="السعر (ريال سعودي) *"
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            error={!!errors.price}
            textAlign="right"
          />
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

          <Text style={styles.fieldLabel}>طريقة الدفع *</Text>
          <SegmentedButtons
            value={formData.payment_method}
            onValueChange={(value) => setFormData({ ...formData, payment_method: value as PaymentMethod })}
            buttons={[
              { value: 'cash', label: 'نقداً' },
              { value: 'installment', label: 'أقساط' },
            ]}
            style={styles.segmentedButtons}
          />
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
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingTop: spacing.xl,
    paddingBottom: spacing.s,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
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
});