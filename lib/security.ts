import { supabase } from './supabase';
import { UserContext, UserRole, SecurityConfig } from './types';
import { Tables } from './database.types';

// Security configuration
const SECURITY_CONFIG: SecurityConfig = {
  enableRoleBasedAccess: true,
  bypassForAdmin: true,
  logAccessAttempts: true,
};

/**
 * Get current authenticated user context with role and property relationships
 */
export async function getCurrentUserContext(): Promise<UserContext | null> {
  try {
    // Get current authenticated user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('[Security] No authenticated user found:', authError?.message);
      return null;
    }

    // Get user profile with role information
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // If profile doesn't exist, create one automatically
    if (profileError && profileError.code === 'PGRST116') { // No rows returned
      console.log('[Security] No profile found for user, creating default profile...');
      
      // Extract role from auth metadata or default to tenant
      const defaultRole = user.user_metadata?.role || user.app_metadata?.role || 'tenant';
      const defaultProfileType = user.user_metadata?.profile_type || user.app_metadata?.profile_type || 'tenant';
      
      // Create profile record
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          role: defaultRole,
          profile_type: defaultProfileType,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.error('[Security] Failed to create user profile:', createError.message);
        return null;
      }

      profile = newProfile;
      console.log('[Security] Created new profile for user:', { 
        userId: user.id, 
        role: defaultRole, 
        profileType: defaultProfileType 
      });
    } else if (profileError) {
      console.error('[Security] Failed to fetch user profile:', profileError.message);
      return null;
    }

    if (!profile) {
      console.error('[Security] No profile data available');
      return null;
    }

    // Build user context
    const userContext: UserContext = {
      userId: user.id,
      role: profile.role as UserRole,
      profileType: profile.profile_type,
      isAuthenticated: true,
    };

    // For owners, get their property IDs
    if (profile.role === 'owner') {
      const { data: ownedProperties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);
      
      userContext.ownedPropertyIds = ownedProperties?.map(p => p.id) || [];
    }

    // For tenants, get their rented property IDs
    if (profile.role === 'tenant') {
      const { data: contracts } = await supabase
        .from('contracts')
        .select('property_id')
        .eq('tenant_id', user.id)
        .eq('status', 'active');
      
      userContext.rentedPropertyIds = contracts?.map(c => c.property_id) || [];
    }

    if (SECURITY_CONFIG.logAccessAttempts) {
      console.log('[Security] User context loaded:', {
        userId: userContext.userId,
        role: userContext.role,
        profileType: userContext.profileType,
        propertiesOwned: userContext.ownedPropertyIds?.length || 0,
        propertiesRented: userContext.rentedPropertyIds?.length || 0,
      });
    }

    return userContext;
  } catch (error) {
    console.error('[Security] Error getting user context:', error);
    return null;
  }
}

/**
 * Check if user has access to a specific property
 */
export function hasPropertyAccess(userContext: UserContext, propertyId: string): boolean {
  if (!userContext.isAuthenticated) return false;
  
  // Admins have access to everything
  if (SECURITY_CONFIG.bypassForAdmin && (userContext.role === 'admin' || userContext.role === 'manager')) {
    return true;
  }

  // Owners have access to their properties
  if (userContext.role === 'owner' && userContext.ownedPropertyIds?.includes(propertyId)) {
    return true;
  }

  // Tenants have access to their rented properties
  if (userContext.role === 'tenant' && userContext.rentedPropertyIds?.includes(propertyId)) {
    return true;
  }

  return false;
}

/**
 * Build role-based WHERE clause for Supabase queries
 */
export function buildRoleBasedFilter(userContext: UserContext | null, tableName: string): any {
  if (!userContext || !SECURITY_CONFIG.enableRoleBasedAccess) {
    return null; // No filtering
  }

  // Admins bypass all filters
  if (SECURITY_CONFIG.bypassForAdmin && (userContext.role === 'admin' || userContext.role === 'manager')) {
    return null;
  }

  switch (tableName) {
    case 'properties':
      return buildPropertiesFilter(userContext);
    
    case 'profiles':
      return buildProfilesFilter(userContext);
    
    case 'contracts':
      return buildContractsFilter(userContext);
    
    case 'maintenance_requests':
      return buildMaintenanceFilter(userContext);
    
    case 'vouchers':
      return buildVouchersFilter(userContext);
    
    case 'invoices':
      return buildInvoicesFilter(userContext);
    
    default:
      console.warn(`[Security] No filter defined for table: ${tableName}`);
      return null;
  }
}

/**
 * Properties filtering logic
 */
function buildPropertiesFilter(userContext: UserContext): any {
  switch (userContext.role) {
    case 'owner':
      // Owners see only their properties
      return { owner_id: userContext.userId };
    
    case 'tenant':
      // Tenants see their rented properties + available properties
      return {
        or: [
          { status: 'available' },
          { id: { in: userContext.rentedPropertyIds || [] } }
        ]
      };
    
    default:
      return null;
  }
}

