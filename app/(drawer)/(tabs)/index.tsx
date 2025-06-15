import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Home,
  AlertCircle,
  Calendar,
  FileText,
  Shield,
  Lock
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import RentCard from '@/components/RentCard';
import CashflowCard from '@/components/CashflowCard';
import StatCard from '@/components/StatCard';
import { useApi } from '@/hooks/useApi';
import { propertiesApi, profilesApi, contractsApi } from '@/lib/api';
import { useScreenAccess } from '@/lib/permissions';

// Static data to prevent loading issues
const staticData = {
  financialSummary: {
    totalIncome: 125000,
    totalExpenses: 45000,
    netProfit: 80000,
    profitMargin: 35
  },
  propertyStats: {
    totalProperties: 20,
    occupied: 17,
    vacant: 2,
    maintenance: 1,
    occupancyRate: 85
  },
  tenantStats: {
    totalTenants: 17,
    activeTenants: 15,
    pendingPayments: 3,
    expiringContracts: 2
  },
  recentActivities: [
    {
      id: '1',
      type: 'payment',
      title: 'دفعة إيجار شهرية',
      description: 'أحمد السالم - فيلا الرياض',
      amount: 5000,
      date: '2024-12-20',
      status: 'completed'
    },
    {
      id: '2',
      type: 'maintenance',
      title: 'طلب صيانة',
      description: 'إصلاح مكيف الهواء - شقة جدة',
      amount: 800,
      date: '2024-12-19',
      status: 'pending'
    },
    {
      id: '3',
      type: 'contract',
      title: 'عقد جديد',
      description: 'John Smith - مكتب الدمام',
      amount: 6000,
      date: '2024-12-18',
      status: 'active'
    }
  ]
};

