-- Fix property manager permissions for ownership transfers
-- This migration adds policies to allow managers and admins to update properties

-- Drop the restrictive policy that only allows owners
DROP POLICY IF EXISTS "Owners can manage their properties" ON properties;

-- Create new policies that allow proper role-based access
CREATE POLICY "Owners can manage their properties"
  ON properties FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Add policy for managers and admins to update properties
CREATE POLICY "Managers and admins can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Add policy for managers and admins to insert properties
CREATE POLICY "Managers and admins can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Add policy for managers and admins to delete properties
CREATE POLICY "Managers and admins can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  ); 