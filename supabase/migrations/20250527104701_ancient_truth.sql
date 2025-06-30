/*
  # Initial Schema for Property Management System

  1. New Tables
    - profiles
      - User profiles with role-based access
    - properties
      - Property listings with details and status
    - maintenance_requests
      - Maintenance tickets with status tracking
    - work_orders
      - Work orders linked to maintenance requests
    - contracts
      - Rental/lease agreements
    - vouchers
      - Financial transactions and payments
    - invoices
      - Billing records

  2. Security
    - RLS enabled on all tables
    - Role-based access policies
    - Secure data access patterns

  3. Relationships
    - Properties linked to owners (profiles)
    - Maintenance requests linked to properties and tenants
    - Contracts linked to properties and tenants
    - Financial records linked to properties and users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'owner', 'tenant', 'staff')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  property_type text NOT NULL CHECK (property_type IN ('apartment', 'villa', 'office', 'retail', 'warehouse')),
  status text NOT NULL CHECK (status IN ('available', 'rented', 'maintenance', 'reserved')),
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  neighborhood text,
  area_sqm numeric NOT NULL,
  bedrooms integer,
  bathrooms integer,
  price numeric NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'installment')),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  images text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Maintenance requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  images text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Work orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_request_id uuid REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id),
  description text NOT NULL,
  estimated_cost numeric NOT NULL,
  actual_cost numeric,
  start_date timestamptz NOT NULL,
  completion_date timestamptz,
  status text NOT NULL CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES profiles(id),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  rent_amount numeric NOT NULL,
  payment_frequency text NOT NULL CHECK (payment_frequency IN ('monthly', 'quarterly', 'biannually', 'annually')),
  security_deposit numeric NOT NULL,
  is_foreign_tenant boolean DEFAULT false,
  status text NOT NULL CHECK (status IN ('active', 'expired', 'terminated', 'renewal')),
  documents text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_type text NOT NULL CHECK (voucher_type IN ('receipt', 'payment', 'journal')),
  voucher_number text UNIQUE NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL CHECK (status IN ('draft', 'posted', 'cancelled')),
  description text,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES profiles(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number text UNIQUE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES profiles(id),
  amount numeric NOT NULL,
  vat_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL,
  issue_date timestamptz NOT NULL,
  due_date timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Properties Policies
CREATE POLICY "Properties are viewable by everyone"
  ON properties FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND role IN ('admin', 'owner'));

CREATE POLICY "Owners can update own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = owner_id AND role IN ('admin', 'owner'));

-- Maintenance Requests Policies
CREATE POLICY "Maintenance requests viewable by involved parties"
  ON maintenance_requests FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'manager', 'staff')
    ) OR
    auth.uid() = tenant_id OR
    auth.uid() IN (
      SELECT owner_id FROM properties WHERE id = property_id
    )
  );

CREATE POLICY "Tenants can create maintenance requests"
  ON maintenance_requests FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

-- Work Orders Policies
CREATE POLICY "Work orders viewable by staff"
  ON work_orders FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'manager', 'staff')
    ) OR
    auth.uid() = assigned_to
  );

-- Contracts Policies
CREATE POLICY "Contracts viewable by involved parties"
  ON contracts FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'manager')
    ) OR
    auth.uid() = tenant_id OR
    auth.uid() IN (
      SELECT owner_id FROM properties WHERE id = property_id
    )
  );

-- Vouchers Policies
CREATE POLICY "Vouchers viewable by involved parties"
  ON vouchers FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'manager')
    ) OR
    auth.uid() = tenant_id OR
    auth.uid() IN (
      SELECT owner_id FROM properties WHERE id = property_id
    )
  );

-- Invoices Policies
CREATE POLICY "Invoices viewable by involved parties"
  ON invoices FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'manager')
    ) OR
    auth.uid() = tenant_id OR
    auth.uid() IN (
      SELECT owner_id FROM properties WHERE id = property_id
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_property ON maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_property ON contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_property ON vouchers(property_id);
CREATE INDEX IF NOT EXISTS idx_invoices_property ON invoices(property_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at
    BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vouchers_updated_at
    BEFORE UPDATE ON vouchers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();