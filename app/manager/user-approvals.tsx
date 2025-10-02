import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, Chip, Avatar, IconButton, Searchbar, Menu, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { useTranslation } from '@/lib/useTranslation';
import api from '@/lib/api';
import { PendingUser, UserRole } from '@/lib/types';
import { User, Clock, CheckCircle, XCircle, Mail, Phone, MoreVertical } from 'lucide-react-native';

export default function UserApprovalsScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation('common');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await api.userApprovals.getPendingUsers();
      
      if (response.error) {
        Alert.alert('Error', response.error.message);
        return;
      }

      setPendingUsers(response.data || []);
    } catch (error) {
      console.error('Error loading pending users:', error);
      Alert.alert('Error', 'Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingUsers();
    setRefreshing(false);
  };

  const handleApproveUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Approve User',
      `Are you sure you want to approve ${userName}? They will gain access to the system immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setActionLoading(userId);
              const response = await api.userApprovals.approveUser(userId);
              
              if (response.error) {
                Alert.alert('Error', response.error.message);
                return;
              }

              Alert.alert('Success', `${userName} has been approved successfully`);
              await loadPendingUsers();
            } catch (error) {
              console.error('Error approving user:', error);
              Alert.alert('Error', 'Failed to approve user');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleRejectUser = (userId: string, userName: string) => {
    Alert.prompt(
      'Reject User',
      `Please provide a reason for rejecting ${userName}:`,
      async (reason) => {
        if (!reason || reason.trim().length === 0) {
          Alert.alert('Error', 'Please provide a reason for rejection');
          return;
        }

        try {
          setActionLoading(userId);
          const response = await api.userApprovals.rejectUser(userId, reason.trim());
          
          if (response.error) {
            Alert.alert('Error', response.error.message);
            return;
          }

          Alert.alert('Success', `${userName} has been rejected`);
          await loadPendingUsers();
        } catch (error) {
          console.error('Error rejecting user:', error);
          Alert.alert('Error', 'Failed to reject user');
        } finally {
          setActionLoading(null);
        }
      },
      'plain-text',
      '',
      'default'
    );
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const roleNames = {
      admin: 'Administrator',
      manager: 'Property Manager',
      owner: 'Property Owner',
      tenant: 'Tenant',
      buyer: 'Buyer',
      staff: 'Staff Member'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: UserRole): string => {
    const roleColors = {
      admin: theme.colors.error,
      manager: theme.colors.primary,
      owner: theme.colors.secondary,
      tenant: theme.colors.tertiary,
      buyer: theme.colors.outline,
      staff: theme.colors.onSurfaceVariant
    };
    return roleColors[role] || theme.colors.onSurfaceVariant;
  };

  const filteredUsers = pendingUsers.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
      const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.m,
  },
  headerSection: {
    marginBottom: spacing.l,
  },
  description: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.m,
    lineHeight: 24,
  },
  searchBar: {
    marginBottom: spacing.m,
    backgroundColor: theme.colors.surface,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.m,
  },
  statCard: {
    flex: 1,
    marginRight: spacing.s,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyState: {
    marginTop: spacing.xl,
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
  usersList: {
    gap: spacing.m,
  },
  userCard: {
    overflow: 'hidden',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  userDetails: {
    flex: 1,
    marginLeft: spacing.m,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.s,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleChip: {
    height: 28,
  },
  userContact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  contactText: {
    marginLeft: spacing.s,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  userMetadata: {
    marginBottom: spacing.m,
  },
  metadataText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  divider: {
    marginVertical: spacing.m,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  actionButton: {
    flex: 1,
  },
  rejectButton: {
    borderColor: theme.colors.error,
  },
});

  return (
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      getRoleDisplayName(user.role).toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="User Approvals"
        showBack
        onBack={() => router.back()}
      />

      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.description}>
            Review and approve pending user registrations. Property owners require approval before they can access the system.
          </Text>
          
          <Searchbar
            placeholder="Search users..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Clock size={24} color={theme.colors.primary} />
                <Text style={styles.statNumber}>{pendingUsers.length}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading pending users...</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <ModernCard style={styles.emptyState}>
              <View style={styles.emptyStateContent}>
                <CheckCircle size={48} color={theme.colors.outline} />
                <Text style={styles.emptyStateTitle}>No Pending Users</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'No users match your search criteria.' : 'All users have been processed.'}
                </Text>
              </View>
            </ModernCard>
          ) : (
            <View style={styles.usersList}>
              {filteredUsers.map((user) => (
                <ModernCard key={user.id} style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <View style={styles.userInfo}>
                      <Avatar.Text 
                        size={48} 
                        label={`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`}
                        style={{ backgroundColor: getRoleColor(user.role) }}
                      />
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>
                          {user.first_name} {user.last_name}
                        </Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        <View style={styles.userMeta}>
                          <Chip 
                            mode="outlined" 
                            compact 
                            style={[styles.roleChip, { borderColor: getRoleColor(user.role) }]}
                            textStyle={{ color: getRoleColor(user.role) }}
                          >
                            {getRoleDisplayName(user.role)}
                          </Chip>
                        </View>
                      </View>
                    </View>

                    <Menu
                      visible={menuVisible === user.id}
                      onDismiss={() => setMenuVisible(null)}
                      anchor={
                        <IconButton
                          icon={() => <MoreVertical size={20} color={theme.colors.onSurface} />}
                          onPress={() => setMenuVisible(user.id)}
                        />
                      }
                    >
                      <Menu.Item
                        leadingIcon={() => <Mail size={16} color={theme.colors.onSurface} />}
                        onPress={() => {
                          setMenuVisible(null);
                          // Open email app or show contact info
                        }}
                        title="Contact User"
                      />
                      
                      {user.role === 'tenant' && (
                        <Menu.Item
                          leadingIcon={() => <User size={16} color={theme.colors.onSurface} />}
                          onPress={() => {
                            setMenuVisible(null);
                            router.push(`/tenants/${user.id}`);
                          }}
                          title="View Tenant Profile"
                        />
                      )}
                    </Menu>
                  </View>

                  {user.phone && (
                    <View style={styles.userContact}>
                      <Phone size={16} color={theme.colors.onSurfaceVariant} />
                      <Text style={styles.contactText}>{user.phone}</Text>
                    </View>
                  )}

                  <View style={styles.userMetadata}>
                    <Text style={styles.metadataText}>
                      Registered: {formatDate(user.created_at)}
                    </Text>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.actionButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => handleRejectUser(user.id, `${user.first_name} ${user.last_name}`)}
                      loading={actionLoading === user.id}
                      disabled={actionLoading !== null}
                      style={[styles.actionButton, styles.rejectButton]}
                      textColor={theme.colors.error}
                      icon={() => <XCircle size={16} color={theme.colors.error} />}
                    >
                      Reject
                    </Button>
                    
                    <Button
                      mode="contained"
                      onPress={() => handleApproveUser(user.id, `${user.first_name} ${user.last_name}`)}
                      loading={actionLoading === user.id}
                      disabled={actionLoading !== null}
                      style={styles.actionButton}
                      icon={() => <CheckCircle size={16} color={theme.colors.onPrimary} />}
                    >
                      Approve
                    </Button>
                  </View>
                </ModernCard>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

