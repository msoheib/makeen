import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Searchbar, Chip, Menu, Portal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import api from '@/lib/api';
import { spacing } from '@/lib/theme';
import { ModernHeader } from '@/components/ModernHeader';
import { 
  FileText,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Filter,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react-native';

interface Contract {
  id: string;
  contract_number: string;
  contract_type: 'rental' | 'sale' | 'management';
  status: 'active' | 'expired' | 'terminated' | 'renewal' | 'draft';
  rent_amount: number;
  security_deposit: number;
  start_date: string;
  end_date: string;
  created_at: string;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    property_code?: string;
  };
  tenant: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

const ContractCard: React.FC<{ contract: Contract; onPress: () => void }> = ({ contract, onPress }) => {
  const { theme } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.colors.primary;
      case 'expired': return theme.colors.error;
      case 'terminated': return theme.colors.outline;
      case 'renewal': return theme.colors.tertiary;
      case 'draft': return theme.colors.onSurfaceVariant;
      default: return theme.colors.outline;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'expired': return Clock;
      case 'terminated': return XCircle;
      case 'renewal': return AlertTriangle;
      case 'draft': return FileText;
      default: return FileText;
    }
  };

  const StatusIcon = getStatusIcon(contract.status);
  const statusColor = getStatusColor(contract.status);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card style={[styles.contractCard, { backgroundColor: theme.colors.surface }]} onPress={onPress}>
      <Card.Content>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.contractInfo}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {contract.contract_number || `Contract #${contract.id.slice(0, 8)}`}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textTransform: 'capitalize' }}>
              {contract.contract_type}
            </Text>
          </View>
          <Chip 
            icon={({ size }) => <StatusIcon size={size} color={statusColor} />}
            style={{ backgroundColor: `${statusColor}15` }}
            textStyle={{ color: statusColor, fontSize: 12 }}
          >
            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
          </Chip>
        </View>

        {/* Property Information */}
        <View style={styles.propertySection}>
          <View style={styles.propertyHeader}>
            <MapPin size={16} color={theme.colors.primary} />
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginLeft: 8, flex: 1 }}>
              {contract.property.title}
            </Text>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 24 }}>
            {contract.property.address}, {contract.property.city}
          </Text>
        </View>

        {/* Tenant Information */}
        <View style={styles.tenantSection}>
          <View style={styles.tenantHeader}>
            <User size={16} color={theme.colors.secondary} />
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
              {contract.tenant.first_name} {contract.tenant.last_name}
            </Text>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 24 }}>
            {contract.tenant.email}
          </Text>
        </View>

        {/* Financial and Date Information */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <DollarSign size={14} color={theme.colors.tertiary} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}>
              Rent: {formatCurrency(contract.rent_amount)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Calendar size={14} color={theme.colors.outline} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}>
              {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <Button 
            mode="outlined" 
            compact 
            icon={({ size, color }) => <Eye size={size} color={color} />}
            style={{ borderColor: theme.colors.outline }}
            onPress={onPress}
          >
            View Details
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
};

