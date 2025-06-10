export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          title?: string
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
          subject?: string
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
          title?: string
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
      profiles: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          id_number: string | null
          is_foreign: boolean | null
          last_name: string | null
          nationality: string | null
          phone: string | null
          profile_type: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          id_number?: string | null
          is_foreign?: boolean | null
          last_name?: string | null
          nationality?: string | null
          phone?: string | null
          profile_type?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          id_number?: string | null
          is_foreign?: boolean | null
          last_name?: string | null
          nationality?: string | null
          phone?: string | null
          profile_type?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          annual_rent: number | null
          area_sqm: number
          bathrooms: number | null
          bedrooms: number | null
          building_name: string | null
          city: string
          country: string
          created_at: string | null
          description: string | null
          floor_number: number | null
          id: string
          images: string[] | null
          is_furnished: boolean | null
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
          updated_at: string | null
        }
        Insert: {
          address: string
          amenities?: string[] | null
          annual_rent?: number | null
          area_sqm: number
          bathrooms?: number | null
          bedrooms?: number | null
          building_name?: string | null
          city: string
          country: string
          created_at?: string | null
          description?: string | null
          floor_number?: number | null
          id?: string
          images?: string[] | null
          is_furnished?: boolean | null
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
          updated_at?: string | null
        }
        Update: {
          address?: string
          amenities?: string[] | null
          annual_rent?: number | null
          area_sqm?: number
          bathrooms?: number | null
          bedrooms?: number | null
          building_name?: string | null
          city?: string
          country?: string
          created_at?: string | null
          description?: string | null
          floor_number?: number | null
          id?: string
          images?: string[] | null
          is_furnished?: boolean | null
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
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Export commonly used types
export type Property = Tables<'properties'>
export type Profile = Tables<'profiles'>
export type Contract = Tables<'contracts'>
export type MaintenanceRequest = Tables<'maintenance_requests'>
export type WorkOrder = Tables<'work_orders'>
export type Voucher = Tables<'vouchers'>
export type Invoice = Tables<'invoices'>
export type Client = Tables<'clients'>
export type PropertyReservation = Tables<'property_reservations'>
export type Document = Tables<'documents'>
export type Issue = Tables<'issues'>
export type Letter = Tables<'letters'>
export type Account = Tables<'accounts'>
export type CostCenter = Tables<'cost_centers'>
export type FixedAsset = Tables<'fixed_assets'> 