import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { theme, spacing } from '@/lib/theme';
import { Plus } from 'lucide-react-native';
import ModernCard from './ModernCard';

interface CashflowCardProps {
  onAddPress?: () => void;
}

export default function CashflowCard({ onAddPress }: CashflowCardProps) {
  return (
    <ModernCard style={styles.container}>
      <Text style={styles.title}>Cashflow</Text>
      
      <View style={styles.content}>
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
      
      <Button
        mode="contained"
        onPress={onAddPress}
        style={styles.addButton}
        contentStyle={styles.addButtonContent}
        icon={() => <Plus size={20} color="white" />}
      >
        Add
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
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.l,
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