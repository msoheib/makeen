# Property Access Control System Requirements

## Problem Statement

The current property access control system has critical bugs preventing property owners from seeing their properties. Three specific issues identified:
1. Hard-coded owner ID (`'1'`) in owner properties screen
2. Incorrect owner assignment during property creation
3. Inconsistent security context usage across property screens

## Solution Overview

Fix existing bugs and implement comprehensive role-based property access with proper ownership management and notification system.

## Functional Requirements

### FR1: Property Visibility Rules
- **Tenants**: See only properties with active contracts (cached in security context)
- **Property Owners**: See only properties they own (based on `owner_id`)
- **Property Managers/Admin**: See all properties system-wide

### FR2: Property Creation Rules
- **Property Owners**: Can only create properties for themselves (auto-assigned ownership)
- **Property Managers/Admin**: Can create properties for any owner (with owner selection dropdown)

### FR3: Property Management Access
- **Property Owners**: Can modify only their own properties
- **Property Managers/Admin**: Can modify any property + transfer ownership

### FR4: Notification System
- **Requirement**: Property owners receive notifications when managers create properties on their behalf
- **Trigger**: Property creation by non-owner user

### FR5: Ownership Transfer
- **Capability**: Property managers can reassign property ownership
- **Location**: Property details screen
- **Access**: Manager/admin role only

## Technical Requirements

### TR1: Critical Bug Fixes

**File: `app/owner/properties.tsx`**
- **Line 28**: Replace `const ownerId = '1';` with proper user context
- **Implementation**: Use `getCurrentUserContext()` to get authenticated user ID
- **Pattern**: Follow same pattern as main properties screen

**File: `app/properties/add.tsx`**
- **Lines 91-97**: Fix owner assignment logic
- **Current Issue**: Fetches first owner profile instead of current user
- **Solution**: Use `user.id` directly for property owners, dropdown for managers

**File: `app/properties/add.tsx`**
- **Missing**: Role-based UI differences
- **Add**: Owner selection dropdown visible only to managers/admin
- **Pattern**: Use `getCurrentUserContext().role` for conditional rendering

### TR2: API Extensions

**File: `lib/api.ts:propertiesApi.create()`**
- **Enhancement**: Add notification trigger when manager creates property for owner
- **Parameters**: Include `createdBy` user ID and `ownerId` for comparison
- **Notification**: Call notification API when `createdBy !== ownerId`

**File: `lib/api.ts:profilesApi.getAll()`**
- **Usage**: Reuse existing API for owner selection dropdown
- **Filter**: `role = 'owner'` for dropdown options
- **Integration**: Standard dropdown component pattern

### TR3: Security Context Enhancements

**File: `lib/security.ts:getCurrentUserContext()`**
- **Tenant Validation**: Ensure strict active contract requirement (no expired contracts)
- **Caching Strategy**: Pre-validate and cache tenant property access during login
- **Consistency**: All property screens must use this security context

**Role Validation Pattern:**
```typescript
const userContext = await getCurrentUserContext();
if (userContext.role === 'manager' || userContext.role === 'admin') {
  // Full access
} else if (userContext.role === 'owner') {
  // Own properties only
} else if (userContext.role === 'tenant') {
  // Active contract properties only
}
```

### TR4: New Features Implementation

**Property Details Screen: `app/properties/[id].tsx`**
- **Add**: Ownership transfer action for managers/admin
- **UI**: Transfer ownership button/modal
- **Validation**: Confirm transfer with owner selection
- **Security**: Manager/admin role check before showing action

**Add Property Form: `app/properties/add.tsx`**
- **Conditional UI**: Show owner dropdown only for managers/admin
- **Default Behavior**: Auto-assign to current user for property owners
- **Validation**: Ensure selected owner exists and has 'owner' role

## Implementation Hints and Patterns

### Security Pattern (Existing)
```typescript
// Use this pattern in all property screens
const { data: userContext } = useApi(() => getCurrentUserContext(), []);
const ownerId = userContext?.userId;
```

### Role-Based UI Pattern
```typescript
// Conditional rendering for manager features
{(userContext?.role === 'manager' || userContext?.role === 'admin') && (
  <OwnerSelectionDropdown />
)}
```

### Property Creation Pattern
```typescript
// Owner assignment logic
const ownerId = userContext?.role === 'owner' 
  ? userContext.userId 
  : selectedOwnerId; // From dropdown for managers
```

### Notification Trigger Pattern
```typescript
// In propertiesApi.create()
if (createdByUserId !== property.owner_id) {
  await notificationsApi.create({
    user_id: property.owner_id,
    type: 'property_created',
    message: 'A property has been added to your portfolio',
    related_entity_type: 'property',
    related_entity_id: property.id
  });
}
```

## Acceptance Criteria

### AC1: Bug Resolution
- [ ] Property owners can see their properties in `app/owner/properties.tsx`
- [ ] Properties are assigned to correct owner during creation
- [ ] All property screens use consistent security context

### AC2: Role-Based Access
- [ ] Tenants see only active contract properties
- [ ] Property owners see only their properties
- [ ] Managers/admins see all properties

### AC3: Property Creation
- [ ] Property owners can only create for themselves
- [ ] Managers can select any owner during creation
- [ ] Owner selection dropdown only visible to managers/admin

### AC4: Ownership Management
- [ ] Managers can transfer property ownership from details screen
- [ ] Ownership transfer updates `owner_id` field
- [ ] Property access updates immediately after transfer

### AC5: Notifications
- [ ] Owners receive notification when manager creates property for them
- [ ] Notification includes property details and navigation
- [ ] No notification sent when owner creates own property

## Assumptions

### Security Assumptions
- User authentication is properly validated before property access
- Role assignment is managed by existing user management system
- Property ownership changes are permanent (no historical access)

### Technical Assumptions
- Existing notification system supports property-related notifications
- Database foreign key constraints ensure data integrity
- Current security context caching performs adequately

### Business Assumptions
- Property managers have legitimate business need for full property access
- Ownership transfers are infrequent administrative actions
- Property owners prefer immediate notification of portfolio changes