/**
 * Profiles filtering logic
 */
function buildProfilesFilter(userContext: UserContext): any {
  switch (userContext.role) {
    case 'owner':
      // Owners see only tenants of their properties
      return {
        or: [
          { id: userContext.userId }, // Their own profile
          { 
            id: { in: [] } // Will be populated with tenant IDs from contracts query
          }
        ]
      };
    
    case 'tenant':
      // Tenants see only their own profile
      return { id: userContext.userId };
    
    default:
      return null;
  }
}

/**
 * Contracts filtering logic
 */
function buildContractsFilter(userContext: UserContext): any {
  switch (userContext.role) {
    case 'owner':
      // Owners see contracts for their properties
      return { property_id: { in: userContext.ownedPropertyIds || [] } };
    
    case 'tenant':
      // Tenants see only their contracts
      return { tenant_id: userContext.userId };
    
    default:
      return null;
  }
}

/**
 * Maintenance requests filtering logic
 */
function buildMaintenanceFilter(userContext: UserContext): any {
  switch (userContext.role) {
    case 'owner':
      // Owners see maintenance requests for their properties
      return { property_id: { in: userContext.ownedPropertyIds || [] } };
    
    case 'tenant':
      // Tenants see only their maintenance requests
      return { tenant_id: userContext.userId };
    
    default:
      return null;
  }
}

/**
 * Vouchers filtering logic
 */
function buildVouchersFilter(userContext: UserContext): any {
  switch (userContext.role) {
    case 'owner':
      // Owners see vouchers related to their properties
      return { property_id: { in: userContext.ownedPropertyIds || [] } };
    
    case 'tenant':
      // Tenants see vouchers where they are the tenant
      return { tenant_id: userContext.userId };
    
    default:
      return null;
  }
}

/**
 * Invoices filtering logic
 */
function buildInvoicesFilter(userContext: UserContext): any {
  switch (userContext.role) {
    case 'owner':
      // Owners see invoices for their properties
      return { property_id: { in: userContext.ownedPropertyIds || [] } };
    
    case 'tenant':
      // Tenants see only their invoices
      return { tenant_id: userContext.userId };
    
    default:
      return null;
  }
}

/**
 * Validate if user can perform an action on a resource
 */
export function validateUserAction(userContext: UserContext | null, action: string, resourceType: string, resourceId?: string): boolean {
  if (!userContext || !userContext.isAuthenticated) {
    console.warn(`[Security] Unauthorized action attempt: ${action} on ${resourceType}`);
    return false;
  }

  // Admins can do everything
  if (SECURITY_CONFIG.bypassForAdmin && (userContext.role === 'admin' || userContext.role === 'manager')) {
    return true;
  }

  // Implement action-specific validation
  switch (action) {
    case 'create_property':
      return userContext.role === 'owner';
    
    case 'edit_property':
      return userContext.role === 'owner' && resourceId && hasPropertyAccess(userContext, resourceId);
    
    case 'create_maintenance_request':
      return userContext.role === 'tenant' && resourceId && hasPropertyAccess(userContext, resourceId);
    
    case 'view_financial_reports':
      return userContext.role === 'owner';
    
    default:
      console.warn(`[Security] Unknown action: ${action}`);
      return false;
  }
}

/**
 * Security middleware for API calls
 */
export function withSecurity<T>(apiFunction: (userContext: UserContext | null, ...args: any[]) => Promise<T>) {
  return async (...args: any[]): Promise<T> => {
    const userContext = await getCurrentUserContext();
    
    if (SECURITY_CONFIG.logAccessAttempts) {
      console.log(`[Security] API call with user context:`, {
        userId: userContext?.userId,
        role: userContext?.role,
        authenticated: userContext?.isAuthenticated,
      });
    }

    return apiFunction(userContext, ...args);
  };
}

/**
 * Apply security filter to a Supabase query
 */
export function applySecurityFilter(query: any, userContext: UserContext | null, tableName: string): any {
  const filter = buildRoleBasedFilter(userContext, tableName);
  
  if (!filter) {
    return query; // No filtering needed
  }

  // Apply the filter to the query
  if (filter.or) {
    // Handle OR conditions
    return query.or(filter.or.map((condition: any) => {
      const key = Object.keys(condition)[0];
      const value = condition[key];
      return `${key}.eq.${value}`;
    }).join(','));
  } else {
    // Handle simple conditions
    const key = Object.keys(filter)[0];
    const value = filter[key];
    
    if (typeof value === 'object' && value.in) {
      return query.in(key, value.in);
    } else {
      return query.eq(key, value);
    }
  }
}

// Export security configuration for testing
export { SECURITY_CONFIG }; 