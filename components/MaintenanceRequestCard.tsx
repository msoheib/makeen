import React, { useState } from 'react';
import { View, StyleSheet, Image, Platform, I18nManager } from 'react-native';
import { Card, Text, Chip, TouchableRipple } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaintenanceRequest } from '@/lib/types';
import { Clock, AlertCircle, ImageIcon } from 'lucide-react-native';
import { shadows } from '@/lib/theme';
import { addAlpha } from '@/lib/colors';
import { format } from 'date-fns';
import { useMaintenanceTranslation } from '@/lib/useTranslation';
import { getFlexDirection, getTextAlign, rtlStyles } from '@/lib/rtl';

interface MaintenanceRequestCardProps {
  request: MaintenanceRequest;
  theme?: any; // Add theme as optional prop
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
const MaintenanceImage = ({ imageName, style, theme }: { imageName: string; style: any; theme: any }) => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return (
      <View style={[style, { backgroundColor: theme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center', borderRadius: 6 }]}>
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

export default function MaintenanceRequestCard({ request, theme, onPress }: MaintenanceRequestCardProps) {
  const router = useRouter();
  const { t } = useMaintenanceTranslation();

  // Force RTL for this component
  React.useEffect(() => {
    // Force RTL at the native level
    if (typeof I18nManager !== 'undefined') {
      I18nManager.forceRTL(true);
      I18nManager.allowRTL(true);
    }
  }, []);

  // Use default theme if not provided (fallback)
  const currentTheme = theme || {
    colors: {
      surface: '#FFFFFF',
      onSurface: '#1C1B1F',
      onSurfaceVariant: '#49454F',
      surfaceVariant: '#F5F5F5',
      primary: '#1976D2',
      secondary: '#2196F3',
      tertiary: '#7B1FA2',
      success: '#4CAF50',
      error: '#D32F2F',
      warning: '#FF9800',
    }
  };

  // Status color mapping - now inside component with access to theme
  const statusColors = {
    pending: currentTheme.colors.warning,
    approved: currentTheme.colors.primary,
    in_progress: currentTheme.colors.tertiary,
    completed: currentTheme.colors.success,
    cancelled: currentTheme.colors.error,
  };

  // Priority color mapping - now inside component with access to theme
  const priorityColors = {
    low: currentTheme.colors.success,
    medium: currentTheme.colors.tertiary,
    high: currentTheme.colors.warning,
    urgent: currentTheme.colors.error,
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/maintenance/${request.id}`);
    }
  };

  // Function to get translated status
  const getStatusLabel = (status: string) => {
    const statusKey = status === 'in_progress' ? 'inProgress' : status;
    return t(`statuses.${statusKey}`) || status;
  };

  // Function to get translated priority
  const getPriorityLabel = (priority: string) => {
    return t(`priorities.${priority}`) || priority;
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

  // Create styles inside component with access to current theme
  const styles = StyleSheet.create({
    card: {
      marginBottom: 16,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: currentTheme.colors.surface,
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
      color: currentTheme.colors.onSurface,
    },
    statusChip: {
      height: 26,
    },
    description: {
      fontSize: 14,
      color: currentTheme.colors.onSurfaceVariant,
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
      color: currentTheme.colors.onSurfaceVariant,
      marginHorizontal: 4,
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
      backgroundColor: currentTheme.colors.surfaceVariant,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    moreImagesText: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.colors.onSurfaceVariant,
    },
  });

  return (
    <Card 
      style={[
        styles.card, 
        shadows.medium,
        Platform.select({
          web: { cursor: 'pointer' },
          default: {}
        }),
        { direction: 'rtl' as any, writingDirection: 'rtl' as any }
      ]} 
      onPress={handlePress}
      {...webTouchProps}
      dir="rtl"
    >
      <Card.Content style={[styles.content, { direction: 'rtl' as any, writingDirection: 'rtl' as any }]}>
        <View style={[styles.headerRow, rtlStyles.row(), { flexDirection: 'row-reverse' as any, direction: 'rtl' as any }]}>
          <Text 
            style={[
              styles.title, 
              { 
                textAlign: 'right' as any, 
                direction: 'rtl' as any, 
                writingDirection: 'rtl' as any 
              }
            ]} 
            numberOfLines={1} 
            ellipsizeMode="tail"
            dir="rtl"
          >
            {request.title}
          </Text>
          <Chip
            mode="flat"
            style={[
              styles.statusChip,
              { backgroundColor: addAlpha((statusColors as any)[request.status] || currentTheme.colors.onSurfaceVariant, 0.125) },
            ]}
            textStyle={{ color: (statusColors as any)[request.status] || currentTheme.colors.onSurfaceVariant, fontWeight: '500' }}
          >
            {getStatusLabel(request.status)}
          </Chip>
        </View>

        <Text 
          style={[
            styles.description, 
            { 
              textAlign: 'right' as any, 
              direction: 'rtl' as any, 
              writingDirection: 'rtl' as any 
            }
          ]} 
          numberOfLines={2} 
          ellipsizeMode="tail"
          dir="rtl"
        >
          {request.description}
        </Text>

        <View style={[styles.metaRow, rtlStyles.row(), { flexDirection: 'row-reverse' as any, direction: 'rtl' as any }]}>
          <View style={[styles.metaItem, rtlStyles.row(), { flexDirection: 'row-reverse' as any, direction: 'rtl' as any }]}>
            <Clock size={16} color={currentTheme.colors.onSurfaceVariant} />
            <Text 
              style={[
                styles.metaText, 
                { 
                  textAlign: 'right' as any, 
                  direction: 'rtl' as any, 
                  writingDirection: 'rtl' as any 
                }
              ]}
              dir="rtl"
            >
              {format(new Date(request.created_at), 'MMM d, yyyy')}
            </Text>
          </View>
          <View style={[styles.metaItem, rtlStyles.row(), { flexDirection: 'row-reverse' as any, direction: 'rtl' as any }]}>
            <AlertCircle 
              size={16} 
              color={priorityColors[request.priority]} 
            />
            <Text 
              style={[
                styles.metaText, 
                { 
                  color: priorityColors[request.priority],
                  textAlign: 'right' as any, 
                  direction: 'rtl' as any, 
                  writingDirection: 'rtl' as any 
                }
              ]}
              dir="rtl"
            >
              {getPriorityLabel(request.priority)}
            </Text>
          </View>
        </View>

        {request.images && request.images.length > 0 && (
          <View style={[styles.imagesRow, rtlStyles.row(), { flexDirection: 'row-reverse' as any, direction: 'rtl' as any }]}>
            {request.images.slice(0, 3).map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <MaintenanceImage 
                  imageName={image}
                  style={styles.image}
                  theme={currentTheme}
                />
              </View>
            ))}
            {request.images.length > 3 && (
              <View style={styles.moreImagesContainer}>
                <Text 
                  style={[
                    styles.moreImagesText, 
                    { 
                      textAlign: 'right' as any, 
                      direction: 'rtl' as any, 
                      writingDirection: 'rtl' as any 
                    }
                  ]}
                  dir="rtl"
                >+{request.images.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

// Static styles (moved outside component for performance)
const staticStyles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
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
  },
  description: {
    fontSize: 14,
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
    marginHorizontal: 4,
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
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 16,
    fontWeight: '600',
  },
});