export default function DashboardScreen() {
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Check if user has access to dashboard
  const { hasAccess: canAccessDashboard, loading: permissionLoading, userContext } = useScreenAccess('dashboard');

  // API calls for real-time data (with role-based filtering)
  const { 
    data: dashboardSummary, 
    loading: summaryLoading, 
    error: summaryError, 
    refetch: refetchSummary 
  } = useApi(() => propertiesApi.getDashboardSummary(), []);

  const { 
    data: properties, 
    loading: propertiesLoading, 
    refetch: refetchProperties 
  } = useApi(() => propertiesApi.getAll(), []);

  const { 
    data: tenants, 
    loading: tenantsLoading, 
    refetch: refetchTenants 
  } = useApi(() => profilesApi.getTenants(), []);

  // Loading state
  const isLoading = permissionLoading || summaryLoading || propertiesLoading || tenantsLoading;

  // Handle refresh
  const [refreshing, setRefreshing] = React.useState(false);
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchSummary(),
      refetchProperties(),
      refetchTenants()
    ]);
    setRefreshing(false);
  }, [refetchSummary, refetchProperties, refetchTenants]);

  // Show loading state while checking permissions
  if (permissionLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="لوحة التحكم" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // DEBUG: Show user context for troubleshooting
  console.log('[Dashboard Debug] User Context:', {
    hasAccess: canAccessDashboard,
    userContext: userContext,
    isAuthenticated: userContext?.isAuthenticated,
    role: userContext?.role,
    userId: userContext?.userId
  });

  // If user doesn't have dashboard access, show access denied
  if (!canAccessDashboard) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="لوحة التحكم" />
        <View style={styles.accessDeniedContainer}>
          <Lock size={64} color="#ccc" />
          <Text style={[styles.accessDeniedText, { color: theme.colors.onSurfaceVariant }]}>
            Access Denied
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}>
            You don't have permission to view the dashboard
          </Text>
          {/* DEBUG: Show role information */}
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
            Current Role: {userContext?.role || 'None'}
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}>
            Authenticated: {userContext?.isAuthenticated ? 'Yes' : 'No'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate real-time statistics from API data
  const propertiesData = properties?.data || [];
  const tenantsData = tenants?.data || [];
  
  const propertyStats = {
    totalProperties: propertiesData.length,
    occupied: propertiesData.filter(p => p.status === 'rented').length,
    vacant: propertiesData.filter(p => p.status === 'available').length,
    maintenance: propertiesData.filter(p => p.status === 'maintenance').length,
    occupancyRate: propertiesData.length > 0 ? Math.round((propertiesData.filter(p => p.status === 'rented').length / propertiesData.length) * 100) : 0
  };
  
  const tenantStats = {
    totalTenants: tenantsData.length,
    activeTenants: tenantsData.filter(t => t.status === 'active').length,
    pendingPayments: Math.floor(tenantsData.length * 0.2), // TODO: Calculate from actual payment data
    expiringContracts: Math.floor(tenantsData.length * 0.1) // TODO: Calculate from actual contract data
  };

  // Use API data or fallback to summary data
  const financialSummary = dashboardSummary?.data || {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0
  };

  const renderQuickStats = () => (
    <View style={styles.quickStatsSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        الإحصائيات السريعة
      </Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCardWrapper}>
          <StatCard
            title="إجمالي العقارات"
            value={propertyStats.totalProperties.toString()}
            color={theme.colors.primary}
            icon={<Building2 size={20} color={theme.colors.primary} />}
            loading={isLoading}
          />
        </View>
        <View style={styles.statCardWrapper}>
          <StatCard
            title="العقارات المشغولة"
            value={propertyStats.occupied.toString()}
            color="#4CAF50"
            icon={<Home size={20} color="#4CAF50" />}
            loading={isLoading}
          />
        </View>
        <View style={styles.statCardWrapper}>
          <StatCard
            title="إجمالي المستأجرين"
            value={tenantStats.totalTenants.toString()}
            color={theme.colors.secondary}
            icon={<Users size={20} color={theme.colors.secondary} />}
            loading={isLoading}
          />
        </View>
        <View style={styles.statCardWrapper}>
          <StatCard
            title="العقود المنتهية قريباً"
            value={tenantStats.expiringContracts.toString()}
            color="#FF9800"
            icon={<AlertCircle size={20} color="#FF9800" />}
            loading={isLoading}
          />
        </View>
      </View>
    </View>
  );

  const renderFinancialCards = () => (
    <View style={styles.financialSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        الملخص المالي
      </Text>
      <View style={styles.financialCards}>
        <RentCard 
          totalRent={financialSummary.totalIncome}
          collectedRent={Math.floor(financialSummary.totalIncome * 0.9)}
          pendingRent={Math.floor(financialSummary.totalIncome * 0.1)}
          theme={theme}
          loading={isLoading}
        />
        <CashflowCard
          income={financialSummary.totalIncome}
          expenses={financialSummary.totalExpenses}
          netIncome={financialSummary.netProfit}
          theme={theme}
          loading={isLoading}
        />
      </View>
    </View>
  );

  const renderPropertyOverview = () => (
    <View style={styles.propertySection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        نظرة عامة على العقارات
      </Text>
      <View style={[styles.propertyOverviewCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.propertyRow}>
          <View style={styles.propertyItem}>
            <View style={[styles.propertyIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Building2 size={24} color={theme.colors.primary} />
            </View>
            <Text style={[styles.propertyLabel, { color: theme.colors.onSurfaceVariant }]}>
              مشغولة
            </Text>
            <Text style={[styles.propertyValue, { color: theme.colors.onSurface }]}>
              {isLoading ? '...' : propertyStats.occupied}
            </Text>
          </View>
          
          <View style={styles.propertyItem}>
            <View style={[styles.propertyIcon, { backgroundColor: '#4CAF5020' }]}>
              <Home size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.propertyLabel, { color: theme.colors.onSurfaceVariant }]}>
              شاغرة
            </Text>
            <Text style={[styles.propertyValue, { color: theme.colors.onSurface }]}>
              {isLoading ? '...' : propertyStats.vacant}
            </Text>
          </View>
          
          <View style={styles.propertyItem}>
            <View style={[styles.propertyIcon, { backgroundColor: '#FF980020' }]}>
              <AlertCircle size={24} color="#FF9800" />
            </View>
            <Text style={[styles.propertyLabel, { color: theme.colors.onSurfaceVariant }]}>
              صيانة
            </Text>
            <Text style={[styles.propertyValue, { color: theme.colors.onSurface }]}>
              {isLoading ? '...' : propertyStats.maintenance}
            </Text>
          </View>
        </View>
        
        <View style={styles.occupancyRate}>
          <Text style={[styles.occupancyLabel, { color: theme.colors.onSurfaceVariant }]}>
            معدل الإشغال
          </Text>
          <Text style={[styles.occupancyValue, { color: theme.colors.primary }]}>
            {isLoading ? '...' : propertyStats.occupancyRate}%
          </Text>
        </View>
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.activitySection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        النشاطات الأخيرة
      </Text>
      {staticData.recentActivities.map((activity) => (
        <View key={activity.id} style={[styles.activityCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.activityHeader}>
            <View style={styles.activityInfo}>
              <View style={[
                styles.activityIcon,
                {
                  backgroundColor: activity.type === 'payment' 
                    ? '#4CAF5020'
                    : activity.type === 'maintenance'
                    ? '#FF980020'
                    : '#2196F320'
                }
              ]}>
                {activity.type === 'payment' && <DollarSign size={20} color="#4CAF50" />}
                {activity.type === 'maintenance' && <AlertCircle size={20} color="#FF9800" />}
                {activity.type === 'contract' && <FileText size={20} color="#2196F3" />}
              </View>
              <View style={styles.activityDetails}>
                <Text style={[styles.activityTitle, { color: theme.colors.onSurface }]}>
                  {activity.title}
                </Text>
                <Text style={[styles.activityDescription, { color: theme.colors.onSurfaceVariant }]}>
                  {activity.description}
                </Text>
              </View>
            </View>
            <View style={styles.activityRight}>
              <Text style={[styles.activityAmount, { color: theme.colors.primary }]}>
                {activity.amount.toLocaleString('ar-SA')} ريال
              </Text>
              <Text style={[styles.activityDate, { color: theme.colors.onSurfaceVariant }]}>
                {activity.date}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="لوحة التحكم" 
        subtitle="مرحباً بك في نظام إدارة العقارات"
        showNotifications={true}
        showMenu={true}
        variant="dark"
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {renderQuickStats()}
        {renderFinancialCards()}
        {renderPropertyOverview()}
        {renderRecentActivity()}
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
  quickStatsSection: {
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
  financialSection: {
    marginBottom: 24,
  },
  financialCards: {
    gap: 16,
  },
  propertySection: {
    marginBottom: 24,
  },
  propertyOverviewCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  propertyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  propertyItem: {
    alignItems: 'center',
  },
  propertyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  propertyValue: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  occupancyRate: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  occupancyLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  occupancyValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  activitySection: {
    marginBottom: 24,
  },
  activityCard: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    textAlign: 'right',
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 11,
  },
  statCardWrapper: {
    width: '48%',
    minHeight: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  accessDeniedText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  accessDeniedSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});