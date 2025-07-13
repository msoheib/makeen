# Context Findings

## Root Cause Analysis

The tenant maintenance property selection issue has been identified. The problem is **NOT** with the database or API query, but with the **data extraction logic** in the maintenance form component.

### **Technical Issue Identified**

**File:** `app/maintenance/add.tsx`  
**Lines:** 60-61  
**Issue:** Property data extraction from contract response

### **The Problem**

```typescript
// Current code (lines 60-61):
const activeContracts = contractsResponse.data.filter(contract => contract.status === 'active');
const rentedProperties = activeContracts.map(contract => contract.property).filter(property => property);
```

**Root Cause:** The property extraction logic `contract.property` may not be correctly accessing the joined property data from the Supabase query response.

### **Database Verification**

✅ **Database has correct data:**
- Tenants exist with active contracts
- Contracts are properly linked to properties via `property_id`
- Sample data shows tenants like `organikscull@gmail.com` have active contracts with properties

✅ **API Query is correct:**
```sql
-- From tenantApi.getMyContracts() in lib/api.ts
SELECT *,
  property:properties(id, title, address, city, neighborhood, property_type),
  maintenance_requests:maintenance_requests(id, title, status, priority, created_at)
FROM contracts 
WHERE tenant_id = userContext.userId
```

### **Data Flow Analysis**

1. **✅ Authentication**: `getCurrentUserContext()` correctly identifies tenant users
2. **✅ API Call**: `tenantApi.getMyContracts()` executes successfully  
3. **✅ Contract Filtering**: Active contracts are filtered correctly
4. **❌ Property Extraction**: `contract.property` fails to extract property data
5. **❌ Result**: Empty properties array leads to "no properties available" message

### **Evidence from User Feedback**

- **Q2 Answer**: "it shows the message already, the problem is that it shows also for tenants that have a property assigned"
- **Q5 Answer**: "the tenant in my app will have only one property assigned"

This confirms:
- The empty state message is being shown incorrectly
- Tenants DO have properties assigned but they're not being loaded
- Each tenant has exactly one property (simplifies the fix)

### **Technical Solution Required**

**Primary Fix:** Correct the property data extraction in `app/maintenance/add.tsx`

**Secondary Improvements:**
1. Add comprehensive logging to debug data structure
2. Improve error handling for property extraction failures
3. Auto-select property when tenant has only one (as per Q5)
4. Add TypeScript interfaces for better type safety

### **Files Requiring Modification**

1. **`app/maintenance/add.tsx`** (lines 60-61) - Fix property extraction logic
2. **`app/maintenance/add.tsx`** (lines 73-82) - Add debugging and improve filtering logic
3. **`app/maintenance/add.tsx`** (add auto-selection logic for single property)

### **Testing Strategy**

1. **Use existing tenant data**: Test with `organikscull@gmail.com` who has an active contract
2. **Verify data flow**: Add logging to trace property extraction
3. **Test auto-selection**: Ensure single property is pre-selected
4. **Test edge cases**: Handle missing or invalid property data gracefully

### **Expected Outcome**

After fixing the property extraction logic:
- Tenants with active contracts will see their assigned property in the dropdown
- Property will be auto-selected if tenant has only one assignment  
- Empty state message will only show for tenants with no active contracts
- Maintenance request creation will work correctly for tenant users

### **Key Insight**

This is a **data mapping issue**, not a database or authentication problem. The API is correctly fetching the data, but the frontend is not properly extracting it from the response structure.