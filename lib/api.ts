import { supabase } from './supabase';
import { Database, Tables, TablesInsert, TablesUpdate } from './database.types';

// Type helpers
type DatabaseError = {
  message: string;
  details?: string;
  hint?: string;
};

type ApiResponse<T> = {
  data: T | null;
  error: DatabaseError | null;
  count?: number;
};

// Generic functions
async function handleApiCall<T>(
  operation: () => Promise<{ data: T | null; error: any; count?: number }>
): Promise<ApiResponse<T>> {
  try {
    const result = await operation();
    return {
      data: result.data,
      error: result.error ? { message: result.error.message, details: result.error.details, hint: result.error.hint } : null,
      count: result.count
    };
  } catch (error: any) {
    return {
      data: null,
      error: { message: error.message }
    };
  }
}

// Properties API
export const propertiesApi = {
  // Get all properties with optional filters
  async getAll(filters?: {
    owner_id?: string;
    status?: string;
    property_type?: string;
    city?: string;
  }): Promise<ApiResponse<Tables<'properties'>[]>> {
    let query = supabase
      .from('properties')
      .select(`
        *,
        owner:profiles!properties_owner_id_fkey(id, first_name, last_name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (filters?.owner_id) query = query.eq('owner_id', filters.owner_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.property_type) query = query.eq('property_type', filters.property_type);
    if (filters?.city) query = query.ilike('city', `%${filters.city}%`);

    return handleApiCall(() => query);
  },

  // Get property by ID
  async getById(id: string): Promise<ApiResponse<Tables<'properties'>>> {
    return handleApiCall(() => 
      supabase
        .from('properties')
        .select(`
          *,
          owner:profiles!properties_owner_id_fkey(id, first_name, last_name, email, phone),
          contracts(*, tenant:profiles!contracts_tenant_id_fkey(id, first_name, last_name, email, phone)),
          maintenance_requests(*, tenant:profiles!maintenance_requests_tenant_id_fkey(id, first_name, last_name))
        `)
        .eq('id', id)
        .single()
    );
  },

  // Create property
  async create(property: TablesInsert<'properties'>): Promise<ApiResponse<Tables<'properties'>>> {
    return handleApiCall(() => 
      supabase
        .from('properties')
        .insert(property)
        .select()
        .single()
    );
  },

  // Update property
  async update(id: string, updates: TablesUpdate<'properties'>): Promise<ApiResponse<Tables<'properties'>>> {
    return handleApiCall(() => 
      supabase
        .from('properties')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    );
  },

  // Delete property
  async delete(id: string): Promise<ApiResponse<null>> {
    return handleApiCall(() => 
      supabase
        .from('properties')
        .delete()
        .eq('id', id)
    );
  },

  // Get properties for dashboard summary
  async getDashboardSummary(): Promise<ApiResponse<any>> {
    return handleApiCall(async () => {
      const [propertiesResult, contractsResult] = await Promise.all([
        supabase.from('properties').select('status').neq('status', 'deleted'),
        supabase.from('contracts').select('status, rent_amount').eq('status', 'active')
      ]);

      if (propertiesResult.error || contractsResult.error) {
        throw propertiesResult.error || contractsResult.error;
      }

      const properties = propertiesResult.data || [];
      const contracts = contractsResult.data || [];

      const summary = {
        total_properties: properties.length,
        available: properties.filter(p => p.status === 'available').length,
        occupied: properties.filter(p => p.status === 'occupied').length,
        maintenance: properties.filter(p => p.status === 'maintenance').length,
        total_monthly_rent: contracts.reduce((sum, c) => sum + (c.rent_amount || 0), 0),
        active_contracts: contracts.length
      };

      return { data: summary, error: null };
    });
  }
};

// Profiles API (Tenants, Owners, etc.)
export const profilesApi = {
  // Get all profiles with filtering
  async getAll(filters?: {
    role?: string;
    profile_type?: string;
    status?: string;
  }): Promise<ApiResponse<Tables<'profiles'>[]>> {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.role) query = query.eq('role', filters.role);
    if (filters?.profile_type) query = query.eq('profile_type', filters.profile_type);
    if (filters?.status) query = query.eq('status', filters.status);

    return handleApiCall(() => query);
  },

  // Get profile by ID
  async getById(id: string): Promise<ApiResponse<Tables<'profiles'>>> {
    return handleApiCall(() => 
      supabase
        .from('profiles')
        .select(`
          *,
          owned_properties:properties!properties_owner_id_fkey(*),
          contracts:contracts!contracts_tenant_id_fkey(*, property:properties(*))
        `)
        .eq('id', id)
        .single()
    );
  },

  // Create profile
  async create(profile: TablesInsert<'profiles'>): Promise<ApiResponse<Tables<'profiles'>>> {
    return handleApiCall(() => 
      supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single()
    );
  },

  // Update profile
  async update(id: string, updates: TablesUpdate<'profiles'>): Promise<ApiResponse<Tables<'profiles'>>> {
    return handleApiCall(() => 
      supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    );
  },

  // Get tenants with their contracts
  async getTenants(): Promise<ApiResponse<any[]>> {
    return handleApiCall(() => 
      supabase
        .from('profiles')
        .select(`
          *,
          contracts:contracts!contracts_tenant_id_fkey(
            *,
            property:properties(title, address, city)
          )
        `)
        .in('role', ['tenant'])
        .eq('status', 'active')
    );
  },

  // Get owners with their properties
  async getOwners(): Promise<ApiResponse<any[]>> {
    return handleApiCall(() => 
      supabase
        .from('profiles')
        .select(`
          *,
          properties:properties!properties_owner_id_fkey(*)
        `)
        .eq('role', 'owner')
        .eq('status', 'active')
    );
  }
};

// Contracts API
export const contractsApi = {
  // Get all contracts
  async getAll(filters?: {
    status?: string;
    property_id?: string;
    tenant_id?: string;
  }): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('contracts')
      .select(`
        *,
        property:properties(id, title, address, city, property_code),
        tenant:profiles!contracts_tenant_id_fkey(id, first_name, last_name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.property_id) query = query.eq('property_id', filters.property_id);
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);

    return handleApiCall(() => query);
  },

  // Create contract
  async create(contract: TablesInsert<'contracts'>): Promise<ApiResponse<Tables<'contracts'>>> {
    return handleApiCall(() => 
      supabase
        .from('contracts')
        .insert(contract)
        .select()
        .single()
    );
  },

  // Update contract
  async update(id: string, updates: TablesUpdate<'contracts'>): Promise<ApiResponse<Tables<'contracts'>>> {
    return handleApiCall(() => 
      supabase
        .from('contracts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    );
  },

  // Get expiring contracts (next 30 days)
  async getExpiring(): Promise<ApiResponse<any[]>> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return handleApiCall(() => 
      supabase
        .from('contracts')
        .select(`
          *,
          property:properties(title, address),
          tenant:profiles!contracts_tenant_id_fkey(first_name, last_name, phone)
        `)
        .eq('status', 'active')
        .lte('end_date', thirtyDaysFromNow.toISOString())
        .order('end_date')
    );
  }
};

// Maintenance API
export const maintenanceApi = {
  // Get all maintenance requests
  async getRequests(filters?: {
    status?: string;
    priority?: string;
    property_id?: string;
  }): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('maintenance_requests')
      .select(`
        *,
        property:properties(title, address, property_code),
        tenant:profiles!maintenance_requests_tenant_id_fkey(first_name, last_name, phone),
        work_orders(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.property_id) query = query.eq('property_id', filters.property_id);

    return handleApiCall(() => query);
  },

  // Create maintenance request
  async createRequest(request: TablesInsert<'maintenance_requests'>): Promise<ApiResponse<Tables<'maintenance_requests'>>> {
    return handleApiCall(() => 
      supabase
        .from('maintenance_requests')
        .insert(request)
        .select()
        .single()
    );
  },

  // Get all work orders
  async getWorkOrders(filters?: {
    status?: string;
    assigned_to?: string;
  }): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('work_orders')
      .select(`
        *,
        maintenance_request:maintenance_requests(
          *,
          property:properties(title, address, property_code),
          tenant:profiles!maintenance_requests_tenant_id_fkey(first_name, last_name)
        ),
        assigned:profiles!work_orders_assigned_to_fkey(first_name, last_name, phone)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);

    return handleApiCall(() => query);
  },

  // Create work order
  async createWorkOrder(workOrder: TablesInsert<'work_orders'>): Promise<ApiResponse<Tables<'work_orders'>>> {
    return handleApiCall(() => 
      supabase
        .from('work_orders')
        .insert(workOrder)
        .select()
        .single()
    );
  },

  // Update work order
  async updateWorkOrder(id: string, updates: TablesUpdate<'work_orders'>): Promise<ApiResponse<Tables<'work_orders'>>> {
    return handleApiCall(() => 
      supabase
        .from('work_orders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    );
  }
};

// Vouchers API
export const vouchersApi = {
  // Get all vouchers
  async getAll(filters?: {
    voucher_type?: string;
    status?: string;
    property_id?: string;
    tenant_id?: string;
  }): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('vouchers')
      .select(`
        *,
        property:properties(title, address, property_code),
        tenant:profiles!vouchers_tenant_id_fkey(first_name, last_name),
        account:accounts(account_name, account_code),
        cost_center:cost_centers(name, code),
        created_by_user:profiles!vouchers_created_by_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.voucher_type) query = query.eq('voucher_type', filters.voucher_type);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.property_id) query = query.eq('property_id', filters.property_id);
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);

    return handleApiCall(() => query);
  },

  // Create voucher
  async create(voucher: TablesInsert<'vouchers'>): Promise<ApiResponse<Tables<'vouchers'>>> {
    return handleApiCall(() => 
      supabase
        .from('vouchers')
        .insert(voucher)
        .select()
        .single()
    );
  },

  // Get voucher summary
  async getSummary(period?: 'month' | 'year'): Promise<ApiResponse<any>> {
    const periodFilter = period === 'month' ? 30 : 365;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - periodFilter);

    return handleApiCall(async () => {
      const result = await supabase
        .from('vouchers')
        .select('voucher_type, amount')
        .gte('created_at', dateFrom.toISOString());

      if (result.error) throw result.error;

      const vouchers = result.data || [];
      const summary = {
        total_receipts: vouchers.filter(v => v.voucher_type === 'receipt').reduce((sum, v) => sum + v.amount, 0),
        total_payments: vouchers.filter(v => v.voucher_type === 'payment').reduce((sum, v) => sum + v.amount, 0),
        total_journals: vouchers.filter(v => v.voucher_type === 'journal').reduce((sum, v) => sum + v.amount, 0),
        count_receipts: vouchers.filter(v => v.voucher_type === 'receipt').length,
        count_payments: vouchers.filter(v => v.voucher_type === 'payment').length,
        count_journals: vouchers.filter(v => v.voucher_type === 'journal').length
      };

      return { data: summary, error: null };
    });
  }
};

// Invoices API
export const invoicesApi = {
  // Get all invoices
  async getAll(filters?: {
    status?: string;
    property_id?: string;
    tenant_id?: string;
  }): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        property:properties(title, address, property_code),
        tenant:profiles!invoices_tenant_id_fkey(first_name, last_name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.property_id) query = query.eq('property_id', filters.property_id);
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);

    return handleApiCall(() => query);
  },

  // Create invoice
  async create(invoice: TablesInsert<'invoices'>): Promise<ApiResponse<Tables<'invoices'>>> {
    return handleApiCall(() => 
      supabase
        .from('invoices')
        .insert(invoice)
        .select()
        .single()
    );
  },

  // Get overdue invoices
  async getOverdue(): Promise<ApiResponse<any[]>> {
    const today = new Date().toISOString().split('T')[0];
    
    return handleApiCall(() => 
      supabase
        .from('invoices')
        .select(`
          *,
          property:properties(title, address),
          tenant:profiles!invoices_tenant_id_fkey(first_name, last_name, phone)
        `)
        .eq('status', 'pending')
        .lt('due_date', today)
        .order('due_date')
    );
  }
};

// Issues API
export const issuesApi = {
  // Get all issues
  async getAll(filters?: {
    status?: string;
    priority?: string;
    property_id?: string;
  }): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('issues')
      .select(`
        *,
        property:properties(title, address, property_code),
        reported_by_user:profiles!issues_reported_by_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.property_id) query = query.eq('property_id', filters.property_id);

    return handleApiCall(() => query);
  },

  // Create issue
  async create(issue: TablesInsert<'issues'>): Promise<ApiResponse<Tables<'issues'>>> {
    return handleApiCall(() => 
      supabase
        .from('issues')
        .insert(issue)
        .select()
        .single()
    );
  },

  // Update issue
  async update(id: string, updates: TablesUpdate<'issues'>): Promise<ApiResponse<Tables<'issues'>>> {
    return handleApiCall(() => 
      supabase
        .from('issues')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    );
  }
};

// Documents API
export const documentsApi = {
  // Get all documents
  async getAll(filters?: {
    document_type?: string;
    related_entity_type?: string;
    related_entity_id?: string;
  }): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('documents')
      .select(`
        *,
        uploaded_by_user:profiles!documents_uploaded_by_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.document_type) query = query.eq('document_type', filters.document_type);
    if (filters?.related_entity_type) query = query.eq('related_entity_type', filters.related_entity_type);
    if (filters?.related_entity_id) query = query.eq('related_entity_id', filters.related_entity_id);

    return handleApiCall(() => query);
  },

  // Get document by ID
  async getById(id: string): Promise<ApiResponse<any>> {
    return handleApiCall(() => 
      supabase
        .from('documents')
        .select(`
          *,
          uploaded_by_user:profiles!documents_uploaded_by_fkey(first_name, last_name)
        `)
        .eq('id', id)
        .single()
    );
  },

  // Create document
  async create(document: TablesInsert<'documents'>): Promise<ApiResponse<Tables<'documents'>>> {
    return handleApiCall(() => 
      supabase
        .from('documents')
        .insert(document)
        .select()
        .single()
    );
  }
};

// Clients API
export const clientsApi = {
  // Get all clients
  async getAll(filters?: {
    client_type?: string;
    status?: string;
  }): Promise<ApiResponse<Tables<'clients'>[]>> {
    let query = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.client_type) query = query.eq('client_type', filters.client_type);
    if (filters?.status) query = query.eq('status', filters.status);

    return handleApiCall(() => query);
  },

  // Create client
  async create(client: TablesInsert<'clients'>): Promise<ApiResponse<Tables<'clients'>>> {
    return handleApiCall(() => 
      supabase
        .from('clients')
        .insert(client)
        .select()
        .single()
    );
  }
};

// Property Reservations API
export const reservationsApi = {
  // Get all reservations
  async getAll(filters?: {
    status?: string;
    property_id?: string;
  }): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('property_reservations')
      .select(`
        *,
        property:properties(title, address, property_code),
        client:clients(company_name, contact_person, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.property_id) query = query.eq('property_id', filters.property_id);

    return handleApiCall(() => query);
  },

  // Create reservation
  async create(reservation: TablesInsert<'property_reservations'>): Promise<ApiResponse<Tables<'property_reservations'>>> {
    return handleApiCall(() => 
      supabase
        .from('property_reservations')
        .insert(reservation)
        .select()
        .single()
    );
  }
};

// Reports API
export const reportsApi = {
  // Get reports dashboard statistics
  async getStats(): Promise<ApiResponse<{
    totalReports: number;
    generatedThisMonth: number;
    scheduledReports: number;
    avgGenerationTime: string;
  }>> {
    return handleApiCall(async () => {
      // Calculate actual statistics from database
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString();
      
      // Count actual data sources to determine available reports
      const [
        { count: propertiesCount },
        { count: tenantsCount },
        { count: vouchersCount },
        { count: maintenanceCount },
        { count: monthlyReportsCount }
      ] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tenant'),
        supabase.from('vouchers').select('*', { count: 'exact', head: true }).eq('status', 'posted'),
        supabase.from('maintenance_requests').select('*', { count: 'exact', head: true }),
        supabase.from('vouchers').select('*', { count: 'exact', head: true })
          .eq('status', 'posted')
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth)
      ]);
      
      // Calculate total available reports based on actual data
      let totalReports = 0;
      
      // Financial reports (available if there are posted vouchers)
      if (vouchersCount > 0) {
        totalReports += 4; // Revenue, Expense, P&L, Cash Flow
      }
      
      // Property reports (available if there are properties)
      if (propertiesCount > 0) {
        totalReports += 3; // Occupancy, Maintenance, Property Performance
      }
      
      // Tenant reports (available if there are tenants)
      if (tenantsCount > 0) {
        totalReports += 3; // Tenant Report, Payment History, Lease Expiry
      }
      
      // Operations reports (available if there are maintenance requests)
      if (maintenanceCount > 0) {
        totalReports += 2; // Operations Summary, Vendor Report
      }
      
      return {
        data: {
          totalReports,
          generatedThisMonth: monthlyReportsCount || 0,
          scheduledReports: 0, // No scheduled reports implemented yet
          avgGenerationTime: '2.1s' // Simulated average time
        },
        error: null
      };
    });
  },

  // Revenue Report Data
  async getRevenueReport(startDate?: string, endDate?: string): Promise<ApiResponse<{
    totalRevenue: number;
    monthlyBreakdown: Array<{ month: string; revenue: number; year: number }>;
    propertyBreakdown: Array<{ propertyId: string; propertyTitle: string; revenue: number }>;
    lastGenerated: string;
  }>> {
    return handleApiCall(async () => {
      // Get receipt vouchers (income) for the period
      const startDateFilter = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
      const endDateFilter = endDate || new Date().toISOString();

      const { data: vouchers, error: vouchersError } = await supabase
        .from('vouchers')
        .select(`
          amount,
          created_at,
          property_id,
          property:properties(id, title)
        `)
        .eq('voucher_type', 'receipt')
        .eq('status', 'posted')
        .gte('created_at', startDateFilter)
        .lte('created_at', endDateFilter);

      if (vouchersError) throw vouchersError;

      const totalRevenue = vouchers?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

      // Group by month
      const monthlyData: { [key: string]: number } = {};
      const propertyData: { [key: string]: { title: string; revenue: number } } = {};

      vouchers?.forEach(voucher => {
        const date = new Date(voucher.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + voucher.amount;

        if (voucher.property_id && voucher.property) {
          if (!propertyData[voucher.property_id]) {
            propertyData[voucher.property_id] = {
              title: voucher.property.title || 'Unknown Property',
              revenue: 0
            };
          }
          propertyData[voucher.property_id].revenue += voucher.amount;
        }
      });

      const monthlyBreakdown = Object.entries(monthlyData).map(([monthKey, revenue]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long' }),
          year: parseInt(year),
          revenue
        };
      });

      const propertyBreakdown = Object.entries(propertyData).map(([propertyId, data]) => ({
        propertyId,
        propertyTitle: data.title,
        revenue: data.revenue
      }));

      return {
        data: {
          totalRevenue,
          monthlyBreakdown,
          propertyBreakdown,
          lastGenerated: new Date().toISOString()
        },
        error: null
      };
    });
  },

  // Expense Report Data
  async getExpenseReport(startDate?: string, endDate?: string): Promise<ApiResponse<{
    totalExpenses: number;
    monthlyBreakdown: Array<{ month: string; expenses: number; year: number }>;
    categoryBreakdown: Array<{ category: string; amount: number }>;
    lastGenerated: string;
  }>> {
    return handleApiCall(async () => {
      const startDateFilter = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
      const endDateFilter = endDate || new Date().toISOString();

      const { data: vouchers, error: vouchersError } = await supabase
        .from('vouchers')
        .select(`
          amount,
          created_at,
          description,
          account:accounts(account_name, account_type)
        `)
        .eq('voucher_type', 'payment')
        .eq('status', 'posted')
        .gte('created_at', startDateFilter)
        .lte('created_at', endDateFilter);

      if (vouchersError) throw vouchersError;

      const totalExpenses = vouchers?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

      // Group by month and category
      const monthlyData: { [key: string]: number } = {};
      const categoryData: { [key: string]: number } = {};

      vouchers?.forEach(voucher => {
        const date = new Date(voucher.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + voucher.amount;

        const category = voucher.account?.account_name || 'Other Expenses';
        categoryData[category] = (categoryData[category] || 0) + voucher.amount;
      });

      const monthlyBreakdown = Object.entries(monthlyData).map(([monthKey, expenses]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long' }),
          year: parseInt(year),
          expenses
        };
      });

      const categoryBreakdown = Object.entries(categoryData).map(([category, amount]) => ({
        category,
        amount
      }));

      return {
        data: {
          totalExpenses,
          monthlyBreakdown,
          categoryBreakdown,
          lastGenerated: new Date().toISOString()
        },
        error: null
      };
    });
  },

  // Property Performance Report
  async getPropertyPerformanceReport(): Promise<ApiResponse<{
    properties: Array<{
      id: string;
      title: string;
      occupancyRate: number;
      monthlyRevenue: number;
      maintenanceCosts: number;
      netIncome: number;
      roi: number;
    }>;
    lastGenerated: string;
  }>> {
    return handleApiCall(async () => {
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          status,
          annual_rent,
          price,
          contracts(status, rent_amount, start_date, end_date),
          vouchers(amount, voucher_type, created_at),
          maintenance_requests(id)
        `);

      if (propertiesError) throw propertiesError;

      const performanceData = properties?.map(property => {
        const activeContracts = property.contracts?.filter(c => c.status === 'active') || [];
        const occupancyRate = activeContracts.length > 0 ? 100 : 0;
        
        const monthlyRevenue = activeContracts.reduce((sum, c) => sum + (c.rent_amount || 0), 0);
        
        // Calculate maintenance costs from payment vouchers
        const maintenanceCosts = property.vouchers
          ?.filter(v => v.voucher_type === 'payment')
          ?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

        const netIncome = monthlyRevenue - maintenanceCosts;
        const propertyValue = property.price || 0;
        const roi = propertyValue > 0 ? ((netIncome * 12) / propertyValue) * 100 : 0;

        return {
          id: property.id,
          title: property.title,
          occupancyRate,
          monthlyRevenue,
          maintenanceCosts,
          netIncome,
          roi: Math.round(roi * 100) / 100
        };
      }) || [];

      return {
        data: {
          properties: performanceData,
          lastGenerated: new Date().toISOString()
        },
        error: null
      };
    });
  },

  // Tenant Report Data
  async getTenantReport(): Promise<ApiResponse<{
    totalTenants: number;
    activeTenants: number;
    pendingTenants: number;
    paymentHistory: Array<{
      tenantName: string;
      lastPayment: string;
      amountDue: number;
      status: 'current' | 'late' | 'overdue';
    }>;
    demographics: {
      domestic: number;
      foreign: number;
    };
    lastGenerated: string;
  }>> {
    return handleApiCall(async () => {
      const { data: tenants, error: tenantsError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          is_foreign,
          status,
          contracts(status, rent_amount, start_date, end_date),
          vouchers(amount, created_at, voucher_type)
        `)
        .eq('role', 'tenant');

      if (tenantsError) throw tenantsError;

      const totalTenants = tenants?.length || 0;
      const activeTenants = tenants?.filter(t => t.status === 'active').length || 0;
      const pendingTenants = tenants?.filter(t => t.status === 'pending').length || 0;

      const paymentHistory = tenants?.map(tenant => {
        const lastPayment = tenant.vouchers
          ?.filter(v => v.voucher_type === 'receipt')
          ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        const activeContract = tenant.contracts?.find(c => c.status === 'active');
        const amountDue = activeContract?.rent_amount || 0;

        // Determine payment status based on last payment date
        const daysSincePayment = lastPayment 
          ? Math.floor((Date.now() - new Date(lastPayment.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        let status: 'current' | 'late' | 'overdue' = 'current';
        if (daysSincePayment > 35) status = 'overdue';
        else if (daysSincePayment > 30) status = 'late';

        return {
          tenantName: `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim(),
          lastPayment: lastPayment?.created_at || 'Never',
          amountDue,
          status
        };
      }) || [];

      const demographics = {
        domestic: tenants?.filter(t => !t.is_foreign).length || 0,
        foreign: tenants?.filter(t => t.is_foreign).length || 0
      };

      return {
        data: {
          totalTenants,
          activeTenants,
          pendingTenants,
          paymentHistory,
          demographics,
          lastGenerated: new Date().toISOString()
        },
        error: null
      };
    });
  },

  // Maintenance Report Data
  async getMaintenanceReport(): Promise<ApiResponse<{
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
    totalCosts: number;
    averageCost: number;
    requestsByPriority: { [key: string]: number };
    costsByProperty: Array<{ propertyTitle: string; totalCost: number }>;
    lastGenerated: string;
  }>> {
    return handleApiCall(async () => {
      const { data: requests, error: requestsError } = await supabase
        .from('maintenance_requests')
        .select(`
          id,
          status,
          priority,
          property:properties(title),
          work_orders(actual_cost, estimated_cost)
        `);

      if (requestsError) throw requestsError;

      const totalRequests = requests?.length || 0;
      const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;

      // Calculate costs from work orders
      let totalCosts = 0;
      const propertyData: { [key: string]: number } = {};
      const priorityData: { [key: string]: number } = {};

      requests?.forEach(request => {
        // Count by priority
        priorityData[request.priority] = (priorityData[request.priority] || 0) + 1;

        // Sum costs by property
        const workOrderCosts = request.work_orders?.reduce((sum, wo) => 
          sum + (wo.actual_cost || wo.estimated_cost || 0), 0) || 0;
        
        totalCosts += workOrderCosts;

        if (request.property?.title) {
          propertyData[request.property.title] = (propertyData[request.property.title] || 0) + workOrderCosts;
        }
      });

      const averageCost = totalRequests > 0 ? totalCosts / totalRequests : 0;

      const costsByProperty = Object.entries(propertyData).map(([propertyTitle, totalCost]) => ({
        propertyTitle,
        totalCost
      }));

      return {
        data: {
          totalRequests,
          pendingRequests,
          completedRequests,
          totalCosts,
          averageCost: Math.round(averageCost * 100) / 100,
          requestsByPriority: priorityData,
          costsByProperty,
          lastGenerated: new Date().toISOString()
        },
        error: null
      };
    });
  }
};

// Export all APIs
export default {
  properties: propertiesApi,
  profiles: profilesApi,
  contracts: contractsApi,
  maintenance: maintenanceApi,
  vouchers: vouchersApi,
  invoices: invoicesApi,
  issues: issuesApi,
  documents: documentsApi,
  clients: clientsApi,
  reservations: reservationsApi,
  reports: reportsApi,
}; 