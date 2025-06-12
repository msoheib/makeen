import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, Chip, Divider, List, ActivityIndicator, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { profilesApi, contractsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, FileText, Home } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';

export default function TenantDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Fetch tenant data
  const { 
    data: tenant, 
    loading: tenantLoading, 
    error: tenantError,
    refetch: refetchTenant 
  } = useApi(() => profilesApi.getById(id!), [id]);

  // Fetch tenant contracts
  const { 
    data: contracts, 
    loading: contractsLoading, 
    error: contractsError 
  } = useApi(() => contractsApi.getByTenant(id!), [id]);

  const loading = tenantLoading || contractsLoading;
  const error = tenantError || contractsError;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: theme.colors.successContainer, text: theme.colors.success };
      case 'inactive':
        return { bg: theme.colors.errorContainer, text: theme.colors.error };
      case 'suspended':
        return { bg: theme.colors.warningContainer, text: theme.colors.warning };
      default:
        return { bg: theme.colors.surfaceVariant, text: theme.colors.onSurfaceVariant };
    }
  };

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Loading tenant details...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centerContainer}>
      <ModernCard style={styles.errorCard}>
        <Text style={styles.errorTitle}>Unable to load tenant</Text>
        <Text style={styles.errorSubtitle}>
          {error || 'This tenant may not exist or there was a connection issue.'}
        </Text>
        <View style={styles.errorActions}>
          <Button mode="outlined" onPress={() => router.back()} style={styles.backButton}>
            Go Back
          </Button>
          <Button mode="contained" onPress={refetchTenant}>
            Try Again
          </Button>
        </View>
      </ModernCard>
    </View>
  );

  const renderTenantInfo = () => {
    if (!tenant) return null;

    const fullName = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim();
    const statusColors = getStatusColor(tenant.status || 'active');
    const activeContract = contracts?.find(c => c.status === 'active');

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ModernCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar.Image
              size={80}
              source={{ 
                uri: tenant.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' 
              }}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.tenantName}>{fullName || 'No Name'}</Text>
              <Chip 
                style={[styles.statusChip, { backgroundColor: statusColors.bg }]}
                textStyle={{ color: statusColors.text }}
              >
                {(tenant.status || 'active').charAt(0).toUpperCase() + (tenant.status || 'active').slice(1)}
              </Chip>
              {tenant.is_foreign && (
                <Chip style={styles.foreignChip} textStyle={{ color: theme.colors.primary }}>
                  Foreign Tenant
                </Chip>
              )}
            </View>
          </View>
        </ModernCard>

        {/* Contact Information */}
        <ModernCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <List.Item
            title="Email"
            description={tenant.email || 'No email provided'}
            left={(props) => <Mail {...props} size={20} color={theme.colors.primary} />}
          />
          <List.Item
            title="Phone"
            description={tenant.phone || 'No phone provided'}
            left={(props) => <Phone {...props} size={20} color={theme.colors.primary} />}
          />
          <List.Item
            title="Address"
            description={tenant.address || 'No address provided'}
            left={(props) => <MapPin {...props} size={20} color={theme.colors.primary} />}
          />
          {tenant.nationality && (
            <List.Item
              title="Nationality"
              description={tenant.nationality}
              left={(props) => <User {...props} size={20} color={theme.colors.primary} />}
            />
          )}
        </ModernCard>

        {/* Current Property */}
        {activeContract && (
          <ModernCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Current Property</Text>
            <List.Item
              title={activeContract.property?.title || 'Property Name'}
              description={`${activeContract.property?.address || 'Address'}, ${activeContract.property?.city || 'City'}`}
              left={(props) => <Home {...props} size={20} color={theme.colors.primary} />}
            />
            <List.Item
              title="Monthly Rent"
              description={`${activeContract.rent_amount?.toLocaleString()} SAR`}
              left={(props) => <FileText {...props} size={20} color={theme.colors.success} />}
            />
            <List.Item
              title="Contract Period"
              description={`${formatDate(activeContract.start_date)} - ${formatDate(activeContract.end_date)}`}
              left={(props) => <Calendar {...props} size={20} color={theme.colors.warning} />}
            />
          </ModernCard>
        )}

        {/* Contract History */}
        {contracts && contracts.length > 0 && (
          <ModernCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Contract History</Text>
            {contracts.map((contract, index) => (
              <View key={contract.id}>
                <List.Item
                  title={`Contract ${contract.contract_number || `#${index + 1}`}`}
                  description={`${formatDate(contract.start_date)} - ${formatDate(contract.end_date)}`}
                  right={() => (
                    <Chip 
                      style={[
                        styles.contractStatusChip,
                        { 
                          backgroundColor: contract.status === 'active' 
                            ? theme.colors.successContainer 
                            : theme.colors.surfaceVariant 
                        }
                      ]}
                      textStyle={{ 
                        color: contract.status === 'active' 
                          ? theme.colors.success 
                          : theme.colors.onSurfaceVariant 
                      }}
                    >
                      {contract.status?.charAt(0).toUpperCase() + contract.status?.slice(1)}
                    </Chip>
                  )}
                />
                {index < contracts.length - 1 && <Divider />}
              </View>
            ))}
          </ModernCard>
        )}

        {/* Account Details */}
        <ModernCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <List.Item
            title="Tenant ID"
            description={tenant.id}
            left={(props) => <User {...props} size={20} color={theme.colors.primary} />}
          />
          {tenant.id_number && (
            <List.Item
              title="ID Number"
              description={tenant.id_number}
              left={(props) => <FileText {...props} size={20} color={theme.colors.primary} />}
            />
          )}
          <List.Item
            title="Join Date"
            description={formatDate(tenant.created_at)}
            left={(props) => <Calendar {...props} size={20} color={theme.colors.primary} />}
          />
        </ModernCard>

        {/* Edit Button */}
        <View style={styles.editButtonContainer}>
          <Button
            mode="contained"
            onPress={() => router.push(`/tenants/${tenant.id}/edit`)}
            style={styles.editButton}
            icon="pencil"
          >
            Edit Tenant
          </Button>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Tenant Details"
        subtitle={loading ? "Loading..." : (tenant ? `${tenant.first_name} ${tenant.last_name}` : "Not Found")}
        variant="dark"
        showNotifications={false}
        isHomepage={false}
        leftIcon={<ArrowLeft size={24} color={theme.colors.onPrimary} />}
        onLeftPress={() => router.back()}
      />

      {loading ? renderLoadingState() : error ? renderErrorState() : renderTenantInfo()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.m,
    color: theme.colors.onSurfaceVariant,
  },
  errorCard: {
    padding: spacing.l,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.error,
    marginBottom: spacing.s,
  },
  errorSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  errorActions: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  backButton: {
    borderColor: theme.colors.outline,
  },
  profileCard: {
    margin: spacing.m,
    padding: spacing.l,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: spacing.l,
    flex: 1,
  },
  tenantName: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.s,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  foreignChip: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryContainer,
  },
  sectionCard: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
    padding: spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.m,
  },
  contractStatusChip: {
    alignSelf: 'center',
  },
  editButtonContainer: {
    padding: spacing.l,
  },
  editButton: {
    marginTop: spacing.s,
  },
}); 