-- Enable Row Level Security (RLS) for tenant data isolation
-- This migration addresses the security issue where tenants could see company data

-- Enable RLS on all tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_reservations ENABLE ROW LEVEL SECURITY;

-- Properties: Only admins, managers, and owners can see properties
-- Tenants should NOT see any properties (they only see their rented ones via contracts)
CREATE POLICY "managers_see_properties" ON public.properties
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

-- Profiles: Users can see their own profile, managers see all
CREATE POLICY "users_see_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
    )
  );

-- Contracts: Tenants see only their own contracts
CREATE POLICY "tenants_see_own_contracts" ON public.contracts
  FOR SELECT TO authenticated
  USING (
    tenant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

-- Vouchers: Tenants see only their own vouchers
CREATE POLICY "tenants_see_own_vouchers" ON public.vouchers
  FOR SELECT TO authenticated
  USING (
    tenant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner', 'accountant')
    )
  );

-- Invoices: Tenants see only their own invoices
CREATE POLICY "tenants_see_own_invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    tenant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner', 'accountant')
    )
  );

-- Maintenance requests: Tenants see only their own requests
CREATE POLICY "tenants_see_own_maintenance" ON public.maintenance_requests
  FOR SELECT TO authenticated
  USING (
    tenant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

-- Work orders: Only managers and admins can see work orders
CREATE POLICY "managers_see_work_orders" ON public.work_orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
    )
  );

-- Letters: Users see letters sent to them or sent by them
CREATE POLICY "users_see_relevant_letters" ON public.letters
  FOR SELECT TO authenticated
  USING (
    recipient_id = auth.uid() OR
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
    )
  );

-- Issues: Tenants see only issues they reported
CREATE POLICY "users_see_relevant_issues" ON public.issues
  FOR SELECT TO authenticated
  USING (
    reported_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

-- Documents: Users see documents they uploaded or are related to their entities
CREATE POLICY "users_see_relevant_documents" ON public.documents
  FOR SELECT TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    (related_entity_type = 'tenant' AND related_entity_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

-- Accounts: Only accountants and managers can see accounts
CREATE POLICY "accountants_see_accounts" ON public.accounts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'accountant')
    )
  );

-- Cost centers: Only accountants and managers can see cost centers
CREATE POLICY "accountants_see_cost_centers" ON public.cost_centers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'accountant')
    )
  );

-- Fixed assets: Only managers and owners can see fixed assets
CREATE POLICY "managers_see_fixed_assets" ON public.fixed_assets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

-- Clients: Only managers can see clients
CREATE POLICY "managers_see_clients" ON public.clients
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
    )
  );

-- Property reservations: Only managers can see reservations
CREATE POLICY "managers_see_reservations" ON public.property_reservations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
    )
  );

-- Insert policies for INSERT, UPDATE, DELETE operations
-- Properties: Only managers and owners can modify
CREATE POLICY "managers_modify_properties" ON public.properties
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

-- Profiles: Users can update their own profile, managers can update all
CREATE POLICY "users_modify_own_profile" ON public.profiles
  FOR ALL TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
    )
  );

-- Contracts: Managers can modify all contracts
CREATE POLICY "managers_modify_contracts" ON public.contracts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

-- Vouchers: Accountants and managers can modify vouchers
CREATE POLICY "accountants_modify_vouchers" ON public.vouchers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'accountant')
    )
  );

-- Invoices: Accountants and managers can modify invoices
CREATE POLICY "accountants_modify_invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'accountant')
    )
  );

-- Maintenance requests: Tenants can create their own, managers can modify all
CREATE POLICY "tenants_create_maintenance" ON public.maintenance_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

CREATE POLICY "managers_modify_maintenance" ON public.maintenance_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

-- Work orders: Only managers can modify work orders
CREATE POLICY "managers_modify_work_orders" ON public.work_orders
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
    )
  );

-- Letters: Users can create letters, managers can modify all
CREATE POLICY "users_create_letters" ON public.letters
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "managers_modify_letters" ON public.letters
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
    )
  );

-- Issues: Users can create issues, managers can modify all
CREATE POLICY "users_create_issues" ON public.issues
  FOR INSERT TO authenticated
  WITH CHECK (
    reported_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

CREATE POLICY "managers_modify_issues" ON public.issues
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

-- Documents: Users can upload documents, managers can modify all
CREATE POLICY "users_upload_documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

CREATE POLICY "managers_modify_documents" ON public.documents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

-- Accounts: Only accountants can modify accounts
CREATE POLICY "accountants_modify_accounts" ON public.accounts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'accountant')
    )
  );

-- Cost centers: Only accountants can modify cost centers
CREATE POLICY "accountants_modify_cost_centers" ON public.cost_centers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'accountant')
    )
  );

-- Fixed assets: Only managers can modify fixed assets
CREATE POLICY "managers_modify_fixed_assets" ON public.fixed_assets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager', 'owner')
    )
  );

-- Clients: Only managers can modify clients
CREATE POLICY "managers_modify_clients" ON public.clients
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
    )
  );

-- Property reservations: Only managers can modify reservations
CREATE POLICY "managers_modify_reservations" ON public.property_reservations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
    )
  );





