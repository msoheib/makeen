# Context Findings

## Current Implementation Analysis

### Maintenance Page Structure (`app/(tabs)/maintenance.tsx`)
The maintenance page has the following sections that need shimmer effects:

1. **Stats Section (lines 177-232):** 
   - Horizontal stats row with 4 stat items
   - Each item has: icon circle, label text, value text
   - Similar to `HorizontalStatsShimmer` pattern used in main dashboard

2. **Maintenance Request List (lines 257-277):**
   - FlatList with MaintenanceRequestCard components
   - Cards contain: image, title, description, status chip, date
   - No existing maintenance card shimmer component

3. **Current Loading State (lines 115-133):**
   - Uses basic ActivityIndicator with loading text
   - Takes up full screen during initial load
   - Needs to be replaced with shimmer components

### Existing Shimmer Infrastructure
From `components/shimmer/index.ts` and analysis:

**Available Shimmer Components:**
- ✅ `HorizontalStatsShimmer` - Perfect for maintenance stats section
- ✅ `StatCardShimmer` - Alternative for individual stat cards
- ✅ `ShimmerPlaceholder`, `ShimmerLine`, `ShimmerBox`, `ShimmerCircle` - Base components
- ❌ No maintenance request card shimmer (needs to be created)

**Pattern Used in Other Pages:**
- Dashboard: Uses multiple shimmer types (`HorizontalStatsShimmer`, `RentCardShimmer`, etc.)
- Conditional rendering: `{isLoading ? <ShimmerComponent /> : <ActualContent />}`
- Import from `@/components/shimmer`

### Current Loading Logic
```typescript
// Lines 115-116: Current loading condition
if ((loading && !requests) || userLoading) {
  // Shows full-screen ActivityIndicator
}

// Lines 272: Pull-to-refresh
refreshing={loading}
```

### Maintenance Request Card Structure
From `components/MaintenanceRequestCard.tsx`:
- Card container with image thumbnail
- Title and description text
- Status chip with colored background
- Date display with Clock icon
- Property information
- Priority indicator

## Files That Need Modification

### Primary Files:
1. **`app/(tabs)/maintenance.tsx`** - Main maintenance page (replace loading states)
2. **`components/shimmer/MaintenanceCardShimmer.tsx`** - New shimmer component (needs creation)
3. **`components/shimmer/index.ts`** - Export new shimmer component

### Shimmer Components Needed:

#### 1. Maintenance Request Card Shimmer
Structure to match `MaintenanceRequestCard`:
```
- Card container
- ShimmerBox (image placeholder, 60x60)
- ShimmerLine (title, width: 120-160)  
- ShimmerLine (description, width: 200-250, height: 12)
- ShimmerBox (status chip, width: 80, height: 24)
- ShimmerLine (date, width: 100, height: 10)
```

#### 2. Maintenance List Shimmer
- Multiple MaintenanceCardShimmer components (3-5 items)
- Vertical spacing between cards
- Same styling as actual card list

## Implementation Strategy

### Step 1: Create MaintenanceCardShimmer Component
- New file: `components/shimmer/MaintenanceCardShimmer.tsx`
- Export from `components/shimmer/index.ts`
- Match exact visual layout of MaintenanceRequestCard

### Step 2: Replace Loading States
- Replace full-screen ActivityIndicator with shimmer components
- Add conditional rendering for stats section
- Add conditional rendering for request list
- Preserve pull-to-refresh functionality

### Step 3: Loading Conditions
- Show stats shimmer when `loading || userLoading`
- Show list shimmer when `loading && !requests`
- Keep existing error states unchanged

## Existing Patterns to Follow

### Import Pattern:
```typescript
import { HorizontalStatsShimmer, MaintenanceListShimmer } from '@/components/shimmer';
```

### Usage Pattern:
```typescript
{(loading || userLoading) ? (
  <HorizontalStatsShimmer />
) : (
  <ActualStatsContent />
)}
```

### Styling Pattern:
- Use same elevation, borderRadius, padding as real components
- Match background colors with theme.colors.surface
- Use consistent spacing and margins

## Technical Constraints
- Must work with existing `useApi` hook loading states
- Must preserve RefreshControl functionality  
- Must handle both `loading` and `userLoading` states
- Must maintain RTL layout support
- Must follow existing shimmer animation patterns