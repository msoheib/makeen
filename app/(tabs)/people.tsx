import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Searchbar, SegmentedButtons, Avatar, List, ActivityIndicator, Chip, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import { Users, UserPlus, Phone, Mail, Plus, MapPin } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';
import { useTranslation } from 'react-i18next';

export default function PeopleScreen() {
  const { theme } = useAppTheme();
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
            <Chip 
              mode="outlined" 
              textStyle={{ fontSize: 12 }}
              style={[
                styles.roleChip,
                { 
                  backgroundColor: getRoleColor(item.role).background,
                  borderColor: getRoleColor(item.role).color 
                }
              ]}
            >
              {getRoleLabel(item.role)}
            </Chip>
          </View>
        )}
        onPress={() => router.push(`/people/${item.id}`)}
        style={styles.listItem}
      />
      <View style={styles.personDetails}>
        {item.phone && (
          <View style={styles.detailRow}>
            <Phone size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}
        {item.address && (
          <View style={styles.detailRow}>
            <MapPin size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.detailText}>{item.address}, {item.city}</Text>
          </View>
        )}
      </View>
    </ModernCard>
  );

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'tenant':
        return 'Tenant';
      case 'owner':
        return 'Owner';
      case 'staff':
        return 'Staff';
      case 'manager':
        return 'Manager';
      case 'admin':
        return 'Admin';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      tenant: { background: theme.colors.primaryContainer, color: theme.colors.primary },
      owner: { background: theme.colors.successContainer, color: theme.colors.success },
      manager: { background: theme.colors.tertiaryContainer, color: theme.colors.tertiary },
      staff: { background: theme.colors.secondaryContainer, color: theme.colors.secondary },
      admin: { background: theme.colors.errorContainer, color: theme.colors.error },
    };
    return colors[role as keyof typeof colors] || { background: theme.colors.surfaceVariant, color: theme.colors.onSurfaceVariant };
  };

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
  roleChip: {
    borderRadius: 12,
  },
  personDetails: {
    marginTop: spacing.s,
    paddingHorizontal: spacing.s,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: spacing.xs,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
});

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

      {/* FAB for adding new people */}
      <FAB
        icon={() => <Plus size={24} color="white" />}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/people/add')}
        label="Add Person"
      />
    </View>
  );
}

