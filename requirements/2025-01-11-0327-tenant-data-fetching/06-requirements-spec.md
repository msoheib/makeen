# Requirements Specification: Tenant Data Fetching Issues

**Project:** Real Estate Management System  
**Date:** 2025-01-11  
**Requirement ID:** tenant-data-fetching  

## Problem Statement

New tenant users experience technical errors and misleading data when accessing the application:
1. Properties tab shows database UUID syntax errors
2. Dashboard displays hardcoded "5000 ريال" payment amount for all tenants
3. Maintenance tab shows generic "errorLoadingData" messages
4. No clear messaging about manual property assignment workflow

## Solution Overview

Replace technical error messages with user-friendly empty states that guide tenants through the manual assignment process, while ensuring all financial data is dynamically calculated from real contracts.

## Functional Requirements

### FR1: Properties Tab Empty State
- **Current:** Technical error "invalid input syntax for type uuid: 'no-properties-for-tenant'"
- **Required:** Friendly message "No properties assigned - Contact your property manager"
- **Scope:** Both API errors and empty data scenarios show same message
- **Languages:** Arabic and English support

### FR2: Dynamic Dashboard Payments
- **Current:** Hardcoded "5000 ريال" for all tenants
- **Required:** Real-time calculation from active contracts
- **Display:** "0 ريال" when no contracts exist
- **Data Source:** `contractsApi.getAll({ tenant_id })` filtered by user context

### FR3: Maintenance Tab Empty State
- **Current:** Generic "errorLoadingData" message
- **Required:** "No properties assigned for maintenance requests - Contact your property manager"
- **Scope:** Message only (no self-service buttons due to regulatory constraints)
- **Languages:** Arabic and English support

### FR4: Unified Empty State Component
- **Required:** Extend existing `NotificationEmpty.tsx` component
- **Pattern:** Reuse existing Arabic/English translation system
- **Consistency:** Same visual design across all tenant empty states

### FR5: Translation Management
- **Required:** Add new tenant messages to existing `common.json` files
- **Keys:** `noPropertiesAssigned`, `noPropertiesAssignedDesc`, `noMaintenanceAccess`
- **Languages:** Arabic (`lib/translations/ar/common.json`) and English (`lib/translations/en/common.json`)

## Technical Requirements

### TR1: API Layer Fixes (`lib/api.ts`)
**Files to modify:** `lib/api.ts`
**Lines:** 129, 261, 550

**Current Pattern:**
```typescript
query = query.eq('id', 'no-properties-for-tenant');
```

**Required Pattern:**
```typescript
if (rentedPropertyIds.length === 0) {
  return { data: [], error: null };
}
```

**Locations:**
- `propertiesApi.getAll()` line 129
- `propertiesApi.getDashboardSummary()` line 261  
- `maintenanceApi.getAll()` line 550

### TR2: Dashboard Payment Fix (`app/(tabs)/index.tsx`)
**File to modify:** `app/(tabs)/index.tsx`
**Line:** 308

**Current:**
```typescript
5,000 ريال
```

**Required:**
```typescript
const { data: tenantContracts } = useApi(() => 
  contractsApi.getAll({ tenant_id: userContext?.userId }), 
  [userContext?.userId]
);

const totalRent = tenantContracts?.reduce((sum, contract) => 
  sum + (contract.rent_amount || 0), 0) || 0;

// Display: {totalRent.toLocaleString('ar-SA')} ريال
```

### TR3: Error Handling Enhancement
**Files to modify:** 
- `app/(tabs)/properties.tsx`
- `app/(tabs)/maintenance.tsx`

**Pattern:** Replace error states with friendly empty states using extended `NotificationEmpty` component

### TR4: Component Extension
**File to create:** `components/TenantEmptyState.tsx`

**Base:** Extend `components/NotificationEmpty.tsx`
**Props:** 
- `type: 'properties' | 'maintenance' | 'dashboard'`
- `title: string`
- `description: string`

## Implementation Hints

### Pattern to Follow: Security-First Design
The app uses strict role-based access control. Maintain this pattern:
1. Security filtering at API level (`lib/security.ts`)
2. User context established via `getCurrentUserContext()`
3. Empty results for unauthorized access, not errors

### Pattern to Follow: Error Boundary Design
Existing components handle errors gracefully:
- Use `useApi` hook pattern from `hooks/useApi.ts`
- Follow empty state patterns from `app/(tabs)/properties.tsx` lines 372-381
- Leverage translation system from `lib/translations/`

### Pattern to Follow: Financial Data
Existing financial calculations for owners/admins in dashboard:
- Use `contractsApi` methods with proper filtering
- Follow security patterns from `lib/security.ts` lines 304-307
- Calculate totals using array reduce patterns

## Acceptance Criteria

### AC1: Properties Tab
- ✅ New tenant sees friendly message instead of UUID error
- ✅ Message appears in both Arabic and English
- ✅ Same message for API errors and empty data
- ✅ Visual consistency with existing empty states

### AC2: Dashboard Payments
- ✅ Shows "0 ريال" for tenants with no contracts
- ✅ Shows calculated total for tenants with active contracts
- ✅ No hardcoded amounts anywhere in tenant dashboard
- ✅ Real-time updates when contracts change

### AC3: Maintenance Tab
- ✅ Shows friendly message instead of generic error
- ✅ Message explains contact property manager workflow
- ✅ No self-service buttons (regulatory compliance)
- ✅ Consistent styling with other empty states

### AC4: Technical Implementation
- ✅ No fake UUID filters in API layer
- ✅ Proper early returns for empty tenant data
- ✅ Extended NotificationEmpty component used
- ✅ Translation keys added to common.json files
- ✅ No breaking changes to existing role-based security

## Assumptions

1. **Manual Assignment Workflow:** Tenants are assigned properties by admins/managers through the existing contract creation system
2. **Regulatory Constraints:** Tenants cannot browse available properties (app requires special license)
3. **Security Model:** Current role-based access control patterns should be maintained
4. **Contract Model:** Active contracts with `tenant_id` and `property_id` are the source of truth for tenant property access
5. **Translation System:** Existing Arabic/English translation infrastructure is sufficient for new messages

## Dependencies

- Existing `NotificationEmpty.tsx` component
- Existing translation system (`lib/translations/`)
- Current user context system (`lib/security.ts`)
- Existing API patterns (`lib/api.ts`)
- Contract management system (`contractsApi`)

## Risk Mitigation

1. **Security Risk:** Ensure new empty state handling doesn't bypass role-based access control
2. **Performance Risk:** Cache tenant contract data to avoid repeated API calls
3. **UX Risk:** Test with actual tenant users to ensure messaging is clear
4. **Regression Risk:** Verify admin/owner dashboards remain unaffected by changes