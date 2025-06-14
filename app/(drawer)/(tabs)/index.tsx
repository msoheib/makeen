import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useApi } from '@/hooks/useApi';
import { propertiesApi, reportsApi } from '@/lib/api';
import ModernHeader from '@/components/ModernHeader';
import RentCard from '@/components/RentCard';
import CashflowCard from '@/components/CashflowCard';
import StatCard from '@/components/StatCard';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/useTranslation';
import { formatCurrency, formatNumber, toArabicNumerals } from '@/lib/formatters';

export default function Dashboard() {
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { t } = useTranslation();
  
  // API calls
  const { 
    data: dashboardData, 
    loading: dashboardLoading, 
    error: dashboardError, 
    refetch: refetchDashboard 
  } = useApi(() => propertiesApi.getDashboardSummary(), []);

  const { 
    data: stats, 
    loading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useApi(() => reportsApi.getStats(), []);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchDashboard(), refetchStats()]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (dashboardLoading && !dashboardData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <ModernHeader title={t('dashboard.title')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            {t('common.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (dashboardError && !dashboardData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <ModernHeader title={t('dashboard.title')} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {t('common.error')}
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.colors.onSurfaceVariant }]}>
            {dashboardError}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    totalIncome = 0,
    totalExpenses = 0,
    totalProperties = 0,
    occupiedProperties = 0,
    availableProperties = 0,
    maintenanceProperties = 0
  } = dashboardData || {};

  const netIncome = totalIncome - totalExpenses;
  const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <ModernHeader title={t('dashboard.title')} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: theme.spacing.xl }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Financial Overview */}
        <View style={[styles.section, { marginBottom: theme.spacing.lg }]}>
          <Text style={[styles.sectionTitle, { 
            color: theme.colors.onSurface, 
            fontSize: theme.fontSize.lg,
            marginBottom: theme.spacing.md 
          }]}>
            {t('dashboard.financialOverview')}
          </Text>
          
          <View style={[styles.cardRow, { gap: theme.spacing.sm }]}>
            <RentCard 
              totalRent={formatCurrency(totalIncome)}
              collected={formatCurrency(totalIncome * 0.85)}
              outstanding={formatCurrency(totalIncome * 0.15)}
              loading={dashboardLoading}
            />
            <CashflowCard 
              income={formatCurrency(totalIncome)}
              expenses={formatCurrency(totalExpenses)}
              netIncome={formatCurrency(netIncome)}
              loading={dashboardLoading}
            />
          </View>
        </View>

        {/* Property Statistics */}
        <View style={[styles.section, { marginBottom: theme.spacing.lg }]}>
          <Text style={[styles.sectionTitle, { 
            color: theme.colors.onSurface, 
            fontSize: theme.fontSize.lg,
            marginBottom: theme.spacing.md 
          }]}>
            {t('dashboard.propertyStatistics')}
          </Text>
          
          <View style={[styles.statsGrid, { gap: theme.spacing.sm }]}>
            <StatCard
              title={t('dashboard.totalProperties')}
              value={formatNumber(totalProperties)}
              subtitle={`${formatNumber(occupancyRate.toFixed(1))}% ${t('dashboard.occupied')}`}
              color={theme.colors.primary}
              loading={dashboardLoading}
            />
            <StatCard
              title={t('dashboard.available')}
              value={formatNumber(availableProperties)}
              subtitle={t('dashboard.readyToRent')}
              color={theme.colors.success}
              loading={dashboardLoading}
            />
            <StatCard
              title={t('dashboard.occupied')}
              value={formatNumber(occupiedProperties)}
              subtitle={t('dashboard.currentTenants')}
              color={theme.colors.info}
              loading={dashboardLoading}
            />
            <StatCard
              title={t('dashboard.maintenance')}
              value={formatNumber(maintenanceProperties)}
              subtitle={t('dashboard.underRepair')}
              color={theme.colors.warning}
              loading={dashboardLoading}
            />
          </View>
        </View>

        {/* Reports Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { 
            color: theme.colors.onSurface, 
            fontSize: theme.fontSize.lg,
            marginBottom: theme.spacing.md 
          }]}>
            {t('dashboard.reportsOverview')}
          </Text>
          
          <View style={[styles.reportsGrid, { gap: theme.spacing.sm }]}>
            <StatCard
              title={t('dashboard.totalReports')}
              value={formatNumber(stats?.totalReports || 0)}
              subtitle={t('dashboard.available')}
              color={theme.colors.primary}
              loading={statsLoading}
            />
            <StatCard
              title={t('dashboard.thisMonth')}
              value={formatNumber(stats?.generatedThisMonth || 0)}
              subtitle={t('dashboard.generated')}
              color={theme.colors.secondary}
              loading={statsLoading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 12, // reduced from 16
  },
  section: {
    marginTop: 8, // reduced from 12
  },
  sectionTitle: {
    fontWeight: '600',
    marginLeft: 4, // reduced from 8
  },
  cardRow: {
    flexDirection: 'row',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reportsGrid: {
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  loadingText: {
    marginTop: 8, // reduced from 12
    fontSize: 14, // reduced from 16
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  errorText: {
    fontSize: 16, // reduced from 18
    fontWeight: '600',
    marginBottom: 4, // reduced from 8
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 12, // reduced from 14
    textAlign: 'center',
    lineHeight: 18, // reduced from 20
  },
});