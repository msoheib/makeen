import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Button, IconButton, Chip, List } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { spacing } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { vouchersApi } from '@/lib/api';
import { User, Property, Contract } from '@/lib/types';
import { ArrowLeft, LocationEdit as Edit, Phone, Mail, MapPin, Calendar, Building2, DollarSign, User as UserIcon, FileText } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import ModernCard from '@/components/ModernCard';
import StatCard from '@/components/StatCard';

export default function PersonDetailsScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeContracts: 0,
    totalPayments: 0,
    avgRent: 0,
  });

  // Create styles once per theme so they are available in all render paths
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.m,
      paddingTop: spacing.xl,
      paddingBottom: spacing.s,
    },
    backButton: {
      margin: 0,
    },
    headerActions: {
      flexDirection: 'row',
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoCard: {
      marginHorizontal: spacing.m,
      marginBottom: spacing.m,
    },
    personHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.m,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginRight: spacing.m,
    },
    personInfo: {
      flex: 1,
    },
    personName: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: spacing.s,
    },
    roleChip: {
      alignSelf: 'flex-start',
    },
    contactInfo: {
      gap: spacing.s,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    contactText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      marginLeft: 8,
    },
    statsSection: {
      marginBottom: spacing.m,
    },
    statsContainer: {
      paddingHorizontal: spacing.m,
    },
    listCard: {
      marginHorizontal: spacing.m,
      marginBottom: spacing.m,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: spacing.m,
    },
    listItem: {
      paddingVertical: spacing.s,
    },
    propertyIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    propertyPrice: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    contractIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contractInfo: {
      alignItems: 'flex-end',
    },
    contractRent: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    statusChip: {
      height: 24,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
    },
    viewAllButton: {
      marginTop: spacing.s,
    },
    actionsCard: {
      marginHorizontal: spacing.m,
      marginBottom: spacing.xxxl,
    },
    actionButtons: {
      gap: spacing.m,
    },
    actionButton: {
      paddingVertical: 4,
    },
  });

  useEffect(() => {
    if (id) {
      fetchPersonDetails();
    }
  }, [id]);

  const fetchPersonDetails = async () => {
    try {
      // Fetch person details
      const { data: personData, error: personError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (personError) throw personError;
      if (personData) setPerson(personData);

      // Fetch related data based on role
      if (personData?.role === 'owner') {
        // Fetch owned properties
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', id);
        
        if (propertiesData) setProperties(propertiesData);
      } else if (personData?.role === 'tenant') {
        // Fetch tenant contracts
        const { data: contractsData } = await supabase
          .from('contracts')
          .select(`
            *,
            property:properties(title, address, city)
          `)
          .eq('tenant_id', id);
        
        if (contractsData) setContracts(contractsData);
      }

      // Calculate real stats from vouchers
      try {
        const { data: vouchersData } = await vouchersApi.getAll();
        const personVouchers = vouchersData?.filter(v => v.tenant_id === id) || [];
        const totalPayments = personVouchers
          .filter(v => v.voucher_type === 'receipt' && v.status === 'posted')
          .reduce((sum, v) => sum + v.amount, 0);
        
        const avgRent = contracts.length > 0 
          ? contracts.reduce((sum, c) => sum + c.rent_amount, 0) / contracts.length 
          : 0;

        setStats({
          totalProperties: properties.length,
          activeContracts: contracts.filter(c => c.status === 'active').length,
          totalPayments,
          avgRent,
        });
      } catch (error) {
        console.error('Error fetching vouchers for stats:', error);
        // Fall back to basic stats without voucher data
        setStats({
          totalProperties: properties.length,
          activeContracts: contracts.filter(c => c.status === 'active').length,
          totalPayments: 0,
          avgRent: contracts.length > 0 
            ? contracts.reduce((sum, c) => sum + c.rent_amount, 0) / contracts.length 
            : 0,
        });
      }

    } catch (error) {
      console.error('Error fetching person details:', error);
      Alert.alert('Error', 'Failed to load person details');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'tenant':
        return theme.colors.primary;
      case 'owner':
        return theme.colors.success;
      case 'manager':
        return theme.colors.tertiary;
      case 'staff':
        return theme.colors.secondary;
      case 'admin':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.success;
      case 'expired':
        return theme.colors.onSurfaceVariant;
      case 'terminated':
        return theme.colors.error;
      case 'renewal':
        return theme.colors.warning;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  if (loading || !person) {
    return (
      <View style={styles.container}>
        <ModernHeader
          title="Person Details"
          showLogo={false}
          onNotificationPress={() => router.push('/notifications')}
          onMenuPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <Text>Loading person details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <View style={styles.headerActions}>
          <IconButton
            icon={() => <Edit size={24} color={theme.colors.onSurface} />}
            onPress={() => router.push(`/people/edit/${person.id}`)}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Person Info */}
        <ModernCard style={styles.infoCard}>
          <View style={styles.personHeader}>
            <Image
              source={{ 
                uri: person.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' 
              }}
              style={styles.avatar}
            />
            <View style={styles.personInfo}>
              <Text style={styles.personName}>
                {person.first_name} {person.last_name}
              </Text>
              <Chip
                mode="flat"
                style={[
                  styles.roleChip,
                  { backgroundColor: `${getRoleColor(person.role)}20` },
                ]}
                textStyle={{ color: getRoleColor(person.role), fontWeight: '600' }}
              >
                {person.role.charAt(0).toUpperCase() + person.role.slice(1)}
              </Chip>
            </View>
          </View>

          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Mail size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.contactText}>{person.email}</Text>
            </View>
            {person.phone_number && (
              <View style={styles.contactRow}>
                <Phone size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.contactText}>{person.phone_number}</Text>
              </View>
            )}
            <View style={styles.contactRow}>
              <Calendar size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.contactText}>
                Joined {new Date(person.created_at).toLocaleDateString('en-US')}
              </Text>
            </View>
          </View>
        </ModernCard>

        {/* Stats */}
        <View style={styles.statsSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsContainer}
          >
            {person.role === 'owner' && (
              <>
                <StatCard
                  title="Properties"
                  value={stats.totalProperties.toString()}
                  color={theme.colors.primary}
                  icon={<Building2 size={20} color={theme.colors.primary} />}
                />
                <StatCard
                  title="Total Value"
                  value={`$${(stats.totalProperties * 250000).toLocaleString()}`}
                  color={theme.colors.success}
                  icon={<DollarSign size={20} color={theme.colors.success} />}
                />
              </>
            )}
            {person.role === 'tenant' && (
              <>
                <StatCard
                  title="Active Contracts"
                  value={stats.activeContracts.toString()}
                  color={theme.colors.primary}
                  icon={<FileText size={20} color={theme.colors.primary} />}
                />
                <StatCard
                  title="Total Payments"
                  value={`$${stats.totalPayments.toLocaleString()}`}
                  color={theme.colors.success}
                  icon={<DollarSign size={20} color={theme.colors.success} />}
                />
                <StatCard
                  title="Avg Rent"
                  value={`$${stats.avgRent.toLocaleString()}`}
                  color={theme.colors.secondary}
                  icon={<DollarSign size={20} color={theme.colors.secondary} />}
                />
              </>
            )}
            <StatCard
              title="Account Age"
              value={`${Math.floor((Date.now() - new Date(person.created_at).getTime()) / (1000 * 60 * 60 * 24))} days`}
              color={theme.colors.tertiary}
              icon={<Calendar size={20} color={theme.colors.tertiary} />}
            />
          </ScrollView>
        </View>

        {/* Properties (for owners) */}
        {person.role === 'owner' && properties.length > 0 && (
          <ModernCard style={styles.listCard}>
            <Text style={styles.sectionTitle}>Properties</Text>
            {properties.slice(0, 3).map((property) => (
              <List.Item
                key={property.id}
                title={property.title}
                description={`${property.address}, ${property.city}`}
                left={() => (
                  <View style={[styles.propertyIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Building2 size={20} color={theme.colors.primary} />
                  </View>
                )}
                right={() => (
                  <Text style={styles.propertyPrice}>
                    ${property.price.toLocaleString()}
                  </Text>
                )}
                onPress={() => router.push(`/properties/${property.id}`)}
                style={styles.listItem}
              />
            ))}
            {properties.length > 3 && (
              <Button
                mode="text"
                onPress={() => router.push(`/properties?owner=${person.id}`)}
                style={styles.viewAllButton}
              >
                View All Properties ({properties.length})
              </Button>
            )}
          </ModernCard>
        )}

        {/* Contracts (for tenants) */}
        {person.role === 'tenant' && contracts.length > 0 && (
          <ModernCard style={styles.listCard}>
            <Text style={styles.sectionTitle}>Contracts</Text>
            {contracts.slice(0, 3).map((contract) => (
              <List.Item
                key={contract.id}
                title={contract.property?.title || 'Property'}
                description={`${contract.property?.address}, ${contract.property?.city}`}
                left={() => (
                  <View style={[styles.contractIcon, { backgroundColor: `${getStatusColor(contract.status)}15` }]}>
                    <FileText size={20} color={getStatusColor(contract.status)} />
                  </View>
                )}
                right={() => (
                  <View style={styles.contractInfo}>
                    <Text style={styles.contractRent}>
                      ${contract.rent_amount.toLocaleString()}
                    </Text>
                    <Chip
                      mode="outlined"
                      style={[styles.statusChip, { borderColor: getStatusColor(contract.status) }]}
                      textStyle={[styles.statusText, { color: getStatusColor(contract.status) }]}
                    >
                      {contract.status}
                    </Chip>
                  </View>
                )}
                onPress={() => router.push(`/contracts/${contract.id}`)}
                style={styles.listItem}
              />
            ))}
            {contracts.length > 3 && (
              <Button
                mode="text"
                onPress={() => router.push(`/contracts?tenant=${person.id}`)}
                style={styles.viewAllButton}
              >
                View All Contracts ({contracts.length})
              </Button>
            )}
          </ModernCard>
        )}

        {/* Quick Actions */}
        <ModernCard style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            {person.role === 'tenant' && (
              <>
                <Button
                  mode="contained"
                  onPress={() => router.push(`/contracts/add?tenant=${person.id}`)}
                  style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                  icon={() => <FileText size={20} color="white" />}
                >
                  New Contract
                </Button>
                <Button
                  mode="contained"
                  onPress={() => router.push(`/finance/vouchers/add?tenant=${person.id}`)}
                  style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                  icon={() => <DollarSign size={20} color="white" />}
                >
                  Add Payment
                </Button>
              </>
            )}
            {person.role === 'owner' && (
              <Button
                mode="contained"
                onPress={() => router.push(`/properties/add?owner=${person.id}`)}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                icon={() => <Building2 size={20} color="white" />}
              >
                Add Property
              </Button>
            )}
            <Button
              mode="outlined"
              onPress={() => router.push(`/messages/new?recipient=${person.id}`)}
              style={styles.actionButton}
              icon={() => <Mail size={20} color={theme.colors.primary} />}
            >
              Send Message
            </Button>
          </View>
        </ModernCard>
      </ScrollView>
    </View>
  );
}

