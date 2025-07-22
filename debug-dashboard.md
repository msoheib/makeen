# Dashboard Statistics Debug Guide

## Issue Analysis: Dashboard shows zeros instead of real data

### Debugging Steps

1. **Check Browser Console Logs**
   Open the dashboard and check browser console for these debug messages:
   ```
   [Dashboard Debug] User Context: {...}
   [Dashboard Debug] Properties Data: {...}  
   [Dashboard Debug] Dashboard Summary: {...}
   ```

2. **Verify Database Data**
   Run these SQL queries in Supabase to check if data exists:
   ```sql
   -- Check if properties exist
   SELECT COUNT(*) as properties_count, status, COUNT(*) 
   FROM properties 
   GROUP BY status;
   
   -- Check if profiles exist
   SELECT COUNT(*) as profiles_count, role 
   FROM profiles 
   GROUP BY role;
   
   -- Check if contracts exist
   SELECT COUNT(*) as contracts_count, status 
   FROM contracts 
   GROUP BY status;
   ```

3. **Test API Endpoints**
   Manually test these API calls:
   - `/api/properties` - Should return property list
   - `/api/profiles?role=tenant` - Should return tenant list  
   - `/api/dashboard/summary` - Should return dashboard statistics

4. **Check User Context Issues**
   Look for these patterns in console:
   - User role is 'admin', 'manager', or 'owner' 
   - `ownedPropertyIds` array is populated for owners
   - `rentedPropertyIds` array is populated for tenants
   - Authentication context is properly loaded

### Common Causes & Solutions

#### Cause 1: Empty Database
**Symptoms**: All API calls return empty arrays
**Solution**: Add sample data to test with

#### Cause 2: User Relationships Missing  
**Symptoms**: User context shows empty property arrays
**Solution**: 
- Check `properties.owner_id` points to valid profile IDs
- Check `contracts.tenant_id` and `contracts.property_id` relationships
- Verify user approval status is 'approved' not 'pending'

#### Cause 3: Security Filtering Too Restrictive
**Symptoms**: API returns filtered empty results  
**Solution**: Check RLS policies and security filters in `lib/security.ts`

#### Cause 4: New User Approval System
**Symptoms**: New users show zeros, existing users work fine
**Solution**: 
- Check if user status is 'approved' in database
- Update user status: `UPDATE profiles SET status = 'approved' WHERE id = 'user-id'`

### Quick Fix for Testing

Add this temporary debugging code to dashboard to see raw API responses:

```javascript
useEffect(() => {
  console.log('=== DASHBOARD DEBUG ===');
  console.log('Properties response:', properties);
  console.log('Tenants response:', tenants);  
  console.log('Dashboard summary:', dashboardSummary);
  console.log('User context:', userContext);
}, [properties, tenants, dashboardSummary, userContext]);
```

### Production Fix

If the issue is confirmed to be user relationships or approval status:

1. **Update existing users to approved status**:
   ```sql
   UPDATE profiles SET status = 'approved' WHERE status = 'pending';
   ```

2. **Fix property-owner relationships**:
   ```sql  
   -- Check for orphaned properties
   SELECT * FROM properties WHERE owner_id NOT IN (SELECT id FROM profiles);
   ```

3. **Fix contract relationships**:
   ```sql
   -- Check for orphaned contracts  
   SELECT * FROM contracts WHERE tenant_id NOT IN (SELECT id FROM profiles)
   OR property_id NOT IN (SELECT id FROM properties);
   ```

The dashboard statistics depend on proper relationships between users, properties, and contracts in the database.