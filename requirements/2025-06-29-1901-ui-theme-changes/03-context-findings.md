# Context Findings

## Files That Need Modification

### Primary Theme Files
- **`/mnt/c/Users/Hopef/Desktop/real-estate/real-estate-mg/lib/theme.ts`** (220 lines)
  - Current primary color: `#1976D2` (blue) → needs change to `#4C2661` (purple)
  - Comprehensive color palette with Material Design 3 structure
  - Contains spacing, typography, shadows, and RTL utilities
  - No proper dark theme implementation (dark aliased to light)

### Navigation Components Requiring Updates

#### Hamburger Menu Usage (TO BE REMOVED)
- **`/mnt/c/Users/Hopef/Desktop/real-estate/real-estate-mg/components/ModernHeader.tsx`** (249 lines)
  - Uses `Menu` icon from lucide-react-native for hamburger menu
  - Line ~80: Menu button with drawer toggle functionality
  - Used in all main screens with `showMenu` prop

- **`/mnt/c/Users/Hopef/Desktop/real-estate/real-estate-mg/components/SideBar.tsx`** (215 lines)
  - Drawer content component with hamburger menu icon
  - Hardcoded background: `#f4f4f4`
  - Header accent color: `#0066CC` (needs purple update)

- **`/mnt/c/Users/Hopef/Desktop/real-estate/real-estate-mg/app/(drawer)/_layout.tsx`** (173 lines)
  - Custom modal drawer implementation
  - Fixed background: `#f4f4f4` (needs purple theme)
  - 280px width with slide animation

#### Home Icon Usage (TO BE REPLACED)
- **`/mnt/c/Users/Hopef/Desktop/real-estate/real-estate-mg/app/(drawer)/(tabs)/_layout.tsx`** (202 lines)
  - Line 5: `Chrome as Home` import - main home icon
  - Line ~90: Home tab configuration with Chrome icon
  - Multiple home icon instances throughout app

#### Additional Home Icon Locations
- MaterialIcons "home" used in:
  - `app/(drawer)/(tabs)/reports.tsx` (line 28, 50)
  - `app/owner/browse-properties.tsx` (property type icons)
  - `app/owner/maintenance.tsx` (property indicators)
  - `app/owner/properties.tsx` (empty state icons)
  - `app/owner-dashboard/index.tsx` (dashboard widgets)

## Current Color Issues

### Hardcoded Colors (Need Purple Updates)
- Drawer background: `#f4f4f4` (light gray)
- Sidebar header: `#0066CC` (blue accent)
- Tab bar colors: References undefined theme properties:
  - `theme.colors.tabBarActive` (undefined)
  - `theme.colors.tabBarInactive` (undefined)
  - `theme.colors.tabBarBackground` (undefined)

### Theme Structure Analysis
- Well-organized Material Design 3 color system
- Semantic colors: primary, secondary, tertiary, error, success, warning
- Surface variants and elevation levels
- RTL-aware spacing and typography

## Technical Constraints

### Purple Color Palette Requirements
- Main purple: `#4C2661` (hex) / `rgb(76, 38, 97)`
- Need to generate:
  - Primary container (lighter shade)
  - Secondary purple variants
  - On-color variants (text colors)
  - Surface tints and elevation colors

### Hamburger Menu Removal Impact
- ModernHeader component used in 24+ screens
- Need to remove `showMenu` prop and Menu button
- SideBar component becomes unused
- Drawer navigation functionality needs removal
- Navigation items in drawer need alternative access or removal

### Home Icon Replacement Strategy
- Primary location: Tab navigation (Chrome → Home icon)
- Secondary locations: Various MaterialIcons "home" usage
- Need consistent home icon throughout app

## Integration Points
- Theme changes affect all components using `theme.colors.*`
- Navigation changes require updates to multiple screen layouts
- Icon changes need import statement updates
- Color updates may affect existing branded elements

## Existing Infrastructure Benefits
- Solid theme system already in place
- Centralized color management
- RTL support maintained
- Material Design 3 compliance maintained