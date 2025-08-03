import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { lightTheme } from '@/lib/theme';
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
  Lock
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import RentCard from '@/components/RentCard';
import CashflowCard from '@/components/CashflowCard';
import StatCard from '@/components/StatCard';
import { useApi } from '@/hooks/useApi';
import { propertiesApi, profilesApi, contractsApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useScreenAccess, SCREEN_PERMISSIONS } from '@/lib/permissions';
import { formatCurrency } from '@/lib/formatters';
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
  const theme = lightTheme;
  const { t } = useTranslation('common');

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
    error: propertiesError,
    refetch: refetchProperties 
  } = useApi(() => propertiesApi.getAll(), []);

  const { 
    data: tenants, 
    loading: tenantsLoading, 
    error: tenantsError,
    refetch: refetchTenants 
  } = useApi(() => profilesApi.getTenants(), []);

  // Debug API errors
  console.log('[Dashboard Debug] API Errors:', {
    propertiesError: propertiesError?.message,
    tenantsError: tenantsError?.message,
    summaryError: summaryError?.message,
    propertiesLoading,
    tenantsLoading,
    summaryLoading
  });

  // Fetch tenant contracts for payment information
  const { 
    data: tenantContracts, 
    loading: contractsLoading, 
    refetch: refetchContracts 
  } = useApi(() => {
    // Only fetch contracts for tenant users
    if (userContext?.role === 'tenant' && userContext?.userId) {
      return contractsApi.getAll({ tenant_id: userContext.userId });
    }
    return Promise.resolve([]);
  }, [userContext?.role, userContext?.userId]);

  // Loading state
  const isLoading = permissionLoading || summaryLoading || propertiesLoading || tenantsLoading || contractsLoading;

  // Handle refresh
  const [refreshing, setRefreshing] = React.useState(false);
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchSummary(),
      refetchProperties(),
      refetchTenants(),
      refetchContracts()
    ]);
    setRefreshing(false);
  }, [refetchSummary, refetchProperties, refetchTenants, refetchContracts]);

  // Show loading state while checking permissions
  if (permissionLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="لوحة التحكم" variant="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            {t('loading')}
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
    userId: userContext?.userId,
    permissionLoading: permissionLoading,
    screenPermissionCheck: SCREEN_PERMISSIONS.find(p => p.screen === 'dashboard')
  });



  // More detailed debug for dashboard access
  if (!canAccessDashboard && !permissionLoading) {
    console.log('[Dashboard Debug] Access Denied Details:', {
      screenExists: SCREEN_PERMISSIONS.some(p => p.screen === 'dashboard'),
      userHasRole: userContext?.role,
      allowedRoles: SCREEN_PERMISSIONS.find(p => p.screen === 'dashboard')?.roles,
      isAuthenticated: userContext?.isAuthenticated
    });
  }

  // If user doesn't have dashboard access, show access denied
  if (!canAccessDashboard) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title="لوحة التحكم" variant="dark" />
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
  
  // Enhanced property statistics with real data
  const propertyStats = {
    totalProperties: dashboardData?.total_properties || propertiesData.length,
    occupied: dashboardData?.occupied || propertiesData.filter(p => p.status === 'rented').length,
    available: dashboardData?.available || propertiesData.filter(p => p.status === 'available').length,
    maintenance: dashboardData?.maintenance || propertiesData.filter(p => p.status === 'maintenance').length,
    occupancyRate: dashboardData?.total_properties > 0 ? 
      Math.round((dashboardData.occupied / dashboardData.total_properties) * 100) : 
      (propertiesData.length > 0 ? Math.round((propertiesData.filter(p => p.status === 'rented').length / propertiesData.length) * 100) : 0)
  };
  
  // Enhanced tenant statistics with better calculations
  // First, calculate the value needed for the object
  const totalTenantsCount = tenantsData.length;
  
  // Now create the object using the pre-calculated variable
  const tenantStats = {
    totalTenants: totalTenantsCount,
    activeTenants: tenantsData.filter(t => t.status === 'active').length,
    foreignTenants: tenantsData.filter(t => t.is_foreign === true).length,
    pendingTenants: tenantsData.filter(t => t.status === 'pending').length,
    // Calculate contract-related stats
    activeContracts: dashboardData?.active_contracts || 0,
    // Use the new variable here instead of referencing tenantStats
    expiringContracts: Math.floor(totalTenantsCount * 0.1) // TODO: Calculate from actual contract expiry dates
  };

  // Enhanced financial summary with real monthly rent data
  const financialSummary = {
    totalIncome: dashboardData?.total_monthly_rent || 0,
    monthlyRent: dashboardData?.total_monthly_rent || 0,
    annualProjection: (dashboardData?.total_monthly_rent || 0) * 12,
    // Estimated expenses (30% of income is a common estimate)
    totalExpenses: Math.floor((dashboardData?.total_monthly_rent || 0) * 0.3),
    netProfit: Math.floor((dashboardData?.total_monthly_rent || 0) * 0.7),
    profitMargin: dashboardData?.total_monthly_rent > 0 ? 70 : 0 // 70% after 30% expenses
  };

  // Check for errors only - always show dashboard content
  const hasError = summaryError || propertiesError || tenantsError;
  
  console.log('[Dashboard Debug] Properties Data:', {
    propertiesCount: propertiesData.length,
    tenantsCount: tenantsData.length,
    propertiesData: propertiesData.slice(0, 2), // First 2 for debugging
    summaryLoading: summaryLoading,
    summaryData: dashboardSummary?.data,
    summaryError: summaryError,
    propertyStats: propertyStats,
    tenantStats: tenantStats,
    financialSummary: financialSummary
  });

  // Direct database query for debugging
  console.log('[Dashboard Debug] Direct Database Check:');
  
  // Check properties directly
  supabase.from('properties').select('*').then(result => {
    console.log('[Direct DB] Properties:', {
      count: result.data?.length || 0,
      data: result.data?.slice(0, 3), // First 3 properties
      error: result.error?.message
    });
  });
  
  // Check tenants directly
  supabase.from('profiles').select('*').eq('role', 'tenant').then(result => {
    console.log('[Direct DB] Tenants:', {
      count: result.data?.length || 0,
      data: result.data?.slice(0, 3), // First 3 tenants
      error: result.error?.message
    });
  });
  
  // Check contracts directly
  supabase.from('contracts').select('*').then(result => {
    console.log('[Direct DB] Contracts:', {
      count: result.data?.length || 0,
      data: result.data?.slice(0, 3), // First 3 contracts
      error: result.error?.message
    });
  });

  // Enhanced recent activities with more realistic data
  const recentActivities = [
    {
      id: '1',
      type: 'payment',
      title: 'دفعة إيجار شهرية مستلمة',
      description: `${tenantStats.activeTenants} مستأجر نشط`,
      amount: Math.floor(financialSummary.monthlyRent / (tenantStats.activeTenants || 1)),
      date: new Date().toISOString().split('T')[0],
      status: 'completed'
    },
    {
      id: '2',
      type: 'contract',
      title: 'عقود نشطة',
      description: `${tenantStats.activeContracts} عقد نشط`,
      amount: financialSummary.monthlyRent,
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      status: 'active'
    },
    {
      id: '3',
      type: 'maintenance',
      title: 'طلبات الصيانة',
      description: `${propertyStats.maintenance} عقار في الصيانة`,
      amount: Math.floor(financialSummary.totalExpenses * 0.4), // 40% of expenses for maintenance
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
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
      dueDate: '30 يناير 2025', // This would come from actual payment due calculation
      description: `إيجار شهر يناير 2025`
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
      propertySpecs: `${property.bedrooms || 0} غرف • ${property.bathrooms || 0} حمام • ${property.area_sqm || 0} م²`
    };
  };

  const tenantProperty = getTenantPropertyInfo();

  // Tenant-specific dashboard content
  const renderTenantDashboard = () => (
    <View style={styles.tenantSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        المستأجر - المعلومات الشخصية
      </Text>
      
      {/* Payment Due Section */}
      <View style={[styles.paymentDueCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.paymentHeader}>
          <View style={[styles.paymentIcon, { backgroundColor: '#FF980020' }]}>
            <DollarSign size={24} color="#FF9800" />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={[styles.paymentTitle, { color: theme.colors.onSurface }]}>
              الدفعة المستحقة
            </Text>
            <Text style={[styles.paymentAmount, { color: '#FF9800' }]}>
              {tenantPayment.amount.toLocaleString('ar-SA')} ريال
            </Text>
          </View>
        </View>
        {tenantPayment.hasPayment ? (
          <>
            <Text style={[styles.paymentDue, { color: theme.colors.onSurfaceVariant }]}>
              تاريخ الاستحقاق: {tenantPayment.dueDate}
            </Text>
            <Text style={[styles.paymentDescription, { color: theme.colors.onSurfaceVariant }]}>
              {tenantPayment.description}
            </Text>
          </>
        ) : (
          <Text style={[styles.paymentDescription, { color: theme.colors.onSurfaceVariant }]}>
            لا توجد مدفوعات مستحقة حالياً
          </Text>
        )}
      </View>

      {/* Current Property Section */}
      <View style={[styles.currentPropertyCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.subsectionTitle, { color: theme.colors.onSurface }]}>
          العقار الحالي
        </Text>
        {contractsLoading ? (
          <View style={styles.propertyLoadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.propertyLoadingText, { color: theme.colors.onSurfaceVariant }]}>
              جاري تحميل معلومات العقار...
            </Text>
          </View>
        ) : tenantProperty.hasProperty ? (
          <View style={styles.propertyDetails}>
            <View style={[styles.propertyIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Building2 size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.propertyInfo}>
              <Text style={[styles.propertyName, { color: theme.colors.onSurface }]}>
                {tenantProperty.propertyName}
              </Text>
              <Text style={[styles.propertyAddress, { color: theme.colors.onSurfaceVariant }]}>
                {tenantProperty.propertyAddress}
              </Text>
              <Text style={[styles.propertySpecs, { color: theme.colors.onSurfaceVariant }]}>
                {tenantProperty.propertySpecs}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noPropertyContainer}>
            <View style={[styles.propertyIcon, { backgroundColor: '#FF980020' }]}>
              <AlertCircle size={24} color="#FF9800" />
            </View>
            <View style={styles.propertyInfo}>
              <Text style={[styles.noPropertyTitle, { color: theme.colors.onSurface }]}>
                لا يوجد عقار حتى الآن
              </Text>
              <Text style={[styles.noPropertyMessage, { color: theme.colors.onSurfaceVariant }]}>
                يرجى التواصل مع المدير للحصول على التعيين
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderQuickStats = () => (
    <View style={styles.quickStatsSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        الإحصائيات السريعة
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
                إجمالي العقارات
              </Text>
              <Text style={[styles.horizontalStatValue, { color: theme.colors.primary }]}>
                {propertyStats.totalProperties}
              </Text>
            </View>
            
            <View style={styles.horizontalStatItem}>
              <View style={[styles.horizontalStatIcon, { backgroundColor: '#4CAF5020' }]}>
                <Home size={24} color="#4CAF50" />
              </View>
              <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                العقارات المشغولة
              </Text>
              <Text style={[styles.horizontalStatValue, { color: '#4CAF50' }]}>
                {propertyStats.occupied}
              </Text>
            </View>
            
            <View style={styles.horizontalStatItem}>
              <View style={[styles.horizontalStatIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                <Users size={24} color={theme.colors.secondary} />
              </View>
              <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                إجمالي المستأجرين
              </Text>
              <Text style={[styles.horizontalStatValue, { color: theme.colors.secondary }]}>
                {tenantStats.totalTenants}
              </Text>
            </View>
            
            <View style={styles.horizontalStatItem}>
              <View style={[styles.horizontalStatIcon, { backgroundColor: '#FF980020' }]}>
                <AlertCircle size={24} color="#FF9800" />
              </View>
              <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                المستأجرين الأجانب
              </Text>
              <Text style={[styles.horizontalStatValue, { color: '#FF9800' }]}>
                {tenantStats.foreignTenants}
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
        الملخص المالي
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
        نظرة عامة على العقارات
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
                مشغولة
              </Text>
              <Text style={[styles.propertyValue, { color: theme.colors.onSurface }]}>
                {propertyStats.occupied}
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
                {propertyStats.available}
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
                {propertyStats.maintenance}
              </Text>
            </View>
          </View>
          
          <View style={styles.occupancyRate}>
            <Text style={[styles.occupancyLabel, { color: theme.colors.onSurfaceVariant }]}>
              معدل الإشغال
            </Text>
            <Text style={[styles.occupancyValue, { color: theme.colors.primary }]}>
              {propertyStats.occupancyRate}%
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
        لا توجد بيانات لعرضها
      </Text>
      <Text style={[styles.emptyStateMessage, { color: theme.colors.onSurfaceVariant }]}>
        لم يتم العثور على عقارات أو مستأجرين في النظام.{'\n'}
        ابدأ بإضافة عقار جديد أو مستأجر للبدء في استخدام النظام.
      </Text>
      <View style={styles.emptyStateActions}>
        <Text style={[styles.emptyStateActionText, { color: theme.colors.primary }]}>
          • أضف عقار جديد من صفحة العقارات{'\n'}
          • أضف مستأجر جديد من صفحة المستأجرين{'\n'}
          • تحقق من إعدادات المستخدم والصلاحيات
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
        خطأ في تحميل البيانات
      </Text>
      <Text style={[styles.emptyStateMessage, { color: theme.colors.onSurfaceVariant }]}>
        حدث خطأ أثناء تحميل بيانات لوحة التحكم.{'\n'}
        تحقق من اتصال الإنترنت وحاول مرة أخرى.
      </Text>
      <View style={styles.emptyStateActions}>
        <Text style={[styles.emptyStateActionText, { color: theme.colors.primary }]}>
          • اسحب للأسفل لتحديث البيانات{'\n'}
          • تحقق من اتصال الإنترنت{'\n'}
          • تواصل مع الدعم الفني إذا استمرت المشكلة
        </Text>
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.activitySection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        النشاطات الأخيرة
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
        title="لوحة التحكم" 
        subtitle="مرحباً بك في نظام إدارة العقارات"
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
            {hasError ? (
              renderErrorState()
            ) : (
              <>
                {renderQuickStats()}
                {renderFinancialCards()}
                {renderPropertyOverview()}
                {renderRecentActivity()}
              </>
            )}
          </>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityInfo: {
    ...rtlStyles.row(),
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
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    ...rtlStyles.textAlignEnd,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    ...rtlStyles.textAlignEnd,
  },
  activityLeft: {
    ...rtlStyles.alignItemsStart,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    ...rtlStyles.marginEnd(8),
  },
  activityDate: {
    fontSize: 11,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  },
  horizontalStatLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 16,
  },
  horizontalStatValue: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
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
  // Tenant-specific styles
  tenantSection: {
    marginVertical: 16,
  },
  paymentDueCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentHeader: {
    ...rtlStyles.row(),
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...rtlStyles.marginEnd(12),
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    ...rtlStyles.textAlignEnd,
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: '700',
    ...rtlStyles.textAlignEnd,
  },
  paymentDue: {
    fontSize: 14,
    marginBottom: 4,
    ...rtlStyles.textAlignEnd,
  },
  paymentDescription: {
    fontSize: 12,
    ...rtlStyles.textAlignEnd,
  },
  currentPropertyCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    ...rtlStyles.textAlignEnd,
  },
  propertyDetails: {
    ...rtlStyles.row(),
    alignItems: 'center',
  },
  propertyInfo: {
    flex: 1,
    ...rtlStyles.marginStart(12),
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    ...rtlStyles.textAlignEnd,
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    ...rtlStyles.textAlignEnd,
    marginBottom: 2,
  },
  propertySpecs: {
    fontSize: 12,
    ...rtlStyles.textAlignEnd,
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
  },
  noPropertyMessage: {
    fontSize: 14,
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
  },
  emptyStateMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateActions: {
    alignItems: 'center',
  },
  emptyStateActionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});