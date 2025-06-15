import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
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
  FileText
} from 'lucide-react-native';
import ModernHeader from '@/components/ModernHeader';
import RentCard from '@/components/RentCard';
import CashflowCard from '@/components/CashflowCard';
import StatCard from '@/components/StatCard';

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

  const renderQuickStats = () => (
    <View style={styles.quickStatsSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        الإحصائيات السريعة
      </Text>
      <View style={styles.statsGrid}>
        <StatCard
          title="إجمالي العقارات"
          value={staticData.propertyStats.totalProperties.toString()}
          color={theme.colors.primary}
          icon={<Building2 size={20} color={theme.colors.primary} />}
        />
        <StatCard
          title="العقارات المشغولة"
          value={staticData.propertyStats.occupied.toString()}
          color="#4CAF50"
          icon={<Home size={20} color="#4CAF50" />}
        />
        <StatCard
          title="إجمالي المستأجرين"
          value={staticData.tenantStats.totalTenants.toString()}
          color={theme.colors.secondary}
          icon={<Users size={20} color={theme.colors.secondary} />}
        />
        <StatCard
          title="العقود المنتهية قريباً"
          value={staticData.tenantStats.expiringContracts.toString()}
          color="#FF9800"
          icon={<AlertCircle size={20} color="#FF9800" />}
        />
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
          totalRent={staticData.financialSummary.totalIncome}
          collectedRent={Math.floor(staticData.financialSummary.totalIncome * 0.9)}
          pendingRent={Math.floor(staticData.financialSummary.totalIncome * 0.1)}
          theme={theme}
        />
        <CashflowCard
          income={staticData.financialSummary.totalIncome}
          expenses={staticData.financialSummary.totalExpenses}
          netIncome={staticData.financialSummary.netProfit}
          theme={theme}
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
              {staticData.propertyStats.occupied}
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
              {staticData.propertyStats.vacant}
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
              {staticData.propertyStats.maintenance}
            </Text>
          </View>
        </View>
        
        <View style={styles.occupancyRate}>
          <Text style={[styles.occupancyLabel, { color: theme.colors.onSurfaceVariant }]}>
            معدل الإشغال
          </Text>
          <Text style={[styles.occupancyValue, { color: theme.colors.primary }]}>
            {staticData.propertyStats.occupancyRate}%
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
        showProfile={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
});