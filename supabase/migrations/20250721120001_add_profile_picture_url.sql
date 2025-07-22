-- Add profile_picture_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to user profile picture stored in Supabase Storage profile-pictures bucket';