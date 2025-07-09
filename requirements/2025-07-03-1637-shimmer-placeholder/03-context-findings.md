# Context Findings

## Current Loading State Implementation

### Loading Patterns Used
1. **ActivityIndicator** - Used in all loading states across the app
   - Always uses `theme.colors.primary` (purple #4C2661)
   - Size is typically "large"
   - Shows loading text: "جاري التحميل..." or `t('loading')`

2. **Common Pattern Example** (from `/app/(tabs)/index.tsx`):
```tsx
if (loading) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader title="..." />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          {t('loading')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

3. **Inline Loading** - Some components show "..." for values:
```tsx
<Text>{isLoading ? '...' : actualValue}</Text>
```

### Components That Need Shimmer

1. **Dashboard Components** (`/app/(tabs)/index.tsx`):
   - Horizontal stats cards
   - Financial cards (RentCard, CashflowCard)
   - Property overview cards
   - Recent activity cards

2. **Properties Screen** (`/app/(tabs)/properties.tsx`):
   - Property cards in list
   - Stats section at top
   - Search results

3. **Card Components**:
   - `PropertyCard.tsx` - Complex layout with image, status, details
   - `RentCard.tsx` - Already has loading state
   - `CashflowCard.tsx` - Already has loading state
   - `StatCard.tsx` - Simple loading with ActivityIndicator
   - `MaintenanceRequestCard.tsx`
   - `NotificationCard.tsx`

### Theme Support
- Light theme: `#FFFFFF` background, `#F5F5F5` surface
- Dark theme: `#121212` background, `#1E1E1E` surface
- Primary color: `#4C2661` (purple)
- Uses `useAppStore()` for theme state
- Theme colors accessed via `theme.colors.*`

### RTL Support Infrastructure
- Comprehensive RTL support in `/lib/rtl.ts`
- Helper functions:
  - `isRTL()` - Check if RTL is active
  - `getFlexDirection()` - Returns 'row-reverse' for RTL
  - `rtlStyles` object with RTL-aware styles
- Animation direction would use: `isRTL() ? 'right' : 'left'`

### Existing Animation Usage
- Only found in `SplashScreen.tsx`:
  - Uses `Animated` from React Native
  - Fade and scale animations
  - No shimmer effects currently

### Library Research
Based on web search, best options for Expo:
1. **react-native-shimmer-placeholder** - Most popular, works with expo-linear-gradient
2. **expo-shimmer-placeholder** - Fork specifically for Expo
3. Need to use with `expo-linear-gradient` for gradient effect

### Key Implementation Requirements

1. **Shimmer Component Structure**:
   - Base shimmer component with theme/RTL support
   - Specific shimmer components for each card type
   - Should maintain exact dimensions of content

2. **Theme Integration**:
   - Light mode: Use lighter grays (#F0F0F0 to #E0E0E0)
   - Dark mode: Use darker grays (#2A2A2A to #1A1A1A)
   - Shimmer highlight color should be slightly brighter

3. **RTL Animation Direction**:
   - LTR: Shimmer moves left to right
   - RTL: Shimmer moves right to left
   - Use `isRTL()` to determine direction

4. **Component-Specific Shimmers**:
   - PropertyCard: Image placeholder, text lines, price
   - StatCard: Icon circle, value, label
   - Dashboard cards: Multiple rows of data
   - List items: Consistent height placeholders

### Files That Need Modification

1. **New Files to Create**:
   - `/components/shimmer/ShimmerPlaceholder.tsx` - Base component
   - `/components/shimmer/PropertyCardShimmer.tsx`
   - `/components/shimmer/StatCardShimmer.tsx`
   - `/components/shimmer/DashboardCardShimmer.tsx`
   - `/components/shimmer/ListItemShimmer.tsx`
   - `/components/shimmer/index.ts` - Exports

2. **Files to Modify**:
   - `/app/(tabs)/index.tsx` - Dashboard loading states
   - `/app/(tabs)/properties.tsx` - Property list loading
   - `/components/StatCard.tsx` - Replace ActivityIndicator
   - `/components/RentCard.tsx` - Enhanced loading state
   - `/components/CashflowCard.tsx` - Enhanced loading state
   - Other screen files with loading states

### Technical Constraints
- Must work with Expo SDK
- Cannot use native modules not supported by Expo
- Must maintain performance on both iOS and Android
- Should not increase bundle size significantly