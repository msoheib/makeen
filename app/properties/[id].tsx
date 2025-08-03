import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, IconButton, Chip, Modal, Portal } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { Property } from '@/lib/types';
import { getCurrentUserContext } from '@/lib/security';
import { useApi } from '@/hooks/useApi';
import { profilesApi, propertiesApi } from '@/lib/api';
import { LocationEdit as Edit, Share, MapPin, Chrome as Home, Bath, Bed, Square, DollarSign, Calendar, User, Phone, Mail } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';
import { usePropertiesTranslation, useCommonTranslation } from '@/lib/useTranslation';

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');
  const [transferring, setTransferring] = useState(false);

  // Translation hooks
  const { t: tProps } = usePropertiesTranslation();
  const { t: tCommon } = useCommonTranslation();

  // Get user context for role-based functionality
  const { 
    data: userContext
  } = useApi(() => getCurrentUserContext(), []);

  // Get owner profiles for transfer selection
  const { 
    data: ownerProfiles, 
    loading: ownersLoading,
    error: ownersError
  } = useApi(() => {
    // Only fetch owners if user context is loaded and user has appropriate role
    if (userContext && (userContext.role === 'manager' || userContext.role === 'admin')) {
      return profilesApi.getAll({ role: 'owner' });
    }
    return Promise.resolve({ data: [], error: null });
  }, [userContext?.role, userContext]);

  // Helper function to get the actual owners array
  const getOwnersArray = useCallback(() => {
    if (!ownerProfiles) return [];
    // Check if ownerProfiles is directly an array
    if (Array.isArray(ownerProfiles)) {
      return ownerProfiles;
    }
    // Check if ownerProfiles has a data property
    if (ownerProfiles.data && Array.isArray(ownerProfiles.data)) {
      return ownerProfiles.data;
    }
    return [];
  }, [ownerProfiles]);

  const fetchProperty = useCallback(async () => {
    try {
      setLoading(true);
      // Use proper API with security and error handling - FIX for Issue #29
      const response = await propertiesApi.getById(id as string);
      
      if (response.error) {
        // Handle specific error types with user-friendly messages
        if (response.error.details === 'AUTH_ERROR') {
          Alert.alert(tProps('errors.authError'), tProps('errors.authErrorMessage'));
          return;
        } else if (response.error.details === 'NETWORK_ERROR') {
          Alert.alert(tProps('errors.networkError'), tProps('errors.networkErrorMessage'));
          return;
        } else if (response.error.message.includes('No rows returned')) {
          Alert.alert(tProps('errors.notFound'), tProps('errors.notFoundMessage'));
          return;
        } else if (response.error.message.includes('access denied') || response.error.message.includes('permission')) {
          Alert.alert(tProps('errors.accessDenied'), tProps('errors.accessDeniedMessage'));
          return;
        } else {
          Alert.alert(tProps('errors.generalError'), response.error.message || tProps('errors.generalErrorMessage'));
          return;
        }
      }

      if (response.data) {
        setProperty(response.data);
      } else {
        Alert.alert(tProps('errors.generalError'), tProps('errors.notFoundMessage'));
      }
    } catch (error: any) {
      console.error('Error fetching property:', error);
      Alert.alert(tProps('errors.unexpectedError'), tProps('errors.unexpectedErrorMessage'));
    } finally {
      setLoading(false);
    }
  }, [id, tProps]);

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id, fetchProperty]);

  const handleOwnershipTransfer = async () => {
    if (!selectedNewOwner || !property) {
      Alert.alert(tProps('errors.generalError'), tProps('transfer.selectNewOwner'));
      return;
    }

    setTransferring(true);
    try {
      console.log('Transferring ownership:', {
        propertyId: property.id,
        newOwnerId: selectedNewOwner,
        currentOwnerId: property.owner_id
      });

      const result = await propertiesApi.update(property.id, {
        owner_id: selectedNewOwner
      });

      console.log('Update result:', result);

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Send notification to new owner
      const newOwner = getOwnersArray().find(owner => owner.id === selectedNewOwner);
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
          tCommon('success'),
          `${tProps('transfer.success')} ${newOwner.first_name} ${newOwner.last_name}`,
          [{ text: tCommon('ok'), onPress: () => setShowTransferModal(false) }]
        );
      }
    } catch (error: any) {
      console.error('Error transferring ownership:', error);
      Alert.alert(tProps('errors.generalError'), error.message || tProps('transfer.error'));
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return tProps('available');
      case 'rented':
        return tProps('rented');
      case 'maintenance':
        return tProps('maintenance');
      case 'reserved':
        return tProps('reserved');
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getPropertyTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'villa': tProps('propertyType.villa'),
      'apartment': tProps('propertyType.apartment'),
      'office': tProps('propertyType.office'),
      'retail': tProps('propertyType.retail'),
      'warehouse': tProps('propertyType.warehouse')
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading || !property) {
    return (
      <View style={styles.container}>
        <ModernHeader
          title={tProps('details.title')}
          showBackButton={true}
          showNotifications={false}
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <Text>{tProps('details.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader
        title={tProps('details.title')}
        showBackButton={true}
        showNotifications={false}
        onBackPress={() => router.back()}
        rightContent={
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
        }
      />

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
                {getStatusText(property.status)}
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
              {property.payment_method === 'cash' ? tProps('details.cashSale') : tProps('details.installment')}
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
              title={tProps('details.area')}
              value={`${property.area_sqm} ${tProps('details.sqm')}`}
              color={theme.colors.primary}
              iconElement={<Square size={20} color={theme.colors.primary} />}
            />
            {property.bedrooms !== undefined && (
              <StatCard
                title={tProps('details.bedrooms')}
                value={property.bedrooms.toString()}
                color={theme.colors.secondary}
                iconElement={<Bed size={20} color={theme.colors.secondary} />}
              />
            )}
            {property.bathrooms !== undefined && (
              <StatCard
                title={tProps('details.bathrooms')}
                value={property.bathrooms.toString()}
                color={theme.colors.tertiary}
                iconElement={<Bath size={20} color={theme.colors.tertiary} />}
              />
            )}
            <StatCard
              title={tProps('details.type')}
              value={getPropertyTypeText(property.property_type)}
              color={theme.colors.success}
              iconElement={<Home size={20} color={theme.colors.success} />}
            />
          </ScrollView>
        </View>

        {/* Owner Information */}
        {property.owner && (
          <ModernCard style={styles.ownerCard}>
            <Text style={styles.sectionTitle}>{tProps('details.ownerInformation')}</Text>
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
                {tProps('details.contact')}
              </Button>
            </View>
          </ModernCard>
        )}

        {/* Quick Actions */}
        <ModernCard style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>{tProps('details.quickActions')}</Text>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => router.push(`/maintenance/add?property=${property.id}`)}
              style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
              icon={() => <Home size={20} color="white" />}
            >
              {tProps('details.maintenance')}
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push(`/finance/vouchers/add?property=${property.id}`)}
              style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
              icon={() => <DollarSign size={20} color="white" />}
            >
              {tProps('details.addPayment')}
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push(`/contracts/add?property=${property.id}`)}
              style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
              icon={() => <Calendar size={20} color="white" />}
            >
              {tProps('details.newContract')}
            </Button>
            
            {/* Ownership Transfer Button for Managers/Admins */}
            {(userContext?.role === 'manager' || userContext?.role === 'admin') && (
              <Button
                mode="contained"
                onPress={() => setShowTransferModal(true)}
                style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                icon={() => <User size={20} color="white" />}
                disabled={ownersLoading || getOwnersArray().length === 0}
              >
                {ownersLoading 
                  ? tProps('transfer.loading') 
                  : getOwnersArray().length === 0
                  ? 'No owners available'
                  : tProps('details.transferOwnership')
                }
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
          <Text style={styles.modalTitle}>{tProps('transfer.title')}</Text>
          <Text style={styles.modalSubtitle}>
            {tProps('transfer.subtitle')} &ldquo;{property?.title}&rdquo;
          </Text>

          <View style={styles.ownerSelectionContainer}>
            {ownersLoading ? (
              <Text style={styles.loadingText}>{tProps('transfer.loading')}</Text>
            ) : ownersError ? (
              <Text style={styles.loadingText}>Error loading owners: {ownersError.message}</Text>
            ) : getOwnersArray().length === 0 ? (
              <Text style={styles.loadingText}>No owners found</Text>
            ) : (
              <ScrollView style={styles.ownersList} showsVerticalScrollIndicator={false}>
                {getOwnersArray()
                  .filter(owner => owner.id !== property?.owner_id)
                  .map((owner: any) => (
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
              {tProps('transfer.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={handleOwnershipTransfer}
              disabled={!selectedNewOwner || transferring}
              loading={transferring}
              style={styles.transferButton}
            >
              {tProps('transfer.transfer')}
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