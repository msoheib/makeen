import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerBox, ShimmerLine, ShimmerCircle } from './ShimmerPlaceholder';
import { useTheme as useAppTheme } from '@/hooks/useTheme';
import { getFlexDirection } from '@/lib/rtl';

interface PropertyCardShimmerProps {
  compact?: boolean;
}

export const PropertyCardShimmer: React.FC<PropertyCardShimmerProps> = ({ compact = false }) => {
  const { theme } = useAppTheme();

  return (
    <View style={[
      styles.card,
      compact ? styles.compactCard : null,
      { backgroundColor: theme.colors.surface }
    ]}>
      {/* Image placeholder - only show if not compact */}
      {!compact && (
        <ShimmerBox
          width="100%"
          height={180}
          borderRadius={0}
          style={styles.image}
        />
      )}

      <View style={[styles.content, compact ? styles.compactContent : null]}>
        {/* Header row with type chip */}
        <View style={[styles.headerRow, { flexDirection: getFlexDirection('row') }]}>
          <ShimmerBox
            width={80}
            height={26}
            borderRadius={13}
          />
        </View>

        {/* Title */}
        <ShimmerLine
          width="80%"
          height={18}
          style={styles.title}
        />

        {/* Location */}
        <View style={[styles.locationRow, { flexDirection: getFlexDirection('row') }]}>
          <ShimmerCircle size={16} />
          <ShimmerLine
            width="60%"
            height={14}
            style={styles.locationText}
          />
        </View>

        {!compact && (
          <>
            {/* Property details */}
            <View style={[styles.detailsRow, { flexDirection: getFlexDirection('row') }]}>
              <View style={styles.detailItem}>
                <ShimmerLine width={50} height={16} />
              </View>
              <View style={styles.detailItem}>
                <ShimmerLine width={50} height={16} />
              </View>
              <View style={styles.detailItem}>
                <ShimmerLine width={50} height={16} />
              </View>
            </View>

            {/* Price */}
            <View style={[styles.priceContainer, { flexDirection: getFlexDirection('row') }]}>
              <ShimmerLine
                width={120}
                height={18}
                style={styles.price}
              />
              <ShimmerLine
                width={80}
                height={14}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
};

// Export a list shimmer that shows multiple cards
export const PropertyListShimmer: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <>
      {[...Array(count)].map((_, index) => (
        <PropertyCardShimmer key={index} />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  compactCard: {
    marginBottom: 8,
  },
  image: {
    marginBottom: 0,
  },
  content: {
    padding: 16,
  },
  compactContent: {
    padding: 12,
  },
  headerRow: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  locationRow: {
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  locationText: {
    flex: 1,
  },
  detailsRow: {
    justifyContent: 'flex-start',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailItem: {
    marginRight: 16,
  },
  priceContainer: {
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  price: {
    marginRight: 8,
  },
});

// For backwards compatibility
export default PropertyCardShimmer;
