import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Users, Phone, Clock, Shield } from 'lucide-react-native';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { formatDisplayNumber } from '@/lib/formatters';

interface QuickStatsProps {
  total: number;
  active: number;
  pending: number;
  owners?: number;
  showOwners?: boolean;
  loading?: boolean;
}

export default function QuickStats({ 
  total, 
  active, 
  pending, 
  owners = 0, 
  showOwners = false,
  loading = false 
}: QuickStatsProps) {
  const { theme } = useAppTheme();

  const stats = [
    {
      icon: Users,
      label: 'إجمالي المستأجرين',
      value: total,
      color: theme.colors.primary,
      bgColor: `${theme.colors.primary}20`
    },
    {
      icon: Phone,
      label: 'مستأجرين نشطين',
      value: active,
      color: '#4CAF50',
      bgColor: '#4CAF5020'
    },
    {
      icon: Clock,
      label: 'في الانتظار',
      value: pending,
      color: '#FF9520',
      bgColor: '#FF952020'
    }
  ];

  // Add owners stat if requested
  if (showOwners) {
    stats.push({
      icon: Shield,
      label: 'إجمالي الملاك',
      value: owners,
      color: '#9C27B0',
      bgColor: '#9C27B020'
    });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
                             <View style={[styles.statIcon, { backgroundColor: stat.bgColor }]}>
                 <stat.icon size={22} color={stat.color} />
               </View>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                {stat.label}
              </Text>
              <Text style={[styles.statValue, { color: stat.color }]}> 
                {loading ? '...' : formatDisplayNumber(stat.value || 0)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  statsCard: {
    borderRadius: 12,
    padding: spacing.m,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 3,
    lineHeight: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
});
