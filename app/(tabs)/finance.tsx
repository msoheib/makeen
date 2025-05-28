import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, FAB, Appbar, Surface, List, Searchbar, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing, shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Voucher, Invoice } from '@/lib/types';
import VoucherCard from '@/components/VoucherCard';

export default function FinanceScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('vouchers');
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFinancialData();
  }, [activeTab]);

  const fetchFinancialData = async () => {
    try {
      if (activeTab === 'vouchers') {
        const { data, error } = await supabase
          .from('vouchers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setVouchers(data);
      } else {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Finance" />
      </Appbar.Header>

      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'vouchers', label: 'Vouchers' },
          { value: 'invoices', label: 'Invoices' },
        ]}
        style={styles.segmentedButtons}
      />

      <Searchbar
        placeholder={`Search ${activeTab}...`}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Surface style={[styles.emptyState, shadows.medium]}>
            <Text>Loading {activeTab}...</Text>
          </Surface>
        ) : activeTab === 'vouchers' ? (
          vouchers.length > 0 ? (
            vouchers.map(voucher => (
              <VoucherCard 
                key={voucher.id} 
                voucher={voucher}
                onPress={() => router.push(`/finance/vouchers/${voucher.id}`)}
              />
            ))
          ) : (
            <Surface style={[styles.emptyState, shadows.medium]}>
              <Text>No vouchers found</Text>
            </Surface>
          )
        ) : (
          invoices.length > 0 ? (
            invoices.map(invoice => (
              <Surface key={invoice.id} style={[styles.invoiceCard, shadows.small]}>
                <List.Item
                  title={invoice.invoice_number}
                  description={invoice.description}
                  right={() => (
                    <Text style={styles.amount}>
                      ${invoice.total_amount.toLocaleString()}
                    </Text>
                  )}
                />
              </Surface>
            ))
          ) : (
            <Surface style={[styles.emptyState, shadows.medium]}>
              <Text>No invoices found</Text>
            </Surface>
          )
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push(`/finance/${activeTab}/add`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  segmentedButtons: {
    margin: spacing.m,
  },
  searchbar: {
    margin: spacing.m,
    marginTop: 0,
  },
  content: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
  },
  invoiceCard: {
    marginBottom: spacing.m,
    borderRadius: 12,
    overflow: 'hidden',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    margin: spacing.m,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});