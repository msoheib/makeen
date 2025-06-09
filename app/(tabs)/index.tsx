import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { theme, spacing } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import ModernHeader from '@/components/ModernHeader';
import RentCard from '@/components/RentCard';
import CashflowCard from '@/components/CashflowCard';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAppStore(state => state.user);
  const [loading, setLoading] = useState(true);
  const [rentData, setRentData] = useState({
    outstanding: 90.00,
    totalDue: 90.00,
    collected: 90.00,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch actual data from Supabase
      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('amount, status, voucher_type')
        .eq('voucher_type', 'receipt');

      if (vouchers) {
        const collected = vouchers
          .filter(v => v.status === 'posted')
          .reduce((sum, v) => sum + v.amount, 0);
        
        const pending = vouchers
          .filter(v => v.status === 'draft')
          .reduce((sum, v) => sum + v.amount, 0);

        setRentData({
          outstanding: pending,
          totalDue: collected + pending,
          collected: collected,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ModernHeader
        userName={user?.first_name || 'John'}
        showLogo={true}
        onNotificationPress={() => router.push('/notifications')}
        onMenuPress={() => router.push('/menu')}
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
        />
        
        <CashflowCard
          onAddPress={() => router.push('/finance/vouchers/add')}
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