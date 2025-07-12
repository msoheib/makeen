# Requirements Specification: Add Shimmer Effects to Maintenance Page

## Problem Statement
The maintenance page is the only page in the application that lacks shimmer loading effects, instead using a basic ActivityIndicator. This creates an inconsistent user experience compared to other pages that provide smooth shimmer loading states.

## Solution Overview
Add shimmer loading effects to the maintenance page by creating a new MaintenanceCardShimmer component and integrating existing HorizontalStatsShimmer. Replace the current full-screen ActivityIndicator with contextual shimmer effects for different page sections.

## Functional Requirements

### FR1: Stats Section Shimmer
- **Location:** `app/(tabs)/maintenance.tsx` lines 177-232
- **Requirement:** Replace loading state with HorizontalStatsShimmer
- **Trigger:** When `(loading && !requests) || userLoading` is true
- **Pattern:** Reuse existing `HorizontalStatsShimmer` component (matches layout exactly)

### FR2: Maintenance Request List Shimmer
- **Location:** `app/(tabs)/maintenance.tsx` FlatList section (lines 257-277)
- **Requirement:** Create and display MaintenanceListShimmer component
- **Count:** Show 5 placeholder cards during loading
- **Structure:** Match MaintenanceRequestCard visual layout

### FR3: Remove Full-Screen Loading
- **Current:** Lines 115-133 show full-screen ActivityIndicator
- **Requirement:** Replace with contextual shimmer effects per section
- **Preserve:** Error states and TenantEmptyState behavior unchanged

### FR4: Maintain Pull-to-Refresh
- **Requirement:** Keep existing RefreshControl functionality
- **Behavior:** No shimmer during pull-to-refresh (use existing indicator)
- **Loading State:** `refreshing={loading}` remains unchanged

### FR5: Consistent Visual Experience
- **Requirement:** Match shimmer patterns used in dashboard and other pages
- **Animation:** Use same shimmer animation timing and effects
- **Styling:** Follow established shimmer component styling patterns

## Technical Requirements

### TR1: Create MaintenanceCardShimmer Component
- **File:** `components/shimmer/MaintenanceCardShimmer.tsx`
- **Structure:**
  ```typescript
  - Card container (same styling as MaintenanceRequestCard)
  - ShimmerBox (image placeholder, 60x60, borderRadius: 8)
  - ShimmerLine (title, width: 140, height: 16)
  - ShimmerLine (description, width: 220, height: 12)
  - ShimmerBox (status chip, width: 80, height: 24, borderRadius: 12)
  - ShimmerLine (date, width: 100, height: 10)
  ```

### TR2: Create MaintenanceListShimmer Component
- **File:** Same as TR1 or separate component
- **Content:** Array of 5 MaintenanceCardShimmer components
- **Spacing:** Match existing FlatList item spacing
- **Container:** Appropriate margins and padding

### TR3: Update Shimmer Exports
- **File:** `components/shimmer/index.ts`
- **Addition:** Export MaintenanceCardShimmer and MaintenanceListShimmer
- **Pattern:** Follow existing export structure

### TR4: Update Maintenance Page Loading Logic
- **File:** `app/(tabs)/maintenance.tsx`
- **Import:** Add shimmer components from `@/components/shimmer`
- **Replace:** Full-screen loading with conditional shimmer rendering
- **Preserve:** All existing functionality except ActivityIndicator

## Implementation Hints

### Step 1: Create MaintenanceCardShimmer Component
```typescript
// components/shimmer/MaintenanceCardShimmer.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerBox, ShimmerLine } from './ShimmerPlaceholder';

export const MaintenanceCardShimmer: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardContent}>
        <ShimmerBox width={60} height={60} style={styles.imageShimmer} />
        <View style={styles.textContainer}>
          <ShimmerLine width={140} height={16} style={styles.titleShimmer} />
          <ShimmerLine width={220} height={12} style={styles.descriptionShimmer} />
          <View style={styles.bottomRow}>
            <ShimmerBox width={80} height={24} style={styles.chipShimmer} />
            <ShimmerLine width={100} height={10} style={styles.dateShimmer} />
          </View>
        </View>
      </View>
    </View>
  );
};

export const MaintenanceListShimmer: React.FC = () => {
  return (
    <View>
      {Array.from({ length: 5 }).map((_, index) => (
        <MaintenanceCardShimmer key={index} />
      ))}
    </View>
  );
};
```

### Step 2: Update Maintenance Page
```typescript
// Import shimmer components
import { HorizontalStatsShimmer, MaintenanceListShimmer } from '@/components/shimmer';

// Replace loading logic (remove lines 115-133)
// Add conditional rendering for stats section:
{(loading || userLoading) ? (
  <HorizontalStatsShimmer />
) : (
  <View style={[styles.horizontalStatsCard, { backgroundColor: theme.colors.surface }]}>
    {/* existing stats content */}
  </View>
)}

// Add conditional rendering for list section:
{(loading && !requests) || userLoading ? (
  <MaintenanceListShimmer />
) : (
  <FlatList
    data={filteredRequests}
    renderItem={({ item }) => (
      <MaintenanceRequestCard
        key={item.id}
        request={item}
        theme={theme}
        onPress={() => router.push(`/maintenance/${item.id}`)}
      />
    )}
    // ... existing FlatList props
  />
)}
```

### Step 3: Update Shimmer Exports
```typescript
// components/shimmer/index.ts
export { 
  MaintenanceCardShimmer, 
  MaintenanceListShimmer 
} from './MaintenanceCardShimmer';
```

## Acceptance Criteria

### AC1: Stats Section Shimmer
- ✅ When page loads, stats section shows HorizontalStatsShimmer
- ✅ Shimmer matches exact layout of actual stats (4 items in horizontal row)
- ✅ Shimmer disappears when data loads and shows actual stats
- ✅ Works for both `loading` and `userLoading` states

### AC2: Request List Shimmer
- ✅ When page loads, request list shows 5 MaintenanceCardShimmer items
- ✅ Each shimmer card matches MaintenanceRequestCard layout exactly
- ✅ Includes image placeholder, title, description, chip, and date shimmers
- ✅ Shimmer disappears when data loads and shows actual requests

### AC3: Loading State Replacement
- ✅ No more full-screen ActivityIndicator during initial load
- ✅ Contextual shimmer effects in each section instead
- ✅ Page feels responsive and shows content structure immediately
- ✅ Error states and empty states work unchanged

### AC4: Pull-to-Refresh Preserved
- ✅ Pull-to-refresh shows RefreshControl indicator, not shimmer
- ✅ Shimmer only appears during initial page load
- ✅ RefreshControl `refreshing={loading}` behavior unchanged

### AC5: Visual Consistency
- ✅ Shimmer animation matches other pages (same timing, style)
- ✅ Card styling matches actual MaintenanceRequestCard appearance
- ✅ Stats shimmer matches dashboard HorizontalStatsShimmer exactly
- ✅ Spacing and margins consistent with actual content

### AC6: Performance & UX
- ✅ Page loads feel faster and more responsive
- ✅ No visual jarring when content appears
- ✅ Shimmer provides clear indication of expected content structure
- ✅ Loading states work correctly across different user roles

## Assumptions
- MaintenanceRequestCard structure remains stable for shimmer matching
- Existing shimmer infrastructure handles animation and theming correctly
- Loading state logic `(loading && !requests) || userLoading` covers all necessary cases
- HorizontalStatsShimmer exactly matches maintenance stats layout (4 items)
- 5 placeholder cards provide appropriate loading feedback for request lists