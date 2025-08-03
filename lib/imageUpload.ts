import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads an image to Supabase Storage
 * @param uri - Local URI of the image file
 * @param bucket - Storage bucket name (default: 'maintenance-photos')
 * @param folder - Optional folder path within bucket
 * @returns Promise with upload result
 */
export async function uploadImage(
  uri: string, 
  bucket: string = 'maintenance-photos',
  folder?: string
): Promise<ImageUploadResult> {
  try {
    console.log('Starting image upload...', { uri, bucket, folder, platform: Platform.OS });
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExtension = uri.split('.').pop() || 'jpg';
    const fileName = `${timestamp}_${randomId}.${fileExtension}`;
    
    // Create storage path
    const storagePath = folder ? `${folder}/${fileName}` : fileName;
    console.log('Storage path:', storagePath);
    
    let arrayBuffer: ArrayBuffer;
    
    if (Platform.OS === 'web') {
      // Web platform: Handle blob/file directly
      console.log('Web platform: Processing image as blob...');
      
      // For web, the uri might be a blob URL or data URL
      if (uri.startsWith('blob:') || uri.startsWith('data:')) {
        const response = await fetch(uri);
        arrayBuffer = await response.arrayBuffer();
        console.log('Web: Converted blob to ArrayBuffer, byteLength:', arrayBuffer.byteLength);
      } else {
        // Fallback: try to read as base64 if FileSystem is available
        try {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          arrayBuffer = decode(base64);
          console.log('Web: Fallback base64 conversion successful, byteLength:', arrayBuffer.byteLength);
        } catch (fsError) {
          console.error('Web: FileSystem not available, trying fetch fallback:', fsError);
          const response = await fetch(uri);
          arrayBuffer = await response.arrayBuffer();
          console.log('Web: Fetch fallback successful, byteLength:', arrayBuffer.byteLength);
        }
      }
    } else {
      // Native platform: Use FileSystem
      console.log('Native platform: Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('Native: File read as base64, length:', base64.length);
      
      // Convert base64 to ArrayBuffer
      arrayBuffer = decode(base64);
      console.log('Native: Converted to ArrayBuffer, byteLength:', arrayBuffer.byteLength);
    }
    
    // Upload to Supabase Storage using ArrayBuffer
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, arrayBuffer, {
        contentType: `image/${fileExtension}`,
        cacheControl: '3600',
        upsert: false
      });
    
    console.log('Supabase upload response:', { data, error });
    
    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);
    
    console.log('Public URL generated:', publicUrlData.publicUrl);
    
    return {
      success: true,
      url: publicUrlData.publicUrl
    };
    
  } catch (error: any) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image'
    };
  }
}

/**
 * Uploads multiple images to Supabase Storage
 * @param uris - Array of local URIs
 * @param bucket - Storage bucket name
 * @param folder - Optional folder path
 * @returns Promise with array of upload results
 */
export async function uploadMultipleImages(
  uris: string[],
  bucket: string = 'maintenance-photos',
  folder?: string
): Promise<ImageUploadResult[]> {
  const uploadPromises = uris.map(uri => uploadImage(uri, bucket, folder));
  return Promise.all(uploadPromises);
}

/**
 * Deletes an image from Supabase Storage
 * @param url - Public URL of the image
 * @param bucket - Storage bucket name
 */
export async function deleteImage(
  url: string,
  bucket: string = 'maintenance-photos'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete image'
    };
  }
}

/**
 * Gets file info from URI
 * @param uri - File URI
 * @returns File information including size
 */
export async function getFileInfo(uri: string): Promise<{
  size: number;
  name: string;
  type: string;
}> {
  const name = uri.split('/').pop() || 'image.jpg';
  const extension = name.split('.').pop() || 'jpg';
  
  if (Platform.OS === 'web') {
    // Web platform: Handle different URI types
    try {
      if (uri.startsWith('blob:') || uri.startsWith('data:')) {
        const response = await fetch(uri);
        const blob = await response.blob();
        return {
          size: blob.size,
          name,
          type: blob.type || `image/${extension}`
        };
      } else {
        // For web, when FileSystem APIs are not available, return reasonable defaults
        console.log('Web: Using default file info for URI type:', uri.substring(0, 20) + '...');
        return {
          size: 0, // Size validation will be skipped
          name,
          type: `image/${extension}`
        };
      }
    } catch (error) {
      console.warn('Web: Error getting file info, using defaults:', error);
      return {
        size: 0,
        name,
        type: `image/${extension}`
      };
    }
  } else {
    // Native platform: Use FileSystem
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return {
        size: fileInfo.size || 0,
        name,
        type: `image/${extension}`
      };
    } catch (error) {
      console.warn('Native: Error getting file info:', error);
      return {
        size: 0,
        name,
        type: `image/${extension}`
      };
    }
  }
}

/**
 * Validates image file
 * @param uri - File URI
 * @param maxSizeBytes - Maximum file size in bytes (default: 5MB)
 * @returns Validation result
 */
export async function validateImage(
  uri: string,
  maxSizeBytes: number = 5 * 1024 * 1024 // 5MB
): Promise<{ valid: boolean; error?: string }> {
  try {
    console.log('Validating image:', { uri: uri.substring(0, 50) + '...', platform: Platform.OS });
    
    // Basic URI validation
    if (!uri) {
      return {
        valid: false,
        error: 'No image URI provided'
      };
    }
    
    // Platform-specific validation
    if (Platform.OS === 'web') {
      // For web, do basic validation without file system access
      console.log('Web: Performing basic image validation...');
      
      // Validate file extension from URI
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const uriLower = uri.toLowerCase();
      const hasValidExtension = validExtensions.some(ext => 
        uriLower.includes(`.${ext}`) || uriLower.includes(`image/${ext}`)
      );
      
      if (!hasValidExtension && !uri.startsWith('blob:') && !uri.startsWith('data:image')) {
        return {
          valid: false,
          error: 'Invalid file type. Please select a valid image file (JPG, PNG, GIF, WebP)'
        };
      }
      
      // Try to get file info for size validation (if possible)
      try {
        const fileInfo = await getFileInfo(uri);
        if (fileInfo.size > 0 && fileInfo.size > maxSizeBytes) {
          return {
            valid: false,
            error: `File size (${(fileInfo.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${(maxSizeBytes / 1024 / 1024).toFixed(1)}MB)`
          };
        }
      } catch (fileInfoError) {
        console.log('Web: Could not get file size, skipping size validation');
      }
      
      console.log('Web: Image validation passed');
      return { valid: true };
      
    } else {
      // Native platform: Full validation with file system access
      console.log('Native: Performing full image validation...');
      
      const fileInfo = await getFileInfo(uri);
      console.log('Native: File info retrieved:', fileInfo);
      
      // Check file size
      if (fileInfo.size > 0 && fileInfo.size > maxSizeBytes) {
        return {
          valid: false,
          error: `File size (${(fileInfo.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${(maxSizeBytes / 1024 / 1024).toFixed(1)}MB)`
        };
      }
      
      // Check file type
      const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const extension = fileInfo.name.split('.').pop()?.toLowerCase();
      
      if (!extension || !validTypes.includes(extension)) {
        return {
          valid: false,
          error: 'Invalid file type. Please select a valid image file (JPG, PNG, GIF, WebP)'
        };
      }
      
      console.log('Native: Image validation passed');
      return { valid: true };
    }
    
  } catch (error: any) {
    console.error('Image validation error:', error);
    return {
      valid: false,
      error: error.message || 'Failed to validate image'
    };
  }
} 