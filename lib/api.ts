import { supabase } from './supabase';
import { Database, Tables, TablesInsert, TablesUpdate } from './database.types';
import { getCurrentUserContext, applySecurityFilter, validateUserAction, buildRoleBasedFilter } from './security';
import { UserContext } from './types';

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

// Legacy response type for backward compatibility
type LegacyApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
};

// Generic functions
async function handleApiCall<T>(
  operation: () => Promise<{ data: T | null; error: any; count?: number }>
): Promise<ApiResponse<T>> {
  try {
    const result = await operation();
    
    // Handle authentication errors specifically
    if (result.error) {
      const errorMessage = result.error.message || 'Unknown error';
      
      // Check for authentication-related errors
      if (errorMessage.includes('JWT expired') || 
          errorMessage.includes('Invalid Refresh Token') ||
          errorMessage.includes('refresh_token_not_found') ||
          errorMessage.includes('invalid_grant')) {
        
        console.warn('[API] Authentication error detected:', errorMessage);
        
        // Import clearSession dynamically to avoid circular dependency
        const { clearSession } = await import('./supabase');
        await clearSession();
        
        return {
          data: null,
          error: { 
            message: 'Session expired. Please sign in again.', 
            details: 'AUTH_ERROR',
            hint: 'Redirect to login' 
          }
        };
      }
      
      return {
        data: result.data,
        error: { 
          message: errorMessage, 
          details: result.error.details, 
          hint: result.error.hint 
        },
        count: result.count
      };
    }
    
    return {
      data: result.data,
      error: null,
      count: result.count
    };
  } catch (error: any) {
    console.error('[API] Unexpected error:', error);
    
    // Check if it's a network error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        data: null,
        error: { 
          message: 'Network error. Please check your connection and try again.',
          details: 'NETWORK_ERROR'
        }
      };
    }
    
    return {
      data: null,
      error: { message: error.message || 'An unexpected error occurred' }
    };
  }
}

