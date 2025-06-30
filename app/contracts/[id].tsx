import React from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import { contractsApi } from '@/lib/api';
import { spacing } from '@/lib/theme';
import { ModernHeader } from '@/components/ModernHeader';
import { 
  FileText,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Edit,
  Download,
  Share2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Home,
  Phone,
  Mail,
  Users,
  Globe,
  CreditCard,
  Repeat,
  Car,
  Package
} from 'lucide-react-native';

export default function ContractDetailsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { 
    data: contract, 
    loading, 
    error, 
    refetch 
  } = useApi(() => contractsApi.getById(id!), [id]);

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
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDownload = () => {
    Alert.alert(
      'Download Contract',
      'Contract PDF download functionality will be implemented in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Share Contract',
      'Contract sharing functionality will be implemented in a future update.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Contract Details" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Loading contract details...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !contract) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Contract Details" showBack />
        <View style={styles.errorContainer}>
          <XCircle size={48} color={theme.colors.error} />
          <Text variant="headlineSmall" style={{ color: theme.colors.error, textAlign: 'center', marginTop: 16 }}>
            Contract Not Found
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
            The contract you're looking for doesn't exist or has been removed.
          </Text>
          <Button 
            mode="contained" 
            onPress={() => router.back()} 
            style={{ marginTop: 24 }}
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  const StatusIcon = getStatusIcon(contract.status);
  const statusColor = getStatusColor(contract.status);
  const daysRemaining = getDaysRemaining(contract.end_date);
  const contractDuration = calculateDuration(contract.start_date, contract.end_date);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="Contract Details" 
        showBack
        action={{
          icon: Edit,
          onPress: () => router.push(`/contracts/${id}/edit`),
          label: 'Edit Contract'
        }}
      />

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      >
        {/* Header Card */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.contractInfo}>
                <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
                  {contract.contract_number || `CTR-${contract.id.slice(0, 8)}`}
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textTransform: 'capitalize' }}>
                  {contract.contract_type} Contract
                </Text>
                {contract.status === 'active' && daysRemaining > 0 && (
                  <Text variant="bodySmall" style={{ color: theme.colors.tertiary, marginTop: 4 }}>
                    {daysRemaining} days remaining
                  </Text>
                )}
              </View>
              <Chip 
                icon={({ size }) => <StatusIcon size={size} color={statusColor} />}
                style={{ backgroundColor: `${statusColor}15` }}
                textStyle={{ color: statusColor }}
              >
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Property Information */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={theme.colors.primary} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                Property Details
              </Text>
            </View>
            <View style={styles.detailsContainer}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                {contract.property?.title}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {contract.property?.address}, {contract.property?.city}
              </Text>
              
              {contract.property?.property_code && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                    Property Code:
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                    {contract.property.property_code}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                  Type:
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, textTransform: 'capitalize' }}>
                  {contract.property?.property_type}
                </Text>
              </View>

              {contract.property?.area_sqm && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                    Area:
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                    {contract.property.area_sqm} m²
                  </Text>
                </View>
              )}

              {contract.property?.bedrooms && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                    Bedrooms:
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                    {contract.property.bedrooms}
                  </Text>
                </View>
              )}

              {contract.property?.amenities && contract.property.amenities.length > 0 && (
                <>
                  <Divider style={{ marginVertical: 12 }} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                    Amenities:
                  </Text>
                  <View style={styles.amenitiesContainer}>
                    {contract.property.amenities.map((amenity, index) => (
                      <Chip key={index} mode="outlined" compact style={styles.amenityChip}>
                        {amenity}
                      </Chip>
                    ))}
                  </View>
                </>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Tenant Information */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <User size={20} color={theme.colors.secondary} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                Tenant Details
              </Text>
            </View>
            <View style={styles.detailsContainer}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                {contract.tenant?.first_name} {contract.tenant?.last_name}
              </Text>
              
              <View style={styles.contactRow}>
                <Mail size={16} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
                  {contract.tenant?.email}
                </Text>
              </View>

              <View style={styles.contactRow}>
                <Phone size={16} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
                  {contract.tenant?.phone}
                </Text>
              </View>

              {contract.tenant?.address && (
                <View style={styles.contactRow}>
                  <Home size={16} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
                    {contract.tenant.address}
                  </Text>
                </View>
              )}

              {contract.tenant?.nationality && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                    Nationality:
                  </Text>
                  <View style={styles.nationalityContainer}>
                    {contract.tenant.is_foreign && (
                      <Globe size={14} color={theme.colors.tertiary} style={{ marginRight: 4 }} />
                    )}
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                      {contract.tenant.nationality}
                      {contract.tenant.is_foreign && ' (Foreign)'}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                  Status:
                </Text>
                <Chip 
                  mode="outlined" 
                  compact
                  style={{ 
                    backgroundColor: contract.tenant?.status === 'active' ? `${theme.colors.primary}15` : `${theme.colors.outline}15` 
                  }}
                  textStyle={{ 
                    color: contract.tenant?.status === 'active' ? theme.colors.primary : theme.colors.outline 
                  }}
                >
                  {contract.tenant?.status || 'Unknown'}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Financial Information */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <DollarSign size={20} color={theme.colors.tertiary} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                Financial Details
              </Text>
            </View>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                  {contract.payment_frequency === 'monthly' ? 'Monthly Rent:' : 'Rent Amount:'}
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                  {formatCurrency(contract.rent_amount)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                  Security Deposit:
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                  {formatCurrency(contract.security_deposit)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.iconTextContainer}>
                  <Repeat size={16} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4, flex: 1 }}>
                    Payment Frequency:
                  </Text>
                </View>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, textTransform: 'capitalize' }}>
                  {contract.payment_frequency}
                </Text>
              </View>

              {contract.payment_frequency === 'monthly' && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                    Annual Total:
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                    {formatCurrency(contract.rent_amount * 12)}
                  </Text>
                </View>
              )}

              {contract.late_fee_percentage && contract.late_fee_percentage > 0 && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                    Late Fee:
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                    {contract.late_fee_percentage}% per month
                  </Text>
                </View>
              )}

              {contract.utilities_included !== undefined && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                    Utilities Included:
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                    {contract.utilities_included ? 'Yes' : 'No'}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Contract Duration */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={theme.colors.outline} />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                Contract Duration
              </Text>
            </View>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                  Start Date:
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {formatDate(contract.start_date)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                  End Date:
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {formatDate(contract.end_date)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                  Duration:
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {contractDuration} months
                </Text>
              </View>

              {contract.status === 'active' && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                    Remaining:
                  </Text>
                  <Text 
                    variant="bodyMedium" 
                    style={{ 
                      color: daysRemaining < 30 ? theme.colors.error : theme.colors.onSurface,
                      fontWeight: daysRemaining < 30 ? 'bold' : 'normal'
                    }}
                  >
                    {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                  </Text>
                </View>
              )}

              {contract.auto_renewal && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                    Auto Renewal:
                  </Text>
                  <Chip mode="outlined" compact style={{ backgroundColor: `${theme.colors.tertiary}15` }}>
                    <Text style={{ color: theme.colors.tertiary }}>Enabled</Text>
                  </Chip>
                </View>
              )}

              {contract.notice_period_days && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                    Notice Period:
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                    {contract.notice_period_days} days
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Actions
            </Text>
            <View style={styles.actionsContainer}>
              <Button 
                mode="contained" 
                icon={({ size, color }) => <Edit size={size} color={color} />}
                style={styles.actionButton}
                onPress={() => router.push(`/contracts/${id}/edit`)}
              >
                Edit Contract
              </Button>
              <Button 
                mode="outlined" 
                icon={({ size, color }) => <Download size={size} color={color} />}
                style={styles.actionButton}
                onPress={handleDownload}
              >
                Download PDF
              </Button>
              <Button 
                mode="outlined" 
                icon={({ size, color }) => <Share2 size={size} color={color} />}
                style={styles.actionButton}
                onPress={handleShare}
              >
                Share Contract
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
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
  card: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contractInfo: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  iconTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nationalityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    marginBottom: 4,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
}); 