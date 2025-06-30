import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApi } from '@/hooks/useApi';
import { vouchersApi } from '@/lib/api';
import VoucherStatusBadge from '@/components/VoucherStatusBadge';
import VoucherTypeIcon from '@/components/VoucherTypeIcon';
import ModernHeader from '@/components/ModernHeader';

const VoucherDetailScreen: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // State management
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationNotes, setCancellationNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // API call to get voucher details
  const {
    data: voucher,
    loading,
    error,
    refetch,
  } = useApi(() => vouchersApi.getById(id as string), [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Voucher Details" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading voucher details...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !voucher) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Voucher Details" showBackButton />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
            Error Loading Voucher
          </Text>
          <Text style={[styles.errorMessage, { color: theme.colors.onSurfaceVariant }]}>
            {error?.message || 'Voucher not found'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={refetch}
          >
            <Text style={[styles.retryText, { color: theme.colors.onPrimary }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVoucherTypeLabel = () => {
    switch (voucher.voucher_type) {
      case 'receipt':
        return 'Receipt Voucher';
      case 'payment':
        return 'Payment Voucher';
      case 'journal':
        return 'Journal Entry';
      default:
        return 'Voucher';
    }
  };

  const handleActionWithLoading = async (action: string, actionFunction: () => Promise<void>) => {
    try {
      setActionLoading(action);
      await actionFunction();
      refetch(); // Refresh voucher data
    } catch (error) {
      console.error(`Error ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditVoucher = () => {
    const routeMap = {
      receipt: '/finance/vouchers/receipt',
      payment: '/finance/vouchers/payment',
      journal: '/finance/vouchers/entry',
    };
    
    router.push({
      pathname: routeMap[voucher.voucher_type as keyof typeof routeMap],
      params: { edit: voucher.id },
    });
  };

  const handleDuplicateVoucher = async () => {
    await handleActionWithLoading('duplicate', async () => {
      const result = await vouchersApi.duplicate(voucher.id);
      if (result.data) {
        Alert.alert('Success', 'Voucher duplicated successfully', [
          {
            text: 'View Original',
            style: 'cancel',
          },
          {
            text: 'View Copy',
            onPress: () => router.replace(`/finance/vouchers/${result.data.id}`),
          },
        ]);
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to duplicate voucher');
      }
    });
  };

  const handlePostVoucher = async () => {
    Alert.alert(
      'Post Voucher',
      'Are you sure you want to post this voucher? Posted vouchers cannot be edited.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post',
          style: 'default',
          onPress: () => handleActionWithLoading('post', async () => {
            const result = await vouchersApi.updateStatus(voucher.id, 'posted');
            if (result.data) {
              Alert.alert('Success', 'Voucher posted successfully');
            } else {
              Alert.alert('Error', result.error?.message || 'Failed to post voucher');
            }
          }),
        },
      ]
    );
  };

  const handleCancelVoucher = async () => {
    await handleActionWithLoading('cancel', async () => {
      const result = await vouchersApi.updateStatus(voucher.id, 'cancelled', cancellationNotes);
      if (result.data) {
        Alert.alert('Success', 'Voucher cancelled successfully');
        setShowCancelModal(false);
        setCancellationNotes('');
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to cancel voucher');
      }
    });
  };

  const handleDeleteVoucher = () => {
    Alert.alert(
      'Delete Voucher',
      'Are you sure you want to delete this voucher? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: () => handleActionWithLoading('delete', async () => {
            const result = await vouchersApi.delete(voucher.id);
            if (!result.error) {
              Alert.alert('Success', 'Voucher deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } else {
              Alert.alert('Error', result.error?.message || 'Failed to delete voucher');
            }
          }),
        },
      ]
    );
  };

  const getAvailableActions = () => {
    const actions = [];
    
    // Always available actions
    actions.push({
      key: 'duplicate',
      icon: 'content-copy',
      label: 'Duplicate',
      color: theme.colors.primary,
      onPress: handleDuplicateVoucher,
    });
    
    // Status-dependent actions
    if (voucher.status === 'draft') {
      actions.push({
        key: 'edit',
        icon: 'edit',
        label: 'Edit',
        color: theme.colors.primary,
        onPress: handleEditVoucher,
      });
      actions.push({
        key: 'post',
        icon: 'publish',
        label: 'Post',
        color: '#4CAF50',
        onPress: handlePostVoucher,
      });
      actions.push({
        key: 'delete',
        icon: 'delete',
        label: 'Delete',
        color: '#F44336',
        onPress: handleDeleteVoucher,
      });
    } else if (voucher.status === 'posted') {
      actions.push({
        key: 'cancel',
        icon: 'cancel',
        label: 'Cancel',
        color: '#FF9800',
        onPress: () => setShowCancelModal(true),
      });
    }
    
    return actions;
  };

  const renderDetailRow = (label: string, value: string | null | undefined, icon?: string) => {
    if (!value) return null;
    
    return (
      <View style={styles.detailRow}>
        <View style={styles.detailLabel}>
          {icon && (
            <MaterialIcons
              name={icon as keyof typeof MaterialIcons.glyphMap}
              size={18}
              color={theme.colors.onSurfaceVariant}
              style={styles.detailIcon}
            />
          )}
          <Text style={[styles.detailLabelText, { color: theme.colors.onSurfaceVariant }]}>
            {label}
          </Text>
        </View>
        <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
          {value}
        </Text>
      </View>
    );
  };

  const actions = getAvailableActions();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader title="Voucher Details" showBackButton />

      <ScrollView style={styles.content}>
        {/* Header Section */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.voucherHeader}>
            <View style={styles.voucherTitle}>
              <VoucherTypeIcon type={voucher.voucher_type} size={24} />
              <View style={styles.titleInfo}>
                <Text style={[styles.voucherTypeText, { color: theme.colors.onSurface }]}>
                  {getVoucherTypeLabel()}
                </Text>
                <Text style={[styles.voucherNumber, { color: theme.colors.primary }]}>
                  {voucher.voucher_number}
                </Text>
              </View>
            </View>
            <VoucherStatusBadge status={voucher.status} size="large" />
          </View>

          <View style={styles.amountSection}>
            <Text style={[styles.amountLabel, { color: theme.colors.onSurfaceVariant }]}>
              Amount
            </Text>
            <Text style={[styles.amountValue, { color: theme.colors.primary }]}>
              {formatAmount(voucher.amount, voucher.currency)}
            </Text>
          </View>

          {voucher.description && (
            <View style={styles.descriptionSection}>
              <Text style={[styles.descriptionLabel, { color: theme.colors.onSurfaceVariant }]}>
                Description
              </Text>
              <Text style={[styles.descriptionText, { color: theme.colors.onSurface }]}>
                {voucher.description}
              </Text>
            </View>
          )}
        </View>

        {/* Details Section */}
        <View style={[styles.detailsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Voucher Details
          </Text>

          {renderDetailRow('Created Date', formatDate(voucher.created_at), 'schedule')}
          {renderDetailRow('Updated Date', formatDate(voucher.updated_at), 'update')}
          {voucher.property && renderDetailRow(
            'Property',
            `${voucher.property.title}${voucher.property.property_code ? ` (${voucher.property.property_code})` : ''}`,
            'location-on'
          )}
          {voucher.tenant && renderDetailRow(
            'Tenant',
            `${voucher.tenant.first_name} ${voucher.tenant.last_name}`,
            'person'
          )}
          {voucher.account && renderDetailRow(
            'Account',
            `${voucher.account.account_code} - ${voucher.account.account_name}`,
            'account-balance'
          )}
          {voucher.cost_center && renderDetailRow(
            'Cost Center',
            `${voucher.cost_center.code} - ${voucher.cost_center.name}`,
            'business'
          )}
          {voucher.created_by_user && renderDetailRow(
            'Created By',
            `${voucher.created_by_user.first_name} ${voucher.created_by_user.last_name}`,
            'person-outline'
          )}
        </View>

        {/* Actions Section */}
        {actions.length > 0 && (
          <View style={[styles.actionsCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Actions
            </Text>
            <View style={styles.actionsGrid}>
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={[
                    styles.actionButton,
                    { 
                      backgroundColor: action.color + '10',
                      borderColor: action.color + '30',
                    }
                  ]}
                  onPress={action.onPress}
                  disabled={actionLoading === action.key}
                >
                  {actionLoading === action.key ? (
                    <ActivityIndicator size="small" color={action.color} />
                  ) : (
                    <MaterialIcons
                      name={action.icon as keyof typeof MaterialIcons.glyphMap}
                      size={24}
                      color={action.color}
                    />
                  )}
                  <Text style={[styles.actionButtonText, { color: action.color }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Cancel Voucher Modal */}
      <Modal visible={showCancelModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.cancelModal, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.outline }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Cancel Voucher
              </Text>
              <TouchableOpacity onPress={() => setShowCancelModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.cancelWarning, { color: theme.colors.onSurfaceVariant }]}>
                Are you sure you want to cancel this voucher? This action cannot be undone.
              </Text>

              <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                Cancellation Notes (Optional)
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.outline,
                    color: theme.colors.onSurface,
                  },
                ]}
                placeholder="Enter reason for cancellation..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={cancellationNotes}
                onChangeText={setCancellationNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={[styles.modalActions, { borderTopColor: theme.colors.outline }]}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.colors.outline }]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.onSurface }]}>
                  Keep Voucher
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: '#F44336' }]}
                onPress={handleCancelVoucher}
                disabled={actionLoading === 'cancel'}
              >
                {actionLoading === 'cancel' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                    Cancel Voucher
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  voucherTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  voucherTypeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  voucherNumber: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  amountSection: {
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  descriptionSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  descriptionLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 22,
  },
  detailsCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabelText: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  actionsCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  cancelWarning: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default VoucherDetailScreen; 