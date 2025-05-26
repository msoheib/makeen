import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { Card, Text, Chip, TouchableRipple } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Property } from '@/lib/types';
import { Building2, MapPin } from 'lucide-react-native';
import { theme, shadows } from '@/lib/theme';

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

  return (
    <Card
      style={[styles.card, compact ? styles.compactCard : null, shadows.medium]}
      onPress={handlePress}
    >
      {!compact && property.images && property.images.length > 0 && (
        <Card.Cover source={{ uri: property.images[0] }} style={styles.image} />
      )}
      <Card.Content style={[styles.content, compact ? styles.compactContent : null]}>
        <View style={styles.headerRow}>
          <Chip
            mode="flat"
            style={[
              styles.statusChip,
              { backgroundColor: `${statusColors[property.status]}20` },
            ]}
            textStyle={{ color: statusColors[property.status], fontWeight: '500' }}
          >
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </Chip>
          <Chip
            mode="outlined"
            style={styles.typeChip}
            textStyle={{ color: theme.colors.onSurfaceVariant }}
          >
            {property.property_type}
          </Chip>
        </View>

        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {property.title}
        </Text>

        <View style={styles.locationRow}>
          <MapPin size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
            {property.address}, {property.city}
          </Text>
        </View>

        {!compact && (
          <>
            <View style={styles.detailsRow}>
              {property.bedrooms !== undefined && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>{property.bedrooms}</Text>
                  <Text style={styles.detailLabel}>Beds</Text>
                </View>
              )}
              {property.bathrooms !== undefined && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>{property.bathrooms}</Text>
                  <Text style={styles.detailLabel}>Baths</Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Text style={styles.detailValue}>{property.area_sqm}</Text>
                <Text style={styles.detailLabel}>Sqm</Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                ${property.price.toLocaleString()}
              </Text>
              <Text style={styles.paymentMethod}>
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
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusChip: {
    height: 26,
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
  },
  detailLabel: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
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
  },
  paymentMethod: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
});