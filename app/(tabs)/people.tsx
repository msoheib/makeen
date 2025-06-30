import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Searchbar, SegmentedButtons, Avatar, List, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import { Users, UserPlus, Phone, Mail, Plus } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';
import { useTranslation } from 'react-i18next';

export default function PeopleScreen() {
  const router = useRouter();
  const { t } = useTranslation('people');
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<User[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    tenants: 0,
    owners: 0,
    staff: 0,
  });

  useEffect(() => {
    fetchPeople();
  }, []);

  useEffect(() => {
    filterPeople();
  }, [people, searchQuery, activeFilter]);

  const fetchPeople = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setPeople(data);
        
        // Calculate stats
        const tenants = data.filter(p => p.role === 'tenant').length;
        const owners = data.filter(p => p.role === 'owner').length;
        const staff = data.filter(p => p.role === 'staff' || p.role === 'manager').length;
        
        setStats({
          total: data.length,
          tenants,
          owners,
          staff,
        });
      }
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPeople = () => {
    let filtered = [...people];
    
    // Filter by role
    if (activeFilter !== 'all') {
      filtered = filtered.filter(person => person.role === activeFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(person => 
        `${person.first_name} ${person.last_name}`.toLowerCase().includes(query) ||
        person.email.toLowerCase().includes(query)
      );
    }
    
    setFilteredPeople(filtered);
  };

  const renderPerson = ({ item }: { item: User }) => (
    <ModernCard style={styles.personCard}>
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
          <View style={styles.personActions}>
            <View style={[styles.roleTag, getRoleTagStyle(item.role)]}>
              <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
              </Text>
            </View>
          </View>
        )}
        onPress={() => router.push(`/people/${item.id}`)}
        style={styles.listItem}
      />
    </ModernCard>
  );

  const getRoleTagStyle = (role: string) => {
    const colors = {
      tenant: theme.colors.primaryContainer,
      owner: theme.colors.successContainer,
      manager: theme.colors.tertiaryContainer,
      staff: theme.colors.secondaryContainer,
      admin: theme.colors.errorContainer,
    };
    return { backgroundColor: colors[role as keyof typeof colors] || theme.colors.surfaceVariant };
  };

  const getRoleColor = (role: string) => {
    const colors = {
      tenant: theme.colors.primary,
      owner: theme.colors.success,
      manager: theme.colors.tertiary,
      staff: theme.colors.secondary,
      admin: theme.colors.error,
    };
    return colors[role as keyof typeof colors] || theme.colors.onSurfaceVariant;
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('title')}
        subtitle={t('subtitle')}
        onNotificationPress={() => router.push('/notifications')}
        onSearchPress={() => router.push('/search')}
      />

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            {
              title: 'Total People',
              value: stats.total.toString(),
              color: theme.colors.primary,
              icon: <Users size={20} color={theme.colors.primary} />,
            },
            {
              title: 'Tenants',
              value: stats.tenants.toString(),
              color: theme.colors.secondary,
              icon: <Users size={20} color={theme.colors.secondary} />,
            },
            {
              title: 'Owners',
              value: stats.owners.toString(),
              color: theme.colors.success,
              icon: <Users size={20} color={theme.colors.success} />,
            },
            {
              title: 'Staff',
              value: stats.staff.toString(),
              color: theme.colors.warning,
              icon: <Users size={20} color={theme.colors.warning} />,
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

      {/* Search and Filters */}
      <View style={styles.filtersSection}>
        <Searchbar
          placeholder="Search people..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={theme.colors.onSurfaceVariant}
        />
        
        <SegmentedButtons
          value={activeFilter}
          onValueChange={setActiveFilter}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'tenant', label: 'Tenants' },
            { value: 'owner', label: 'Owners' },
            { value: 'staff', label: 'Staff' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* People List */}
      <FlatList
        data={filteredPeople}
        renderItem={renderPerson}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ModernCard style={styles.emptyState}>
            <UserPlus size={48} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyStateTitle}>No people found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery || activeFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Add your first person to get started'}
            </Text>
          </ModernCard>
        }
      />

      {/* Add Person FAB */}
      <View style={styles.fabContainer}>
        <ModernCard style={styles.fab}>
          <Text
            style={styles.fabText}
            onPress={() => router.push('/people/add')}
          >
            <Plus size={24} color="white" />
          </Text>
        </ModernCard>
      </View>
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
    marginBottom: spacing.m,
    backgroundColor: theme.colors.surface,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surface,
  },
  listContent: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xxxl,
  },
  personCard: {
    marginBottom: spacing.m,
  },
  listItem: {
    paddingVertical: spacing.s,
  },
  personActions: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  roleTag: {
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
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
  fabContainer: {
    position: 'absolute',
    bottom: spacing.m,
    right: spacing.m,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
});