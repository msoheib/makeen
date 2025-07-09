import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerCircle, ShimmerLine } from './ShimmerPlaceholder';

interface StatCardShimmerProps {
  style?: any;
}

export const StatCardShimmer: React.FC<StatCardShimmerProps> = ({ style }) => {
  return (
    <View style={[styles.statCard, style]}>
      {/* Icon placeholder */}
      <ShimmerCircle size={48} />
      
      <View style={styles.textContainer}>
        {/* Value placeholder */}
        <ShimmerLine
          width={60}
          height={20}
          style={styles.statValue}
        />
        
        {/* Label placeholder */}
        <ShimmerLine
          width={80}
          height={12}
          style={styles.statLabel}
        />
      </View>
    </View>
  );
};

// Horizontal stats shimmer for dashboard
export const HorizontalStatsShimmer: React.FC = () => {
  return (
    <View style={styles.horizontalStatsCard}>
      <View style={styles.horizontalStatsRow}>
        <View style={styles.horizontalStatItem}>
          <ShimmerCircle size={48} />
          <ShimmerLine
            width={70}
            height={12}
            style={styles.horizontalStatLabel}
          />
          <ShimmerLine
            width={40}
            height={24}
            style={styles.horizontalStatValue}
          />
        </View>
        
        <View style={styles.horizontalStatItem}>
          <ShimmerCircle size={48} />
          <ShimmerLine
            width={70}
            height={12}
            style={styles.horizontalStatLabel}
          />
          <ShimmerLine
            width={40}
            height={24}
            style={styles.horizontalStatValue}
          />
        </View>
        
        <View style={styles.horizontalStatItem}>
          <ShimmerCircle size={48} />
          <ShimmerLine
            width={70}
            height={12}
            style={styles.horizontalStatLabel}
          />
          <ShimmerLine
            width={40}
            height={24}
            style={styles.horizontalStatValue}
          />
        </View>
        
        <View style={styles.horizontalStatItem}>
          <ShimmerCircle size={48} />
          <ShimmerLine
            width={70}
            height={12}
            style={styles.horizontalStatLabel}
          />
          <ShimmerLine
            width={40}
            height={24}
            style={styles.horizontalStatValue}
          />
        </View>
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
    marginBottom: 4,
  },
  statLabel: {
    marginTop: 4,
  },
  // Horizontal stats styles
  horizontalStatsCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  horizontalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horizontalStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  horizontalStatLabel: {
    marginTop: 8,
    marginBottom: 4,
  },
  horizontalStatValue: {
    marginTop: 4,
  },
});

export default StatCardShimmer;