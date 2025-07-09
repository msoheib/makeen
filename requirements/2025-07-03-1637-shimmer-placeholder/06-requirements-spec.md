# Shimmer Placeholder Requirements Specification

## Problem Statement
The application currently uses simple ActivityIndicator spinners for all loading states, which doesn't maintain layout structure and causes content to "jump" when data loads. Users experience a jarring transition from loading spinner to actual content, especially noticeable in list views and complex card layouts.

## Solution Overview
Implement YouTube-style shimmer placeholder effects that:
- Maintain exact layout dimensions of content being loaded
- Provide smooth animated loading feedback
- Support both light/dark themes and RTL/LTR layouts
- Progressively reveal content as it loads
- Create a polished, modern loading experience

## Functional Requirements

### 1. Shimmer Effect Behavior
- **F1.1** Shimmer animation must move from left-to-right in LTR mode
- **F1.2** Shimmer animation must move from right-to-left in RTL mode (Arabic)
- **F1.3** Animation should continue smoothly until content loads
- **F1.4** Animation must pause when app goes to background
- **F1.5** Animation should resume when app returns to foreground

### 2. Visual Requirements
- **F2.1** Shimmer must match exact dimensions of content it's replacing
- **F2.2** Image areas show solid rectangular shimmers
- **F2.3** Text areas show line-based shimmers with varying widths
- **F2.4** Fixed number of placeholders for lists (5 items default)
- **F2.5** Customizable colors, speed, and corner radius per component

### 3. Theme Support
- **F3.1** Light theme: Use #F0F0F0 base with #E0E0E0 highlight
- **F3.2** Dark theme: Use #2A2A2A base with #1A1A1A highlight
- **F3.3** Automatically adapt to current theme from useAppStore
- **F3.4** Shimmer colors should be subtle and not distract

### 4. Progressive Loading
- **F4.1** Content should appear as soon as it's ready
- **F4.2** Already loaded items remain visible while others load
- **F4.3** Smooth transition from shimmer to real content
- **F4.4** No layout shift when content replaces shimmer

### 5. Component Coverage
- **F5.1** Dashboard statistics cards
- **F5.2** Property list cards
- **F5.3** Financial summary cards (RentCard, CashflowCard)
- **F5.4** Stat cards with icons
- **F5.5** Recent activity list items
- **F5.6** Any future card-based layouts

## Technical Requirements

### 1. Library Integration
- **T1.1** Use `react-native-shimmer-placeholder` with `expo-linear-gradient`
- **T1.2** Install: `npm install react-native-shimmer-placeholder expo-linear-gradient`
- **T1.3** Create wrapper component for Expo compatibility

### 2. Component Architecture

#### Base Shimmer Component (`/components/shimmer/ShimmerPlaceholder.tsx`)
```typescript
interface ShimmerPlaceholderProps {
  width?: number | string;
  height?: number | string;
  shimmerColors?: string[];
  duration?: number;
  shimmerWidthPercent?: number;
  visible?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}
```

#### Specific Shimmer Components
- `/components/shimmer/PropertyCardShimmer.tsx`
- `/components/shimmer/StatCardShimmer.tsx`
- `/components/shimmer/DashboardCardShimmer.tsx`
- `/components/shimmer/ListItemShimmer.tsx`
- `/components/shimmer/index.ts` (exports)

### 3. RTL Integration
- **T3.1** Use `isRTL()` from `/lib/rtl.ts` to determine direction
- **T3.2** Set shimmer direction: `isRTL() ? 'right' : 'left'`
- **T3.3** Test thoroughly in Arabic mode

### 4. Theme Integration
- **T4.1** Use `useAppStore()` to get current theme
- **T4.2** Calculate shimmer colors based on theme.colors.surface
- **T4.3** Ensure sufficient contrast in both themes

### 5. Performance Optimization
- **T5.1** Use React.memo for shimmer components
- **T5.2** Implement AppState listener for background/foreground
- **T5.3** Clean up animations on unmount
- **T5.4** Limit number of concurrent animations

## Implementation Patterns

### Example: PropertyCard Shimmer
```typescript
const PropertyCardShimmer = () => {
  const theme = useTheme();
  const isRtl = isRTL();
  
  return (
    <View style={styles.card}>
      {/* Image placeholder */}
      <ShimmerPlaceholder
        width="100%"
        height={180}
        shimmerStyle={styles.image}
      />
      
      {/* Title line */}
      <ShimmerPlaceholder
        width="80%"
        height={20}
        style={styles.title}
      />
      
      {/* Location line */}
      <ShimmerPlaceholder
        width="60%"
        height={16}
        style={styles.location}
      />
      
      {/* Details row */}
      <View style={styles.detailsRow}>
        <ShimmerPlaceholder width={50} height={16} />
        <ShimmerPlaceholder width={50} height={16} />
        <ShimmerPlaceholder width={50} height={16} />
      </View>
    </View>
  );
};
```

### Example: List Loading
```typescript
const PropertyList = () => {
  const { data, loading } = useApi(propertiesApi.getAll);
  
  if (loading && !data) {
    return (
      <>
        {[...Array(5)].map((_, index) => (
          <PropertyCardShimmer key={index} />
        ))}
      </>
    );
  }
  
  return (
    <>
      {data?.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
      {loading && data && <PropertyCardShimmer />}
    </>
  );
};
```

## Acceptance Criteria

### 1. Visual Consistency
- [ ] Shimmers match exact layout of real content
- [ ] No layout shift when content loads
- [ ] Smooth animation at 60fps
- [ ] Proper theme colors in light/dark mode

### 2. RTL Support
- [ ] Animation direction reverses in Arabic
- [ ] Layout mirrors correctly
- [ ] Tested with Arabic content

### 3. Performance
- [ ] No frame drops during animation
- [ ] Animations pause in background
- [ ] Memory cleaned up on unmount
- [ ] Works smoothly on low-end devices

### 4. User Experience
- [ ] Loading feels faster than before
- [ ] Progressive content loading works
- [ ] Error states appear immediately
- [ ] Consistent across all screens

## Assumptions
1. Using Expo SDK (no native modules)
2. All list views show max 5 shimmer items
3. Error states bypass shimmer and show immediately
4. Animation duration is 1000ms by default
5. Shimmer width is 0.3 (30%) of component width

## Migration Plan
1. Create base shimmer components
2. Update one screen (Properties) as proof of concept
3. Get user feedback
4. Roll out to remaining screens
5. Remove old ActivityIndicator patterns
6. Document usage patterns for future development