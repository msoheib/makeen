import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { useApi } from '@/hooks/useApi';
import { propertyGroupsApi } from '@/lib/api';
import { useTheme as useAppTheme } from '@/hooks/useTheme';

export default function BuildingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();

  const { data, loading, error, refetch } = useApi(() => propertyGroupsApi.getById(id!), [id]);
  const handleRefresh = () => refetch();

  const renderUnit = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/properties/${item.id}`)}>
      <ModernCard style={[styles.unitCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.unitTitle, { color: theme.colors.onSurface }]}>{item.title}</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>الدور: {item.floor_number ?? '-'}</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>الحالة: {item.status}</Text>
      </ModernCard>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader title={data?.name || 'تفاصيل المبنى'} showBackButton onBackPress={() => router.back()} />

      <FlatList
        data={data?.units || []}
        keyExtractor={(u: any) => u.id}
        renderItem={renderUnit}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} colors={[theme.colors.primary]} />}
        ListHeaderComponent={
          <ModernCard style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>{data?.name}</Text>
            {data?.address && (
              <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>📍 {data.address}</Text>
            )}
            <View style={styles.actionsRow}>
              <Button mode="contained" onPress={() => router.push(`/properties/add?groupId=${id}`)}>
                إضافة شقة
              </Button>
            </View>
          </ModernCard>
        }
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: theme.colors.surface }]}>
            <Text style={{ color: theme.colors.onSurface }}>لا توجد وحدات</Text>
            <Button mode="contained" onPress={() => router.push(`/properties/add?groupId=${id}`)}>
              إضافة شقة
            </Button>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  headerCard: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'right', marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: 'right', marginBottom: 10 },
  actionsRow: { flexDirection: 'row-reverse', gap: 8 },
  empty: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', margin: 16 },
  unitCard: { marginBottom: 12 },
  unitTitle: { fontSize: 16, fontWeight: '600', textAlign: 'right', marginBottom: 6 },
});