// Properties API
export const propertiesApi = {
  // Get all properties with optional filters and role-based access control
  async getAll(filters?: {
    owner_id?: string;
    status?: string;
    property_type?: string;
    city?: string;
  }): Promise<ApiResponse<Tables<'properties'>[]>> {
    // **SECURITY**: Get current user context for role-based filtering
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to access properties' }
      };
    }

    let query = supabase
      .from('properties')
      .select(`
        *,
        owner:profiles!properties_owner_id_fkey(id, first_name, last_name, email, phone)
      `)
      .order('created_at', { ascending: false });

    // **SECURITY**: Apply role-based filtering BEFORE other filters
    const securityFilter = buildRoleBasedFilter(userContext, 'properties');
    if (securityFilter) {
      if (userContext.role === 'owner') {
        // Owners see only their properties
        query = query.eq('owner_id', userContext.userId);
      } else if (userContext.role === 'tenant') {
        // Tenants see ONLY their rented properties (no available properties)
        const rentedPropertyIds = userContext.rentedPropertyIds || [];
        if (rentedPropertyIds.length > 0) {
          query = query.in('id', rentedPropertyIds);
        } else {
          // If tenant has no properties, return empty result immediately
          return {
            data: [],
            error: null,
            count: 0
          };
        }
      }
    }

    // Apply additional filters
    if (filters?.owner_id) query = query.eq('owner_id', filters.owner_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.property_type) query = query.eq('property_type', filters.property_type);
    if (filters?.city) query = query.ilike('city', `%${filters.city}%`);

    console.log(`[Security] Properties query for user ${userContext.userId} (${userContext.role})`);
    return handleApiCall(() => query);
  },

  // Get property by ID with role-based access control
  async getById(id: string): Promise<ApiResponse<Tables<'properties'>>> {
    // **SECURITY**: Get current user context for access validation
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to access property details' }
      };
    }

    // **SECURITY**: Check if user has access to this specific property
    const hasAccess = userContext.role === 'admin' || 
                     userContext.role === 'manager' ||
                     (userContext.role === 'owner' && userContext.ownedPropertyIds?.includes(id)) ||
                     (userContext.role === 'tenant' && (
                       userContext.rentedPropertyIds?.includes(id) || 
                       // Also allow viewing available properties for tenants
                       await this.isPropertyAvailable(id)
                     ));

    if (!hasAccess) {
      return {
        data: null,
        error: { message: 'Access denied: You do not have permission to view this property' }
      };
    }

    console.log(`[Security] Property ${id} access granted for user ${userContext.userId} (${userContext.role})`);
    
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

  // Helper function to check if property is available
  async isPropertyAvailable(id: string): Promise<boolean> {
    const { data } = await supabase
      .from('properties')
      .select('status')
      .eq('id', id)
      .single();
    
    return data?.status === 'available';
  },

  // Create property
  async create(property: TablesInsert<'properties'>, createdByUserId?: string): Promise<ApiResponse<Tables<'properties'>>> {
    return handleApiCall(async () => {
      // Insert the property
      const { data: newProperty, error } = await supabase
        .from('properties')
        .insert(property)
        .select()
        .single();

      if (error) throw error;

      // Send notification if property was created by someone other than the owner
      if (createdByUserId && property.owner_id && createdByUserId !== property.owner_id) {
        try {
          await notificationsApi.create({
            recipient_id: property.owner_id,
            sender_id: createdByUserId,
            notification_type: 'property_created',
            title: 'تم إضافة عقار جديد',
            message: `تم إضافة عقار جديد "${property.title}" إلى محفظتك بواسطة مدير العقار`,
            priority: 'medium',
            related_entity_type: 'property',
            related_entity_id: newProperty.id
          });
          console.log('Property creation notification sent to owner:', property.owner_id);
        } catch (notificationError) {
          console.warn('Failed to send property creation notification:', notificationError);
          // Don't fail the property creation if notification fails
        }
      }

      return { data: newProperty, error: null };
    });
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

  // Get properties for dashboard summary with role-based filtering
  async getDashboardSummary(): Promise<ApiResponse<any>> {
    // **SECURITY**: Get current user context for role-based data filtering
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to access dashboard data' }
      };
    }

    return handleApiCall(async () => {
      let propertiesQuery = supabase.from('properties').select('status').neq('status', 'deleted');
      let contractsQuery = supabase.from('contracts').select('status, rent_amount, property_id').eq('status', 'active');

      // **SECURITY**: Apply role-based filtering
      if (userContext.role === 'owner') {
        // Owners see only their properties and related contracts
        propertiesQuery = propertiesQuery.eq('owner_id', userContext.userId);
        contractsQuery = contractsQuery.in('property_id', userContext.ownedPropertyIds || []);
      } else if (userContext.role === 'tenant') {
        // Tenants see ONLY their rented properties
        const rentedPropertyIds = userContext.rentedPropertyIds || [];
        if (rentedPropertyIds.length > 0) {
          propertiesQuery = propertiesQuery.in('id', rentedPropertyIds);
        } else {
          // If tenant has no properties, return empty summary immediately
          const emptySummary = {
            total_properties: 0,
            available: 0,
            occupied: 0,
            maintenance: 0,
            total_monthly_rent: 0,
            active_contracts: 0
          };
          return { data: emptySummary, error: null };
        }
        contractsQuery = contractsQuery.eq('tenant_id', userContext.userId);
      }
      // Admins see everything (no additional filtering)

      const [propertiesResult, contractsResult] = await Promise.all([
        propertiesQuery,
        contractsQuery
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

      console.log(`[Security] Dashboard summary for user ${userContext.userId} (${userContext.role}):`, summary);
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

  // Get tenants with their contracts - role-based access control
  async getTenants(): Promise<ApiResponse<any[]>> {
    // **SECURITY**: Get current user context for role-based filtering
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to access tenant data' }
      };
    }

    return handleApiCall(async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          contracts:contracts!contracts_tenant_id_fkey(
            *,
            property:properties(title, address, city)
          )
        `)
        .in('role', ['tenant'])
        .eq('status', 'active');

      // **SECURITY**: Apply role-based filtering
      if (userContext.role === 'owner') {
        // Owners see only tenants of their properties
        const ownedPropertyIds = userContext.ownedPropertyIds || [];
        if (ownedPropertyIds.length > 0) {
          // Get tenant IDs who have contracts with owner's properties
          const { data: contracts } = await supabase
            .from('contracts')
            .select('tenant_id')
            .in('property_id', ownedPropertyIds);
          
          const tenantIds = contracts?.map(c => c.tenant_id) || [];
          if (tenantIds.length > 0) {
            query = query.in('id', tenantIds);
          } else {
            // Owner has no tenants
            return { data: [], error: null };
          }
        } else {
          // Owner has no properties
          return { data: [], error: null };
        }
      } else if (userContext.role === 'tenant') {
        // Tenants see only their own profile
        query = query.eq('id', userContext.userId);
      }
      // Admins see all tenants (no additional filtering)

      console.log(`[Security] Tenants query for user ${userContext.userId} (${userContext.role})`);
      return query;
    });
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

  // Get contract by ID
  async getById(id: string): Promise<ApiResponse<any>> {
    return handleApiCall(() => 
      supabase
        .from('contracts')
        .select(`
          *,
          property:properties(
            id, title, description, address, city, area_sqm, 
            bedrooms, bathrooms, property_type, property_code,
            amenities, is_furnished, parking_spaces
          ),
          tenant:profiles!contracts_tenant_id_fkey(
            id, first_name, last_name, email, phone, address, 
            city, nationality, is_foreign, status
          )
        `)
        .eq('id', id)
        .single()
    );
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
  // Get maintenance requests with role-based access control
  async getRequests(filters?: {
    status?: string;
    priority?: string;
    property_id?: string;
  }): Promise<ApiResponse<any[]>> {
    // **SECURITY**: Get current user context for role-based filtering
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to access maintenance requests' }
      };
    }

    let query = supabase
      .from('maintenance_requests')
      .select(`
        *,
        property:properties(title, address, property_code),
        tenant:profiles!maintenance_requests_tenant_id_fkey(first_name, last_name, phone),
        work_orders(*)
      `)
      .order('created_at', { ascending: false });

    // **SECURITY**: Apply role-based filtering FIRST
    if (userContext.role === 'tenant') {
      // Tenants can ONLY see maintenance requests for properties they are renting
      const rentedPropertyIds = userContext.rentedPropertyIds || [];
      if (rentedPropertyIds.length > 0) {
        query = query.in('property_id', rentedPropertyIds);
      } else {
        // If tenant has no rented properties, return empty result immediately
        return {
          data: [],
          error: null,
          count: 0
        };
      }
    } else if (userContext.role === 'owner') {
      // Owners see maintenance requests for their properties only
      const ownedPropertyIds = userContext.ownedPropertyIds || [];
      if (ownedPropertyIds.length > 0) {
        query = query.in('property_id', ownedPropertyIds);
      } else {
        // If owner has no properties, return empty result
        query = query.eq('property_id', 'no-properties-for-owner');
      }
    }
    // Admins and managers see all requests (no additional filtering)

    // Apply additional filters
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.property_id) query = query.eq('property_id', filters.property_id);

    console.log(`[Security] Maintenance requests query for user ${userContext.userId} (${userContext.role})`);
    return handleApiCall(() => query);
  },

  // Create maintenance request with access control
  async createRequest(request: TablesInsert<'maintenance_requests'>): Promise<ApiResponse<Tables<'maintenance_requests'>>> {
    // **SECURITY**: Get current user context for access validation
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to create maintenance request' }
      };
    }

    // **SECURITY**: Validate that user can create request for this property
    if (userContext.role === 'tenant') {
      const rentedPropertyIds = userContext.rentedPropertyIds || [];
      if (!rentedPropertyIds.includes(request.property_id!)) {
        return {
          data: null,
          error: { message: 'Access denied: You can only create maintenance requests for properties you are renting' }
        };
      }
      // Ensure tenant_id is set to current user for tenant requests
      request.tenant_id = userContext.userId;
    } else if (userContext.role === 'owner') {
      const ownedPropertyIds = userContext.ownedPropertyIds || [];
      if (!ownedPropertyIds.includes(request.property_id!)) {
        return {
          data: null,
          error: { message: 'Access denied: You can only create maintenance requests for properties you own' }
        };
      }
    }
    // Admins and managers can create requests for any property

    console.log(`[Security] Creating maintenance request for property ${request.property_id} by user ${userContext.userId} (${userContext.role})`);
    
    return handleApiCall(() => 
      supabase
        .from('maintenance_requests')
        .insert(request)
        .select()
        .single()
    );
  },

  // Update maintenance request with access control
  async updateRequest(id: string, updates: TablesUpdate<'maintenance_requests'>): Promise<ApiResponse<Tables<'maintenance_requests'>>> {
    // **SECURITY**: Get current user context for access validation
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to update maintenance request' }
      };
    }

    // **SECURITY**: First check if the maintenance request exists and user has access
    const { data: existingRequest } = await supabase
      .from('maintenance_requests')
      .select('property_id, tenant_id')
      .eq('id', id)
      .single();

    if (!existingRequest) {
      return {
        data: null,
        error: { message: 'Maintenance request not found' }
      };
    }

    // **SECURITY**: Validate access based on user role
    let hasAccess = false;
    
    if (userContext.role === 'tenant') {
      // Tenants can only update requests they created for their rented properties
      const rentedPropertyIds = userContext.rentedPropertyIds || [];
      hasAccess = existingRequest.tenant_id === userContext.userId && 
                  rentedPropertyIds.includes(existingRequest.property_id);
    } else if (userContext.role === 'owner') {
      // Owners can update requests for their properties
      const ownedPropertyIds = userContext.ownedPropertyIds || [];
      hasAccess = ownedPropertyIds.includes(existingRequest.property_id);
    } else if (userContext.role === 'admin' || userContext.role === 'manager') {
      // Admins and managers can update any request
      hasAccess = true;
    }

    if (!hasAccess) {
      return {
        data: null,
        error: { message: 'Access denied: You do not have permission to update this maintenance request' }
      };
    }

    console.log(`[Security] Updating maintenance request ${id} by user ${userContext.userId} (${userContext.role})`);

    return handleApiCall(() => 
      supabase
        .from('maintenance_requests')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
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

// Accounts API
export const accountsApi = {
  // Get all accounts (chart of accounts)
  async getAll(filters?: {
    account_type?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<Tables<'accounts'>[]>> {
    let query = supabase
      .from('accounts')
      .select('*')
      .order('account_code');

    if (filters?.account_type) query = query.eq('account_type', filters.account_type);
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);

    return handleApiCall(() => query);
  },

  // Get accounts by type (for specific voucher types)
  async getByType(accountType: string): Promise<ApiResponse<Tables<'accounts'>[]>> {
    return handleApiCall(() => 
      supabase
        .from('accounts')
        .select('*')
        .eq('account_type', accountType)
        .eq('is_active', true)
        .order('account_code')
    );
  },

  // Get revenue accounts (for receipt vouchers)
  async getRevenueAccounts(): Promise<ApiResponse<Tables<'accounts'>[]>> {
    return this.getByType('revenue');
  },

  // Get expense accounts (for payment vouchers)
  async getExpenseAccounts(): Promise<ApiResponse<Tables<'accounts'>[]>> {
    return this.getByType('expense');
  },

  // Get asset accounts (for receipt vouchers - cash accounts)
  async getAssetAccounts(): Promise<ApiResponse<Tables<'accounts'>[]>> {
    return this.getByType('asset');
  }
};

// Cost Centers API
export const costCentersApi = {
  // Get all cost centers
  async getAll(filters?: {
    is_active?: boolean;
  }): Promise<ApiResponse<Tables<'cost_centers'>[]>> {
    let query = supabase
      .from('cost_centers')
      .select('*')
      .order('code');

    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);

    return handleApiCall(() => query);
  },

  // Get active cost centers only
  async getActive(): Promise<ApiResponse<Tables<'cost_centers'>[]>> {
    return this.getAll({ is_active: true });
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

  // Generate voucher number
  async generateVoucherNumber(voucherType: string): Promise<string> {
    const prefix = {
      'receipt': 'RCP',
      'payment': 'PAY', 
      'journal': 'JNL'
    }[voucherType] || 'VCH';
    
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `${prefix}-${year}${month}-${timestamp}`;
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
  },

  // Enhanced filtering with search
  async getAllWithSearch(filters?: {
    voucher_type?: string;
    status?: string;
    property_id?: string;
    tenant_id?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any[]>> {
    let query = supabase
      .from('vouchers')
      .select(`
        *,
        property:properties(title, address, property_code),
        tenant:profiles!vouchers_tenant_id_fkey(first_name, last_name, email),
        account:accounts(account_name, account_code),
        cost_center:cost_centers(name, code),
        created_by_user:profiles!vouchers_created_by_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.voucher_type) query = query.eq('voucher_type', filters.voucher_type);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.property_id) query = query.eq('property_id', filters.property_id);
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.startDate) query = query.gte('created_at', filters.startDate);
    if (filters?.endDate) query = query.lte('created_at', filters.endDate);
    if (filters?.search) {
      query = query.or(`voucher_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    return handleApiCall(() => query);
  },

  // Get voucher by ID with detailed information
  async getById(id: string): Promise<ApiResponse<any>> {
    return handleApiCall(() => 
      supabase
        .from('vouchers')
        .select(`
          *,
          property:properties(id, title, address, city, property_type),
          tenant:profiles!vouchers_tenant_id_fkey(id, first_name, last_name, email, phone, address),
          account:accounts(id, account_name, account_code, account_type),
          cost_center:cost_centers(id, name, code, description),
          created_by_user:profiles!vouchers_created_by_fkey(id, first_name, last_name, email)
        `)
        .eq('id', id)
        .single()
    );
  },

  // Update voucher status with authorization
  async updateStatus(id: string, status: 'draft' | 'posted' | 'cancelled', notes?: string): Promise<ApiResponse<any>> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'posted') {
      updateData.posted_at = new Date().toISOString();
    }

    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      if (notes) updateData.cancellation_notes = notes;
    }

    return handleApiCall(() => 
      supabase
        .from('vouchers')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          property:properties(title, address),
          tenant:profiles!vouchers_tenant_id_fkey(first_name, last_name),
          account:accounts(account_name, account_code)
        `)
        .single()
    );
  },

  // Duplicate voucher for recurring transactions
  async duplicate(id: string): Promise<ApiResponse<any>> {
    return handleApiCall(async () => {
      // First get the original voucher
      const originalResult = await supabase
        .from('vouchers')
        .select('*')
        .eq('id', id)
        .single();

      if (originalResult.error) throw originalResult.error;

      const original = originalResult.data;

      // Generate new voucher number
      const newVoucherNumber = await this.generateVoucherNumber(original.voucher_type);

      // Create duplicate with new number and draft status
      const duplicateData = {
        ...original,
        id: undefined, // Let database generate new ID
        voucher_number: newVoucherNumber,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        posted_at: null,
        cancelled_at: null,
        cancellation_notes: null
      };

      const result = await supabase
        .from('vouchers')
        .insert([duplicateData])
        .select(`
          *,
          property:properties(title, address),
          tenant:profiles!vouchers_tenant_id_fkey(first_name, last_name),
          account:accounts(account_name, account_code)
        `)
        .single();

      return result;
    });
  },

  // Get voucher statistics for management dashboard
  async getStatistics(): Promise<ApiResponse<{
    totalVouchers: number;
    draftVouchers: number;
    postedVouchers: number;
    cancelledVouchers: number;
    totalAmount: number;
    receiptAmount: number;
    paymentAmount: number;
    journalAmount: number;
    monthlyTrend: Array<{ month: string; count: number; amount: number }>;
  }>> {
    return handleApiCall(async () => {
      const vouchersResult = await supabase
        .from('vouchers')
        .select('status, voucher_type, amount, created_at');

      if (vouchersResult.error) throw vouchersResult.error;

      const vouchers = vouchersResult.data || [];

      // Calculate monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthVouchers = vouchers.filter(v => {
          const vDate = new Date(v.created_at);
          return vDate >= monthStart && vDate <= monthEnd;
        });

        monthlyTrend.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          count: monthVouchers.length,
          amount: monthVouchers.reduce((sum, v) => sum + (v.amount || 0), 0)
        });
      }

      const stats = {
        totalVouchers: vouchers.length,
        draftVouchers: vouchers.filter(v => v.status === 'draft').length,
        postedVouchers: vouchers.filter(v => v.status === 'posted').length,
        cancelledVouchers: vouchers.filter(v => v.status === 'cancelled').length,
        totalAmount: vouchers.reduce((sum, v) => sum + (v.amount || 0), 0),
        receiptAmount: vouchers.filter(v => v.voucher_type === 'receipt').reduce((sum, v) => sum + (v.amount || 0), 0),
        paymentAmount: vouchers.filter(v => v.voucher_type === 'payment').reduce((sum, v) => sum + (v.amount || 0), 0),
        journalAmount: vouchers.filter(v => v.voucher_type === 'journal').reduce((sum, v) => sum + (v.amount || 0), 0),
        monthlyTrend
      };

      return { data: stats, error: null };
    });
  },

  // Update voucher (for editing draft vouchers)
  async update(id: string, updates: Partial<TablesUpdate<'vouchers'>>): Promise<ApiResponse<any>> {
    return handleApiCall(() => 
      supabase
        .from('vouchers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          property:properties(title, address),
          tenant:profiles!vouchers_tenant_id_fkey(first_name, last_name),
          account:accounts(account_name, account_code),
          cost_center:cost_centers(name, code)
        `)
        .single()
    );
  },

  // Delete voucher (only for draft vouchers)
  async delete(id: string): Promise<ApiResponse<null>> {
    return handleApiCall(() => 
      supabase
        .from('vouchers')
        .delete()
        .eq('id', id)
        .eq('status', 'draft') // Only allow deletion of draft vouchers
    );
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

  // Get invoice by ID
  async getById(id: string): Promise<ApiResponse<any>> {
    return handleApiCall(() => 
      supabase
        .from('invoices')
        .select(`
          *,
          property:properties(id, title, address, city, property_type, area_sqm),
          tenant:profiles!invoices_tenant_id_fkey(id, first_name, last_name, email, phone, address, city)
        `)
        .eq('id', id)
        .single()
    );
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

  // Update invoice
  async update(id: string, updates: TablesUpdate<'invoices'>): Promise<ApiResponse<Tables<'invoices'>>> {
    return handleApiCall(() => 
      supabase
        .from('invoices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    );
  },

  // Generate unique invoice number
  async generateInvoiceNumber(): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .like('invoice_number', `INV-${year}-%`)
        .order('invoice_number', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = data[0].invoice_number;
        const numberPart = lastNumber.split('-')[2];
        nextNumber = parseInt(numberPart) + 1;
      }

      return `INV-${year}-${nextNumber.toString().padStart(6, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000000);
      return `INV-${year}-${random.toString().padStart(6, '0')}`;
    }
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
  },

  // Get invoices by status
  async getByStatus(status: string): Promise<ApiResponse<any[]>> {
    return handleApiCall(() => 
      supabase
        .from('invoices')
        .select(`
          *,
          property:properties(title, address),
          tenant:profiles!invoices_tenant_id_fkey(first_name, last_name, email)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })
    );
  },

  // Calculate VAT for amount
  calculateVAT: (amount: number, vatRate: number = 15) => {
    const vatMultiplier = vatRate / 100;
    const netAmount = amount;
    const vatAmount = amount * vatMultiplier;
    const grossAmount = amount + vatAmount;
    
    return {
      netAmount: Math.round(netAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      grossAmount: Math.round(grossAmount * 100) / 100,
    };
  },

  // Calculate invoice totals with line items
  calculateInvoiceTotals: (lineItems: any[], vatRate: number = 15) => {
    const lineItemTotals = lineItems.map(item => {
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
      const vatAmount = lineTotal * (vatRate / 100);
      const lineTotalWithVAT = lineTotal + vatAmount;
      
      return {
        ...item,
        line_total: Math.round(lineTotal * 100) / 100,
        vat_amount: Math.round(vatAmount * 100) / 100,
        total_with_vat: Math.round(lineTotalWithVAT * 100) / 100,
      };
    });

    const subtotal = lineItemTotals.reduce((sum, item) => sum + item.line_total, 0);
    const totalVAT = lineItemTotals.reduce((sum, item) => sum + item.vat_amount, 0);
    const totalAmount = subtotal + totalVAT;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalVAT: Math.round(totalVAT * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      lineItemTotals,
    };
  },

  // Calculate due date based on payment terms
  calculateDueDate: (issueDate: string, paymentTerms: string) => {
    const issue = new Date(issueDate);
    let daysToAdd = 30; // Default to 30 days

    if (paymentTerms.includes('15')) daysToAdd = 15;
    else if (paymentTerms.includes('30')) daysToAdd = 30;
    else if (paymentTerms.includes('60')) daysToAdd = 60;
    else if (paymentTerms.includes('90')) daysToAdd = 90;

    const dueDate = new Date(issue);
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    
    return dueDate.toISOString().split('T')[0];
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
  async getStats(userRole?: string): Promise<ApiResponse<{
    totalReports: number;
    generatedThisMonth: number;
    scheduledReports: number;
    avgGenerationTime: string;
  }>> {
    return handleApiCall(async () => {
      try {
        console.log('getStats: Starting...');
        
        // Calculate actual statistics from database - using individual queries for better error handling
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString();
        
        console.log('getStats: Date calculations done', { currentMonth, currentYear, startOfMonth, endOfMonth });
        
        // Count actual data sources to determine available reports
        console.log('getStats: Starting database queries...');
        
        const propertiesResult = await supabase.from('properties').select('*', { count: 'exact', head: true });
        console.log('getStats: Properties query done', propertiesResult);
        
        const tenantsResult = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tenant');
        console.log('getStats: Tenants query done', tenantsResult);
        
        const vouchersResult = await supabase.from('vouchers').select('*', { count: 'exact', head: true }).eq('status', 'posted');
        console.log('getStats: Vouchers query done', vouchersResult);
        
        const maintenanceResult = await supabase.from('maintenance_requests').select('*', { count: 'exact', head: true });
        console.log('getStats: Maintenance query done', maintenanceResult);
        
        const monthlyReportsResult = await supabase.from('vouchers').select('*', { count: 'exact', head: true })
          .eq('status', 'posted')
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);
        console.log('getStats: Monthly reports query done', monthlyReportsResult);
        
        const propertiesCount = propertiesResult.count || 0;
        const tenantsCount = tenantsResult.count || 0;
        const vouchersCount = vouchersResult.count || 0;
        const maintenanceCount = maintenanceResult.count || 0;
        const monthlyReportsCount = monthlyReportsResult.count || 0;
        
        console.log('getStats: Counts calculated', { propertiesCount, tenantsCount, vouchersCount, maintenanceCount, monthlyReportsCount });
        
        // Calculate total available reports based on actual data and user role
        let totalReports = 0;
        
        if (userRole === 'owner') {
          // Owners only see:
          // 1. Rental Income Report (if they have properties with income)
          // 2. Maintenance Expenses Report (if they have maintenance costs)
          if (vouchersCount > 0) {
            totalReports += 1; // Rental Income Report
          }
          if (maintenanceCount > 0 || vouchersCount > 0) {
            totalReports += 1; // Maintenance Expenses Report
          }
        } else if (userRole === 'manager') {
          // Property Managers see:
          // 1. Income Report (revenue from all properties)
          // 2. Expenses Report (mainly maintenance)
          // 3. Cashflow Report (combined income and expenses)
          if (vouchersCount > 0) {
            totalReports += 1; // Income Report
            totalReports += 1; // Expenses Report
            totalReports += 1; // Cashflow Report
          }
        } else {
          // Admin or other roles get all reports
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
        }
        
        const result = {
          totalReports,
          generatedThisMonth: monthlyReportsCount,
          scheduledReports: 0, // No scheduled reports implemented yet
          avgGenerationTime: '2.1s' // Simulated average time
        };
        
        console.log('getStats: Final result', result);
        
        return {
          data: result,
          error: null
        };
      } catch (error: any) {
        console.error('Error in getStats:', error);
        // Return default values if database queries fail
        return {
          data: {
            totalReports: 6, // Default based on available report types
            generatedThisMonth: 0,
            scheduledReports: 0,
            avgGenerationTime: '2.1s'
          },
          error: null
        };
      }
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
  },

  // Owner-specific Rental Income Report
  async getOwnerRentalIncomeReport(ownerId?: string, startDate?: string, endDate?: string): Promise<ApiResponse<{
    totalRentalIncome: number;
    monthlyBreakdown: Array<{ month: string; income: number; year: number }>;
    propertyBreakdown: Array<{ propertyId: string; propertyTitle: string; income: number }>;
    lastGenerated: string;
  }>> {
    return handleApiCall(async () => {
      const startDateFilter = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
      const endDateFilter = endDate || new Date().toISOString();

      let query = supabase
        .from('vouchers')
        .select(`
          amount,
          created_at,
          property_id,
          property:properties(id, title, owner_id)
        `)
        .eq('voucher_type', 'receipt')
        .eq('status', 'posted')
        .gte('created_at', startDateFilter)
        .lte('created_at', endDateFilter);

      // Filter by owner if specified
      if (ownerId) {
        query = query.eq('property.owner_id', ownerId);
      }

      const { data: vouchers, error: vouchersError } = await query;

      if (vouchersError) throw vouchersError;

      const totalRentalIncome = vouchers?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

      // Group by month and property
      const monthlyData: { [key: string]: number } = {};
      const propertyData: { [key: string]: { title: string; income: number } } = {};

      vouchers?.forEach(voucher => {
        const date = new Date(voucher.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + voucher.amount;

        if (voucher.property_id && voucher.property) {
          if (!propertyData[voucher.property_id]) {
            propertyData[voucher.property_id] = {
              title: voucher.property.title || 'Unknown Property',
              income: 0
            };
          }
          propertyData[voucher.property_id].income += voucher.amount;
        }
      });

      const monthlyBreakdown = Object.entries(monthlyData).map(([monthKey, income]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long' }),
          year: parseInt(year),
          income
        };
      });

      const propertyBreakdown = Object.entries(propertyData).map(([propertyId, data]) => ({
        propertyId,
        propertyTitle: data.title,
        income: data.income
      }));

      return {
        data: {
          totalRentalIncome,
          monthlyBreakdown,
          propertyBreakdown,
          lastGenerated: new Date().toISOString()
        },
        error: null
      };
    });
  },

  // Owner-specific Maintenance Expenses Report
  async getOwnerMaintenanceExpensesReport(ownerId?: string, startDate?: string, endDate?: string): Promise<ApiResponse<{
    totalMaintenanceExpenses: number;
    monthlyBreakdown: Array<{ month: string; expenses: number; year: number }>;
    propertyBreakdown: Array<{ propertyId: string; propertyTitle: string; expenses: number }>;
    requestBreakdown: Array<{ requestId: string; title: string; cost: number; status: string }>;
    lastGenerated: string;
  }>> {
    return handleApiCall(async () => {
      const startDateFilter = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
      const endDateFilter = endDate || new Date().toISOString();

      // Get maintenance-related payment vouchers
      let voucherQuery = supabase
        .from('vouchers')
        .select(`
          amount,
          created_at,
          property_id,
          description,
          property:properties(id, title, owner_id)
        `)
        .eq('voucher_type', 'payment')
        .eq('status', 'posted')
        .gte('created_at', startDateFilter)
        .lte('created_at', endDateFilter)
        .ilike('description', '%maintenance%');

      if (ownerId) {
        voucherQuery = voucherQuery.eq('property.owner_id', ownerId);
      }

      // Get work orders for maintenance requests
      let workOrderQuery = supabase
        .from('work_orders')
        .select(`
          actual_cost,
          estimated_cost,
          completion_date,
          description,
          status,
          maintenance_request:maintenance_requests(
            id,
            title,
            property:properties(id, title, owner_id)
          )
        `)
        .gte('completion_date', startDateFilter)
        .lte('completion_date', endDateFilter);

      const [vouchersResult, workOrdersResult] = await Promise.all([voucherQuery, workOrderQuery]);

      if (vouchersResult.error) throw vouchersResult.error;
      if (workOrdersResult.error) throw workOrdersResult.error;

      const vouchers = vouchersResult.data || [];
      const workOrders = (workOrdersResult.data || []).filter(wo => 
        !ownerId || wo.maintenance_request?.property?.owner_id === ownerId
      );

      // Combine voucher expenses and work order costs
      const totalVoucherExpenses = vouchers.reduce((sum, v) => sum + (v.amount || 0), 0);
      const totalWorkOrderExpenses = workOrders.reduce((sum, wo) => sum + (wo.actual_cost || wo.estimated_cost || 0), 0);
      const totalMaintenanceExpenses = totalVoucherExpenses + totalWorkOrderExpenses;

      // Group by month and property
      const monthlyData: { [key: string]: number } = {};
      const propertyData: { [key: string]: { title: string; expenses: number } } = {};
      const requestData: Array<{ requestId: string; title: string; cost: number; status: string }> = [];

      // Process vouchers
      vouchers.forEach(voucher => {
        const date = new Date(voucher.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + voucher.amount;

        if (voucher.property_id && voucher.property) {
          if (!propertyData[voucher.property_id]) {
            propertyData[voucher.property_id] = {
              title: voucher.property.title || 'Unknown Property',
              expenses: 0
            };
          }
          propertyData[voucher.property_id].expenses += voucher.amount;
        }
      });

      // Process work orders
      workOrders.forEach(workOrder => {
        const cost = workOrder.actual_cost || workOrder.estimated_cost || 0;
        const date = new Date(workOrder.completion_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + cost;

        const property = workOrder.maintenance_request?.property;
        if (property) {
          if (!propertyData[property.id]) {
            propertyData[property.id] = {
              title: property.title || 'Unknown Property',
              expenses: 0
            };
          }
          propertyData[property.id].expenses += cost;
        }

        // Add to request breakdown
        requestData.push({
          requestId: workOrder.maintenance_request?.id || '',
          title: workOrder.maintenance_request?.title || workOrder.description || 'Maintenance Work',
          cost,
          status: workOrder.status || 'completed'
        });
      });

      const monthlyBreakdown = Object.entries(monthlyData).map(([monthKey, expenses]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long' }),
          year: parseInt(year),
          expenses
        };
      });

      const propertyBreakdown = Object.entries(propertyData).map(([propertyId, data]) => ({
        propertyId,
        propertyTitle: data.title,
        expenses: data.expenses
      }));

      return {
        data: {
          totalMaintenanceExpenses,
          monthlyBreakdown,
          propertyBreakdown,
          requestBreakdown: requestData,
          lastGenerated: new Date().toISOString()
        },
        error: null
      };
    });
  },

  // Manager-specific Cashflow Report (Income + Expenses combined)
  async getManagerCashflowReport(startDate?: string, endDate?: string): Promise<ApiResponse<{
    totalIncome: number;
    totalExpenses: number;
    netCashflow: number;
    monthlyBreakdown: Array<{ 
      month: string; 
      year: number;
      income: number; 
      expenses: number; 
      netCashflow: number; 
    }>;
    lastGenerated: string;
  }>> {
    return handleApiCall(async () => {
      const startDateFilter = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
      const endDateFilter = endDate || new Date().toISOString();

      // Get all posted vouchers for the period
      const { data: vouchers, error: vouchersError } = await supabase
        .from('vouchers')
        .select(`
          amount,
          created_at,
          voucher_type
        `)
        .eq('status', 'posted')
        .gte('created_at', startDateFilter)
        .lte('created_at', endDateFilter);

      if (vouchersError) throw vouchersError;

      const incomeVouchers = vouchers?.filter(v => v.voucher_type === 'receipt') || [];
      const expenseVouchers = vouchers?.filter(v => v.voucher_type === 'payment') || [];

      const totalIncome = incomeVouchers.reduce((sum, v) => sum + (v.amount || 0), 0);
      const totalExpenses = expenseVouchers.reduce((sum, v) => sum + (v.amount || 0), 0);
      const netCashflow = totalIncome - totalExpenses;

      // Group by month
      const monthlyData: { [key: string]: { income: number; expenses: number } } = {};

      incomeVouchers.forEach(voucher => {
        const date = new Date(voucher.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        monthlyData[monthKey].income += voucher.amount;
      });

      expenseVouchers.forEach(voucher => {
        const date = new Date(voucher.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        monthlyData[monthKey].expenses += voucher.amount;
      });

      const monthlyBreakdown = Object.entries(monthlyData).map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long' }),
          year: parseInt(year),
          income: data.income,
          expenses: data.expenses,
          netCashflow: data.income - data.expenses
        };
      });

      return {
        data: {
          totalIncome,
          totalExpenses,
          netCashflow,
          monthlyBreakdown,
          lastGenerated: new Date().toISOString()
        },
        error: null
      };
    });
  },

  // Additional comprehensive reports as requested

  // Summary Reports
  async getSummaryReport(dateRange?: { startDate: string; endDate: string }): Promise<ApiResponse<any>> {
    try {
      const { data: properties } = await supabase.from('properties').select('*');
      const { data: contracts } = await supabase.from('contracts').select('*');
      const { data: vouchers } = await supabase.from('vouchers').select('*');
      const { data: maintenance } = await supabase.from('maintenance_requests').select('*');

      const summary = {
        totalProperties: properties?.length || 0,
        activeContracts: contracts?.filter(c => c.status === 'active').length || 0,
        totalRevenue: vouchers?.filter(v => v.voucher_type === 'receipt' && v.status === 'posted')
          .reduce((sum, v) => sum + Number(v.amount), 0) || 0,
        totalExpenses: vouchers?.filter(v => v.voucher_type === 'payment' && v.status === 'posted')
          .reduce((sum, v) => sum + Number(v.amount), 0) || 0,
        maintenanceRequests: maintenance?.length || 0,
        generatedAt: new Date().toISOString()
      };

      return { data: summary, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to generate summary report' };
    }
  },

  // Invoices Report  
  async getInvoicesReport(dateRange?: { startDate: string; endDate: string }): Promise<ApiResponse<any>> {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          properties(title, address),
          profiles(first_name, last_name)
        `);

      if (dateRange?.startDate && dateRange?.endDate) {
        query = query
          .gte('issue_date', dateRange.startDate)
          .lte('issue_date', dateRange.endDate);
      }

      const { data: invoices, error } = await query;
      if (error) throw error;

      const summary = {
        totalInvoices: invoices?.length || 0,
        totalAmount: invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0,
        paidInvoices: invoices?.filter(inv => inv.status === 'paid').length || 0,
        overdueInvoices: invoices?.filter(inv => inv.status === 'overdue').length || 0,
        invoices: invoices || [],
        generatedAt: new Date().toISOString()
      };

      return { data: summary, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to generate invoices report' };
    }
  },

  // Account Statement
  async getAccountStatement(accountId?: string, dateRange?: { startDate: string; endDate: string }): Promise<ApiResponse<any>> {
    try {
      const { data: vouchers, error } = await supabase
        .from('vouchers')
        .select(`
          *,
          accounts(account_code, account_name),
          properties(title),
          profiles(first_name, last_name)
        `)
        .eq('status', 'posted')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const statement = {
        openingBalance: 0,
        closingBalance: vouchers?.reduce((balance, v) => {
          return v.voucher_type === 'receipt' 
            ? balance + Number(v.amount)
            : balance - Number(v.amount);
        }, 0) || 0,
        transactions: vouchers || [],
        totalDebits: vouchers?.filter(v => v.voucher_type === 'payment')
          .reduce((sum, v) => sum + Number(v.amount), 0) || 0,
        totalCredits: vouchers?.filter(v => v.voucher_type === 'receipt')
          .reduce((sum, v) => sum + Number(v.amount), 0) || 0,
        generatedAt: new Date().toISOString()
      };

      return { data: statement, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to generate account statement' };
    }
  },

  // Financial Statements
  async getFinancialStatements(dateRange?: { startDate: string; endDate: string }): Promise<ApiResponse<any>> {
    try {
      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('*, accounts(account_code, account_name, account_type)')
        .eq('status', 'posted');

      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .order('account_code');

      const revenue = vouchers?.filter(v => v.voucher_type === 'receipt')
        .reduce((sum, v) => sum + Number(v.amount), 0) || 0;
      
      const expenses = vouchers?.filter(v => v.voucher_type === 'payment')
        .reduce((sum, v) => sum + Number(v.amount), 0) || 0;

      const statements = {
        profitLoss: {
          revenue,
          expenses,
          netIncome: revenue - expenses
        },
        balanceSheet: {
          assets: accounts?.filter(a => a.account_type === 'asset') || [],
          liabilities: accounts?.filter(a => a.account_type === 'liability') || [],
          equity: accounts?.filter(a => a.account_type === 'equity') || []
        },
        cashFlow: {
          operatingActivities: revenue - expenses,
          investingActivities: 0,
          financingActivities: 0
        },
        generatedAt: new Date().toISOString()
      };

      return { data: statements, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to generate financial statements' };
    }
  },

  // Payments and Late Tenants Report
  async getPaymentsAndLateTenantsReport(): Promise<ApiResponse<any>> {
    try {
      const { data: contracts } = await supabase
        .from('contracts')
        .select(`
          *,
          properties(title, address),
          profiles(first_name, last_name, phone)
        `)
        .eq('status', 'active');

      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('*')
        .eq('voucher_type', 'receipt')
        .eq('status', 'posted')
        .order('created_at', { ascending: false });

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const latePayments = contracts?.filter(contract => {
        const lastPayment = vouchers?.find(v => v.tenant_id === contract.tenant_id);
        const lastPaymentDate = lastPayment ? new Date(lastPayment.created_at) : new Date(contract.start_date);
        return lastPaymentDate < thirtyDaysAgo;
      }) || [];

      const report = {
        totalContracts: contracts?.length || 0,
        currentTenants: contracts?.length || 0,
        latePayments: latePayments.length,
        onTimePayments: (contracts?.length || 0) - latePayments.length,
        lateTenantsDetails: latePayments.map(contract => ({
          tenantName: `${contract.profiles?.first_name} ${contract.profiles?.last_name}`,
          propertyTitle: contract.properties?.title,
          rentAmount: contract.rent_amount,
          phone: contract.profiles?.phone,
          contractNumber: contract.contract_number,
          daysBehind: Math.floor((now.getTime() - new Date(contract.start_date).getTime()) / (1000 * 60 * 60 * 24))
        })),
        generatedAt: new Date().toISOString()
      };

      return { data: report, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to generate payments and late tenants report' };
    }
  },

  // Vacancies and Offers Report
  async getVacanciesAndOffersReport(): Promise<ApiResponse<any>> {
    try {
      const { data: properties } = await supabase
        .from('properties')
        .select(`
          *,
          profiles(first_name, last_name)
        `);

      const { data: bids } = await supabase
        .from('bids')
        .select(`
          *,
          properties(title, address),
          profiles(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      const vacantProperties = properties?.filter(p => p.status === 'available') || [];
      const reservedProperties = properties?.filter(p => p.status === 'reserved') || [];
      const activeBids = bids?.filter(b => b.bid_status === 'pending') || [];

      const report = {
        totalProperties: properties?.length || 0,
        vacantProperties: vacantProperties.length,
        reservedProperties: reservedProperties.length,
        occupiedProperties: properties?.filter(p => p.status === 'rented').length || 0,
        activeBids: activeBids.length,
        averageVacancyRate: ((vacantProperties.length / (properties?.length || 1)) * 100).toFixed(2),
        vacancyDetails: vacantProperties.map(p => ({
          title: p.title,
          address: p.address,
          price: p.price,
          propertyType: p.property_type,
          daysVacant: Math.floor((new Date().getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        })),
        bidDetails: activeBids.map(b => ({
          propertyTitle: b.properties?.title,
          bidderName: `${b.profiles?.first_name} ${b.profiles?.last_name}`,
          bidAmount: b.bid_amount,
          bidType: b.bid_type,
          createdAt: b.created_at
        })),
        generatedAt: new Date().toISOString()
      };

      return { data: report, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to generate vacancies and offers report' };
    }
  },

  // Property Report
  async getPropertyReport(propertyId?: string): Promise<ApiResponse<any>> {
    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          profiles(first_name, last_name, phone),
          contracts(*, profiles(first_name, last_name)),
          maintenance_requests(*),
          vouchers(*)
        `);

      if (propertyId) {
        query = query.eq('id', propertyId);
      }

      const { data: properties, error } = await query;
      if (error) throw error;

      const report = properties?.map(property => ({
        propertyDetails: {
          title: property.title,
          address: property.address,
          propertyType: property.property_type,
          status: property.status,
          price: property.price,
          area: property.area_sqm,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms
        },
        ownerDetails: {
          name: `${property.profiles?.first_name} ${property.profiles?.last_name}`,
          phone: property.profiles?.phone
        },
        financialSummary: {
          totalRevenue: property.vouchers?.filter(v => v.voucher_type === 'receipt')
            .reduce((sum, v) => sum + Number(v.amount), 0) || 0,
          totalExpenses: property.vouchers?.filter(v => v.voucher_type === 'payment')
            .reduce((sum, v) => sum + Number(v.amount), 0) || 0,
          maintenanceRequests: property.maintenance_requests?.length || 0
        },
        currentTenant: property.contracts?.find(c => c.status === 'active')?.profiles ? {
          name: `${property.contracts.find(c => c.status === 'active')?.profiles?.first_name} ${property.contracts.find(c => c.status === 'active')?.profiles?.last_name}`,
          rentAmount: property.contracts.find(c => c.status === 'active')?.rent_amount
        } : null
      })) || [];

      return { data: { properties: report, generatedAt: new Date().toISOString() }, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to generate property report' };
    }
  },

  // Tenants Statement Report
  async getTenantsStatementReport(ownerId?: string): Promise<ApiResponse<any>> {
    try {
      let propertiesQuery = supabase
        .from('properties')
        .select(`
          *,
          contracts!inner(*,
            profiles(first_name, last_name, phone)
          ),
          vouchers(*)
        `);

      if (ownerId) {
        propertiesQuery = propertiesQuery.eq('owner_id', ownerId);
      }

      const { data: properties, error } = await propertiesQuery;
      if (error) throw error;

      const tenantsStatement = properties?.map(property => {
        const activeContract = property.contracts?.find(c => c.status === 'active');
        const tenantPayments = property.vouchers?.filter(v => 
          v.voucher_type === 'receipt' && v.tenant_id === activeContract?.tenant_id
        ) || [];

        return {
          propertyTitle: property.title,
          tenantName: activeContract ? 
            `${activeContract.profiles?.first_name} ${activeContract.profiles?.last_name}` : 'No Active Tenant',
          tenantPhone: activeContract?.profiles?.phone,
          rentAmount: activeContract?.rent_amount || 0,
          totalPaid: tenantPayments.reduce((sum, v) => sum + Number(v.amount), 0),
          lastPaymentDate: tenantPayments.length > 0 ? 
            Math.max(...tenantPayments.map(v => new Date(v.created_at).getTime())) : null,
          contractStatus: activeContract?.status || 'No Contract'
        };
      }) || [];

      return { 
        data: { 
          tenants: tenantsStatement, 
          generatedAt: new Date().toISOString() 
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: 'Failed to generate tenants statement report' };
    }
  },

  // Owner Financial Report
  async getOwnerFinancialReport(ownerId?: string): Promise<ApiResponse<any>> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          properties(*,
            contracts(*),
            vouchers(*),
            maintenance_requests(*)
          )
        `)
        .eq('role', 'owner');

      if (ownerId) {
        query = query.eq('id', ownerId);
      }

      const { data: owners, error } = await query;
      if (error) throw error;

      const ownerReports = owners?.map(owner => {
        const totalRevenue = owner.properties?.flatMap(p => p.vouchers || [])
          .filter(v => v.voucher_type === 'receipt')
          .reduce((sum, v) => sum + Number(v.amount), 0) || 0;

        const totalExpenses = owner.properties?.flatMap(p => p.vouchers || [])
          .filter(v => v.voucher_type === 'payment')
          .reduce((sum, v) => sum + Number(v.amount), 0) || 0;

        const totalProperties = owner.properties?.length || 0;
        const occupiedProperties = owner.properties?.filter(p => p.status === 'rented').length || 0;

        return {
          ownerName: `${owner.first_name} ${owner.last_name}`,
          ownerPhone: owner.phone,
          totalProperties,
          occupiedProperties,
          vacantProperties: totalProperties - occupiedProperties,
          occupancyRate: totalProperties > 0 ? ((occupiedProperties / totalProperties) * 100).toFixed(2) : '0',
          totalRevenue,
          totalExpenses,
          netIncome: totalRevenue - totalExpenses,
          maintenanceRequests: owner.properties?.flatMap(p => p.maintenance_requests || []).length || 0
        };
      }) || [];

      return { 
        data: { 
          owners: ownerReports, 
          generatedAt: new Date().toISOString() 
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: 'Failed to generate owner financial report' };
    }
  },

  // Owner Full Report
  async getOwnerFullReport(ownerId?: string): Promise<ApiResponse<any>> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          properties(*,
            contracts(*,
              profiles(first_name, last_name, phone)
            ),
            vouchers(*),
            maintenance_requests(*,
              work_orders(*)
            )
          )
        `)
        .eq('role', 'owner');

      if (ownerId) {
        query = query.eq('id', ownerId);
      }

      const { data: owners, error } = await query;
      if (error) throw error;

      const fullReports = owners?.map(owner => ({
        ownerInfo: {
          name: `${owner.first_name} ${owner.last_name}`,
          email: owner.email,
          phone: owner.phone,
          address: owner.address,
          city: owner.city,
          country: owner.country
        },
        propertiesOverview: {
          totalProperties: owner.properties?.length || 0,
          rentedProperties: owner.properties?.filter(p => p.status === 'rented').length || 0,
          availableProperties: owner.properties?.filter(p => p.status === 'available').length || 0,
          maintenanceProperties: owner.properties?.filter(p => p.status === 'maintenance').length || 0
        },
        financialSummary: {
          totalRevenue: owner.properties?.flatMap(p => p.vouchers || [])
            .filter(v => v.voucher_type === 'receipt')
            .reduce((sum, v) => sum + Number(v.amount), 0) || 0,
          totalExpenses: owner.properties?.flatMap(p => p.vouchers || [])
            .filter(v => v.voucher_type === 'payment')
            .reduce((sum, v) => sum + Number(v.amount), 0) || 0,
          maintenanceCosts: owner.properties?.flatMap(p => p.maintenance_requests || [])
            .flatMap(mr => mr.work_orders || [])
            .reduce((sum, wo) => sum + Number(wo.actual_cost || wo.estimated_cost || 0), 0) || 0
        },
        propertiesDetails: owner.properties?.map(property => ({
          title: property.title,
          address: property.address,
          status: property.status,
          price: property.price,
          currentTenant: property.contracts?.find(c => c.status === 'active')?.profiles ? 
            `${property.contracts.find(c => c.status === 'active')?.profiles?.first_name} ${property.contracts.find(c => c.status === 'active')?.profiles?.last_name}` : 'Vacant',
          monthlyRent: property.contracts?.find(c => c.status === 'active')?.rent_amount || 0,
          maintenanceRequests: property.maintenance_requests?.length || 0
        })) || [],
        generatedAt: new Date().toISOString()
      })) || [];

      return { data: { owners: fullReports }, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to generate owner full report' };
    }
  },

  // Electrical Meter Report (placeholder)
  async getElectricalMeterReport(): Promise<ApiResponse<any>> {
    try {
      const { data: utilityPayments } = await supabase
        .from('utility_payments')
        .select(`
          *,
          property:properties(id, title, address, city, owner_id,
            profiles:profiles!properties_owner_id_fkey(first_name, last_name, email, phone)
          )
        `)
        .eq('utility_type', 'electricity')
        .order('reading_date', { ascending: false });

      const meterReadings = utilityPayments?.map(payment => ({
        paymentId: payment.id,
        propertyId: payment.property_id,
        propertyTitle: payment.property?.title || 'Unknown Property',
        propertyAddress: payment.property?.address || '',
        propertyCity: payment.property?.city || '',
        ownerName: payment.property?.profiles ? 
          `${payment.property.profiles.first_name} ${payment.property.profiles.last_name}` : 
          'Unknown Owner',
        ownerEmail: payment.property?.profiles?.email || '',
        ownerPhone: payment.property?.profiles?.phone || '',
        meterNumber: payment.meter_number || 'N/A',
        currentReading: Number(payment.current_reading),
        previousReading: Number(payment.previous_reading),
        consumption: Number(payment.consumption),
        ratePerUnit: Number(payment.rate_per_unit),
        amount: Number(payment.amount),
        readingDate: payment.reading_date,
        dueDate: payment.due_date,
        paymentStatus: payment.payment_status,
        paymentDate: payment.payment_date,
        paymentMethod: payment.payment_method,
        paymentReference: payment.payment_reference,
        notes: payment.notes
      })) || [];

      // Calculate summary statistics
      const totalConsumption = meterReadings.reduce((sum, reading) => sum + reading.consumption, 0);
      const totalAmount = meterReadings.reduce((sum, reading) => sum + reading.amount, 0);
      const pendingAmount = meterReadings
        .filter(r => r.paymentStatus === 'pending')
        .reduce((sum, reading) => sum + reading.amount, 0);
      const overdueAmount = meterReadings
        .filter(r => r.paymentStatus === 'overdue')
        .reduce((sum, reading) => sum + reading.amount, 0);

      const statistics = {
        totalReadings: meterReadings.length,
        totalConsumption,
        averageConsumption: meterReadings.length > 0 ? totalConsumption / meterReadings.length : 0,
        totalAmount,
        pendingAmount,
        overdueAmount,
        paidAmount: totalAmount - pendingAmount - overdueAmount,
        paymentStatusBreakdown: {
          pending: meterReadings.filter(r => r.paymentStatus === 'pending').length,
          paid: meterReadings.filter(r => r.paymentStatus === 'paid').length,
          overdue: meterReadings.filter(r => r.paymentStatus === 'overdue').length
        }
      };

      return { 
        data: { 
          meterReadings,
          statistics,
          generatedAt: new Date().toISOString() 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error generating electrical meter report:', error);
      return { data: null, error: 'Failed to generate electrical meter report' };
    }
  },

  // Owner Classes Report
  async getOwnerClassesReport(): Promise<ApiResponse<any>> {
    try {
      const { data: owners } = await supabase
        .from('profiles')
        .select(`
          *,
          properties(*)
        `)
        .eq('role', 'owner');

      const ownerClasses = owners?.map(owner => {
        const propertyCount = owner.properties?.length || 0;
        let classification = 'Small Owner';
        
        if (propertyCount >= 10) classification = 'Large Owner';
        else if (propertyCount >= 5) classification = 'Medium Owner';
        else if (propertyCount >= 2) classification = 'Regular Owner';

        return {
          ownerName: `${owner.first_name} ${owner.last_name}`,
          email: owner.email,
          phone: owner.phone,
          totalProperties: propertyCount,
          classification,
          nationality: owner.nationality || 'Saudi',
          joinDate: owner.created_at,
          totalPortfolioValue: owner.properties?.reduce((sum, p) => sum + Number(p.price || 0), 0) || 0
        };
      }) || [];

      const classificationSummary = {
        'Small Owner': ownerClasses.filter(o => o.classification === 'Small Owner').length,
        'Regular Owner': ownerClasses.filter(o => o.classification === 'Regular Owner').length,
        'Medium Owner': ownerClasses.filter(o => o.classification === 'Medium Owner').length,
        'Large Owner': ownerClasses.filter(o => o.classification === 'Large Owner').length
      };

      return { 
        data: { 
          owners: ownerClasses,
          classificationSummary,
          totalOwners: ownerClasses.length,
          generatedAt: new Date().toISOString() 
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: 'Failed to generate owner classes report' };
    }
  },

  // Tenants Balance Report
  async getTenantsBalanceReport(): Promise<ApiResponse<any>> {
    try {
      const { data: tenants } = await supabase
        .from('profiles')
        .select(`
          *,
          contracts(*,
            properties(title, address)
          ),
          vouchers(*)
        `)
        .eq('role', 'tenant');

      const tenantBalances = tenants?.map(tenant => {
        const activeContract = tenant.contracts?.find(c => c.status === 'active');
        const payments = tenant.vouchers?.filter(v => v.voucher_type === 'receipt') || [];
        const totalPaid = payments.reduce((sum, v) => sum + Number(v.amount), 0);
        
        // Calculate expected payments based on contract duration
        const monthlyRent = activeContract?.rent_amount || 0;
        const contractStart = activeContract ? new Date(activeContract.start_date) : new Date();
        const monthsSinceStart = Math.max(1, Math.floor((new Date().getTime() - contractStart.getTime()) / (30 * 24 * 60 * 60 * 1000)));
        const expectedTotal = monthlyRent * monthsSinceStart;
        const balance = expectedTotal - totalPaid;

        return {
          tenantName: `${tenant.first_name} ${tenant.last_name}`,
          phone: tenant.phone,
          email: tenant.email,
          propertyTitle: activeContract?.properties?.title || 'No Active Property',
          monthlyRent,
          totalPaid,
          expectedTotal,
          balance,
          status: balance > 0 ? 'Outstanding' : 'Current',
          lastPaymentDate: payments.length > 0 ? 
            new Date(Math.max(...payments.map(p => new Date(p.created_at).getTime()))).toISOString().split('T')[0] : 'No payments',
          contractStatus: activeContract?.status || 'No Contract'
        };
      }) || [];

      const summary = {
        totalTenants: tenantBalances.length,
        currentTenants: tenantBalances.filter(t => t.status === 'Current').length,
        outstandingTenants: tenantBalances.filter(t => t.status === 'Outstanding').length,
        totalOutstanding: tenantBalances.filter(t => t.balance > 0).reduce((sum, t) => sum + t.balance, 0),
        totalPaid: tenantBalances.reduce((sum, t) => sum + t.totalPaid, 0)
      };

      return { 
        data: { 
          tenants: tenantBalances,
          summary,
          generatedAt: new Date().toISOString() 
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: 'Failed to generate tenants balance report' };
    }
  },

  // Add missing filter methods for reports screen
  async getFilteredTenantReport(): Promise<ApiResponse<{ tenants: any[] }>> {
    return handleApiCall(async () => {
      const { data: tenants, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          status
        `)
        .eq('role', 'tenant')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;

      return {
        data: { tenants: tenants || [] },
        error: null
      };
    });
  },

  async getFilteredOwnerFinancialReport(): Promise<ApiResponse<{ owners: any[] }>> {
    return handleApiCall(async () => {
      const { data: owners, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          status
        `)
        .eq('role', 'owner')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;

      return {
        data: { owners: owners || [] },
        error: null
      };
    });
  },

  async getFilteredPropertyReport(): Promise<ApiResponse<{ properties: any[] }>> {
    return handleApiCall(async () => {
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          address,
          city,
          property_type,
          status
        `)
        .order('title');

      if (error) throw error;

      return {
        data: { properties: properties || [] },
        error: null
      };
    });
  }
};

// Bidding API - Complete bidding system for tenants and buyers
export const bidsApi = {
  // Get all bids with filtering and role-based access
  async getAll(filters?: {
    property_id?: string;
    bidder_id?: string;
    bid_type?: 'rental' | 'purchase';
    bid_status?: string;
  }): Promise<ApiResponse<any[]>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to access bids' }
      };
    }

    let query = supabase
      .from('bids')
      .select(`
        *,
        property:properties(id, title, address, city, price, listing_type, owner_id),
        bidder:profiles!bids_bidder_id_fkey(id, first_name, last_name, email, phone),
        manager:profiles!bids_manager_id_fkey(id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    // Role-based filtering
    if (userContext.role === 'tenant' || userContext.role === 'buyer') {
      // Users see only their own bids
      query = query.eq('bidder_id', userContext.userId);
    } else if (userContext.role === 'owner') {
      // Owners see bids on their properties
      query = query.eq('property.owner_id', userContext.userId);
    }
    // Managers/admins see all bids

    // Apply additional filters
    if (filters?.property_id) query = query.eq('property_id', filters.property_id);
    if (filters?.bidder_id) query = query.eq('bidder_id', filters.bidder_id);
    if (filters?.bid_type) query = query.eq('bid_type', filters.bid_type);
    if (filters?.bid_status) query = query.eq('bid_status', filters.bid_status);

    return handleApiCall(() => query);
  },

  // Get bids by property (for property owners and managers)
  async getByProperty(propertyId: string): Promise<ApiResponse<any[]>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to access property bids' }
      };
    }

    return handleApiCall(() => 
      supabase
        .from('bids')
        .select(`
          *,
          property:properties(id, title, address, city, price, listing_type),
          bidder:profiles!bids_bidder_id_fkey(id, first_name, last_name, email, phone, kyc_status),
          manager:profiles!bids_manager_id_fkey(id, first_name, last_name, email)
        `)
        .eq('property_id', propertyId)
        .order('bid_amount', { ascending: false })
    );
  },

  // Create a new bid (for tenants and buyers)
  async create(bidData: {
    property_id: string;
    bid_type: 'rental' | 'purchase';
    bid_amount: number;
    message?: string;
    rental_duration_months?: number;
    security_deposit_amount?: number;
    utilities_included?: boolean;
    move_in_date?: string;
  }): Promise<ApiResponse<any>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to submit bid' }
      };
    }

    // Validate user can bid
    if (!userContext.canBid) {
      return {
        data: null,
        error: { message: 'Your account needs approval before you can submit bids' }
      };
    }

    // Check if property accepts bids
    const { data: property } = await supabase
      .from('properties')
      .select('is_accepting_bids, minimum_bid_amount, maximum_bid_amount, listing_type, status')
      .eq('id', bidData.property_id)
      .single();

    if (!property?.is_accepting_bids || property.status !== 'available') {
      return {
        data: null,
        error: { message: 'This property is not currently accepting bids' }
      };
    }

    // Validate bid amount
    if (property.minimum_bid_amount && bidData.bid_amount < property.minimum_bid_amount) {
      return {
        data: null,
        error: { message: `Bid amount must be at least ${property.minimum_bid_amount} SAR` }
      };
    }

    if (property.maximum_bid_amount && bidData.bid_amount > property.maximum_bid_amount) {
      return {
        data: null,
        error: { message: `Bid amount cannot exceed ${property.maximum_bid_amount} SAR` }
      };
    }

    // Validate bid type matches property listing
    if (property.listing_type !== 'both' && property.listing_type !== bidData.bid_type) {
      return {
        data: null,
        error: { message: `This property is only available for ${property.listing_type}` }
      };
    }

    const bid = {
      property_id: bidData.property_id,
      bidder_id: userContext.userId,
      bid_type: bidData.bid_type,
      bid_amount: bidData.bid_amount,
      message: bidData.message,
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours
      rental_duration_months: bidData.rental_duration_months,
      security_deposit_amount: bidData.security_deposit_amount,
      utilities_included: bidData.utilities_included,
      move_in_date: bidData.move_in_date
    };

    return handleApiCall(() => 
      supabase
        .from('bids')
        .insert(bid)
        .select(`
          *,
          property:properties(id, title, address, city, price),
          bidder:profiles!bids_bidder_id_fkey(id, first_name, last_name, email)
        `)
        .single()
    );
  },

  // Manager approval workflow
  async approveByManager(bidId: string, notes?: string): Promise<ApiResponse<any>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || userContext.role !== 'manager') {
      return {
        data: null,
        error: { message: 'Only managers can approve bids' }
      };
    }

    return handleApiCall(() => 
      supabase
        .from('bids')
        .update({
          bid_status: 'manager_approved',
          manager_approved: true,
          manager_approval_date: new Date().toISOString(),
          manager_id: userContext.userId,
          manager_notes: notes
        })
        .eq('id', bidId)
        .eq('bid_status', 'pending')
        .select()
        .single()
    );
  },

  // Owner approval workflow
  async approveByOwner(bidId: string, notes?: string): Promise<ApiResponse<any>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || userContext.role !== 'owner') {
      return {
        data: null,
        error: { message: 'Only property owners can approve bids' }
      };
    }

    return handleApiCall(() => 
      supabase
        .from('bids')
        .update({
          bid_status: 'accepted',
          owner_approved: true,
          owner_approval_date: new Date().toISOString(),
          owner_notes: notes
        })
        .eq('id', bidId)
        .eq('bid_status', 'manager_approved')
        .select()
        .single()
    );
  },

  // Reject bid
  async reject(bidId: string, reason: string, rejectedBy: 'manager' | 'owner'): Promise<ApiResponse<any>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || (rejectedBy === 'manager' && userContext.role !== 'manager') || 
        (rejectedBy === 'owner' && userContext.role !== 'owner')) {
      return {
        data: null,
        error: { message: 'Insufficient permissions to reject bid' }
      };
    }

    const updateData = {
      bid_status: 'rejected',
      rejection_reason: reason,
      ...(rejectedBy === 'manager' && {
        manager_id: userContext.userId,
        manager_notes: reason,
        manager_approval_date: new Date().toISOString()
      }),
      ...(rejectedBy === 'owner' && {
        owner_notes: reason,
        owner_approval_date: new Date().toISOString()
      })
    };

    return handleApiCall(() => 
      supabase
        .from('bids')
        .update(updateData)
        .eq('id', bidId)
        .select()
        .single()
    );
  },

  // Withdraw bid (for bidders)
  async withdraw(bidId: string): Promise<ApiResponse<any>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to withdraw bid' }
      };
    }

    return handleApiCall(() => 
      supabase
        .from('bids')
        .update({
          bid_status: 'withdrawn',
          updated_at: new Date().toISOString()
        })
        .eq('id', bidId)
        .eq('bidder_id', userContext.userId)
        .in('bid_status', ['pending', 'manager_approved'])
        .select()
        .single()
    );
  }
};

