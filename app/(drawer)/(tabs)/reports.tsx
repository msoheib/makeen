import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, FlatList } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { BarChart3, FileText, TrendingUp, PieChart, Calendar, Download } from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import StatCard from '@/components/StatCard';

// Static reports data to prevent loading issues
const staticReports = [
  {
    id: '1',
    title: 'تقرير الإيرادات الشهرية',
    description: 'تقرير شامل للإيرادات والمدفوعات',
    type: 'revenue',
    lastGenerated: '2024-12-20',
    icon: TrendingUp,
    color: '#4CAF50',
    data: {
      totalRevenue: 125000,
      monthlyGrowth: 12,
      properties: 15
    }
  },
  {
    id: '2',
    title: 'تقرير المصروفات',
    description: 'تحليل المصروفات والنفقات التشغيلية',
    type: 'expenses',
    lastGenerated: '2024-12-19',
    icon: PieChart,
    color: '#F44336',
    data: {
      totalExpenses: 45000,
      maintenanceExpenses: 25000,
      operationalExpenses: 20000
    }
  },
  {
    id: '3',
    title: 'تقرير أداء العقارات',
    description: 'معدل الإشغال والعائد على الاستثمار',
    type: 'properties',
    lastGenerated: '2024-12-18',
    icon: BarChart3,
    color: '#2196F3',
    data: {
      occupancyRate: 85,
      totalProperties: 20,
      occupiedProperties: 17
    }
  },
  {
    id: '4',
    title: 'تقرير المستأجرين',
    description: 'إحصائيات المستأجرين والعقود',
    type: 'tenants',
    lastGenerated: '2024-12-17',
    icon: FileText,
    color: '#FF9800',
    data: {
      totalTenants: 17,
      activeTenants: 15,
      pendingRenewals: 3
    }
  },
  {
    id: '5',
    title: 'تقرير الصيانة',
    description: 'طلبات الصيانة والتكاليف',
    type: 'maintenance',
    lastGenerated: '2024-12-16',
    icon: Calendar,
    color: '#9C27B0',
    data: {
      totalRequests: 8,
      completedRequests: 6,
      pendingRequests: 2
    }
  },
  {
    id: '6',
    title: 'التقرير المالي الشامل',
    description: 'التقرير المالي الشامل للمؤسسة',
    type: 'financial',
    lastGenerated: '2024-12-15',
    icon: TrendingUp,
    color: '#607D8B',
    data: {
      netIncome: 80000,
      profitMargin: 35,
      roi: 18
    }
  }
];

// Static stats
const staticStats = {
  totalReports: '٦',
  generatedThisMonth: '١٢',
  scheduledReports: '٣',
  avgGenerationTime: '٢.١ث'
};

export default function ReportsScreen() {
  const router = useRouter();
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredReports = selectedCategory === 'all' 
    ? staticReports 
    : staticReports.filter(report => report.type === selectedCategory);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
          <IconButton
            icon="download"
            size={20}
            iconColor={theme.colors.primary}
            onPress={() => console.log('Download report', item.id)}
          />
        </View>

        <View style={styles.reportData}>
          {item.type === 'revenue' && (
            <View style={styles.dataRow}>
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  إجمالي الإيرادات
                </Text>
                <Text style={[styles.dataValue, { color: item.color }]}>
                  {item.data.totalRevenue.toLocaleString('ar-SA')} ريال
                </Text>
              </View>
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  النمو الشهري
                </Text>
                <Text style={[styles.dataValue, { color: item.color }]}>
                  +{item.data.monthlyGrowth}%
                </Text>
              </View>
            </View>
          )}

          {item.type === 'expenses' && (
            <View style={styles.dataRow}>
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  إجمالي المصروفات
                </Text>
                <Text style={[styles.dataValue, { color: item.color }]}>
                  {item.data.totalExpenses.toLocaleString('ar-SA')} ريال
                </Text>
              </View>
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  مصروفات الصيانة
                </Text>
                <Text style={[styles.dataValue, { color: item.color }]}>
                  {item.data.maintenanceExpenses.toLocaleString('ar-SA')} ريال
                </Text>
              </View>
            </View>
          )}

          {item.type === 'properties' && (
            <View style={styles.dataRow}>
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  معدل الإشغال
                </Text>
                <Text style={[styles.dataValue, { color: item.color }]}>
                  {item.data.occupancyRate}%
                </Text>
              </View>
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  العقارات المشغولة
                </Text>
                <Text style={[styles.dataValue, { color: item.color }]}>
                  {item.data.occupiedProperties}/{item.data.totalProperties}
                </Text>
              </View>
            </View>
          )}

          {item.type === 'tenants' && (
            <View style={styles.dataRow}>
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  إجمالي المستأجرين
                </Text>
                <Text style={[styles.dataValue, { color: item.color }]}>
                  {item.data.totalTenants}
                </Text>
              </View>
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  عقود معلقة للتجديد
                </Text>
                <Text style={[styles.dataValue, { color: item.color }]}>
                  {item.data.pendingRenewals}
                </Text>
              </View>
            </View>
          )}

          {item.type === 'maintenance' && (
            <View style={styles.dataRow}>
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  طلبات مكتملة
                </Text>
                <Text style={[styles.dataValue, { color: item.color }]}>
                  {item.data.completedRequests}/{item.data.totalRequests}
                </Text>
              </View>
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  طلبات معلقة
                </Text>
                <Text style={[styles.dataValue, { color: item.color }]}>
                  {item.data.pendingRequests}
                </Text>
              </View>
            </View>
          )}

          {item.type === 'financial' && (
            <View style={styles.dataRow}>
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  صافي الدخل
                </Text>
                <Text style={[styles.dataValue, { color: item.color }]}>
                  {item.data.netIncome.toLocaleString('ar-SA')} ريال
                </Text>
              </View>
              <View style={styles.dataItem}>
                <Text style={[styles.dataLabel, { color: theme.colors.onSurfaceVariant }]}>
                  العائد على الاستثمار
                </Text>
                <Text style={[styles.dataValue, { color: item.color }]}>
                  {item.data.roi}%
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.reportFooter}>
          <Text style={[styles.lastGenerated, { color: theme.colors.onSurfaceVariant }]}>
            آخر تحديث: {formatDate(item.lastGenerated)}
          </Text>
        </View>
      </Card>
    );
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            إحصائيات التقارير
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="إجمالي التقارير"
              value={staticStats.totalReports}
              color={theme.colors.primary}
            />
            <StatCard
              title="مُولد هذا الشهر"
              value={staticStats.generatedThisMonth}
              color="#4CAF50"
            />
            <StatCard
              title="تقارير مجدولة"
              value={staticStats.scheduledReports}
              color={theme.colors.secondary}
            />
            <StatCard
              title="متوسط وقت التوليد"
              value={staticStats.avgGenerationTime}
              color="#FF9800"
            />
          </View>
        </View>

        {/* Filter Categories */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            فئات التقارير
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
          
          <FlatList
            data={filteredReports}
            renderItem={renderReport}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
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
  },
  filterSection: {
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
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
});