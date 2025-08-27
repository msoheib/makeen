import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { useApi } from '@/hooks/useApi';
import { propertyGroupsApi } from '@/lib/api';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';

export default function BuildingsListScreen() {
  const router = useRouter();
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const { data: groups, loading, error, refetch } = useApi(() => propertyGroupsApi.getAll(), []);

  const handleRefresh = () => refetch();

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/buildings/${item.id}`)}>
      <ModernCard style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{item.name}</Text>
        {!!item.address && (
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>📍 {item.address}</Text>
        )}
        <View style={styles.actionsRow}>
          <Button mode="outlined" onPress={() => router.push(`/buildings/${item.id}`)}>
            عرض التفاصيل
          </Button>
        </View>
      </ModernCard>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader title="المباني" showNotifications variant="dark" />

      <FlatList
        data={groups || []}
        keyExtractor={(g: any) => g.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} colors={[theme.colors.primary]} />
        }
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: theme.colors.surface }]}>
            <Text style={{ color: theme.colors.onSurface }}>لا توجد مبانٍ</Text>
            <Button mode="contained" style={styles.addBtn} onPress={() => router.push('/buildings/add')}>
              إضافة مبنى
            </Button>
          </View>
        }
      />

      <Button mode="contained" style={styles.fab} onPress={() => router.push('/buildings/add')}>
        إضافة مبنى
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    gap: 8,
  },
  empty: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
  },
  addBtn: {
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
});