// User Approvals API - User signup and transaction approval workflow
export const userApprovalsApi = {
  // Get pending users for approval
  async getPendingUsers(): Promise<ApiResponse<any[]>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || !['admin', 'manager'].includes(userContext.role)) {
      return {
        data: null,
        error: { message: 'Only managers can view pending users' }
      };
    }

    return handleApiCall(() => 
      supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          role,
          status,
          created_at,
          profile_type
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
    );
  },

  // Get all users with filtering for user management
  async getAllUsers(filters?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<any[]>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || !['admin', 'manager'].includes(userContext.role)) {
      return {
        data: null,
        error: { message: 'Only managers can view all users' }
      };
    }

    let query = supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        role,
        status,
        created_at,
        approved_at,
        approved_by,
        rejected_reason,
        profile_type
      `)
      .order('created_at', { ascending: false });

    if (filters?.role) query = query.eq('role', filters.role);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    return handleApiCall(() => query);
  },

  // Approve user
  async approveUser(userId: string): Promise<ApiResponse<any>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || !['admin', 'manager'].includes(userContext.role)) {
      return {
        data: null,
        error: { message: 'Only managers can approve users' }
      };
    }

    return handleApiCall(async () => {
      // Use the database function for approval
      const { data, error } = await supabase.rpc('approve_user', {
        user_id: userId,
        manager_id: userContext.userId
      });

      if (error) throw error;

      // Return the updated user profile
      return await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    });
  },

  // Reject user
  async rejectUser(userId: string, reason: string): Promise<ApiResponse<any>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || !['admin', 'manager'].includes(userContext.role)) {
      return {
        data: null,
        error: { message: 'Only managers can reject users' }
      };
    }

    return handleApiCall(async () => {
      // Use the database function for rejection
      const { data, error } = await supabase.rpc('reject_user', {
        user_id: userId,
        manager_id: userContext.userId,
        reason: reason
      });

      if (error) throw error;

      // Return the updated user profile
      return await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    });
  },

  // Delete user (soft delete)
  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || !['admin', 'manager'].includes(userContext.role)) {
      return {
        data: null,
        error: { message: 'Only managers can delete users' }
      };
    }

    return handleApiCall(async () => {
      // Use the database function for soft deletion
      const { data, error } = await supabase.rpc('soft_delete_user', {
        user_id: userId,
        deleted_by: userContext.userId
      });

      if (error) throw error;

      return { data: { success: true }, error: null };
    });
  },

  // Get user approval history
  async getUserApprovalHistory(userId: string): Promise<ApiResponse<any[]>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || !['admin', 'manager'].includes(userContext.role)) {
      return {
        data: null,
        error: { message: 'Only managers can view approval history' }
      };
    }

    return handleApiCall(() => 
      supabase
        .from('user_approvals')
        .select(`
          *,
          performed_by_profile:profiles!user_approvals_performed_by_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    );
  },

  // Get audit logs
  async getAuditLogs(entityType?: string, entityId?: string): Promise<ApiResponse<any[]>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || !['admin', 'manager'].includes(userContext.role)) {
      return {
        data: null,
        error: { message: 'Only managers can view audit logs' }
      };
    }

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        performed_by_profile:profiles!audit_logs_performed_by_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (entityType) query = query.eq('entity_type', entityType);
    if (entityId) query = query.eq('entity_id', entityId);

    return handleApiCall(() => query);
  }
};

