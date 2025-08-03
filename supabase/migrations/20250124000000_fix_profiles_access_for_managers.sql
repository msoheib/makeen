/*
  Fix Profiles Access for Managers and Admins
  
  Issue: Transfer ownership popup doesn't show owner list because managers/admins
  can't access other user profiles due to restrictive RLS policy.
  
  Solution: Add policy allowing managers and admins to view all profiles.
*/

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