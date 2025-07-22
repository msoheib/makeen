import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Avatar,
  Button,
  ActivityIndicator,
  Menu,
  Portal,
  Text,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { theme, spacing } from '@/lib/theme';
import { Camera as CameraIcon, Image as ImageIcon, User, Upload } from 'lucide-react-native';
import { uploadImage, validateImage, deleteImage, ImageUploadResult } from '@/lib/imageUpload';
import { useTranslation } from '@/lib/useTranslation';

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  onImageChange: (imageUrl: string | null) => void;
  userId: string;
  disabled?: boolean;
  size?: number;
}

export default function ProfilePictureUpload({
  currentImageUrl,
  onImageChange,
  userId,
  disabled = false,
  size = 80
}: ProfilePictureUploadProps) {
  const { t } = useTranslation('profile');
  const [uploading, setUploading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Request permissions on component mount
  React.useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraResult.status !== 'granted' || mediaLibraryResult.status !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library access are required to upload profile pictures.',
        [{ text: 'OK' }]
      );
    }
  };

  const pickImageFromCamera = async () => {
    try {
      setMenuVisible(false);
      setUploading(true);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile pictures
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      setMenuVisible(false);
      setUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile pictures
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const processImage = async (uri: string) => {
    try {
      console.log('ProfilePictureUpload: Starting image processing for URI:', uri);
      
      // Validate image
      const validation = await validateImage(uri, 2 * 1024 * 1024); // 2MB limit for profile pictures
      console.log('ProfilePictureUpload: Image validation result:', validation);
      
      if (!validation.valid) {
        console.error('ProfilePictureUpload: Image validation failed:', validation.error);
        Alert.alert('Invalid Image', validation.error || 'Please select a valid image file.');
        return;
      }

      console.log('ProfilePictureUpload: Starting upload to Supabase Storage...');
      
      // Delete old profile picture if exists
      if (currentImageUrl) {
        console.log('ProfilePictureUpload: Deleting old profile picture...');
        await deleteImage(currentImageUrl, 'profile-pictures');
      }

      // Upload to Supabase Storage
      const uploadResult: ImageUploadResult = await uploadImage(
        uri,
        'profile-pictures',
        userId // Use user ID as folder for organization
      );

      console.log('ProfilePictureUpload: Upload result received:', uploadResult);

      if (uploadResult.success && uploadResult.url) {
        console.log('ProfilePictureUpload: Profile picture uploaded successfully:', uploadResult.url);
        onImageChange(uploadResult.url);
        
        // Show success message
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        console.error('ProfilePictureUpload: Upload failed:', uploadResult.error);
        Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload image. Please try again.');
      }
    } catch (error: any) {
      console.error('ProfilePictureUpload: Error processing image:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    }
  };

  const removeProfilePicture = async () => {
    if (!currentImageUrl) return;

    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);
              
              // Delete from storage
              const deleteResult = await deleteImage(currentImageUrl, 'profile-pictures');
              
              if (deleteResult.success) {
                onImageChange(null);
                Alert.alert('Success', 'Profile picture removed successfully.');
              } else {
                Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
              }
            } catch (error: any) {
              console.error('Error removing profile picture:', error);
              Alert.alert('Error', 'An unexpected error occurred while removing the picture.');
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  const getInitials = (userId: string) => {
    // Extract initials from user ID or use 'U' as fallback
    return userId.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {currentImageUrl ? (
          <Avatar.Image
            size={size}
            source={{ uri: currentImageUrl }}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          />
        ) : (
          <Avatar.Text
            size={size}
            label={getInitials(userId)}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            labelStyle={{ color: 'white', fontSize: size / 3, fontWeight: '600' }}
          />
        )}

        {/* Upload/Change Button */}
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={[
                styles.uploadButton,
                uploading && styles.uploadButtonDisabled,
                { width: size / 3, height: size / 3, borderRadius: size / 6 }
              ]}
              onPress={() => setMenuVisible(true)}
              disabled={uploading || disabled}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Upload size={size / 6} color="white" />
              )}
            </TouchableOpacity>
          }
        >
          <Menu.Item
            onPress={pickImageFromCamera}
            title="Take Photo"
            leadingIcon={() => <CameraIcon size={20} color={theme.colors.onSurface} />}
          />
          <Menu.Item
            onPress={pickImageFromGallery}
            title="Choose from Gallery"
            leadingIcon={() => <ImageIcon size={20} color={theme.colors.onSurface} />}
          />
          {currentImageUrl && (
            <Menu.Item
              onPress={removeProfilePicture}
              title="Remove Picture"
              leadingIcon={() => <User size={20} color={theme.colors.error} />}
              titleStyle={{ color: theme.colors.error }}
            />
          )}
        </Menu>
      </View>

      {uploading && (
        <Text style={styles.uploadingText}>Uploading...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    elevation: 4,
    ...Platform.select({
      web: {
        boxShadow: `0 2px 8px ${theme.colors.primary}1A`,
      },
      default: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  uploadButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
    elevation: 4,
    ...Platform.select({
      web: {
        boxShadow: `0 2px 4px ${theme.colors.shadow}40`,
      },
      default: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadingText: {
    marginTop: spacing.s,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});