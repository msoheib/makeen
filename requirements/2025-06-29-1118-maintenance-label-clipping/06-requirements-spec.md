# Requirements Specification: Fix Maintenance Card Label Clipping

## Problem Statement

The status chips (tags/labels) in maintenance cards are experiencing vertical text clipping issues across both mobile and web platforms. This affects user experience by making status text partially unreadable, impacting users' ability to quickly identify maintenance request statuses in production.

## Solution Overview

Remove fixed height constraints from status chips and implement proper auto-sizing with padding-based spacing to ensure text is fully visible while maintaining visual consistency with the existing design system.

## Functional Requirements

### FR1: Text Visibility
- Status chip text must be fully visible without vertical clipping
- Solution must work on both mobile and web platforms
- Fix must work across both light and dark themes

### FR2: Visual Consistency
- Maintain current color scheme and font weight (500)
- Preserve existing visual density and spacing
- Ensure consistency with other status badge components in the app

### FR3: Cross-Component Consistency
- Apply similar fixes to other Chip components with height constraints
- Maintain design system coherence across all status indicators

## Technical Requirements

### TR1: Primary Component Fix
**File:** `/components/MaintenanceRequestCard.tsx`
**Lines:** 143-145 (statusChip style)
**Changes:**
- Remove: `height: 26` constraint
- Add: `paddingVertical: 4` (following StatusBadge pattern)
- Add: `minHeight: 26` to prevent chips from becoming too small

### TR2: Style Implementation
```tsx
statusChip: {
  minHeight: 26,        // Prevents too-small chips on different densities
  paddingVertical: 4,   // Consistent with StatusBadge component
  // Remove: height: 26
},
```

### TR3: Audit Other Chip Components
Search and fix similar height constraints in:
- Currency selection chips
- Property status chips
- Any other components using React Native Paper Chip with fixed heights

### TR4: Preserve Existing Behavior
- Maintain `mode="flat"` for status chips
- Keep existing color transparency pattern: `${statusColors[status]}20`
- Preserve font weight and text styling
- Maintain RTL layout support

## Implementation Hints

### Pattern to Follow
Base implementation on the working StatusBadge component pattern:
```tsx
// StatusBadge successful pattern
container: {
  borderRadius: 16,
  paddingHorizontal: 10,
  paddingVertical: 4,
  alignSelf: 'flex-start',
}
```

### Files to Examine for Similar Issues
1. `/app/currency/index.tsx` - Known to have `height: 28` constraint on chips
2. `/components/PropertyCard.tsx` - Check for any height constraints
3. Any component using React Native Paper Chip component

### Testing Approach
- Test on both iOS and Android simulators
- Test on web platform
- Verify with different system font sizes
- Test RTL layout functionality
- Verify both light and dark theme appearance

## Acceptance Criteria

### AC1: Visual Fix
- [ ] Status chip text is fully visible without clipping
- [ ] Text remains readable at different font scale settings
- [ ] Fix works consistently across mobile and web platforms

### AC2: Design Consistency
- [ ] Visual spacing matches other status badges in the app
- [ ] Color scheme and typography unchanged
- [ ] Chips maintain appropriate minimum size on all screen densities

### AC3: Cross-Platform Compatibility
- [ ] Fix works on iOS mobile
- [ ] Fix works on Android mobile  
- [ ] Fix works on web platform
- [ ] RTL layout continues to work correctly

### AC4: System Integration
- [ ] No regression in existing functionality
- [ ] Theme switching continues to work
- [ ] Component remains performant with large lists

## Assumptions

### Assumption 1: React Native Paper Behavior
React Native Paper's Chip component will properly auto-size when height constraints are removed, similar to other Paper components.

### Assumption 2: Design System Coherence
The StatusBadge component's padding approach (paddingVertical: 4) is the correct pattern to follow for consistent visual density.

### Assumption 3: Minimum Height Necessity
A minHeight constraint is needed to prevent chips from becoming too small on devices with different screen densities or accessibility settings.

### Assumption 4: Limited Scope
The clipping issue is primarily limited to components with explicit height constraints and does not indicate broader text rendering problems in the app.

## Dependencies

- React Native Paper library behavior for Chip component auto-sizing
- Existing theme system and color definitions in `/lib/theme.ts`
- RTL helper functions in `/lib/rtl.ts`
- StatusBadge component patterns for consistency reference