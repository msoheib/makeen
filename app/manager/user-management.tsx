import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, Chip, Avatar, IconButton, Searchbar, Menu, FAB, Portal, Modal, TextInput, SegmentedButtons, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { useTranslation } from '@/lib/useTranslation';
import api from '@/lib/api';
import { UserRole, UserStatus, UserManagementFilters } from '@/lib/types';
import { User, MoreVertical, UserPlus, Filter, Trash2, UserX, UserCheck, Eye, Mail, Phone, Calendar, Shield } from 'lucide-react-native';

interface ExtendedUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  rejected_reason?: string;
  profile_type?: string;
}

export default function UserManagementScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation('common');
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<UserManagementFilters>({});
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [bulkActionVisible, setBulkActionVisible] = useState(false);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'owner', label: 'Property Owner' },
    { value: 'tenant', label: 'Tenant' },
    { value: 'buyer', label: 'Buyer' },
    { value: 'staff', label: 'Staff' },
  ];

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.userApprovals.getAllUsers({
        ...filters,
        search: searchQuery
      });
      
      if (response.error) {
        Alert.alert('Error', response.error.message);
        return;
      }

      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleSearch = () => {
    loadUsers();
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone and will remove all associated data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(userId);
              const response = await api.userApprovals.deleteUser(userId);
              
              if (response.error) {
                Alert.alert('Error', response.error.message);
                return;
              }

              Alert.alert('Success', `${userName} has been deleted successfully`);
              await loadUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleApproveUser = async (userId: string, userName: string) => {
    try {
      setActionLoading(userId);
      const response = await api.userApprovals.approveUser(userId);
      
      if (response.error) {
        Alert.alert('Error', response.error.message);
        return;
      }

      Alert.alert('Success', `${userName} has been approved`);
      await loadUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      Alert.alert('Error', 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
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
          await loadUsers();
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

  const handleBulkAction = (action: string) => {
    if (selectedUsers.size === 0) {
      Alert.alert('No Selection', 'Please select users first');
      return;
    }

    const userCount = selectedUsers.size;
    const actionText = action === 'delete' ? 'delete' : action;
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Users`,
      `Are you sure you want to ${actionText} ${userCount} selected user(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: async () => {
            // Implement bulk actions here
            setBulkActionVisible(false);
            setSelectedUsers(new Set());
          }
        }
      ]
    );
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
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

  const getStatusColor = (status: UserStatus): string => {
    const statusColors = {
      pending: theme.colors.secondary,
      approved: theme.colors.primary,
      rejected: theme.colors.error,
      inactive: theme.colors.outline
    };
    return statusColors[status] || theme.colors.onSurfaceVariant;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredUsers = users.filter(user => {
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
  statsContainer: {
    marginBottom: spacing.m,
  },
  statCard: {
    marginRight: spacing.s,
    minWidth: 100,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  bulkActionCard: {
    backgroundColor: theme.colors.primaryContainer,
    marginBottom: spacing.m,
  },
  bulkActionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
  bulkActionText: {
    color: theme.colors.onPrimaryContainer,
    fontWeight: '500',
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
  selectedCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
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
    gap: spacing.s,
  },
  roleChip: {
    height: 28,
  },
  statusChip: {
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
    gap: spacing.xs,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  metadataText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    padding: spacing.l,
    margin: spacing.l,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.l,
  },
  modalSubtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.l,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: spacing.s,
    marginTop: spacing.m,
  },
  segmentedButtons: {
    marginBottom: spacing.m,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.m,
    marginTop: spacing.l,
  },
  bulkActionButton: {
    marginBottom: spacing.m,
  },
  fab: {
    position: 'absolute',
    margin: spacing.l,
    right: 0,
    bottom: 0,
  },
});

  return (
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      getRoleDisplayName(user.role).toLowerCase().includes(query)
    );
  });

  const getStatusCounts = () => {
    return {
      total: users.length,
      pending: users.filter(u => u.status === 'pending').length,
      approved: users.filter(u => u.status === 'approved').length,
      rejected: users.filter(u => u.status === 'rejected').length,
      inactive: users.filter(u => u.status === 'inactive').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="User Management"
        showBack
        onBack={() => router.back()}
        actions={[
          {
            icon: Filter,
            onPress: () => setFiltersVisible(true),
          }
        ]}
      />

      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.description}>
            Manage all system users, their roles, and access permissions.
          </Text>
          
          <Searchbar
            placeholder="Search users..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            onSubmitEditing={handleSearch}
            style={styles.searchBar}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <User size={24} color={theme.colors.primary} />
                <Text style={styles.statNumber}>{statusCounts.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <UserCheck size={24} color={theme.colors.primary} />
                <Text style={styles.statNumber}>{statusCounts.approved}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <UserX size={24} color={theme.colors.secondary} />
                <Text style={styles.statNumber}>{statusCounts.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Shield size={24} color={theme.colors.error} />
                <Text style={styles.statNumber}>{statusCounts.rejected}</Text>
                <Text style={styles.statLabel}>Rejected</Text>
              </Card.Content>
            </Card>
          </ScrollView>

          {selectedUsers.size > 0 && (
            <Card style={styles.bulkActionCard}>
              <Card.Content style={styles.bulkActionContent}>
                <Text style={styles.bulkActionText}>
                  {selectedUsers.size} user(s) selected
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setBulkActionVisible(true)}
                  compact
                >
                  Actions
                </Button>
              </Card.Content>
            </Card>
          )}
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
              <Text>Loading users...</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <ModernCard style={styles.emptyState}>
              <View style={styles.emptyStateContent}>
                <User size={48} color={theme.colors.outline} />
                <Text style={styles.emptyStateTitle}>No Users Found</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'No users match your search criteria.' : 'No users have been registered yet.'}
                </Text>
              </View>
            </ModernCard>
          ) : (
            <View style={styles.usersList}>
              {filteredUsers.map((user) => (
                <ModernCard 
                  key={user.id} 
                  style={[
                    styles.userCard, 
                    selectedUsers.has(user.id) && styles.selectedCard
                  ]}
                  onPress={() => toggleUserSelection(user.id)}
                >
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
                          <Chip 
                            mode="outlined" 
                            compact 
                            style={[styles.statusChip, { borderColor: getStatusColor(user.status) }]}
                            textStyle={{ color: getStatusColor(user.status) }}
                          >
                            {user.status.toUpperCase()}
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
                        leadingIcon={() => <Eye size={16} color={theme.colors.onSurface} />}
                        onPress={() => {
                          setMenuVisible(null);
                          if (user.role === 'tenant') {
                            router.push(`/tenants/${user.id}`);
                          } else {
                            // Navigate to general user details (could be implemented later)
                            Alert.alert('Info', 'Detailed view available for tenants only');
                          }
                        }}
                        title="View Details"
                      />
                      
                      {user.status === 'pending' && (
                        <>
                          <Menu.Item
                            leadingIcon={() => <UserCheck size={16} color={theme.colors.primary} />}
                            onPress={() => {
                              setMenuVisible(null);
                              handleApproveUser(user.id, `${user.first_name} ${user.last_name}`);
                            }}
                            title="Approve"
                          />
                          <Menu.Item
                            leadingIcon={() => <UserX size={16} color={theme.colors.error} />}
                            onPress={() => {
                              setMenuVisible(null);
                              handleRejectUser(user.id, `${user.first_name} ${user.last_name}`);
                            }}
                            title="Reject"
                          />
                        </>
                      )}
                      
                      <Menu.Item
                        leadingIcon={() => <Mail size={16} color={theme.colors.onSurface} />}
                        onPress={() => {
                          setMenuVisible(null);
                          // Open email app
                        }}
                        title="Contact"
                      />
                      
                      <Divider />
                      
                      <Menu.Item
                        leadingIcon={() => <Trash2 size={16} color={theme.colors.error} />}
                        onPress={() => {
                          setMenuVisible(null);
                          handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`);
                        }}
                        title="Delete"
                        titleStyle={{ color: theme.colors.error }}
                      />
                    </Menu>
                  </View>

                  {user.phone && (
                    <View style={styles.userContact}>
                      <Phone size={16} color={theme.colors.onSurfaceVariant} />
                      <Text style={styles.contactText}>{user.phone}</Text>
                    </View>
                  )}

                  <View style={styles.userMetadata}>
                    <View style={styles.metadataRow}>
                      <Calendar size={14} color={theme.colors.onSurfaceVariant} />
                      <Text style={styles.metadataText}>
                        Registered: {formatDate(user.created_at)}
                      </Text>
                    </View>
                    {user.approved_at && (
                      <View style={styles.metadataRow}>
                        <UserCheck size={14} color={theme.colors.primary} />
                        <Text style={styles.metadataText}>
                          Approved: {formatDate(user.approved_at)}
                        </Text>
                      </View>
                    )}
                    {user.rejected_reason && (
                      <View style={styles.metadataRow}>
                        <UserX size={14} color={theme.colors.error} />
                        <Text style={[styles.metadataText, { color: theme.colors.error }]}>
                          Reason: {user.rejected_reason}
                        </Text>
                      </View>
                    )}
                  </View>
                </ModernCard>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Filters Modal */}
      <Portal>
        <Modal 
          visible={filtersVisible} 
          onDismiss={() => setFiltersVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Filter Users</Text>
          
          <Text style={styles.filterLabel}>Status</Text>
          <SegmentedButtons
            value={filters.status || ''}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as UserStatus }))}
            buttons={statusOptions}
            style={styles.segmentedButtons}
          />
          
          <Text style={styles.filterLabel}>Role</Text>
          <SegmentedButtons
            value={filters.role || ''}
            onValueChange={(value) => setFilters(prev => ({ ...prev, role: value as UserRole }))}
            buttons={roleOptions}
            style={styles.segmentedButtons}
          />
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setFilters({});
                setFiltersVisible(false);
              }}
            >
              Clear
            </Button>
            <Button
              mode="contained"
              onPress={() => setFiltersVisible(false)}
            >
              Apply
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Bulk Actions Modal */}
      <Portal>
        <Modal 
          visible={bulkActionVisible} 
          onDismiss={() => setBulkActionVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Bulk Actions</Text>
          <Text style={styles.modalSubtitle}>
            {selectedUsers.size} user(s) selected
          </Text>
          
          <Button
            mode="outlined"
            onPress={() => handleBulkAction('approve')}
            style={styles.bulkActionButton}
            icon={() => <UserCheck size={16} color={theme.colors.primary} />}
          >
            Approve Selected
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => handleBulkAction('reject')}
            style={styles.bulkActionButton}
            icon={() => <UserX size={16} color={theme.colors.error} />}
          >
            Reject Selected
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => handleBulkAction('delete')}
            style={[styles.bulkActionButton, { borderColor: theme.colors.error }]}
            textColor={theme.colors.error}
            icon={() => <Trash2 size={16} color={theme.colors.error} />}
          >
            Delete Selected
          </Button>
          
          <Button
            mode="text"
            onPress={() => setBulkActionVisible(false)}
            style={styles.bulkActionButton}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>

      <FAB
        icon={() => <UserPlus size={24} color={theme.colors.onPrimary} />}
        style={styles.fab}
        onPress={() => router.push('/people/add')}
      />
    </View>
  );
}

