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

// Generate reports based on database data
const generateReports = (hasData: boolean) => {
  if (!hasData) return [];
  
  return [
    {
      id: '1',
      title: 'تقرير الإيرادات الشهرية',
      description: 'تقرير شامل للإيرادات والمدفوعات',
      type: 'revenue',
      lastGenerated: new Date().toISOString(),
      icon: TrendingUp,
      color: '#4CAF50',
    },
    {
      id: '2',
      title: 'تقرير المصروفات',
      description: 'تحليل المصروفات والنفقات التشغيلية',
      type: 'expenses',
      lastGenerated: new Date().toISOString(),
      icon: PieChart,
      color: '#F44336',
    },
    {
      id: '3',
      title: 'تقرير أداء العقارات',
      description: 'معدل الإشغال والعائد على الاستثمار',
      type: 'properties',
      lastGenerated: new Date().toISOString(),
      icon: BarChart3,
      color: '#2196F3',
    },
    {
      id: '4',
      title: 'تقرير المستأجرين',
      description: 'إحصائيات المستأجرين والعقود',
      type: 'tenants',
      lastGenerated: new Date().toISOString(),
      icon: FileText,
      color: '#FF9800',
    },
    {
      id: '5',
      title: 'تقرير الصيانة',
      description: 'طلبات الصيانة والتكاليف',
      type: 'maintenance',
      lastGenerated: new Date().toISOString(),
      icon: Calendar,
      color: '#9C27B0',
    },
    {
      id: '6',
      title: 'التقرير المالي الشامل',
      description: 'التقرير المالي الشامل للمؤسسة',
      type: 'financial',
      lastGenerated: new Date().toISOString(),
      icon: TrendingUp,
      color: '#607D8B',
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
  } = useApi(() => reportsApi.getStats(), []);

  // Generate dynamic reports based on available data
  const availableReports = generateReports(!!stats && stats.totalReports > 0);

  // Show loading while checking permissions
  if (permissionLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernHeader 
          title="التقارير" 
          subtitle="تقارير شاملة للأداء والإحصائيات"
          showNotifications={true}
          showMenu={true}
          variant="default"
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
          variant="default"
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
    : availableReports.filter(report => report.type === selectedCategory);

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
      'revenue': 'revenue',
      'expenses': 'expense',
      'properties': 'property',
      'tenants': 'tenant',
      'maintenance': 'maintenance',
      'financial': 'revenue' // Financial reports use revenue type for now
    };
    
    return typeMap[reportType] || 'revenue';
  };

  // Handle PDF generation and download
  const handleDownloadPDF = async (report: any) => {
    try {
      setGeneratingPDF(report.id);
      
      // Create PDF request
      const pdfRequest: PDFRequest = {
        reportType: mapReportTypeToPDFType(report.type),
        dateRange: {
          startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          endDate: new Date().toISOString()
        }
      };

      console.log('Generating PDF for report:', report.title);
      console.log('PDF request:', pdfRequest);

      // Call PDF API
      const response = await pdfApi.generateAndDownload(pdfRequest);

      if (response.success) {
        Alert.alert(
          'تم إنشاء التقرير',
          `تم إنشاء ${report.title} بنجاح وتحميله على جهازك!`,
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
      console.error('PDF generation error:', error);
      Alert.alert(
        'خطأ في إنشاء التقرير',
        'فشل في إنشاء ملف PDF. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.',
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
          <View style={styles.statsGrid}>
            <View style={styles.statCardWrapper}>
              <StatCard
                title="إجمالي التقارير"
                value={stats?.totalReports?.toString() || '0'}
                color={theme.colors.primary}
                loading={statsLoading}
              />
            </View>
            <View style={styles.statCardWrapper}>
              <StatCard
                title="مُولد هذا الشهر"
                value={stats?.generatedThisMonth?.toString() || '0'}
                color="#4CAF50"
                loading={statsLoading}
              />
            </View>
            <View style={styles.statCardWrapper}>
              <StatCard
                title="تقارير مجدولة"
                value={stats?.scheduledReports?.toString() || '0'}
                color={theme.colors.secondary}
                loading={statsLoading}
              />
            </View>
            <View style={styles.statCardWrapper}>
              <StatCard
                title="متوسط وقت التوليد"
                value={stats?.avgGenerationTime || '0ث'}
                color="#FF9800"
                loading={statsLoading}
              />
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
              {[
                { key: 'all', label: 'الكل' },
                { key: 'revenue', label: 'الإيرادات' },
                { key: 'expenses', label: 'المصروفات' },
                { key: 'properties', label: 'العقارات' },
                { key: 'tenants', label: 'المستأجرين' }
              ].map((filter) => (
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