import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { Card, Text, Chip, TouchableRipple } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Property } from '@/lib/types';
import { Building2, MapPin } from 'lucide-react-native';
import { theme, shadows } from '@/lib/theme';
import { getFlexDirection, getTextAlign, rtlStyles } from '@/lib/rtl';
import { formatDisplayNumber, toArabicNumerals } from '@/lib/formatters';

// Status color mapping
const statusColors = {
  available: theme.colors.success,
  rented: theme.colors.primary,
  maintenance: theme.colors.warning,
  reserved: theme.colors.tertiary,
};

interface PropertyCardProps {
  property: Property;
  onPress?: () => void;
  compact?: boolean;
}

export default function PropertyCard({ property, onPress, compact = false }: PropertyCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/properties/${property.id}`);
    }
  };

  // Web-specific touch optimizations
  const webTouchProps = Platform.select({
    web: {
      style: { cursor: 'pointer' },
      // Enable touch events to propagate for scrolling while maintaining press functionality
      onTouchStart: (e: any) => {
        // Allow touch events to bubble up for scrolling
        e.stopPropagation = () => {};
      },
    },
    default: {}
  });

  return (
    <Card
      style={[
        styles.card, 
        compact ? styles.compactCard : null, 
        shadows.medium,
        Platform.select({
          web: { cursor: 'pointer' },
          default: {}
        })
      ]}
      onPress={handlePress}
      {...webTouchProps}
    >
      {!compact && property.images && property.images.length > 0 && (
        <View style={styles.imageContainer}>
          <Card.Cover source={{ uri: property.images[0] }} style={styles.image} />
          <Chip
            mode="flat"
            style={[
              styles.statusChipOverlay,
              { backgroundColor: `${statusColors[property.status]}` },
            ]}
            textStyle={{ color: 'white', fontWeight: '600', fontSize: 11 }}
          >
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </Chip>
        </View>
      )}
      <Card.Content style={[styles.content, compact ? styles.compactContent : null]}>
        <View style={[styles.headerRow, rtlStyles.row()]}>
          <Chip
            mode="outlined"
            style={styles.typeChip}
            textStyle={{ color: theme.colors.onSurfaceVariant }}
          >
            {property.property_type}
          </Chip>
        </View>

        <Text style={[styles.title, rtlStyles.textAlign()]} numberOfLines={1} ellipsizeMode="tail">
          {property.title}
        </Text>

        <View style={[styles.locationRow, rtlStyles.row()]}>
          <MapPin size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.locationText, rtlStyles.textAlign()]} numberOfLines={1} ellipsizeMode="tail">
            {property.address}, {property.city}
          </Text>
        </View>

        {!compact && (
          <>
            <View style={[styles.detailsRow, rtlStyles.row()]}>
              {property.bedrooms !== undefined && (
                <View style={[styles.detailItem, rtlStyles.row()]}>
                  <Text style={[styles.detailValue, rtlStyles.textAlign()]}>{formatDisplayNumber(property.bedrooms)}</Text>
                  <Text style={[styles.detailLabel, rtlStyles.textAlign()]}>Beds</Text>
                </View>
              )}
              {property.bathrooms !== undefined && (
                <View style={[styles.detailItem, rtlStyles.row()]}>
                  <Text style={[styles.detailValue, rtlStyles.textAlign()]}>{formatDisplayNumber(property.bathrooms)}</Text>
                  <Text style={[styles.detailLabel, rtlStyles.textAlign()]}>Baths</Text>
                </View>
              )}
              <View style={[styles.detailItem, rtlStyles.row()]}>
                <Text style={[styles.detailValue, rtlStyles.textAlign()]}>{formatDisplayNumber(property.area_sqm)}</Text>
                <Text style={[styles.detailLabel, rtlStyles.textAlign()]}>Sqm</Text>
              </View>
            </View>

            <View style={[styles.priceContainer, rtlStyles.row()]}>
              <Text style={[styles.price, rtlStyles.textAlign()]}>
                {toArabicNumerals(new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(property.price))} ر.س
              </Text>
              <Text style={[styles.paymentMethod, rtlStyles.textAlign()]}>
                {property.payment_method === 'cash' ? 'Cash' : 'Installment'}
              </Text>
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  compactCard: {
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    height: 180,
  },
  content: {
    paddingVertical: 12,
  },
  compactContent: {
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align both chips to the left
    marginBottom: 16,
  },
  statusChipOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  typeChip: {
    height: 26,
    borderColor: theme.colors.outline,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.onSurface,
    textAlign: 'right',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
    flex: 1,
    textAlign: 'right',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  detailItem: {
    marginRight: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'right',
  },
  detailLabel: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
    textAlign: 'right',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    textAlign: 'right',
  },
  paymentMethod: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'right',
  },
});