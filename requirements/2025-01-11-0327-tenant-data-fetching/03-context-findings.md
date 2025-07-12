# Context Findings: Tenant Data Fetching Issues

## Key Files Analysis

### 1. **UUID "no-properties-for-tenant" Logic Issues**
**File:** `lib/api.ts`
- **Line 129**: Properties API fake UUID filter
- **Line 261**: Dashboard Summary fake UUID filter  
- **Line 550**: Maintenance API fake UUID filter

**Current Pattern:**
```typescript
// If tenant has no properties, return empty result
query = query.eq('id', 'no-properties-for-tenant');
```

**Problem:** This creates invalid UUID syntax errors in PostgreSQL

### 2. **Hardcoded Payment Amount**
**File:** `app/(tabs)/index.tsx`
- **Line 308**: `5,000 ريال` hardcoded in tenant dashboard

**Pattern to Follow:** Use existing `contractsApi.getAll()` with tenant filtering from `lib/api.ts` lines 426-512

### 3. **Existing Empty State Components**
**Reusable Components:**
- `components/NotificationEmpty.tsx` - Arabic/English empty state template
- `app/(tabs)/properties.tsx` lines 372-381 - Proper empty state UI pattern
- `app/(tabs)/maintenance.tsx` lines 265-275 - Filtered empty states

### 4. **User Context Patterns**
**File:** `lib/security.ts`
- **Lines 132-140**: How `rentedPropertyIds` established from contracts
- **Lines 239-241**: Security filtering for tenant property access
- **Lines 304-307**: Tenant maintenance request filtering

### 5. **Translation Patterns**
**Files:** `lib/translations/ar/common.json`, `lib/translations/en/common.json`
- Existing empty state messages: `"noDataFound"`, `"noData"`, `"noResults"`
- Pattern: Create `tenants.json` files for tenant-specific messages

### 6. **Financial Data API**
**File:** `lib/api.ts` lines 426-512
- `contractsApi.getAll({ tenant_id })` - proper tenant contract fetching
- Returns rent_amount, property details, tenant info
- Security-filtered by user context

## Recommended Fix Approach

### A. **Replace UUID Fake Filters**
```typescript
// In lib/api.ts - Replace fake UUID with early returns
if (rentedPropertyIds.length === 0) {
  return { data: [], error: null };
}
```

### B. **Dynamic Payment Data**
```typescript
// In app/(tabs)/index.tsx - Replace hardcoded 5000
const { data: tenantContracts } = useApi(() => 
  contractsApi.getAll({ tenant_id: userContext?.userId }), 
  [userContext?.userId]
);
```

### C. **Tenant-Specific Empty States**
- Create `components/TenantEmptyState.tsx` based on `NotificationEmpty.tsx`
- Add tenant-specific translations
- Use in properties, maintenance, and dashboard tabs

## Integration Points

1. **Security System**: Uses `getCurrentUserContext()` to establish `rentedPropertyIds`
2. **API Layer**: All tenant data filtered by security context
3. **State Management**: User context managed in `lib/store.ts`
4. **UI Components**: Consistent empty state patterns across tabs

## Technical Constraints

1. **Regulatory**: No property browsing for tenants (license required)
2. **Security**: Strict role-based access control at API level
3. **Multilingual**: Arabic/English support required
4. **Manual Assignment**: Admins assign properties to tenants via contracts