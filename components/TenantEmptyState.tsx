import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { theme, spacing } from '@/lib/theme';
import { Building2, Wrench, Home } from 'lucide-react-native';

interface TenantEmptyStateProps {
  type: 'properties' | 'maintenance' | 'dashboard';
  customTitle?: string;
  customMessage?: string;
}

export const TenantEmptyState: React.FC<TenantEmptyStateProps> = ({
  type,
  customTitle,
  customMessage,
}) => {
  const { t } = useTranslation('common');

  const getEmptyStateInfo = () => {
    switch (type) {
      case 'properties':
        return {
          title: customTitle || t('auth.noPropertiesAssigned'),
          message: customMessage || t('auth.noPropertiesAssignedDesc'),
          icon: <Building2 size={64} color={theme.colors.onSurfaceVariant} />,
        };
      case 'maintenance':
        return {
          title: customTitle || t('auth.noMaintenanceAccess'),
          message: customMessage || t('auth.noMaintenanceAccessDesc'),
          icon: <Wrench size={64} color={theme.colors.onSurfaceVariant} />,
        };
      case 'dashboard':
        return {
          title: customTitle || t('auth.noPropertiesAssigned'),
          message: customMessage || t('auth.noPropertiesAssignedDesc'),
          icon: <Home size={64} color={theme.colors.onSurfaceVariant} />,
        };
      default:
        return {
          title: t('auth.noPropertiesAssigned'),
          message: t('auth.noPropertiesAssignedDesc'),
          icon: <Building2 size={64} color={theme.colors.onSurfaceVariant} />,
        };
    }
  };

  const { title, message, icon } = getEmptyStateInfo();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        
        <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: spacing.xl,
    opacity: 0.6,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
});

export default TenantEmptyState;