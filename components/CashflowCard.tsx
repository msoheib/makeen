import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { theme, spacing, rtlStyles, rtlLayout } from '@/lib/theme';
import { Plus, Home, Users, AlertTriangle, Calendar } from 'lucide-react-native';
import { useTranslation } from '@/lib/useTranslation';
import ModernCard from './ModernCard';

interface CashflowCardProps {
  onAddPress?: () => void;
  loading?: boolean;
  propertySummary?: any;
  expiringContracts?: number;
  pendingMaintenance?: number;
}

export default function CashflowCard({ 
  onAddPress,
  loading = false,
  propertySummary,
  expiringContracts = 0,
  pendingMaintenance = 0
}: CashflowCardProps) {
  const { t } = useTranslation('dashboard');
  if (loading) {
    return (
      <ModernCard style={styles.container}>
        <Text style={[styles.title, rtlStyles.textLeft]}>{t('systemOverview')}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, rtlStyles.textLeft]}>{t('common:loading')}...</Text>
        </View>
      </ModernCard>
    );
  }

  return (
    <ModernCard style={styles.container}>
      <Text style={[styles.title, rtlStyles.textLeft]}>{t('systemOverview')}</Text>
      
      <View style={styles.content}>
        {/* Properties Overview */}
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Home size={24} color={theme.colors.primary} />
            <View style={styles.metricContent}>
              <Text style={styles.metricValue}>
                {propertySummary?.total_properties || 0}
              </Text>
              <Text style={[styles.metricLabel, rtlStyles.textLeft]}>{t('totalProperties')}</Text>
            </View>
          </View>
          
          <View style={styles.metric}>
            <Users size={24} color={theme.colors.primary} />
            <View style={styles.metricContent}>
              <Text style={styles.metricValue}>
                {propertySummary?.active_contracts || 0}
              </Text>
              <Text style={[styles.metricLabel, rtlStyles.textLeft]}>{t('activeTenants')}</Text>
            </View>
          </View>
        </View>

        {/* Status Overview */}
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <View style={[styles.statusDot, { backgroundColor: theme.colors.primary }]} />
            <View style={styles.metricContent}>
              <Text style={styles.metricValue}>
                {propertySummary?.occupied || 0}
              </Text>
              <Text style={[styles.metricLabel, rtlStyles.textLeft]}>{t('occupied')}</Text>
            </View>
          </View>
          
          <View style={styles.metric}>
            <View style={[styles.statusDot, { backgroundColor: theme.colors.secondary }]} />
            <View style={styles.metricContent}>
              <Text style={styles.metricValue}>
                {propertySummary?.available || 0}
              </Text>
              <Text style={[styles.metricLabel, rtlStyles.textLeft]}>{t('available')}</Text>
            </View>
          </View>
        </View>

        {/* Alerts */}
        {(expiringContracts > 0 || pendingMaintenance > 0) && (
          <View style={styles.alertsSection}>
            <Text style={[styles.alertsTitle, rtlStyles.textLeft]}>{t('attentionRequired')}</Text>
            
            {expiringContracts > 0 && (
              <View style={styles.alertItem}>
                <Calendar size={20} color={theme.colors.error} />
                <Text style={[styles.alertText, rtlStyles.textLeft]}>
                  {expiringContracts} {t('contractsExpiring')}
                </Text>
              </View>
            )}
            
            {pendingMaintenance > 0 && (
              <View style={styles.alertItem}>
                <AlertTriangle size={20} color={theme.colors.error} />
                <Text style={[styles.alertText, rtlStyles.textLeft]}>
                  {pendingMaintenance} {t('pendingMaintenance')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      <Button
        mode="contained"
        onPress={onAddPress}
        style={styles.addButton}
        contentStyle={styles.addButtonContent}
        icon={() => <Plus size={20} color="white" />}
      >
        {t('add')}
      </Button>
    </ModernCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.l,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.m,
  },
  metricRow: {
    ...rtlStyles.row,
    justifyContent: 'space-between',
    marginBottom: spacing.l,
  },
  metric: {
    ...rtlStyles.row,
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.s,
  },
  metricContent: {
    ...rtlStyles.marginStart(spacing.s),
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  alertsSection: {
    marginTop: spacing.m,
    padding: spacing.m,
    backgroundColor: theme.colors.errorContainer,
    borderRadius: 8,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onErrorContainer,
    marginBottom: spacing.s,
  },
  alertItem: {
    ...rtlStyles.row,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  alertText: {
    fontSize: 12,
    color: theme.colors.onErrorContainer,
    ...rtlStyles.marginStart(spacing.s),
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 50,
    alignSelf: 'flex-end',
    position: 'absolute',
    bottom: spacing.m,
    right: spacing.m,
    width: 56,
    height: 56,
  },
  addButtonContent: {
    width: 56,
    height: 56,
  },
});