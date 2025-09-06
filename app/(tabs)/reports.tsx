import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, FlatList, RefreshControl, Alert, ActivityIndicator, Modal, TouchableOpacity, I18nManager, Text } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import ModernHeader from '@/components/ModernHeader';
import { useApi } from '@/hooks/useApi';
import { ReportFilters } from '@/components/ReportFilters';
import { reportsApi, reportFiltersApi , profilesApi , propertiesApi } from '@/lib/api';
import { pdfApi, PDFRequest } from '@/lib/pdfApi';
import { useStore } from '@/lib/store';
import { useTranslation } from '@/lib/useTranslation';
import { rtlStyles, getFlexDirection } from '@/lib/rtl';
import { useScreenAccess } from '@/lib/permissions';
import { formatDisplayNumber, toArabicNumerals } from '@/lib/formatters';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filter: any) => void;
  filterType: string;
  options: any[];
  loading?: boolean;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply, filterType, options, loading = false }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<any>(null);

  // Local styles for modal (avoid relying on parent styles)
  const modalStyles = React.useMemo(() => StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContent: {
      width: '100%',
      maxWidth: 640,
      borderRadius: 12,
      padding: 16,
      elevation: 3,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
    },
    modalLoadingContainer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    modalLoadingText: {
      marginTop: 8,
      fontSize: 14,
    },
    modalOptionsList: {
      maxHeight: 400,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    modalOptionContent: {
      flex: 1,
      marginRight: 12,
    },
    modalOptionText: {
      fontSize: 14,
      fontWeight: '600',
    },
    modalOptionSubtext: {
      fontSize: 12,
      marginTop: 2,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  }), [theme]);

  // Reset selected option when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelectedOption(null);
    }
  }, [visible]);

  const getFilterTypeLabel = (type: string) => {
    switch (type) {
      case 'tenant':
        return t('reports:selectTenant');
      case 'owner':
        return t('reports:selectOwner');
      case 'property':
        return t('reports:selectProperty');
      case 'expense-type':
        return t('reports:selectExpenseType');
      default:
        return t('reports:selectFilter');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.modalOverlay}>
        <View style={[modalStyles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text style={[modalStyles.modalTitle, rtlStyles.textStart, { color: theme.colors.onSurface }]}> 
            {getFilterTypeLabel(filterType)}
          </Text>
          
          {loading ? (
            <View style={modalStyles.modalLoadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[modalStyles.modalLoadingText, rtlStyles.textStart, { color: theme.colors.onSurfaceVariant }]}> 
                {t('common:loading')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              style={modalStyles.modalOptionsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    modalStyles.modalOption,
                    selectedOption?.id === item.id && { backgroundColor: theme.colors.primaryContainer }
                  ]}
                  onPress={() => setSelectedOption(item)}
                >
                  <View style={modalStyles.modalOptionContent}>
                    <Text style={[modalStyles.modalOptionText, rtlStyles.textStart, { color: theme.colors.onSurface }]}>
                      {item.name}
                    </Text>
                    {item.email && (
                      <Text style={[modalStyles.modalOptionSubtext, rtlStyles.textStart, { color: theme.colors.onSurfaceVariant }]}> 
                        {item.email}
                      </Text>
                    )}
                  </View>
                  {selectedOption?.id === item.id && (
                    <MaterialIcons name="check" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
          
          <View style={[modalStyles.modalActions, { flexDirection: 'row' }]}>
            <TouchableOpacity
              style={[modalStyles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => selectedOption && onApply(selectedOption)}
              disabled={!selectedOption}
            >
              <Text style={[
                modalStyles.modalButtonText,
                { color: selectedOption ? theme.colors.onPrimary : theme.colors.onSurface }
              ]}>
                {t('common:apply')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[modalStyles.modalButton, { backgroundColor: theme.colors.outline }]}
              onPress={onClose}
            >
              <Text style={[modalStyles.modalButtonText, { color: theme.colors.onSurface }]}> 
                {t('common:cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Report Viewer Modal Component
interface ReportViewerModalProps {
  visible: boolean;
  onClose: () => void;
  reportData: any;
  onDownload: () => void;
}

const ReportViewerModal: React.FC<ReportViewerModalProps> = ({ visible, onClose, reportData, onDownload }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Force light theme colors for consistency
  const lightColors = {
    surface: '#FFFFFF',
    onSurface: '#212121',
    onSurfaceVariant: '#757575',
    primary: '#1976D2',
    secondary: '#FF6B35',
    onPrimary: '#FFFFFF',
    outline: '#E0E0E0',
    background: '#F8F9FA'
  };

  if (!reportData) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.reportViewerContent, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={styles.reportViewerHeader}>
            <Text style={[styles.reportViewerTitle, { color: theme.colors.onSurface }]}>
              {reportData.title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Report Content */}
          <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
            {reportData.content ? (
              <View style={styles.htmlContentContainer}>
                <Text style={[styles.htmlContent, { color: theme.colors.onSurface }]}>
                  {reportData.content}
                </Text>
              </View>
            ) : (
              <View style={styles.noContentContainer}>
                <MaterialIcons name="description" size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.noContentText, { color: theme.colors.onSurfaceVariant }]}>
                  {t('reports:noContentAvailable')}
                </Text>
                <Text style={[styles.noContentSubtext, { color: theme.colors.onSurfaceVariant }]}>
                  {t('reports:tryDownloadInstead')}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.reportViewerFooter}>
            <TouchableOpacity
              style={[styles.reportViewerButton, { backgroundColor: theme.colors.secondary }]}
              onPress={onDownload}
            >
              <MaterialIcons name="download" size={20} color="white" />
              <Text style={[styles.reportViewerButtonText, { color: 'white' }]}>
                {t('reports:downloadPDF')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Comprehensive reports list as requested in the image
// TEMPORARY FIX: Force light theme colors to match dashboard appearance
// This addresses the issue where reports page shows dark backgrounds while dashboard shows light
export default function ReportsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();
  const { user } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Check if user has access to reports
  const { hasAccess: canAccessReports, loading: permissionLoading, userContext } = useScreenAccess('reports');
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [currentFilterType, setCurrentFilterType] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<any[]>([]);
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);
  
  // Universal filters for all reports
  const [universalFilters, setUniversalFilters] = useState({
    dateRange: {
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(),
      label: 'This Year'
    },
    propertyTypes: [],
    cities: [],
    neighborhoods: [],
    paymentStatuses: [],
    includeSubProperties: true
  });
  const [showUniversalFilters, setShowUniversalFilters] = useState(false);
  
  // Report viewer modal state
  const [reportViewerVisible, setReportViewerVisible] = useState(false);
  const [currentReportData, setCurrentReportData] = useState<any>(null);
  const [reportViewLoading, setReportViewLoading] = useState(false);
  
  // Track current action (view or download)
  const [currentAction, setCurrentAction] = useState<'view' | 'download'>('view');

  // Force light theme colors for consistency with other screens
  const lightColors = {
    surface: '#FFFFFF',
    onSurface: '#212121',
    onSurfaceVariant: '#757575',
    onBackground: '#1A1A1A',
    primary: '#1976D2',
    onPrimary: '#FFFFFF',
    outline: '#E0E0E0',
    background: '#F8F9FA',
    primaryContainer: '#E3F2FD'
  };

  // User context is already available from useScreenAccess hook
  // Removed redundant hasReportAccess check - rely on formal permission system only

  const { 
    data: stats, 
    loading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useApi(() => reportsApi.getStats(), []);

  const { 
    data: dashboardData, 
    loading: dashboardLoading 
  } = useApi(() => propertiesApi.getDashboardSummary(), []);

  const { 
    data: tenants, 
    loading: tenantsLoading 
  } = useApi(() => profilesApi.getTenants(), []);

  const { 
    data: properties, 
    loading: propertiesLoading 
  } = useApi(() => propertiesApi.getAll(), []);

  // Enhanced statistics that connect to dashboard - MEMOIZED for performance
  const connectedStats = useMemo(() => ({
    totalReports: stats?.data?.totalReports || 12,
    generatedThisMonth: stats?.data?.generatedThisMonth || 8,
    avgGenerationTime: stats?.data?.avgGenerationTime || '2.1s',
    scheduledReports: stats?.data?.scheduledReports || 3,
    
    // Connected to dashboard data
    totalProperties: dashboardData?.data?.total_properties || 0,
    totalTenants: tenants?.data?.length || 0,
    activeTenants: tenants?.data?.filter(t => t.status === 'active').length || 0,
    occupiedProperties: dashboardData?.data?.occupied || 0,
    monthlyRevenue: dashboardData?.data?.total_monthly_rent || 0
  }), [stats, dashboardData, tenants]);

  // Fetch filter options based on filter type
  const fetchFilterOptions = async (filterType: string) => {
    setLoadingFilterOptions(true);
    try {
      let options = [];
      
      switch (filterType) {
        case 'tenant':
          console.log('[Reports Debug] Fetching tenants for filter...');
          const tenantsResponse = await reportFiltersApi.getAllTenantsForReports();
          console.log('[Reports Debug] Tenants response:', tenantsResponse);
          if (tenantsResponse.data) {
            options = tenantsResponse.data.map((tenant: any) => ({
              id: tenant.id,
              name: `${tenant.first_name} ${tenant.last_name}`,
              email: tenant.email
            }));
          }
          break;
          
        case 'owner':
          console.log('[Reports Debug] Fetching owners for filter...');
          const ownersResponse = await reportFiltersApi.getAllOwnersForReports();
          console.log('[Reports Debug] Owners response:', ownersResponse);
          if (ownersResponse.data) {
            options = ownersResponse.data.map((owner: any) => ({
              id: owner.id,
              name: `${owner.first_name} ${owner.last_name}`,
              email: owner.email
            }));
          }
          break;
          
        case 'property':
          console.log('[Reports Debug] Fetching properties for filter...');
          const propertiesResponse = await reportFiltersApi.getAllPropertiesForReports();
          console.log('[Reports Debug] Properties response:', propertiesResponse);
          if (propertiesResponse.data) {
            options = propertiesResponse.data.map((property: any) => ({
              id: property.id,
              name: property.title,
              address: property.address
            }));
          }
          break;
          
        case 'expense-type':
          options = [
            { id: 'sales', name: t('reports:salesExpenses') },
            { id: 'maintenance', name: t('reports:maintenanceExpenses') },
            { id: 'all', name: t('reports:allExpenses') }
          ];
          break;
          
        default:
          options = [];
      }
      
      console.log(`[Reports Debug] Filter options for ${filterType}:`, options);
      setFilterOptions(options);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      setFilterOptions([]);
    } finally {
      setLoadingFilterOptions(false);
    }
  };

  // Memoized available reports calculation - PERFORMANCE OPTIMIZATION
  const availableReports = useMemo(() => [
    { 
      id: 'summary-report', 
      type: 'summary',
      title: t('reports:summary'), 
      titleEn: 'Summary of Reports',
      description: 'نظرة عامة شاملة على جميع التقارير المتاحة',
      category: 'summary',
      iconName: 'summarize',
      color: theme.colors.primary,
      lastGenerated: stats?.lastGenerated,
      requiresFilter: false,
      accessRoles: ['admin', 'manager', 'owner']
    },
    { 
      id: 'account-statement', 
      type: 'account-statement',
      title: t('reports:account-statement'),
      titleEn: 'General Account Statement',
      description: 'كشف حساب شامل للمالك المحدد',
      category: 'financial',
      iconName: 'account-balance',
      color: theme.colors.secondary,
      lastGenerated: stats?.lastGenerated,
      requiresFilter: true,
      filterType: 'owner' as const,
      accessRoles: ['admin', 'manager', 'owner']
    },
    { 
      id: 'expense-report', 
      type: 'expense-report',
      title: t('reports:expense-report'),
      titleEn: 'Expense Report',
      description: 'تحليل مفصل لمصروفات المبيعات والصيانة',
      category: 'financial',
      iconName: 'trending-down',
      color: theme.colors.error,
      lastGenerated: stats?.lastGenerated,
      requiresFilter: true,
      filterType: 'expense-type' as const,
      accessRoles: ['admin', 'manager', 'owner']
    },
    { 
      id: 'revenue-report', 
      type: 'revenue-report',
      title: 'تقرير الإيرادات', 
      titleEn: 'Revenue Report',
      description: 'تحليل شامل للإيرادات والدخل',
      category: 'financial',
      iconName: 'trending-up',
      color: theme.colors.tertiary,
      lastGenerated: stats?.lastGenerated,
      requiresFilter: false,
      accessRoles: ['admin', 'manager', 'owner']
    },
    { 
      id: 'financial-statements', 
      type: 'financial-statements',
      title: 'البيانات المالية', 
      titleEn: 'Financial Statements',
      description: 'البيانات المالية الشاملة للشركة',
      category: 'financial',
      iconName: 'assessment',
      color: theme.colors.primary,
      lastGenerated: stats?.lastGenerated,
      requiresFilter: false,
      accessRoles: ['admin', 'manager', 'owner']
    },
    { 
      id: 'property-report', 
      type: 'property-report',
      title: 'تقرير العقار', 
      titleEn: 'Property Report',
      description: 'تقرير مفصل لعقار محدد',
      category: 'properties',
      iconName: 'home',
      color: theme.colors.secondary,
      lastGenerated: stats?.lastGenerated,
      requiresFilter: true,
      filterType: 'property' as const,
      accessRoles: ['admin', 'manager', 'owner']
    },
    { 
      id: 'tenant-statement', 
      type: 'tenant-statement',
      title: 'كشف حساب المستأجرين للمالك', 
      titleEn: 'Tenants Statement for Owner',
      description: 'كشف حساب مستأجر محدد للمالك',
      category: 'tenants',
      iconName: 'people',
      color: theme.colors.tertiary,
      lastGenerated: stats?.lastGenerated,
      requiresFilter: true,
      filterType: 'tenant' as const,
      accessRoles: ['admin', 'manager', 'owner']
    },
    { 
      id: 'owner-financial', 
      type: 'owner-financial',
      title: 'التقرير المالي للمالك', 
      titleEn: 'Owner Financial Report',
      description: 'التقرير المالي الشامل لمالك محدد',
      category: 'owners',
      iconName: 'business',
      color: theme.colors.primary,
      lastGenerated: stats?.lastGenerated,
      requiresFilter: true,
      filterType: 'owner' as const,
      accessRoles: ['admin', 'manager', 'owner']
    },
    { 
      id: 'payments-late-tenants', 
      type: 'payments-late-tenants',
      title: 'مواعيد الدفع والمستأجرين المتأخرين', 
      titleEn: 'Payment Dates and Late Tenants',
      description: 'تقرير المدفوعات والمستأجرين المتأخرين',
      category: 'tenants',
      iconName: 'schedule',
      color: theme.colors.error,
      lastGenerated: stats?.lastGenerated,
      requiresFilter: false,
      accessRoles: ['admin', 'manager', 'owner']
    },
    { 
      id: 'electrical-meter', 
      type: 'electrical-meter',
      title: 'تقرير عداد الكهرباء', 
      titleEn: 'Electrical Meter Report',
      description: 'تقارير استهلاك الكهرباء للعقارات',
      category: 'operations',
      iconName: 'electrical-services',
      color: theme.colors.secondary,
      lastGenerated: stats?.lastGenerated,
      requiresFilter: false,
      accessRoles: ['admin', 'manager', 'owner']
    },
    { 
      id: 'water-meters', 
      type: 'water-meters',
      title: 'تقرير عدادات المياه', 
      titleEn: 'Water Meters Report',
      description: 'تقارير استهلاك المياه للعقارات',
      category: 'operations',
      iconName: 'water-drop',
      color: '#2196F3',
      lastGenerated: stats?.lastGenerated,
      requiresFilter: false,
      accessRoles: ['admin', 'manager', 'owner']
    }
  ].filter(report => 
    userContext?.role && report.accessRoles.includes(userContext.role)
  ), [t, theme.colors, stats, userContext?.role]);

  const categories = [
    { id: 'all', title: t('reports:allReports'), icon: 'dashboard' },
    { id: 'summary', title: t('reports:summary'), icon: 'summarize' },
    { id: 'financial', title: t('reports:financial'), icon: 'account-balance' },
    { id: 'properties', title: t('reports:properties'), icon: 'home' },
    { id: 'tenants', title: t('reports:tenants'), icon: 'people' },
    { id: 'owners', title: t('reports:owners'), icon: 'business' },
    { id: 'operations', title: t('reports:operations'), icon: 'build' }
  ];

  // Memoized filtered reports - PERFORMANCE OPTIMIZATION  
  const filteredReports = useMemo(() => 
    availableReports.filter(report => 
      selectedCategory === 'all' || report.category === selectedCategory
    ), [availableReports, selectedCategory]);

  // Memoized formatDate function - PERFORMANCE OPTIMIZATION
  const formatDate = useCallback((isoString?: string) => {
    if (!isoString) return t('common:notAvailable');
    return new Date(isoString).toLocaleDateString('en-US');
  }, [t]);

  // Memoized FlatList callback functions - PERFORMANCE OPTIMIZATION
  const getItemKey = useCallback((item: any) => item.id, []);
  
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 200, // Estimated item height
    offset: 200 * index,
    index,
  }), []);

  // Helper functions defined before they are used
  const formatLastGenerated = (isoString?: string) => {
    if (!isoString) return 'Never generated';
    const date = new Date(isoString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  };

  const mapReportTypeToPDFType = (reportType: string): 'revenue' | 'expense' | 'property' | 'tenant' | 'maintenance' => {
    const mapping: Record<string, 'revenue' | 'expense' | 'property' | 'tenant' | 'maintenance'> = {
      'revenue-report': 'revenue',
      'expense-report': 'expense', 
      'property-report': 'property',
      'tenant-statement': 'tenant',
      'payments-late-tenants': 'tenant',
      'electrical-meter': 'maintenance'
    };
    return mapping[reportType] || 'revenue';
  };

  const handleDownloadPDF = async (report: any) => {
    try {
      if (report.requiresFilter && report.filterType) {
        // Show filter modal for reports that require filtering
        setCurrentReportId(report.id);
        setCurrentFilterType(report.filterType);
        setCurrentAction('download');
        setFilterModalVisible(true);
        
        // Fetch filter options based on the filter type
        await fetchFilterOptions(report.filterType);
        return;
      }

      // Generate report without filtering
      await generatePDFReport(report.id, report.title, report.titleEn);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  const handleViewReport = async (report: any) => {
    try {
      if (report.requiresFilter && report.filterType) {
        // Show filter modal for reports that require filtering
        setCurrentReportId(report.id);
        setCurrentFilterType(report.filterType);
        setCurrentAction('view');
        setFilterModalVisible(true);
        
        // Fetch filter options based on the filter type
        await fetchFilterOptions(report.filterType);
        return;
      }

      // View report without filtering
      await viewReport(report.id, report.title, report.titleEn);
    } catch (error) {
      console.error('Error viewing report:', error);
      Alert.alert('Error', 'Failed to load report for viewing');
    }
  };

  const generatePDFReport = async (reportId: string, title: string, titleEn?: string, filterId?: string, filterType?: string) => {
    try {
      setGeneratingPDF(reportId);

      let result;

      // Use specific helper methods for different report types
      switch (reportId) {
        case 'property-report':
          if (!filterId) {
            Alert.alert('Error', 'Please select a property for this report');
            return;
          }
          result = await pdfApi.generatePropertyReport(filterId, userContext!);
          break;

        case 'tenant-statement':
          if (!filterId) {
            Alert.alert('Error', 'Please select a tenant for this report');
            return;
          }
          result = await pdfApi.generateTenantStatement(filterId, userContext!);
          break;

        case 'owner-financial':
          if (!filterId) {
            Alert.alert('Error', 'Please select an owner for this report');
            return;
          }
          result = await pdfApi.generateOwnerReport(filterId, userContext!);
          break;

        case 'expense-report':
          const expenseType = filterType as 'sales' | 'maintenance' | 'all' || 'all';
          result = await pdfApi.generateExpenseReport(expenseType, userContext!);
          break;

        case 'water-meters':
          result = await pdfApi.generateWaterMetersReport(userContext!, {
            dateRange: universalFilters.dateRange,
            propertyTypes: universalFilters.propertyTypes,
            cities: universalFilters.cities,
            neighborhoods: universalFilters.neighborhoods,
            paymentStatuses: universalFilters.paymentStatuses,
            includeSubProperties: universalFilters.includeSubProperties
          });
          break;

        default:
          // Use the general filtered report method with universal filters
          result = await pdfApi.generateFilteredReport(reportId, title, userContext!, {
            ...(filterId && { [currentFilterType + 'Id']: filterId }),
            ...(filterType && { reportType: filterType }),
            // Add universal filters
            dateRange: universalFilters.dateRange,
            propertyTypes: universalFilters.propertyTypes,
            cities: universalFilters.cities,
            neighborhoods: universalFilters.neighborhoods,
            paymentStatuses: universalFilters.paymentStatuses,
            includeSubProperties: universalFilters.includeSubProperties
          });
      }

      if (result.success) {
        // Handle actual file delivery
        if (result.pdfData && result.contentType === 'application/pdf') {
          await pdfApi.downloadPDF(result.pdfData, result.filename || `${title || 'report'}.pdf`);
        } else if (result.htmlContent) {
          // Convert to PDF if possible, else download HTML
          const desiredName = (result.filename || `${title || 'report'}.html`).replace('.html', '.pdf');
          const converted = await pdfApi.convertHTMLToPDF(result.htmlContent, desiredName);
          if (!converted) {
            await pdfApi.downloadHTML(result.htmlContent, result.filename || `${title || 'report'}.html`);
          }
        }
        Alert.alert('Success', 'PDF report generated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to generate PDF report');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    } finally {
      setGeneratingPDF(null);
    }
  };

  const viewReport = async (reportId: string, title: string, titleEn?: string, filterId?: string, filterType?: string) => {
    try {
      setReportViewLoading(true);

      let result;

      // Use specific helper methods for different report types
      switch (reportId) {
        case 'property-report':
          if (!filterId) {
            Alert.alert('Error', 'Please select a property for this report');
            return;
          }
          result = await pdfApi.viewPropertyReport(filterId, userContext!);
          break;

        case 'tenant-statement':
          if (!filterId) {
            Alert.alert('Error', 'Please select a tenant for this report');
            return;
          }
          result = await pdfApi.viewTenantStatement(filterId, userContext!);
          break;

        case 'owner-financial':
          if (!filterId) {
            Alert.alert('Error', 'Please select an owner for this report');
            return;
          }
          result = await pdfApi.viewOwnerReport(filterId, userContext!);
          break;

        case 'expense-report':
          const expenseType = filterType as 'sales' | 'maintenance' | 'all' || 'all';
          result = await pdfApi.viewExpenseReport(expenseType, userContext!);
          break;

        case 'water-meters':
          result = await pdfApi.viewWaterMetersReport(userContext!, {
            dateRange: universalFilters.dateRange,
            propertyTypes: universalFilters.propertyTypes,
            cities: universalFilters.cities,
            neighborhoods: universalFilters.neighborhoods,
            paymentStatuses: universalFilters.paymentStatuses,
            includeSubProperties: universalFilters.includeSubProperties
          });
          break;

        default:
          // Use the general filtered report method for viewing with universal filters
          result = await pdfApi.viewFilteredReport(reportId, title, userContext!, {
            ...(filterId && { [currentFilterType + 'Id']: filterId }),
            ...(filterType && { reportType: filterType }),
            // Add universal filters
            dateRange: universalFilters.dateRange,
            propertyTypes: universalFilters.propertyTypes,
            cities: universalFilters.cities,
            neighborhoods: universalFilters.neighborhoods,
            paymentStatuses: universalFilters.paymentStatuses,
            includeSubProperties: universalFilters.includeSubProperties
          });
      }

      if (result.success) {
        // On web, open in a new tab for better UX
        if (typeof window !== 'undefined' && result.htmlContent) {
          const opened = await pdfApi.openHTML(result.htmlContent, title || 'Report');
          if (!opened) {
            // Fallback to in-app modal
            setCurrentReportData({
              id: reportId,
              title: title,
              titleEn: titleEn,
              content: result.htmlContent,
              data: result.data
            });
            setReportViewerVisible(true);
          }
        } else {
          // Native path: show in modal
          setCurrentReportData({
            id: reportId,
            title: title,
            titleEn: titleEn,
            content: result.htmlContent,
            data: result.data
          });
          setReportViewerVisible(true);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to load report for viewing');
      }
    } catch (error) {
      console.error('Error viewing report:', error);
      Alert.alert('Error', 'Failed to load report for viewing');
    } finally {
      setReportViewLoading(false);
    }
  };

  const handleFilterSelect = (filterId: string, filterType?: string) => {
    const report = availableReports.find(r => r.id === currentReportId);
    if (report) {
      if (currentAction === 'download') {
        generatePDFReport(currentReportId, report.title, report.titleEn, filterId, filterType);
      } else {
        viewReport(currentReportId, report.title, report.titleEn, filterId, filterType);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh all connected data for comprehensive updates
    await Promise.all([
      refetchStats(),
      // Add other refetch functions here when they're available
    ]);
    setRefreshing(false);
  }, [refetchStats]);

  const renderReportItem = useCallback(({ item }: { item: any }) => (
    <View style={[styles.reportCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.reportHeader, { flexDirection: getFlexDirection('row') }]}>
        <View style={[styles.reportInfo, { flexDirection: getFlexDirection('row') }]}>
          <View style={[
            styles.iconContainer, 
            { backgroundColor: `${(item.color || theme.colors.onSurfaceVariant)}20` }, 
            rtlStyles.marginRight(12)
          ]}>
            <MaterialIcons name={item.iconName as any} size={24} color={item.color} />
          </View>
          <View style={styles.reportDetails}>
            <Text style={[styles.reportTitle, rtlStyles.textAlignStart, { color: theme.colors.onSurface }]}>
              {item.title}
            </Text>
            <Text style={[styles.reportDescription, rtlStyles.textAlignStart, { color: theme.colors.onSurfaceVariant }]}>
              {item.description}
            </Text>
            {item.requiresFilter && (
              <View style={[styles.filterBadge, { flexDirection: getFlexDirection('row') }]}>
                <MaterialIcons name="filter-list" size={12} color={theme.colors.primary} />
                <Text style={[styles.filterText, rtlStyles.marginLeft(4), { color: theme.colors.primary }]}>
                  {t('reports:requiresFilter', { filterType: t(`reports:filterType_${item.filterType}`) })}
                </Text>
              </View>
            )}
          </View>
        </View>
        {generatingPDF === item.id ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.actionButtons}>
            <IconButton
              icon={(props) => (
                <MaterialIcons name="visibility" size={20} color={props.color || theme.colors.secondary} />
              )}
              selected={false}
              onPress={() => handleViewReport(item)}
              style={styles.actionButton}
            />
            <IconButton
              icon={(props) => (
                <MaterialIcons name="download" size={20} color={props.color || theme.colors.primary} />
              )}
              selected={false}
              onPress={() => handleDownloadPDF(item)}
              style={styles.actionButton}
            />
          </View>
        )}
      </View>

      <View style={styles.reportData}>
        <Text style={[styles.reportTime, rtlStyles.textAlign(), { color: theme.colors.onSurfaceVariant }]}>
          {t('reports:downloadAvailable')}
        </Text>
      </View>

      <View style={[styles.reportFooter, { borderTopColor: theme.colors.outline }]}>
        <Text style={[styles.lastGenerated, rtlStyles.textAlign(), { color: theme.colors.onSurfaceVariant }]}>
          {t('reports:lastUpdated', { date: formatDate(item.lastGenerated) })}
        </Text>
      </View>
    </View>
  ), [theme, generatingPDF, t, handleDownloadPDF, formatDate]);

  // Render Quick Statistics (matching dashboard's horizontal stats container)
  const renderQuickStats = () => (
    <View style={styles.quickStatsSection}>
      <Text style={[styles.sectionTitle, rtlStyles.textAlign(), { color: theme.colors.onBackground }]}>
        {t('reports:quickStatistics')}
      </Text>
      <View style={[styles.horizontalStatsCard, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.horizontalStatsRow, { flexDirection: getFlexDirection('row') }]}>
          <View style={styles.horizontalStatItem}>
            <View style={[styles.horizontalStatIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
              <MaterialIcons name="assessment" size={24} color={theme.colors.primary} />
            </View>
            <Text style={[styles.horizontalStatLabel, rtlStyles.textAlign(), { color: theme.colors.onSurfaceVariant }]}>
              {t('reports:totalReports')}
            </Text>
            <Text style={[styles.horizontalStatValue, rtlStyles.textAlign(), { color: theme.colors.primary }]}> 
              {statsLoading ? '...' : formatDisplayNumber(connectedStats.totalReports)}
            </Text>
          </View>
          
          <View style={styles.horizontalStatItem}>
            <View style={[styles.horizontalStatIcon, { backgroundColor: '#4CAF5020' }]}>
              <MaterialIcons name="people" size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.horizontalStatLabel, rtlStyles.textAlign(), { color: theme.colors.onSurfaceVariant }]}>
              المستأجرين النشطين
            </Text>
            <Text style={[styles.horizontalStatValue, rtlStyles.textAlign(), { color: '#4CAF50' }]}> 
              {tenantsLoading ? '...' : formatDisplayNumber(connectedStats.activeTenants)}
            </Text>
          </View>
          
          <View style={styles.horizontalStatItem}>
            <View style={[styles.horizontalStatIcon, { backgroundColor: '#2196F320' }]}>
              <MaterialIcons name="home" size={24} color="#2196F3" />
            </View>
            <Text style={[styles.horizontalStatLabel, rtlStyles.textAlign(), { color: theme.colors.onSurfaceVariant }]}>
              العقارات المشغولة
            </Text>
            <Text style={[styles.horizontalStatValue, rtlStyles.textAlign(), { color: '#2196F3' }]}> 
              {dashboardLoading ? '...' : formatDisplayNumber(connectedStats.occupiedProperties)}
            </Text>
          </View>
          
          <View style={styles.horizontalStatItem}>
            <View style={[styles.horizontalStatIcon, { backgroundColor: '#FF980020' }]}>
              <MaterialIcons name="attach-money" size={24} color="#FF9800" />
            </View>
            <Text style={[styles.horizontalStatLabel, rtlStyles.textAlign(), { color: theme.colors.onSurfaceVariant }]}>
              الإيرادات الشهرية
            </Text>
            <Text style={[styles.horizontalStatValue, rtlStyles.textAlign(), { color: '#FF9800' }]}> 
              {dashboardLoading ? '...' : `${toArabicNumerals((connectedStats.monthlyRevenue / 1000).toFixed(0))}K`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (!canAccessReports) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title={t('reports:title')} />
        <View style={styles.noAccessContainer}>
          <MaterialIcons name="lock" size={64} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.noAccessText, rtlStyles.textAlign(), { color: theme.colors.onSurface }]}> 
            {t('reports:noAccessMessage')}
          </Text>
          <Text style={[styles.noAccessSubtext, rtlStyles.textAlign(), { color: theme.colors.onSurfaceVariant }]}>
            {t('reports:noAccessSuggestion')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading while checking permissions
  if (permissionLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title={t('reports:title')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}> 
            {t('common:loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If user doesn't have reports access, show access denied
  if (!canAccessReports) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader title={t('reports:title')} />
        <View style={styles.accessDeniedContainer}>
          <MaterialIcons name="report-off" size={64} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.accessDeniedText, { color: theme.colors.onSurface }]}> 
            Access Denied
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}> 
            You don't have permission to view reports. Only admins, managers, and property owners can access reports.
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}> 
            Current Role: {userContext?.role || 'None'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader title={t('reports:title')} />
      
      <ScrollView 
        style={[styles.content, { backgroundColor: theme.colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderQuickStats()}

        <View style={styles.categoryContainer}>
          <Text style={[styles.mainTitle, rtlStyles.textAlignStart, { color: theme.colors.onBackground, marginBottom: 16 }]}>
            {t('common:categories')}
          </Text>
          <View style={[styles.categoryGrid, { flexDirection: getFlexDirection('row') }]}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: selectedCategory === category.id ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.outline,
                  }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <MaterialIcons
                  name={category.icon as any}
                  size={24}
                  color={selectedCategory === category.id ? theme.colors.onPrimary : theme.colors.onSurface}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    rtlStyles.textAlignStart,
                    {
                      color: selectedCategory === category.id ? theme.colors.onPrimary : theme.colors.onSurface,
                    }
                  ]}
                >
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Universal Report Filters */}
        <View style={styles.universalFiltersContainer}>
          <View style={styles.universalFiltersHeader}>
            <Text style={[styles.mainTitle, rtlStyles.textStart, { color: theme.colors.onBackground, marginBottom: 16 }]}>
              Universal Report Filters
            </Text>
            <TouchableOpacity
              style={styles.filterToggleButton}
              onPress={() => setShowUniversalFilters(!showUniversalFilters)}
            >
              <MaterialIcons
                name={showUniversalFilters ? 'expand-less' : 'expand-more'}
                size={24}
                color={theme.colors.primary}
              />
              <Text style={[styles.filterToggleText, { color: theme.colors.primary }]}>
                {showUniversalFilters ? 'Hide Filters' : 'Show Filters'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {showUniversalFilters && (
            <ReportFilters
              onFiltersChange={setUniversalFilters}
              initialFilters={universalFilters}
              availableCities={properties?.data?.map((p: any) => p.city).filter((c: string, i: number, arr: string[]) => arr.indexOf(c) === i) || []}
              showAdvancedFilters={true}
            />
          )}
        </View>

        <View style={styles.reportsContainer}>
          <Text style={[styles.mainTitle, rtlStyles.textStart, { color: theme.colors.onBackground, marginBottom: 16, marginTop: 24 }]}> 
            {t('reports:availableReportsCount', { count: filteredReports.length })}
          </Text>
          
          <FlatList
            data={filteredReports}
            renderItem={renderReportItem}
            keyExtractor={getItemKey}
            showsVerticalScrollIndicator={false}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={10}
            initialNumToRender={5}
            updateCellsBatchingPeriod={50}
            getItemLayout={getItemLayout}
          />
        </View>
      </ScrollView>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => {
          setFilterModalVisible(false);
          setCurrentFilterType(null);
          setCurrentReportId('');
          setFilterOptions([]);
        }}
        onApply={(filter) => {
          if (currentAction === 'download') {
            generatePDFReport(currentReportId, '', '', filter.id, currentFilterType);
          } else {
            viewReport(currentReportId, '', '', filter.id, currentFilterType);
          }
          setFilterModalVisible(false);
          setCurrentFilterType(null);
          setCurrentReportId('');
          setFilterOptions([]);
        }}
        filterType={currentFilterType || ''}
        options={filterOptions}
        loading={loadingFilterOptions}
      />

      <ReportViewerModal
        visible={reportViewerVisible}
        onClose={() => setReportViewerVisible(false)}
        reportData={currentReportData}
        onDownload={() => {
          if (currentReportData) {
            generatePDFReport(currentReportData.id, currentReportData.title, currentReportData.titleEn);
          }
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  quickStatsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 16,
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
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
    flexDirection: 'row',
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
  categoryContainer: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  universalFiltersContainer: {
    marginBottom: 24,
  },
  universalFiltersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  filterToggleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  reportsContainer: {
    marginBottom: 24,
  },
  reportCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportDetails: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  filterBadge: {
    alignItems: 'center',
    marginTop: 4,
  },
  filterText: {
    fontSize: 12,
  },
  loadingContainer: {
    padding: 8,
  },
  reportData: {
    marginBottom: 12,
  },
  reportTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  reportFooter: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  lastGenerated: {
    fontSize: 12,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noAccessText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noAccessSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  modalLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  modalEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  modalEmptyText: {
    fontSize: 14,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOptionSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#1976D2', // Default primary color
  },
  modalButtonSecondary: {
    backgroundColor: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#B0B0B0',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
    color: theme.colors.onSurfaceVariant,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  reportViewerContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
    elevation: 4,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  reportViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportViewerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    color: theme.colors.onSurface,
  },
  closeButton: {
    padding: 8,
  },
  reportContent: {
    flex: 1,
  },
  htmlContentContainer: {
    padding: 16,
  },
  htmlContent: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.onSurface,
  },
  noContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noContentText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
  noContentSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  reportViewerFooter: {
    alignItems: 'center',
    marginTop: 20,
  },
  reportViewerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  reportViewerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: theme.colors.onPrimary,
  },
});