# Context Findings

## Critical Bugs Identified

### Bug #1: Hard-coded Owner ID in Owner Properties Screen
**File:** `app/owner/properties.tsx:28`
**Issue:** Uses hard-coded `ownerId = '1'` instead of current user's ID
**Impact:** Property owners cannot see their own properties

### Bug #2: Incorrect Owner Assignment in Property Creation
**File:** `app/properties/add.tsx:91-97`
**Issue:** Fetches first owner profile instead of using current authenticated user
**Impact:** Properties may be assigned to wrong owner during creation

### Bug #3: Missing Authentication Context
**File:** `app/owner/properties.tsx`
**Issue:** Doesn't use security context system like other screens
**Impact:** Bypasses proper role-based access control

## Current Architecture Analysis

### Property Access Control Files
- **`lib/api.ts`** - Main property API with role-based filtering (lines 98-146)
- **`lib/security.ts`** - Security context and user role management (lines 84-92)
- **`lib/database.types.ts`** - Database schema with owner_id foreign key
- **`app/(tabs)/properties.tsx`** - Main properties screen using proper security
- **`app/owner/properties.tsx`** - Owner-specific screen with bugs
- **`app/properties/add.tsx`** - Property creation form with assignment issues

### Role-Based Access Rules (Current Implementation)
1. **Tenants**: Filter by active contract property IDs from security context
2. **Owners**: Filter by `owner_id = userContext.userId` 
3. **Managers/Admin**: See all properties (no filters applied)

### Property-Owner Relationship
- **Database Field:** `properties.owner_id` → `profiles.id`
- **Security Context:** `userContext.ownedPropertyIds` array
- **Tenant Context:** `userContext.rentedPropertyIds` from active contracts

### Notification System
**File:** `lib/notificationNavigation.ts`
- Existing notification system supports property-related notifications
- Uses `related_entity_type: 'property'` and `related_entity_id`
- Supports navigation to property details screens

### Property Creation Forms
**Current Add Property Form:** `app/properties/add.tsx`
- Uses incorrect owner assignment logic
- No role-based UI differences (owner selection vs auto-assignment)
- Missing notification trigger for manager-created properties

## Implementation Requirements

### Files Requiring Modification
1. **`app/owner/properties.tsx`** - Fix hard-coded owner ID
2. **`app/properties/add.tsx`** - Fix owner assignment and add role-based UI
3. **`lib/api.ts`** - Add notification trigger for property creation
4. **`lib/security.ts`** - Ensure tenant contract status validation

### New Features Needed
1. **Owner Selection UI** - For property managers only
2. **Ownership Transfer UI** - Property details screen for managers
3. **Property Creation Notifications** - When manager creates for owner
4. **Contract Status Validation** - Strict active contract requirement for tenants

### Security Enhancements
1. **Remove hard-coded values** from all property access screens
2. **Consistent security context usage** across all property features
3. **Proper role validation** for property creation and modification
4. **Audit trail** for ownership changes and property assignments

## Related Features Analysis
- **Contract Management:** Links tenants to properties via active contracts
- **User Profile Management:** Handles role assignment and validation
- **Notification System:** Ready for property-related notifications
- **Property Details Screens:** Need ownership transfer functionality