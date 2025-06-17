import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, Chip, TouchableRipple } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaintenanceRequest } from '@/lib/types';
import { Clock, AlertCircle, ImageIcon } from 'lucide-react-native';
import { theme, shadows } from '@/lib/theme';
import { format } from 'date-fns';

// Status color mapping
const statusColors = {
  pending: theme.colors.warning,
  approved: theme.colors.primary,
  in_progress: theme.colors.tertiary,
  completed: theme.colors.success,
  cancelled: theme.colors.error,
};

// Priority color mapping
const priorityColors = {
  low: theme.colors.success,
  medium: theme.colors.tertiary,
  high: theme.colors.warning,
  urgent: theme.colors.error,
};

interface MaintenanceRequestCardProps {
  request: MaintenanceRequest;
  onPress?: () => void;
}

// Helper function to get proper image URL or maintenance-related placeholder
const getImageUrl = (imageName: string): string => {
  // Check if it's already a full URL
  if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
    return imageName;
  }
  
  // If it's just a filename, provide maintenance-related placeholder based on filename
  const maintenancePlaceholders = [
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop', // Tools
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', // Plumbing
    'https://images.unsplash.com/photo-1558618046-2c2a2d1d8e31?w=400&h=300&fit=crop', // Electrical
    'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=300&fit=crop', // General repair
  ];
  
  // Select placeholder based on filename hash for consistency
  const hash = imageName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return maintenancePlaceholders[Math.abs(hash) % maintenancePlaceholders.length];
};

// Component for handling image loading with error fallback
const MaintenanceImage = ({ imageName, style }: { imageName: string; style: any }) => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return (
      <View style={[style, styles.placeholderContainer]}>
        <ImageIcon size={24} color={theme.colors.onSurfaceVariant} />
      </View>
    );
  }
  
  return (
    <Image
      source={{ uri: getImageUrl(imageName) }}
      style={style}
      onError={() => setImageError(true)}
      resizeMode="cover"
    />
  );
};

export default function MaintenanceRequestCard({ request, onPress }: MaintenanceRequestCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/maintenance/${request.id}`);
    }
  };

  return (
    <Card style={[styles.card, shadows.medium]} onPress={handlePress}>
      <Card.Content style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {request.title}
          </Text>
          <Chip
            mode="flat"
            style={[
              styles.statusChip,
              { backgroundColor: `${statusColors[request.status]}20` },
            ]}
            textStyle={{ color: statusColors[request.status], fontWeight: '500' }}
          >
            {request.status.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </Chip>
        </View>

        <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
          {request.description}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.metaText}>
              {format(new Date(request.created_at), 'MMM d, yyyy')}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <AlertCircle 
              size={16} 
              color={priorityColors[request.priority]} 
            />
            <Text 
              style={[
                styles.metaText, 
                { color: priorityColors[request.priority] }
              ]}
            >
              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
            </Text>
          </View>
        </View>

        {request.images && request.images.length > 0 && (
          <View style={styles.imagesRow}>
            {request.images.slice(0, 3).map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <MaintenanceImage 
                  imageName={image}
                  style={styles.image} 
                />
              </View>
            ))}
            {request.images.length > 3 && (
              <View style={styles.moreImagesContainer}>
                <Text style={styles.moreImagesText}>+{request.images.length - 3}</Text>
              </View>
            )}
          </View>
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
  content: {
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    color: theme.colors.onSurface,
  },
  statusChip: {
    height: 26,
  },
  description: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
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
  metaText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  imagesRow: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: '30%',
    marginRight: '3.33%',
    aspectRatio: 16/9,
    borderRadius: 6,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  moreImagesContainer: {
    width: '30%',
    aspectRatio: 16/9,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  placeholderContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
});