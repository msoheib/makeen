# Accountant Role Implementation

## Overview

This document describes the implementation of a new **Accountant** user role in the Real Estate Management System. Accountants have access to financial data and reports only, with restricted access to other system features.

## Role Definition

### **Accountant Role**
- **Purpose**: Financial data management and reporting
- **Access Level**: Financial data and reports only
- **Restrictions**: Cannot access properties, tenants, maintenance, or other operational data

## Database Changes

### 1. Database Migration
**File**: `supabase/migrations/20241221_add_accountant_role.sql`

**Changes Made**:
- Updated `profiles` table role constraint to include 'accountant'
- Added index for accountant role queries
- Added documentation comments

**SQL Changes**:
```sql
-- Update the role constraint to include 'accountant'
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manager', 'owner', 'tenant', 'buyer', 'employee', 'contractor', 'accountant'));
```

### 2. TypeScript Types Updated
**File**: `lib/types.ts`

**Changes Made**:
- Added 'accountant' to UserRole type union
- Updated type definition: `export type UserRole = 'admin' | 'manager' | 'owner' | 'tenant' | 'buyer' | 'staff' | 'accountant';`

## Security Implementation

### 1. Security Configuration
**File**: `lib/security.ts`

**New Function**: `buildAccountantFilter()`
- Handles accountant-specific data access
- Returns `null` (no filtering) for financial tables
- Returns empty result set for non-financial tables

**Financial Data Access** (Full Access):
- `vouchers` - All financial vouchers
- `invoices` - All billing invoices
- `accounts` - Chart of accounts
- `cost_centers` - Expense allocation centers
- `fixed_assets` - Asset depreciation data
- `utility_payments` - Utility billing data
- `property_metrics` - Financial performance metrics
- `budgets` - Financial planning data
- `property_transactions` - Property sale/rental transactions
- `rental_payment_schedules` - Payment schedules

**Non-Financial Data Access** (No Access):
- `properties` - Property listings
- `profiles` - User profiles
- `contracts` - Rental agreements
- `maintenance_requests` - Maintenance tickets
- `work_orders` - Work orders
- All other operational tables

### 2. Security Flow
```typescript
// In buildRoleBasedFilter function
if (userContext.role === 'accountant') {
  return buildAccountantFilter(userContext, tableName);
}
```

## Permission System Updates

### 1. Screen Access Permissions
**File**: `lib/permissions.ts`

**Financial Screens** (Accountant Access):
- `vouchers` - Voucher management
- `receipts` - Receipt vouchers
- `payments` - Payment vouchers
- `invoices` - Invoice management
- `accounts` - Chart of accounts
- `cost-centers` - Cost center management
- `fixed-assets` - Fixed asset management

**Report Screens** (Accountant Access):
- `reports` - General reports
- `financial-reports` - Financial analysis reports

**Restricted Screens** (No Accountant Access):
- `properties` - Property management
- `tenants` - Tenant management
- `maintenance-requests` - Maintenance management
- `people` - People management

### 2. Navigation Permissions
**Sidebar Navigation**:
- ✅ **Accounting & Voucher** section - Full access
- ✅ **Reports** section - Full access
- ❌ **Property Management** section - No access
- ❌ **People Management** section - No access
- ❌ **Maintenance** section - No access

**Bottom Tab Navigation**:
- ✅ **Reports** tab - Full access
- ✅ **Finance** tab - Full access
- ❌ **Properties** tab - No access
- ❌ **Tenants** tab - No access
- ❌ **Maintenance** tab - No access

### 3. Helper Functions
**New Permission Functions**:
```typescript
export function isAccountant(userContext: UserContext | null): boolean {
  return userContext?.role === 'accountant';
}

export function hasFinancialAccess(userContext: UserContext | null): boolean {
  return isAdminOrManager(userContext) || isAccountant(userContext);
}
```

## User Interface Implementation

### 1. Accountant Dashboard
**File**: `app/(drawer)/(tabs)/accountant-dashboard.tsx`

**Features**:
- Financial overview with revenue, expenses, net income
- Voucher summary (receipt, payment, journal, draft)
- Invoice summary (total, paid, overdue, pending)
- Quick actions for financial tasks
- Real-time data from financial APIs
- Pull-to-refresh functionality

**Data Sources**:
- `reportsApi.getStats()` - General reporting statistics
- `reportsApi.getRevenueReport()` - Revenue analysis
- `reportsApi.getExpenseReport()` - Expense analysis
- `vouchersApi.getSummary()` - Voucher statistics
- `invoicesApi.getSummary()` - Invoice statistics

