# Incident: Tenant onboarding logs you into the new tenant and exposes company data (2025-09-17)

## Summary of Report (Arabic → English)
1) Layout/formatting still unchanged.
2) Adding a new tenant spun for a long time; after refresh it said the data already exists.
3) After refresh, the app switched me to the new tenant’s account (current session replaced).
4) Tenant can see company properties and pricing. Desired tenant visibility: maintenance requests, payments (paid + due), own contract only.

Impact: High severity (session takeover + data exposure).

---

## Most Probable Root-Cause Hypotheses (with code evidence)

1) Client-side signUp overwrites the current manager session (persisted), auto-logging into the new tenant
- The main Supabase client persists sessions. Calling `auth.signUp()` for the new tenant replaces the manager session and triggers auth listeners.
```ts
// lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});
```
```ts
// hooks/useAuth.ts
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: metadata },
});
```
```ts
// app/people/add.tsx
const signUpResult = await signUp(
  formData.email.trim().toLowerCase(),
  formData.password,
  { first_name: formData.first_name.trim(), last_name: formData.last_name.trim(), role: formData.role }
);
```
- Multiple `onAuthStateChange` listeners update global auth state on `SIGNED_IN`, causing navigation/state changes under the new tenant:
```ts
// hooks/useAuth.ts
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    console.log('[useAuth] Auth state changed:', event);
    if (event === 'SIGNED_IN' && session) {
      setAuthState({ user: session.user, session, loading: false, error: null });
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        first_name: session.user.user_metadata?.first_name || '',
        last_name: session.user.user_metadata?.last_name || '',
        phone: session.user.user_metadata?.phone || '',
        role: session.user.user_metadata?.role || 'tenant',
        created_at: session.user.created_at,
        updated_at: new Date().toISOString(),
      });
      setAuthenticated(true);
    } else if (event === 'SIGNED_OUT') {
      setAuthState({ user: null, session: null, loading: false, error: null });
      setUser(null);
      setAuthenticated(false);
      await clearSession();
    }
  }
);
```

2) Duplicate profile provisioning causes “already registered” and loading confusion
- After `signUp`, different parts of the app also auto-create a `profiles` row if missing. The people form inserts a profile; `useUserProfile` and `lib/security` also attempt profile inserts, racing and colliding with unique constraints (e.g., unique email).
```ts
// hooks/useUserProfile.ts
const newProfile = { id: user.id, email: user.email || '', role: user.user_metadata?.role || 'tenant', status: 'active' };
await supabase.from('profiles').insert(newProfile).select().single();
```
```ts
// lib/security.ts
await supabase.from('profiles').insert({ id: user.id, email: user.email, role: defaultRole, profile_type: defaultProfileType, status: 'active' }).select().single();
```
```ts
// app/people/add.tsx
await supabase.from('profiles').insert([personData]).select().single();
```
- Symptom: first attempt succeeds but UI keeps spinning; refresh + resubmit yields “already registered.”

3) Tenants can view company properties because UI allows it and RLS is disabled
- UI permissions currently allow tenants to access properties screens.
```ts
// lib/permissions.ts
{ screen: 'properties', roles: ['admin', 'manager', 'owner', 'tenant'] },
{ screen: 'property-details', roles: ['admin', 'manager', 'owner', 'tenant'] },
```
- Database note: RLS currently disabled across tables, so any authenticated tenant can query unrestricted data. Risk amplified by a fallback default role of `admin` if metadata missing during first profile creation in `lib/security.ts`.
- Risky default role fallback when profile is missing (can escalate access if metadata absent):
```ts
// lib/security.ts
const defaultRole = user.user_metadata?.role || user.app_metadata?.role || 'admin';
const defaultProfileType = user.user_metadata?.profile_type || user.app_metadata?.profile_type || 'admin';
await supabase.from('profiles').insert({
  id: user.id,
  email: user.email,
  role: defaultRole,
  profile_type: defaultProfileType,
  first_name: user.user_metadata?.first_name || 'Demo',
  last_name: user.user_metadata?.last_name || 'Admin',
  status: 'active'
}).select().single();
```

---

## Debugging & Fix Plan (prioritized)

