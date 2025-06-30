# Requirements Specification: Fix Maintenance Page UI Regression

## Problem Statement

After implementing the maintenance card label clipping fix, a critical performance regression has occurred causing:
1. **Missing Stats Section**: The horizontal stats card showing maintenance statistics is no longer visible
2. **Missing Bottom Navigation**: The tab navigation bar has disappeared
3. **Infinite Loading State**: The maintenance page shows perpetual loading on initial app load (web platform)
4. **Cross-tab Impact**: Other tabs are also experiencing loading issues

The root cause is a React Native performance violation in the MaintenanceRequestCard component where StyleSheet.create() is being called inside the component function on every render.

## Solution Overview

Fix the critical performance issue by moving StyleSheet creation outside the component while preserving dynamic theming capabilities. Add input validation to prevent runtime errors that could contribute to the loading issues.

## Functional Requirements

### FR1: Restore Missing UI Elements
- Stats section must be visible showing maintenance request counts
- Bottom navigation bar must be restored and functional
- Page must load completely without infinite loading states

### FR2: Performance Restoration
- Eliminate infinite re-render loops caused by StyleSheet recreation
- Maintain smooth scrolling performance in maintenance list
- Ensure stable navigation between tabs

### FR3: Functionality Preservation
- Preserve all existing dynamic theming capabilities
- Maintain RTL layout support
- Keep all current visual styling and interactions

## Technical Requirements

### TR1: Critical Performance Fix
**File:** `/components/MaintenanceRequestCard.tsx`
**Lines:** 121-192 (StyleSheet.create inside component)

**Required Changes:**
1. **Move Static Styles Outside Component:**
```tsx
// Move outside component function
const staticStyles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    paddingVertical: 12,
  },
  // ... all static styles
});
```

2. **Use useMemo for Dynamic Styles:**
```tsx
// Inside component, use useMemo for theme-dependent styles
const dynamicStyles = useMemo(() => ({
  statusChip: {
    minHeight: 26,
    paddingVertical: 4,
    backgroundColor: `${statusColors[request.status]}20`,
  },
}), [statusColors, request.status]);
```

### TR2: Input Validation
**Add validation for:**
1. **Date Validation (Line 221):**
```tsx
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, 'MMM d, yyyy');
  } catch {
    return 'Invalid Date';
  }
};
```

2. **Image URL Validation (Line 19-40):**
```tsx
const getImageUrl = (imageName: string | undefined | null): string => {
  if (!imageName || typeof imageName !== 'string') {
    return maintenancePlaceholders[0];
  }
  // ... rest of function
};
```

### TR3: Theme Object Optimization
**Lines:** 69-82 (default theme fallback)
**Solution:** Move default theme outside component or use useMemo:
```tsx
const defaultTheme = {
  colors: {
    surface: '#FFFFFF',
    onSurface: '#1C1B1F',
    // ... rest of colors
  }
};

// Inside component
const currentTheme = theme || defaultTheme;
```

### TR4: Status and Priority Colors Optimization
**Lines:** 85-99 (color mappings)
**Solution:** Use useMemo to prevent recreation:
```tsx
const statusColors = useMemo(() => ({
  pending: currentTheme.colors.warning,
  approved: currentTheme.colors.primary,
  in_progress: currentTheme.colors.tertiary,
  completed: currentTheme.colors.success,
  cancelled: currentTheme.colors.error,
}), [currentTheme]);

const priorityColors = useMemo(() => ({
  low: currentTheme.colors.success,
  medium: currentTheme.colors.tertiary,
  high: currentTheme.colors.warning,
  urgent: currentTheme.colors.error,
}), [currentTheme]);
```

## Implementation Approach

### Step 1: Identify All Styles
- Extract all static styles that don't depend on props/state
- Identify dynamic styles that need theme/prop dependencies
- Separate concerns between static and dynamic styling

### Step 2: Refactor StyleSheet Usage
- Move static styles outside component function
- Implement useMemo for dynamic styles with proper dependencies
- Ensure no style objects are recreated unnecessarily

### Step 3: Add Input Validation
- Validate date strings before formatting
- Check image URLs/names for null/undefined
- Add try-catch blocks around potential error points

### Step 4: Test Performance
- Verify elimination of infinite re-renders
- Test maintenance page loads correctly
- Confirm stats section and navigation are restored

## Acceptance Criteria

### AC1: UI Elements Restored
- [ ] Stats section visible with correct maintenance counts
- [ ] Bottom navigation bar functional and visible
- [ ] No infinite loading states on page access

### AC2: Performance Fixed
- [ ] MaintenanceRequestCard renders without causing re-render loops
- [ ] Maintenance page loads quickly on initial app access
- [ ] Smooth scrolling maintained in maintenance list
- [ ] Other tabs load normally without performance issues

### AC3: Functionality Preserved
- [ ] Dynamic theming continues to work (light/dark mode)
- [ ] RTL layout functionality maintained
- [ ] All existing card interactions work (navigation, image display)
- [ ] Status and priority color coding preserved

### AC4: Error Prevention
- [ ] Invalid dates don't crash the component
- [ ] Missing image URLs handled gracefully
- [ ] Component remains stable with malformed API data

## Testing Strategy

### Performance Testing
1. Load maintenance page multiple times
2. Verify no infinite loading states
3. Test scrolling performance with large lists
4. Monitor React Native performance metrics

### Functional Testing
1. Verify stats section shows correct counts
2. Test navigation between tabs
3. Confirm theming works correctly
4. Test with various API data scenarios

### Cross-Platform Testing
- Test on web platform (primary issue location)
- Verify mobile platforms still work correctly
- Ensure no regressions on native platforms

## Dependencies

- React Native StyleSheet optimization patterns
- React useMemo hook for memoization
- Existing theme system compatibility
- API data structure stability

## Assumptions

### Assumption 1: StyleSheet Performance Issue is Root Cause
The StyleSheet.create() inside component is causing the infinite re-renders that prevent the page from completing its loading cycle.

### Assumption 2: Navigation Dependency
The bottom navigation failure is a cascade effect of the maintenance tab hanging in loading state rather than a separate navigation system issue.

### Assumption 3: Stats Section Rendering
The stats section disappears because the page never exits the loading state due to the performance issue, not because of a specific stats calculation problem.

### Assumption 4: Cross-Platform Impact
The issue primarily affects web platform but could impact native platforms with degraded performance rather than complete failure.