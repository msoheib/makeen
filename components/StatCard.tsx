import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useTheme } from '@/hooks/useTheme';

type StatCardProps = {
  icon: string;
  label: string;
  value: string | number;
  loading?: boolean;
  color?: string;
};

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, loading, color }) => {
  const { theme } = useTheme();
  const cardColor = color || theme.colors.primary;

  return (
    <View style={styles.statCard}>
      <Avatar.Icon 
        icon={icon} 
        size={48} 
        style={{ backgroundColor: `${cardColor}20`}}
        color={cardColor}
      />
      <View style={styles.textContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={cardColor} />
        ) : (
          <Text style={[styles.statValue, { color: theme.colors.onBackground }]}>{value}</Text>
        )}
        <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
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
  textContainer: {
    alignItems: 'center',
    marginTop: 8,
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