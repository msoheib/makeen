/*
  # Property Management System Database Schema

  1. New Tables
    - profiles: User profiles with role-based access
    - properties: Property listings with details and status
    - maintenance_requests: Maintenance tickets with status tracking
    - work_orders: Work orders linked to maintenance requests
    - contracts: Rental/lease agreements
    - vouchers: Financial transactions and payments
    - invoices: Billing records

  2. Security
    - RLS enabled on all tables
    - Role-based access policies
    - Secure data access patterns

  3. Relationships
    - Properties linked to owners (profiles)
    - Maintenance requests linked to properties and tenants
    - Contracts linked to properties and tenants
    - Financial records linked to properties and users

  4. Features
    - Automatic timestamps for created_at and updated_at
    - Data validation using CHECK constraints
    - Optimized indexes for common queries
    - Cascading deletes for related records
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text,
  last_name text,
  email text UNIQUE,
  role text DEFAULT 'tenant',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  property_type text NOT NULL,
  status text DEFAULT 'available',
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  neighborhood text,
  area_sqm numeric NOT NULL,
  bedrooms integer,
  bathrooms integer,
  price numeric NOT NULL,
  payment_method text DEFAULT 'cash',
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  images text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_property_type CHECK (property_type IN ('apartment', 'villa', 'office', 'retail', 'warehouse')),
  CONSTRAINT valid_status CHECK (status IN ('available', 'rented', 'maintenance', 'reserved')),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'installment'))
);

-- Maintenance requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  images text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- Work orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_request_id uuid REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id),
  description text NOT NULL,
  estimated_cost numeric NOT NULL,
  actual_cost numeric,
  start_date timestamptz NOT NULL,
  completion_date timestamptz,
  status text DEFAULT 'assigned',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled'))
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES profiles(id),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  rent_amount numeric NOT NULL,
  payment_frequency text DEFAULT 'monthly',
  security_deposit numeric NOT NULL,
  is_foreign_tenant boolean DEFAULT false,
  status text DEFAULT 'active',
  documents text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payment_frequency CHECK (payment_frequency IN ('monthly', 'quarterly', 'biannually', 'annually')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'terminated', 'renewal')),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_type text NOT NULL,
  voucher_number text UNIQUE NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'draft',
  description text,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES profiles(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_voucher_type CHECK (voucher_type IN ('receipt', 'payment', 'journal')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'posted', 'cancelled'))
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES profiles(id),
  amount numeric NOT NULL,
  vat_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  issue_date timestamptz NOT NULL,
  due_date timestamptz NOT NULL,
  status text DEFAULT 'draft',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  CONSTRAINT valid_dates CHECK (due_date > issue_date)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Properties policies
CREATE POLICY "Anyone can view available properties"
  ON properties FOR SELECT
  TO authenticated
  USING (status = 'available' OR owner_id = auth.uid());

CREATE POLICY "Owners can manage their properties"
  ON properties FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Maintenance requests policies
CREATE POLICY "Tenants can view their maintenance requests"
  ON maintenance_requests FOR SELECT
  TO authenticated
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can create maintenance requests"
  ON maintenance_requests FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = auth.uid());

-- Work orders policies
CREATE POLICY "Staff can view assigned work orders"
  ON work_orders FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Contracts policies
CREATE POLICY "Users can view their contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (tenant_id = auth.uid() OR EXISTS (
    SELECT 1 FROM properties WHERE id = property_id AND owner_id = auth.uid()
  ));

-- Vouchers policies
CREATE POLICY "Users can view their vouchers"
  ON vouchers FOR SELECT
  TO authenticated
  USING (tenant_id = auth.uid() OR created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM properties WHERE id = property_id AND owner_id = auth.uid()
  ));

-- Invoices policies
CREATE POLICY "Users can view their invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (tenant_id = auth.uid() OR EXISTS (
    SELECT 1 FROM properties WHERE id = property_id AND owner_id = auth.uid()
  ));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for all tables
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_properties_updated
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_maintenance_requests_updated
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_work_orders_updated
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_contracts_updated
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_vouchers_updated
  BEFORE UPDATE ON vouchers
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_invoices_updated
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property ON maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_maintenance_request ON work_orders(maintenance_request_id);
CREATE INDEX IF NOT EXISTS idx_contracts_property ON contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_property ON vouchers(property_id);
CREATE INDEX IF NOT EXISTS idx_invoices_property ON invoices(property_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);