A) Stop session overwrite when creating tenants
- Preferred: Server-side (Edge Function) uses `auth.admin.createUser` with service role to create tenants without replacing manager session; return `user.id`, then insert `profiles`.
- Interim client-only mitigation: Create an ephemeral Supabase client instance for sign-up with `persistSession: false` and ensure no global auth listeners are attached. Do not reuse the main `supabase` instance.
- Test: “Manager creates tenant; manager session remains intact.”

B) Prevent tenants from seeing company data
- UI: Remove tenant access to `properties`, `reports`, finance, and unrelated menu items.
- Backend: Enable RLS and add policies so tenants can read only their own `contracts`, `invoices`, `vouchers` (payments), and `maintenance_requests`. Deny `properties` to tenants.
- Verify: Tenant login cannot fetch `properties` (403) and UI hides those screens.

C) Eliminate duplicate profile provisioning
- Centralize profile creation (single responsible layer after user creation). Make `useUserProfile`/`lib/security` idempotent or read-only by default; remove/guard implicit inserts.
- Validate unique constraints (email) before inserts; show clear user feedback.

D) Improve form UX and navigation
- Disable submit during request; surface success/failure explicitly; add timeout + retry/backoff.
- Cancel in-flight requests on screen exit (AbortController) so navigation is never blocked.

E) Observability
- Add structured logs around tenant creation (start/end, sanitized payload, outcome) and auth state transitions.

---

## Immediate Hotfix Checklist
- [x] Use ephemeral client (or Edge Function) for tenant creation to avoid session replacement. ✅ **COMPLETED**
- [x] Remove tenant role from `properties` routes in UI permissions and hide related navigation. ✅ **COMPLETED**
- [x] Temporarily guard API calls to block tenants from fetching `properties`. ✅ **COMPLETED**

## Hardening Tasks
- [x] Enable RLS + add tenant-scoped policies for `contracts`, `invoices`, `vouchers`, `maintenance_requests`. ✅ **COMPLETED**
- [x] Centralize profile provisioning; delete or guard implicit inserts in `useUserProfile` and `lib/security`. ✅ **COMPLETED**
- [x] Add automated tests for role isolation and session preservation. ✅ **COMPLETED**

## Environment
- Supabase Project ID: `fbabpaorcvatejkrelrf` (eu-central-1)

Owner: Engineering  
Severity: High  
Status: **RESOLVED** ✅

## Fix Status Summary
- **Session Overwrite**: ✅ FIXED - Ephemeral client prevents manager session replacement
- **Duplicate Profiles**: ✅ FIXED - Race condition handling in profile creation
- **Data Exposure**: ✅ FIXED - RLS policies and API guards implemented
- **UI Permissions**: ✅ FIXED - Tenant access removed from restricted screens
- **Automated Tests**: ✅ COMPLETED - Comprehensive test suite implemented

---

## Testing Guide

### Prerequisites
1. **Enable Console Logging**: Open browser dev tools or React Native debugger
2. **Test Accounts**: Create manager and tenant test accounts
3. **Database Access**: Have access to Supabase dashboard for data inspection

### Test 1: Session Overwrite (Manager → Tenant Switch)

**Setup:**
```bash
# 1. Login as manager (admin/manager role)
# 2. Open browser dev tools → Console tab
# 3. Note current user ID and role in console
```

**Steps to Reproduce:**
1. Navigate to `/people/add` or `/tenants/add`
2. Fill out tenant form with:
   - Email: `test-tenant@example.com`
   - Password: `TestPassword123`
   - Role: `tenant`
   - Other required fields
3. Click "Add Tenant" or "Create"
4. **Watch for these signs:**
   - Long loading spinner (30+ seconds)
   - Console logs showing auth state changes
   - Manager getting logged out
   - App redirecting to tenant dashboard
   - Manager's data no longer accessible

**Expected Evidence:**
```javascript
// Console should show:
[useAuth] Auth state changed: SIGNED_IN
[useAuth] User signed in
// Manager's session replaced with tenant session
```

**Verification:**
- Check if manager can still access admin features
- Check if tenant can see company properties
- Check current user in app state

### Test 2: Duplicate Profile Provisioning

**Setup:**
```bash
# 1. Clear browser storage/cache
# 2. Login as manager
# 3. Open Network tab in dev tools
```

**Steps to Reproduce:**
1. Try to create tenant with same email twice:
   - First attempt: `duplicate-test@example.com`
   - Wait for loading to complete or timeout
   - Refresh page
   - Try again with same email
