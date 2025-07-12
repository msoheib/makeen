import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerBox, ShimmerLine } from './ShimmerPlaceholder';

interface MaintenanceCardShimmerProps {
  style?: any;
}

export const MaintenanceCardShimmer: React.FC<MaintenanceCardShimmerProps> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.content}>
        {/* Header Row - Title and Status Chip */}
        <View style={styles.headerRow}>
          <ShimmerLine
            width={160}
            height={16}
            style={styles.titleShimmer}
          />
          <ShimmerBox 
            width={80} 
            height={26} 
            style={styles.statusChipShimmer} 
          />
        </View>

        {/* Description */}
        <ShimmerLine
          width={220}
          height={12}
          style={styles.descriptionShimmer}
        />
        <ShimmerLine
          width={180}
          height={12}
          style={styles.descriptionLine2Shimmer}
        />

        {/* Meta Row - Date and Priority */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <ShimmerBox 
              width={16} 
              height={16} 
              style={styles.iconShimmer} 
            />
            <ShimmerLine
              width={80}
              height={12}
              style={styles.metaTextShimmer}
            />
          </View>
          <View style={styles.metaItem}>
            <ShimmerBox 
              width={16} 
              height={16} 
              style={styles.iconShimmer} 
            />
            <ShimmerLine
              width={60}
              height={12}
              style={styles.metaTextShimmer}
            />
          </View>
        </View>

        {/* Images Row */}
        <View style={styles.imagesRow}>
          <ShimmerBox 
            width={90} 
            height={50} 
            style={styles.imageShimmer} 
          />
          <ShimmerBox 
            width={90} 
            height={50} 
            style={styles.imageShimmer} 
          />
          <ShimmerBox 
            width={90} 
            height={50} 
            style={styles.imageShimmer} 
          />
        </View>
      </View>
    </View>
  );
};

// Maintenance List Shimmer for showing multiple placeholder cards
export const MaintenanceListShimmer: React.FC = () => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
        <MaintenanceCardShimmer key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleShimmer: {
    flex: 1,
    marginRight: 12,
  },
  statusChipShimmer: {
    borderRadius: 13,
  },
  descriptionShimmer: {
    marginBottom: 6,
  },
  descriptionLine2Shimmer: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconShimmer: {
    borderRadius: 8,
    marginRight: 4,
  },
  metaTextShimmer: {
    marginLeft: 4,
  },
  imagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageShimmer: {
    borderRadius: 6,
    marginRight: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
});

export default MaintenanceCardShimmer;