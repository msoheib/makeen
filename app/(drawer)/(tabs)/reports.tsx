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
import { rtlStyles } from '@/lib/rtl';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filter: any) => void;
  filterType: string;
  options: any[];
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply, filterType, options }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<any>(null);

  // Use theme colors from the fixed useTheme hook
  const colors = theme.colors;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
            {t('reports:selectFilter')} {filterType}
          </Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  selectedOption?.id === item.id && { backgroundColor: colors.primaryContainer }
                ]}
                onPress={() => setSelectedOption(item)}
              >
                <Text style={[styles.modalOptionText, { color: colors.onSurface }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                onApply(selectedOption);
                onClose();
              }}
            >
              <Text style={[styles.modalButtonText, { color: colors.onPrimary }]}>
                {t('common:apply')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.surface }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.onSurface }]}>
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

  // Use theme colors from the fixed useTheme hook
  const colors = theme.colors;

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
      <Text style={[styles.sectionTitle, { color: lightColors.onBackground }]}>
        {t('reports:quickStatistics')}
      </Text>
      <View style={[styles.horizontalStatsCard, { backgroundColor: lightColors.surface }]}>
        <View style={styles.horizontalStatsRow}>
          <View style={styles.horizontalStatItem}>
            <View style={[styles.horizontalStatIcon, { backgroundColor: `${lightColors.primary}20` }]}>
              <MaterialIcons name="assessment" size={24} color={lightColors.primary} />
            </View>
            <Text style={[styles.horizontalStatLabel, { color: lightColors.onSurfaceVariant }]}>
              {t('reports:totalReports')}
            </Text>
            <Text style={[styles.horizontalStatValue, { color: lightColors.primary }]}>
              {statsLoading ? '...' : (stats?.data?.totalReports || '12')}
            </Text>
          </View>
          
          <View style={styles.horizontalStatItem}>
            <View style={[styles.horizontalStatIcon, { backgroundColor: '#4CAF5020' }]}>
              <MaterialIcons name="file-download" size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.horizontalStatLabel, { color: lightColors.onSurfaceVariant }]}>
              {t('reports:generatedThisMonth')}
            </Text>
            <Text style={[styles.horizontalStatValue, { color: '#4CAF50' }]}>
              {statsLoading ? '...' : (stats?.data?.generatedThisMonth || '8')}
            </Text>
          </View>
          
          <View style={styles.horizontalStatItem}>
            <View style={[styles.horizontalStatIcon, { backgroundColor: '#FF980020' }]}>
              <MaterialIcons name="schedule" size={24} color="#FF9800" />
            </View>
            <Text style={[styles.horizontalStatLabel, { color: lightColors.onSurfaceVariant }]}>
              {t('reports:avgGenerationTime')}
            </Text>
            <Text style={[styles.horizontalStatValue, { color: '#FF9800' }]}>
              {statsLoading ? '...' : (stats?.data?.avgGenerationTime || '2.1s')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (!hasReportAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title={t('reports:title')} />
        <View style={styles.noAccessContainer}>
          <MaterialIcons name="lock" size={64} color={lightColors.onSurfaceVariant} />
          <Text style={[styles.noAccessText, { color: lightColors.onSurface }]}>
            {t('reports:noAccessMessage')}
          </Text>
          <Text style={[styles.noAccessSubtext, { color: lightColors.onSurfaceVariant }]}>
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
          <Text style={[styles.mainTitle, rtlStyles.textAlign(), { color: lightColors.onBackground, marginBottom: 16 }]}>{t('common:categories')}</Text>
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
                <View style={[styles.reportHeader, rtlStyles.rowReverse()]}>
                  <View style={[styles.reportInfo, rtlStyles.rowReverse()]}>
                    <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }, rtlStyles.marginLeft(12)]}>
                      <MaterialIcons name={item.iconName as any} size={24} color={item.color} />
                    </View>
                    <View style={styles.reportDetails}>
                      <Text style={[styles.reportTitle, { color: lightColors.onSurface, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.reportDescription, { color: lightColors.onSurfaceVariant, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                        {item.description}
                      </Text>
                      {item.requiresFilter && (
                        <View style={[styles.filterBadge, rtlStyles.rowReverse()]}>
                          <MaterialIcons name="filter-list" size={12} color={lightColors.primary} />
                          <Text style={[styles.filterText, { color: lightColors.primary }]}>
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
                  <Text style={[styles.reportTime, { color: lightColors.onSurfaceVariant, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                    {t('reports:downloadAvailable')}
                  </Text>
                </View>

                <View style={[styles.reportFooter, { borderTopColor: lightColors.outline }]}>
                  <Text style={[styles.lastGenerated, { color: lightColors.onSurfaceVariant, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
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
        onClose={() => setFilterModalVisible(false)}
        onApply={(filter) => {
          setAppliedFilters(prev => ({
            ...prev,
            [currentFilterType]: filter
          }));
        }}
        filterType={currentFilterType}
        options={[]} // This would be populated based on filter type
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FA',
  },
  noAccessText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  noAccessSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Section styles (matching dashboard)
  quickStatsSection: {
    marginBottom: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  reportsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: rtlStyles.textAlign,
  },

  // Stats grid styles (matching dashboard)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCardWrapper: {
    width: '30%',
    minHeight: 120,
  },

  // Category filter styles
  categoryScroll: {
    marginBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Report card styles
  reportCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: rtlStyles.flexDirection,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rtlStyles.marginRight(12),
  },
  reportDetails: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: rtlStyles.textAlign,
  },
  reportDescription: {
    fontSize: 14,
    textAlign: rtlStyles.textAlign,
  },
  reportMeta: {
    alignItems: rtlStyles.alignItems,
  },
  reportLastGenerated: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: rtlStyles.textAlign,
  },
  reportActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  filterText: {
    fontSize: 12,
    marginLeft: 4,
    textAlign: 'right',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportData: {
    marginBottom: 8,
  },
  reportTime: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  reportFooter: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  horizontalStatsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  horizontalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horizontalStatItem: {
    flexDirection: 'column',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalStatValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});