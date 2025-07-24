-- Create storage buckets for the real estate management app
-- This migration creates the necessary storage buckets and RLS policies

-- Create maintenance-photos bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maintenance-photos',
  'maintenance-photos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create property-images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create profile-pictures bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow uploads to real estate buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow viewing real estate files" ON storage.objects;
DROP POLICY IF EXISTS "Allow updating real estate files" ON storage.objects;
DROP POLICY IF EXISTS "Allow deleting real estate files" ON storage.objects;

-- Create comprehensive storage policies for all buckets
CREATE POLICY "Allow uploads to real estate buckets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('maintenance-photos', 'property-images', 'documents', 'profile-pictures'));

CREATE POLICY "Allow viewing real estate files" ON storage.objects  
FOR SELECT TO authenticated
USING (bucket_id IN ('maintenance-photos', 'property-images', 'documents', 'profile-pictures'));

CREATE POLICY "Allow updating real estate files" ON storage.objects
FOR UPDATE TO authenticated  
USING (bucket_id IN ('maintenance-photos', 'property-images', 'documents', 'profile-pictures'));

CREATE POLICY "Allow deleting real estate files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id IN ('maintenance-photos', 'property-images', 'documents', 'profile-pictures'));

-- Create additional policies for public buckets (allow anonymous read access)
CREATE POLICY "Allow public read access to public buckets" ON storage.objects
FOR SELECT TO anon
USING (bucket_id IN ('maintenance-photos', 'property-images', 'profile-pictures'));