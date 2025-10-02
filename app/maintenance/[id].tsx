import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Text, Button, Card, Chip, Portal, Modal, SegmentedButtons } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { addAlpha } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import { MaintenanceRequest } from '@/lib/types';
import { Clock, AlertCircle, User, MapPin, Calendar, CheckCircle, XCircle, Edit3 } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { useMaintenanceTranslation } from '@/lib/useTranslation';
import { getFlexDirection, getTextAlign, rtlStyles } from '@/lib/rtl';
import { format } from 'date-fns';

export default function MaintenanceRequestDetails() {
  const { theme } = useAppTheme();
  
  // Status color mapping
  const statusColors = {
    pending: '#FF9800',
    approved: theme.colors.primary,
    in_progress: theme.colors.secondary,
    completed: '#4CAF50',
    cancelled: theme.colors.error,
  };

  // Priority color mapping
  const priorityColors = {
    low: '#4CAF50',
    medium: theme.colors.secondary,
    high: '#FF9800',
    urgent: theme.colors.error,
  };
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useMaintenanceTranslation();
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (id) {
      fetchMaintenanceRequest();
    }
  }, [id]);

  const fetchMaintenanceRequest = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          property:properties(title, address, city, neighborhood),
          tenant:profiles(first_name, last_name, phone, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setRequest(data);
        setNewStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching maintenance request:', error);
      Alert.alert('خطأ', 'فشل في تحميل تفاصيل طلب الصيانة');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!request || newStatus === request.status) {
      setShowStatusModal(false);
      return;
    }

    try {
      setUpdating(true);
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;
      
      setRequest({ ...request, status: newStatus });
      setShowStatusModal(false);
      Alert.alert('نجح', 'تم تحديث حالة طلب الصيانة بنجاح');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('خطأ', 'فشل في تحديث حالة طلب الصيانة');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusKey = status === 'in_progress' ? 'inProgress' : status;
    return t(`statuses.${statusKey}`) || status;
  };

  const getPriorityLabel = (priority: string) => {
    return t(`priorities.${priority}`) || priority;
  };

  if (loading) {
      const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
  },
  loadingText: {
    marginTop: spacing.m,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
  },
  errorText: {
    marginTop: spacing.m,
    fontSize: 16,
    color: theme.colors.error,
  },
  headerCard: {
    marginTop: spacing.m,
    marginBottom: spacing.m,
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
    paddingRight: spacing.m,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusChip: {
    height: 32,
  },
  infoCard: {
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
  },
  infoRow: {
    alignItems: 'flex-start',
    marginBottom: spacing.m,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.s,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  infoSubValue: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  descriptionCard: {
    marginBottom: spacing.m,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.onSurface,
  },
  imagesCard: {
    marginBottom: spacing.m,
  },
  imagesGrid: {
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  imageContainer: {
    width: '48%',
    aspectRatio: 16/9,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  actionsContainer: {
    paddingVertical: spacing.l,
    paddingBottom: spacing.xl,
  },
  actionButton: {
    marginBottom: spacing.m,
  },
  buttonContent: {
    paddingVertical: spacing.s,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    padding: spacing.l,
    margin: spacing.l,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.l,
  },
  segmentedButtons: {
    marginBottom: spacing.l,
  },
  modalActions: {
    justifyContent: 'space-between',
    gap: spacing.m,
  },
  modalButton: {
    flex: 1,
  },
});

  return (
      <View style={styles.container}>
        <ModernHeader
          title={t('requestDetails')}
          showBack
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { textAlign: getTextAlign() }]}>
            جاري تحميل التفاصيل...
          </Text>
        </View>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.container}>
        <ModernHeader
          title={t('requestDetails')}
          showBack
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <XCircle size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { textAlign: getTextAlign() }]}>
            لم يتم العثور على طلب الصيانة
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('requestDetails')}
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <ModernCard style={styles.headerCard}>
          <View style={[styles.headerRow, rtlStyles.row()]}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { textAlign: getTextAlign() }]} numberOfLines={2}>
                {request.title}
              </Text>
              <Text style={[styles.subtitle, { textAlign: getTextAlign() }]}>
                {format(new Date(request.created_at), 'dd/MM/yyyy - HH:mm')}
              </Text>
            </View>
            <View style={[styles.statusContainer, rtlStyles.row()]}>
              <Chip
                mode="flat"
                style={[
                  styles.statusChip,
                  { backgroundColor: addAlpha((statusColors as any)[request.status] || theme.colors.onSurfaceVariant, 0.125) },
                ]}
                textStyle={{ color: (statusColors as any)[request.status] || theme.colors.onSurfaceVariant, fontWeight: '600' }}
              >
                {getStatusLabel(request.status)}
              </Chip>
            </View>
          </View>
        </ModernCard>

        {/* Property & Tenant Info */}
        <ModernCard style={styles.infoCard}>
          <Text style={[styles.sectionTitle, { textAlign: getTextAlign() }]}>
            معلومات العقار والمستأجر
          </Text>
          
          <View style={[styles.infoRow, rtlStyles.row()]}>
            <MapPin size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { textAlign: getTextAlign() }]}>العقار</Text>
              <Text style={[styles.infoValue, { textAlign: getTextAlign() }]}>
                {request.property?.title}
              </Text>
              <Text style={[styles.infoSubValue, { textAlign: getTextAlign() }]}>
                {request.property?.address}, {request.property?.city}
              </Text>
            </View>
          </View>

          {request.tenant && (
            <View style={[styles.infoRow, rtlStyles.row()]}>
              <User size={20} color={theme.colors.secondary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { textAlign: getTextAlign() }]}>المستأجر</Text>
                <Text style={[styles.infoValue, { textAlign: getTextAlign() }]}>
                  {request.tenant.first_name} {request.tenant.last_name}
                </Text>
                {request.tenant.phone && (
                  <Text style={[styles.infoSubValue, { textAlign: getTextAlign() }]}>
                    {request.tenant.phone}
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={[styles.infoRow, rtlStyles.row()]}>
            <AlertCircle size={20} color={priorityColors[request.priority]} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { textAlign: getTextAlign() }]}>الأولوية</Text>
              <Text style={[
                styles.infoValue, 
                { 
                  color: priorityColors[request.priority],
                  textAlign: getTextAlign()
                }
              ]}>
                {getPriorityLabel(request.priority)}
              </Text>
            </View>
          </View>
        </ModernCard>

        {/* Description */}
        <ModernCard style={styles.descriptionCard}>
          <Text style={[styles.sectionTitle, { textAlign: getTextAlign() }]}>
            وصف المشكلة
          </Text>
          <Text style={[styles.description, { textAlign: getTextAlign() }]}>
            {request.description}
          </Text>
        </ModernCard>

        {/* Images */}
        {request.images && request.images.length > 0 && (
          <ModernCard style={styles.imagesCard}>
            <Text style={[styles.sectionTitle, { textAlign: getTextAlign() }]}>
              الصور المرفقة ({request.images.length})
            </Text>
            <View style={[styles.imagesGrid, rtlStyles.row()]}>
              {request.images.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image
                    source={{ uri: image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          </ModernCard>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            icon={({ size, color }) => <Edit3 size={size} color={color} />}
            onPress={() => setShowStatusModal(true)}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
          >
            تحديث الحالة
          </Button>
        </View>
      </ScrollView>

      {/* Status Update Modal */}
      <Portal>
        <Modal
          visible={showStatusModal}
          onDismiss={() => setShowStatusModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={[styles.modalTitle, { textAlign: getTextAlign() }]}>
            تحديث حالة طلب الصيانة
          </Text>
          
          <SegmentedButtons
            value={newStatus}
            onValueChange={setNewStatus}
            buttons={[
              { 
                value: 'pending', 
                label: getStatusLabel('pending'),
                style: { backgroundColor: newStatus === 'pending' ? addAlpha((statusColors as any).pending || theme.colors.onSurfaceVariant, 0.125) : 'transparent' }
              },
              { 
                value: 'approved', 
                label: getStatusLabel('approved'),
                style: { backgroundColor: newStatus === 'approved' ? addAlpha((statusColors as any).approved || theme.colors.onSurfaceVariant, 0.125) : 'transparent' }
              },
              { 
                value: 'in_progress', 
                label: getStatusLabel('in_progress'),
                style: { backgroundColor: newStatus === 'in_progress' ? addAlpha((statusColors as any).in_progress || theme.colors.onSurfaceVariant, 0.125) : 'transparent' }
              },
              { 
                value: 'completed', 
                label: getStatusLabel('completed'),
                style: { backgroundColor: newStatus === 'completed' ? addAlpha((statusColors as any).completed || theme.colors.onSurfaceVariant, 0.125) : 'transparent' }
              },
              { 
                value: 'cancelled', 
                label: getStatusLabel('cancelled'),
                style: { backgroundColor: newStatus === 'cancelled' ? addAlpha((statusColors as any).cancelled || theme.colors.onSurfaceVariant, 0.125) : 'transparent' }
              },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={[styles.modalActions, rtlStyles.row()]}>
            <Button
              mode="outlined"
              onPress={() => setShowStatusModal(false)}
              style={styles.modalButton}
              disabled={updating}
            >
              إلغاء
            </Button>
            <Button
              mode="contained"
              onPress={updateStatus}
              style={styles.modalButton}
              loading={updating}
              disabled={updating || newStatus === request.status}
            >
              حفظ
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

 