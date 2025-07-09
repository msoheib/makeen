import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerLine, ShimmerCircle } from './ShimmerPlaceholder';
import { useAppStore } from '@/lib/store';
import { lightTheme, darkTheme } from '@/lib/theme';
import { getFlexDirection } from '@/lib/rtl';

// Rent Card Shimmer
export const RentCardShimmer: React.FC = () => {
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface }]}>
      {/* Title */}
      <ShimmerLine
        width="60%"
        height={18}
        style={styles.title}
      />
      
      {/* Total rent row */}
      <View style={[styles.row, { flexDirection: getFlexDirection('row') }]}>
        <ShimmerLine width={100} height={18} />
        <ShimmerLine width={120} height={18} />
      </View>
      
      {/* Collected rent row */}
      <View style={[styles.row, { flexDirection: getFlexDirection('row') }]}>
        <ShimmerLine width={80} height={18} />
        <ShimmerLine width={100} height={18} />
      </View>
      
      {/* Pending rent row */}
      <View style={styles.row}>
        <View style={{ flexDirection: getFlexDirection('row'), justifyContent: 'space-between' }}>
          <ShimmerLine width={90} height={18} />
          <ShimmerLine width={80} height={18} />
        </View>
      </View>
    </View>
  );
};

// Cashflow Card Shimmer
export const CashflowCardShimmer: React.FC = () => {
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface }]}>
      {/* Title */}
      <ShimmerLine
        width="50%"
        height={18}
        style={styles.title}
      />
      
      {/* Income row */}
      <View style={[styles.row, { flexDirection: getFlexDirection('row') }]}>
        <ShimmerLine width={80} height={18} />
        <ShimmerLine width={120} height={18} />
      </View>
      
      {/* Expenses row */}
      <View style={[styles.row, { flexDirection: getFlexDirection('row') }]}>
        <ShimmerLine width={90} height={18} />
        <ShimmerLine width={100} height={18} />
      </View>
      
      {/* Net income row */}
      <View style={styles.row}>
        <View style={{ flexDirection: getFlexDirection('row'), justifyContent: 'space-between' }}>
          <ShimmerLine width={100} height={18} />
          <ShimmerLine width={110} height={18} />
        </View>
      </View>
    </View>
  );
};

// Property Overview Card Shimmer
export const PropertyOverviewShimmer: React.FC = () => {
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface }]}>
      {/* Property icons and values row */}
      <View style={[styles.propertyRow, { flexDirection: getFlexDirection('row') }]}>
        <View style={styles.propertyItem}>
          <ShimmerCircle size={48} />
          <ShimmerLine width={50} height={12} style={styles.propertyLabel} />
          <ShimmerLine width={30} height={20} style={styles.propertyValue} />
        </View>
        
        <View style={styles.propertyItem}>
          <ShimmerCircle size={48} />
          <ShimmerLine width={50} height={12} style={styles.propertyLabel} />
          <ShimmerLine width={30} height={20} style={styles.propertyValue} />
        </View>
        
        <View style={styles.propertyItem}>
          <ShimmerCircle size={48} />
          <ShimmerLine width={50} height={12} style={styles.propertyLabel} />
          <ShimmerLine width={30} height={20} style={styles.propertyValue} />
        </View>
      </View>
      
      {/* Occupancy rate */}
      <View style={styles.occupancyRate}>
        <ShimmerLine width={80} height={14} style={styles.occupancyLabel} />
        <ShimmerLine width={60} height={24} style={styles.occupancyValue} />
      </View>
    </View>
  );
};

// Recent Activity Card Shimmer
export const RecentActivityShimmer: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const { isDarkMode } = useAppStore();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <View key={index} style={[styles.activityCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.activityHeader, { flexDirection: getFlexDirection('row') }]}>
            <View style={styles.activityLeft}>
              <ShimmerLine width={80} height={14} style={styles.activityAmount} />
              <ShimmerLine width={60} height={11} style={styles.activityDate} />
            </View>
            
            <View style={styles.activityInfo}>
              <View style={styles.activityDetails}>
                <ShimmerLine width={120} height={14} style={styles.activityTitle} />
                <ShimmerLine width={100} height={12} style={styles.activityDescription} />
              </View>
              <ShimmerCircle size={40} />
            </View>
          </View>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 200,
  },
  title: {
    marginBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  // Property overview styles
  propertyRow: {
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  propertyItem: {
    alignItems: 'center',
  },
  propertyLabel: {
    marginTop: 8,
    marginBottom: 4,
  },
  propertyValue: {
    marginTop: 4,
  },
  occupancyRate: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  occupancyLabel: {
    marginBottom: 4,
  },
  occupancyValue: {
    marginTop: 4,
  },
  // Activity card styles
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    marginBottom: 2,
  },
  activityDescription: {
    marginTop: 2,
  },
  activityLeft: {
    alignItems: 'flex-start',
  },
  activityAmount: {
    marginBottom: 2,
  },
  activityDate: {
    marginTop: 2,
  },
});