-- Add property groups support for building management
-- This migration adds property_groups table and group_id to properties table

-- Create property_groups table
CREATE TABLE IF NOT EXISTS property_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  group_type text NOT NULL DEFAULT 'residential_building',
  description text,
  address text,
  city text,
  country text,
  neighborhood text,
  floors_count integer,
  elevators_count integer DEFAULT 0,
  parking_capacity integer DEFAULT 0,
  amenities text[],
  images text[],
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_group_type CHECK (group_type IN ('residential_building', 'apartment_block', 'villa_compound', 'commercial_building', 'mixed_use', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'maintenance', 'sold'))
);

-- Add group_id column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES property_groups(id) ON DELETE SET NULL;

-- Add property_code column to properties table for unit identification
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_code text;

-- Add floor_number column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS floor_number integer;

-- Add building_name column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS building_name text;

-- Add annual_rent column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS annual_rent numeric;

-- Add service_charge column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS service_charge numeric DEFAULT 0;

-- Enable RLS on property_groups table
ALTER TABLE property_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for property_groups
CREATE POLICY "Users can view property groups they own"
  ON property_groups FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Managers and admins can view all property groups"
  ON property_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can create property groups"
  ON property_groups FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their property groups"
  ON property_groups FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their property groups"
  ON property_groups FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Create updated_at trigger for property_groups
CREATE TRIGGER on_property_groups_updated
  BEFORE UPDATE ON property_groups
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_groups_owner ON property_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_property_groups_status ON property_groups(status);
CREATE INDEX IF NOT EXISTS idx_properties_group ON properties(group_id);
CREATE INDEX IF NOT EXISTS idx_properties_code ON properties(property_code);
