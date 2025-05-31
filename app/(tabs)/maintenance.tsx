import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, Appbar, Surface, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing, shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { MaintenanceRequest } from '@/lib/types';
import MaintenanceRequestCard from '@/components/MaintenanceRequestCard';

export default function MaintenanceScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMaintenanceRequests();
  }, []);

  const fetchMaintenanceRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          property:properties(title),
          tenant:profiles(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setRequests(data);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => 
    request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Maintenance" />
      </Appbar.Header>

      <Searchbar
        placeholder="Search requests..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredRequests}
        renderItem={({ item }) => (
          <MaintenanceRequestCard
            request={item}
            onPress={() => router.push(`/maintenance/${item.id}`)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Surface style={[styles.emptyState, shadows.medium]}>
            <Text style={styles.emptyStateText}>
              {loading ? 'Loading requests...' : 'No maintenance requests found'}
            </Text>
          </Surface>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/maintenance/add')}
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