// Tenant-specific API functions
export const tenantApi = {
  // Get available rental properties for tenants
  async getAvailableRentalProperties(filters?: {
    city?: string;
    property_type?: string;
    min_price?: number;
    max_price?: number;
    bedrooms?: number;
  }): Promise<ApiResponse<any[]>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || userContext.role !== 'tenant') {
      return {
        data: null,
        error: { message: 'Only approved tenants can view rental properties' }
      };
    }

    let query = supabase
      .from('properties')
      .select(`
        *,
        owner:profiles!properties_owner_id_fkey(id, first_name, last_name, email, phone),
        existing_bids:bids(id, bid_amount, bid_status, bidder_id)
      `)
      .eq('status', 'available')
      .eq('is_accepting_bids', true)
      .in('listing_type', ['rent', 'both'])
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.city) query = query.ilike('city', `%${filters.city}%`);
    if (filters?.property_type) query = query.eq('property_type', filters.property_type);
    if (filters?.min_price) query = query.gte('price', filters.min_price);
    if (filters?.max_price) query = query.lte('price', filters.max_price);
    if (filters?.bedrooms) query = query.eq('bedrooms', filters.bedrooms);

    return handleApiCall(() => query);
  },

  // Get tenant's bids
  async getMyBids(): Promise<ApiResponse<any[]>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || userContext.role !== 'tenant') {
      return {
        data: null,
        error: { message: 'Only tenants can view their bids' }
      };
    }

    return handleApiCall(() => 
      supabase
        .from('bids')
        .select(`
          *,
          property:properties(id, title, address, city, price, status, listing_type),
          manager:profiles!bids_manager_id_fkey(id, first_name, last_name, email)
        `)
        .eq('bidder_id', userContext.userId)
        .order('created_at', { ascending: false })
    );
  },

  // Get tenant's rental history and current contracts
  async getMyContracts(): Promise<ApiResponse<any[]>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || userContext.role !== 'tenant') {
      return {
        data: null,
        error: { message: 'Only tenants can view their contracts' }
      };
    }

    return handleApiCall(() => 
      supabase
        .from('contracts')
        .select(`
          *,
          property:properties(id, title, address, city, neighborhood, property_type)
        `)
        .eq('tenant_id', userContext.userId)
        .order('start_date', { ascending: false })
    );
  },

  // Get tenant's maintenance requests
  async getMyMaintenanceRequests(): Promise<ApiResponse<any[]>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || userContext.role !== 'tenant') {
      return {
        data: null,
        error: { message: 'Only tenants can view their maintenance requests' }
      };
    }

    return handleApiCall(() => 
      supabase
        .from('maintenance_requests')
        .select(`
          *,
          property:properties(id, title, address, city),
          work_orders(id, status, estimated_cost, actual_cost, completion_date)
        `)
        .eq('tenant_id', userContext.userId)
        .order('created_at', { ascending: false })
    );
  },

  // Submit maintenance request
  async createMaintenanceRequest(requestData: {
    property_id: string;
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    images?: string[];
  }): Promise<ApiResponse<any>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext || userContext.role !== 'tenant') {
      return {
        data: null,
        error: { message: 'Only tenants can submit maintenance requests' }
      };
    }

    // Verify tenant has active contract for this property
    const { data: contract } = await supabase
      .from('contracts')
      .select('id')
      .eq('tenant_id', userContext.userId)
      .eq('property_id', requestData.property_id)
      .eq('status', 'active')
      .single();

    if (!contract) {
      return {
        data: null,
        error: { message: 'You can only submit maintenance requests for properties you are currently renting' }
      };
    }

    const request = {
      property_id: requestData.property_id,
      tenant_id: userContext.userId,
      title: requestData.title,
      description: requestData.description,
      priority: requestData.priority || 'medium',
      images: requestData.images,
      status: 'pending'
    };

    return handleApiCall(() => 
      supabase
        .from('maintenance_requests')
        .insert(request)
        .select(`
          *,
          property:properties(id, title, address, city)
        `)
        .single()
    );
  }
};