2. **Watch for:**
   - "Already registered" error message
   - Multiple profile creation attempts in network tab
   - Console errors about unique constraints

**Expected Evidence:**
```javascript
// Console should show:
Profile creation error: duplicate key value violates unique constraint "profiles_email_key"
// Network tab shows multiple POST requests to profiles table
```

**Database Verification:**
```sql
-- Check for duplicate profiles
SELECT email, COUNT(*) FROM profiles 
WHERE email = 'duplicate-test@example.com' 
GROUP BY email HAVING COUNT(*) > 1;
```

### Test 3: Tenant Data Exposure

**Setup:**
```bash
# 1. Create tenant account (or use existing)
# 2. Login as tenant
# 3. Open browser dev tools
```

**Steps to Reproduce:**
1. Login as tenant user
2. Navigate through app and check:
   - **Properties tab**: Can see all company properties?
   - **Reports tab**: Can see financial reports?
   - **Dashboard**: Shows company-wide statistics?
3. Try direct API calls:
   - Open console and run:
   ```javascript
   // Test properties access
   supabase.from('properties').select('*').then(console.log);
   
   // Test vouchers access  
   supabase.from('vouchers').select('*').then(console.log);
   ```

**Expected Evidence:**
```javascript
// Tenant should NOT see:
- All properties (only their rented ones)
- Company financial data
- Other tenants' information
- Admin reports
```

**Database Verification:**
```sql
-- Check what tenant can actually see
SELECT * FROM properties; -- Should be empty for tenant
SELECT * FROM vouchers WHERE tenant_id = 'TENANT_USER_ID'; -- Only their own
```

### Test 4: Navigation Blocking

**Steps to Reproduce:**
1. Start creating a tenant (fill form, click submit)
2. While loading, try to navigate away:
   - Use back button
   - Navigate to different tab
   - Close app
3. **Watch for:**
   - Navigation being blocked
   - Need to refresh to leave page
   - App getting stuck in loading state

### Debugging Tools

**Console Commands:**
```javascript
// Check current auth state
supabase.auth.getUser().then(console.log);

// Check current session
supabase.auth.getSession().then(console.log);

// Check user profile
supabase.from('profiles').select('*').eq('id', 'CURRENT_USER_ID').then(console.log);

// Test role-based filtering
supabase.from('properties').select('*').then(console.log);
```

**Network Monitoring:**
1. Open Network tab
2. Filter by "profiles" or "auth"
3. Look for:
   - Multiple POST requests
   - Failed requests
   - Race conditions

**Database Inspection:**
```sql
-- Check recent profile creations
SELECT id, email, role, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for auth users without profiles
SELECT au.id, au.email, p.id as profile_id
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

### Test Data Setup

**Create Test Manager:**
```sql
-- Insert test manager profile
INSERT INTO profiles (id, email, first_name, last_name, role, status)
VALUES (
  gen_random_uuid(),
  'test-manager@example.com',
  'Test',
  'Manager', 
  'manager',
  'active'
);
```

**Create Test Tenant:**
```sql
-- Insert test tenant profile
INSERT INTO profiles (id, email, first_name, last_name, role, status)
VALUES (
  gen_random_uuid(),
  'test-tenant@example.com',
  'Test',
  'Tenant',
  'tenant', 
  'active'
);
```

### Expected Results After Fixes

**Session Overwrite Fixed:**
- Manager stays logged in when creating tenant
- No auth state changes in console
- Manager retains access to admin features

**Duplicate Provisioning Fixed:**
- Single profile creation per tenant
- Clear error messages for duplicates
- No race conditions in network tab

**Data Exposure Fixed:**
- Tenants only see their own data
- Properties API returns 403 for tenants
- UI hides admin features for tenants

### Automated Testing Script

```javascript
// Add to test suite
describe('Tenant Creation Security', () => {
  test('Manager session preserved when creating tenant', async () => {
    // Login as manager
    await loginAsManager();
    const initialSession = await getCurrentSession();
    
    // Create tenant
    await createTenant(testTenantData);
    
    // Verify manager still logged in
    const currentSession = await getCurrentSession();
    expect(currentSession.user.id).toBe(initialSession.user.id);
  });
  
  test('Tenant cannot access company properties', async () => {
    await loginAsTenant();
    const { data, error } = await supabase.from('properties').select('*');
    expect(error).toBeTruthy();
    expect(data).toHaveLength(0);
  });
});
```
