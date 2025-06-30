import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import api from '@/lib/api';
import { spacing } from '@/lib/theme';
import { ModernHeader } from '@/components/ModernHeader';
import { StatCard } from '@/components/StatCard';
import { Search, Home, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';

export default function BuyerDashboard() {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  
  // Mock buyer ID - in real app, get from auth context
  const buyerId = 'buyer-id-placeholder';

  const { 
    data: dashboardData, 
    loading, 
    error,
    refetch 
  } = useApi(() => api.buyer.getDashboardData(buyerId), [buyerId]);

  const { 
    data: recentBids, 
    loading: bidsLoading,
    refetch: refetchBids 
  } = useApi(() => api.buyer.getMyBids(buyerId), [buyerId]);

  const styles = getStyles(theme);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchBids()]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return theme.colors.primary;
      case 'pending': return theme.colors.secondary;
      case 'rejected': return theme.colors.error;
      default: return theme.colors.outline;
    }
  };

  const getBidStatusIcon = (status: string) => {
    switch (status) {
      case 'owner_approved': return CheckCircle;
      case 'pending': 
      case 'manager_approved': return Clock;
      case 'rejected': 
      case 'expired': return XCircle;
      default: return AlertCircle;
    }
  };

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'owner_approved': return theme.colors.primary;
      case 'pending': 
      case 'manager_approved': return theme.colors.secondary;
      case 'rejected': 
      case 'expired': return theme.colors.error;
      default: return theme.colors.outline;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading buyer dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Error loading dashboard</Text>
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
        title="Buyer Dashboard" 
        subtitle="Manage your property search and bids"
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Approval Status */}
        <Surface style={styles.approvalCard} elevation={1}>
          <View style={styles.approvalHeader}>
            <Text style={styles.approvalTitle}>Account Status</Text>
            <Chip 
              icon="account-check" 
              style={[styles.statusChip, { backgroundColor: getApprovalStatusColor(dashboardData?.approvalStatus || 'pending') + '20' }]}
              textStyle={{ color: getApprovalStatusColor(dashboardData?.approvalStatus || 'pending') }}
            >
              {dashboardData?.approvalStatus?.toUpperCase() || 'PENDING'}
            </Chip>
          </View>
          
          {dashboardData?.approvalStatus === 'pending' && (
            <View style={styles.pendingNotice}>
              <AlertCircle size={16} color={theme.colors.secondary} />
              <Text style={styles.pendingText}>
                Your account is pending manager approval. You can browse properties but cannot submit bids yet.
              </Text>
            </View>
          )}
          
          {dashboardData?.approvalStatus === 'rejected' && (
            <View style={styles.rejectedNotice}>
              <XCircle size={16} color={theme.colors.error} />
              <Text style={styles.rejectedText}>
                Your account was rejected. Please contact support for more information.
              </Text>
            </View>
          )}
          
          {dashboardData?.approvalStatus === 'approved' && (
            <View style={styles.approvedNotice}>
              <CheckCircle size={16} color={theme.colors.primary} />
              <Text style={styles.approvedText}>
                Your account is approved! You can now browse properties and submit bids.
              </Text>
            </View>
          )}
        </Surface>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Bidding Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Bids"
              value={dashboardData?.totalBids?.toString() || '0'}
              subtitle="All time"
              icon={FileText}
              color={theme.colors.primary}
              loading={loading}
            />
            <StatCard
              title="Pending Bids"
              value={dashboardData?.pendingBids?.toString() || '0'}
              subtitle="Awaiting response"
              icon={Clock}
              color={theme.colors.secondary}
              loading={loading}
            />
            <StatCard
              title="Accepted Bids"
              value={dashboardData?.acceptedBids?.toString() || '0'}
              subtitle="Success rate"
              icon={CheckCircle}
              color={theme.colors.primary}
              loading={loading}
            />
            <StatCard
              title="Available Properties"
              value={dashboardData?.availableProperties?.toString() || '0'}
              subtitle="Ready for bidding"
              icon={Home}
              color={theme.colors.tertiary}
              loading={loading}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <Button
              mode="contained"
              onPress={() => router.push('/buyer/browse-properties')}
              style={styles.actionButton}
              icon={({ size, color }) => <Search size={size} color={color} />}
              disabled={!dashboardData?.canBid}
            >
              Browse Properties
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.push('/buyer/my-bids')}
              style={styles.actionButton}
              icon={({ size, color }) => <FileText size={size} color={color} />}
            >
              My Bids
            </Button>
          </View>
          
          {!dashboardData?.canBid && (
            <Text style={styles.disabledText}>
              Bidding actions will be available once your account is approved
            </Text>
          )}
        </View>

        {/* Recent Bids */}
        {recentBids && recentBids.length > 0 && (
          <View style={styles.recentBidsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bids</Text>
              <Button 
                mode="text" 
                onPress={() => router.push('/buyer/my-bids')}
                compact
              >
                View All
              </Button>
            </View>
            
            {recentBids.slice(0, 3).map((bid: any) => {
              const StatusIcon = getBidStatusIcon(bid.bid_status);
              const statusColor = getBidStatusColor(bid.bid_status);
              
              return (
                <Card key={bid.id} style={styles.bidCard}>
                  <Card.Content>
                    <View style={styles.bidHeader}>
                      <Text style={styles.bidPropertyTitle} numberOfLines={1}>
                        {bid.property?.title || 'Unknown Property'}
                      </Text>
                      <View style={styles.bidStatus}>
                        <StatusIcon size={16} color={statusColor} />
                        <Text style={[styles.bidStatusText, { color: statusColor }]}>
                          {bid.bid_status.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.bidDetails}>
                      <Text style={styles.bidAmount}>
                        {new Intl.NumberFormat('en-SA', {
                          style: 'currency',
                          currency: 'SAR'
                        }).format(bid.bid_amount)}
                      </Text>
                      <Text style={styles.bidDate}>
                        {new Date(bid.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <Text style={styles.bidAddress} numberOfLines={1}>
                      {bid.property?.address}, {bid.property?.city}
                    </Text>
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        )}

        {/* Market Insights */}
        <Card style={styles.insightsCard}>
          <Card.Content>
            <Text style={styles.insightsTitle}>Market Insights</Text>
            <Text style={styles.insightsText}>
              {dashboardData?.availableProperties || 0} properties are currently available for bidding.
              {dashboardData?.totalBids && dashboardData.totalBids > 0 && (
                ` Your success rate is ${Math.round((dashboardData.acceptedBids / dashboardData.totalBids) * 100)}%.`
              )}
            </Text>
            
            {dashboardData?.approvalStatus === 'approved' && dashboardData?.totalBids === 0 && (
              <Text style={styles.insightsSubtext}>
                Start browsing properties to submit your first bid!
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.m,
      paddingBottom: spacing.xl,
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
    approvalCard: {
      marginBottom: spacing.l,
      padding: spacing.l,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
    },
    approvalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.m,
    },
    approvalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    statusChip: {
      borderRadius: 16,
    },
    pendingNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.secondaryContainer,
      padding: spacing.m,
      borderRadius: 8,
    },
    pendingText: {
      flex: 1,
      marginLeft: spacing.s,
      color: theme.colors.onSecondaryContainer,
    },
    rejectedNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.errorContainer,
      padding: spacing.m,
      borderRadius: 8,
    },
    rejectedText: {
      flex: 1,
      marginLeft: spacing.s,
      color: theme.colors.onErrorContainer,
    },
    approvedNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryContainer,
      padding: spacing.m,
      borderRadius: 8,
    },
    approvedText: {
      flex: 1,
      marginLeft: spacing.s,
      color: theme.colors.onPrimaryContainer,
    },
    statsContainer: {
      marginBottom: spacing.l,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: spacing.m,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    actionsContainer: {
      marginBottom: spacing.l,
    },
    actionsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.s,
    },
    actionButton: {
      flex: 0.48,
    },
    disabledText: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: spacing.s,
    },
    recentBidsContainer: {
      marginBottom: spacing.l,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.m,
    },
    bidCard: {
      marginBottom: spacing.s,
      borderRadius: 8,
    },
    bidHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.s,
    },
    bidPropertyTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginRight: spacing.s,
    },
    bidStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bidStatusText: {
      fontSize: 12,
      fontWeight: '500',
      marginLeft: spacing.xs,
    },
    bidDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    bidAmount: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    bidDate: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    bidAddress: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    insightsCard: {
      borderRadius: 12,
    },
    insightsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing.s,
    },
    insightsText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
      marginBottom: spacing.s,
    },
    insightsSubtext: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },
  });
} 