# PBI-8: Context-Aware Navigation Header Improvements

[View in Backlog](mdc:../backlog.md#user-content-8)

## Overview

This PBI focuses on improving the user navigation experience by implementing context-aware header buttons that adapt based on the current page type. The goal is to replace the hamburger menu with a back button on pages that don't have bottom navigation, providing a more intuitive navigation pattern.

## Problem Statement

Currently, all screens in the app display a hamburger menu button in the header, regardless of context. This creates a suboptimal user experience because:

1. **Non-tab pages** (like document viewer, profile settings, individual forms) don't need access to the full sidebar menu
2. Users expect a **back button** on detail/sub-pages to return to the main sections
3. The current hamburger menu on all pages can be confusing when users are deep in the navigation hierarchy
4. **Inconsistent navigation patterns** compared to standard mobile app conventions

## User Stories

### Primary User Story
**As a user**, I want improved navigation with context-aware header buttons so that I can easily navigate between screens with appropriate back/menu buttons based on the current page context.

### Detailed User Stories
1. **As a user on main tab screens** (Dashboard, Properties, Tenants, etc.), I want to see the hamburger menu button so I can access the full sidebar navigation.

2. **As a user on detail/sub-pages** (document viewer, profile settings, individual tenant details), I want to see a back button so I can easily return to the previous screen.

3. **As a user navigating deep into the app**, I want consistent back navigation that takes me to either the previous page or the main home screen.

4. **As a user**, I want the navigation to feel natural and follow standard mobile app conventions.

## Technical Approach

### Route Detection Logic
Implement route detection to categorize pages:

**Pages WITH bottom navbar (show hamburger):**
- Dashboard: `/(drawer)/(tabs)/`
- Properties: `/(drawer)/(tabs)/properties`
- Tenants: `/(drawer)/(tabs)/tenants`
- Reports: `/(drawer)/(tabs)/reports`
- Settings: `/(drawer)/(tabs)/settings`
- Documents: `/(drawer)/(tabs)/documents`

**Pages WITHOUT bottom navbar (show back button):**
- Document viewer: `/documents/[id]`
- Profile pages: `/profile/`, `/theme/`, `/language/`, `/notifications/`, etc.
- Individual detail pages: `/tenants/[id]/`, `/properties/[id]/`
- Finance sub-pages: `/finance/vouchers/`, `/finance/invoices/`
- Maintenance sub-pages: `/maintenance/`

### Implementation Strategy
1. **ModernHeader Component Enhancement**: Add conditional button rendering logic
2. **Route Context Provider**: Create a hook to detect current route type
3. **Navigation Logic**: Implement smart back navigation (router.back() or fallback to home)
4. **Testing**: Ensure navigation works correctly across all screen types

### Technical Components
- **Route Detection Hook**: `useRouteContext()` to determine page type
- **Enhanced ModernHeader**: Conditional button rendering
- **Navigation Utilities**: Back navigation logic with fallbacks
- **TypeScript Types**: Type-safe route categorization

## UX/UI Considerations

### Visual Design
- **Back Button**: Use standard back arrow icon (consistent with platform conventions)
- **Hamburger Button**: Keep existing hamburger icon for main pages
- **Consistent Styling**: Maintain current header styling and positioning
- **Animation**: Smooth transitions between button types (if navigating between page types)

### User Experience Flow
1. **Main Pages**: User sees hamburger → can access full sidebar navigation
2. **Detail Pages**: User sees back button → returns to previous context
3. **Deep Navigation**: Back button always provides escape route
4. **Fallback Navigation**: If navigation history is unclear, return to Dashboard

### Accessibility
- Proper accessibility labels for both button types
- Screen reader support for navigation context
- Touch target size compliance

## Acceptance Criteria

### Core Functionality
- [ ] **Route Detection**: App correctly identifies pages with/without bottom navbar
- [ ] **Conditional Rendering**: Header shows hamburger on tab pages, back button on other pages
- [ ] **Back Navigation**: Back button successfully navigates to previous page or home
- [ ] **Hamburger Functionality**: Hamburger menu continues to work on appropriate pages

### User Experience
- [ ] **Smooth Navigation**: Navigation feels natural and responsive
- [ ] **Visual Consistency**: Button styling matches overall app design
- [ ] **No Navigation Dead Ends**: Users can always navigate back to main content
- [ ] **Platform Conventions**: Navigation follows iOS/Android standard patterns

### Technical Requirements
- [ ] **Type Safety**: All route detection logic is type-safe
- [ ] **Performance**: Route detection doesn't impact app performance
- [ ] **Error Handling**: Graceful fallbacks for navigation edge cases
- [ ] **Testing**: Comprehensive testing across all page types

## Dependencies

### Internal Dependencies
- **ModernHeader Component**: Core component requiring modification
- **Navigation System**: Expo Router and React Navigation integration
- **Route Structure**: Understanding of current app routing hierarchy

### External Dependencies
- **Expo Router**: For route detection and navigation
- **React Navigation**: For drawer navigation context
- **React Native**: For platform-specific navigation patterns

## Open Questions

1. **Navigation History**: Should we implement custom navigation history tracking or rely on router.back()?
2. **Animation**: Do we need transition animations when switching between button types?
3. **Customization**: Should some pages have custom navigation behavior?
4. **Deep Linking**: How should this work with deep links that bypass normal navigation flow?

## Related Tasks

[View Task List](mdc:tasks.md) 