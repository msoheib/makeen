import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

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
    console.log('Starting image upload...', { uri, bucket, folder });
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExtension = uri.split('.').pop() || 'jpg';
    const fileName = `${timestamp}_${randomId}.${fileExtension}`;
    
    // Create storage path
    const storagePath = folder ? `${folder}/${fileName}` : fileName;
    console.log('Storage path:', storagePath);
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    console.log('File read as base64, length:', base64.length);
    
    // Convert base64 to ArrayBuffer for React Native compatibility
    const arrayBuffer = decode(base64);
    
    console.log('Converted to ArrayBuffer, byteLength:', arrayBuffer.byteLength);
    
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
  const fileInfo = await FileSystem.getInfoAsync(uri);
  const name = uri.split('/').pop() || 'image.jpg';
  const extension = name.split('.').pop() || 'jpg';
  
  return {
    size: fileInfo.size || 0,
    name,
    type: `image/${extension}`
  };
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
    const fileInfo = await getFileInfo(uri);
    
    // Check file size
    if (fileInfo.size > maxSizeBytes) {
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
    
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Failed to validate image'
    };
  }
} 