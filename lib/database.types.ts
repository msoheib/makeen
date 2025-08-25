export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          parent_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          bid_amount: number
          bid_status: string | null
          bid_type: string
          bidder_id: string
          created_at: string | null
          expires_at: string
          id: string
          manager_approval_date: string | null
          manager_approved: boolean | null
          manager_id: string | null
          manager_notes: string | null
          message: string | null
          owner_approval_date: string | null
          owner_approved: boolean | null
          owner_response_message: string | null
          property_id: string
          rental_duration_months: number | null
          security_deposit_amount: number | null
          updated_at: string | null
          utilities_included: boolean | null
        }
        Insert: {
          bid_amount: number
          bid_status?: string | null
          bid_type: string
          bidder_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          manager_approval_date?: string | null
          manager_approved?: boolean | null
          manager_id?: string | null
          manager_notes?: string | null
          message?: string | null
          owner_approval_date?: string | null
          owner_approved?: boolean | null
          owner_response_message?: string | null
          property_id: string
          rental_duration_months?: number | null
          security_deposit_amount?: number | null
          updated_at?: string | null
          utilities_included?: boolean | null
        }
        Update: {
          bid_amount?: number
          bid_status?: string | null
          bid_type?: string
          bidder_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          manager_approval_date?: string | null
          manager_approved?: boolean | null
          manager_id?: string | null
          manager_notes?: string | null
          message?: string | null
          owner_approval_date?: string | null
          owner_approved?: boolean | null
          owner_response_message?: string | null
          property_id?: string
          rental_duration_months?: number | null
          security_deposit_amount?: number | null
          updated_at?: string | null
          utilities_included?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          account_id: string | null
          budget_type: string
          budget_year: number
          budgeted_amount: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          property_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          budget_type: string
          budget_year: number
          budgeted_amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          property_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          budget_type?: string
          budget_year?: number
          budgeted_amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          property_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          client_type: string
          company_name: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
          status: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_type: string
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          client_type?: string
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          auto_renewal: boolean | null
          contract_number: string | null
          contract_type: string | null
          created_at: string | null
          documents: string[] | null
          end_date: string
          id: string
          is_foreign_tenant: boolean | null
          late_fee_percentage: number | null
          notice_period_days: number | null
          payment_frequency: string | null
          property_id: string | null
          rent_amount: number
          security_deposit: number
          start_date: string
          status: string | null
          tenant_id: string | null
          updated_at: string | null
          utilities_included: boolean | null
        }
        Insert: {
          auto_renewal?: boolean | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string | null
          documents?: string[] | null
          end_date: string
          id?: string
          is_foreign_tenant?: boolean | null
          late_fee_percentage?: number | null
          notice_period_days?: number | null
          payment_frequency?: string | null
          property_id?: string | null
          rent_amount: number
          security_deposit: number
          start_date: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          utilities_included?: boolean | null
        }
        Update: {
          auto_renewal?: boolean | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string | null
          documents?: string[] | null
          end_date?: string
          id?: string
          is_foreign_tenant?: boolean | null
          late_fee_percentage?: number | null
          notice_period_days?: number | null
          payment_frequency?: string | null
          property_id?: string | null
          rent_amount?: number
          security_deposit?: number
          start_date?: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          utilities_included?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string | null
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_assets: {
        Row: {
          asset_name: string
          asset_type: string
          created_at: string | null
          current_value: number | null
          depreciation_method: string | null
          id: string
          property_id: string | null
          purchase_date: string
          purchase_price: number
          salvage_value: number | null
          status: string | null
          updated_at: string | null
          useful_life_years: number
        }
        Insert: {
          asset_name: string
          asset_type: string
          created_at?: string | null
          current_value?: number | null
          depreciation_method?: string | null
          id?: string
          property_id?: string | null
          purchase_date: string
          purchase_price: number
          salvage_value?: number | null
          status?: string | null
          updated_at?: string | null
          useful_life_years: number
        }
        Update: {
          asset_name?: string
          asset_type?: string
          created_at?: string | null
          current_value?: number | null
          depreciation_method?: string | null
          id?: string
          property_id?: string | null
          purchase_date?: string
          purchase_price?: number
          salvage_value?: number | null
          status?: string | null
          updated_at?: string | null
          useful_life_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixed_assets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          discount_amount: number | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          payment_terms: string | null
          property_id: string | null
          reference_number: string | null
          status: string | null
          tax_rate: number | null
          tenant_id: string | null
          total_amount: number
          updated_at: string | null
          vat_amount: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date: string
          payment_terms?: string | null
          property_id?: string | null
          reference_number?: string | null
          status?: string | null
          tax_rate?: number | null
          tenant_id?: string | null
          total_amount: number
          updated_at?: string | null
          vat_amount?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          payment_terms?: string | null
          property_id?: string | null
          reference_number?: string | null
          status?: string | null
          tax_rate?: number | null
          tenant_id?: string | null
          total_amount?: number
          updated_at?: string | null
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          created_at: string | null
          description: string
          id: string
          issue_type: string | null
          priority: string | null
          property_id: string | null
          reported_by: string | null
          resolution: string | null
          resolved_date: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          issue_type?: string | null
          priority?: string | null
          property_id?: string | null
          reported_by?: string | null
          resolution?: string | null
          resolved_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          issue_type?: string | null
          priority?: string | null
          property_id?: string | null
          reported_by?: string | null
          resolution?: string | null
          resolved_date?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      letters: {
        Row: {
          content: string
          created_at: string | null
          id: string
          letter_type: string | null
          recipient_id: string | null
          recipient_type: string
          sender_id: string | null
          sent_date: string | null
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          letter_type?: string | null
          recipient_id?: string | null
          recipient_type: string
          sender_id?: string | null
          sent_date?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          letter_type?: string | null
          recipient_id?: string | null
          recipient_type?: string
          sender_id?: string | null
          sent_date?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "letters_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          created_at: string | null
          description: string
          id: string
          images: string[] | null
          priority: string | null
          property_id: string | null
          status: string | null
          tenant_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          images?: string[] | null
          priority?: string | null
          property_id?: string | null
          status?: string | null
          tenant_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          images?: string[] | null
          priority?: string | null
          property_id?: string | null
          status?: string | null
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          priority: string | null
          recipient_id: string
          related_entity_id: string | null
          related_entity_type: string | null
          sender_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          priority?: string | null
          recipient_id: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          priority?: string | null
          recipient_id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          approval_date: string | null
          approval_status: string | null
          approved_by: string | null
          can_bid: boolean | null
          city: string | null
          country: string | null
          created_at: string | null
          credit_score: number | null
          email: string | null
          first_name: string | null
          id: string
          id_number: string | null
          is_foreign: boolean | null
          kyc_status: string | null
          last_name: string | null
          nationality: string | null
          phone: string | null
          profile_picture_url: string | null
          profile_type: string | null
          rejection_reason: string | null
          role: string | null
          status: string | null
          updated_at: string | null
          verification_documents: string[] | null
        }
        Insert: {
          address?: string | null
          approval_date?: string | null
          approval_status?: string | null
          approved_by?: string | null
          can_bid?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          credit_score?: number | null
          email?: string | null
          first_name?: string | null
          id?: string
          id_number?: string | null
          is_foreign?: boolean | null
          kyc_status?: string | null
          last_name?: string | null
          nationality?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          profile_type?: string | null
          rejection_reason?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          verification_documents?: string[] | null
        }
        Update: {
          address?: string | null
          approval_date?: string | null
          approval_status?: string | null
          approved_by?: string | null
          can_bid?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          credit_score?: number | null
          email?: string | null
          first_name?: string | null
          id?: string
          id_number?: string | null
          is_foreign?: boolean | null
          kyc_status?: string | null
          last_name?: string | null
          nationality?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          profile_type?: string | null
          rejection_reason?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          verification_documents?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          annual_rent: number | null
          approval_date: string | null
          approval_status: string | null
          approved_by: string | null
          area_sqm: number
          attachments: string[]
          auto_accept_threshold: number | null
          bathrooms: number | null
          bedrooms: number | null
          bid_increment: number | null
          building_name: string | null
          city: string
          country: string
          created_at: string | null
          description: string | null
          floor_number: number | null
          group_id: string | null
          id: string
          images: string[] | null
          is_accepting_bids: boolean | null
          is_furnished: boolean | null
          listing_expires_at: string | null
          listing_type: string | null
          maximum_bid_amount: number | null
          minimum_bid_amount: number | null
          neighborhood: string | null
          owner_id: string | null
          parking_spaces: number | null
          payment_method: string | null
          price: number
          property_code: string | null
          property_type: string
          service_charge: number | null
          status: string | null
          title: string
          unit_label: string | null
          unit_number: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          amenities?: string[] | null
          annual_rent?: number | null
          approval_date?: string | null
          approval_status?: string | null
          approved_by?: string | null
          area_sqm: number
          attachments?: string[]
          auto_accept_threshold?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          bid_increment?: number | null
          building_name?: string | null
          city: string
          country: string
          created_at?: string | null
          description?: string | null
          floor_number?: number | null
          group_id?: string | null
          id?: string
          images?: string[] | null
          is_accepting_bids?: boolean | null
          is_furnished?: boolean | null
          listing_expires_at?: string | null
          listing_type?: string | null
          maximum_bid_amount?: number | null
          minimum_bid_amount?: number | null
          neighborhood?: string | null
          owner_id?: string | null
          parking_spaces?: number | null
          payment_method?: string | null
          price: number
          property_code?: string | null
          property_type: string
          service_charge?: number | null
          status?: string | null
          title: string
          unit_label?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          amenities?: string[] | null
          annual_rent?: number | null
          approval_date?: string | null
          approval_status?: string | null
          approved_by?: string | null
          area_sqm?: number
          attachments?: string[]
          auto_accept_threshold?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          bid_increment?: number | null
          building_name?: string | null
          city?: string
          country?: string
          created_at?: string | null
          description?: string | null
          floor_number?: number | null
          group_id?: string | null
          id?: string
          images?: string[] | null
          is_accepting_bids?: boolean | null
          is_furnished?: boolean | null
          listing_expires_at?: string | null
          listing_type?: string | null
          maximum_bid_amount?: number | null
          minimum_bid_amount?: number | null
          neighborhood?: string | null
          owner_id?: string | null
          parking_spaces?: number | null
          payment_method?: string | null
          price?: number
          property_code?: string | null
          property_type?: string
          service_charge?: number | null
          status?: string | null
          title?: string
          unit_label?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "property_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_groups: {
        Row: {
          address: string | null
          amenities: string[] | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          elevators_count: number | null
          floors_count: number | null
          group_type: string
          id: string
          images: string[] | null
          name: string
          neighborhood: string | null
          owner_id: string | null
          parking_capacity: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          elevators_count?: number | null
          floors_count?: number | null
          group_type: string
          id?: string
          images?: string[] | null
          name: string
          neighborhood?: string | null
          owner_id?: string | null
          parking_capacity?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          elevators_count?: number | null
          floors_count?: number | null
          group_type?: string
          id?: string
          images?: string[] | null
          name?: string
          neighborhood?: string | null
          owner_id?: string | null
          parking_capacity?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_metrics: {
        Row: {
          created_at: string | null
          gross_rental_income: number | null
          id: string
          maintenance_cost_ratio: number | null
          metric_date: string
          net_operating_income: number | null
          occupancy_rate: number | null
          property_id: string | null
          rental_yield: number | null
          total_expenses: number | null
          updated_at: string | null
          vacancy_days: number | null
        }
        Insert: {
          created_at?: string | null
          gross_rental_income?: number | null
          id?: string
          maintenance_cost_ratio?: number | null
          metric_date: string
          net_operating_income?: number | null
          occupancy_rate?: number | null
          property_id?: string | null
          rental_yield?: number | null
          total_expenses?: number | null
          updated_at?: string | null
          vacancy_days?: number | null
        }
        Update: {
          created_at?: string | null
          gross_rental_income?: number | null
          id?: string
          maintenance_cost_ratio?: number | null
          metric_date?: string
          net_operating_income?: number | null
          occupancy_rate?: number | null
          property_id?: string | null
          rental_yield?: number | null
          total_expenses?: number | null
          updated_at?: string | null
          vacancy_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_metrics_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_reservations: {
        Row: {
          client_id: string | null
          created_at: string | null
          deposit_amount: number
          expiry_date: string
          id: string
          notes: string | null
          property_id: string | null
          reservation_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          deposit_amount: number
          expiry_date: string
          id?: string
          notes?: string | null
          property_id?: string | null
          reservation_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          deposit_amount?: number
          expiry_date?: string
          id?: string
          notes?: string | null
          property_id?: string | null
          reservation_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_reservations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_transactions: {
        Row: {
          bid_id: string | null
          buyer_id: string | null
          commission_amount: number | null
          commission_recipient_id: string | null
          completion_date: string | null
          contract_id: string | null
          created_at: string | null
          documents: string[] | null
          id: string
          notes: string | null
          previous_owner_id: string | null
          property_id: string
          tenant_id: string | null
          transaction_amount: number
          transaction_date: string
          transaction_status: string | null
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          bid_id?: string | null
          buyer_id?: string | null
          commission_amount?: number | null
          commission_recipient_id?: string | null
          completion_date?: string | null
          contract_id?: string | null
          created_at?: string | null
          documents?: string[] | null
          id?: string
          notes?: string | null
          previous_owner_id?: string | null
          property_id: string
          tenant_id?: string | null
          transaction_amount: number
          transaction_date?: string
          transaction_status?: string | null
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          bid_id?: string | null
          buyer_id?: string | null
          commission_amount?: number | null
          commission_recipient_id?: string | null
          completion_date?: string | null
          contract_id?: string | null
          created_at?: string | null
          documents?: string[] | null
          id?: string
          notes?: string | null
          previous_owner_id?: string | null
          property_id?: string
          tenant_id?: string | null
          transaction_amount?: number
          transaction_date?: string
          transaction_status?: string | null
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_transactions_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_transactions_commission_recipient_id_fkey"
            columns: ["commission_recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_transactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_transactions_previous_owner_id_fkey"
            columns: ["previous_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_valuations: {
        Row: {
          appraiser_name: string | null
          appraiser_notes: string | null
          created_at: string | null
          id: string
          market_value: number
          property_id: string | null
          rental_value: number | null
          updated_at: string | null
          valuation_date: string
          valuation_method: string | null
        }
        Insert: {
          appraiser_name?: string | null
          appraiser_notes?: string | null
          created_at?: string | null
          id?: string
          market_value: number
          property_id?: string | null
          rental_value?: number | null
          updated_at?: string | null
          valuation_date: string
          valuation_method?: string | null
        }
        Update: {
          appraiser_name?: string | null
          appraiser_notes?: string | null
          created_at?: string | null
          id?: string
          market_value?: number
          property_id?: string | null
          rental_value?: number | null
          updated_at?: string | null
          valuation_date?: string
          valuation_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_valuations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_payment_schedules: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string | null
          due_date: string
          id: string
          late_fees: number | null
          notes: string | null
          paid_amount: number | null
          payment_date: string | null
          payment_status: string | null
          updated_at: string | null
          voucher_id: string | null
        }
        Insert: {
          amount: number
          contract_id?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          late_fees?: number | null
          notes?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_status?: string | null
          updated_at?: string | null
          voucher_id?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          late_fees?: number | null
          notes?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_status?: string | null
          updated_at?: string | null
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_payment_schedules_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_payment_schedules_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      report_definitions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_public: boolean | null
          last_generated_at: string | null
          report_config: Json
          report_name: string
          report_type: string
          schedule_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_public?: boolean | null
          last_generated_at?: string | null
          report_config: Json
          report_name: string
          report_type: string
          schedule_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_public?: boolean | null
          last_generated_at?: string | null
          report_config?: Json
          report_name?: string
          report_type?: string
          schedule_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_approvals: {
        Row: {
          approval_date: string | null
          approval_notes: string | null
          approval_status: string | null
          approval_type: string
          approved_by: string | null
          auto_approve_after: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          priority_level: string | null
          rejection_reason: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          requested_by: string
          updated_at: string | null
        }
        Insert: {
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approval_type: string
          approved_by?: string | null
          auto_approve_after?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          priority_level?: string | null
          rejection_reason?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          requested_by: string
          updated_at?: string | null
        }
        Update: {
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approval_type?: string
          approved_by?: string | null
          auto_approve_after?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          priority_level?: string | null
          rejection_reason?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          requested_by?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_approvals_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_payments: {
        Row: {
          amount: number | null
          consumption: number | null
          created_at: string | null
          current_reading: number
          due_date: string | null
          id: string
          meter_number: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          previous_reading: number | null
          property_id: string | null
          rate_per_unit: number
          reading_date: string
          updated_at: string | null
          uploaded_by: string | null
          utility_type: string
          voucher_id: string | null
        }
        Insert: {
          amount?: number | null
          consumption?: number | null
          created_at?: string | null
          current_reading: number
          due_date?: string | null
          id?: string
          meter_number?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          previous_reading?: number | null
          property_id?: string | null
          rate_per_unit?: number
          reading_date: string
          updated_at?: string | null
          uploaded_by?: string | null
          utility_type: string
          voucher_id?: string | null
        }
        Update: {
          amount?: number | null
          consumption?: number | null
          created_at?: string | null
          current_reading?: number
          due_date?: string | null
          id?: string
          meter_number?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          previous_reading?: number | null
          property_id?: string | null
          rate_per_unit?: number
          reading_date?: string
          updated_at?: string | null
          uploaded_by?: string | null
          utility_type?: string
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "utility_payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_payments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_payments_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          account_id: string | null
          amount: number
          bank_reference: string | null
          cheque_number: string | null
          cost_center_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          id: string
          payment_method: string | null
          property_id: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
          voucher_number: string
          voucher_type: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          bank_reference?: string | null
          cheque_number?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          property_id?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          voucher_number: string
          voucher_type: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          bank_reference?: string | null
          cheque_number?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          property_id?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          voucher_number?: string
          voucher_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          completion_date: string | null
          created_at: string | null
          description: string
          estimated_cost: number
          id: string
          maintenance_request_id: string | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          completion_date?: string | null
          created_at?: string | null
          description: string
          estimated_cost: number
          id?: string
          maintenance_request_id?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string
          estimated_cost?: number
          id?: string
          maintenance_request_id?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_maintenance_request_id_fkey"
            columns: ["maintenance_request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_delivery_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_meal_by_delivery_code: {
        Args: { p_delivery_code: string }
        Returns: Json
      }
      verify_delivery_code: {
        Args: {
          p_delivery_code: string
          p_new_status: string
          p_notes?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const




