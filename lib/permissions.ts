import { UserRole, UserContext } from './types';
import { getCurrentUserContext } from './security';
import { useEffect, useState } from 'react';

// Role-based permissions configuration
export interface Permission {
  action: string;
  resource: string;
  roles: UserRole[];
}

// Screen/Page permissions
export interface ScreenPermission {
  screen: string;
  roles: UserRole[];
  condition?: (userContext: UserContext) => boolean;
}

// Navigation item permissions  
export interface NavigationPermission {
  id: string;
  label: string;
  roles: UserRole[];
  condition?: (userContext: UserContext) => boolean;
}

// **SCREEN ACCESS PERMISSIONS**
export const SCREEN_PERMISSIONS: ScreenPermission[] = [
  // Dashboard - All authenticated users can see dashboard
  { screen: 'dashboard', roles: ['admin', 'manager', 'owner', 'tenant'] },
  
  // Properties Management
  { screen: 'properties', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { screen: 'add-property', roles: ['admin', 'manager', 'owner'] },
  { screen: 'edit-property', roles: ['admin', 'manager', 'owner'], 
    condition: (ctx) => ctx.role === 'admin' || ctx.role === 'manager' || (ctx.role === 'owner' && !!ctx.ownedPropertyIds?.length) },
  { screen: 'property-details', roles: ['admin', 'manager', 'owner', 'tenant'] },
  
  // People Management
  { screen: 'tenants', roles: ['admin', 'manager', 'owner'] },
  { screen: 'owners', roles: ['admin', 'manager'] },
  { screen: 'buyers', roles: ['admin', 'manager', 'owner'] },
  { screen: 'suppliers', roles: ['admin', 'manager'] },
  { screen: 'clients', roles: ['admin', 'manager'] },
  { screen: 'foreign-tenants', roles: ['admin', 'manager', 'owner'] },
  
  // Financial Management
  { screen: 'vouchers', roles: ['admin', 'manager'] },
  { screen: 'receipts', roles: ['admin', 'manager', 'owner'] },
  { screen: 'payments', roles: ['admin', 'manager'] },
  { screen: 'invoices', roles: ['admin', 'manager', 'owner'] },
  { screen: 'accounts', roles: ['admin', 'manager'] },
  { screen: 'cost-centers', roles: ['admin', 'manager'] },
  { screen: 'fixed-assets', roles: ['admin', 'manager'] },
  
  // Maintenance
  { screen: 'maintenance-requests', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { screen: 'work-orders', roles: ['admin', 'manager'] },
  
  // Reports
  { screen: 'reports', roles: ['admin', 'manager', 'owner'] },
  { screen: 'financial-reports', roles: ['admin', 'manager', 'owner'] },
  { screen: 'property-reports', roles: ['admin', 'manager', 'owner'] },
  
  // Communications
  { screen: 'letters', roles: ['admin', 'manager'] },
  { screen: 'issues', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { screen: 'documents', roles: ['admin', 'manager', 'owner', 'tenant'] },
  
  // Reservations and Contracts
  { screen: 'reservations', roles: ['admin', 'manager', 'owner'] },
  { screen: 'contracts', roles: ['admin', 'manager', 'owner'] },
  
  // Settings & Administration
  { screen: 'settings', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { screen: 'users', roles: ['admin', 'manager'] },
  { screen: 'user-management', roles: ['admin', 'manager'] },
  { screen: 'system-settings', roles: ['admin', 'manager'] },
];

// **SIDEBAR NAVIGATION PERMISSIONS**
export const SIDEBAR_PERMISSIONS: NavigationPermission[] = [
  // Main sections
  { id: 'dashboard', label: 'Home', roles: ['admin', 'manager', 'owner', 'tenant'] },
  
  // Owners and Customers section
  { id: 'owners-customers', label: 'Owners and Customers', roles: ['admin', 'manager', 'owner'] },
  { id: 'owner-manager', label: 'Owner or Property Manager', roles: ['admin', 'manager'] },
  { id: 'tenant', label: 'Tenant', roles: ['admin', 'manager', 'owner'] },
  { id: 'buyer', label: 'Buyer', roles: ['admin', 'manager', 'owner'] },
  { id: 'foreign-tenants', label: 'Foreign Tenants', roles: ['admin', 'manager', 'owner'] },
  { id: 'customers-suppliers', label: 'Customers and suppliers', roles: ['admin', 'manager'] },
  
  // Property Management section
  { id: 'property-management', label: 'Property Management', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { id: 'properties-list', label: 'Properties List', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { id: 'rent-property', label: 'Rent a property', roles: ['admin', 'manager', 'owner'] },
  { id: 'foreign-contracts', label: 'Foreign Tenant Contracts', roles: ['admin', 'manager', 'owner'] },
  { id: 'cash-properties', label: 'List cash property', roles: ['admin', 'manager', 'owner'] },
  { id: 'installment-properties', label: 'List installment property', roles: ['admin', 'manager', 'owner'] },
  { id: 'reservations', label: 'Property Reservation List', roles: ['admin', 'manager', 'owner'] },
  
  // Accounting & Voucher section
  { id: 'accounting-voucher', label: 'Accounting & Voucher', roles: ['admin', 'manager'] },
  { id: 'receipt-voucher', label: 'Receipt Voucher', roles: ['admin', 'manager', 'owner'] },
  { id: 'payment-voucher', label: 'Payment Voucher', roles: ['admin', 'manager'] },
  { id: 'entry-voucher', label: 'Entry voucher', roles: ['admin', 'manager'] },
  { id: 'credit-notification', label: 'Credit notification', roles: ['admin', 'manager'] },
  { id: 'debit-notification', label: 'Debit notification', roles: ['admin', 'manager'] },
  { id: 'vat-invoices', label: 'VAT invoices', roles: ['admin', 'manager', 'owner'] },
  
  // Reports section
  { id: 'reports', label: 'Reports', roles: ['admin', 'manager', 'owner'] },
  { id: 'reports-summary', label: 'Summary of Reports', roles: ['admin', 'manager', 'owner'] },
  { id: 'invoices-report', label: 'Invoices Report', roles: ['admin', 'manager', 'owner'] },
  
  // Maintenance, letters, issues section
  { id: 'maintenance-letters-issues', label: 'Maintenance, letters, issues', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { id: 'work-orders', label: 'List Work Order Reports', roles: ['admin', 'manager'] },
  { id: 'add-maintenance', label: 'Add a maintenance report', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { id: 'letters-list', label: 'List Letters', roles: ['admin', 'manager'] },
  { id: 'add-letter', label: 'Add a Letter', roles: ['admin', 'manager'] },
  { id: 'issues-list', label: 'List Issues', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { id: 'add-issue', label: 'Add issue', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { id: 'archive-documents', label: 'Archive documents', roles: ['admin', 'manager', 'owner', 'tenant'] },
  
  // Settings
  { id: 'settings', label: 'Settings', roles: ['admin', 'manager', 'owner', 'tenant'] },
  
  // Users section
  { id: 'users', label: 'Users', roles: ['admin', 'manager'] },
  { id: 'add-user', label: 'Add', roles: ['admin', 'manager'] },
  { id: 'list-users', label: 'List', roles: ['admin', 'manager'] },
  { id: 'user-reports', label: 'User Transaction Report', roles: ['admin', 'manager'] },
];

// **BOTTOM TAB NAVIGATION PERMISSIONS**
export const TAB_PERMISSIONS: NavigationPermission[] = [
  { id: 'dashboard', label: 'Dashboard', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { id: 'properties', label: 'Properties', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { id: 'tenants', label: 'Tenants', roles: ['admin', 'manager', 'owner'] },
  { id: 'maintenance', label: 'Maintenance', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { id: 'reports', label: 'Reports', roles: ['admin', 'manager', 'owner'] },
  { id: 'finance', label: 'Finance', roles: ['admin', 'manager', 'owner'] },
  { id: 'documents', label: 'Documents', roles: ['admin', 'manager', 'owner', 'tenant'] },
  { id: 'people', label: 'People', roles: ['admin', 'manager', 'owner'] },
  { id: 'payments', label: 'Payments', roles: ['admin', 'manager', 'owner'] },
  { id: 'settings', label: 'Settings', roles: ['admin', 'manager', 'owner', 'tenant'] },
];

// **PERMISSION CHECK FUNCTIONS**

/**
 * Check if user is admin or manager (has full system access)
 */
export function isAdminOrManager(userContext: UserContext | null): boolean {
  return userContext?.role === 'admin' || userContext?.role === 'manager';
}

/**
 * Check if user has permission to access a screen
 */
export function hasScreenAccess(screen: string, userContext: UserContext | null): boolean {
  console.log(`[Permissions] hasScreenAccess check for screen "${screen}":`, {
    userContext: userContext,
    isAuthenticated: userContext?.isAuthenticated,
    role: userContext?.role
  });
  
  if (!userContext || !userContext.isAuthenticated) {
    console.log(`[Permissions] Access denied: No user context or not authenticated`);
    return false;
  }
  
  // Admin and Manager have access to everything
  if (isAdminOrManager(userContext)) {
    console.log(`[Permissions] Access granted: User is admin/manager`);
    return true;
  }
  
  const permission = SCREEN_PERMISSIONS.find(p => p.screen === screen);
  if (!permission) {
    console.log(`[Permissions] Access denied: No permission found for screen "${screen}"`);
    return false;
  }
  
  // Check role-based access
  const hasRoleAccess = permission.roles.includes(userContext.role);
  console.log(`[Permissions] Role access check:`, {
    userRole: userContext.role,
    allowedRoles: permission.roles,
    hasRoleAccess
  });
  
  if (!hasRoleAccess) {
    console.log(`[Permissions] Access denied: Role not allowed`);
    return false;
  }
  
  // Check additional conditions if any
  if (permission.condition) {
    const conditionResult = permission.condition(userContext);
    console.log(`[Permissions] Condition check result:`, conditionResult);
    return conditionResult;
  }
  
  console.log(`[Permissions] Access granted: All checks passed`);
  return true;
}

/**
 * Check if navigation item should be visible
 */
export function hasNavigationAccess(itemId: string, userContext: UserContext | null, permissions: NavigationPermission[]): boolean {
  if (!userContext || !userContext.isAuthenticated) return false;
  
  // Admin and Manager have access to everything
  if (isAdminOrManager(userContext)) return true;
  
  const permission = permissions.find(p => p.id === itemId);
  if (!permission) return false;
  
  // Check role-based access
  const hasRoleAccess = permission.roles.includes(userContext.role);
  if (!hasRoleAccess) return false;
  
  // Check additional conditions if any
  if (permission.condition) {
    return permission.condition(userContext);
  }
  
  return true;
}

/**
 * Filter navigation items based on user permissions
 */
export function filterNavigationItems(items: NavigationPermission[], userContext: UserContext | null): NavigationPermission[] {
  if (!userContext || !userContext.isAuthenticated) return [];
  
  return items.filter(item => hasNavigationAccess(item.id, userContext, items));
}

/**
 * Get filtered sidebar permissions for current user
 */
export function getFilteredSidebarItems(userContext: UserContext | null): NavigationPermission[] {
  return filterNavigationItems(SIDEBAR_PERMISSIONS, userContext);
}

/**
 * Get filtered tab permissions for current user
 */
export function getFilteredTabItems(userContext: UserContext | null): NavigationPermission[] {
  return filterNavigationItems(TAB_PERMISSIONS, userContext);
}

// **REACT HOOKS FOR PERMISSIONS**

/**
 * Hook to get current user context with role information
 */
export function useUserContext() {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserContext() {
      try {
        setLoading(true);
        setError(null);
        const context = await getCurrentUserContext();
        setUserContext(context);
      } catch (err) {
        console.error('[Permissions] Error loading user context:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user context');
        setUserContext(null);
      } finally {
        setLoading(false);
      }
    }

    loadUserContext();
  }, []);

  return { userContext, loading, error, refetch: () => loadUserContext() };
}

/**
 * Hook to check screen access permission
 */
export function useScreenAccess(screen: string) {
  const { userContext, loading } = useUserContext();
  
  const hasAccess = !loading && hasScreenAccess(screen, userContext);
  
  console.log(`[Permissions] useScreenAccess for screen "${screen}":`, {
    loading,
    userContext,
    hasAccess
  });
  
  return { hasAccess, loading, userContext };
}

/**
 * Hook to get filtered navigation items
 */
export function useFilteredNavigation() {
  const { userContext, loading } = useUserContext();
  
  const sidebarItems = getFilteredSidebarItems(userContext);
  const tabItems = getFilteredTabItems(userContext);
  
  // Helper function to check tab access specifically
  const hasTabAccess = (tabId: string): boolean => {
    return hasNavigationAccess(tabId, userContext, TAB_PERMISSIONS);
  };
  
  return { 
    sidebarItems, 
    tabItems, 
    userContext, 
    loading,
    hasNavigationAccess: (itemId: string, permissions: NavigationPermission[]) => 
      hasNavigationAccess(itemId, userContext, permissions),
    hasTabAccess
  };
}

// **ROLE-BASED UI HELPERS**

/**
 * Component wrapper for conditional rendering based on permissions
 */
export function canUserAccess(screen: string, userRole: UserRole | undefined): boolean {
  if (!userRole) return false;
  
  // Admin and Manager have access to everything
  if (userRole === 'admin' || userRole === 'manager') return true;
  
  const permission = SCREEN_PERMISSIONS.find(p => p.screen === screen);
  if (!permission) return false;
  
  return permission.roles.includes(userRole);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    admin: 'Administrator',
    manager: 'Property Manager', 
    owner: 'Property Owner',
    tenant: 'Tenant',
    staff: 'Staff Member'
  };
  
  return roleNames[role] || role;
}

/**
 * Get role-specific dashboard configuration
 */
export function getRoleDashboardConfig(role: UserRole) {
  const configs = {
    admin: {
      showAllProperties: true,
      showAllTenants: true,
      showFinancials: true,
      showReports: true,
      showUserManagement: true
    },
    manager: {
      showAllProperties: true,
      showAllTenants: true,
      showFinancials: true,
      showReports: true,
      showUserManagement: true
    },
    owner: {
      showAllProperties: false, // Only owned properties
      showAllTenants: false, // Only tenants of owned properties
      showFinancials: true, // Only for owned properties
      showReports: true, // Only for owned properties
      showUserManagement: false
    },
    tenant: {
      showAllProperties: false, // Only rented properties
      showAllTenants: false,
      showFinancials: false, // Only own payment history
      showReports: false,
      showUserManagement: false
    },
    staff: {
      showAllProperties: false,
      showAllTenants: false,
      showFinancials: false,
      showReports: false,
      showUserManagement: false
    }
  };
  
  return configs[role] || configs.tenant;
} 