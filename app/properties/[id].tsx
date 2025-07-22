import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, IconButton, Chip, Modal, Portal } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Property } from '@/lib/types';
import { getCurrentUserContext } from '@/lib/security';
import { useApi } from '@/hooks/useApi';
import { profilesApi, propertiesApi } from '@/lib/api';
import { ArrowLeft, LocationEdit as Edit, Share, MapPin, Chrome as Home, Bath, Bed, Square, DollarSign, Calendar, User, Phone, Mail } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');
  const [transferring, setTransferring] = useState(false);

  // Get user context for role-based functionality
  const { 
    data: userContext, 
    loading: userLoading 
  } = useApi(() => getCurrentUserContext(), []);

  // Get owner profiles for transfer selection
  const { 
    data: ownerProfiles, 
    loading: ownersLoading 
  } = useApi(() => {
    if (userContext?.role === 'manager' || userContext?.role === 'admin') {
      return profilesApi.getAll({ role: 'owner' });
    }
    return Promise.resolve({ data: [], error: null });
  }, [userContext?.role]);

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      // Use proper API with security and error handling - FIX for Issue #29
      const response = await propertiesApi.getById(id as string);
      
      if (response.error) {
        // Handle specific error types with user-friendly messages
        if (response.error.details === 'AUTH_ERROR') {
          Alert.alert('خطأ المصادقة', 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
          return;
        } else if (response.error.details === 'NETWORK_ERROR') {
          Alert.alert('خطأ في الشبكة', 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
          return;
        } else if (response.error.message.includes('No rows returned')) {
          Alert.alert('العقار غير موجود', 'لم يتم العثور على العقار المطلوب أو قد تم حذفه.');
          return;
        } else if (response.error.message.includes('access denied') || response.error.message.includes('permission')) {
          Alert.alert('ممنوع الوصول', 'ليس لديك الصلاحية لعرض تفاصيل هذا العقار.');
          return;
        } else {
          Alert.alert('خطأ', response.error.message || 'فشل في تحميل تفاصيل العقار.');
          return;
        }
      }

      if (response.data) {
        setProperty(response.data);
      } else {
        Alert.alert('خطأ', 'لم يتم العثور على العقار.');
      }
    } catch (error: any) {
      console.error('Error fetching property:', error);
      Alert.alert('خطأ غير متوقع', 'حدث خطأ أثناء تحميل العقار. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleOwnershipTransfer = async () => {
    if (!selectedNewOwner || !property) {
      Alert.alert('خطأ', 'يجب اختيار المالك الجديد');
      return;
    }

    setTransferring(true);
    try {
      const result = await propertiesApi.update(property.id, {
        owner_id: selectedNewOwner
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Send notification to new owner
      const newOwner = ownerProfiles?.data?.find(owner => owner.id === selectedNewOwner);
      if (newOwner) {
        // Update local property state
        setProperty(prev => prev ? {
          ...prev,
          owner_id: selectedNewOwner,
          owner: {
            id: selectedNewOwner,
            first_name: newOwner.first_name,
            last_name: newOwner.last_name,
            email: newOwner.email,
            phone_number: newOwner.phone
          }
        } : null);

        Alert.alert(
          'نجح',
          `تم نقل ملكية العقار إلى ${newOwner.first_name} ${newOwner.last_name}`,
          [{ text: 'موافق', onPress: () => setShowTransferModal(false) }]
        );
      }
    } catch (error: any) {
      console.error('Error transferring ownership:', error);
      Alert.alert('خطأ', error.message || 'فشل في نقل الملكية');
    } finally {
      setTransferring(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return theme.colors.success;
      case 'rented':
        return theme.colors.primary;
      case 'maintenance':
        return theme.colors.warning;
      case 'reserved':
        return theme.colors.secondary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  if (loading || !property) {
    return (
      <View style={styles.container}>
        <ModernHeader
          title="Property Details"
          showLogo={false}
          onNotificationPress={() => router.push('/notifications')}
          onMenuPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <Text>Loading property details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <View style={styles.headerActions}>
          <IconButton
            icon={() => <Share size={24} color={theme.colors.onSurface} />}
            onPress={() => console.log('Share property')}
          />
          <IconButton
            icon={() => <Edit size={24} color={theme.colors.onSurface} />}
            onPress={() => router.push(`/properties/edit/${property.id}`)}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Property Images */}
        {property.images && property.images.length > 0 && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: property.images[0] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
            <View style={styles.statusBadge}>
              <Chip
                mode="flat"
                style={[
                  styles.statusChip,
                  { backgroundColor: `${getStatusColor(property.status)}20` },
                ]}
                textStyle={{ color: getStatusColor(property.status), fontWeight: '600' }}
              >
                {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
              </Chip>
            </View>
          </View>
        )}

        {/* Property Info */}
        <ModernCard style={styles.infoCard}>
          <Text style={styles.propertyTitle}>{property.title}</Text>
          
          <View style={styles.locationRow}>
            <MapPin size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.locationText}>
              {property.address}, {property.city}, {property.country}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ${property.price.toLocaleString()}
            </Text>
            <Chip
              mode="outlined"
              style={styles.paymentChip}
              textStyle={styles.paymentText}
            >
              {property.payment_method === 'cash' ? 'Cash Sale' : 'Installment'}
            </Chip>
          </View>

          {property.description && (
            <Text style={styles.description}>{property.description}</Text>
          )}
        </ModernCard>

        {/* Property Stats */}
        <View style={styles.statsSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsContainer}
          >
            <StatCard
              title="Area"
              value={`${property.area_sqm} sqm`}
              color={theme.colors.primary}
              icon={<Square size={20} color={theme.colors.primary} />}
            />
            {property.bedrooms !== undefined && (
              <StatCard
                title="Bedrooms"
                value={property.bedrooms.toString()}
                color={theme.colors.secondary}
                icon={<Bed size={20} color={theme.colors.secondary} />}
              />
            )}
            {property.bathrooms !== undefined && (
              <StatCard
                title="Bathrooms"
                value={property.bathrooms.toString()}
                color={theme.colors.tertiary}
                icon={<Bath size={20} color={theme.colors.tertiary} />}
              />
            )}
            <StatCard
              title="Type"
              value={property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}
              color={theme.colors.success}
              icon={<Home size={20} color={theme.colors.success} />}
            />
          </ScrollView>
        </View>

        {/* Owner Information */}
        {property.owner && (
          <ModernCard style={styles.ownerCard}>
            <Text style={styles.sectionTitle}>Owner Information</Text>
            <View style={styles.ownerInfo}>
              <View style={styles.ownerDetails}>
                <View style={styles.ownerRow}>
                  <User size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.ownerText}>
                    {property.owner.first_name} {property.owner.last_name}
                  </Text>
                </View>
                <View style={styles.ownerRow}>
                  <Mail size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.ownerText}>{property.owner.email}</Text>
                </View>
                {property.owner.phone_number && (
                  <View style={styles.ownerRow}>
                    <Phone size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.ownerText}>{property.owner.phone_number}</Text>
                  </View>
                )}
              </View>
              <Button
                mode="outlined"
                onPress={() => router.push(`/people/${property.owner_id}`)}
                style={styles.contactButton}
              >
                Contact
              </Button>
            </View>
          </ModernCard>
        )}

        {/* Quick Actions */}
        <ModernCard style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => router.push(`/maintenance/add?property=${property.id}`)}
              style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
              icon={() => <Home size={20} color="white" />}
            >
              Maintenance
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push(`/finance/vouchers/add?property=${property.id}`)}
              style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
              icon={() => <DollarSign size={20} color="white" />}
            >
              Add Payment
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push(`/contracts/add?property=${property.id}`)}
              style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
              icon={() => <Calendar size={20} color="white" />}
            >
              New Contract
            </Button>
            
            {/* Ownership Transfer Button for Managers/Admins */}
            {(userContext?.role === 'manager' || userContext?.role === 'admin') && (
              <Button
                mode="contained"
                onPress={() => setShowTransferModal(true)}
                style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                icon={() => <User size={20} color="white" />}
              >
                Transfer Ownership
              </Button>
            )}
          </View>
        </ModernCard>
      </ScrollView>

      {/* Ownership Transfer Modal */}
      <Portal>
        <Modal
          visible={showTransferModal}
          onDismiss={() => setShowTransferModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Transfer Property Ownership</Text>
          <Text style={styles.modalSubtitle}>
            Select the new owner for "{property?.title}"
          </Text>

          <View style={styles.ownerSelectionContainer}>
            {ownersLoading ? (
              <Text style={styles.loadingText}>Loading owners...</Text>
            ) : (
              <ScrollView style={styles.ownersList} showsVerticalScrollIndicator={false}>
                {ownerProfiles?.data?.filter(owner => owner.id !== property?.owner_id).map((owner: any) => (
                  <TouchableOpacity
                    key={owner.id}
                    style={[
                      styles.ownerOptionModal,
                      selectedNewOwner === owner.id && styles.selectedOwnerOptionModal
                    ]}
                    onPress={() => setSelectedNewOwner(owner.id)}
                  >
                    <View style={styles.ownerInfo}>
                      <Text style={[
                        styles.ownerNameModal,
                        selectedNewOwner === owner.id && styles.selectedOwnerNameModal
                      ]}>
                        {owner.first_name} {owner.last_name}
                      </Text>
                      {owner.email && (
                        <Text style={styles.ownerEmailModal}>{owner.email}</Text>
                      )}
                    </View>
                    {selectedNewOwner === owner.id && (
                      <IconButton icon="check" size={20} iconColor={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowTransferModal(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleOwnershipTransfer}
              disabled={!selectedNewOwner || transferring}
              loading={transferring}
              style={styles.transferButton}
            >
              Transfer
            </Button>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingTop: spacing.xl,
    paddingBottom: spacing.s,
  },
  backButton: {
    margin: 0,
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    height: 250,
    marginBottom: spacing.m,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.m,
    right: spacing.m,
  },
  statusChip: {
    height: 32,
  },
  infoCard: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  propertyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.s,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  locationText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  paymentChip: {
    borderColor: theme.colors.outline,
  },
  paymentText: {
    color: theme.colors.onSurfaceVariant,
  },
  description: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  statsSection: {
    marginBottom: spacing.m,
  },
  statsContainer: {
    paddingHorizontal: spacing.m,
  },
  ownerCard: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
  },
  ownerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ownerDetails: {
    flex: 1,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  ownerText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginLeft: 8,
  },
  contactButton: {
    borderColor: theme.colors.primary,
  },
  actionsCard: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.xxxl,
  },
  actionButtons: {
    gap: spacing.m,
  },
  actionButton: {
    paddingVertical: 4,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    margin: spacing.lg,
    borderRadius: 12,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.s,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  ownerSelectionContainer: {
    marginBottom: spacing.lg,
  },
  ownersList: {
    maxHeight: 300,
  },
  ownerOptionModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.m,
    marginBottom: spacing.s,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  selectedOwnerOptionModal: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  ownerNameModal: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  selectedOwnerNameModal: {
    color: theme.colors.primary,
  },
  ownerEmailModal: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  cancelButton: {
    flex: 1,
  },
  transferButton: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    padding: spacing.lg,
  },
});