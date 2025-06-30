# Context Findings

Deep analysis of the maintenance card clipping issue and related patterns in the codebase.

## Root Cause Analysis

### The Issue Location
**File:** `/components/MaintenanceRequestCard.tsx` (Lines 201-210)
**Component:** Status Chip using React Native Paper's `Chip` component

### Current Implementation
```tsx
<Chip
  mode="flat"
  style={[
    styles.statusChip,
    { backgroundColor: `${statusColors[request.status]}20` },
  ]}
  textStyle={{ color: statusColors[request.status], fontWeight: '500' }}
>
  {getStatusLabel(request.status)}
</Chip>
```

### Current Styling
```tsx
statusChip: {
  height: 26,  // POTENTIAL CULPRIT: Fixed height constraint
},
```

## Problem Identification

1. **Fixed Height Constraint**: The `statusChip` style sets `height: 26` which may be insufficient for proper text rendering
2. **Cross-Platform Differences**: Text rendering varies between mobile and web, potentially causing clipping on one platform
3. **Font Scaling Issues**: User font size preferences or system scaling may cause text to exceed the 26px height
4. **Chip Component Default Behavior**: React Native Paper's Chip should auto-size based on content when height is not constrained

## Similar Patterns in Codebase

### StatusBadge Component (Working Example)
```tsx
// No fixed height - auto-sizes based on content
container: {
  borderRadius: 16,
  paddingHorizontal: 10,
  paddingVertical: 4,
  alignSelf: 'flex-start',
}
```

### VoucherStatusBadge Component (Working Example)
```tsx
// Uses proper padding instead of fixed height
badgeContainer: {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  borderWidth: 1,
}
```

### PropertyCard Status Chips (Working Example)
```tsx
// Uses React Native Paper Chip without height constraints
<Chip mode="flat" style={styles.statusChip}>
  {status}
</Chip>
```

## Technical Constraints

### Theme System
- Uses Material Design 3 theme with consistent color palette
- Status colors defined with transparency: `${statusColors[status]}20`
- Font weight set to '500' for medium emphasis

### RTL Support
- Component properly handles RTL layout using `rtlStyles.row()`
- Text alignment uses `getTextAlign()` helper

### Platform Considerations
- React Native Paper components behave differently on mobile vs web
- Text rendering engine differences can affect line height calculations

## Files That Need Modification

1. **Primary Fix**: `/components/MaintenanceRequestCard.tsx`
   - Remove or adjust the `height: 26` constraint from `statusChip` style
   - Allow the Chip component to auto-size based on content

## Integration Points

- Used in `/app/(drawer)/(tabs)/maintenance.tsx` for main maintenance list
- Used in `/app/owner/maintenance.tsx` for owner-specific views
- Used in property detail screens and dashboard views
- Component receives theme prop and handles both light/dark modes

## Best Practices from Codebase

1. **Auto-sizing**: Let components determine their own height based on content
2. **Padding over Height**: Use `paddingVertical` instead of fixed `height`
3. **Consistent Styling**: Follow the StatusBadge pattern for similar components
4. **Theme Integration**: Maintain existing color and styling patterns