# Requirements Specification

## Problem Statement

The profile page displays "غير محدد" (Not set) for all user fields despite the database containing actual user data. Analysis reveals the authentication system is falling back to demo admin context instead of using real authenticated users, causing profile data queries to fail.

## Solution Overview

Fix the authentication → profile data flow by removing demo fallbacks, implementing proper error handling, ensuring data isolation, and displaying required login fields while allowing optional fields to show empty.

## Functional Requirements

### FR1: Real User Data Display
- **Required fields** (first_name, last_name, email) MUST display actual values from database
- **Optional fields** (phone, address, city) can show empty when null in database
- No "غير محدد" (Not set) for required fields that exist in database

### FR2: Authentication Flow Fix
- Remove demo admin fallback from `lib/security.ts`
- Properly handle authentication failures without masking real issues
- Ensure correct user ID is passed to profile data queries

### FR3: Data Structure Unification
- Standardize profile data structure between store and database
- Map database fields (first_name, last_name) to UI display consistently
- Eliminate data synchronization issues

### FR4: User Data Isolation (CRITICAL)
- Each user MUST only see their own profile data
- No cross-user data leakage
- Proper authentication boundaries enforcement

### FR5: Comprehensive Logging
- Add logging to trace authentication → profile data flow
- Log authentication failures and fallback scenarios
- Enable debugging of data flow issues

## Technical Requirements

### TR1: Authentication System Changes
**Files to modify:**
- `lib/security.ts` - Remove demo fallback logic (lines 24-36)
- `hooks/useUserProfile.ts` - Fix user ID retrieval and error handling
- `lib/store.ts` - Ensure auth state consistency

### TR2: Profile Data Handling
**Database Schema (verified via Supabase MCP):**
```sql
profiles table fields:
- id (uuid, NOT NULL)
- first_name (text, nullable) 
- last_name (text, nullable)
- email (text, nullable)
- phone (text, nullable)
- address (text, nullable)
- city (text, nullable)
- country (text, nullable)
- role (text, nullable)
```

**Required Field Mapping:**
- Database `first_name` → UI display (REQUIRED)
- Database `last_name` → UI display (REQUIRED)  
- Database `email` → UI display (REQUIRED)

**Optional Field Handling:**
- Database `phone` → Show empty if null
- Database `address` → Show empty if null
- Database `city` → Show empty if null

### TR3: Data Flow Fixes

**Current Broken Flow:**
```
User Login → Auth Fails → Demo Fallback → Wrong User ID → Profile Query Fails → "غير محدد"
```

**Required Fixed Flow:**
```
User Login → Real Auth → Correct User ID → Profile Query Success → Real Data Display
```

### TR4: Error Handling Implementation
- Distinguish between "no authentication" vs "no profile data"
- Graceful handling of partial profile data
- Clear error messages for authentication failures
- No silent fallbacks to demo data

### TR5: Security & Isolation Testing
- Test with multiple user accounts (confirmed database has multiple users)
- Verify each user sees only their own data
- Test authentication boundary enforcement
- Audit user data access patterns

## Implementation Hints

### Fix Authentication Chain
1. **`lib/security.ts`**: Remove demo admin fallback, return null on auth failure
2. **`hooks/useUserProfile.ts`**: Handle null auth properly, add error states
3. **`app/profile/index.tsx`**: Update display logic for required vs optional fields

### Database-UI Mapping Pattern
```typescript
// Map database fields to UI state
const mapDatabaseToUI = (dbProfile) => ({
  firstName: dbProfile.first_name || '', // Required - never show "Not set"
  lastName: dbProfile.last_name || '',   // Required - never show "Not set"
  email: dbProfile.email || '',          // Required - never show "Not set"
  phone: dbProfile.phone || '',          // Optional - can be empty
  address: dbProfile.address || '',      // Optional - can be empty
  city: dbProfile.city || '',            // Optional - can be empty
  country: dbProfile.country || 'Saudi Arabia' // Default value
});
```

### Logging Strategy
Add logging at each step:
1. Authentication state retrieval
2. User ID extraction  
3. Profile API query execution
4. Data transformation and display

## Acceptance Criteria

### AC1: Real Data Display
- [ ] Profile page shows actual user data from database (سلمان الدغيري, Mohammed Soheib, etc.)
- [ ] Required fields (name, email) never show "غير محدد" when data exists
- [ ] Optional fields can show empty when null in database

### AC2: Authentication Fixes
- [ ] Demo admin fallback removed from security layer
- [ ] Real authentication errors properly handled
- [ ] Correct user ID passed to profile queries

### AC3: Data Isolation Verified
- [ ] User A sees only their profile data (سلمان الدغيري sees their data)
- [ ] User B sees only their profile data (Mohammed Soheib sees their data)
- [ ] No cross-user data leakage in any scenario

### AC4: Unified Data Structure
- [ ] Database fields properly mapped to UI display
- [ ] No more firstName/first_name synchronization issues
- [ ] Consistent data handling across components

### AC5: Logging & Debugging
- [ ] Comprehensive logs for authentication flow
- [ ] Clear error messages for debugging
- [ ] Traceable data flow from auth to display

## Critical Security Notes

**User emphasized: "yes absolutely - it is very important to have isolation"**

- **CRITICAL**: User data isolation MUST be verified with multiple accounts
- **MANDATORY**: Each user can only access their own profile
- **REQUIRED**: Authentication boundaries properly enforced
- **TESTING**: Use existing database users (سلمان الدغيري, Mohammed Soheib, etc.) for isolation testing

## Database Verification

✅ **Confirmed via Supabase MCP:**
- Database connectivity working
- Profiles table exists with correct structure
- Real user data available for testing:
  - User 1: "سلمان الدغيري" (sloom.22.2018@gmail.com)
  - User 2: "Mohammed Soheib" (organikscull@gmail.com)
  - User 3: "مم مم" (aaa@gmail.com)

The database has the data - the issue is in the authentication → profile retrieval chain.