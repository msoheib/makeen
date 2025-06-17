import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, FlatList, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { BarChart3, FileText, TrendingUp, PieChart, Calendar, Download, Lock, Shield } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import StatCard from '@/components/StatCard';
import { pdfApi, PDFRequest } from '@/lib/pdfApi';
import { useScreenAccess } from '@/lib/permissions';
import { useApi } from '@/hooks/useApi';
import { reportsApi } from '@/lib/api';

// Comprehensive reports list as requested in the image
const generateReports = (hasData: boolean, userRole?: string) => {
  if (!hasData) return [];
  
  // Owner reports - focused on income and maintenance costs only
  if (userRole === 'owner') {
    return [
      {
        id: '1',
        title: 'تقرير الدخل الإيجاري',
        description: 'دخل العقارات من الإيجارات الشهرية',
        type: 'rental-income',
        lastGenerated: new Date().toISOString(),
        icon: TrendingUp,
        color: '#4CAF50',
      },
      {
        id: '2',
        title: 'تقرير مصاريف الصيانة',
        description: 'تكاليف الصيانة والإصلاحات للعقارات',
        type: 'maintenance-expenses',
        lastGenerated: new Date().toISOString(),
        icon: Calendar,
        color: '#F44336',
      }
    ];
  }
  
  // Property Manager and Admin users get all comprehensive reports
  return [
    {
      id: '1',
      title: 'ملخص التقارير',
      titleEn: 'Summary of Reports',
      description: 'ملخص شامل للأعمال والمؤشرات الرئيسية',
      type: 'summary',
      category: 'Summary',
      lastGenerated: new Date().toISOString(),
      icon: BarChart3,
      color: '#2196F3',
    },
    {
      id: '2',
      title: 'تقرير الفواتير',
      titleEn: 'Invoices Report',
      description: 'فواتير ضريبة القيمة المضافة وملخص الفواتير',
      type: 'invoices',
      category: 'Financial',
      lastGenerated: new Date().toISOString(),
      icon: FileText,
      color: '#9C27B0',
    },
    {
      id: '3',
      title: 'كشف حساب',
      titleEn: 'Account Statement',
      description: 'دفتر الأستاذ العام ومعاملات الحساب',
      type: 'account-statement',
      category: 'Financial',
      lastGenerated: new Date().toISOString(),
      icon: FileText,
      color: '#607D8B',
    },
    {
      id: '4',
      title: 'تقرير المصروفات',
      titleEn: 'Expense Report',
      description: 'المصروفات التشغيلية وتكاليف الصيانة',
      type: 'expenses',
      category: 'Financial',
      lastGenerated: new Date().toISOString(),
      icon: PieChart,
      color: '#F44336',
    },
    {
      id: '5',
      title: 'تقرير الإيرادات',
      titleEn: 'Revenue Report',
      description: 'تفصيل الإيرادات الشهرية حسب العقار',
      type: 'revenue',
      category: 'Financial',
      lastGenerated: new Date().toISOString(),
      icon: TrendingUp,
      color: '#4CAF50',
    },
    {
      id: '6',
      title: 'القوائم المالية',
      titleEn: 'Financial Statements',
      description: 'الميزانية العمومية والأرباح والخسائر والتدفق النقدي',
      type: 'financial-statements',
      category: 'Financial',
      lastGenerated: new Date().toISOString(),
      icon: BarChart3,
      color: '#673AB7',
    },
    {
      id: '7',
      title: 'مواعيد الدفع والمستأجرين المتأخرين',
      titleEn: 'Payments Dates & Late Tenants',
      description: 'تتبع المدفوعات وتحليل المتأخرين',
      type: 'payments-late-tenants',
      category: 'Tenants',
      lastGenerated: new Date().toISOString(),
      icon: Calendar,
      color: '#FF5722',
    },
    {
      id: '8',
      title: 'تقرير الشواغر والعروض',
      titleEn: 'Vacancies and Offers Report',
      description: 'توفر العقارات وتحليل العروض',
      type: 'vacancies-offers',
      category: 'Properties',
      lastGenerated: new Date().toISOString(),
      icon: TrendingUp,
      color: '#795548',
    },
    {
      id: '9',
      title: 'تقرير العقارات',
      titleEn: 'Property Report',
      description: 'تحليل أداء العقارات الفردية',
      type: 'property-report',
      category: 'Properties',
      lastGenerated: new Date().toISOString(),
      icon: TrendingUp,
      color: '#00BCD4',
    },
    {
      id: '10',
      title: 'بيان المستأجرين للمالك',
      titleEn: 'Tenants Statement of Owner',
      description: 'ملخص المستأجرين والمدفوعات الخاصة بالمالك',
      type: 'tenants-statement',
      category: 'Owners',
      lastGenerated: new Date().toISOString(),
      icon: FileText,
      color: '#3F51B5',
    },
    {
      id: '11',
      title: 'التقرير المالي للمالك',
      titleEn: 'Owner Financial Report',
      description: 'إيرادات المالك والمصروفات والربحية',
      type: 'owner-financial',
      category: 'Owners',
      lastGenerated: new Date().toISOString(),
      icon: TrendingUp,
      color: '#009688',
    },
    {
      id: '12',
      title: 'التقرير الكامل للمالك',
      titleEn: 'Owner Full Report',
      description: 'تحليل شامل لمحفظة المالك',
      type: 'owner-full',
      category: 'Owners',
      lastGenerated: new Date().toISOString(),
      icon: FileText,
      color: '#8BC34A',
    },
    {
      id: '13',
      title: 'تقرير العداد الكهربائي',
      titleEn: 'Electrical Meter Report',
      description: 'استهلاك المرافق وتحليل الفواتير',
      type: 'electrical-meter',
      category: 'Operations',
      lastGenerated: new Date().toISOString(),
      icon: FileText,
      color: '#FFC107',
    },
    {
      id: '14',
      title: 'تقرير فئات الملاك',
      titleEn: 'Owner Classes Report',
      description: 'تصنيف الملاك وتحليل المحفظة',
      type: 'owner-classes',
      category: 'Owners',
      lastGenerated: new Date().toISOString(),
      icon: FileText,
      color: '#E91E63',
    },
    {
      id: '15',
      title: 'تقرير أرصدة المستأجرين',
      titleEn: 'Tenants Balance Report',
      description: 'أرصدة دفع المستأجرين والمبالغ المستحقة',
      type: 'tenants-balance',
      category: 'Tenants',
      lastGenerated: new Date().toISOString(),
      icon: FileText,
      color: '#00BCD4',
    }
  ];
};

