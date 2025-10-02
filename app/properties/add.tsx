import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, I18nManager, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { navigateBack, navigateBackToSection } from '@/lib/navigation';
import { rtlStyles, isRTL } from '@/lib/rtl';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { PropertyType, PropertyStatus } from '@/lib/types';
import { getCurrentUserContext } from '@/lib/security';
import { useApi } from '@/hooks/useApi';
import { profilesApi, propertiesApi, propertyGroupsApi } from '@/lib/api';
import { ArrowLeft, Building2, MapPin, DollarSign, Chrome as Home } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';

export default function AddPropertyScreen() {
  const { theme } = useAppTheme();
  const params = useLocalSearchParams<{ groupId?: string }>();
  const { t } = useTranslation(['properties', 'common']);
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
  const [ownerProfiles, setOwnerProfiles] = useState<any[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [ownersError, setOwnersError] = useState<string | null>(null);

  // Fetch owners when user context loads and user is manager/admin
  React.useEffect(() => {
    if (userContext && (userContext.role === 'manager' || userContext.role === 'admin')) {
      setOwnersLoading(true);
      setOwnersError(null);
      
      supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('role', 'owner')
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching owners:', error);
            setOwnersError(error.message);
            setOwnerProfiles([]);
          } else {
            setOwnerProfiles(data || []);
          }
          setOwnersLoading(false);
        })
        .catch(err => {
          console.error('Exception fetching owners:', err);
          setOwnersError(err.message);
          setOwnerProfiles([]);
          setOwnersLoading(false);
        });
    }
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
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  // Load property groups (buildings) for optional assignment
  React.useEffect(() => {
    setGroupsLoading(true);
    setGroupsError(null);
    propertyGroupsApi.getAll()
      .then(res => {
        if (res.error) {
          setGroupsError(res.error.message);
          setGroups([]);
        } else {
          setGroups(res.data || []);
        }
      })
      .finally(() => setGroupsLoading(false));
  }, []);

  // If navigated with groupId, preselect it
  React.useEffect(() => {
    if (params?.groupId) {
      setSelectedGroupId(String(params.groupId));
    }
  }, [params?.groupId]);

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
        group_id: selectedGroupId || null,
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
            onPress: () => navigateBackToSection(),
          },
        ]
      );
      
      // Automatically navigate back after a short delay
      setTimeout(() => {
        navigateBackToSection();
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
    flexDirection: rtlStyles.row().flexDirection,
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    ...rtlStyles.marginStart(spacing.s),
    textAlign: 'right',
  },
  input: {
    marginBottom: spacing.m,
    backgroundColor: theme.colors.surface,
  },
  row: {
    flexDirection: rtlStyles.row().flexDirection,
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
    ...rtlStyles.marginStart(spacing.s),
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.m,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  chipTextActive: {
    color: theme.colors.onPrimary,
  },
});

  return (
    <View style={styles.container}>
      <ModernHeader
        title="إضافة عقار"
        showBackButton={true}
        showNotifications={false}
        onBackPress={() => navigateBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, rtlStyles.textAlign('right')]}>المعلومات الأساسية</Text>
          </View>

          <TextInput
            label="عنوان العقار *"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            mode="outlined"
            style={[styles.input, rtlStyles.textAlign('right')]}
            error={!!errors.title}
            textAlign="right"
            writingDirection={isRTL() ? 'rtl' : 'ltr'}
          />
          {errors.title && <Text style={[styles.errorText, rtlStyles.textAlign('right')]}>{errors.title}</Text>}

          <TextInput
            label="الوصف"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, rtlStyles.textAlign('right')]}
            textAlign="right"
            writingDirection={isRTL() ? 'rtl' : 'ltr'}
          />

          <Text style={[styles.fieldLabel, rtlStyles.textAlign('right')]}>نوع العقار *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propertyTypeScroll}>
            <View style={styles.chipContainer}>
              {[
                { value: 'apartment', label: 'شقة' },
                { value: 'villa', label: 'فيلا' },
                { value: 'office', label: 'مكتب' },
                { value: 'retail', label: 'متجر' },
                { value: 'warehouse', label: 'مستودع' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.chip,
                    formData.property_type === option.value && styles.chipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, property_type: option.value as PropertyType })}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.property_type === option.value && styles.chipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={[styles.fieldLabel, rtlStyles.textAlign('right')]}>الحالة *</Text>
          <View style={styles.chipContainer}>
            {[
              { value: 'available', label: 'متاح' },
              { value: 'rented', label: 'مؤجر' },
              { value: 'maintenance', label: 'صيانة' },
              { value: 'reserved', label: 'محجوز' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  formData.status === option.value && styles.chipActive,
                ]}
                onPress={() => setFormData({ ...formData, status: option.value as PropertyStatus })}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.status === option.value && styles.chipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, rtlStyles.textAlign('right')]}>نوع القائمة *</Text>
          <View style={styles.chipContainer}>
            {[
              { value: 'rent', label: 'للإيجار' },
              { value: 'sale', label: 'للبيع' },
              { value: 'both', label: 'للإيجار والبيع' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  formData.listing_type === option.value && styles.chipActive,
                ]}
                onPress={() => setFormData({ ...formData, listing_type: option.value as 'rent' | 'sale' | 'both' })}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.listing_type === option.value && styles.chipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Owner Selection for Managers/Admins */}
          {(userContext?.role === 'manager' || userContext?.role === 'admin') && (
            <>
              <Text style={[styles.fieldLabel, rtlStyles.textAlign('right')]}>مالك العقار *</Text>
              <View style={styles.ownerSelectionContainer}>
                {ownersLoading ? (
                  <Text style={[styles.loadingText, rtlStyles.textAlign('right')]}>جاري تحميل قائمة الملاك...</Text>
                ) : ownersError ? (
                  <Text style={[styles.errorText, rtlStyles.textAlign('right')]}>خطأ في تحميل قائمة الملاك: {ownersError}</Text>
                ) : !ownerProfiles || ownerProfiles.length === 0 ? (
                  <Text style={[styles.loadingText, rtlStyles.textAlign('right')]}>لا يوجد ملاك متاحون</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ownerScroll}>
                    {ownerProfiles.map((owner: any) => (
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
                <Text style={[styles.errorText, rtlStyles.textAlign('right')]}>يجب اختيار مالك العقار</Text>
              )}
            </>
          )}
        </ModernCard>

        {/* Optional: Assign to Building */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, rtlStyles.textAlign('right')]}>إسناد إلى مبنى (اختياري)</Text>
          </View>

          {groupsLoading ? (
            <Text style={[styles.loadingText, rtlStyles.textAlign('right')]}>جاري تحميل قائمة المباني...</Text>
          ) : groupsError ? (
            <Text style={[styles.errorText, rtlStyles.textAlign('right')]}>خطأ في تحميل المباني: {groupsError}</Text>
          ) : groups.length === 0 ? (
            <Text style={[styles.loadingText, rtlStyles.textAlign('right')]}>لا توجد مبانٍ. يمكنك إضافة وحدات الآن ثم ربطها لاحقًا.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ownerScroll}>
              {groups.map((g: any) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.ownerOption, selectedGroupId === g.id && styles.selectedOwnerOption]}
                  onPress={() => setSelectedGroupId(selectedGroupId === g.id ? '' : g.id)}
                >
                  <Text style={[styles.ownerText, selectedGroupId === g.id && styles.selectedOwnerText]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </ModernCard>

        {/* Location */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={theme.colors.secondary} />
            <Text style={[styles.sectionTitle, rtlStyles.textAlign('right')]}>الموقع</Text>
          </View>

          <TextInput
            label="العنوان *"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            mode="outlined"
            style={[styles.input, rtlStyles.textAlign('right')]}
            error={!!errors.address}
            textAlign="right"
            writingDirection={isRTL() ? 'rtl' : 'ltr'}
          />
          {errors.address && <Text style={[styles.errorText, rtlStyles.textAlign('right')]}>{errors.address}</Text>}

          <View style={styles.row}>
            <TextInput
              label="المدينة *"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              mode="outlined"
              style={[styles.input, styles.halfInput, rtlStyles.textAlign('right')]}
              error={!!errors.city}
              textAlign="right"
              writingDirection={isRTL() ? 'rtl' : 'ltr'}
            />
            <TextInput
              label="الحي *"
              value={formData.country}
              onChangeText={(text) => setFormData({ ...formData, country: text })}
              mode="outlined"
              style={[styles.input, styles.halfInput, rtlStyles.textAlign('right')]}
              error={!!errors.country}
              textAlign="right"
              writingDirection={isRTL() ? 'rtl' : 'ltr'}
            />
          </View>
          {(errors.city || errors.country) && (
            <Text style={[styles.errorText, rtlStyles.textAlign('right')]}>{errors.city || errors.country}</Text>
          )}

          <TextInput
            label="الشارع *"
            value={formData.neighborhood}
            onChangeText={(text) => setFormData({ ...formData, neighborhood: text })}
            mode="outlined"
            style={[styles.input, rtlStyles.textAlign('right')]}
            error={!!errors.neighborhood}
            textAlign="right"
            writingDirection={isRTL() ? 'rtl' : 'ltr'}
          />
          {errors.neighborhood && <Text style={[styles.errorText, rtlStyles.textAlign('right')]}>{errors.neighborhood}</Text>}
        </ModernCard>

        {/* Property Details */}
        <ModernCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Home size={20} color={theme.colors.tertiary} />
            <Text style={[styles.sectionTitle, rtlStyles.textAlign('right')]}>تفاصيل العقار</Text>
          </View>

          <TextInput
            label="المساحة (متر مربع) *"
            value={formData.area_sqm}
            onChangeText={(text) => setFormData({ ...formData, area_sqm: text })}
            mode="outlined"
            keyboardType="numeric"
            style={[styles.input, rtlStyles.textAlign('right')]}
            error={!!errors.area_sqm}
            textAlign="right"
            writingDirection={isRTL() ? 'rtl' : 'ltr'}
          />
          {errors.area_sqm && <Text style={[styles.errorText, rtlStyles.textAlign('right')]}>{errors.area_sqm}</Text>}

          <View style={styles.row}>
            <TextInput
              label="غرف النوم"
              value={formData.bedrooms}
              onChangeText={(text) => setFormData({ ...formData, bedrooms: text })}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, styles.halfInput, rtlStyles.textAlign('right')]}
              error={!!errors.bedrooms}
              textAlign="right"
              writingDirection={isRTL() ? 'rtl' : 'ltr'}
            />
            <TextInput
              label="الحمامات"
              value={formData.bathrooms}
              onChangeText={(text) => setFormData({ ...formData, bathrooms: text })}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, styles.halfInput, rtlStyles.textAlign('right')]}
              error={!!errors.bathrooms}
              textAlign="right"
              writingDirection={isRTL() ? 'rtl' : 'ltr'}
            />
          </View>
          {(errors.bedrooms || errors.bathrooms) && (
            <Text style={[styles.errorText, rtlStyles.textAlign('right')]}>{errors.bedrooms || errors.bathrooms}</Text>
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
            style={[styles.input, rtlStyles.textAlign('right')]}
            error={!!errors.price}
            textAlign="right"
            writingDirection={isRTL() ? 'rtl' : 'ltr'}
          />
          {errors.price && <Text style={[styles.errorText, rtlStyles.textAlign('right')]}>{errors.price}</Text>}

          {/* Annual Rent field for rent/both listing types */}
          {(formData.listing_type === 'rent' || formData.listing_type === 'both') && (
            <>
              <TextInput
                label="الإيجار السنوي (ريال سعودي)"
                value={formData.annual_rent}
                onChangeText={(text) => setFormData({ ...formData, annual_rent: text })}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, rtlStyles.textAlign('right')]}
                textAlign="right"
                writingDirection={isRTL() ? 'rtl' : 'ltr'}
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

