import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Chip, RadioButton, Switch, HelperText, ActivityIndicator, Portal, Modal } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import api from '@/lib/api';
import { spacing } from '@/lib/theme';
import { ModernHeader } from '@/components/ModernHeader';
import { 
  Home,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Shield,
  Zap,
  Bed,
  Bath,
  Square,
  User,
  Phone,
  CheckCircle,
  AlertCircle
} from 'lucide-react-native';

export default function SubmitBidScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { 
    propertyId, 
    propertyTitle, 
    propertyPrice, 
    listingType,
    minBidAmount = '0',
    maxBidAmount = '0'
  } = useLocalSearchParams();

  // Get property details for full information
  const { 
    data: property, 
    loading: propertyLoading, 
    error: propertyError 
  } = useApi(() => api.properties.getById(propertyId as string), [propertyId]);

  // Form state
  const [bidType, setBidType] = useState<'purchase' | 'rental'>('purchase');
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');
  const [rentalDuration, setRentalDuration] = useState('12');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [moveInDate, setMoveInDate] = useState('');
  
  // Validation and UI state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const styles = getStyles(theme);

  const minBid = parseFloat(minBidAmount as string) || 0;
  const maxBid = parseFloat(maxBidAmount as string) || parseFloat(propertyPrice as string) || 0;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      newErrors.bidAmount = 'Please enter a valid bid amount';
    } else {
      const amount = parseFloat(bidAmount);
      if (minBid > 0 && amount < minBid) {
        newErrors.bidAmount = `Minimum bid amount is ${new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(minBid)}`;
      }
      if (maxBid > 0 && amount > maxBid) {
        newErrors.bidAmount = `Maximum bid amount is ${new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(maxBid)}`;
      }
    }

    if (bidType === 'rental') {
      if (!rentalDuration || parseInt(rentalDuration) < 1) {
        newErrors.rentalDuration = 'Please enter a valid rental duration';
      }
      if (securityDeposit && parseFloat(securityDeposit) < 0) {
        newErrors.securityDeposit = 'Security deposit cannot be negative';
      }
      if (moveInDate) {
        const moveIn = new Date(moveInDate);
        const today = new Date();
        if (moveIn < today) {
          newErrors.moveInDate = 'Move-in date cannot be in the past';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitBid = async () => {
    if (!validateForm()) {
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSubmitBid = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      // Mock buyer ID - in real app, get from auth context
      const buyerId = 'buyer-id-placeholder';

      const bidData = {
        property_id: propertyId as string,
        bidder_id: buyerId,
        bid_type: bidType,
        bid_amount: parseFloat(bidAmount),
        message: message.trim() || undefined,
        rental_duration_months: bidType === 'rental' ? parseInt(rentalDuration) : undefined,
        security_deposit_amount: bidType === 'rental' && securityDeposit ? parseFloat(securityDeposit) : undefined,
        utilities_included: bidType === 'rental' ? utilitiesIncluded : undefined,
        move_in_date: bidType === 'rental' && moveInDate ? new Date(moveInDate).toISOString() : undefined,
      };

      const response = await api.buyer.submitBid(bidData);

      if (response.success) {
        Alert.alert(
          'Bid Submitted Successfully!',
          'Your bid has been submitted and is pending manager approval. You will be notified once there\'s an update.',
          [
            {
              text: 'View My Bids',
              onPress: () => router.replace('/buyer/my-bids')
            },
            {
              text: 'Browse More Properties',
              onPress: () => router.replace('/buyer/browse-properties')
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to submit bid. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Bid submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (propertyLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ModernHeader title="Submit Bid" showBack={true} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading property details...</Text>
      </View>
    );
  }

  if (propertyError || !property?.data) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ModernHeader title="Submit Bid" showBack={true} />
        <AlertCircle size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>Failed to load property details</Text>
        <Button mode="outlined" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  const propertyData = property.data;

  return (
    <View style={styles.container}>
      <ModernHeader title="Submit Bid" showBack={true} />
      
      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Property Summary */}
          <Card style={styles.propertyCard}>
            <Card.Content>
              <View style={styles.propertyHeader}>
                <Home size={24} color={theme.colors.primary} />
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyTitle}>
                    {propertyData.title}
                  </Text>
                  <View style={styles.locationRow}>
                    <MapPin size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.locationText}>
                      {propertyData.address}, {propertyData.city}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.propertyFeatures}>
                {propertyData.bedrooms && (
                  <View style={styles.featureItem}>
                    <Bed size={16} color={theme.colors.primary} />
                    <Text style={styles.featureText}>{propertyData.bedrooms} Bedrooms</Text>
                  </View>
                )}
                {propertyData.bathrooms && (
                  <View style={styles.featureItem}>
                    <Bath size={16} color={theme.colors.primary} />
                    <Text style={styles.featureText}>{propertyData.bathrooms} Bathrooms</Text>
                  </View>
                )}
                {propertyData.area_sqm && (
                  <View style={styles.featureItem}>
                    <Square size={16} color={theme.colors.primary} />
                    <Text style={styles.featureText}>{propertyData.area_sqm}m²</Text>
                  </View>
                )}
              </View>

              <View style={styles.priceInfo}>
                <Text style={styles.priceLabel}>Property Price:</Text>
                <Text style={styles.priceText}>
                  {formatCurrency(propertyData.price || propertyData.annual_rent || 0)}
                  {listingType === 'rent' && '/year'}
                </Text>
              </View>

              {(minBid > 0 || maxBid > 0) && (
                <View style={styles.bidLimits}>
                  {minBid > 0 && (
                    <Chip style={styles.limitChip} textStyle={{ fontSize: 12 }}>
                      Min: {formatCurrency(minBid)}
                    </Chip>
                  )}
                  {maxBid > 0 && (
                    <Chip style={styles.limitChip} textStyle={{ fontSize: 12 }}>
                      Max: {formatCurrency(maxBid)}
                    </Chip>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Bid Type Selection */}
          <Card style={styles.formCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Bid Type</Text>
              <RadioButton.Group
                onValueChange={(value) => setBidType(value as 'purchase' | 'rental')}
                value={bidType}
              >
                <View style={styles.radioOption}>
                  <RadioButton.Item
                    label="Purchase"
                    value="purchase"
                    labelStyle={{ textAlign: 'left' }}
                  />
                </View>
                <View style={styles.radioOption}>
                  <RadioButton.Item
                    label="Rental"
                    value="rental"
                    labelStyle={{ textAlign: 'left' }}
                  />
                </View>
              </RadioButton.Group>
            </Card.Content>
          </Card>

          {/* Bid Amount */}
          <Card style={styles.formCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Bid Amount</Text>
              <TextInput
                mode="outlined"
                label="Bid Amount (SAR)"
                value={bidAmount}
                onChangeText={setBidAmount}
                keyboardType="numeric"
                left={<TextInput.Icon icon={() => <DollarSign size={20} color={theme.colors.primary} />} />}
                error={!!errors.bidAmount}
                style={styles.formField}
              />
              {errors.bidAmount && (
                <HelperText type="error" visible={!!errors.bidAmount}>
                  {errors.bidAmount}
                </HelperText>
              )}
            </Card.Content>
          </Card>

          {/* Rental-specific fields */}
          {bidType === 'rental' && (
            <Card style={styles.formCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Rental Details</Text>
                
                <TextInput
                  mode="outlined"
                  label="Rental Duration (months)"
                  value={rentalDuration}
                  onChangeText={setRentalDuration}
                  keyboardType="numeric"
                  left={<TextInput.Icon icon={() => <Calendar size={20} color={theme.colors.primary} />} />}
                  error={!!errors.rentalDuration}
                  style={styles.formField}
                />
                {errors.rentalDuration && (
                  <HelperText type="error" visible={!!errors.rentalDuration}>
                    {errors.rentalDuration}
                  </HelperText>
                )}

                <TextInput
                  mode="outlined"
                  label="Security Deposit (SAR) - Optional"
                  value={securityDeposit}
                  onChangeText={setSecurityDeposit}
                  keyboardType="numeric"
                  left={<TextInput.Icon icon={() => <Shield size={20} color={theme.colors.primary} />} />}
                  error={!!errors.securityDeposit}
                  style={styles.formField}
                />
                {errors.securityDeposit && (
                  <HelperText type="error" visible={!!errors.securityDeposit}>
                    {errors.securityDeposit}
                  </HelperText>
                )}

                <TextInput
                  mode="outlined"
                  label="Preferred Move-in Date - Optional"
                  value={moveInDate}
                  onChangeText={setMoveInDate}
                  placeholder="YYYY-MM-DD"
                  left={<TextInput.Icon icon={() => <Calendar size={20} color={theme.colors.primary} />} />}
                  error={!!errors.moveInDate}
                  style={styles.formField}
                />
                {errors.moveInDate && (
                  <HelperText type="error" visible={!!errors.moveInDate}>
                    {errors.moveInDate}
                  </HelperText>
                )}

                <View style={styles.switchContainer}>
                  <View style={styles.switchLabel}>
                    <Zap size={20} color={theme.colors.primary} />
                    <Text style={styles.switchText}>Utilities Included</Text>
                  </View>
                  <Switch
                    value={utilitiesIncluded}
                    onValueChange={setUtilitiesIncluded}
                  />
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Message */}
          <Card style={styles.formCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Message to Owner (Optional)</Text>
              <TextInput
                mode="outlined"
                label="Your message"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                placeholder="Add any additional details about your offer..."
                style={styles.formField}
              />
            </Card.Content>
          </Card>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              mode="contained"
              onPress={handleSubmitBid}
              loading={submitting}
              disabled={submitting}
              style={styles.submitButton}
              icon={({ size, color }) => <CheckCircle size={size} color={color} />}
            >
              Submit Bid
            </Button>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <Portal>
        <Modal
          visible={showConfirmModal}
          onDismiss={() => setShowConfirmModal(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={styles.modalTitle}>Confirm Your Bid</Text>
          <Text style={styles.modalText}>
            You are about to submit a {bidType} bid of {formatCurrency(parseFloat(bidAmount) || 0)} for:
          </Text>
          <Text style={styles.modalPropertyTitle}>{propertyData.title}</Text>
          
          {bidType === 'rental' && (
            <View style={styles.modalDetails}>
              <Text style={styles.modalDetailText}>
                • Duration: {rentalDuration} months
              </Text>
              {securityDeposit && (
                <Text style={styles.modalDetailText}>
                  • Security Deposit: {formatCurrency(parseFloat(securityDeposit))}
                </Text>
              )}
              {moveInDate && (
                <Text style={styles.modalDetailText}>
                  • Move-in Date: {new Date(moveInDate).toLocaleDateString()}
                </Text>
              )}
              <Text style={styles.modalDetailText}>
                • Utilities: {utilitiesIncluded ? 'Included' : 'Not included'}
              </Text>
            </View>
          )}

          <Text style={styles.modalWarning}>
            This bid will be valid for 72 hours and requires manager approval before being sent to the property owner.
          </Text>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowConfirmModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={confirmSubmitBid}
              loading={submitting}
              disabled={submitting}
              style={styles.modalButton}
            >
              Confirm Bid
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    loadingText: {
      marginTop: spacing.m,
      color: theme.colors.onSurface,
    },
    errorText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.error,
      marginVertical: spacing.m,
      textAlign: 'center',
    },
    propertyCard: {
      margin: spacing.m,
      borderRadius: 16,
    },
    propertyHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.m,
    },
    propertyInfo: {
      flex: 1,
      marginLeft: spacing.m,
    },
    propertyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing.xs,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    locationText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    propertyFeatures: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.m,
      marginBottom: spacing.m,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    featureText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    priceInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.m,
    },
    priceLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    priceText: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    bidLimits: {
      flexDirection: 'row',
      gap: spacing.s,
    },
    limitChip: {
      flex: 1,
    },
    formCard: {
      marginHorizontal: spacing.m,
      marginBottom: spacing.m,
      borderRadius: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: spacing.m,
      color: theme.colors.onSurface,
    },
    formField: {
      marginBottom: spacing.s,
    },
    radioOption: {
      marginVertical: spacing.xs,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.m,
    },
    switchLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s,
    },
    switchText: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    submitContainer: {
      margin: spacing.m,
    },
    submitButton: {
      paddingVertical: spacing.s,
    },
    bottomSpacing: {
      height: spacing.xl,
    },
    modalContainer: {
      margin: spacing.l,
      padding: spacing.l,
      borderRadius: 16,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: spacing.m,
      color: theme.colors.onSurface,
      textAlign: 'center',
    },
    modalText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      marginBottom: spacing.s,
      textAlign: 'center',
    },
    modalPropertyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: spacing.m,
      textAlign: 'center',
    },
    modalDetails: {
      marginBottom: spacing.m,
    },
    modalDetailText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.xs,
    },
    modalWarning: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.l,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.m,
    },
    modalButton: {
      flex: 1,
    },
  });
} 