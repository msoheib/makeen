import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, SafeAreaView } from 'react-native';
import { Text, Searchbar, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { Users, Phone, Mail, MapPin } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import StatCard from '@/components/StatCard';

// Static tenant data to prevent loading issues
const staticTenants = [
  {
    id: '1',
    first_name: 'أحمد',
    last_name: 'السالم',
    email: 'ahmed.salem@example.com',
    phone: '+966501234567',
    status: 'active',
    nationality: 'Saudi',
    is_foreign: false,
    address: 'الرياض، المملكة العربية السعودية',
    property: 'فيلا فاخرة في الرياض',
    rent_amount: 5000,
    contract_end: '2024-12-31'
  },
  {
    id: '2',
    first_name: 'فاطمة',
    last_name: 'الزهراء',
    email: 'fatima.zahra@example.com',
    phone: '+966507654321',
    status: 'active',
    nationality: 'Saudi',
    is_foreign: false,
    address: 'جدة، المملكة العربية السعودية',
    property: 'شقة عصرية في جدة',
    rent_amount: 4000,
    contract_end: '2024-11-30'
  },
  {
    id: '3',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@example.com',
    phone: '+966509876543',
    status: 'pending',
    nationality: 'American',
    is_foreign: true,
    address: 'الدمام، المملكة العربية السعودية',
    property: 'مكتب تجاري في الدمام',
    rent_amount: 6000,
    contract_end: '2025-06-30'
  }
];

// Static stats
const staticStats = {
  total: '٣',
  active: '٢',
  pending: '١',
  foreign: '١'
};

export default function TenantsScreen() {
  const router = useRouter();
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tenants based on search
  const filteredTenants = staticTenants.filter(tenant => {
    const fullName = `${tenant.first_name} ${tenant.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) ||
           tenant.email.toLowerCase().includes(query) ||
           tenant.phone.includes(query) ||
           tenant.property.toLowerCase().includes(query);
  });

  const renderTenant = ({ item }: { item: any }) => (
    <View style={[styles.tenantCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.tenantHeader}>
        <View style={styles.tenantInfo}>
          <Avatar.Text
            size={60}
            label={`${item.first_name[0]}${item.last_name[0]}`}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.primary }}
          />
          <View style={styles.tenantDetails}>
            <Text style={[styles.tenantName, { color: theme.colors.onSurface }]}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={[styles.tenantNationality, { color: theme.colors.onSurfaceVariant }]}>
              {item.is_foreign ? `🌍 ${item.nationality}` : `🇸🇦 ${item.nationality}`}
            </Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          {
            backgroundColor: item.status === 'active'
              ? theme.colors.secondaryContainer
              : theme.colors.warningContainer
          }
        ]}>
          <Text style={[
            styles.statusText,
            {
              color: item.status === 'active'
                ? theme.colors.secondary
                : theme.colors.warning
            }
          ]}>
            {item.status === 'active' ? 'نشط' : 'معلق'}
          </Text>
        </View>
      </View>

      <View style={styles.contactInfo}>
        <View style={styles.contactItem}>
          <Mail size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.contactText, { color: theme.colors.onSurfaceVariant }]}>
            {item.email}
          </Text>
        </View>
        <View style={styles.contactItem}>
          <Phone size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.contactText, { color: theme.colors.onSurfaceVariant }]}>
            {item.phone}
          </Text>
        </View>
        <View style={styles.contactItem}>
          <MapPin size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.contactText, { color: theme.colors.onSurfaceVariant }]}>
            {item.address}
          </Text>
        </View>
      </View>

      <View style={styles.propertyInfo}>
        <Text style={[styles.propertyLabel, { color: theme.colors.onSurfaceVariant }]}>
          العقار المؤجر:
        </Text>
        <Text style={[styles.propertyText, { color: theme.colors.onSurface }]}>
          {item.property}
        </Text>
      </View>

      <View style={styles.rentInfo}>
        <View style={styles.rentItem}>
          <Text style={[styles.rentLabel, { color: theme.colors.onSurfaceVariant }]}>
            الإيجار الشهري
          </Text>
          <Text style={[styles.rentAmount, { color: theme.colors.primary }]}>
            {item.rent_amount.toLocaleString('ar-SA')} ريال
          </Text>
        </View>
        <View style={styles.rentItem}>
          <Text style={[styles.rentLabel, { color: theme.colors.onSurfaceVariant }]}>
            انتهاء العقد
          </Text>
          <Text style={[styles.rentDate, { color: theme.colors.onSurface }]}>
            {item.contract_end}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="المستأجرين" 
        showNotifications={true}
        showMenu={true}
        variant="dark"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            إحصائيات المستأجرين
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCardWrapper}>
              <StatCard
                title="إجمالي المستأجرين"
                value={staticStats.total}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.statCardWrapper}>
              <StatCard
                title="مستأجرين نشطين"
                value={staticStats.active}
                color="#4CAF50"
              />
            </View>
            <View style={styles.statCardWrapper}>
              <StatCard
                title="مستأجرين معلقين"
                value={staticStats.pending}
                color="#FF9800"
              />
            </View>
            <View style={styles.statCardWrapper}>
              <StatCard
                title="مستأجرين أجانب"
                value={staticStats.foreign}
                color={theme.colors.secondary}
              />
            </View>
          </View>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="البحث في المستأجرين..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
            iconColor={theme.colors.onSurfaceVariant}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>

        {/* Tenants List */}
        <View style={styles.tenantsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            قائمة المستأجرين ({filteredTenants.length})
          </Text>
          
          {filteredTenants.length > 0 ? (
            <FlatList
              data={filteredTenants}
              renderItem={renderTenant}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
              <Users size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurface }]}>
                لا توجد مستأجرين
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {searchQuery ? 'جرب البحث بكلمات أخرى' : 'ابدأ بإضافة مستأجر جديد'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchbar: {
    borderRadius: 12,
    elevation: 2,
  },
  tenantsSection: {
    marginBottom: 24,
  },
  tenantCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tenantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tenantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tenantDetails: {
    marginLeft: 12,
    flex: 1,
  },
  tenantName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
  tenantNationality: {
    fontSize: 14,
    marginTop: 2,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contactInfo: {
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 14,
    marginLeft: 8,
    textAlign: 'right',
    flex: 1,
  },
  propertyInfo: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  propertyLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'right',
  },
  propertyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  rentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  rentItem: {
    alignItems: 'center',
  },
  rentLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  rentAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  rentDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  statCardWrapper: {
    width: '48%',
    minHeight: 120,
  },
});