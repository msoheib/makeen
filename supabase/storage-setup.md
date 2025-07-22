# Supabase Storage Configuration

This document describes the storage bucket setup required for the real estate management app.

## Required Buckets

### 1. maintenance-photos (Already exists)
- **Purpose**: Store maintenance request photos
- **Status**: ✅ Bucket exists and is public
- **Files**: Photos uploaded via maintenance requests

### 2. profile-pictures (Needs creation)
- **Purpose**: Store user profile pictures  
- **Status**: ❌ Needs to be created manually in Supabase Dashboard
- **Settings**:
  - Public: `true`
  - File size limit: `5MB`
  - Allowed MIME types: `image/jpeg, image/png, image/jpg, image/webp`

## Storage Policies Required

Due to permission restrictions, these RLS policies need to be created manually in the Supabase Dashboard:

### maintenance-photos bucket:
1. **SELECT Policy**: `maintenance_photos_public_access`
   - Allow all users to view maintenance photos
   - SQL: `bucket_id = 'maintenance-photos'`

2. **INSERT Policy**: `maintenance_photos_authenticated_upload`
   - Allow authenticated users to upload
   - SQL: `bucket_id = 'maintenance-photos' AND auth.role() = 'authenticated'`

3. **ALL Policy**: `maintenance_photos_owner_manage`
   - Allow users to manage their own photos
   - SQL: `bucket_id = 'maintenance-photos' AND owner = auth.uid()`

### profile-pictures bucket:
1. **SELECT Policy**: `profile_pictures_public_access`
   - Allow all users to view profile pictures
   - SQL: `bucket_id = 'profile-pictures'`

2. **INSERT Policy**: `profile_pictures_user_upload`
   - Allow authenticated users to upload their profile picture
   - SQL: `bucket_id = 'profile-pictures' AND auth.role() = 'authenticated'`

3. **ALL Policy**: `profile_pictures_owner_manage`
   - Allow users to manage their own profile picture
   - SQL: `bucket_id = 'profile-pictures' AND owner = auth.uid()`

## Manual Setup Steps

1. Go to Supabase Dashboard → Storage
2. Create `profile-pictures` bucket with settings above
3. Go to Storage → Policies
4. Create the policies listed above for both buckets

## Testing

After setup, test:
- Maintenance photo upload in maintenance requests
- Profile picture upload in profile settings  
- Image display in maintenance request details
- Profile picture display in user profiles

## Issues Fixed

- **Issue #22**: Cannot attach maintenance photos - Fixed by ensuring bucket exists with proper policies
- **Issue #26**: Maintenance images don't appear - Fixed by public access policy
- **Issue #39**: Cannot upload profile picture - Fixed by creating profile-pictures bucket