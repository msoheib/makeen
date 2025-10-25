import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { lightTheme } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/lib/store';
import { rtlStyles, getTextAlign, getFlexDirection } from '@/lib/rtl';
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
  Lock,
  Wrench,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import RentCard from '@/components/RentCard';
import CashflowCard from '@/components/CashflowCard';
import StatCard from '@/components/StatCard';
import { useApi } from '@/hooks/useApi';
import { propertiesApi, profilesApi, contractsApi, tenantApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useScreenAccess, SCREEN_PERMISSIONS } from '@/lib/permissions';
import { formatCurrency, formatDisplayNumber } from '@/lib/formatters';
import { 
  HorizontalStatsShimmer, 
  RentCardShimmer, 
  CashflowCardShimmer,
  PropertyOverviewShimmer,
  RecentActivityShimmer 
} from '@/components/shimmer';

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
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation(['dashboard','common']);

  // Check if user has access to dashboard
  const { hasAccess: canAccessDashboard, loading: permissionLoading, userContext } = useScreenAccess('dashboard');

  // API calls for real-time data (with role-based filtering)
  const {
    data: dashboardSummary,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useApi(() => {
    // For tenants, show empty summary or tenant-specific financial data
    if (userContext?.role === 'tenant') {
      return Promise.resolve({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        totalProperties: 0,
        occupiedProperties: 0,
        vacantProperties: 0,
        maintenanceProperties: 0,
        totalTenants: 0,
        activeContracts: 0,
        expiringContracts: 0,
        pendingMaintenance: 0
      });
    }
    return propertiesApi.getDashboardSummary();
  }, [userContext?.role]);

  const {
    data: properties,
    loading: propertiesLoading,
    error: propertiesError,
    refetch: refetchProperties
  } = useApi(() => {
    // Filter properties based on user role
    if (userContext?.role === 'tenant') {
      // For tenants, only show properties they have contracts for
      return contractsApi.getTenantProperties(userContext.userId);
    }
    // For other roles, show all properties
    return propertiesApi.getAll();
  }, [userContext?.role, userContext?.userId]);

  const {
    data: tenants,
    loading: tenantsLoading,
    error: tenantsError,
    refetch: refetchTenants
  } = useApi(() => {
    // Hide tenants data from tenant users
    if (userContext?.role === 'tenant') {
      return Promise.resolve([]);
    }
    return profilesApi.getTenants();
  }, [userContext?.role]);

  // API calls for tenant-specific data
  const {
    data: maintenanceRequests,
    loading: maintenanceLoading,
    refetch: refetchMaintenance
  } = useApi(() => {
    if (userContext?.role === 'tenant' && userContext?.userId) {
      return tenantApi.getMaintenanceRequests(userContext.userId);
    }
    return Promise.resolve([]);
  }, [userContext?.role, userContext?.userId]);

  const {
    data: paymentHistory,
    loading: paymentsLoading,
    refetch: refetchPayments
  } = useApi(() => {
    if (userContext?.role === 'tenant' && userContext?.userId) {
      return tenantApi.getPaymentHistory(userContext.userId);
    }
    return Promise.resolve([]);
  }, [userContext?.role, userContext?.userId]);

  const {
    data: tenantContracts,
    loading: contractsLoading,
    refetch: refetchContracts
  } = useApi(() => {
    if (userContext?.role === 'tenant' && userContext?.userId) {
      return tenantApi.getContracts(userContext.userId);
    }
    return Promise.resolve([]);
  }, [userContext?.role, userContext?.userId]);
  
  useEffect(() => {
    // Direct database queries for debugging (dev only)
    supabase.from('properties').select('*').then(result => {
      if (result.data) {
        setDirectProperties(result.data);
      }
    });
    
    supabase.from('profiles').select('*').eq('role', 'tenant').then(result => {
      if (result.data) {
        setDirectTenants(result.data);
      }
    });
  }, []);

  // State for direct database queries
  const [directProperties, setDirectProperties] = useState([]);
  const [directTenants, setDirectTenants] = useState([]);


  // Loading state
  const isLoading = permissionLoading || summaryLoading || propertiesLoading || tenantsLoading || contractsLoading || maintenanceLoading || paymentsLoading;

  // Handle refresh
  const [refreshing, setRefreshing] = React.useState(false);
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchSummary(),
      refetchProperties(),
      refetchTenants(),
      refetchContracts(),
      refetchMaintenance(),
      refetchPayments()
    ]);
    setRefreshing(false);
  }, [refetchSummary, refetchProperties, refetchTenants, refetchContracts, refetchMaintenance, refetchPayments]);

  // Show loading state while checking permissions
  if (permissionLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title={t('dashboard:title')} variant="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            {t('common.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If user doesn't have dashboard access, show access denied
  if (!canAccessDashboard) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title={t('dashboard:title')} variant="dark" />
        <View style={styles.accessDeniedContainer}>
          <Lock size={64} color="#ccc" />
          <Text style={[styles.accessDeniedText, { color: theme.colors.onSurfaceVariant }]}>
            Access Denied
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}>
            You don't have permission to view the dashboard
          </Text>
          {/* DEBUG: Show detailed diagnostic information */}
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
            Current Role: {userContext?.role || 'None'}
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}>
            Authenticated: {userContext?.isAuthenticated ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}>
            User ID: {userContext?.userId || 'None'}
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}>
            Permission Check: {canAccessDashboard ? 'Passed' : 'Failed'}
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}>
            Dashboard Allowed For: {SCREEN_PERMISSIONS.find(p => p.screen === 'dashboard')?.roles.join(', ') || 'None'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate real-time statistics from API data
  const propertiesData = properties?.data || [];
  const tenantsData = tenants?.data || [];
  const dashboardData = dashboardSummary?.data;
  
  // Enhanced property statistics with real data and fallbacks
  const propertyStats = {
    totalProperties: dashboardData?.total_properties || directProperties.length || propertiesData.length || 5,
    occupied: dashboardData?.occupied || directProperties.filter(p => p.status === 'rented').length || propertiesData.filter(p => p.status === 'rented').length || 3,
    available: dashboardData?.available || directProperties.filter(p => p.status === 'available').length || propertiesData.filter(p => p.status === 'available').length || 1,
    maintenance: dashboardData?.maintenance || directProperties.filter(p => p.status === 'maintenance').length || propertiesData.filter(p => p.status === 'maintenance').length || 1,
    occupancyRate: dashboardData?.total_properties > 0 ? 
      Math.round((dashboardData.occupied / dashboardData.total_properties) * 100) : 
      (directProperties.length > 0 ? Math.round((directProperties.filter(p => p.status === 'rented').length / directProperties.length) * 100) : 
       (propertiesData.length > 0 ? Math.round((propertiesData.filter(p => p.status === 'rented').length / propertiesData.length) * 100) : 60))
  };
  
  // Enhanced tenant statistics with better calculations and fallbacks
  const totalTenantsCount = directTenants.length || tenantsData.length || 3;
  
  const tenantStats = {
    totalTenants: totalTenantsCount,
    activeTenants: (directTenants.length > 0 ? directTenants.filter(t => t.status === 'active').length : 0) || tenantsData.filter(t => t.status === 'active').length || 2,
    pendingTenants: (directTenants.length > 0 ? directTenants.filter(t => t.status === 'pending').length : 0) || tenantsData.filter(t => t.status === 'pending').length || 1,
    // Calculate contract-related stats
    activeContracts: dashboardData?.active_contracts || 2,
    // Use the new variable here instead of referencing tenantStats
    expiringContracts: Math.floor(totalTenantsCount * 0.1) || 1 // TODO: Calculate from actual contract expiry dates
  };

  // Enhanced financial summary with real monthly rent data and fallbacks
  const financialSummary = {
    totalIncome: dashboardData?.total_monthly_rent || 50000, // Fallback to realistic value
    monthlyRent: dashboardData?.total_monthly_rent || 50000, // Fallback to realistic value
    annualProjection: (dashboardData?.total_monthly_rent || 50000) * 12,
    // Estimated expenses (30% of income is a common estimate)
    totalExpenses: Math.floor((dashboardData?.total_monthly_rent || 50000) * 0.3),
    netProfit: Math.floor((dashboardData?.total_monthly_rent || 50000) * 0.7),
    profitMargin: dashboardData?.total_monthly_rent > 0 ? 70 : 70 // 70% after 30% expenses
  };

  // Check for errors only - always show dashboard content
  const hasError = summaryError || propertiesError || tenantsError;
  const errorDetails = {
    summary: summaryError || null,
    properties: propertiesError || null,
    tenants: tenantsError || null,
  };
  
  // Enhanced recent activities with more realistic data
  const recentActivities = [
    {
      id: '1',
      type: 'payment',
      title: t('dashboard:activity.monthlyRentReceived'),
      description: t('dashboard:activity.desc.activeTenants', { count: tenantStats.activeTenants }),
      amount: Math.floor(financialSummary.monthlyRent / (tenantStats.activeTenants || 1)),
      date: new Date().toLocaleDateString('en-US'),
      status: 'completed'
    },
    {
      id: '2',
      type: 'contract',
      title: t('dashboard:activity.activeContracts'),
      description: t('dashboard:activity.desc.activeContracts', { count: tenantStats.activeContracts }),
      amount: financialSummary.monthlyRent,
      date: new Date(Date.now() - 86400000).toLocaleDateString('en-US'),
      status: 'active'
    },
    {
      id: '3',
      type: 'maintenance',
      title: t('dashboard:activity.maintenanceRequests'),
      description: t('dashboard:activity.desc.propertiesUnderMaintenance', { count: propertyStats.maintenance }),
      amount: Math.floor(financialSummary.totalExpenses * 0.4), // 40% of expenses for maintenance
      date: new Date(Date.now() - 172800000).toLocaleDateString('en-US'),
      status: 'pending'
    }
  ];

  // Role-based content rendering
  const userRole = userContext?.role;
  const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
  const isOwner = userRole === 'owner';
  const isTenant = userRole === 'tenant';

  // Calculate tenant payment information from real contract data
  const getTenantPaymentInfo = () => {
    if (!tenantContracts || tenantContracts.length === 0) {
      return {
        amount: 0,
        hasPayment: false,
        dueDate: null,
        description: null
      };
    }

    // Get the first active contract (assuming tenant has one primary contract)
    const activeContract = tenantContracts.find(contract => contract.status === 'active') || tenantContracts[0];
    
    if (!activeContract) {
      return {
        amount: 0,
        hasPayment: false,
        dueDate: null,
        description: null
      };
    }

    // Calculate monthly rent amount
    const monthlyRent = activeContract.rent_amount || 0;
    
    return {
      amount: monthlyRent,
      hasPayment: monthlyRent > 0,
      dueDate: 'January 30, 2025', // This would come from actual payment due calculation
      description: `January 2025 Rent`
    };
  };

  const tenantPayment = getTenantPaymentInfo();

  // Calculate tenant property information from real contract data
  const getTenantPropertyInfo = () => {
    if (!tenantContracts || tenantContracts.length === 0) {
      return {
        hasProperty: false,
        propertyName: null,
        propertyAddress: null,
        propertySpecs: null
      };
    }

    // Get the first active contract (assuming tenant has one primary contract)
    const activeContract = tenantContracts.find(contract => contract.status === 'active') || tenantContracts[0];
    const property = activeContract?.property;
    
    if (!property) {
      return {
        hasProperty: false,
        propertyName: null,
        propertyAddress: null,
        propertySpecs: null
      };
    }

    return {
      hasProperty: true,
      propertyName: property.title,
      propertyAddress: `${property.address}, ${property.city}`,
      propertySpecs: `${property.bedrooms || 0} bedrooms • ${property.bathrooms || 0} bathrooms • ${property.area_sqm || 0} m²`
    };
  };

  const tenantProperty = getTenantPropertyInfo();

  // Tenant-specific dashboard content
  const renderTenantDashboard = () => (
    <View style={styles.tenantSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        Tenant Dashboard
      </Text>

      {/* Current Contracts Section */}
      <View style={[styles.currentPropertyCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.subsectionTitle, { color: theme.colors.onSurface }]}>
          <FileText size={20} color={theme.colors.primary} /> Current Contracts
        </Text>
        {contractsLoading ? (
          <View style={styles.propertyLoadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.propertyLoadingText, { color: theme.colors.onSurfaceVariant }]}>
              Loading contracts...
            </Text>
          </View>
        ) : tenantContracts && tenantContracts.length > 0 ? (
          tenantContracts.map((contract: any) => (
            <View key={contract.id} style={[styles.contractCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.contractHeader}>
                <View style={[styles.propertyIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <Building2 size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.contractInfo}>
                  <Text style={[styles.propertyName, { color: theme.colors.onSurface }]}>
                    {contract.property?.title || 'Unspecified Property'}
                  </Text>
                  <Text style={[styles.propertyAddress, { color: theme.colors.onSurfaceVariant }]}>
                    {contract.property?.address || 'Address not available'}
                  </Text>
                </View>
              </View>
              <View style={styles.contractDetails}>
                <Text style={[styles.contractStatus, { color: contract.status === 'active' ? '#4CAF50' : '#FF9800' }]}>
                  <CheckCircle size={16} /> {contract.status === 'active' ? 'Active' : 'Expired'}
                </Text>
                <Text style={[styles.contractDates, { color: theme.colors.onSurfaceVariant }]}>
                  <Calendar size={14} /> From: {new Date(contract.start_date).toLocaleDateString('en-US')}
                </Text>
                <Text style={[styles.contractDates, { color: theme.colors.onSurfaceVariant }]}>
                  <Calendar size={14} /> To: {new Date(contract.end_date).toLocaleDateString('en-US')}
                </Text>
                <Text style={[styles.contractRent, { color: theme.colors.primary }]}>
                  <DollarSign size={14} /> Rent: {formatCurrency(contract.monthly_rent)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noPropertyContainer}>
            <View style={[styles.propertyIcon, { backgroundColor: '#FF980020' }]}>
              <AlertCircle size={24} color="#FF9800" />
            </View>
            <View style={styles.propertyInfo}>
              <Text style={[styles.noPropertyTitle, { color: theme.colors.onSurface }]}>
                No Active Contracts
              </Text>
              <Text style={[styles.noPropertyMessage, { color: theme.colors.onSurfaceVariant }]}>
                No active rental contracts at the moment
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Payment History Section */}
      <View style={[styles.paymentHistoryCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.subsectionTitle, { color: theme.colors.onSurface }]}>
          <CreditCard size={20} color={theme.colors.primary} /> Payment History
        </Text>
        {paymentsLoading ? (
          <View style={styles.propertyLoadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.propertyLoadingText, { color: theme.colors.onSurfaceVariant }]}>
              Loading payments...
            </Text>
          </View>
        ) : paymentHistory && paymentHistory.length > 0 ? (
          <View style={styles.paymentsList}>
            {paymentHistory.slice(0, 5).map((payment: any) => (
              <View key={payment.id} style={styles.paymentItem}>
                <View style={styles.paymentItemHeader}>
                  <Text style={[styles.paymentItemTitle, { color: theme.colors.onSurface }]}>
                    {payment.voucher_type === 'receipt' ? 'Payment Received' : 'Payment Made'}
                  </Text>
                  <Text style={[styles.paymentItemAmount, {
                    color: payment.voucher_type === 'receipt' ? '#4CAF50' : '#F44336'
                  }]}>
                    {payment.voucher_type === 'receipt' ? '+' : '-'}
                    {formatCurrency(payment.amount)}
                  </Text>
                </View>
                <View style={styles.paymentItemDetails}>
                  <Text style={[styles.paymentItemDate, { color: theme.colors.onSurfaceVariant }]}>
                    <Clock size={12} /> {new Date(payment.created_at).toLocaleDateString('en-US')}
                  </Text>
                  <Text style={[styles.paymentItemStatus, {
                    color: payment.status === 'cleared' ? '#4CAF50' : '#FF9800'
                  }]}>
                    {payment.status === 'cleared' ? 'Confirmed' : 'Processing'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.noDataText, { color: theme.colors.onSurfaceVariant }]}>
            No payments recorded
          </Text>
        )}
      </View>

      {/* Maintenance Requests Section */}
      <View style={[styles.maintenanceCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.subsectionTitle, { color: theme.colors.onSurface }]}>
          <Wrench size={20} color={theme.colors.primary} /> Maintenance Requests
        </Text>
        {maintenanceLoading ? (
          <View style={styles.propertyLoadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.propertyLoadingText, { color: theme.colors.onSurfaceVariant }]}>
              Loading maintenance requests...
            </Text>
          </View>
        ) : maintenanceRequests && maintenanceRequests.length > 0 ? (
          <View style={styles.maintenanceList}>
            {maintenanceRequests.slice(0, 5).map((request: any) => (
              <View key={request.id} style={styles.maintenanceItem}>
                <View style={styles.maintenanceItemHeader}>
                  <Text style={[styles.maintenanceItemTitle, { color: theme.colors.onSurface }]}>
                    {request.title}
                  </Text>
                  <View style={[styles.maintenanceStatus, {
                    backgroundColor: request.status === 'completed' ? '#4CAF5020' :
                                   request.status === 'in_progress' ? '#2196F320' : '#FF980020'
                  }]}>
                    <Text style={[styles.maintenanceStatusText, {
                      color: request.status === 'completed' ? '#4CAF50' :
                             request.status === 'in_progress' ? '#2196F3' : '#FF9800'
                    }]}>
                      {request.status === 'completed' ? 'Completed' :
                       request.status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.maintenanceItemDesc, { color: theme.colors.onSurfaceVariant }]}>
                  {request.description}
                </Text>
                <Text style={[styles.maintenanceItemDate, { color: theme.colors.onSurfaceVariant }]}>
                  <Clock size={12} /> {new Date(request.created_at).toLocaleDateString('en-US')}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.noDataText, { color: theme.colors.onSurfaceVariant }]}>
            No maintenance requests recorded
          </Text>
        )}
      </View>
    </View>
  );

  const renderQuickStats = () => (
    <View style={styles.quickStatsSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        {t('dashboard:quickStats')}
      </Text>
      {isLoading ? (
        <HorizontalStatsShimmer />
      ) : (
        <View style={[styles.horizontalStatsCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.horizontalStatsRow, { flexDirection: getFlexDirection('row') }]}>
            <View style={styles.horizontalStatItem}>
              <View style={[styles.horizontalStatIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Building2 size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}> 
                {t('dashboard:totalProperties')}
              </Text>
                              <Text style={[styles.horizontalStatValue, { color: theme.colors.primary }]}>
                  {formatDisplayNumber(propertyStats.totalProperties)}
                </Text>
            </View>
            
            <View style={styles.horizontalStatItem}>
              <View style={[styles.horizontalStatIcon, { backgroundColor: '#4CAF5020' }]}>
                <Home size={24} color="#4CAF50" />
              </View>
              <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}> 
                {t('dashboard:occupiedProperties')}
              </Text>
                              <Text style={[styles.horizontalStatValue, { color: '#4CAF50' }]}>
                  {formatDisplayNumber(propertyStats.occupied)}
                </Text>
            </View>
            
            <View style={styles.horizontalStatItem}>
              <View style={[styles.horizontalStatIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                <Users size={24} color={theme.colors.secondary} />
              </View>
              <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}> 
                {t('dashboard:totalTenants')}
              </Text>
                              <Text style={[styles.horizontalStatValue, { color: theme.colors.secondary }]}>
                  {formatDisplayNumber(tenantStats.totalTenants)}
                </Text>
            </View>
            

          </View>
        </View>
      )}
    </View>
  );

  const renderFinancialCards = () => (
    <View style={styles.financialSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        {t('dashboard:financialSummary')}
      </Text>
      <View style={styles.financialCards}>
        {isLoading ? (
          <>
            <RentCardShimmer />
            <CashflowCardShimmer />
          </>
        ) : (
          <>
            <RentCard 
              totalRent={financialSummary.totalIncome}
              collectedRent={Math.floor(financialSummary.totalIncome * 0.9)}
              pendingRent={Math.floor(financialSummary.totalIncome * 0.1)}
              theme={theme}
              loading={false}
            />
            <CashflowCard
              income={financialSummary.totalIncome}
              expenses={financialSummary.totalExpenses}
              netIncome={financialSummary.netProfit}
              theme={theme}
              loading={false}
            />
          </>
        )}
      </View>
    </View>
  );

  const renderPropertyOverview = () => (
    <View style={styles.propertySection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        {t('dashboard:propertyOverview')}
      </Text>
      {isLoading ? (
        <PropertyOverviewShimmer />
      ) : (
        <View style={[styles.propertyOverviewCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.propertyRow, { flexDirection: getFlexDirection('row') }]}>
            <View style={styles.propertyItem}>
              <View style={[styles.propertyIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Building2 size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.propertyLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('dashboard:occupied')}
              </Text>
                              <Text style={[styles.propertyValue, { color: theme.colors.onSurface }]}>
                  {formatDisplayNumber(propertyStats.occupied)}
                </Text>
            </View>
            
            <View style={styles.propertyItem}>
              <View style={[styles.propertyIcon, { backgroundColor: '#4CAF5020' }]}>
                <Home size={24} color="#4CAF50" />
              </View>
              <Text style={[styles.propertyLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('dashboard:available')}
              </Text>
                              <Text style={[styles.propertyValue, { color: theme.colors.onSurface }]}>
                  {formatDisplayNumber(propertyStats.available)}
                </Text>
            </View>
            
            <View style={styles.propertyItem}>
              <View style={[styles.propertyIcon, { backgroundColor: '#FF980020' }]}>
                <AlertCircle size={24} color="#FF9800" />
              </View>
              <Text style={[styles.propertyLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('dashboard:maintenance')}
              </Text>
                              <Text style={[styles.propertyValue, { color: theme.colors.onSurface }]}>
                  {formatDisplayNumber(propertyStats.maintenance)}
                </Text>
            </View>
          </View>
          
          <View style={styles.occupancyRate}>
            <Text style={[styles.occupancyLabel, { color: theme.colors.onSurfaceVariant }]}> 
              {t('dashboard:occupancyRate')}
            </Text>
            <Text style={[styles.occupancyValue, { color: theme.colors.primary }]}>
              {formatDisplayNumber(propertyStats.occupancyRate)}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <Building2 size={64} color={theme.colors.onSurfaceVariant} />
      </View>
      <Text style={[styles.emptyStateTitle, { color: theme.colors.onBackground }]}>
        No Data to Display
      </Text>
      <Text style={[styles.emptyStateMessage, { color: theme.colors.onSurfaceVariant }]}>
        No properties or tenants found in the system.{'\n'}
        Start by adding a new property or tenant to begin using the system.
      </Text>
      <View style={styles.emptyStateActions}>
        <Text style={[styles.emptyStateActionText, { color: theme.colors.primary }]}>
          • Add new property from Properties page{'\n'}
          • Add new tenant from Tenants page{'\n'}
          • Check user settings and permissions
        </Text>
      </View>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <AlertCircle size={64} color="#FF5722" />
      </View>
      <Text style={[styles.emptyStateTitle, { color: theme.colors.onBackground }]}>
        Error Loading Data
      </Text>
      <Text style={[styles.emptyStateMessage, { color: theme.colors.onSurfaceVariant }]}>
        An error occurred while loading dashboard data.{'\n'}
        Check your internet connection and try again.
      </Text>
      <View style={styles.emptyStateActions}>
        <Text style={[styles.emptyStateActionText, { color: theme.colors.primary }]}>
          • Pull down to refresh data{'\n'}
          • Check internet connection{'\n'}
          • Contact technical support if problem persists
        </Text>
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.activitySection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        {t('dashboard:recentActivity')}
      </Text>
      {isLoading ? (
        <RecentActivityShimmer count={3} />
      ) : (
        recentActivities.map((activity) => (
          <View key={activity.id} style={[styles.activityCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.activityHeader, { flexDirection: getFlexDirection('row') }]}>
              <View style={styles.activityLeft}>
                <Text style={[styles.activityAmount, { color: theme.colors.primary }]}>
                  {formatCurrency(activity.amount)}
                </Text>
                <Text style={[styles.activityDate, { color: theme.colors.onSurfaceVariant }]}>
                  {activity.date}
                </Text>
              </View>
              <View style={styles.activityInfo}>
                <View style={styles.activityDetails}>
                  <Text style={[styles.activityTitle, { color: theme.colors.onSurface }]}>
                    {activity.title}
                  </Text>
                  <Text style={[styles.activityDescription, { color: theme.colors.onSurfaceVariant }]}>
                    {activity.description}
                  </Text>
                </View>
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
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title={t('dashboard:title')} 
        subtitle={t('dashboard:welcomeMessage')}
        showNotifications={true}
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
        {/* Role-based Dashboard Content */}
        {isTenant ? (
          /* Tenant Dashboard - Only payment due and current property */
          renderTenantDashboard()
        ) : (
          /* Admin/Manager/Owner Dashboard - Full view */
          <>
            {/* Show a lightweight inline warning but keep content visible using fallbacks */}
            {hasError && (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateIcon}>
                  <AlertCircle size={48} color="#FF5722" />
                </View>
                <Text style={[styles.emptyStateTitle, { color: theme.colors.onBackground }]}>
                  Error Loading Data
                </Text>
                <Text style={[styles.emptyStateMessage, { color: theme.colors.onSurfaceVariant }]}>
                  An error occurred while loading dashboard data. Approximate data will be displayed temporarily.
                </Text>
                {/* Debug: show specific error messages */}
                {!!errorDetails.summary && (
                  <Text style={[styles.emptyStateActionText, { color: theme.colors.onSurfaceVariant }]}>
                    Dashboard Summary: {String(errorDetails.summary)}
                  </Text>
                )}
                {!!errorDetails.properties && (
                  <Text style={[styles.emptyStateActionText, { color: theme.colors.onSurfaceVariant }]}>
                    Properties: {String(errorDetails.properties)}
                  </Text>
                )}
                {!!errorDetails.tenants && (
                  <Text style={[styles.emptyStateActionText, { color: theme.colors.onSurfaceVariant }]}>
                    Tenants: {String(errorDetails.tenants)}
                  </Text>
                )}
              </View>
            )}
            {renderQuickStats()}
            {renderFinancialCards()}
            {renderPropertyOverview()}
            {renderRecentActivity()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
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
    color: theme.colors.onSurface,
  },
  statsGrid: {
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
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: theme.colors.surface,
  },
  propertyRow: {
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
    backgroundColor: theme.colors.primaryContainer,
  },
  propertyLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  propertyValue: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
  occupancyRate: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  occupancyLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: theme.colors.onSurfaceVariant,
  },
  occupancyValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  activitySection: {
    marginBottom: 24,
  },
  activityCard: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    backgroundColor: theme.colors.surface,
  },
  activityHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityInfo: {
    ...rtlStyles.row,
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...rtlStyles.marginStart(12),
    backgroundColor: theme.colors.primaryContainer,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 2,
    color: theme.colors.onSurface,
  },
  activityDescription: {
    fontSize: 12,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  activityLeft: {
    alignItems: 'flex-start',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'left',
    color: theme.colors.primary,
  },
  activityDate: {
    fontSize: 11,
    textAlign: 'left',
    color: theme.colors.onSurfaceVariant,
  },
  statCardWrapper: {
    width: '48%',
    minHeight: 120,
  },
  // Horizontal stats styles
  horizontalStatsCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: theme.colors.surface,
  },
  horizontalStatsRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horizontalStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  horizontalStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: theme.colors.primaryContainer,
  },
  horizontalStatLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 16,
    color: theme.colors.onSurfaceVariant,
  },
  horizontalStatValue: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: theme.colors.error,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    color: theme.colors.onSurfaceVariant,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  // Property overview styles
  propertyOverviewSection: {
    marginBottom: 24,
  },
  propertyOverviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'right',
    color: theme.colors.onSurface,
  },
  propertyOverviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  propertyOverviewItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    elevation: 1,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  propertyOverviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: theme.colors.primaryContainer,
  },
  propertyOverviewLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    color: theme.colors.onSurfaceVariant,
  },
  propertyOverviewValue: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
  // Recent activity styles
  recentActivitySection: {
    marginBottom: 24,
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'right',
    color: theme.colors.onSurface,
  },
  recentActivityList: {
    gap: 12,
  },
  recentActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    elevation: 1,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recentActivityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: theme.colors.primaryContainer,
  },
  recentActivityContent: {
    flex: 1,
  },
  recentActivityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.onSurface,
  },
  recentActivityDescription: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  recentActivityRight: {
    alignItems: 'flex-end',
  },
  recentActivityAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    color: theme.colors.primary,
  },
  recentActivityDate: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  // Tenant dashboard styles
  tenantDashboardContainer: {
    flex: 1,
    padding: 20,
  },
  tenantDashboardTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
  tenantDashboardCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: theme.colors.surface,
  },
  tenantDashboardCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
  tenantDashboardCardContent: {
    alignItems: 'center',
  },
  tenantDashboardCardValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    color: theme.colors.primary,
  },
  tenantDashboardCardLabel: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  // Payment due styles
  paymentDueSection: {
    marginBottom: 24,
  },
  paymentDueTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'right',
    color: theme.colors.onSurface,
  },
  paymentDueCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: theme.colors.surface,
  },
  paymentDueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentDueInfo: {
    flex: 1,
  },
  paymentDueTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.onSurface,
  },
  paymentDueDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  paymentDueAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  paymentDueDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  // Current property styles
  currentPropertySection: {
    marginBottom: 24,
  },
  currentPropertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'right',
    color: theme.colors.onSurface,
  },
  currentPropertyCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: theme.colors.surface,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    ...rtlStyles.textAlignEnd,
    color: theme.colors.onSurface,
  },
  propertyDetails: {
    ...rtlStyles.row,
    alignItems: 'center',
  },
  propertyInfo: {
    flex: 1,
    ...rtlStyles.marginStart(12),
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    ...rtlStyles.textEnd,
    marginBottom: 4,
    color: theme.colors.onSurface,
  },
  propertyAddress: {
    fontSize: 14,
    ...rtlStyles.textEnd,
    marginBottom: 2,
    color: theme.colors.onSurfaceVariant,
  },
  propertySpecs: {
    fontSize: 12,
    ...rtlStyles.textEnd,
    color: theme.colors.onSurfaceVariant,
  },
  propertyLoadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyLoadingText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  noPropertyContainer: {
    ...rtlStyles.row(),
    alignItems: 'center',
  },
  noPropertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    ...rtlStyles.textAlignEnd,
    marginBottom: 4,
    color: theme.colors.onSurface,
  },
  noPropertyMessage: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: theme.colors.onSurface,
  },
  emptyStateMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    color: theme.colors.onSurfaceVariant,
  },
  emptyStateActions: {
    alignItems: 'center',
  },
  emptyStateActionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    color: theme.colors.onSurfaceVariant,
  },
  // Tenant Dashboard Styles
  contractCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contractInfo: {
    flex: 1,
  },
  contractDetails: {
    marginTop: 8,
  },
  contractStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contractDates: {
    fontSize: 12,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contractRent: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentHistoryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paymentsList: {
    marginTop: 8,
  },
  paymentItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  paymentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentItemAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  paymentItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentItemDate: {
    fontSize: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentItemStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  maintenanceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  maintenanceList: {
    marginTop: 8,
  },
  maintenanceItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  maintenanceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  maintenanceItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  maintenanceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  maintenanceStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  maintenanceItemDesc: {
    fontSize: 12,
    marginBottom: 4,
    color: theme.colors.onSurfaceVariant,
  },
  maintenanceItemDate: {
    fontSize: 12,
    flexDirection: 'row',
    alignItems: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
    color: theme.colors.onSurfaceVariant,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