### 2. Role-Based Redirection
**File**: `app/(tabs)/index.tsx`

**Implementation**:
```typescript
// Role-based redirection for accountants
useEffect(() => {
  if (userContext?.role === 'accountant') {
    // Redirect accountants to their specialized dashboard
    router.replace('/accountant-dashboard');
  }
}, [userContext?.role, router]);
```

### 3. Signup Screen Updates
**File**: `app/(auth)/signup.tsx`

**Changes Made**:
- Added 'Accountant' option to role selection
- Updated role validation to include accountant
- Accountants start with 'active' status and 'approved' approval status

## API Integration

### 1. Financial Data APIs
Accountants have access to all financial-related API endpoints:

**Vouchers API**:
- `vouchersApi.getAll()` - All vouchers
- `vouchersApi.getSummary()` - Voucher statistics
- `vouchersApi.create()` - Create new vouchers

**Invoices API**:
- `invoicesApi.getAll()` - All invoices
- `invoicesApi.getSummary()` - Invoice statistics
- `invoicesApi.create()` - Create new invoices

**Reports API**:
- `reportsApi.getStats()` - General statistics
- `reportsApi.getRevenueReport()` - Revenue analysis
- `reportsApi.getExpenseReport()` - Expense analysis
- `reportsApi.getPropertyPerformanceReport()` - Property ROI
- `reportsApi.getMaintenanceReport()` - Maintenance costs

**Accounts API**:
- `accountsApi.getChartOfAccounts()` - Chart of accounts
- `accountsApi.getByType()` - Accounts by type

### 2. Data Filtering
All API calls automatically apply accountant role filtering through the security system:
- Financial data: No filtering (full access)
- Non-financial data: Empty result set (no access)

## User Experience

### 1. Accountant Workflow
1. **Signup**: Select 'Accountant' role during registration
2. **Login**: Authenticated with accountant permissions
3. **Dashboard**: Automatically redirected to specialized financial dashboard
4. **Navigation**: Access only financial and reporting features
5. **Data Access**: View all financial data across all properties/tenants

### 2. Restricted Features
Accountants cannot:
- View or manage properties
- Access tenant information
- Handle maintenance requests
- Manage user profiles
- Access operational data

### 3. Available Features
Accountants can:
- View all financial vouchers and transactions
- Generate comprehensive financial reports
- Access chart of accounts and cost centers
- Manage fixed assets and depreciation
- Handle utility billing and payments
- Create and manage budgets
- Access all financial analytics

## Testing

### 1. Test Scenarios
- **Accountant Signup**: Verify role selection and profile creation
- **Login Redirect**: Confirm automatic redirection to accountant dashboard
- **Data Access**: Verify financial data access and operational data restrictions
- **Navigation**: Test sidebar and tab navigation permissions
- **API Security**: Verify role-based filtering in all API calls

### 2. Test Data
- Create test accountant user
- Verify financial data visibility
- Confirm operational data restrictions
- Test all financial report generation

## Security Considerations

### 1. Data Isolation
- Accountants cannot access operational data
- Financial data is fully accessible for reporting
- Role-based filtering enforced at API level
- Security policies applied consistently

### 2. Audit Trail
- All accountant actions logged
- Financial data access tracked
- Security violations logged and reported

## Future Enhancements

### 1. Potential Improvements
- Advanced financial reporting tools
- Export capabilities for financial data
- Integration with external accounting systems
- Automated financial alerts and notifications
- Custom financial dashboard widgets

### 2. Additional Features
- Financial year closing procedures
- Tax calculation and reporting
- Multi-currency support
- Advanced cost allocation tools

## Conclusion

The Accountant role implementation provides a secure, role-based access system that allows financial professionals to access all necessary financial data while maintaining strict separation from operational aspects of the property management system. This implementation follows security best practices and provides a comprehensive financial management interface for accounting professionals.

## Files Modified

1. **Database**: `supabase/migrations/20241221_add_accountant_role.sql`
2. **Types**: `lib/types.ts`
3. **Security**: `lib/security.ts`
4. **Permissions**: `lib/permissions.ts`
5. **UI**: `app/(drawer)/(tabs)/accountant-dashboard.tsx`
6. **Navigation**: `app/(tabs)/index.tsx`
7. **Authentication**: `app/(auth)/signup.tsx`
8. **Documentation**: `docs/ACCOUNTANT_ROLE_IMPLEMENTATION.md`

## Implementation Status

✅ **COMPLETE** - Accountant role fully implemented with:
- Database schema updates
- Security configuration
- Permission system
- Specialized dashboard
- Role-based navigation
- API integration
- Comprehensive documentation
