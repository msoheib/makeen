# Requirements Specification: Dynamic Tenant Property Display

## Problem Statement
The tenant homepage currently displays hardcoded property information ("شقة حديثة في جدة") instead of showing the tenant's actual assigned property. When tenants have no assigned property, the system should display an appropriate message directing them to contact management.

## Solution Overview
Replace the hardcoded property display with dynamic data fetched from the tenant's active rental contract. Implement graceful handling for tenants without assigned properties.

## Functional Requirements

### FR1: Dynamic Property Display
- **Location:** `app/(tabs)/index.tsx` lines 383-399
- **Requirement:** Replace hardcoded property details with data from tenant's active contract
- **Data Source:** Existing `tenantContracts` already being fetched (lines 116-126)
- **Property Information:** title, address, city, neighborhood, bedrooms, bathrooms, area_sqm

### FR2: Contract Selection Logic
- **Priority:** Active contracts (`status === 'active'`) take precedence
- **Fallback:** If no active contract, use first available contract
- **Pattern:** Reuse existing logic from `getTenantPaymentInfo()` function

### FR3: No Property State
- **Trigger:** When tenant has no contracts or no property assigned
- **Message:** "لا يوجد عقار حتى الآن، يرجى التواصل مع المدير للحصول على التعيين" (Arabic prioritized)
- **Styling:** Same card styling as current property display for visual consistency

### FR4: Tenant Dashboard Consistency  
- **Location:** `app/tenant/dashboard.tsx`
- **Requirement:** Apply same dynamic property logic for consistency across tenant views
- **Scope:** All property-related displays in tenant dashboard

### FR5: Loading States
- **Implementation:** Reuse existing shimmer effect patterns
- **Trigger:** While `contractsLoading` is true
- **Pattern:** Similar to payment section loading states

## Technical Requirements

### TR1: Data Integration
- **File:** `app/(tabs)/index.tsx`
- **Function:** Create `getTenantPropertyInfo()` helper function
- **Data Source:** `tenantContracts` array
- **Return Type:**
  ```typescript
  {
    hasProperty: boolean;
    propertyName: string | null;
    propertyAddress: string | null;
    propertySpecs: string | null;
  }
  ```

### TR2: Property Information Format
- **Name:** Use `property.title` from contract relation
- **Address:** Combine `property.address, property.city` 
- **Specs:** Format as "X غرف • Y حمام • Z م²" using bedrooms, bathrooms, area_sqm
- **Pattern:** Match existing hardcoded format for consistency

### TR3: API Data Structure
- **Source:** `tenantApi.getMyContracts()` in `lib/api.ts:3502-3522`
- **Relation:** Contract includes `property:properties(id, title, address, city, neighborhood, property_type)`
- **Loading:** Use existing `contractsLoading` state

### TR4: Error Handling
- **Missing Data:** Show "no property" message when property data incomplete
- **API Errors:** Graceful degradation to "no property" state
- **Loading:** Show shimmer effect during data fetch

## Implementation Hints

### Step 1: Create Helper Function
```typescript
const getTenantPropertyInfo = () => {
  if (!tenantContracts || tenantContracts.length === 0) {
    return { hasProperty: false, propertyName: null, propertyAddress: null, propertySpecs: null };
  }
  
  const activeContract = tenantContracts.find(contract => contract.status === 'active') || tenantContracts[0];
  const property = activeContract?.property;
  
  if (!property) {
    return { hasProperty: false, propertyName: null, propertyAddress: null, propertySpecs: null };
  }
  
  return {
    hasProperty: true,
    propertyName: property.title,
    propertyAddress: `${property.address}, ${property.city}`,
    propertySpecs: `${property.bedrooms || 0} غرف • ${property.bathrooms || 0} حمام • ${property.area_sqm || 0} م²`
  };
};
```

### Step 2: Replace Hardcoded Display
Replace lines 388-396 in `renderTenantDashboard()` function with conditional rendering based on `getTenantPropertyInfo()` result.

### Step 3: Add Loading State
Wrap property section with loading check using existing shimmer components.

### Step 4: Apply to Tenant Dashboard
Repeat same implementation pattern in `app/tenant/dashboard.tsx`.

## Acceptance Criteria

### AC1: Dynamic Property Display
- ✅ When tenant has active contract with property, display actual property details
- ✅ Property name shows `property.title` from database
- ✅ Address shows `property.address, property.city` format
- ✅ Specs show "X غرف • Y حمام • Z م²" with actual values

### AC2: No Property Handling
- ✅ When tenant has no contracts, show Arabic "no property" message
- ✅ When tenant has contract but no property assigned, show "no property" message  
- ✅ Message styled with same card design as property display

### AC3: Loading States
- ✅ Show shimmer effect while contracts are loading
- ✅ Property section appears after loading completes
- ✅ Error states gracefully fall back to "no property" message

### AC4: Consistency
- ✅ Both main dashboard and tenant dashboard show same dynamic behavior
- ✅ Loading patterns match existing payment section
- ✅ Visual styling consistent with current design

### AC5: Data Efficiency
- ✅ Reuse existing `tenantContracts` data, no additional API calls
- ✅ Use existing loading states and error handling patterns
- ✅ Follow established codebase patterns and conventions

## Assumptions
- Tenants typically have one active property assignment at a time
- Contract status 'active' indicates current property assignment
- Property details (bedrooms, bathrooms, area_sqm) are always available when property exists
- Arabic language takes priority for user-facing messages
- Existing API structure provides sufficient property detail via contract relations