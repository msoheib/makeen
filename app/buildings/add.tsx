import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Snackbar } from 'react-native-paper';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { useRouter } from 'expo-router';
import { propertyGroupsApi } from '@/lib/api';
import { theme, spacing } from '@/lib/theme';

export default function AddBuildingScreen() {
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
  });

  const [unitsForm, setUnitsForm] = useState({
    generateUnits: false,
    floorsFrom: '1',
    floorsTo: '1',
    unitsPerFloor: '1',
    unitLabelPattern: 'شقة {floor}{num}',
    defaultBedrooms: '2',
    defaultBathrooms: '1',
    defaultAreaSqm: '80',
    defaultAnnualRent: '',
  });

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
            units.push({
              title: unitLabel,
              description: null,
              property_type: 'apartment',
              status: 'available',
              listing_type: 'rent',
              address: payload.address || '',
              city: payload.city || '',
              country: payload.country || '',
              neighborhood: payload.neighborhood || '',
              area_sqm: defaultArea,
              bedrooms: defaultBedrooms,
              bathrooms: defaultBathrooms,
              price: defaultAnnualRent || 0,
              annual_rent: defaultAnnualRent,
              payment_method: 'cash',
              images: [],
              unit_number: `${f}${num}`,
              unit_label: unitLabel,
              floor_number: f,
            });
          }
        }
        createdUnits = units.length;
        const bulk = await propertyGroupsApi.createUnitsBulk(res.data.id, units);
        if (bulk.error) throw new Error(bulk.error.message);
      }

      setSnackbar({ visible: true, message: createdUnits > 0 ? `تم إنشاء المبنى مع ${createdUnits} شقة` : 'تم إنشاء المبنى بنجاح', type: 'success' });
      // Navigate to building detail for immediate visibility
      router.replace(`/buildings/${res.data.id}`);
    } catch (e: any) {
      setSnackbar({ visible: true, message: e?.message || 'حدث خطأ', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ModernHeader title="إضافة مبنى" showBackButton onBackPress={() => router.back()} />
      <ScrollView style={styles.content}>
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
            value={groupForm.name} 
            onChangeText={(t) => setGroupForm({ ...groupForm, name: t })} 
          />

          <Text style={styles.label}>نوع المجموعة</Text>
          <Text style={styles.fieldDescription}>
            اختر النوع الذي يناسب طبيعة المبنى
          </Text>
          <SegmentedButtons
            value={groupForm.group_type}
            onValueChange={(v) => setGroupForm({ ...groupForm, group_type: v as any })}
            buttons={[
              { value: 'building', label: 'مبنى سكني' },
              { value: 'apartment_block', label: 'مجمع شقق' },
              { value: 'villa_compound', label: 'مجمع فلل' },
              { value: 'other', label: 'أخرى' },
            ]}
            style={styles.segmentedButtons}
          />

          <Text style={styles.subsectionTitle}>العنوان والموقع</Text>
          <Text style={styles.label}>العنوان</Text>
          <TextInput 
            mode="outlined" 
            style={styles.input} 
            value={groupForm.address} 
            onChangeText={(t) => setGroupForm({ ...groupForm, address: t })} 
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
              />
            </View>
          </View>
        </ModernCard>

        <ModernCard style={styles.section}>
          <Text style={styles.sectionTitle}>إنشاء الشقق تلقائياً</Text>
          <Text style={styles.sectionDescription}>
            يمكنك إنشاء عدة شقق دفعة واحدة بناءً على عدد الطوابق والوحدات
          </Text>
          
          <SegmentedButtons
            value={unitsForm.generateUnits ? 'yes' : 'no'}
            onValueChange={(v) => setUnitsForm({ ...unitsForm, generateUnits: v === 'yes' })}
            buttons={[
              { value: 'no', label: 'لا، إنشاء المبنى فقط' },
              { value: 'yes', label: 'نعم، إنشاء شقق تلقائياً' },
            ]}
            style={styles.segmentedButtons}
          />
          
          {unitsForm.generateUnits && (
            <>
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
                  />
                </View>
              </View>
              
              <Text style={styles.label}>عدد الوحدات في كل طابق</Text>
              <Text style={styles.fieldDescription}>
                سيتم إنشاء هذا العدد من الشقق في كل طابق
              </Text>
              <TextInput 
                mode="outlined" 
                style={styles.input} 
                placeholder="مثال: 4" 
                keyboardType="numeric" 
                value={unitsForm.unitsPerFloor} 
                onChangeText={(t) => setUnitsForm({ ...unitsForm, unitsPerFloor: t })} 
              />
              
              <Text style={styles.subsectionTitle}>تسمية الوحدات</Text>
              <Text style={styles.label}>نمط اسم الوحدة</Text>
              <Text style={styles.fieldDescription}>
                استخدم {'{floor}'} للطابق و {'{num}'} لرقم الوحدة. مثال: &quot;شقة {'{floor}{num}'}&quot;
              </Text>
              <TextInput 
                mode="outlined" 
                style={styles.input} 
                placeholder={'شقة {floor}{num}'}
                value={unitsForm.unitLabelPattern} 
                onChangeText={(t) => setUnitsForm({ ...unitsForm, unitLabelPattern: t })} 
              />
              
              <Text style={styles.subsectionTitle}>المواصفات الافتراضية للشقق</Text>
              <Text style={styles.fieldDescription}>
                سيتم تطبيق هذه المواصفات على جميع الشقق المُنشأة
              </Text>
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>عدد غرف النوم</Text>
                  <TextInput 
                    mode="outlined" 
                    style={styles.input} 
                    placeholder="مثال: 2" 
                    keyboardType="numeric" 
                    value={unitsForm.defaultBedrooms} 
                    onChangeText={(t) => setUnitsForm({ ...unitsForm, defaultBedrooms: t })} 
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>عدد الحمامات</Text>
                  <TextInput 
                    mode="outlined" 
                    style={styles.input} 
                    placeholder="مثال: 1" 
                    keyboardType="numeric" 
                    value={unitsForm.defaultBathrooms} 
                    onChangeText={(t) => setUnitsForm({ ...unitsForm, defaultBathrooms: t })} 
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
                  />
                </View>
              </View>
              
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>ملخص الشقق المُنشأة</Text>
                <Text style={styles.summaryText}>
                  سيتم إنشاء {(() => {
                    const from = Number(unitsForm.floorsFrom) || 0;
                    const to = Number(unitsForm.floorsTo) || 0;
                    const per = Number(unitsForm.unitsPerFloor) || 0;
                    const total = Math.max(0, (to - from + 1) * per);
                    return total;
                  })()} شقة
                </Text>
                <Text style={styles.summaryText}>
                  من الطابق {unitsForm.floorsFrom || '?'} إلى الطابق {unitsForm.floorsTo || '?'}
                </Text>
                <Text style={styles.summaryText}>
                  {unitsForm.unitsPerFloor || '?'} شقة في كل طابق
                </Text>
              </View>
            </>
          )}
        </ModernCard>

        <View style={styles.submitContainer}>
          <Button mode="contained" onPress={handleCreate} loading={loading} disabled={loading}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  section: { margin: spacing.m },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'right',
    marginBottom: spacing.s,
  },
  input: { marginBottom: spacing.m, backgroundColor: theme.colors.surface },
  submitContainer: { padding: spacing.m, paddingBottom: spacing.xxxl },
  segmentedButtons: { marginBottom: spacing.m },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.s,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.m,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  fieldDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.s,
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
  },
  summaryText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.s,
  },
});