export default function ContractsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'rental' | 'sale' | 'management'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'terminated' | 'renewal' | 'draft'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  // Fetch contracts data
  const { 
    data: contracts, 
    loading, 
    error, 
    refetch 
  } = useApi(() => api.contracts.getAll(), []);

  // Filter and search contracts
  const filteredContracts = useMemo(() => {
    if (!contracts) return [];

    return contracts.filter((contract: Contract) => {
      // Search filter
      const searchFields = [
        contract.contract_number,
        contract.property.title,
        contract.property.address,
        contract.property.city,
        `${contract.tenant.first_name} ${contract.tenant.last_name}`,
        contract.tenant.email
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesSearch = searchQuery === '' || searchFields.includes(searchQuery.toLowerCase());

      // Type filter
      const matchesType = typeFilter === 'all' || contract.contract_type === typeFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [contracts, searchQuery, typeFilter, statusFilter]);

  const handleContractPress = (contractId: string) => {
    router.push(`/contracts/${contractId}`);
  };

  const handleAddContract = () => {
    router.push('/contracts/add');
  };

  const getFilterCount = () => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    return count;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Contracts" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" animating={true} />
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Loading contracts...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Contracts" />
        <View style={styles.errorContainer}>
          <Text style={{ color: theme.colors.error, textAlign: 'center', marginBottom: 16 }}>
            {error.message || 'Failed to load contracts'}
          </Text>
          <Button mode="outlined" onPress={refetch}>
            Try Again
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="Contracts" 
        action={{
          icon: Plus,
          onPress: handleAddContract,
          label: 'Add Contract'
        }}
      />
      
      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search contracts, properties, or tenants..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant }]}
          inputStyle={{ color: theme.colors.onSurface }}
        />
        
        <View style={styles.filterRow}>
          <Button
            mode={showFilters ? "contained" : "outlined"}
            icon={({ size, color }) => <Filter size={size} color={color} />}
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterButton}
          >
            Filters {getFilterCount() > 0 && `(${getFilterCount()})`}
          </Button>
        </View>

        {showFilters && (
          <View style={styles.filterContainer}>
            <View style={styles.filterGroup}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                Contract Type
              </Text>
              <Menu
                visible={typeMenuVisible}
                onDismiss={() => setTypeMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setTypeMenuVisible(true)}
                    style={styles.filterDropdown}
                  >
                    {typeFilter === 'all' ? 'All Types' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
                  </Button>
                }
              >
                <Menu.Item onPress={() => { setTypeFilter('all'); setTypeMenuVisible(false); }} title="All Types" />
                <Menu.Item onPress={() => { setTypeFilter('rental'); setTypeMenuVisible(false); }} title="Rental" />
                <Menu.Item onPress={() => { setTypeFilter('sale'); setTypeMenuVisible(false); }} title="Sale" />
                <Menu.Item onPress={() => { setTypeFilter('management'); setTypeMenuVisible(false); }} title="Management" />
              </Menu>
            </View>

            <View style={styles.filterGroup}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                Status
              </Text>
              <Menu
                visible={statusMenuVisible}
                onDismiss={() => setStatusMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setStatusMenuVisible(true)}
                    style={styles.filterDropdown}
                  >
                    {statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  </Button>
                }
              >
                <Menu.Item onPress={() => { setStatusFilter('all'); setStatusMenuVisible(false); }} title="All Status" />
                <Menu.Item onPress={() => { setStatusFilter('active'); setStatusMenuVisible(false); }} title="Active" />
                <Menu.Item onPress={() => { setStatusFilter('expired'); setStatusMenuVisible(false); }} title="Expired" />
                <Menu.Item onPress={() => { setStatusFilter('terminated'); setStatusMenuVisible(false); }} title="Terminated" />
                <Menu.Item onPress={() => { setStatusFilter('renewal'); setStatusMenuVisible(false); }} title="Renewal" />
                <Menu.Item onPress={() => { setStatusFilter('draft'); setStatusMenuVisible(false); }} title="Draft" />
              </Menu>
            </View>
          </View>
        )}
      </View>

      {/* Results Summary */}
      <View style={styles.summaryContainer}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Contracts List */}
      <FlatList
        data={filteredContracts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContractCard 
            contract={item} 
            onPress={() => handleContractPress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileText size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}>
              No contracts found
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by adding your first contract'}
            </Text>
            {(!searchQuery && typeFilter === 'all' && statusFilter === 'all') && (
              <Button 
                mode="contained" 
                onPress={handleAddContract}
                style={{ marginTop: 24 }}
                icon={({ size, color }) => <Plus size={size} color={color} />}
              >
                Add Contract
              </Button>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  searchSection: {
    padding: spacing.md,
  },
  searchbar: {
    marginBottom: spacing.sm,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    alignSelf: 'flex-start',
  },
  filterContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterGroup: {
    marginBottom: spacing.sm,
  },
  filterDropdown: {
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  summaryContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  listContainer: {
    padding: spacing.md,
    paddingTop: 0,
  },
  contractCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  contractInfo: {
    flex: 1,
  },
  propertySection: {
    marginBottom: spacing.sm,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tenantSection: {
    marginBottom: spacing.sm,
  },
  tenantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailsSection: {
    marginBottom: spacing.md,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionSection: {
    alignItems: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl * 2,
  },
}); 