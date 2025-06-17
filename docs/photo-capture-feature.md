# Photo Capture Feature for Maintenance Requests

## Overview
The maintenance request form now includes comprehensive photo capture functionality that allows users to take photos using the device camera, select photos from the gallery, upload multiple photos, preview and manage attached photos, and automatically upload to Supabase Storage.

## Features

### 📸 Camera Integration
- Full-screen camera view with professional controls
- Front/back camera switching for versatility  
- High-quality photo capture (0.8 quality ratio)
- Loading indicators during photo processing

### 🖼️ Gallery Selection
- Native gallery integration using Expo ImagePicker
- Image editing support with 4:3 aspect ratio cropping
- Multiple format support (JPG, PNG, GIF, WebP)

### 🔄 Upload Management
- Automatic Supabase Storage upload to dedicated bucket
- File validation (size limits, format checking)
- Progress indicators and error handling
- Unique filename generation to prevent conflicts

### 🎨 User Interface  
- Horizontal photo grid with smooth scrolling
- Photo preview thumbnails with remove functionality
- Add photo button with menu selection (camera/gallery)
- Photo counter showing current/maximum photos
- Material Design 3 styling throughout

## Technical Implementation

### Components
- **PhotoCapture.tsx** - Main photo capture component
- **imageUpload.ts** - Supabase Storage utility functions
- **Maintenance form integration** - Seamless form integration

### Database Schema
Images stored as text array in maintenance_requests table:
```
images: string[] -- Array of Supabase Storage URLs
```

### Storage Structure
```
Supabase Storage Bucket: maintenance-photos
├── requests/
│   ├── 1672531200000_abc123.jpg
│   ├── 1672531201000_def456.png
│   └── ...
```

### Permissions Required
- Camera permissions for taking photos
- Media library permissions for gallery access

## Usage Examples

### Basic Usage
```tsx
<PhotoCapture
  images={formData.images}
  onImagesChange={handleImagesChange}
  maxImages={5}
  disabled={loading}
/>
```

## File Validation

### Size Limits
- Maximum file size: 5MB per image
- Automatic compression: 0.8 quality for optimal balance

### Supported Formats
- JPG/JPEG - Standard photo format
- PNG - For screenshots and graphics  
- GIF - Animated images supported
- WebP - Modern web format

### Error Handling
- File too large - Clear error message with size info
- Invalid format - Format validation with supported types
- Upload failures - Retry mechanisms and user feedback
- Permission denials - Helpful permission request prompts

## Internationalization

Supports both English and Arabic translations for all user-facing text including photo management, error messages, and UI controls.

## Security & Performance

### File Validation
- Type checking prevents malicious file uploads
- Size limits prevent storage abuse
- Unique naming prevents file conflicts

### Performance Optimizations
- Client-side compression reduces upload time
- Base64 conversion for cross-platform compatibility
- Progress indicators for user feedback 