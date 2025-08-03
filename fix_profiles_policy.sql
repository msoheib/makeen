-- Fix for Transfer Ownership Issue
-- This adds the missing policy to allow managers and admins to view all profiles

-- Add policy for managers and admins to view all profiles
CREATE POLICY "Managers and admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );