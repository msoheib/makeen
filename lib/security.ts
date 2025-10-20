import { supabase } from './supabase';
import { profileService } from './profileService';
import { UserContext, UserRole, SecurityConfig } from './types';
import { Tables } from './database.types';

// User context cache to prevent repeated database queries
let userContextCache: { [userId: string]: { context: UserContext; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Security configuration
const SECURITY_CONFIG: SecurityConfig = {
  enableRoleBasedAccess: true,
  bypassForAdmin: true,
  logAccessAttempts: true,
};

/**
 * Get current authenticated user context with role and property relationships
 * Uses caching to prevent repeated database queries
 */
export async function getCurrentUserContext(): Promise<UserContext | null> {
  try {
    // Get current authenticated user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    // Check cache first
    const cached = userContextCache[user.id];
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.context;
    }

    // Get user profile with role information
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // If profile doesn't exist, use centralized profile service to ensure it exists
    if (profileError && profileError.code === 'PGRST116') { // No rows returned

      try {
        // Use centralized profile service to ensure profile exists
        profile = await profileService.ensureProfileExists(user.id, {
          email: user.email || '',
          first_name: user.user_metadata?.first_name || user.first_name || 'Demo',
          last_name: user.user_metadata?.last_name || user.last_name || 'Admin',
          phone: user.user_metadata?.phone || user.phone || '',
          role: user.user_metadata?.role || user.app_metadata?.role || 'admin',
        });
      } catch (error) {
        console.error('[Security] Failed to ensure user profile exists:', error);
        return null;
      }
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

    // For tenants, get their rented property IDs with optimized query
    if (profile.role === 'tenant') {
      // Use a more efficient query with proper date handling and timeout
      const contractsPromise = supabase
        .from('contracts')
        .select('property_id')
        .eq('tenant_id', user.id)
        .eq('status', 'active')
        .lte('start_date', 'now()')  // Use SQL function instead of JS date
        .gte('end_date', 'now()');   // Use SQL function instead of JS date
      
      // Add timeout for this specific query
      const { data: contracts, error: contractsError } = await Promise.race([
        contractsPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Tenant contracts query timeout')), 10000)
        )
      ]) as any;
      
      if (contractsError) {
        userContext.rentedPropertyIds = [];
      } else if (contracts) {
        userContext.rentedPropertyIds = contracts.map(c => c.property_id);
      } else {
        userContext.rentedPropertyIds = [];
      }
    }

    // Cache the result
    userContextCache[user.id] = {
      context: userContext,
      timestamp: Date.now()
    };

    return userContext;
  } catch (err: any) {
    console.error('[Security] Error getting user context:', err);
    // Do not reference undefined variables here; return null to force re-auth or retry upstream
    return null;
  }
}

/**
 * Clear user context cache (call when user logs out or profile changes)
 */
export function clearUserContextCache(userId?: string): void {
  if (userId) {
    delete userContextCache[userId];
  } else {
    userContextCache = {};
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

  // Accountants have access to financial data and reports only
  if (userContext.role === 'accountant') {
    return buildAccountantFilter(userContext, tableName);
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
      // **SECURITY**: Tenants see ONLY their rented properties (licensing restriction)
      return { id: { in: userContext.rentedPropertyIds || [] } };
    
    case 'buyer':
      // **SECURITY**: Buyers see ONLY properties they have relationships with (licensing restriction)
      // TODO: Implement buyer property relationships (reservations, bids, purchases)
      return { id: { in: [] } }; // Empty for now - no properties visible
    
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

/**
 * Accountant filtering logic - accountants can only access financial data and reports
 */
function buildAccountantFilter(userContext: UserContext, tableName: string): any {
  switch (tableName) {
    case 'vouchers':
      // Accountants can see all vouchers for financial reporting
      return null; // No filtering - access to all financial data
    
    case 'invoices':
      // Accountants can see all invoices for financial reporting
      return null; // No filtering - access to all financial data
    
    case 'accounts':
      // Accountants can see all accounts for chart of accounts
      return null; // No filtering - access to all accounts
    
    case 'cost_centers':
      // Accountants can see all cost centers
      return null; // No filtering - access to all cost centers
    
    case 'fixed_assets':
      // Accountants can see all fixed assets for depreciation reports
      return null; // No filtering - access to all assets
    
    case 'utility_payments':
      // Accountants can see all utility payments for billing reports
      return null; // No filtering - access to all utility data
    
    case 'property_metrics':
      // Accountants can see all property metrics for financial analysis
      return null; // No filtering - access to all metrics
    
    case 'budgets':
      // Accountants can see all budgets for financial planning
      return null; // No filtering - access to all budgets
    
    case 'property_transactions':
      // Accountants can see all property transactions for financial reporting
      return null; // No filtering - access to all transactions
    
    case 'rental_payment_schedules':
      // Accountants can see all payment schedules for cash flow analysis
      return null; // No filtering - access to all schedules
    
    default:
      // Accountants cannot access other data (properties, profiles, maintenance, etc.)
      console.warn(`[Security] Accountant access denied to table: ${tableName}`);
      return { id: { in: [] } }; // Return empty result set
  }
} 
