import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import ModernHeader from '../../components/ModernHeader';

interface BidManagementProps {}

export default function BidManagement({}: BidManagementProps) {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [responseType, setResponseType] = useState<'accept' | 'reject'>('accept');
  const [responseMessage, setResponseMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Mock owner ID - in real app, get from auth context
  const ownerId = '1'; // Replace with actual owner ID from auth

  const { 
    data: bids, 
    loading, 
    error,
    refetch 
  } = useApi(() => api.bidding.getBidsOnMyProperties(ownerId), [ownerId]);

  const styles = getStyles(theme);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing bids:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBidResponse = (bid: any, response: 'accept' | 'reject') => {
    setSelectedBid(bid);
    setResponseType(response);
    setResponseMessage('');
    setResponseModalVisible(true);
  };

  const submitBidResponse = async () => {
    if (!selectedBid) return;

    setSubmitting(true);
    try {
      const result = await api.bidding.respondToBid(
        selectedBid.id,
        responseType,
        ownerId,
        responseMessage.trim() || undefined
      );

      if (result.success) {
        setResponseModalVisible(false);
        setSelectedBid(null);
        setResponseMessage('');
        await refetch();
        
        Alert.alert(
          'Success',
          `Bid ${responseType === 'accept' ? 'accepted' : 'rejected'} successfully`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          result.error || `Failed to ${responseType} bid`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error responding to bid:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'manager_approved': return theme.colors.primary;
      case 'owner_approved': return theme.colors.secondary;
      case 'owner_rejected': return theme.colors.error;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString('en-US');
  };

  const renderBidCard = (bid: any) => {
    const isExpired = new Date(bid.expires_at) < new Date();
    const canRespond = bid.bid_status === 'manager_approved' && !isExpired;
    
    return (
      <View key={bid.id} style={styles.bidCard}>
        <View style={styles.bidHeader}>
          <View style={styles.bidTitleContainer}>
            <Text style={styles.propertyTitle} numberOfLines={2}>
              {bid.property?.title || 'Property'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getBidStatusColor(bid.bid_status) }]}>
              <Text style={styles.statusText}>
                {bid.bid_status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.bidAmount}>
            {bid.bid_amount?.toLocaleString()} SAR
          </Text>
        </View>

        <View style={styles.bidDetails}>
          <View style={styles.bidderInfo}>
            <MaterialIcons name="person" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.bidderName}>
              {bid.bidder?.first_name} {bid.bidder?.last_name}
            </Text>
            {bid.bidder?.kyc_status === 'verified' && (
              <MaterialIcons name="verified" size={16} color={theme.colors.secondary} />
            )}
          </View>

          <View style={styles.bidTypeContainer}>
            <MaterialIcons 
              name={bid.bid_type === 'rental' ? 'home' : 'sell'} 
              size={16} 
              color={theme.colors.onSurfaceVariant} 
            />
            <Text style={styles.bidType}>
              {bid.bid_type === 'rental' ? 'Rental Bid' : 'Purchase Bid'}
            </Text>
          </View>
        </View>

        {bid.bid_type === 'rental' && (
          <View style={styles.rentalDetails}>
            <Text style={styles.rentalDetailText}>
              Duration: {bid.rental_duration_months} months
            </Text>
            {bid.security_deposit_amount && (
              <Text style={styles.rentalDetailText}>
                Security Deposit: {bid.security_deposit_amount.toLocaleString()} SAR
              </Text>
            )}
            {bid.utilities_included && (
              <Text style={styles.rentalDetailText}>
                Utilities included
              </Text>
            )}
          </View>
        )}

        {bid.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message:</Text>
            <Text style={styles.messageText}>{bid.message}</Text>
          </View>
        )}

        <View style={styles.bidFooter}>
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>
              Submitted {formatTimeAgo(bid.created_at)}
            </Text>
            <Text style={[
              styles.expiryText,
              isExpired && styles.expiredText
            ]}>
              {isExpired ? 'Expired' : `Expires ${formatTimeAgo(bid.expires_at)}`}
            </Text>
          </View>

          {canRespond && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleBidResponse(bid, 'reject')}
              >
                <MaterialIcons name="close" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleBidResponse(bid, 'accept')}
              >
                <MaterialIcons name="check" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {bid.owner_response_message && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseLabel}>Your Response:</Text>
            <Text style={styles.responseText}>{bid.owner_response_message}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderResponseModal = () => (
    <Modal
      visible={responseModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setResponseModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {responseType === 'accept' ? 'Accept Bid' : 'Reject Bid'}
            </Text>
            <TouchableOpacity 
              onPress={() => setResponseModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.bidSummary}>
              Property: {selectedBid?.property?.title}
            </Text>
            <Text style={styles.bidSummary}>
              Bidder: {selectedBid?.bidder?.first_name} {selectedBid?.bidder?.last_name}
            </Text>
            <Text style={styles.bidSummary}>
              Amount: {selectedBid?.bid_amount?.toLocaleString()} SAR
            </Text>

            <Text style={styles.messageInputLabel}>
              {responseType === 'accept' ? 'Acceptance Message (Optional)' : 'Rejection Reason (Optional)'}
            </Text>
            <TextInput
              style={styles.messageInput}
              value={responseMessage}
              onChangeText={setResponseMessage}
              placeholder={responseType === 'accept' 
                ? 'Add a message for the bidder...' 
                : 'Explain why you\'re rejecting this bid...'
              }
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setResponseModalVisible(false)}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modalButton, 
                responseType === 'accept' ? styles.acceptModalButton : styles.rejectModalButton
              ]}
              onPress={submitBidResponse}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {responseType === 'accept' ? 'Accept Bid' : 'Reject Bid'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ModernHeader title="Bid Management" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading bids...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ModernHeader title="Bid Management" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>Failed to load bids</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader title="Bid Management" />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {!bids || bids.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="gavel" size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyTitle}>No Bids Yet</Text>
            <Text style={styles.emptySubtitle}>
              When tenants or buyers place bids on your properties, they'll appear here
            </Text>
          </View>
        ) : (
          <View style={styles.bidsContainer}>
            <Text style={styles.resultsText}>
              {bids.length} {bids.length === 1 ? 'bid' : 'bids'} on your properties
            </Text>
            {bids.map(renderBidCard)}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {renderResponseModal()}
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  bidsContainer: {
    padding: 16,
  },
  resultsText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  bidCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bidTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  bidAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  bidDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bidderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bidderName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginLeft: 6,
    marginRight: 6,
  },
  bidTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidType: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  rentalDetails: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  rentalDetailText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  messageContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  bidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  expiryText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  expiredText: {
    color: theme.colors.error,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
  },
  acceptButton: {
    backgroundColor: theme.colors.secondary,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  responseContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  bidSummary: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  messageInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.background,
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  acceptModalButton: {
    backgroundColor: theme.colors.secondary,
  },
  rejectModalButton: {
    backgroundColor: theme.colors.error,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
}); 