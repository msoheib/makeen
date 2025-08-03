import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  ActionSheetIOS,
  Modal,
} from 'react-native';
import {
  Avatar,
  Button,
  ActivityIndicator,
  Text,
  Portal,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { theme, spacing } from '@/lib/theme';
import { Camera as CameraIcon, Image as ImageIcon, User, Upload, X } from 'lucide-react-native';
import { uploadImage, validateImage, deleteImage, ImageUploadResult } from '@/lib/imageUpload';
import { useTranslation } from '@/lib/useTranslation';
import { supabase } from '@/lib/supabase';

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
  const [showWebModal, setShowWebModal] = useState(false);

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

  const showImageOptions = () => {
    if (uploading || disabled) {
      return;
    }

    if (Platform.OS === 'ios') {
      const options = ['Take Photo', 'Choose from Gallery'];
      if (currentImageUrl) {
        options.push('Remove Picture');
      }
      options.push('Cancel');

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: currentImageUrl ? 2 : undefined,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 0:
              pickImageFromCamera();
              break;
            case 1:
              pickImageFromGallery();
              break;
            case 2:
              if (currentImageUrl) {
                removeProfilePicture();
              }
              break;
          }
        }
      );
    } else if (Platform.OS === 'web') {
      setShowWebModal(true);
    } else {
      const options = ['Take Photo', 'Choose from Gallery'];
      if (currentImageUrl) {
        options.push('Remove Picture');
      }
      options.push('Cancel');

      Alert.alert(
        'Profile Picture',
        'Choose an option:',
        options.map((option, index) => ({
          text: option,
          onPress: () => {
            switch (index) {
              case 0:
                pickImageFromCamera();
                break;
              case 1:
                pickImageFromGallery();
                break;
              case 2:
                if (currentImageUrl) {
                  removeProfilePicture();
                }
                break;
            }
          },
          style: option === 'Remove Picture' ? 'destructive' : 'default',
        }))
      );
    }
  };

  const pickImageFromCamera = async () => {
    try {
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
      // Check authentication first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Authentication Error', 'Please log in again to upload profile pictures.');
        return;
      }
      
      // Validate image
      const validation = await validateImage(uri, 2 * 1024 * 1024); // 2MB limit for profile pictures
      
      if (!validation.valid) {
        Alert.alert('Invalid Image', validation.error || 'Please select a valid image file.');
        return;
      }

      // Delete old profile picture if exists
      if (currentImageUrl) {
        await deleteImage(currentImageUrl, 'profile-pictures');
      }

      // Upload to Supabase Storage
      const uploadResult: ImageUploadResult = await uploadImage(
        uri,
        'profile-pictures',
        userId // Use user ID as folder for organization
      );

      if (uploadResult.success && uploadResult.url) {
        onImageChange(uploadResult.url);
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
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
        <TouchableOpacity
          style={[
            styles.uploadButton,
            uploading && styles.uploadButtonDisabled,
            { width: size / 3, height: size / 3, borderRadius: size / 6 }
          ]}
          onPress={showImageOptions}
          disabled={uploading || disabled}
          activeOpacity={0.7}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Upload size={size / 6} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {uploading && (
        <Text style={styles.uploadingText}>Uploading...</Text>
      )}

      {/* Web Modal for Image Options */}
      {Platform.OS === 'web' && (
        <Portal>
          <Modal
            visible={showWebModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowWebModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Profile Picture</Text>
                  <TouchableOpacity
                    onPress={() => setShowWebModal(false)}
                    style={styles.closeButton}
                  >
                    <X size={20} color={theme.colors.onSurface} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalOptions}>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      setShowWebModal(false);
                      pickImageFromCamera();
                    }}
                  >
                    <CameraIcon size={24} color={theme.colors.primary} />
                    <Text style={styles.modalOptionText}>Take Photo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      setShowWebModal(false);
                      pickImageFromGallery();
                    }}
                  >
                    <ImageIcon size={24} color={theme.colors.primary} />
                    <Text style={styles.modalOptionText}>Choose from Gallery</Text>
                  </TouchableOpacity>
                  
                  {currentImageUrl && (
                    <TouchableOpacity
                      style={[styles.modalOption, styles.modalOptionDestructive]}
                      onPress={() => {
                        setShowWebModal(false);
                        removeProfilePicture();
                      }}
                    >
                      <User size={24} color={theme.colors.error} />
                      <Text style={[styles.modalOptionText, { color: theme.colors.error }]}>
                        Remove Picture
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </Modal>
        </Portal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    width: '80%',
    maxWidth: 350,
    elevation: 5,
    ...Platform.select({
      web: {
        boxShadow: `0 4px 15px ${theme.colors.shadow}40`,
      },
      default: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  closeButton: {
    padding: spacing.s,
  },
  modalOptions: {
    padding: spacing.m,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  modalOptionText: {
    marginLeft: spacing.s,
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  modalOptionDestructive: {
    backgroundColor: theme.colors.errorContainer,
    borderColor: theme.colors.errorContainer,
    borderWidth: 1,
  },
});