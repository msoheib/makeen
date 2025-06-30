# Context Findings

Analysis of the maintenance page regression showing missing stats section and bottom navbar.

## Problem Analysis

### Symptoms Observed
1. **Stats Section Missing**: The horizontal stats card (lines 163-219) is not rendering
2. **Bottom Navigation Missing**: Tab navigation disappeared
3. **Infinite Loading**: Page shows loading state indefinitely on initial app load (web)
4. **Browser Refresh Fixes Display**: Manual refresh on /maintenance route shows the page correctly
5. **Cross-tab Issues**: Other tabs also experiencing loading problems

### Root Cause Investigation

#### Performance Issue in MaintenanceRequestCard
**Critical Finding**: StyleSheet.create() is being called inside the component function (lines 121-192)

```tsx
// PROBLEMATIC CODE - Inside component function
export default function MaintenanceRequestCard({ request, theme, onPress }) {
  // ...
  
  // Create styles inside component with access to current theme
  const styles = StyleSheet.create({
    card: {
      marginBottom: 16,
      borderRadius: 12,
      // ... 70+ lines of styles
    },
  });
  
  return (
    <Card style={[styles.card, shadows.medium]}>
```

**Impact**: This creates new style objects on every render, causing:
- Massive performance degradation
- Potential infinite re-render loops
- Memory leaks
- React Native optimization failures

#### Additional Performance Issues
1. **Theme Object Recreation**: Default theme fallback object recreated on every render (lines 69-82)
2. **Unprotected State Updates**: useState in MaintenanceImage component without error boundaries
3. **Missing Input Validation**: Date formatting and image URL generation without null checks

### Technical Analysis

#### Why Stats Section Disappears
The maintenance page uses a conditional loading state:
```tsx
// Show loading screen while data is being fetched
if (loading && !requests) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader />
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    </SafeAreaView>
  );
}
```

If the MaintenanceRequestCard component causes infinite re-renders, the parent maintenance page may:
1. Never complete data loading
2. Get stuck in loading state
3. Never render the main content including stats section

#### Why Bottom Navigation Disappears
The bottom navigation is part of the drawer/tabs layout. If the maintenance tab crashes or hangs:
1. The entire tab navigation system may become unresponsive
2. React Native navigation may fail to render the tab bar
3. Performance issues cascade to the navigation layer

## Files Requiring Fix

### Primary Fix
**File**: `/components/MaintenanceRequestCard.tsx`
**Issue**: StyleSheet.create() inside component function
**Solution**: Move StyleSheet outside component, use useMemo for dynamic styles

### Secondary Concerns
**File**: `/app/(drawer)/(tabs)/maintenance.tsx`
**Issue**: May need error boundaries to prevent cascade failures
**File**: Navigation layout files may need investigation if issue persists

## Technical Constraints

### React Native Performance Rules
- StyleSheet.create() should only be called once, outside component
- Dynamic styles should use useMemo or StyleSheet.flatten()
- Component re-renders should be minimized for list performance

### Navigation System Integrity
- Tab navigation depends on child components rendering successfully
- Crashes in tab content can break entire navigation system
- Loading states must complete properly to show navigation

## Integration Points

- MaintenanceRequestCard used in FlatList with potentially hundreds of items
- Each card recreation creates performance exponential degradation
- Stats calculation depends on API data loading completing
- Navigation system depends on tab content stability

## Recommended Fix Priority

1. **Immediate**: Fix StyleSheet.create() location in MaintenanceRequestCard
2. **Secondary**: Add error boundaries to prevent cascade failures
3. **Validation**: Add input validation for API data
4. **Testing**: Verify fix resolves both symptoms (stats + navigation)