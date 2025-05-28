import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, Appbar, Surface, Avatar, List, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing, shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';

export default function TenantsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant');

      if (error) throw error;
      if (data) setTenants(data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(tenant => 
    `${tenant.first_name} ${tenant.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTenant = ({ item }: { item: User }) => (
    <Surface style={[styles.tenantCard, shadows.small]}>
      <List.Item
        title={`${item.first_name} ${item.last_name}`}
        description={item.email}
        left={props => (
          <Avatar.Image
            {...props}
            size={40}
            source={{ uri: item.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' }}
          />
        )}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push(`/tenants/${item.id}`)}
      />
    </Surface>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Tenants" />
      </Appbar.Header>

      <Searchbar
        placeholder="Search tenants..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredTenants}
        renderItem={renderTenant}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Surface style={[styles.emptyState, shadows.medium]}>
            <Text style={styles.emptyStateText}>
              {loading ? 'Loading tenants...' : 'No tenants found'}
            </Text>
          </Surface>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/tenants/add')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchbar: {
    margin: spacing.m,
    elevation: 0,
  },
  listContent: {
    padding: spacing.m,
  },
  tenantCard: {
    marginBottom: spacing.m,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyState: {
    padding: spacing.xl,
    margin: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  emptyStateText: {
    color: theme.colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    margin: spacing.m,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});