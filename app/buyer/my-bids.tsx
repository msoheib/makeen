import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Menu, Divider, Modal, Portal, TextInput, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import api from '@/lib/api';
import { spacing } from '@/lib/theme';
import { ModernHeader } from '@/components/ModernHeader';
import { Clock, CheckCircle, XCircle, AlertCircle, MapPin, DollarSign, Calendar, Eye, Trash2, Filter } from 'lucide-react-native';

export default function MyBids() {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // Mock buyer ID - in real app, get from auth context
  const buyerId = 'buyer-id-placeholder';

  const { 
    data: bids, 
    loading, 
    error,
    refetch 
  } = useApi(() => api.buyer.getMyBids(buyerId), [buyerId]);

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

  const getBidStatusIcon = (status: string) => {
    switch (status) {
      case 'owner_approved': return CheckCircle;
      case 'pending': 
      case 'manager_approved': return Clock;
      case 'rejected': 
      case 'expired': 
      case 'withdrawn': return XCircle;
      default: return AlertCircle;
    }
  };

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'owner_approved': return theme.colors.primary;
      case 'pending': 
      case 'manager_approved': return theme.colors.secondary;
      case 'rejected': 
      case 'expired': 
      case 'withdrawn': return theme.colors.error;
      default: return theme.colors.outline;
    }
  };

  const getBidStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'PENDING REVIEW';
      case 'manager_approved': return 'MANAGER APPROVED';
      case 'owner_approved': return 'ACCEPTED';
      case 'rejected': return 'REJECTED';
      case 'expired': return 'EXPIRED';
      case 'withdrawn': return 'WITHDRAWN';
      default: return status.toUpperCase();
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const canWithdraw = (bid: any) => {
    return bid.bid_status === 'pending' && !isExpired(bid.expires_at);
  };

  const handleWithdrawBid = async () => {
    if (!selectedBid) return;
    
    setWithdrawing(true);
    try {
      const result = await api.buyer.withdrawBid(selectedBid.id, buyerId);
      if (result.success) {
        await refetch();
        setWithdrawModalVisible(false);
        setSelectedBid(null);
      } else {
        // Handle error
        console.error('Failed to withdraw bid:', result.error);
      }
    } catch (error) {
      console.error('Error withdrawing bid:', error);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleViewProperty = (bid: any) => {
    router.push({
      pathname: '/buyer/property-details',
      params: {
        propertyId: bid.property_id,
        mode: 'browse'
      }
    });
  };

  const filterBidsByStatus = (bids: any[]) => {
    if (statusFilter === 'all') return bids;
    return bids.filter(bid => bid.bid_status === statusFilter);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m left`;
    } else {
      return `${diffMinutes}m left`;
    }
  };

  const filteredBids = bids ? filterBidsByStatus(bids) : [];

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your bids...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Error loading bids</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <Button mode="contained" onPress={refetch} style={styles.retryButton}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="My Bids" 
        subtitle="Track your property bid status"
      />
      
      <View style={styles.headerControls}>
        <Text style={styles.resultsCount}>
          {filteredBids.length} of {bids?.length || 0} bids
        </Text>
        
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setFilterMenuVisible(true)}
              icon={({ size, color }) => <Filter size={size} color={color} />}
              compact
            >
              Filter
            </Button>
          }
        >
          <Menu.Item 
            title="All Bids" 
            onPress={() => { setStatusFilter('all'); setFilterMenuVisible(false); }}
            leadingIcon="format-list-bulleted"
          />
          <Divider />
          <Menu.Item 
            title="Pending" 
            onPress={() => { setStatusFilter('pending'); setFilterMenuVisible(false); }}
            leadingIcon="clock-outline"
          />
          <Menu.Item 
            title="Manager Approved" 
            onPress={() => { setStatusFilter('manager_approved'); setFilterMenuVisible(false); }}
            leadingIcon="account-check"
          />
          <Menu.Item 
            title="Accepted" 
            onPress={() => { setStatusFilter('owner_approved'); setFilterMenuVisible(false); }}
            leadingIcon="check-circle"
          />
          <Menu.Item 
            title="Rejected" 
            onPress={() => { setStatusFilter('rejected'); setFilterMenuVisible(false); }}
            leadingIcon="close-circle"
          />
          <Menu.Item 
            title="Expired" 
            onPress={() => { setStatusFilter('expired'); setFilterMenuVisible(false); }}
            leadingIcon="clock-alert"
          />
        </Menu>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredBids.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign size={64} color={theme.colors.outline} />
            <Text style={styles.emptyTitle}>
              {statusFilter === 'all' ? 'No Bids Yet' : `No ${getBidStatusText(statusFilter)} Bids`}
            </Text>
            <Text style={styles.emptySubtext}>
              {statusFilter === 'all' 
                ? 'Start browsing properties to submit your first bid'
                : 'Try changing the filter to see other bids'
              }
            </Text>
            {statusFilter === 'all' && (
              <Button 
                mode="contained" 
                onPress={() => router.push('/buyer/browse-properties')}
                style={styles.browseButton}
              >
                Browse Properties
              </Button>
            )}
          </View>
        ) : (
          filteredBids.map((bid: any) => {
            const StatusIcon = getBidStatusIcon(bid.bid_status);
            const statusColor = getBidStatusColor(bid.bid_status);
            const expired = isExpired(bid.expires_at);
            const withdrawable = canWithdraw(bid);
            
            return (
              <Card key={bid.id} style={styles.bidCard}>
                <View style={styles.bidHeader}>
                  {bid.property?.images && bid.property.images.length > 0 ? (
                    <Image
                      source={{ uri: bid.property.images[0] }}
                      style={styles.propertyImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <MapPin size={24} color={theme.colors.outline} />
                    </View>
                  )}
                  
                  <View style={styles.bidBadges}>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
                      textStyle={{ color: statusColor, fontSize: 10, fontWeight: '600' }}
                      icon={({ size, color }) => <StatusIcon size={size} color={color} />}
                    >
                      {getBidStatusText(bid.bid_status)}
                    </Chip>
                    
                    <Chip
                      style={[styles.typeChip, { backgroundColor: theme.colors.primaryContainer }]}
                      textStyle={{ color: theme.colors.onPrimaryContainer, fontSize: 10 }}
                    >
                      {bid.bid_type === 'purchase' ? 'PURCHASE' : 'RENTAL'}
                    </Chip>
                  </View>
                </View>
                
                <Card.Content>
                  <Text style={styles.propertyTitle} numberOfLines={2}>
                    {bid.property?.title || 'Unknown Property'}
                  </Text>
                  
                  <Text style={styles.propertyAddress} numberOfLines={1}>
                    <MapPin size={14} color={theme.colors.primary} />
                    {' '}{bid.property?.address}, {bid.property?.city}
                  </Text>
                  
                  <View style={styles.bidDetails}>
                    <View style={styles.bidAmount}>
                      <Text style={styles.amountLabel}>Your Bid</Text>
                      <Text style={styles.amountValue}>
                        {new Intl.NumberFormat('en-SA', {
                          style: 'currency',
                          currency: 'SAR',
                          minimumFractionDigits: 0
                        }).format(bid.bid_amount)}
                      </Text>
                    </View>
                    
                    <View style={styles.bidTiming}>
                      <Text style={styles.timingLabel}>
                        <Calendar size={12} color={theme.colors.onSurfaceVariant} />
                        {' '}Submitted
                      </Text>
                      <Text style={styles.timingValue}>
                        {new Date(bid.created_at).toLocaleDateString('en-US')}
                      </Text>
                    </View>
                  </View>
                  
                  {bid.bid_status === 'pending' && !expired && (
                    <View style={styles.expiryInfo}>
                      <Clock size={14} color={theme.colors.secondary} />
                      <Text style={[styles.expiryText, { color: theme.colors.secondary }]}>
                        {getTimeRemaining(bid.expires_at)}
                      </Text>
                    </View>
                  )}
                  
                  {expired && bid.bid_status === 'pending' && (
                    <View style={styles.expiredInfo}>
                      <AlertCircle size={14} color={theme.colors.error} />
                      <Text style={[styles.expiredText, { color: theme.colors.error }]}>
                        Bid expired
                      </Text>
                    </View>
                  )}
                  
                  {bid.message && (
                    <View style={styles.messageContainer}>
                      <Text style={styles.messageLabel}>Your Message:</Text>
                      <Text style={styles.messageText} numberOfLines={2}>
                        {bid.message}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.bidActions}>
                    <Button
                      mode="outlined"
                      onPress={() => handleViewProperty(bid)}
                      style={styles.actionButton}
                      icon={({ size, color }) => <Eye size={size} color={color} />}
                    >
                      View Property
                    </Button>
                    
                    {withdrawable && (
                      <Button
                        mode="text"
                        onPress={() => {
                          setSelectedBid(bid);
                          setWithdrawModalVisible(true);
                        }}
                        style={styles.withdrawButton}
                        textColor={theme.colors.error}
                        icon={({ size, color }) => <Trash2 size={size} color={color} />}
                      >
                        Withdraw
                      </Button>
                    )}
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Withdraw Bid Modal */}
      <Portal>
        <Modal
          visible={withdrawModalVisible}
          onDismiss={() => setWithdrawModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <Text style={styles.modalTitle}>Withdraw Bid</Text>
            <Text style={styles.modalText}>
              Are you sure you want to withdraw your bid for "{selectedBid?.property?.title}"?
            </Text>
            <Text style={styles.modalSubtext}>
              Bid Amount: {selectedBid && new Intl.NumberFormat('en-SA', {
                style: 'currency',
                currency: 'SAR',
                minimumFractionDigits: 0
              }).format(selectedBid.bid_amount)}
            </Text>
            
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setWithdrawModalVisible(false)}
                style={styles.modalButton}
                disabled={withdrawing}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleWithdrawBid}
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                loading={withdrawing}
                disabled={withdrawing}
              >
                Withdraw Bid
              </Button>
            </View>
          </Surface>
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
    loadingText: {
      marginTop: spacing.m,
      color: theme.colors.onSurface,
    },
    errorText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.error,
      marginBottom: spacing.s,
    },
    errorSubtext: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing.l,
    },
    retryButton: {
      marginTop: spacing.m,
    },
    headerControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.m,
    },
    resultsCount: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.m,
      paddingTop: 0,
    },
    emptyState: {
      alignItems: 'center',
      padding: spacing.xl,
      marginTop: spacing.xl,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: spacing.m,
      marginBottom: spacing.s,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing.l,
    },
    browseButton: {
      marginTop: spacing.s,
    },
    bidCard: {
      marginBottom: spacing.m,
      borderRadius: 12,
      overflow: 'hidden',
    },
    bidHeader: {
      position: 'relative',
    },
    propertyImage: {
      width: '100%',
      height: 120,
    },
    placeholderImage: {
      width: '100%',
      height: 120,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bidBadges: {
      position: 'absolute',
      top: spacing.s,
      right: spacing.s,
      gap: spacing.xs,
    },
    statusChip: {
      alignSelf: 'flex-end',
    },
    typeChip: {
      alignSelf: 'flex-end',
    },
    propertyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: spacing.s,
    },
    propertyAddress: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.m,
      flexDirection: 'row',
      alignItems: 'center',
    },
    bidDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.m,
    },
    bidAmount: {
      flex: 1,
    },
    amountLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.xs,
    },
    amountValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    bidTiming: {
      flex: 1,
      alignItems: 'flex-end',
    },
    timingLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
    },
    timingValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    expiryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.m,
      gap: spacing.xs,
    },
    expiryText: {
      fontSize: 14,
      fontWeight: '500',
    },
    expiredInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.m,
      gap: spacing.xs,
    },
    expiredText: {
      fontSize: 14,
      fontWeight: '500',
    },
    messageContainer: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: spacing.m,
      borderRadius: 8,
      marginBottom: spacing.m,
    },
    messageLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.xs,
    },
    messageText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      lineHeight: 20,
    },
    bidActions: {
      flexDirection: 'row',
      gap: spacing.s,
    },
    actionButton: {
      flex: 1,
    },
    withdrawButton: {
      flex: 1,
    },
    modalContainer: {
      margin: spacing.l,
    },
    modalContent: {
      padding: spacing.l,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: spacing.m,
    },
    modalText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      marginBottom: spacing.s,
      lineHeight: 24,
    },
    modalSubtext: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.l,
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