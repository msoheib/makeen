# Design Document

## Overview

The TenantsScreen component is experiencing React Hooks violations due to inconsistent hook ordering between renders. The error indicates that hooks are being called in different orders, and there's an undefined component being rendered. This design addresses the root causes and provides a systematic approach to fix the issues.

## Architecture

### Root Cause Analysis

Based on the error log and code analysis, the issues are:

1. **Hook Order Violation**: The error shows 28 hooks in one render vs 27 in another, with a `useCallback` appearing/disappearing
2. **Undefined Component**: There's a component being rendered that's undefined, likely due to import/export issues
3. **Conditional Hook Usage**: Hooks may be called conditionally or in different orders based on state changes

### Key Problem Areas

1. **Memoized Components**: The `ListHeaderComponent` is memoized but may be causing hook order issues
2. **Conditional Rendering**: Multiple conditional renders based on `permissionLoading`, `canAccessTenants`, and `hasError`
3. **Import Issues**: Potential undefined component imports
4. **Hook Dependencies**: Complex dependency arrays in `useMemo` and `useCallback`

## Components and Interfaces

### Fixed Component Structure

```typescript
interface TenantsScreenProps {}

interface TenantItem {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  status: 'active' | 'pending' | 'inactive';
  is_foreign?: boolean;
}

interface TenantStats {
  total: number;
  active: number;
  pending: number;
  foreign: number;
}
```

### Hook Organization

The component will be restructured to ensure consistent hook ordering:

1. **Always-called hooks** at the top level
2. **Conditional logic** after all hooks
3. **Memoized values** with stable dependencies
4. **Event handlers** with consistent callback signatures

## Data Models

### State Management

```typescript
// Core state (always present)
const [searchQuery, setSearchQuery] = useState('');
const [refreshing, setRefreshing] = useState(false);

// Derived state from hooks (always called)
const { hasAccess, loading: permissionLoading, userContext } = useScreenAccess('tenants');
const { data: tenants, loading: tenantsLoading, error: tenantsError, refetch } = useApi(...);
```

### Computed Values

```typescript
// Stable memoized values
const tenantsData = useMemo(() => tenants || [], [tenants]);
const filteredTenants = useMemo(() => {
  // filtering logic
}, [tenantsData, searchQuery]);
const tenantStats = useMemo(() => {
  // stats calculation
}, [tenantsData]);
```

## Error Handling

### Import/Export Fixes

1. **Verify all imports** are properly exported from their modules
2. **Check component references** in JSX for undefined values
3. **Validate icon imports** from lucide-react-native
4. **Ensure proper default/named exports**

### Hook Order Consistency

1. **Move all hooks to top level** before any conditional logic
2. **Use early returns** after all hooks are called
3. **Stable dependency arrays** for memoized values
4. **Consistent callback signatures**

### Conditional Rendering Strategy

```typescript
// All hooks called first
const hookResults = {
  // ... all hook calls
};

// Then conditional rendering
if (permissionLoading) return <LoadingScreen />;
if (!hasAccess) return <AccessDeniedScreen />;
if (hasError) return <ErrorScreen />;

// Main render
return <MainContent />;
```

## Testing Strategy

### Unit Tests

1. **Hook order consistency** - Test that hooks are called in same order across renders
2. **Component rendering** - Verify all imported components render without errors
3. **State transitions** - Test loading, error, and success states
4. **Search functionality** - Verify filtering works correctly

### Integration Tests

1. **Permission flow** - Test access control with different user roles
2. **Data fetching** - Test API integration and error handling
3. **User interactions** - Test search, refresh, and navigation
4. **RTL support** - Verify right-to-left layout works correctly

### Error Boundary Testing

1. **Component crash recovery** - Test error boundary behavior
2. **Hook violation detection** - Verify fixes prevent hook errors
3. **Undefined component handling** - Test graceful degradation

## Implementation Plan

### Phase 1: Hook Restructuring

1. Move all hook calls to the top of the component
2. Remove conditional hook usage
3. Implement early return pattern after hooks
4. Fix memoization dependencies

### Phase 2: Import/Export Validation

1. Verify all component imports
2. Check for undefined references in JSX
3. Validate icon imports
4. Test component rendering

### Phase 3: Performance Optimization

1. Optimize memoized components
2. Reduce unnecessary re-renders
3. Improve callback stability
4. Enhance list performance

### Phase 4: Testing and Validation

1. Add comprehensive unit tests
2. Test hook order consistency
3. Validate error handling
4. Performance testing