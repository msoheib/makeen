import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, ActivityIndicator, Button, List, Chip, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import { profilesApi } from '@/lib/api';
import { Tables } from '@/lib/database.types';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Home, 
  FileText, 
  Calendar
} from 'lucide-react-native';
import { useTranslation } from '@/lib/useTranslation';

export default function TenantDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('tenants');
  const [tenant, setTenant] = useState<Tables<'profiles'> | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTenantDetails();
    }
  }, [id]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch tenant profile with related data using existing API
      const response = await profilesApi.getById(id);
      
      if (response.error) {
        if (response.error.details === 'AUTH_ERROR') {
          setError(t('details.authError', { default: 'Session expired. Please sign in again.' }));
        } else if (response.error.details === 'NETWORK_ERROR') {
          setError(t('details.networkError', { default: 'Network error. Please check your connection.' }));
        } else if (response.error.message.includes('No rows returned')) {
          setError(t('details.notFound', { default: 'Tenant not found.' }));
        } else {
          setError(response.error.message || t('details.loadError', { default: 'Failed to load tenant details.' }));
        }
        return;
      }

      if (!response.data) {
        setError(t('details.notFound', { default: 'Tenant not found.' }));
        return;
      }

      // Set tenant data
      setTenant(response.data);
      
      // Extract contracts data if available (from the nested API response)
      const contractsData = (response.data as any)?.contracts || [];
      setContracts(contractsData);
      
    } catch (err: any) {
      console.error('Error fetching tenant details:', err);
      setError(t('details.loadError', { default: 'An unexpected error occurred. Please try again.' }));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return { bg: theme.colors.successContainer, text: theme.colors.success };
      case 'pending':
        return { bg: theme.colors.warningContainer, text: theme.colors.warning };
      case 'inactive':
        return { bg: theme.colors.errorContainer, text: theme.colors.error };
      default:
        return { bg: theme.colors.surfaceVariant, text: theme.colors.onSurfaceVariant };
    }
  };

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>{t('details.loading')}</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centerContainer}>
      <ModernCard style={styles.errorCard}>
        <Text style={styles.errorTitle}>{t('details.error')}</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <View style={styles.errorActions}>
          <Button 
            mode="outlined" 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            {t('common:back')}
          </Button>
          <Button 
            mode="contained" 
            onPress={fetchTenantDetails}
          >
            {t('common:retry')}
          </Button>
        </View>
      </ModernCard>
    </View>
  );

  const renderTenantInfo = () => {
    if (!tenant) return null;

    const fullName = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim();
    const statusColors = getStatusColor(tenant.status);
    const activeContract = contracts.find(c => c.status === 'active');

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ModernCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User size={32} color={theme.colors.primary} />
            </View>
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
            title={t('details.email')}
            description={tenant.email || 'No email provided'}
            left={(props) => <Mail {...props} size={20} color={theme.colors.primary} />}
          />
          <List.Item
            title={t('details.phone')}
            description={tenant.phone || 'No phone provided'}
            left={(props) => <Phone {...props} size={20} color={theme.colors.primary} />}
          />
          <List.Item
            title={t('details.address')}
            description={tenant.address || 'No address provided'}
            left={(props) => <MapPin {...props} size={20} color={theme.colors.primary} />}
          />
          {tenant.nationality && (
            <List.Item
              title={t('details.nationality')}
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
              title={t('details.monthlyRent')}
              description={`${activeContract.rent_amount?.toLocaleString()} SAR`}
              left={(props) => <FileText {...props} size={20} color={theme.colors.success} />}
            />
            <List.Item
              title={t('details.contractPeriod')}
              description={`${formatDate(activeContract.start_date)} - ${formatDate(activeContract.end_date)}`}
              left={(props) => <Calendar {...props} size={20} color={theme.colors.warning} />}
            />
          </ModernCard>
        )}

        {/* Contract History */}
        {contracts && contracts.length > 0 && (
          <ModernCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('details.contractInfo')}</Text>
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
          <Text style={styles.sectionTitle}>{t('details.personalInfo')}</Text>
          <List.Item
            title={t('details.tenantId')}
            description={tenant.id}
            left={(props) => <User {...props} size={20} color={theme.colors.primary} />}
          />
          {tenant.id_number && (
            <List.Item
              title={t('details.idNumber')}
              description={tenant.id_number}
              left={(props) => <FileText {...props} size={20} color={theme.colors.primary} />}
            />
          )}
          <List.Item
            title={t('details.joinDate')}
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
            {t('common:edit')} {t('title').slice(0, -1)}
          </Button>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('details.title')}
        subtitle={loading ? t('details.loading') : (tenant ? `${tenant.first_name} ${tenant.last_name}` : "Not Found")}
        variant="dark"
        showNotifications={false}
        showBackButton={true}
        onBackPress={() => router.back()}
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
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