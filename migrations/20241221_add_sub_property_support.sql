-- Migration: Add Sub-Property Support
-- Date: 2024-12-21
-- Description: Adds support for sub-properties (e.g., apartments under buildings) with required fields

-- 1. Add sub-property fields to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS is_sub_property boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_property_id uuid REFERENCES public.properties(id),
ADD COLUMN IF NOT EXISTS contract_number text,
ADD COLUMN IF NOT EXISTS payment_frequency text CHECK (payment_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
ADD COLUMN IF NOT EXISTS contract_duration_years integer CHECK (contract_duration_years >= 1 AND contract_duration_years <= 5),
ADD COLUMN IF NOT EXISTS base_price numeric,
ADD COLUMN IF NOT EXISTS contract_pdf_url text;

-- 2. Create property_meters table for meter numbers
CREATE TABLE IF NOT EXISTS public.property_meters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  meter_number text NOT NULL,
  meter_type text NOT NULL DEFAULT 'utility' CHECK (meter_type IN ('electricity', 'water', 'gas', 'internet', 'utility')),
  current_reading numeric DEFAULT 0,
  last_reading_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT property_meters_pkey PRIMARY KEY (id),
  CONSTRAINT property_meters_property_meter_unique UNIQUE (property_id, meter_number)
);

-- 3. Create property_contacts table for tenant contact numbers
CREATE TABLE IF NOT EXISTS public.property_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  contact_type text NOT NULL DEFAULT 'tenant' CHECK (contact_type IN ('tenant', 'owner', 'manager', 'maintenance')),
  phone_number text NOT NULL,
  is_primary boolean DEFAULT false,
  label text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT property_contacts_pkey PRIMARY KEY (id)
);

-- 4. Enhance contracts table with sub-property specific fields
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS contract_duration_years integer CHECK (contract_duration_years >= 1 AND contract_duration_years <= 5),
ADD COLUMN IF NOT EXISTS base_price numeric,
ADD COLUMN IF NOT EXISTS payment_frequency text CHECK (payment_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual'));

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_sub_property ON public.properties(is_sub_property);
CREATE INDEX IF NOT EXISTS idx_properties_parent_property ON public.properties(parent_property_id);
CREATE INDEX IF NOT EXISTS idx_property_meters_property ON public.property_meters(property_id);
CREATE INDEX IF NOT EXISTS idx_property_contacts_property ON public.property_contacts(property_id);

-- 6. Add RLS policies for new tables
ALTER TABLE public.property_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_contacts ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for property_meters
CREATE POLICY "Users can view property meters for properties they own or manage" ON public.property_meters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_meters.property_id
      AND (
        p.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles pr
          WHERE pr.id = auth.uid() AND pr.role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can insert property meters for properties they own or manage" ON public.property_meters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_meters.property_id
      AND (
        p.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles pr
          WHERE pr.id = auth.uid() AND pr.role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can update property meters for properties they own or manage" ON public.property_meters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_meters.property_id
      AND (
        p.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles pr
          WHERE pr.id = auth.uid() AND pr.role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can delete property meters for properties they own or manage" ON public.property_meters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_meters.property_id
      AND (
        p.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles pr
          WHERE pr.id = auth.uid() AND pr.role IN ('admin', 'manager')
        )
      )
    )
  );

-- 8. Create RLS policies for property_contacts
CREATE POLICY "Users can view property contacts for properties they own or manage" ON public.property_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_contacts.property_id
      AND (
        p.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles pr
          WHERE pr.id = auth.uid() AND pr.role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can insert property contacts for properties they own or manage" ON public.property_contacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_contacts.property_id
      AND (
        p.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles pr
          WHERE pr.id = auth.uid() AND pr.role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can update property contacts for properties they own or manage" ON public.property_contacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_contacts.property_id
      AND (
        p.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles pr
          WHERE pr.id = auth.uid() AND pr.role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can delete property contacts for properties they own or manage" ON public.property_contacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_contacts.property_id
      AND (
        p.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles pr
          WHERE pr.id = auth.uid() AND pr.role IN ('admin', 'manager')
        )
      )
    )
  );

-- 9. Add comments for documentation
COMMENT ON TABLE public.property_meters IS 'Stores meter information for properties (electricity, water, gas, etc.)';
COMMENT ON TABLE public.property_contacts IS 'Stores contact information for properties (tenant, owner, manager contacts)';
COMMENT ON COLUMN public.properties.is_sub_property IS 'Indicates if this property is a sub-property (e.g., apartment under building)';
COMMENT ON COLUMN public.properties.parent_property_id IS 'Reference to parent property for sub-properties';
COMMENT ON COLUMN public.properties.contract_number IS 'Contract number for sub-properties';
COMMENT ON COLUMN public.properties.payment_frequency IS 'Payment frequency for sub-properties';
COMMENT ON COLUMN public.properties.contract_duration_years IS 'Contract duration in years (1-5 years)';
COMMENT ON COLUMN public.properties.base_price IS 'Base price (total contract value) for sub-properties';
COMMENT ON COLUMN public.properties.contract_pdf_url IS 'URL to contract PDF document';
COMMENT ON COLUMN public.contracts.contract_duration_years IS 'Contract duration in years (1-5 years)';
COMMENT ON COLUMN public.contracts.base_price IS 'Base price (total contract value)';
COMMENT ON COLUMN public.contracts.payment_frequency IS 'Payment frequency for the contract';