// Bidding System API
export const biddingApi = {
  // Submit a bid on a property
  async submitBid(bidData: {
    property_id: string;
    bidder_id: string;
    bid_type: 'rental' | 'purchase';
    bid_amount: number;
    rental_duration_months?: number;
    security_deposit_amount?: number;
    utilities_included?: boolean;
    message?: string;
    expires_at: string;
  }): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('bids')
        .insert([{
          property_id: bidData.property_id,
          bidder_id: bidData.bidder_id,
          bid_type: bidData.bid_type,
          bid_amount: bidData.bid_amount,
          rental_duration_months: bidData.rental_duration_months,
          security_deposit_amount: bidData.security_deposit_amount,
          utilities_included: bidData.utilities_included,
          message: bidData.message,
          expires_at: bidData.expires_at,
          bid_status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to submit bid' };
    }
  },

  // Get bids for a specific user
  async getMyBids(userId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          property:properties(
            id, title, address, city, property_type, price, annual_rent, images,
            owner:profiles(id, first_name, last_name, phone)
          )
        `)
        .eq('bidder_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch bids' };
    }
  },

  // Get bids on properties owned by a specific user
  async getBidsOnMyProperties(ownerId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          property:properties!inner(
            id, title, address, city, property_type, price, annual_rent
          ),
          bidder:profiles(
            id, first_name, last_name, phone, email, kyc_status, credit_score
          )
        `)
        .eq('property.owner_id', ownerId)
        .in('bid_status', ['pending', 'manager_approved'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch property bids' };
    }
  },

  // Respond to a bid (accept/reject by property owner)
  async respondToBid(bidId: string, response: 'accept' | 'reject', ownerId: string, message?: string): Promise<ApiResponse<any>> {
    try {
      const updateData: any = {
        owner_approved: response === 'accept',
        owner_approval_date: new Date().toISOString(),
        owner_response_message: message,
        bid_status: response === 'accept' ? 'owner_approved' : 'owner_rejected'
      };

      const { data, error } = await supabase
        .from('bids')
        .update(updateData)
        .eq('id', bidId)
        .eq('property.owner_id', ownerId)
        .select(`
          *,
          property:properties(id, title, owner_id),
          bidder:profiles(id, first_name, last_name)
        `)
        .single();

      if (error) throw error;

      // If bid is accepted, create transaction record
      if (response === 'accept' && data) {
        const transactionData = {
          property_id: data.property_id,
          transaction_type: data.bid_type === 'purchase' ? 'sale' : 'rental',
          transaction_amount: data.bid_amount,
          buyer_id: data.bid_type === 'purchase' ? data.bidder_id : null,
          tenant_id: data.bid_type === 'rental' ? data.bidder_id : null,
          previous_owner_id: ownerId,
          bid_id: bidId,
          transaction_status: 'pending'
        };

        await supabase.from('property_transactions').insert([transactionData]);
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to respond to bid' };
    }
  },

  // Get properties available for bidding
  async getPropertiesForBidding(bidType: 'rental' | 'purchase', excludeOwnerId?: string): Promise<ApiResponse<any[]>> {
    try {
      let query = supabase
        .from('properties')
        .select(`
          id, title, description, property_type, address, city, country,
          price, annual_rent, bedrooms, bathrooms, area_sqm, amenities,
          minimum_bid_amount, maximum_bid_amount, is_accepting_bids,
          listing_expires_at, images, is_furnished,
          owner:profiles(id, first_name, last_name, phone)
        `)
        .eq('status', 'available')
        .eq('approval_status', 'approved')
        .eq('is_accepting_bids', true)
        .gt('listing_expires_at', new Date().toISOString());

      if (bidType === 'rental') {
        query = query.in('listing_type', ['rent', 'both']);
      } else {
        query = query.in('listing_type', ['sale', 'both']);
      }

      if (excludeOwnerId) {
        query = query.neq('owner_id', excludeOwnerId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch properties for bidding' };
    }
  }
};

// Property Owner Maintenance API
export const ownerMaintenanceApi = {
  // Get maintenance requests for properties owned by a specific user
  async getMaintenanceRequestsForMyProperties(ownerId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          property:properties!inner(
            id, title, address, city, owner_id
          ),
          tenant:profiles(
            id, first_name, last_name, phone, email
          ),
          work_orders(
            id, status, estimated_cost, actual_cost, start_date, completion_date,
            assigned_to:profiles(id, first_name, last_name, phone)
          )
        `)
        .eq('property.owner_id', ownerId)
        .in('status', ['pending', 'approved', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch maintenance requests' };
    }
  },

  // Create work order for maintenance request
  async createWorkOrder(workOrderData: {
    maintenance_request_id: string;
    assigned_to?: string;
    description: string;
    estimated_cost: number;
    start_date: string;
  }): Promise<ApiResponse<any>> {
    try {
      const { data: workOrder, error: workOrderError } = await supabase
        .from('work_orders')
        .insert([{
          maintenance_request_id: workOrderData.maintenance_request_id,
          assigned_to: workOrderData.assigned_to,
          description: workOrderData.description,
          estimated_cost: workOrderData.estimated_cost,
          start_date: workOrderData.start_date,
          status: 'assigned'
        }])
        .select()
        .single();

      if (workOrderError) throw workOrderError;

      // Update maintenance request status
      const { error: updateError } = await supabase
        .from('maintenance_requests')
        .update({ status: 'approved' })
        .eq('id', workOrderData.maintenance_request_id);

      if (updateError) throw updateError;

      return { success: true, data: workOrder };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create work order' };
    }
  },

  // Get contractors/employees for work order assignment
  async getContractors(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone, email')
        .in('role', ['employee', 'contractor'])
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch contractors' };
    }
  }
};

// Property Management API for Owners
export const ownerPropertyApi = {
  // Get properties owned by a specific user
  async getMyProperties(ownerId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          contracts(
            id, tenant_id, start_date, end_date, rent_amount, status,
            tenant:profiles(id, first_name, last_name, phone)
          )
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch properties' };
    }
  },

  // Create new property listing (requires manager approval)
  async createProperty(propertyData: {
    title: string;
    description: string;
    property_type: string;
    address: string;
    city: string;
    country: string;
    area_sqm: number;
    bedrooms?: number;
    bathrooms?: number;
    price: number;
    annual_rent?: number;
    owner_id: string;
    listing_type: 'rent' | 'sale' | 'both';
    minimum_bid_amount?: number;
    maximum_bid_amount?: number;
    bid_increment?: number;
    listing_expires_at: string;
    amenities?: string[];
    is_furnished?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      // Create property with pending approval status
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert([{
          ...propertyData,
          approval_status: 'pending',
          is_accepting_bids: false, // Will be enabled after approval
          status: 'available'
        }])
        .select()
        .single();

      if (propertyError) throw propertyError;

      // Create approval request
      const { error: approvalError } = await supabase
        .from('user_approvals')
        .insert([{
          approval_type: 'property_listing',
          requested_by: propertyData.owner_id,
          related_entity_type: 'property',
          related_entity_id: property.id,
          expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
        }]);

      if (approvalError) throw approvalError;

      return { success: true, data: property };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create property' };
    }
  },

  // Get property analytics for owner
  async getPropertyAnalytics(propertyId: string, ownerId: string): Promise<ApiResponse<any>> {
    try {
      // Get property details
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('owner_id', ownerId)
        .single();

      if (propertyError) throw propertyError;

      // Get maintenance costs
      const { data: maintenanceCosts, error: maintenanceError } = await supabase
        .from('work_orders')
        .select('actual_cost, estimated_cost')
        .eq('maintenance_request.property_id', propertyId);

      // Get rental income
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('rent_amount, start_date, end_date, status')
        .eq('property_id', propertyId);

      // Get bids
      const { data: bids, error: bidsError } = await supabase
        .from('bids')
        .select('bid_amount, bid_type, bid_status, created_at')
        .eq('property_id', propertyId);

      const totalMaintenanceCosts = maintenanceCosts?.reduce((sum, order) => 
        sum + (order.actual_cost || order.estimated_cost || 0), 0) || 0;

      const monthlyRent = contracts?.find(c => c.status === 'active')?.rent_amount || 0;
      const annualRent = monthlyRent * 12;
      const roi = property.price > 0 ? ((annualRent - totalMaintenanceCosts) / property.price) * 100 : 0;

      const analytics = {
        property,
        monthlyRent,
        annualRent,
        totalMaintenanceCosts,
        roi,
        activeBids: bids?.filter(b => b.bid_status === 'pending').length || 0,
        totalBids: bids?.length || 0,
        occupancyStatus: contracts?.some(c => c.status === 'active') ? 'occupied' : 'vacant'
      };

      return { success: true, data: analytics };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch property analytics' };
    }
  }
};

// User Approval API (for managers)
export const approvalsApi = {
  // Get pending user approvals
  async getPendingUserApprovals(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('user_approvals')
        .select(`
          *,
          profile:profiles(
            id, first_name, last_name, email, phone, role, kyc_status
          )
        `)
        .eq('approval_status', 'pending')
        .eq('approval_type', 'user_signup')
        .order('created_at');

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch pending approvals' };
    }
  },

  // Get pending property approvals
  async getPendingPropertyApprovals(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('user_approvals')
        .select(`
          *,
          property:properties(
            id, title, address, city, property_type, price, listing_type,
            owner:profiles(id, first_name, last_name)
          )
        `)
        .eq('approval_status', 'pending')
        .eq('approval_type', 'property_listing')
        .order('created_at');

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch pending property approvals' };
    }
  },

  // Approve user
  async approveUser(userId: string, managerId: string, notes?: string): Promise<ApiResponse<any>> {
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          approval_status: 'approved',
          approved_by: managerId,
          approval_date: new Date().toISOString(),
          can_bid: true,
          kyc_status: 'verified'
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update approval record
      const { data, error: approvalError } = await supabase
        .from('user_approvals')
        .update({
          approval_status: 'approved',
          approved_by: managerId,
          approval_date: new Date().toISOString(),
          approval_notes: notes
        })
        .eq('related_entity_id', userId)
        .eq('approval_type', 'user_signup')
        .select()
        .single();

      if (approvalError) throw approvalError;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to approve user' };
    }
  },

  // Approve property
  async approveProperty(propertyId: string, managerId: string): Promise<ApiResponse<any>> {
    try {
      // Update property
      const { error: propertyError } = await supabase
        .from('properties')
        .update({
          approval_status: 'approved',
          approved_by: managerId,
          approval_date: new Date().toISOString(),
          is_accepting_bids: true
        })
        .eq('id', propertyId);

      if (propertyError) throw propertyError;

      // Update approval record
      const { data, error: approvalError } = await supabase
        .from('user_approvals')
        .update({
          approval_status: 'approved',
          approved_by: managerId,
          approval_date: new Date().toISOString()
        })
        .eq('related_entity_id', propertyId)
        .eq('approval_type', 'property_listing')
        .select()
        .single();

      if (approvalError) throw approvalError;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to approve property' };
    }
  }
};

// Buyer API (comprehensive buyer functionality)
export const buyerApi = {
  // Get properties available for purchase
  async getBrowseProperties(filters?: {
    city?: string;
    property_type?: string;
    min_price?: number;
    max_price?: number;
    bedrooms?: number;
    listing_type?: 'sale' | 'rent' | 'both';
  }): Promise<ApiResponse<any[]>> {
    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          owner:profiles(id, first_name, last_name, phone),
          bids(id, bid_amount, bid_status, created_at)
        `)
        .eq('status', 'available')
        .eq('approval_status', 'approved')
        .eq('is_accepting_bids', true)
        .gt('listing_expires_at', new Date().toISOString());

      // Apply filters
      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters?.property_type) {
        query = query.eq('property_type', filters.property_type);
      }
      if (filters?.min_price) {
        query = query.gte('price', filters.min_price);
      }
      if (filters?.max_price) {
        query = query.lte('price', filters.max_price);
      }
      if (filters?.bedrooms) {
        query = query.eq('bedrooms', filters.bedrooms);
      }
      if (filters?.listing_type && filters.listing_type !== 'both') {
        query = query.or(`listing_type.eq.${filters.listing_type},listing_type.eq.both`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch properties' };
    }
  },

  // Get buyer's bid history
  async getMyBids(buyerId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          property:properties(
            id, title, address, city, price, images,
            owner:profiles(id, first_name, last_name, phone)
          )
        `)
        .eq('bidder_id', buyerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch bids' };
    }
  },

  // Submit a new bid
  async submitBid(bidData: {
    property_id: string;
    bidder_id: string;
    bid_type: 'purchase' | 'rental';
    bid_amount: number;
    message?: string;
    rental_duration_months?: number;
    security_deposit_amount?: number;
    utilities_included?: boolean;
    move_in_date?: string;
  }): Promise<ApiResponse<any>> {
    try {
      // Check if user can bid
      const { data: profile } = await supabase
        .from('profiles')
        .select('can_bid, approval_status')
        .eq('id', bidData.bidder_id)
        .single();

      if (!profile?.can_bid || profile?.approval_status !== 'approved') {
        throw new Error('User is not approved to submit bids');
      }

      // Check if property is available for bidding
      const { data: property } = await supabase
        .from('properties')
        .select('is_accepting_bids, owner_id, minimum_bid_amount, maximum_bid_amount')
        .eq('id', bidData.property_id)
        .single();

      if (!property?.is_accepting_bids) {
        throw new Error('Property is not accepting bids');
      }

      if (property.owner_id === bidData.bidder_id) {
        throw new Error('Cannot bid on your own property');
      }

      // Validate bid amount
      if (property.minimum_bid_amount && bidData.bid_amount < property.minimum_bid_amount) {
        throw new Error(`Bid amount must be at least ${property.minimum_bid_amount}`);
      }

      if (property.maximum_bid_amount && bidData.bid_amount > property.maximum_bid_amount) {
        throw new Error(`Bid amount cannot exceed ${property.maximum_bid_amount}`);
      }

      // Check for existing active bid
      const { data: existingBid } = await supabase
        .from('bids')
        .select('id')
        .eq('property_id', bidData.property_id)
        .eq('bidder_id', bidData.bidder_id)
        .eq('bid_status', 'pending')
        .single();

      if (existingBid) {
        throw new Error('You already have an active bid on this property');
      }

      // Create the bid
      const { data: bid, error } = await supabase
        .from('bids')
        .insert([{
          property_id: bidData.property_id,
          bidder_id: bidData.bidder_id,
          bid_type: bidData.bid_type,
          bid_amount: bidData.bid_amount,
          message: bidData.message,
          rental_duration_months: bidData.rental_duration_months,
          security_deposit_amount: bidData.security_deposit_amount,
          utilities_included: bidData.utilities_included,
          move_in_date: bidData.move_in_date,
          expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours
          bid_status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: bid };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to submit bid' };
    }
  },

  // Get buyer dashboard data
  async getDashboardData(buyerId: string): Promise<ApiResponse<{
    totalBids: number;
    pendingBids: number;
    acceptedBids: number;
    rejectedBids: number;
    availableProperties: number;
    favoriteProperties: number;
    approvalStatus: string;
    canBid: boolean;
  }>> {
    try {
      // Get bid statistics
      const { data: bids } = await supabase
        .from('bids')
        .select('bid_status')
        .eq('bidder_id', buyerId);

      const bidStats = bids?.reduce((acc, bid) => {
        acc.total++;
        if (bid.bid_status === 'pending' || bid.bid_status === 'manager_approved') acc.pending++;
        else if (bid.bid_status === 'owner_approved') acc.accepted++;
        else if (bid.bid_status === 'rejected') acc.rejected++;
        return acc;
      }, { total: 0, pending: 0, accepted: 0, rejected: 0 }) || { total: 0, pending: 0, accepted: 0, rejected: 0 };

      // Get available properties count
      const { count: availableCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')
        .eq('approval_status', 'approved')
        .eq('is_accepting_bids', true);

      // Get buyer profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('approval_status, can_bid')
        .eq('id', buyerId)
        .single();

      const dashboardData = {
        totalBids: bidStats.total,
        pendingBids: bidStats.pending,
        acceptedBids: bidStats.accepted,
        rejectedBids: bidStats.rejected,
        availableProperties: availableCount || 0,
        favoriteProperties: 0, // TODO: Implement favorites
        approvalStatus: profile?.approval_status || 'pending',
        canBid: profile?.can_bid || false
      };

      return { success: true, data: dashboardData };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' };
    }
  },

  // Withdraw a bid
  async withdrawBid(bidId: string, buyerId: string): Promise<ApiResponse<any>> {
    return handleApiCall(async () => {
      const { data, error } = await supabase
        .from('bids')
        .update({
          bid_status: 'withdrawn',
          withdrawal_date: new Date().toISOString(),
          withdrawal_reason: 'Withdrawn by buyer'
        })
        .eq('id', bidId)
        .eq('bidder_id', buyerId)
        .eq('bid_status', 'pending')
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }
};

// Notifications API
export const notificationsApi = {
  // Get all notifications for current user
  async getAll(filters?: {
    is_read?: boolean;
    notification_type?: string;
    priority?: string;
  }): Promise<ApiResponse<any[]>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to fetch notifications' }
      };
    }

    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!notifications_sender_id_fkey(id, first_name, last_name, email)
      `)
      .eq('recipient_id', userContext.userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.is_read !== undefined) query = query.eq('is_read', filters.is_read);
    if (filters?.notification_type) query = query.eq('notification_type', filters.notification_type);
    if (filters?.priority) query = query.eq('priority', filters.priority);

    return handleApiCall(async () => {
      const result = await query;
      return { data: result.data, error: result.error, count: result.count };
    });
  },

  // Get unread notifications count
  async getUnreadCount(): Promise<ApiResponse<number>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to fetch notification count' }
      };
    }

    return handleApiCall(async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userContext.userId)
        .eq('is_read', false);

      if (error) throw error;
      return { data: count || 0, error: null };
    });
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<ApiResponse<any>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to update notification' }
      };
    }

    return handleApiCall(async () => {
      const result = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', userContext.userId)
        .select()
        .single();
      return { data: result.data, error: result.error };
    });
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<ApiResponse<any>> {
    const userContext = await getCurrentUserContext();
    
    if (!userContext) {
      return {
        data: null,
        error: { message: 'Authentication required to update notifications' }
      };
    }

    return handleApiCall(async () => {
      const result = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('recipient_id', userContext.userId)
        .eq('is_read', false);
      return { data: result.data, error: result.error };
    });
  },

  // Create notification
  async create(notification: {
    recipient_id: string;
    sender_id?: string;
    notification_type: string;
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high';
    related_entity_type?: string;
    related_entity_id?: string;
  }): Promise<ApiResponse<any>> {
    return handleApiCall(async () => {
      const result = await supabase
        .from('notifications')
        .insert({
          ...notification,
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      return { data: result.data, error: result.error };
    });
  }
};

// Add these interfaces after the existing interfaces
interface ReportFilters {
  tenantId?: string;
  ownerId?: string;
  propertyId?: string;
  reportType?: string;
  startDate?: string;
  endDate?: string;
}

interface UserContext {
  userId: string;
  role: 'admin' | 'manager' | 'owner' | 'tenant';
  ownedPropertyIds?: string[];
}



// Enhanced Reports API with role-based access control
export const enhancedReportsApi = {
  // Enhanced Revenue Report with role-based filtering
  async getRevenueReport(userContext: UserContext, filters: ReportFilters = {}): Promise<ApiResponse<any>> {
    try {
      let query = supabase
        .from('vouchers')
        .select(`
          *,
          property:properties(title, owner_id)
        `)
        .eq('voucher_type', 'receipt')
        .eq('status', 'posted');

      // Apply role-based filtering
      if (userContext.role === 'owner') {
        if (userContext.ownedPropertyIds) {
          query = query.in('property_id', userContext.ownedPropertyIds);
        } else {
          return { success: true, data: { revenue: [], summary: { total: 0, byProperty: {} } } };
        }
      }

      if (filters.ownerId && userContext.role === 'manager') {
        const { data: ownerProperties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', filters.ownerId);
        
        if (ownerProperties) {
          query = query.in('property_id', ownerProperties.map(p => p.id));
        }
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data: revenue, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const total = revenue?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      const byProperty = revenue?.reduce((acc, r) => {
        const propertyTitle = r.property?.title || 'Unknown Property';
        acc[propertyTitle] = (acc[propertyTitle] || 0) + (r.amount || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        success: true,
        data: {
          revenue: revenue || [],
          summary: { total, byProperty },
          lastGenerated: new Date().toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get revenue report' };
    }
  },

  // Enhanced Property Report for single property
  async getPropertyReport(userContext: UserContext, filters: ReportFilters): Promise<ApiResponse<any>> {
    try {
      if (!filters.propertyId) {
        return { success: false, error: 'Property ID is required' };
      }

      // Check if user has access to this property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select(`
          *,
          owner:profiles!owner_id(first_name, last_name, email),
          contracts(*, tenant:profiles!tenant_id(first_name, last_name)),
          maintenance_requests(*, work_orders(*))
        `)
        .eq('id', filters.propertyId)
        .single();

      if (propertyError) throw propertyError;

      // Role-based access control
      if (userContext.role === 'owner' && property.owner_id !== userContext.userId) {
        return { success: false, error: 'Access denied: Not your property' };
      }

      // Get financial data for this property
      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('*')
        .eq('property_id', filters.propertyId);

      const revenue = vouchers?.filter(v => v.voucher_type === 'receipt' && v.status === 'posted')
        .reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

      const expenses = vouchers?.filter(v => v.voucher_type === 'payment' && v.status === 'posted')
        .reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

      return {
        success: true,
        data: {
          property,
          financials: { revenue, expenses, netIncome: revenue - expenses },
          contracts: property.contracts || [],
          maintenance: property.maintenance_requests || [],
          lastGenerated: new Date().toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get property report' };
    }
  },

  // Enhanced Tenant Statement with role-based filtering
  async getTenantStatement(userContext: UserContext, filters: ReportFilters): Promise<ApiResponse<any>> {
    try {
      if (!filters.tenantId) {
        return { success: false, error: 'Tenant ID is required' };
      }

      // Get tenant contracts and check access
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          *,
          property:properties(*, owner:profiles!owner_id(first_name, last_name)),
          tenant:profiles!tenant_id(first_name, last_name, email)
        `)
        .eq('tenant_id', filters.tenantId);

      if (contractsError) throw contractsError;

      // Role-based access control
      if (userContext.role === 'owner') {
        const accessibleContracts = contracts?.filter(c => 
          c.property?.owner_id === userContext.userId
        ) || [];
        
        if (accessibleContracts.length === 0) {
          return { success: false, error: 'Access denied: Tenant not associated with your properties' };
        }
      }

      // Get payment history
      const { data: payments } = await supabase
        .from('vouchers')
        .select(`
          *,
          property:properties(title)
        `)
        .eq('tenant_id', filters.tenantId)
        .eq('voucher_type', 'receipt');

      const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const lastPayment = payments?.[0]?.created_at;

      return {
        success: true,
        data: {
          tenant: contracts?.[0]?.tenant,
          contracts: contracts || [],
          payments: payments || [],
          summary: { totalPaid, lastPayment },
          lastGenerated: new Date().toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get tenant statement' };
    }
  },

  // Enhanced Owner Financial Report
  async getOwnerFinancialReport(userContext: UserContext, filters: ReportFilters): Promise<ApiResponse<any>> {
    try {
      if (!filters.ownerId) {
        return { success: false, error: 'Owner ID is required' };
      }

      // Role-based access control
      if (userContext.role === 'owner' && filters.ownerId !== userContext.userId) {
        return { success: false, error: 'Access denied: Can only view your own financial report' };
      }

      // Get owner's properties and financial data
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          *,
          contracts(*),
          vouchers(*)
        `)
        .eq('owner_id', filters.ownerId);

      if (propertiesError) throw propertiesError;

      const totalRevenue = properties?.reduce((sum, p) => {
        const propertyRevenue = p.vouchers?.filter(v => v.voucher_type === 'receipt' && v.status === 'posted')
          .reduce((pSum, v) => pSum + (v.amount || 0), 0) || 0;
        return sum + propertyRevenue;
      }, 0) || 0;

      const totalExpenses = properties?.reduce((sum, p) => {
        const propertyExpenses = p.vouchers?.filter(v => v.voucher_type === 'payment' && v.status === 'posted')
          .reduce((pSum, v) => pSum + (v.amount || 0), 0) || 0;
        return sum + propertyExpenses;
      }, 0) || 0;

      return {
        success: true,
        data: {
          ownerId: filters.ownerId,
          properties: properties || [],
          summary: {
            totalProperties: properties?.length || 0,
            totalRevenue,
            totalExpenses,
            netIncome: totalRevenue - totalExpenses
          },
          lastGenerated: new Date().toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get owner financial report' };
    }
  },

  // Enhanced Late Payments Report
  async getPaymentsAndLateTenantsReport(userContext: UserContext, filters: ReportFilters = {}): Promise<ApiResponse<any>> {
    try {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          property:properties(*, owner_id),
          tenant:profiles!tenant_id(first_name, last_name, email),
          vouchers:vouchers!property_id(*)
        `)
        .eq('status', 'active');

      // Apply role-based filtering
      if (userContext.role === 'owner') {
        if (userContext.ownedPropertyIds) {
          query = query.in('property_id', userContext.ownedPropertyIds);
        } else {
          return { success: true, data: { latePayments: [], summary: { totalLate: 0, totalOverdue: 0 } } };
        }
      }

      if (filters.ownerId && userContext.role === 'manager') {
        const { data: ownerProperties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', filters.ownerId);
        
        if (ownerProperties) {
          query = query.in('property_id', ownerProperties.map(p => p.id));
        }
      }

      const { data: contracts, error } = await query;

      if (error) throw error;

      // Calculate payment status for each contract
      const paymentStatus = contracts?.map(contract => {
        const lastPayment = contract.vouchers
          ?.filter(v => v.voucher_type === 'receipt' && v.status === 'posted')
          ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.[0];

        const daysSinceLastPayment = lastPayment 
          ? Math.floor((new Date().getTime() - new Date(lastPayment.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          ...contract,
          lastPayment,
          daysSinceLastPayment,
          status: !lastPayment ? 'no_payments' : 
                  daysSinceLastPayment > 60 ? 'overdue' :
                  daysSinceLastPayment > 30 ? 'late' : 'current'
        };
      }) || [];

      const latePayments = paymentStatus.filter(p => p.status === 'late' || p.status === 'overdue');

      return {
        success: true,
        data: {
          latePayments,
          summary: {
            totalLate: latePayments.filter(p => p.status === 'late').length,
            totalOverdue: latePayments.filter(p => p.status === 'overdue').length
          },
          lastGenerated: new Date().toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get payments and late tenants report' };
    }
  },

  // ... existing methods remain the same for backward compatibility ...
};

// Utility Payments API - For managing electrical and other utility payments
export const utilityPaymentsApi = {
  // Get all utility payments with filtering
  async getAll(filters?: {
    property_id?: string;
    utility_type?: string;
    payment_status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<any[]>> {
    return handleApiCall(async () => {
      let query = supabase
        .from('utility_payments')
        .select(`
          *,
          property:properties(id, title, address, city),
          uploaded_by_profile:profiles!utility_payments_uploaded_by_fkey(first_name, last_name)
        `)
        .order('reading_date', { ascending: false });

      if (filters?.property_id) query = query.eq('property_id', filters.property_id);
      if (filters?.utility_type) query = query.eq('utility_type', filters.utility_type);
      if (filters?.payment_status) query = query.eq('payment_status', filters.payment_status);
      if (filters?.start_date) query = query.gte('reading_date', filters.start_date);
      if (filters?.end_date) query = query.lte('reading_date', filters.end_date);

      return query;
    });
  },

  // Upload new electrical payment data
  async uploadElectricalPayment(paymentData: {
    property_id: string;
    meter_number?: string;
    previous_reading: number;
    current_reading: number;
    rate_per_unit?: number;
    reading_date: string;
    due_date?: string;
    payment_status?: 'pending' | 'paid' | 'overdue';
    payment_date?: string;
    payment_method?: string;
    payment_reference?: string;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    return handleApiCall(async () => {
      const userContext = await getCurrentUserContext();
      
      if (!userContext || !['admin', 'manager'].includes(userContext.role)) {
        throw new Error('Only property managers and admins can upload electrical payments');
      }

      const insertData = {
        ...paymentData,
        utility_type: 'electricity',
        rate_per_unit: paymentData.rate_per_unit || 0.18, // Default SAR per kWh
        uploaded_by: userContext.userId
      };

      return supabase
        .from('utility_payments')
        .insert(insertData)
        .select(`
          *,
          property:properties(id, title, address)
        `)
        .single();
    });
  },

  // Bulk upload electrical payments (CSV import functionality)
  async bulkUploadElectricalPayments(payments: Array<{
    property_id: string;
    meter_number?: string;
    previous_reading: number;
    current_reading: number;
    reading_date: string;
    due_date?: string;
    notes?: string;
  }>): Promise<ApiResponse<any[]>> {
    return handleApiCall(async () => {
      const userContext = await getCurrentUserContext();
      
      if (!userContext || !['admin', 'manager'].includes(userContext.role)) {
        throw new Error('Only property managers and admins can bulk upload electrical payments');
      }

      const insertData = payments.map(payment => ({
        ...payment,
        utility_type: 'electricity',
        rate_per_unit: 0.18, // Default SAR per kWh
        uploaded_by: userContext.userId,
        payment_status: 'pending'
      }));

      return supabase
        .from('utility_payments')
        .insert(insertData)
        .select(`
          *,
          property:properties(id, title, address)
        `);
    });
  },

  // Update payment status (when payment is made)
  async updatePaymentStatus(paymentId: string, updates: {
    payment_status: 'pending' | 'paid' | 'overdue';
    payment_date?: string;
    payment_method?: string;
    payment_reference?: string;
    voucher_id?: string;
  }): Promise<ApiResponse<any>> {
    return handleApiCall(async () => {
      return supabase
        .from('utility_payments')
        .update(updates)
        .eq('id', paymentId)
        .select()
        .single();
    });
  },

  // Get electrical payments by property
  async getByProperty(propertyId: string): Promise<ApiResponse<any[]>> {
    return handleApiCall(async () => {
      return supabase
        .from('utility_payments')
        .select(`
          *,
          property:properties(id, title, address)
        `)
        .eq('property_id', propertyId)
        .eq('utility_type', 'electricity')
        .order('reading_date', { ascending: false });
    });
  },

  // Get overdue payments
  async getOverduePayments(): Promise<ApiResponse<any[]>> {
    return handleApiCall(async () => {
      return supabase
        .from('utility_payments')
        .select(`
          *,
          property:properties(id, title, address, owner_id),
          property.profiles:properties!property_id(first_name, last_name, email, phone)
        `)
        .eq('payment_status', 'overdue')
        .order('due_date', { ascending: true });
    });
  },

  // Get utility payment statistics
  async getStatistics(): Promise<ApiResponse<{
    totalPayments: number;
    pendingPayments: number;
    paidPayments: number;
    overduePayments: number;
    totalAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    averageConsumption: number;
  }>> {
    return handleApiCall(async () => {
      const { data: payments } = await supabase
        .from('utility_payments')
        .select('payment_status, amount, consumption')
        .eq('utility_type', 'electricity');

      if (!payments) return { data: null, error: null };

      const stats = {
        totalPayments: payments.length,
        pendingPayments: payments.filter(p => p.payment_status === 'pending').length,
        paidPayments: payments.filter(p => p.payment_status === 'paid').length,
        overduePayments: payments.filter(p => p.payment_status === 'overdue').length,
        totalAmount: payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
        pendingAmount: payments.filter(p => p.payment_status === 'pending')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0),
        overdueAmount: payments.filter(p => p.payment_status === 'overdue')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0),
        averageConsumption: payments.length > 0 ? 
          payments.reduce((sum, p) => sum + Number(p.consumption || 0), 0) / payments.length : 0
      };

      return { data: stats, error: null };
    });
  }
};

// Export all APIs
export default {
  properties: propertiesApi,
  profiles: profilesApi,
  contracts: contractsApi,
  maintenance: maintenanceApi,
  accounts: accountsApi,
  costCenters: costCentersApi,
  vouchers: vouchersApi,
  invoices: invoicesApi,
  issues: issuesApi,
  documents: documentsApi,
  clients: clientsApi,
  reservations: reservationsApi,
  reports: reportsApi,
  bids: bidsApi,
  userApprovals: userApprovalsApi,
  tenant: tenantApi,
  bidding: biddingApi,
  ownerMaintenance: ownerMaintenanceApi,
  ownerProperty: ownerPropertyApi,
  approvals: approvalsApi,
  buyer: buyerApi,
  notifications: notificationsApi,
  utilityPayments: utilityPaymentsApi,
  enhancedReports: enhancedReportsApi,
}; 

// Add specialized methods for report filters (bypass security for dropdown options)
export const reportFiltersApi = {
  // Get all tenants for report filtering (bypasses security)
  async getAllTenantsForReports(): Promise<ApiResponse<any[]>> {
    return handleApiCall(() => 
      supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          status
        `)
        .eq('role', 'tenant')
        .eq('status', 'active')
        .order('first_name')
    );
  },

  // Get all owners for report filtering (bypasses security)
  async getAllOwnersForReports(): Promise<ApiResponse<any[]>> {
    return handleApiCall(() => 
      supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          status
        `)
        .eq('role', 'owner')
        .eq('status', 'active')
        .order('first_name')
    );
  },

  // Get all properties for report filtering (bypasses security)
  async getAllPropertiesForReports(): Promise<ApiResponse<any[]>> {
    return handleApiCall(() => 
      supabase
        .from('properties')
        .select(`
          id,
          title,
          address,
          city,
          status,
          property_type
        `)
        .neq('status', 'deleted')
        .order('title')
    );
  }
}; 