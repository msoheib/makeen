import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Button,
  Text,
  ActivityIndicator,
  IconButton,
  Menu,
  Portal,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { theme, spacing } from '@/lib/theme';
import { ImagePlus, Camera as CameraIcon, Image as ImageIcon, X } from 'lucide-react-native';
import { uploadImage, validateImage, ImageUploadResult } from '@/lib/imageUpload';
import { useTranslation } from '@/lib/useTranslation';

interface PhotoCaptureProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
  label?: string;
  error?: string;
}

const { width } = Dimensions.get('window');
const imageSize = (width - spacing.md * 4) / 3; // 3 images per row

export default function PhotoCapture({
  images,
  onImagesChange,
  maxImages = 5,
  disabled = false,
  label,
  error
}: PhotoCaptureProps) {
  const { t } = useTranslation('maintenance');
  const [uploading, setUploading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();

  // Request permissions on component mount
  React.useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraResult.status !== 'granted' || mediaLibraryResult.status !== 'granted') {
      Alert.alert(
        t('common:permissions'),
        t('photos.permissionsRequired'),
        [{ text: t('common:ok') }]
      );
    }
  };

  const takePhoto = async () => {
    if (!cameraRef) return;

    try {
      setUploading(true);
      const photo = await cameraRef.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo) {
        await processImage(photo.uri);
        setCameraVisible(false);
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert(t('common:error'), t('photos.cameraError'));
    } finally {
      setUploading(false);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      setUploading(true);
      setMenuVisible(false);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert(t('common:error'), t('photos.galleryError'));
    } finally {
      setUploading(false);
    }
  };

  const openCamera = async () => {
    setMenuVisible(false);
    
    if (!permission?.granted) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        Alert.alert(
          t('common:permissions'),
          t('photos.cameraPermissionRequired'),
          [{ text: t('common:ok') }]
        );
        return;
      }
    }
    
    setCameraVisible(true);
  };

  const processImage = async (uri: string) => {
    try {
      // Validate image
      const validation = await validateImage(uri);
      if (!validation.valid) {
        Alert.alert(t('photos.invalidImage'), validation.error || t('common:tryAgain'));
        return;
      }

      // Upload to Supabase Storage
      const uploadResult: ImageUploadResult = await uploadImage(
        uri,
        'maintenance-photos',
        'requests'
      );

      if (uploadResult.success && uploadResult.url) {
        // Add to images array
        const newImages = [...images, uploadResult.url];
        onImagesChange(newImages);
      } else {
        Alert.alert(t('photos.uploadFailed'), uploadResult.error || t('common:tryAgain'));
      }
    } catch (error: any) {
      console.error('Error processing image:', error);
      Alert.alert(t('common:error'), t('common:tryAgain'));
    }
  };

  const removeImage = (index: number) => {
    Alert.alert(
      t('photos.removePhoto'),
      t('photos.confirmRemove'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('common:remove'),
          style: 'destructive',
          onPress: () => {
            const newImages = images.filter((_, i) => i !== index);
            onImagesChange(newImages);
          },
        },
      ]
    );
  };

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const renderCameraView = () => (
    <Portal>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={setCameraRef}
        >
          <View style={styles.cameraControls}>
            <View style={styles.cameraTopControls}>
              <IconButton
                icon="close"
                iconColor="white"
                size={24}
                onPress={() => setCameraVisible(false)}
                style={styles.cameraCloseButton}
              />
              <IconButton
                icon="camera-flip"
                iconColor="white"
                size={24}
                onPress={toggleCameraFacing}
                style={styles.cameraFlipButton}
              />
            </View>
            
            <View style={styles.cameraBottomControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePhoto}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </Portal>
  );

  if (cameraVisible) {
    return renderCameraView();
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, error && { color: theme.colors.error }]}>
          {label}
        </Text>
      )}

      {/* Photo Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
        <View style={styles.imageGrid}>
          {images.map((imageUrl, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: imageUrl }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Photo Button */}
          {images.length < maxImages && !disabled && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={[styles.addButton, uploading && styles.addButtonDisabled]}
                  onPress={() => setMenuVisible(true)}
                  disabled={uploading || disabled}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <>
                      <ImagePlus size={24} color={theme.colors.primary} />
                      <Text style={styles.addButtonText}>{t('photos.addPhoto')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={openCamera}
                title={t('photos.takePhoto')}
                leadingIcon={() => <CameraIcon size={20} color={theme.colors.onSurface} />}
              />
              <Menu.Item
                onPress={pickImageFromGallery}
                title={t('photos.chooseFromGallery')}
                leadingIcon={() => <ImageIcon size={20} color={theme.colors.onSurface} />}
              />
            </Menu>
          )}
        </View>
      </ScrollView>

      {/* Image Count */}
      <Text style={styles.imageCount}>
        {images.length}/{maxImages} {t('photos.photoCount')}
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  imageScroll: {
    marginBottom: spacing.sm,
  },
  imageGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: imageSize,
    height: imageSize,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: imageSize,
    height: imageSize,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  imageCount: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  cameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 1000,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraTopControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: spacing.md,
  },
  cameraCloseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cameraFlipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cameraBottomControls: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
  },
}); 