export default function ReportsScreen() {
  const router = useRouter();
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

  // Check if user has access to reports
  const { hasAccess: canAccessReports, loading: permissionLoading, userContext } = useScreenAccess('reports');

  // Load real statistics from database
  const { 
    data: stats, 
    loading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useApi(() => reportsApi.getStats(userContext?.role), [userContext?.role]);

  // Generate dynamic reports based on available data and user role
  const availableReports = generateReports(!!stats && stats.totalReports > 0, userContext?.role);

  // Show loading while checking permissions
  if (permissionLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title="التقارير" 
          subtitle="تقارير شاملة للأداء والإحصائيات"
          showNotifications={true}
          showMenu={true}
          variant="dark"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading reports...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If user doesn't have reports access, show access denied
  if (!canAccessReports) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title="التقارير" 
          subtitle="تقارير شاملة للأداء والإحصائيات"
          showNotifications={true}
          showMenu={true}
          variant="dark"
        />
        <View style={styles.accessDeniedContainer}>
          <Lock size={64} color="#ccc" />
          <Text style={[styles.accessDeniedText, { color: theme.colors.onSurfaceVariant }]}>
            Access Denied
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}>
            You don't have permission to view reports. Only property owners and administrators can access financial reports.
          </Text>
          {/* DEBUG: Show user context for troubleshooting */}
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
            Current Role: {userContext?.role || 'None'}
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}>
            Authenticated: {userContext?.isAuthenticated ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.accessDeniedSubtext, { color: theme.colors.onSurfaceVariant }]}>
            User ID: {userContext?.userId || 'None'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredReports = selectedCategory === 'all' 
    ? availableReports 
    : availableReports.filter(report => report.category === selectedCategory);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Map report types to PDF types
  const mapReportTypeToPDFType = (reportType: string): 'revenue' | 'expense' | 'property' | 'tenant' | 'maintenance' => {
    const typeMap: Record<string, 'revenue' | 'expense' | 'property' | 'tenant' | 'maintenance'> = {
      // Existing mappings
      'revenue': 'revenue',
      'expenses': 'expense',
      'properties': 'property',
      'tenants': 'tenant',
      'maintenance': 'maintenance',
      'financial': 'revenue',
      // Owner-specific report types
      'rental-income': 'revenue',
      'maintenance-expenses': 'maintenance',
      // Manager-specific report types
      'income': 'revenue',
      'cashflow': 'revenue',
      // New comprehensive report types
      'summary': 'revenue',
      'invoices': 'maintenance',
      'account-statement': 'expense',
      'financial-statements': 'revenue',
      'payments-late-tenants': 'tenant',
      'vacancies-offers': 'property',
      'property-report': 'property',
      'tenants-statement': 'tenant',
      'owner-financial': 'revenue',
      'owner-full': 'maintenance',
      'electrical-meter': 'maintenance',
      'owner-classes': 'maintenance',
      'tenants-balance': 'tenant'
    };
    
    return typeMap[reportType] || 'revenue';
  };

  // Handle PDF generation and download
  const handleDownloadPDF = async (report: any) => {
    try {
      setGeneratingPDF(report.id);
      
      console.log('Generating report for:', report.title, 'Type:', report.type);

      let reportData = null;
      
      // Get data from appropriate API based on report type
      switch (report.type) {
        case 'summary':
          reportData = await reportsApi.getSummaryReport();
          break;
        case 'invoices':
          reportData = await reportsApi.getInvoicesReport();
          break;
        case 'account-statement':
          reportData = await reportsApi.getAccountStatement();
          break;
        case 'financial-statements':
          reportData = await reportsApi.getFinancialStatements();
          break;
        case 'payments-late-tenants':
          reportData = await reportsApi.getPaymentsAndLateTenantsReport();
          break;
        case 'vacancies-offers':
          reportData = await reportsApi.getVacanciesAndOffersReport();
          break;
        case 'property-report':
          reportData = await reportsApi.getPropertyReport();
          break;
        case 'tenants-statement':
          reportData = await reportsApi.getTenantsStatementReport();
          break;
        case 'owner-financial':
          reportData = await reportsApi.getOwnerFinancialReport();
          break;
        case 'owner-full':
          reportData = await reportsApi.getOwnerFullReport();
          break;
        case 'electrical-meter':
          reportData = await reportsApi.getElectricalMeterReport();
          break;
        case 'owner-classes':
          reportData = await reportsApi.getOwnerClassesReport();
          break;
        case 'tenants-balance':
          reportData = await reportsApi.getTenantsBalanceReport();
          break;
        default:
          // For legacy types, create PDF request
          const pdfRequest: PDFRequest = {
            reportType: mapReportTypeToPDFType(report.type),
            dateRange: {
              startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
              endDate: new Date().toISOString()
            }
          };
          
          const response = await pdfApi.generateAndDownload(pdfRequest);
          
          if (response.success) {
            Alert.alert(
              'تم إنشاء التقرير',
              `تم إنشاء ${report.title} بنجاح وفتحه في نافذة جديدة!`,
              [{ text: 'حسناً', style: 'default' }]
            );
          } else {
            throw new Error(response.message || response.error || 'حدث خطأ غير متوقع');
          }
          return;
      }

      if (reportData?.error) {
        throw new Error(reportData.error);
      }

      // Create PDF request with data
      const pdfRequest: PDFRequest = {
        reportType: mapReportTypeToPDFType(report.type),
        data: reportData?.data,
        title: report.title,
        titleEn: report.titleEn,
        dateRange: {
          startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          endDate: new Date().toISOString()
        }
      };

      console.log('Generating PDF with data:', {
        type: report.type,
        title: report.title,
        hasData: !!reportData?.data
      });

      // Call PDF API
      const response = await pdfApi.generateAndDownload(pdfRequest);

      if (response.success) {
        Alert.alert(
          'تم إنشاء التقرير',
          `تم إنشاء ${report.title} بنجاح وفتحه في نافذة جديدة! يمكنك طباعته أو حفظه كملف PDF من المتصفح.`,
          [{ text: 'حسناً', style: 'default' }]
        );
      } else {
        Alert.alert(
          'خطأ في إنشاء التقرير',
          response.message || response.error || 'حدث خطأ غير متوقع',
          [{ text: 'حسناً', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Report generation error:', error);
      Alert.alert(
        'خطأ في إنشاء التقرير',
        'فشل في إنشاء التقرير. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.',
        [{ text: 'حسناً', style: 'default' }]
      );
    } finally {
      setGeneratingPDF(null);
    }
  };

  const renderReport = ({ item }: { item: any }) => {
    const IconComponent = item.icon;
    
    return (
      <Card style={[styles.reportCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.reportHeader}>
          <View style={styles.reportInfo}>
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <IconComponent size={24} color={item.color} />
            </View>
            <View style={styles.reportDetails}>
              <Text style={[styles.reportTitle, { color: theme.colors.onSurface }]}>
                {item.title}
              </Text>
              <Text style={[styles.reportDescription, { color: theme.colors.onSurfaceVariant }]}>
                {item.description}
              </Text>
            </View>
          </View>
          {generatingPDF === item.id ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : (
            <IconButton
              icon="download"
              size={20}
              iconColor={theme.colors.primary}
              onPress={() => handleDownloadPDF(item)}
            />
          )}
        </View>

        <View style={styles.reportData}>
          <Text style={[styles.reportTime, { color: theme.colors.onSurfaceVariant }]}>
            متاح للتحميل
          </Text>
        </View>

        <View style={styles.reportFooter}>
          <Text style={[styles.lastGenerated, { color: theme.colors.onSurfaceVariant }]}>
            آخر تحديث: {formatDate(item.lastGenerated)}
          </Text>
        </View>
      </Card>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchStats();
    } catch (error) {
      console.error('Error refreshing reports:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader 
        title="التقارير" 
        showNotifications={true}
        showBackButton={false}
        showMenu={true}
        variant="dark"
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            إحصائيات التقارير
          </Text>
          <View style={[styles.horizontalStatsCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.horizontalStatsRow}>
              <View style={styles.horizontalStatItem}>
                <View style={[styles.horizontalStatIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                  <FileText size={24} color={theme.colors.primary} />
                </View>
                <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  إجمالي التقارير
                </Text>
                <Text style={[styles.horizontalStatValue, { color: theme.colors.primary }]}>
                  {statsLoading ? '...' : stats?.totalReports?.toString() || '0'}
                </Text>
              </View>
              
              <View style={styles.horizontalStatItem}>
                <View style={[styles.horizontalStatIcon, { backgroundColor: '#4CAF5020' }]}>
                  <TrendingUp size={24} color="#4CAF50" />
                </View>
                <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  مُولد هذا الشهر
                </Text>
                <Text style={[styles.horizontalStatValue, { color: '#4CAF50' }]}>
                  {statsLoading ? '...' : stats?.generatedThisMonth?.toString() || '0'}
                </Text>
              </View>
              
              <View style={styles.horizontalStatItem}>
                <View style={[styles.horizontalStatIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
                  <Calendar size={24} color={theme.colors.secondary} />
                </View>
                <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  تقارير مجدولة
                </Text>
                <Text style={[styles.horizontalStatValue, { color: theme.colors.secondary }]}>
                  {statsLoading ? '...' : stats?.scheduledReports?.toString() || '0'}
                </Text>
              </View>
              
              <View style={styles.horizontalStatItem}>
                <View style={[styles.horizontalStatIcon, { backgroundColor: '#FF980020' }]}>
                  <BarChart3 size={24} color="#FF9800" />
                </View>
                <Text style={[styles.horizontalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  متوسط وقت التوليد
                </Text>
                <Text style={[styles.horizontalStatValue, { color: '#FF9800' }]}>
                  {statsLoading ? '...' : stats?.avgGenerationTime || '0s'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filter Categories */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            فئات التقارير
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 16 }}
          >
            <View style={styles.filterButtons}>
              {(() => {
                // Role-specific filter categories
                let filterCategories = [{ key: 'all', label: 'الكل' }];
                
                if (userContext?.role === 'owner') {
                  filterCategories = [
                    ...filterCategories,
                    { key: 'rental-income', label: 'الدخل الإيجاري' },
                    { key: 'maintenance-expenses', label: 'مصاريف الصيانة' }
                  ];
                } else if (userContext?.role === 'manager') {
                  filterCategories = [
                    ...filterCategories,
                    { key: 'income', label: 'الدخل' },
                    { key: 'expenses', label: 'المصروفات' },
                    { key: 'cashflow', label: 'التدفق النقدي' }
                  ];
                } else {
                  // Admin or other roles get all categories
                  filterCategories = [
                    ...filterCategories,
                    { key: 'Summary', label: 'الملخص' },
                    { key: 'Financial', label: 'المالية' },
                    { key: 'Properties', label: 'العقارات' },
                    { key: 'Tenants', label: 'المستأجرين' },
                    { key: 'Owners', label: 'الملاك' },
                    { key: 'Operations', label: 'العمليات' }
                  ];
                }
                
                return filterCategories;
              })().map((filter) => (
                <Card
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: selectedCategory === filter.key
                        ? theme.colors.primaryContainer
                        : theme.colors.surface
                    }
                  ]}
                  onPress={() => setSelectedCategory(filter.key)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    {
                      color: selectedCategory === filter.key
                        ? theme.colors.primary
                        : theme.colors.onSurface
                    }
                  ]}>
                    {filter.label}
                  </Text>
                </Card>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Reports List */}
        <View style={styles.reportsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            التقارير المتاحة ({filteredReports.length})
          </Text>
          
          {filteredReports.length > 0 ? (
            <FlatList
              data={filteredReports}
              renderItem={renderReport}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.colors.onSurfaceVariant }]}>
                لا توجد تقارير متاحة
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.onSurfaceVariant }]}>
                {statsLoading ? 'جارٍ التحميل...' : 'لا توجد بيانات كافية لإنشاء التقارير'}
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
  filterSection: {
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    marginVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reportsSection: {
    marginBottom: 24,
  },
  reportCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportDetails: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    textAlign: 'right',
  },
  reportData: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dataItem: {
    alignItems: 'center',
    flex: 1,
  },
  dataLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  reportFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  lastGenerated: {
    fontSize: 12,
    textAlign: 'right',
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
    lineHeight: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  reportTime: {
    fontSize: 12,
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
});