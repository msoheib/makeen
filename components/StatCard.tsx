import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useTheme } from '@/hooks/useTheme';
import { formatDisplayNumber, toArabicNumerals } from '@/lib/formatters';

type StatCardProps = {
  // Old interface
  icon?: string;
  label?: string;
  value: string | number;
  loading?: boolean;
  color?: string;
  
  // New interface
  title?: string;
  iconElement?: React.ReactNode;
};

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  label, 
  value, 
  loading, 
  color,
  title,
  iconElement
}) => {
  const { theme } = useTheme();
  const cardColor = color || theme.colors.primary;
  
  // Use new interface if title is provided, otherwise fall back to old interface
  const displayTitle = title || label;
  const displayIcon = iconElement || (icon ? { icon } : null);

  // Localized/RTL-aware value formatting (Arabic numerals when language is Arabic)
  const formattedValue = React.useMemo(() => {
    if (loading) return '';
    if (typeof value === 'number') return formatDisplayNumber(value);
    if (typeof value === 'string') return toArabicNumerals(value);
    return String(value);
  }, [loading, value]);

  return (
    <View style={styles.statCard}>
      {displayIcon && (
        <View style={styles.iconContainer}>
          {iconElement ? (
            iconElement
          ) : (
            <Avatar.Icon 
              icon={icon!} 
              size={48} 
              style={{ backgroundColor: `${(cardColor || theme.colors.onSurfaceVariant)}20`}}
              color={cardColor || theme.colors.onSurfaceVariant}
            />
          )}
        </View>
      )}
      <View style={styles.textContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={cardColor} />
        ) : (
          <Text style={[styles.statValue, { color: theme.colors.onBackground }]}>{formattedValue}</Text>
        )}
        <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>{displayTitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statCard: {
    alignItems: 'center',
    padding: 10,
    minWidth: 100,
    flex: 1,
  },
  iconContainer: {
    marginBottom: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default StatCard;