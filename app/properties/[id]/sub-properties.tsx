import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Avatar, FAB, Card, Button, Chip, IconButton } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { lightTheme, darkTheme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { getFlexDirection } from '@/lib/rtl';
import { isRTL } from '@/lib/i18n';
import { Building, Plus, MapPin, Users, FileText, Phone, Clock, DollarSign, Edit, Trash2 } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import { useApi } from '@/hooks/useApi';
import { subPropertiesApi, propertiesApi } from '@/lib/api';
import { formatDisplayNumber } from '@/lib/formatters';
import AddSubPropertyForm from '@/components/AddSubPropertyForm';

export default function SubPropertiesScreen() {
  const { id: propertyId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // State
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // API hooks
  const { 
    data: parentProperty, 
    loading: parentLoading, 
    error: parentError 
  } = useApi(() => propertiesApi.getById(propertyId!), [propertyId]);

  const { 
    data: subProperties, 
    loading: subPropertiesLoading, 
    error: subPropertiesError, 
    refetch: refetchSubProperties 
  } = useApi(() => subPropertiesApi.getByParentProperty(propertyId!), [propertyId]);

  // Computed values
  const isLoading = parentLoading || subPropertiesLoading;
  const hasError = !!parentError || !!subPropertiesError;
  const subPropertiesData = subProperties || [];
  
  // Callbacks
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchSubProperties();
    setRefreshing(false);
  }, [refetchSubProperties]);

  const handleAddSuccess = useCallback(() => {
    setShowAddForm(false);
    refetchSubProperties();
  }, [refetchSubProperties]);

  const handleDeleteSubProperty = useCallback(async (subPropertyId: string, title: string) => {
    Alert.alert(
      'Delete Sub-Property',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await subPropertiesApi.delete(subPropertyId);
              if (result.error) {
                Alert.alert('Error', result.error.message);
              } else {
                Alert.alert('Success', 'Sub-property deleted successfully');
                refetchSubProperties();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete sub-property');
            }
          }
        }
      ]
    );
  }, [refetchSubProperties]);

  // Render item function
  const renderSubPropertyItem = useCallback(({ item: subProperty }: { item: any }) => (
    <Card style={[styles.subPropertyCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        {/* Header */}
        <View style={[styles.cardHeader, { flexDirection: getFlexDirection('row') }]}>
          <View style={styles.cardMainInfo}>
            <Avatar.Text
              size={50}
              label={subProperty.title?.[0]?.toUpperCase() || 'S'}
              style={[styles.propertyAvatar, { backgroundColor: theme.colors.primary }]}
              labelStyle={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
            />
            <View style={styles.propertyInfoContainer}>
              <Text style={[styles.propertyTitle, { color: theme.colors.onSurface }]}>
                {subProperty.title}
              </Text>
              <View style={[styles.propertyMeta, { flexDirection: getFlexDirection('row') }]}>
                <Chip 
                  icon={Building} 
                  mode="outlined" 
                  style={styles.typeChip}
                  textStyle={{ color: theme.colors.onSurfaceVariant }}
                >
                  {subProperty.property_type}
                </Chip>
                <Chip 
                  mode="outlined" 
                  style={[styles.statusChip, { 
                    backgroundColor: subProperty.status === 'available' ? '#4CAF5020' : '#FF952020',
                    borderColor: subProperty.status === 'available' ? '#4CAF50' : '#FF9520'
                  }]}
                  textStyle={{ 
                    color: subProperty.status === 'available' ? '#4CAF50' : '#FF9520' 
                  }}
                >
                  {subProperty.status}
                </Chip>
              </View>
            </View>
          </View>
          
          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <IconButton
              icon={Edit}
              size={20}
              onPress={() => router.push(`/properties/${subProperty.id}/edit`)}
              iconColor={theme.colors.primary}
            />
            <IconButton
              icon={Trash2}
              size={20}
              onPress={() => handleDeleteSubProperty(subProperty.id, subProperty.title)}
              iconColor={theme.colors.error}
            />
          </View>
        </View>

        {/* Property Details */}
        <View style={styles.propertyDetails}>
          <View style={[styles.detailRow, { flexDirection: getFlexDirection('row') }]}>
            <MapPin size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
              Floor {subProperty.floor_number || 'N/A'} • Unit {subProperty.unit_number || 'N/A'}
            </Text>
          </View>
          
          <View style={[styles.detailRow, { flexDirection: getFlexDirection('row') }]}>
            <Building size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
              {subProperty.area_sqm} sqm • {subProperty.bedrooms || 0} BR • {subProperty.bathrooms || 0} BA
            </Text>
          </View>
        </View>

        {/* Contract Information */}
        {subProperty.contracts && subProperty.contracts.length > 0 && (
          <View style={styles.contractInfo}>
            <Text style={[styles.contractTitle, { color: theme.colors.onSurface }]}>
              Contract Details
            </Text>
            <View style={styles.contractDetails}>
              <View style={[styles.contractRow, { flexDirection: getFlexDirection('row') }]}>
                <FileText size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.contractText, { color: theme.colors.onSurfaceVariant }]}>
                  {subProperty.contracts[0].contract_number}
                </Text>
              </View>
              
              <View style={[styles.contractRow, { flexDirection: getFlexDirection('row') }]}>
                <DollarSign size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.contractText, { color: theme.colors.onSurfaceVariant }]}>
                  Base: {formatDisplayNumber(subProperty.contracts[0].base_price)} SAR
                </Text>
              </View>
              
              <View style={[styles.contractRow, { flexDirection: getFlexDirection('row') }]}>
                <Clock size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.contractText, { color: theme.colors.onSurfaceVariant }]}>
                  {subProperty.contracts[0].payment_frequency} • {subProperty.contracts[0].contract_duration_years} years
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Meter Information */}
        {subProperty.property_meters && subProperty.property_meters.length > 0 && (
          <View style={styles.meterInfo}>
            <Text style={[styles.meterTitle, { color: theme.colors.onSurface }]}>
              Meter Numbers
            </Text>
            <View style={styles.meterChips}>
              {subProperty.property_meters.map((meter: any, index: number) => (
                <Chip 
                  key={meter.id} 
                  mode="outlined" 
                  style={styles.meterChip}
                  textStyle={{ color: theme.colors.onSurfaceVariant }}
                >
                  {meter.meter_number}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* Contact Information */}
        {subProperty.property_contacts && subProperty.property_contacts.length > 0 && (
          <View style={styles.contactInfo}>
            <Text style={[styles.contactTitle, { color: theme.colors.onSurface }]}>
              Contact Numbers
            </Text>
            <View style={styles.contactChips}>
              {subProperty.property_contacts.map((contact: any, index: number) => (
                <Chip 
                  key={contact.id} 
                  icon={Phone} 
                  mode="outlined" 
                  style={[styles.contactChip, { 
                    backgroundColor: contact.is_primary ? `${theme.colors.primary}20` : 'transparent',
                    borderColor: contact.is_primary ? theme.colors.primary : theme.colors.outline
                  }]}
                  textStyle={{ 
                    color: contact.is_primary ? theme.colors.primary : theme.colors.onSurfaceVariant 
                  }}
                >
                  {contact.phone_number}
                </Chip>
              ))}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  ), [theme.colors, router, handleDeleteSubProperty]);

  // Early returns
  if (!propertyId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Sub-Properties" showBack={true} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Property ID is required
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="Sub-Properties" showBack={true} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Failed to load property information
          </Text>
          <Text style={[styles.errorDetails, { color: theme.colors.onSurfaceVariant }]}>
            {parentError?.message || subPropertiesError?.message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showAddForm) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title="Add Sub-Property" 
          showBack={true}
          onBackPress={() => setShowAddForm(false)}
        />
        <AddSubPropertyForm
          parentPropertyId={propertyId}
          parentPropertyTitle={parentProperty?.title || 'Property'}
          onSuccess={handleAddSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="Sub-Properties" 
        showBack={true}
        subtitle={parentProperty?.title}
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading sub-properties...
          </Text>
        </View>
      ) : (
        <>
          {/* Summary Section */}
          <View style={styles.summarySection}>
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Total Sub-Properties
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                    {subPropertiesData.length}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Available
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                    {subPropertiesData.filter((p: any) => p.status === 'available').length}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Rented
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#FF9520' }]}>
                    {subPropertiesData.filter((p: any) => p.status === 'rented').length}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sub-Properties List */}
          <FlatList
            data={subPropertiesData}
            keyExtractor={(item) => item.id}
            renderItem={renderSubPropertyItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                progressBackgroundColor={theme.colors.surface}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                <Building size={64} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.emptyStateText, { color: theme.colors.onSurfaceVariant }]}>
                  No sub-properties found
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.onSurfaceVariant }]}>
                  Start by adding your first sub-property to this building
                </Text>
              </View>
            }
          />
        </>
      )}

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon={() => <Plus size={24} color="white" />}
        onPress={() => setShowAddForm(true)}
      />
    </SafeAreaView>
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
    padding: spacing.l,
  },
  loadingText: {
    fontSize: 16,
    marginTop: spacing.m,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  errorDetails: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  summarySection: {
    padding: spacing.m,
  },
  summaryCard: {
    borderRadius: 12,
    padding: spacing.m,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  flatListContainer: {
    padding: spacing.m,
    paddingBottom: 80,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.m,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.s,
    lineHeight: 20,
  },
  subPropertyCard: {
    marginBottom: spacing.m,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cardHeader: {
    alignItems: 'flex-start',
    marginBottom: spacing.m,
  },
  cardMainInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyAvatar: {
    marginRight: spacing.m,
  },
  propertyInfoContainer: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.s,
  },
  propertyMeta: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  typeChip: {
    marginRight: spacing.s,
  },
  statusChip: {
    marginLeft: spacing.s,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  propertyDetails: {
    marginBottom: spacing.m,
  },
  detailRow: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: spacing.s,
  },
  detailText: {
    fontSize: 14,
    marginLeft: spacing.s,
  },
  contractInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: spacing.m,
    marginBottom: spacing.m,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.s,
  },
  contractDetails: {
    gap: spacing.s,
  },
  contractRow: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  contractText: {
    fontSize: 14,
    marginLeft: spacing.s,
  },
  meterInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: spacing.m,
    marginBottom: spacing.m,
  },
  meterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.s,
  },
  meterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  meterChip: {
    marginBottom: spacing.s,
  },
  contactInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: spacing.m,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.s,
  },
  contactChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  contactChip: {
    marginBottom: spacing.s,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});




