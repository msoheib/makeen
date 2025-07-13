# Requirements Specification

## Problem Statement

Tenants with assigned properties cannot see their properties in the maintenance request creation form, preventing them from submitting maintenance requests. The property selection dropdown shows no properties even for tenants who have active rental contracts.

## Solution Overview

Fix the property data extraction logic in the maintenance form component and implement auto-selection for tenants with single properties to streamline the user experience.

## Functional Requirements

### FR1: Property Data Loading
- **Tenant users** with active contracts MUST see their assigned properties in the property selection dropdown
- **Property extraction logic** must correctly access property data from the contract API response
- **Active contracts only** should be considered (not expired or cancelled contracts)

### FR2: Auto-Selection for Single Property
- When a tenant has **only one active contract** (which is the case in this app), the property should be **automatically pre-selected**
- The property selection UI should be **simplified or hidden** when auto-selection occurs
- Form validation should pass automatically for auto-selected properties

### FR3: Data Debugging & Visibility
- Add **comprehensive logging** to trace property data extraction process
- Log the actual data structure returned from `tenantApi.getMyContracts()`
- Enable debugging of data mapping issues for future troubleshooting

### FR4: Type Safety Improvements
- Add **TypeScript interfaces** for contract-with-property response structure
- Prevent similar data mapping issues through better type definitions
- Ensure compile-time validation of property data access

### FR5: Data Validation
- Validate that property data exists before attempting to display it
- Handle cases where contracts exist but property data is missing
- Maintain existing appropriate messaging for tenants without active contracts

## Technical Requirements

### TR1: Primary Fix - Property Data Extraction
**File:** `app/maintenance/add.tsx`  
**Lines:** 60-61

**Current problematic code:**
```typescript
const rentedProperties = activeContracts.map(contract => contract.property).filter(property => property);
```

**Required fix:** Correct the property data access pattern based on the actual Supabase response structure.

### TR2: Enhanced Logging
**File:** `app/maintenance/add.tsx`  
**Lines:** 51-72

Add comprehensive logging:
```typescript
console.log('[Maintenance Form] Contract response structure:', JSON.stringify(contractsResponse.data?.[0], null, 2));
console.log('[Maintenance Form] Active contracts count:', activeContracts.length);
console.log('[Maintenance Form] Extracted properties count:', rentedProperties.length);
```

### TR3: Auto-Selection Logic
**File:** `app/maintenance/add.tsx`  
**After line 72**

Add auto-selection for single property:
```typescript
// Auto-select if tenant has only one property
useEffect(() => {
  if (userProperties?.length === 1 && !selectedProperty) {
    const singleProperty = userProperties[0];
    setSelectedProperty(singleProperty);
    setFormData(prev => ({ ...prev, property_id: singleProperty.id }));
  }
}, [userProperties, selectedProperty]);
```

### TR4: TypeScript Interface
**File:** `app/maintenance/add.tsx` or dedicated types file

Add interface for contract response:
```typescript
interface ContractWithProperty {
  id: string;
  status: string;
  property: {
    id: string;
    title: string;
    address: string;
    city?: string;
    neighborhood?: string;
    property_type?: string;
  };
  // ... other contract fields
}
```

### TR5: UI Improvements for Auto-Selection
**File:** `app/maintenance/add.tsx`  
**Lines:** 300-335 (Property Selection Section)

**Modify the property selector UI:**
- Show selected property info when auto-selected
- Hide the "tap to select" interface when property is auto-selected
- Display a subtle indicator that property was auto-selected

## Implementation Hints

### Database Verification ✅
The database structure is correct:
- `contracts` table links tenants to properties via `property_id`
- `tenantApi.getMyContracts()` correctly joins property data
- Sample data shows active tenant-property relationships exist

### API Query Analysis ✅
The Supabase query in `tenantApi.getMyContracts()` is correct:
```sql
SELECT *,
  property:properties(id, title, address, city, neighborhood, property_type)
FROM contracts 
WHERE tenant_id = ? AND status = 'active'
```

### Focus Area 🎯
The issue is specifically in the **frontend data extraction**, not the backend data or API queries.

## Acceptance Criteria

### AC1: Property Loading Fixed
- [ ] Tenants with active contracts see their assigned properties in dropdown
- [ ] Property data is correctly extracted from API response
- [ ] Multiple tenants can be tested to verify the fix works consistently

### AC2: Auto-Selection Implemented  
- [ ] Property is automatically pre-selected for tenants with one contract
- [ ] Form validation passes with auto-selected property
- [ ] UI clearly shows the auto-selected property information

### AC3: Debugging & Logging
- [ ] Console logs show the complete contract response structure
- [ ] Property extraction process is traceable through logs
- [ ] Developers can debug similar issues in the future

### AC4: Type Safety
- [ ] TypeScript interfaces defined for contract-with-property structure
- [ ] No TypeScript errors related to property data access
- [ ] IDE provides better autocomplete for property fields

### AC5: Data Validation
- [ ] System handles missing property data gracefully
- [ ] Existing error messages remain appropriate for edge cases
- [ ] No crashes when contract data is incomplete

## Testing Strategy

### Test Cases
1. **Primary Test**: Login as `organikscull@gmail.com` (tenant with active contract)
   - Navigate to maintenance form
   - Verify property appears in dropdown
   - Verify property is auto-selected

2. **Edge Case**: Tenant with no active contracts
   - Verify appropriate "no contracts" message displays
   - Ensure no crashes or errors occur

3. **Data Validation**: Test with incomplete contract data
   - Verify graceful handling of missing property information

### Validation Steps
1. Check browser console for detailed logging output
2. Verify property selection dropdown functionality
3. Test maintenance request submission with auto-selected property
4. Confirm TypeScript compilation with new interfaces

## Assumptions

### AS1: Single Property Per Tenant
Based on user feedback: "the tenant in my app will have only one property assigned" - this simplifies the auto-selection logic.

### AS2: Active Contracts Only
Only active rental contracts should enable maintenance request creation - expired contracts should not show properties.

### AS3: Existing Validation Intact
Current form validation and error messaging should remain functional for edge cases.

## Priority

**HIGH PRIORITY** - This is a critical bug that prevents tenants from using core maintenance functionality. The fix should be implemented immediately to restore basic tenant workflow capabilities.