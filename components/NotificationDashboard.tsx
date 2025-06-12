import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { Bell, Users, Building, Wrench, DollarSign, FileText, AlertCircle, Settings } from 'lucide-react-native';
import { NotificationBadge } from './NotificationBadge';
import { useNotificationBadges } from '@/hooks/useNotificationBadges';
import { router } from 'expo-router';

interface NotificationCategoryProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  count: number;
  color: string;
  onPress: () => void;
}

const NotificationCategory: React.FC<NotificationCategoryProps> = ({
  icon: Icon,
  title,
  count,
  color,
  onPress
}) => {
  const theme = useTheme();
  
  return (
    <TouchableOpacity style={styles.categoryItem} onPress={onPress}>
      <View style={styles.categoryContent}>
        <NotificationBadge count={count} size="small" position="top-right">
          <Icon size={24} color={color} />
        </NotificationBadge>
        <Text style={[styles.categoryTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        <Text style={[styles.categoryCount, { color: color }]}>
          {count > 99 ? '99+' : count.toString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const NotificationDashboard: React.FC = () => {
  const theme = useTheme();
  const { badgeCounts, totalCount, refreshCounts, isLoading } = useNotificationBadges();

  const categories = [
    {
      icon: Wrench,
      title: 'Maintenance',
      count: badgeCounts.maintenance,
      color: '#F59E0B',
      onPress: () => router.push('/maintenance'),
    },
    {
      icon: DollarSign,
      title: 'Payments',
      count: badgeCounts.payment,
      color: '#10B981',
      onPress: () => router.push('/finance'),
    },
    {
      icon: Users,
      title: 'Tenants',
      count: badgeCounts.tenant,
      color: '#3B82F6',
      onPress: () => router.push('/(drawer)/(tabs)/tenants'),
    },
    {
      icon: Building,
      title: 'Properties',
      count: badgeCounts.property,
      color: '#8B5CF6',
      onPress: () => router.push('/(drawer)/(tabs)/properties'),
    },
    {
      icon: FileText,
      title: 'Invoices',
      count: badgeCounts.invoice,
      color: '#EF4444',
      onPress: () => router.push('/finance/invoices'),
    },
    {
      icon: AlertCircle,
      title: 'System',
      count: badgeCounts.system,
      color: '#F97316',
      onPress: () => router.push('/(drawer)/(tabs)/settings'),
    },
  ];

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={24} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Notifications
          </Text>
        </View>
        <NotificationBadge count={totalCount} size="medium" position="inline">
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <Text style={[styles.viewAll, { color: theme.colors.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </NotificationBadge>
      </View>
      
      <View style={styles.categoriesGrid}>
        {categories.map((category, index) => (
          <NotificationCategory
            key={index}
            icon={category.icon}
            title={category.title}
            count={category.count}
            color={category.color}
            onPress={category.onPress}
          />
        ))}
      </View>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Updating...
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    marginBottom: 12,
  },
  categoryContent: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default NotificationDashboard; 