# Requirements Specification: UI Theme and Navigation Changes

## Problem Statement
The app currently uses a blue color scheme (#1976D2) and includes a drawer navigation with hamburger menu that needs to be removed. The home icon in the bottom navigation uses a Chrome icon instead of a proper home symbol. Users want a comprehensive purple theme update and simplified navigation structure.

## Solution Overview
1. **Purple Theme Implementation**: Update the entire app to use purple (#4C2661) as the primary color with Material Design 3 compliant color harmonies
2. **Home Icon Replacement**: Replace all Chrome/home icons with proper Home icons from lucide-react-native
3. **Navigation Simplification**: Remove the drawer navigation system completely, including hamburger menus

## Functional Requirements

### FR1: Purple Color Theme Implementation
- Update primary color from `#1976D2` (blue) to `#4C2661` (purple)
- Generate Material Design 3 compliant color palette with proper shades and variants
- Apply purple theme to all UI elements: buttons, cards, headers, navigation
- Fix broken tab bar color references (tabBarActive, tabBarInactive, tabBarBackground)
- Maintain existing semantic colors (success, warning, error) but update accent colors

### FR2: Home Icon Replacement
- Replace `Chrome as Home` import with `Home` icon from lucide-react-native
- Update all instances of home icons throughout the app to use consistent Home icon
- Replace MaterialIcons "home" usage with lucide-react-native Home icon where appropriate
- Maintain icon sizing and color properties

### FR3: Drawer Navigation Removal
- Remove entire drawer navigation system from app structure
- Remove hamburger menu buttons from all screens
- Remove SideBar component usage
- Update app routing to bypass drawer layout
- Remove drawer-related navigation items permanently (no relocation)

### FR4: Navigation Structure Simplification
- Move users directly to tab navigation without drawer wrapper
- Simplify navigation hierarchy by removing drawer layer
- Maintain existing tab navigation functionality
- Ensure all existing screens remain accessible through direct routes

## Technical Requirements

### TR1: Theme File Updates
**Primary file:** `lib/theme.ts`

Changes needed:
1. Update `lightColors.primary` from `#1976D2` to `#4C2661`
2. Generate purple-based color palette:
   - primaryContainer: lighter purple shade
   - onPrimary: white text on purple
   - secondary: complementary purple tone
   - tertiaryContainer: purple-tinted containers
3. Add missing tab bar colors:
   - tabBarActive: purple variant
   - tabBarInactive: muted purple
   - tabBarBackground: light purple surface

### TR2: Navigation Layout Updates
**Files to modify:**
- `app/(drawer)/_layout.tsx` - Remove or bypass drawer
- `app/(drawer)/(tabs)/_layout.tsx` - Update routing structure
- `components/ModernHeader.tsx` - Remove hamburger menu
- `components/SideBar.tsx` - Mark as unused/remove

**Route structure changes:**
- Current: `/(drawer)/(tabs)/screen` → New: `/(tabs)/screen`
- Remove drawer wrapper from all routes
- Update navigation imports throughout app

### TR3: Icon Replacement Updates
**Primary file:** `app/(drawer)/(tabs)/_layout.tsx`

Changes needed:
1. Replace `Chrome as Home` with `Home` import
2. Update tab configuration to use Home icon
3. Find and replace other home icon instances:
   - `app/(drawer)/(tabs)/reports.tsx`
   - `app/owner-dashboard/index.tsx`
   - Various property-related screens

### TR4: Component Updates
**ModernHeader component:**
- Remove `showMenu` prop and related functionality
- Remove Menu icon import and usage
- Simplify header layout without hamburger menu
- Maintain other header features (notifications, back button)

## Implementation Strategy

### Phase 1: Theme Updates
```typescript
// Generate purple palette from #4C2661
const purpleBase = '#4C2661';
const lightColors = {
  primary: '#4C2661',
  primaryContainer: '#E8D5F0', // Light purple
  onPrimary: '#FFFFFF',
  secondary: '#6B4C93', // Lighter purple variant
  // ... additional purple harmonies
  tabBarActive: '#4C2661',
  tabBarInactive: '#A892B8',
  tabBarBackground: '#F8F5FA',
};
```

### Phase 2: Navigation Restructure
```typescript
// Remove drawer wrapper
// Before: app/(drawer)/(tabs)/_layout.tsx
// After: app/(tabs)/_layout.tsx

// Update routing
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Remove drawer references */}
    </Stack>
  );
}
```

### Phase 3: Icon Replacement
```typescript
// Replace Chrome icon
import { Home, FileText, Users, Building2, Settings as SettingsIcon } from 'lucide-react-native';

// Update tab configuration
{
  name: "index",
  options: {
    title: t('dashboard'),
    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />
  }
}
```

## Acceptance Criteria

1. **Color Theme**
   - [ ] All UI elements use purple (#4C2661) based color scheme
   - [ ] Tab bar colors display correctly without undefined references
   - [ ] Material Design 3 color harmony maintained
   - [ ] Purple theme applied consistently across all screens

2. **Home Icon**
   - [ ] Bottom tab navigation shows proper Home icon
   - [ ] All home icon instances use consistent lucide-react-native Home icon
   - [ ] Icon sizing and colors match design system

3. **Navigation Structure**
   - [ ] Drawer navigation completely removed
   - [ ] No hamburger menu buttons visible anywhere
   - [ ] Direct tab navigation works without drawer wrapper
   - [ ] All screens remain accessible through simplified routing

4. **App Functionality**
   - [ ] All existing features work with new navigation structure
   - [ ] No broken routes or navigation errors
   - [ ] RTL support maintained
   - [ ] Performance not negatively impacted

## Risk Considerations
- **Route Breaking**: Ensure all deep links and navigation paths updated
- **Component Dependencies**: Verify no components depend on drawer context
- **User Experience**: Navigation should feel intuitive without drawer access
- **Accessibility**: Maintain screen reader compatibility with new structure

## Assumptions
- Current tab navigation provides sufficient access to all needed features
- Users are comfortable with simplified navigation without drawer
- Purple theme aligns with brand identity requirements
- No additional dark mode theme needed for purple color scheme