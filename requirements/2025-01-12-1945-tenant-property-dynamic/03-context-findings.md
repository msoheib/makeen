# Context Findings

## Current Implementation Analysis

### Hardcoded Property Location
- **File:** `app/(tabs)/index.tsx` lines 383-399
- **Problem:** Shows hardcoded property "شقة حديثة في جدة" (Modern apartment in Jeddah)
- **Current Code:**
  ```tsx
  <Text style={[styles.propertyName, { color: theme.colors.onSurface }]}>
    شقة حديثة في جدة
  </Text>
  <Text style={[styles.propertyAddress, { color: theme.colors.onSurfaceVariant }]}>
    الكورنيش الشمالي، جدة
  </Text>
  <Text style={[styles.propertySpecs, { color: theme.colors.onSurfaceVariant }]}>
    3 غرف • 2 حمام • 150 م²
  </Text>
  ```

### Existing API Infrastructure
- **Contracts API:** `contractsApi.getAll()` in `lib/api.ts:438-459`
- **Tenant API:** `tenantApi.getMyContracts()` in `lib/api.ts:3502-3522`
- **Current Usage:** Already fetching `tenantContracts` in main dashboard (lines 116-126)

### Data Structure Available
From `lib/database.types.ts` and API analysis:

**Contracts Table:**
- `property_id`: Links to properties table
- `tenant_id`: Links to profiles table  
- `status`: Contract status (active, inactive, etc.)
- `rent_amount`: Monthly rent amount
- `start_date`, `end_date`: Contract period

**Properties Table (via contract relation):**
- `title`: Property name
- `address`: Property address
- `city`: Property city
- `neighborhood`: Neighborhood name
- `area_sqm`: Area in square meters
- `bedrooms`, `bathrooms`: Room counts
- `property_type`: Type of property

### Existing Implementation Patterns
1. **Data Fetching:** Already using `useApi` hook pattern
2. **Loading States:** Has loading and error handling
3. **Contract Selection:** Uses `activeContract = tenantContracts.find(contract => contract.status === 'active')` pattern
4. **Property Data:** API returns property details via relation: `property:properties(id, title, address, city, neighborhood, property_type)`

## Files That Need Modification

### Primary Files:
1. **`app/(tabs)/index.tsx`** - Main dashboard with hardcoded property
2. **`app/tenant/dashboard.tsx`** - Tenant-specific dashboard (per Q5)

### Helper Functions Needed:
- Function to get tenant's active property from contracts
- Function to format property details for display
- Function to generate "no property" message

## Implementation Strategy

### Step 1: Create Helper Function
Create `getTenantProperty()` function similar to existing `getTenantPaymentInfo()` pattern.

### Step 2: Replace Hardcoded Display
Replace hardcoded property details with dynamic data from active contract.

### Step 3: Handle No Property Case  
Show "No property yet, please contact manager for assignment" when no active contract exists.

### Step 4: Update Tenant Dashboard
Apply same changes to tenant-specific dashboard for consistency.

## Related Features Found
- Payment calculation already uses contract data dynamically
- Contract fetching infrastructure is already in place
- Loading states and error handling patterns exist