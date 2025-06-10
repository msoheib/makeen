import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { propertiesApi, vouchersApi, contractsApi, maintenanceApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import ModernHeader from '@/components/ModernHeader';
import RentCard from '@/components/RentCard';
import CashflowCard from '@/components/CashflowCard';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAppStore(state => state.user);

  // Fetch dashboard data using our API layer
  const { data: propertySummary, loading: propertiesLoading } = useApi(
    () => propertiesApi.getDashboardSummary(),
    []
  );

  const { data: voucherSummary, loading: vouchersLoading } = useApi(
    () => vouchersApi.getSummary('month'),
    []
  );

  const { data: expiringContracts, loading: contractsLoading } = useApi(
    () => contractsApi.getExpiring(),
    []
  );

  const { data: maintenanceRequests, loading: maintenanceLoading } = useApi(
    () => maintenanceApi.getRequests({ status: 'pending' }),
    []
  );

  // Calculate rent data from vouchers
  const rentData = voucherSummary ? {
    outstanding: voucherSummary.total_payments || 0,
    totalDue: (voucherSummary.total_receipts || 0) + (voucherSummary.total_payments || 0),
    collected: voucherSummary.total_receipts || 0,
  } : {
    outstanding: 0,
    totalDue: 0,
    collected: 0,
  };

  const isLoading = propertiesLoading || vouchersLoading || contractsLoading || maintenanceLoading;

  return (
    <View style={styles.container}>
      <ModernHeader
        userName={user?.first_name || 'User'}
        showLogo={true}
        variant="dark"
        onNotificationPress={() => router.push('/notifications')}
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <RentCard
          outstandingAmount={rentData.outstanding}
          totalDue={rentData.totalDue}
          collectedAmount={rentData.collected}
          loading={vouchersLoading}
        />
        
        <CashflowCard
          onAddPress={() => router.push('/finance/vouchers/add')}
          loading={isLoading}
          propertySummary={propertySummary}
          expiringContracts={expiringContracts?.length || 0}
          pendingMaintenance={maintenanceRequests?.length || 0}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.m,
    paddingBottom: spacing.xxxl,
  },
});