import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Snackbar } from 'react-native-paper';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { useRouter } from 'expo-router';
import { propertyGroupsApi, profilesApi } from '@/lib/api';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';

export default function AddBuildingScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });

  const [groupForm, setGroupForm] = useState({
    name: '',
    group_type: 'building' as 'building' | 'villa_compound' | 'apartment_block' | 'other',
    address: '',
    city: '',
    country: '',
    neighborhood: '',
    floors_count: '',
    owner_id: '',
  });

  const [unitsForm, setUnitsForm] = useState({
    generateUnits: false,
    floorsFrom: '1',
    floorsTo: '1',
    unitsPerFloor: '1',
    unitLabelPattern: 'وحدة سكنية {floor}{num}',
    defaultBedrooms: '2',
    defaultBathrooms: '1',
    defaultAreaSqm: '80',
    defaultAnnualRent: '',
    unitType: 'residential' as 'residential' | 'commercial',
  });

  const [owners, setOwners] = useState<any[]>([]);
  React.useEffect(() => {
    (async () => {
      const { data } = await profilesApi.getAll({ role: 'owner' });
      setOwners(data || []);
    })();
  }, []);

  const handleCreate = async () => {
    if (!groupForm.name.trim()) {
      setSnackbar({ visible: true, message: 'اسم المبنى مطلوب', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: groupForm.name.trim(),
        group_type: groupForm.group_type,
        address: groupForm.address || null,
        city: groupForm.city || null,
        country: groupForm.country || null,
        neighborhood: groupForm.neighborhood || null,
        floors_count: groupForm.floors_count ? Number(groupForm.floors_count) : null,
        owner_id: groupForm.owner_id || null,
        status: 'active' as const,
      };
      const res = await propertyGroupsApi.create(payload);
      if (res.error || !res.data) throw new Error(res.error?.message || 'فشل إنشاء المبنى');

      let createdUnits = 0;
      // Optionally generate units
      if (unitsForm.generateUnits) {
        const from = Number(unitsForm.floorsFrom);
        const to = Number(unitsForm.floorsTo);
        const per = Number(unitsForm.unitsPerFloor);
        const defaultBedrooms = Number(unitsForm.defaultBedrooms);
        const defaultBathrooms = Number(unitsForm.defaultBathrooms);
        const defaultArea = Number(unitsForm.defaultAreaSqm);
        const defaultAnnualRent = unitsForm.defaultAnnualRent ? Number(unitsForm.defaultAnnualRent) : null;

        if (Number.isNaN(from) || Number.isNaN(to) || Number.isNaN(per) || from > to || per <= 0) {
          throw new Error('تحقق من نطاق الطوابق وعدد الوحدات في كل طابق');
        }

        const units: any[] = [];
        for (let f = from; f <= to; f++) {
          for (let n = 1; n <= per; n++) {
            const num = n.toString().padStart(2, '0');
            const unitLabel = unitsForm.unitLabelPattern
              .replace('{floor}', String(f))
              .replace('{num}', num);
            
            // Set property type based on unit type
            const propertyType = unitsForm.unitType === 'residential' ? 'apartment' : 'office';
            const unitDescription = unitsForm.unitType === 'residential' 
              ? `وحدة سكنية في الطابق ${f}` 
              : `وحدة تجارية في الطابق ${f}`;
            
            // For commercial units, set different default values
            const unitBedrooms = unitsForm.unitType === 'residential' ? defaultBedrooms : null;
            const unitBathrooms = unitsForm.unitType === 'residential' ? defaultBathrooms : 1;
            
            units.push({
              title: unitLabel,
              description: unitDescription,
              property_type: propertyType,
              status: 'available',
              listing_type: 'rent',
              address: payload.address || '',
              city: payload.city || '',
              country: payload.country || '',
              neighborhood: payload.neighborhood || '',
              owner_id: payload.owner_id || null,
              area_sqm: defaultArea,
              bedrooms: unitBedrooms,
              bathrooms: unitBathrooms,
              annual_rent: defaultAnnualRent,
              group_id: res.data.id,
              unit_number: `${f}${num}`,
              unit_label: unitLabel,
            });
          }
        }
        createdUnits = units.length;
        const bulk = await propertyGroupsApi.createUnitsBulk(res.data.id, units);
        if (bulk.error) throw new Error(bulk.error.message);
      }

      setSnackbar({ 
        visible: true, 
        message: `تم إنشاء المبنى بنجاح${createdUnits > 0 ? ` مع ${createdUnits} وحدة` : ''}`, 
        type: 'success' 
      });
      // Navigate to building detail for immediate visibility
      router.replace(`/buildings/${res.data.id}`);
    } catch (e: any) {
      setSnackbar({ visible: true, message: e?.message || 'حدث خطأ', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

    const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background,
    writingDirection: 'rtl',
  },
  content: { 
    flex: 1,
    writingDirection: 'rtl',
  },
  section: { margin: spacing.m },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'right',
    marginBottom: spacing.s,
    writingDirection: 'rtl',
  },
  input: { 
    marginBottom: spacing.m, 
    backgroundColor: theme.colors.surface,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  submitContainer: { 
    padding: spacing.m, 
    paddingBottom: spacing.xxxl,
    alignItems: 'center',
  },
  segmentedButtons: { 
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.s,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.m,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: spacing.m,
    marginBottom: spacing.s,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fieldDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.s,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  halfWidth: {
    width: '48%', // Adjust as needed for spacing
  },
  summaryBox: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.m,
    borderRadius: spacing.s,
    marginTop: spacing.m,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.s,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  summaryText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.s,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  disabledInput: {
    opacity: 0.7,
    backgroundColor: theme.colors.surfaceVariant,
  },
  wrappedButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  wrappedButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: spacing.s,
    marginBottom: spacing.s,
    minWidth: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  wrappedButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  wrappedButtonText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  wrappedButtonTextSelected: {
    color: theme.colors.onPrimary,
  },
});

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="إضافة مبنى" 
        showNotifications={true}
        showBackButton={true}
        variant="dark"
      />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ writingDirection: 'rtl' }}
        showsVerticalScrollIndicator={false}
      >
        <ModernCard style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات المبنى الأساسية</Text>
          <Text style={styles.sectionDescription}>
            أدخل المعلومات الأساسية للمبنى أو المجمع العقاري
          </Text>
          
          <Text style={styles.label}>اسم المبنى *</Text>
          <Text style={styles.fieldDescription}>
            اسم واضح للمبنى أو المجمع (مثال: &quot;برج النور&quot; أو &quot;مجمع الرياض السكني&quot;)
          </Text>
          <TextInput 
            mode="outlined" 
            style={styles.input} 
            placeholder="اسم واضح للمبنى أو المجمع (مثال: &quot;برج النور&quot; أو &quot;مجمع الرياض السكني&quot;)" 
            value={groupForm.name} 
            onChangeText={(t) => setGroupForm({ ...groupForm, name: t })}
            textAlign="right"
            writingDirection="rtl"
          />

          <Text style={styles.label}>نوع المجموعة</Text>
          <Text style={styles.fieldDescription}>
            اختر النوع الذي يناسب طبيعة المبنى
          </Text>
          
          <View style={styles.wrappedButtonsContainer}>
            {[
              { 
                value: 'residential_building', 
                label: 'مبنى سكني'
              },
              { 
                value: 'apartment_block', 
                label: 'مجمع شقق'
              },
              { 
                value: 'villa_compound', 
                label: 'مجمع فلل'
              },
              { 
                value: 'other', 
                label: 'أخرى'
              }
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.wrappedButton,
                  groupForm.group_type === option.value && styles.wrappedButtonSelected
                ]}
                onPress={() => setGroupForm(prev => ({ ...prev, group_type: option.value as any }))}
              >
                <Text style={[
                  styles.wrappedButtonText,
                  groupForm.group_type === option.value && styles.wrappedButtonTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subsectionTitle}>العنوان والموقع</Text>
          <Text style={styles.label}>العنوان</Text>
          <TextInput 
            mode="outlined" 
            style={styles.input} 
            value={groupForm.address} 
            onChangeText={(t) => setGroupForm({ ...groupForm, address: t })} 
            textAlign="right"
            writingDirection="rtl"
          />
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>المدينة</Text>
              <TextInput 
                mode="outlined" 
                style={styles.input} 
                placeholder="مثال: الرياض" 
                value={groupForm.city} 
                onChangeText={(t) => setGroupForm({ ...groupForm, city: t })} 
                textAlign="right"
                writingDirection="rtl"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>الدولة</Text>
              <TextInput 
                mode="outlined" 
                style={styles.input} 
                placeholder="مثال: السعودية" 
                value={groupForm.country} 
                onChangeText={(t) => setGroupForm({ ...groupForm, country: t })} 
                textAlign="right"
                writingDirection="rtl"
              />
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>الحي</Text>
              <TextInput 
                mode="outlined" 
                style={styles.input} 
                placeholder="مثال: النزهة" 
                value={groupForm.neighborhood} 
                onChangeText={(t) => setGroupForm({ ...groupForm, neighborhood: t })} 
                textAlign="right"
                writingDirection="rtl"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>عدد الطوابق</Text>
              <TextInput 
                mode="outlined" 
                style={styles.input} 
                placeholder="مثال: 5" 
                keyboardType="numeric" 
                value={groupForm.floors_count} 
                onChangeText={(t) => setGroupForm({ ...groupForm, floors_count: t })} 
                textAlign="right"
                writingDirection="rtl"
              />
            </View>
          </View>

          <Text style={styles.subsectionTitle}>المالك</Text>
          <Text style={styles.label}>تعيين مالك للمبنى</Text>
          <TextInput
            mode="outlined"
            style={styles.input}
            placeholder="أدخل معرف المالك أو اختر من الشاشة المناسبة لاحقاً"
            value={groupForm.owner_id}
            onChangeText={(t) => setGroupForm({ ...groupForm, owner_id: t })}
            textAlign="right"
            writingDirection="rtl"
          />
        </ModernCard>

        <ModernCard style={styles.section}>
          <Text style={styles.sectionTitle}>إنشاء الوحدات تلقائياً</Text>
          <Text style={styles.sectionDescription}>
            يمكنك إنشاء عدة وحدات دفعة واحدة بناءً على عدد الطوابق والوحدات
          </Text>
          
          <SegmentedButtons
            value={unitsForm.generateUnits ? 'yes' : 'no'}
            onValueChange={(v) => setUnitsForm({ ...unitsForm, generateUnits: v === 'yes' })}
            buttons={[
              { value: 'no', label: 'لا، إنشاء المبنى فقط' },
              { value: 'yes', label: 'نعم، إنشاء وحدات تلقائياً' },
            ]}
            style={styles.segmentedButtons}
            buttonStyle={{ textAlign: 'right' }}
            labelStyle={{ textAlign: 'right', writingDirection: 'rtl' }}
          />
          
          {unitsForm.generateUnits && (
            <>
              <Text style={styles.subsectionTitle}>نوع الوحدات</Text>
              <Text style={styles.fieldDescription}>
                اختر نوع الوحدات التي سيتم إنشاؤها
              </Text>
              
              <SegmentedButtons
                value={unitsForm.unitType}
                onValueChange={(value) => {
                  const newUnitType = value as 'residential' | 'commercial';
                  const newPattern = newUnitType === 'residential' ? 'وحدة سكنية {floor}{num}' : 'وحدة تجارية {floor}{num}';
                  setUnitsForm({ 
                    ...unitsForm, 
                    unitType: newUnitType,
                    unitLabelPattern: newPattern
                  });
                }}
                buttons={[
                  { 
                    value: 'residential', 
                    label: 'وحدات سكنية',
                    style: { flex: 1, minWidth: 100 }
                  },
                  { 
                    value: 'commercial', 
                    label: 'وحدات تجارية',
                    style: { flex: 1, minWidth: 100 }
                  }
                ]}
                style={{ marginBottom: spacing.m }}
                buttonStyle={{ minHeight: 48, textAlign: 'right' }}
                labelStyle={{ fontSize: 14, textAlign: 'center', writingDirection: 'rtl' }}
              />
              
              <Text style={styles.subsectionTitle}>تخطيط المبنى</Text>
              <Text style={styles.fieldDescription}>
                حدد نطاق الطوابق وعدد الوحدات في كل طابق
              </Text>
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>من طابق</Text>
                  <TextInput 
                    mode="outlined" 
                    style={styles.input} 
                    placeholder="مثال: 1" 
                    keyboardType="numeric" 
                    value={unitsForm.floorsFrom} 
                    onChangeText={(t) => setUnitsForm({ ...unitsForm, floorsFrom: t })} 
                    textAlign="right"
                    writingDirection="rtl"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>إلى طابق</Text>
                  <TextInput 
                    mode="outlined" 
                    style={styles.input} 
                    placeholder="مثال: 5" 
                    keyboardType="numeric" 
                    value={unitsForm.floorsTo} 
                    onChangeText={(t) => setUnitsForm({ ...unitsForm, floorsTo: t })} 
                    textAlign="right"
                    writingDirection="rtl"
                  />
                </View>
              </View>
              
              <Text style={styles.label}>عدد الوحدات في كل طابق</Text>
              <Text style={styles.fieldDescription}>
                سيتم إنشاء هذا العدد من الوحدات في كل طابق
              </Text>
              <TextInput 
                mode="outlined" 
                style={styles.input} 
                placeholder="مثال: 4" 
                keyboardType="numeric" 
                value={unitsForm.unitsPerFloor} 
                onChangeText={(t) => setUnitsForm({ ...unitsForm, unitsPerFloor: t })} 
                textAlign="right"
                writingDirection="rtl"
              />
              
              <Text style={styles.subsectionTitle}>تسمية الوحدات</Text>
              <Text style={styles.label}>نمط اسم الوحدة</Text>
              <Text style={styles.fieldDescription}>
                استخدم {'{floor}'} للطابق و {'{num}'} لرقم الوحدة. مثال: &quot;{unitsForm.unitType === 'residential' ? 'وحدة سكنية' : 'وحدة تجارية'} {'{floor}{num}'}&quot;
              </Text>
              <TextInput 
                mode="outlined" 
                style={styles.input} 
                placeholder={unitsForm.unitType === 'residential' ? 'وحدة سكنية {floor}{num}' : 'وحدة تجارية {floor}{num}'}
                value={unitsForm.unitLabelPattern} 
                onChangeText={(t) => setUnitsForm({ ...unitsForm, unitLabelPattern: t })}
                textAlign="right"
                writingDirection="rtl"
              />
              
              <Text style={styles.subsectionTitle}>المواصفات الافتراضية للوحدات</Text>
              <Text style={styles.fieldDescription}>
                سيتم تطبيق هذه المواصفات على جميع الوحدات المُنشأة
              </Text>
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>عدد غرف النوم</Text>
                  <Text style={styles.fieldDescription}>
                    {unitsForm.unitType === 'residential' ? 'عدد غرف النوم للوحدات السكنية' : 'غير متاح للوحدات التجارية'}
                  </Text>
                  <TextInput 
                    mode="outlined" 
                    style={[styles.input, unitsForm.unitType === 'commercial' && styles.disabledInput]} 
                    placeholder="مثال: 2" 
                    keyboardType="numeric" 
                    value={unitsForm.defaultBedrooms} 
                    onChangeText={(t) => setUnitsForm({ ...unitsForm, defaultBedrooms: t })}
                    textAlign="right"
                    writingDirection="rtl"
                    disabled={unitsForm.unitType === 'commercial'}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>عدد الحمامات</Text>
                  <Text style={styles.fieldDescription}>
                    عدد الحمامات للوحدات
                  </Text>
                  <TextInput 
                    mode="outlined" 
                    style={styles.input} 
                    placeholder="مثال: 1" 
                    keyboardType="numeric" 
                    value={unitsForm.defaultBathrooms} 
                    onChangeText={(t) => setUnitsForm({ ...unitsForm, defaultBathrooms: t })}
                    textAlign="right"
                    writingDirection="rtl"
                  />
                </View>
              </View>
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>المساحة (م²)</Text>
                  <TextInput 
                    mode="outlined" 
                    style={styles.input} 
                    placeholder="مثال: 80" 
                    keyboardType="numeric" 
                    value={unitsForm.defaultAreaSqm} 
                    onChangeText={(t) => setUnitsForm({ ...unitsForm, defaultAreaSqm: t })} 
                    textAlign="right"
                    writingDirection="rtl"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>الإيجار السنوي (ر.س)</Text>
                  <TextInput 
                    mode="outlined" 
                    style={styles.input} 
                    placeholder="مثال: 24000" 
                    keyboardType="numeric" 
                    value={unitsForm.defaultAnnualRent} 
                    onChangeText={(t) => setUnitsForm({ ...unitsForm, defaultAnnualRent: t })} 
                    textAlign="right"
                    writingDirection="rtl"
                  />
                </View>
              </View>
              
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>ملخص الوحدات المُنشأة</Text>
                <Text style={styles.summaryText}>
                  سيتم إنشاء {(() => {
                    const from = Number(unitsForm.floorsFrom) || 0;
                    const to = Number(unitsForm.floorsTo) || 0;
                    const per = Number(unitsForm.unitsPerFloor) || 0;
                    const total = Math.max(0, (to - from + 1) * per);
                    return total;
                  })()} وحدة
                </Text>
                <Text style={styles.summaryText}>
                  من الطابق {unitsForm.floorsFrom || '?'} إلى الطابق {unitsForm.floorsTo || '?'}
                </Text>
                <Text style={styles.summaryText}>
                  {unitsForm.unitsPerFloor || '?'} وحدة في كل طابق
                </Text>
              </View>
            </>
          )}
        </ModernCard>

        <View style={styles.submitContainer}>
          <Button 
            mode="contained" 
            onPress={handleCreate} 
            loading={loading} 
            disabled={loading}
            style={{ textAlign: 'right' }}
            labelStyle={{ textAlign: 'right', writingDirection: 'rtl' }}
          >
            إنشاء المبنى
          </Button>
        </View>
      </ScrollView>
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
        duration={3000}
        style={{ backgroundColor: snackbar.type === 'success' ? theme.colors.primary : theme.colors.error }}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}




