import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, SegmentedButtons, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { CreditCard, DollarSign, TrendingUp, TrendingDown, Calendar, CircleCheck as CheckCircle, Circle as XCircle, Clock } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';

interface Payment {
  id: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  type: 'rent' | 'deposit' | 'maintenance' | 'utility';
  tenant: string;
  property: string;
  date: string;
  method: 'card' | 'bank' | 'cash' | 'check';
  reference: string;
}

export default function PaymentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    totalReceived: 45250,
    pendingPayments: 8750,
    thisMonth: 12500,
    avgPaymentTime: '2.3 days',
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchQuery, activeFilter]);

  const fetchPayments = async () => {
    // Mock data - replace with actual API call
    const mockPayments: Payment[] = [
      {
        id: '1',
        amount: 1200,
        status: 'completed',
        type: 'rent',
        tenant: 'John Smith',
        property: 'Apartment 2A',
        date: '2024-01-15',
        method: 'card',
        reference: 'PAY-001',
      },
      {
        id: '2',
        amount: 2500,
        status: 'pending',
        type: 'deposit',
        tenant: 'Sarah Johnson',
        property: 'Villa 5B',
        date: '2024-01-14',
        method: 'bank',
        reference: 'PAY-002',
      },
      {
        id: '3',
        amount: 350,
        status: 'completed',
        type: 'maintenance',
        tenant: 'Mike Wilson',
        property: 'Office 3C',
        date: '2024-01-13',
        method: 'card',
        reference: 'PAY-003',
      },
      {
        id: '4',
        amount: 800,
        status: 'failed',
        type: 'rent',
        tenant: 'Emily Davis',
        property: 'Apartment 1B',
        date: '2024-01-12',
        method: 'card',
        reference: 'PAY-004',
      },
      {
        id: '5',
        amount: 150,
        status: 'completed',
        type: 'utility',
        tenant: 'David Brown',
        property: 'Apartment 2A',
        date: '2024-01-11',
        method: 'cash',
        reference: 'PAY-005',
      },
    ];
    
    setPayments(mockPayments);
    setLoading(false);
  };

  const filterPayments = () => {
    let filtered = [...payments];
    
    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === activeFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.tenant.toLowerCase().includes(query) ||
        payment.property.toLowerCase().includes(query) ||
        payment.reference.toLowerCase().includes(query)
      );
    }
    
    setFilteredPayments(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color={theme.colors.success} />;
      case 'pending':
        return <Clock size={16} color={theme.colors.warning} />;
      case 'failed':
        return <XCircle size={16} color={theme.colors.error} />;
      case 'cancelled':
        return <XCircle size={16} color={theme.colors.onSurfaceVariant} />;
      default:
        return <Clock size={16} color={theme.colors.onSurfaceVariant} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'failed':
        return theme.colors.error;
      case 'cancelled':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rent':
        return <DollarSign size={16} color={theme.colors.primary} />;
      case 'deposit':
        return <TrendingUp size={16} color={theme.colors.success} />;
      case 'maintenance':
        return <TrendingDown size={16} color={theme.colors.warning} />;
      case 'utility':
        return <Calendar size={16} color={theme.colors.secondary} />;
      default:
        return <DollarSign size={16} color={theme.colors.onSurfaceVariant} />;
    }
  };

  const renderPayment = ({ item }: { item: Payment }) => (
    <ModernCard style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <View style={styles.paymentTitleRow}>
            <Text style={styles.paymentAmount}>
              ${item.amount.toLocaleString()}
            </Text>
            <View style={styles.statusContainer}>
              {getStatusIcon(item.status)}
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              {getTypeIcon(item.type)}
              <Text style={styles.detailText}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
            </View>
            <Text style={styles.tenantName}>{item.tenant}</Text>
            <Text style={styles.propertyName}>{item.property}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.paymentFooter}>
        <Text style={styles.paymentDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
        <Chip
          mode="outlined"
          style={styles.methodChip}
          textStyle={styles.methodText}
        >
          {item.method.toUpperCase()}
        </Chip>
        <Text style={styles.reference}>#{item.reference}</Text>
      </View>
    </ModernCard>
  );

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Payments"
        subtitle="Track all transactions"
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
              title: 'Total Received',
              value: `$${stats.totalReceived.toLocaleString()}`,
              color: theme.colors.success,
              icon: <TrendingUp size={20} color={theme.colors.success} />,
              trend: { value: '+12.5%', isPositive: true },
            },
            {
              title: 'Pending',
              value: `$${stats.pendingPayments.toLocaleString()}`,
              color: theme.colors.warning,
              icon: <Clock size={20} color={theme.colors.warning} />,
            },
            {
              title: 'This Month',
              value: `$${stats.thisMonth.toLocaleString()}`,
              color: theme.colors.primary,
              icon: <Calendar size={20} color={theme.colors.primary} />,
              trend: { value: '+8.2%', isPositive: true },
            },
            {
              title: 'Avg Time',
              value: stats.avgPaymentTime,
              subtitle: 'Payment processing',
              color: theme.colors.secondary,
              icon: <CreditCard size={20} color={theme.colors.secondary} />,
            },
          ]}
          renderItem={({ item }) => (
            <StatCard
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
              color={item.color}
              icon={item.icon}
              trend={item.trend}
            />
          )}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.statsContainer}
        />
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersSection}>
        <Searchbar
          placeholder="Search payments..."
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
            { value: 'completed', label: 'Completed' },
            { value: 'pending', label: 'Pending' },
            { value: 'failed', label: 'Failed' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Payments List */}
      <FlatList
        data={filteredPayments}
        renderItem={renderPayment}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ModernCard style={styles.emptyState}>
            <CreditCard size={48} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyStateTitle}>No payments found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery || activeFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Payments will appear here once processed'}
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
  paymentCard: {
    marginBottom: spacing.m,
  },
  paymentHeader: {
    marginBottom: spacing.m,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  tenantName: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  propertyName: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  paymentDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  methodChip: {
    height: 24,
  },
  methodText: {
    fontSize: 10,
    fontWeight: '600',
  },
  reference: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontFamily: 'monospace',
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