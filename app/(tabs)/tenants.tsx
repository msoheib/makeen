import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, Avatar, List } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import { Users, UserPlus, Phone, Mail } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';

export default function TenantsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<User[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    late: 0,
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    filterTenants();
  }, [tenants, searchQuery]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setTenants(data);
        
        // Calculate stats (mock data for now)
        setStats({
          total: data.length,
          active: Math.floor(data.length * 0.8),
          pending: Math.floor(data.length * 0.15),
          late: Math.floor(data.length * 0.05),
        });
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTenants = () => {
    let filtered = [...tenants];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tenant => 
        `${tenant.first_name} ${tenant.last_name}`.toLowerCase().includes(query) ||
        tenant.email.toLowerCase().includes(query)
      );
    }
    
    setFilteredTenants(filtered);
  };

  const renderTenant = ({ item }: { item: User }) => (
    <ModernCard style={styles.tenantCard}>
      <List.Item
        title={`${item.first_name} ${item.last_name}`}
        description={item.email}
        left={() => (
          <Avatar.Image
            size={48}
            source={{ 
              uri: item.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' 
            }}
          />
        )}
        right={() => (
          <View style={styles.tenantActions}>
            <View style={[styles.statusTag, { backgroundColor: theme.colors.successContainer }]}>
              <Text style={[styles.statusText, { color: theme.colors.success }]}>
                Active
              </Text>
            </View>
          </View>
        )}
        onPress={() => router.push(`/tenants/${item.id}`)}
        style={styles.listItem}
      />
    </ModernCard>
  );

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Tenants"
        subtitle="Manage your tenants"
        showLogo={true}
        variant="dark"
        onNotificationPress={() => router.push('/notifications')}
        onMenuPress={() => router.push('/menu')}
      />

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            {
              title: 'Total Tenants',
              value: stats.total.toString(),
              color: theme.colors.primary,
              icon: <Users size={20} color={theme.colors.primary} />,
            },
            {
              title: 'Active',
              value: stats.active.toString(),
              color: theme.colors.success,
              icon: <Users size={20} color={theme.colors.success} />,
            },
            {
              title: 'Pending',
              value: stats.pending.toString(),
              color: theme.colors.warning,
              icon: <Users size={20} color={theme.colors.warning} />,
            },
            {
              title: 'Late Payments',
              value: stats.late.toString(),
              color: theme.colors.error,
              icon: <Users size={20} color={theme.colors.error} />,
            },
          ]}
          renderItem={({ item }) => (
            <StatCard
              title={item.title}
              value={item.value}
              color={item.color}
              icon={item.icon}
            />
          )}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.statsContainer}
        />
      </View>

      {/* Search */}
      <View style={styles.filtersSection}>
        <Searchbar
          placeholder="Search tenants..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </View>

      {/* Tenants List */}
      <FlatList
        data={filteredTenants}
        renderItem={renderTenant}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ModernCard style={styles.emptyState}>
            <UserPlus size={48} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyStateTitle}>No tenants found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery 
                ? 'Try adjusting your search' 
                : 'Add your first tenant to get started'}
            </Text>
          </ModernCard>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsSection: {
    marginBottom: spacing.m,
  },
  statsContainer: {
    paddingHorizontal: spacing.m,
  },
  filtersSection: {
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  searchbar: {
    backgroundColor: theme.colors.surface,
  },
  listContent: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xxxl,
  },
  tenantCard: {
    marginBottom: spacing.m,
  },
  listItem: {
    paddingVertical: spacing.s,
  },
  tenantActions: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  statusTag: {
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});