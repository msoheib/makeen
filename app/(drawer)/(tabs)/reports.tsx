import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, FlatList, RefreshControl, Alert, ActivityIndicator, Modal, TouchableOpacity, I18nManager, Text } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import ModernHeader from '@/components/ModernHeader';
import { useApi } from '@/hooks/useApi';
import { reportsApi } from '@/lib/api';
import { pdfApi, PDFRequest } from '@/lib/pdfApi';
import { useStore } from '@/lib/store';
import { useTranslation } from '@/lib/useTranslation';
import { rtlStyles, getFlexDirection } from '@/lib/rtl';
import { profilesApi } from '@/lib/api';
import { propertiesApi } from '@/lib/api';

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

  // Force light theme colors for testing
  const lightColors = {
    surface: '#FFFFFF',
    onSurface: '#212121',
    onSurfaceVariant: '#757575',
    primary: '#1976D2',
    primaryContainer: '#E3F2FD',
    onPrimary: '#FFFFFF',
    outline: '#E0E0E0'
  };

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
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: lightColors.surface }]}>
          <Text style={[styles.modalTitle, rtlStyles.textAlign(), { color: lightColors.onSurface }]}>
            {getFilterTypeLabel(filterType)}
          </Text>
          
          {loading ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color={lightColors.primary} />
              <Text style={[styles.modalLoadingText, rtlStyles.textAlign(), { color: lightColors.onSurfaceVariant }]}>
                {t('common:loading')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              style={styles.modalOptionsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selectedOption?.id === item.id && { backgroundColor: lightColors.primaryContainer }
                  ]}
                  onPress={() => setSelectedOption(item)}
                >
                  <View style={styles.modalOptionContent}>
                    <Text style={[
                      styles.modalOptionText, 
                      rtlStyles.textAlign(),
                      { color: lightColors.onSurface }
                    ]}>
                      {item.name}
                    </Text>
                    {item.email && (
                      <Text style={[
                        styles.modalOptionSubtext, 
                        rtlStyles.textAlign(),
                        { color: lightColors.onSurfaceVariant }
                      ]}>
                        {item.email}
                      </Text>
                    )}
                    {item.address && (
                      <Text style={[
                        styles.modalOptionSubtext, 
                        rtlStyles.textAlign(),
                        { color: lightColors.onSurfaceVariant }
                      ]}>
                        {item.address}
                      </Text>
                    )}
                  </View>
                  {selectedOption?.id === item.id && (
                    <MaterialIcons name="check" size={20} color={lightColors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmptyContainer}>
                  <Text style={[styles.modalEmptyText, rtlStyles.textAlign(), { color: lightColors.onSurfaceVariant }]}>
                    {t('common:noData')}
                  </Text>
                </View>
              }
            />
          )}
          
          <View style={[styles.modalActions, rtlStyles.rowReverse()]}>
            <TouchableOpacity
              style={[
                styles.modalButton, 
                { 
                  backgroundColor: selectedOption ? lightColors.primary : lightColors.onSurfaceVariant,
                  opacity: selectedOption ? 1 : 0.6
                }, 
                rtlStyles.marginLeft(8)
              ]}
              onPress={() => {
                if (selectedOption) {
                  onApply(selectedOption);
                  onClose();
                }
              }}
              disabled={!selectedOption}
            >
              <Text style={[styles.modalButtonText, { color: lightColors.onPrimary }]}>
                {t('common:apply')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: lightColors.surface, borderWidth: 1, borderColor: lightColors.outline }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: lightColors.onSurface }]}>
                {t('common:cancel')}
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
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [currentFilterType, setCurrentFilterType] = useState<string | null>(null);
  const [currentReportId, setCurrentReportId] = useState<string>('');
  const [appliedFilters, setAppliedFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState<any[]>([]);
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);

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

  // Get user context for role-based filtering
  const userContext = {
    userId: user?.id || '',
    role: (user?.role as 'admin' | 'manager' | 'owner' | 'tenant') || 'tenant',
    ownedPropertyIds: user?.ownedPropertyIds || []
  };

  // Check if user has access to reports
  const hasReportAccess = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'owner';

  const { 
    data: stats, 
    loading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useApi(() => reportsApi.getStats(), []);

  // Fetch filter options based on filter type
  const fetchFilterOptions = async (filterType: string) => {
    setLoadingFilterOptions(true);
    try {
      let options = [];
      
      switch (filterType) {
        case 'tenant':
          const tenantsResponse = await profilesApi.getTenants();
          if (tenantsResponse.success && tenantsResponse.data) {
            options = tenantsResponse.data.map((tenant: any) => ({
              id: tenant.id,
              name: `${tenant.first_name} ${tenant.last_name}`,
              email: tenant.email
            }));
          }
          break;
          
        case 'owner':
          const ownersResponse = await profilesApi.getOwners();
          if (ownersResponse.success && ownersResponse.data) {
            options = ownersResponse.data.map((owner: any) => ({
              id: owner.id,
              name: `${owner.first_name} ${owner.last_name}`,
              email: owner.email
            }));
          }
          break;
          
        case 'property':
          const propertiesResponse = await propertiesApi.getAll();
          if (propertiesResponse.success && propertiesResponse.data) {
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
      
      setFilterOptions(options);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      setFilterOptions([]);
    } finally {
      setLoadingFilterOptions(false);
    }
  };

  const availableReports = [
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
    }
  ].filter(report => 
    report.accessRoles.includes(userContext.role)
  );

  const categories = [
    { id: 'all', title: t('reports:allReports'), icon: 'dashboard' },
    { id: 'summary', title: t('reports:summary'), icon: 'summarize' },
    { id: 'financial', title: t('reports:financial'), icon: 'account-balance' },
    { id: 'properties', title: t('reports:properties'), icon: 'home' },
    { id: 'tenants', title: t('reports:tenants'), icon: 'people' },
    { id: 'owners', title: t('reports:owners'), icon: 'business' },
    { id: 'operations', title: t('reports:operations'), icon: 'build' }
  ];

  const filteredReports = availableReports.filter(report => 
    selectedCategory === 'all' || report.category === selectedCategory
  );

  const formatDate = (isoString?: string) => {
    if (!isoString) return t('common:notAvailable');
    return new Date(isoString).toLocaleDateString(I18nManager.isRTL ? 'ar-SA' : 'en-US');
  };

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
          result = await pdfApi.generatePropertyReport(filterId, userContext);
          break;

        case 'tenant-statement':
          if (!filterId) {
            Alert.alert('Error', 'Please select a tenant for this report');
            return;
          }
          result = await pdfApi.generateTenantStatement(filterId, userContext);
          break;

        case 'owner-financial':
          if (!filterId) {
            Alert.alert('Error', 'Please select an owner for this report');
            return;
          }
          result = await pdfApi.generateOwnerReport(filterId, userContext);
          break;

        case 'expense-report':
          const expenseType = filterType as 'sales' | 'maintenance' | 'all' || 'all';
          result = await pdfApi.generateExpenseReport(expenseType, userContext);
          break;

        default:
          // Use the general filtered report method
          result = await pdfApi.generateFilteredReport(reportId, title, userContext, {
            ...(filterId && { [currentFilterType + 'Id']: filterId }),
            ...(filterType && { reportType: filterType })
          });
      }

      if (result.success) {
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

  const handleFilterSelect = (filterId: string, filterType?: string) => {
    const report = availableReports.find(r => r.id === currentReportId);
    if (report) {
      generatePDFReport(currentReportId, report.title, report.titleEn, filterId, filterType);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchStats();
    setRefreshing(false);
  }, [refetchStats]);

  // Render Quick Statistics (matching dashboard's horizontal stats container)
  const renderQuickStats = () => (
    <View style={styles.quickStatsSection}>
      <Text style={[styles.sectionTitle, rtlStyles.textAlign(), { color: lightColors.onBackground }]}>
        {t('reports:quickStatistics')}
      </Text>
      <View style={[styles.horizontalStatsCard, { backgroundColor: lightColors.surface }]}>
        <View style={[styles.horizontalStatsRow, { flexDirection: getFlexDirection('row') }]}>
          <View style={styles.horizontalStatItem}>
            <View style={[styles.horizontalStatIcon, { backgroundColor: `${lightColors.primary}20` }]}>
              <MaterialIcons name="assessment" size={24} color={lightColors.primary} />
            </View>
            <Text style={[styles.horizontalStatLabel, rtlStyles.textAlign(), { color: lightColors.onSurfaceVariant }]}>
              {t('reports:totalReports')}
            </Text>
            <Text style={[styles.horizontalStatValue, rtlStyles.textAlign(), { color: lightColors.primary }]}>
              {statsLoading ? '...' : (stats?.data?.totalReports || '12')}
            </Text>
          </View>
          
          <View style={styles.horizontalStatItem}>
            <View style={[styles.horizontalStatIcon, { backgroundColor: '#4CAF5020' }]}>
              <MaterialIcons name="file-download" size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.horizontalStatLabel, rtlStyles.textAlign(), { color: lightColors.onSurfaceVariant }]}>
              {t('reports:generatedThisMonth')}
            </Text>
            <Text style={[styles.horizontalStatValue, rtlStyles.textAlign(), { color: '#4CAF50' }]}>
              {statsLoading ? '...' : (stats?.data?.generatedThisMonth || '8')}
            </Text>
          </View>
          
          <View style={styles.horizontalStatItem}>
            <View style={[styles.horizontalStatIcon, { backgroundColor: '#FF980020' }]}>
              <MaterialIcons name="schedule" size={24} color="#FF9800" />
            </View>
            <Text style={[styles.horizontalStatLabel, rtlStyles.textAlign(), { color: lightColors.onSurfaceVariant }]}>
              {t('reports:avgGenerationTime')}
            </Text>
            <Text style={[styles.horizontalStatValue, rtlStyles.textAlign(), { color: '#FF9800' }]}>
              {statsLoading ? '...' : (stats?.data?.avgGenerationTime || '2.1s')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (!hasReportAccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: lightColors.background }]}>
        <ModernHeader title={t('reports:title')} />
        <View style={styles.noAccessContainer}>
          <MaterialIcons name="lock" size={64} color={lightColors.onSurfaceVariant} />
          <Text style={[styles.noAccessText, rtlStyles.textAlign(), { color: lightColors.onSurface }]}>
            {t('reports:noAccessMessage')}
          </Text>
          <Text style={[styles.noAccessSubtext, rtlStyles.textAlign(), { color: lightColors.onSurfaceVariant }]}>
            {t('reports:noAccessSuggestion')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: lightColors.background }]}>
      <ModernHeader title={t('reports:title')} />
      
      <ScrollView 
        style={[styles.content, { backgroundColor: lightColors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderQuickStats()}

        <View style={styles.categoryContainer}>
          <Text style={[styles.mainTitle, rtlStyles.textAlign(), { color: lightColors.onBackground, marginBottom: 16 }]}>
            {t('common:categories')}
          </Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: selectedCategory === category.id ? lightColors.primary : lightColors.surface,
                    borderColor: lightColors.outline,
                  }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <MaterialIcons
                  name={category.icon as any}
                  size={24}
                  color={selectedCategory === category.id ? lightColors.onPrimary : lightColors.onSurface}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    rtlStyles.textAlign(),
                    {
                      color: selectedCategory === category.id ? lightColors.onPrimary : lightColors.onSurface,
                    }
                  ]}
                >
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.reportsContainer}>
          <Text style={[styles.mainTitle, rtlStyles.textAlign(), { color: lightColors.onBackground, marginBottom: 16, marginTop: 24 }]}>
            {t('reports:availableReportsCount', { count: filteredReports.length })}
          </Text>
          
          <FlatList
            data={filteredReports}
            renderItem={({ item }) => (
              <View style={[styles.reportCard, { backgroundColor: lightColors.surface }]}>
                <View style={[styles.reportHeader, { flexDirection: getFlexDirection('row') }]}>
                  <View style={[styles.reportInfo, { flexDirection: getFlexDirection('row') }]}>
                    <View style={[
                      styles.iconContainer, 
                      { backgroundColor: `${item.color}20` }, 
                      rtlStyles.marginRight(12)
                    ]}>
                      <MaterialIcons name={item.iconName as any} size={24} color={item.color} />
                    </View>
                    <View style={styles.reportDetails}>
                      <Text style={[styles.reportTitle, rtlStyles.textAlign(), { color: lightColors.onSurface }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.reportDescription, rtlStyles.textAlign(), { color: lightColors.onSurfaceVariant }]}>
                        {item.description}
                      </Text>
                      {item.requiresFilter && (
                        <View style={[styles.filterBadge, { flexDirection: getFlexDirection('row') }]}>
                          <MaterialIcons name="filter-list" size={12} color={lightColors.primary} />
                          <Text style={[styles.filterText, rtlStyles.marginLeft(4), { color: lightColors.primary }]}>
                            {t('reports:requiresFilter', { filterType: t(`reports:filterType_${item.filterType}`) })}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {generatingPDF === item.id ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={lightColors.primary} />
                    </View>
                  ) : (
                    <IconButton
                      icon="download"
                      size={20}
                      iconColor={lightColors.primary}
                      onPress={() => handleDownloadPDF(item)}
                    />
                  )}
                </View>

                <View style={styles.reportData}>
                  <Text style={[styles.reportTime, rtlStyles.textAlign(), { color: lightColors.onSurfaceVariant }]}>
                    {t('reports:downloadAvailable')}
                  </Text>
                </View>

                <View style={[styles.reportFooter, { borderTopColor: lightColors.outline }]}>
                  <Text style={[styles.lastGenerated, rtlStyles.textAlign(), { color: lightColors.onSurfaceVariant }]}>
                    {t('reports:lastUpdated', { date: formatDate(item.lastGenerated) })}
                  </Text>
                </View>
              </View>
            )}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
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
          generatePDFReport(currentReportId, '', '', filter.id, currentFilterType);
          setFilterModalVisible(false);
          setCurrentFilterType(null);
          setCurrentReportId('');
          setFilterOptions([]);
        }}
        filterType={currentFilterType || ''}
        options={filterOptions}
        loading={loadingFilterOptions}
      />
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 16,
  },
  horizontalStatsCard: {
    borderRadius: 12,
    padding: 16,
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
    alignItems: 'center',
    flex: 1,
  },
  horizontalStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  horizontalStatLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  horizontalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
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
    marginTop: 20,
    gap: 8,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});