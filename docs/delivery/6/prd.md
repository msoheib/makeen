# PBI-6: Settings System Implementation

## Overview

This PBI focuses on implementing a comprehensive settings system for the real estate management app. The settings system will include profile management, app preferences, theme and language controls, currency settings, and legal document access. This enhancement will provide users with full control over their app experience while ensuring compliance with legal requirements.

**Parent PBI**: [PBI 6: Settings System Implementation](mdc:../backlog.md#user-content-6)

## Problem Statement

Currently, the app has a basic settings screen with navigation placeholders, but lacks functional implementations for critical user preferences and legal compliance features. Users need:

- Functional profile management capabilities
- Notification preferences control
- Language selection between English and Arabic
- Theme switching for user preference and accessibility
- Access to legal documents (Terms of Service, Privacy Policy)
- Support contact functionality
- Proper currency handling for Saudi market

## User Stories

### Primary User Stories
1. **As a user**, I want to edit my profile information so that I can keep my personal details up to date
2. **As a user**, I want to manage notification preferences so that I can control how and when I receive app notifications
3. **As a user**, I want to switch between English and Arabic languages so that I can use the app in my preferred language
4. **As a user**, I want to toggle between light and dark themes so that I can customize the app appearance
5. **As a user**, I want to access Terms of Service and Privacy Policy so that I understand my rights and responsibilities
6. **As a user**, I want to contact support easily so that I can get help when needed

## Technical Approach

### Technology Stack
- React Native with Expo Router for navigation
- React Native Paper for UI components
- AsyncStorage for local settings persistence
- Expo Mail Composer for contact functionality
- i18n for internationalization (future enhancement)
- Theme system integration with existing lib/theme.ts

### Architecture Pattern
- Settings stored in global state (lib/store.ts)
- Local persistence with AsyncStorage
- Settings context provider for theme/language state
- Screen-level components for each settings category

### Key Technical Decisions
1. **Theme System**: Extend existing theme.ts to support dark mode variants
2. **Language System**: Prepare infrastructure for future i18n implementation
3. **Currency Lock**: SAR hardcoded with UI indication of regional setting
4. **Profile Integration**: Extend existing profile screen functionality
5. **Legal Documents**: Static content with formatted text components

## UX/UI Considerations

### Design Principles
- Consistent with existing Material Design 3 patterns
- Clear visual hierarchy for settings categories
- Immediate feedback for setting changes
- Accessibility compliance for theme switching
- Cultural considerations for Arabic language support (future)

### Navigation Flow
```
Settings Screen
├── Profile → Profile Management Screen
├── Notifications → Notification Preferences Screen
├── Language → Language Selection Screen
├── Theme → Theme Selection Screen
├── Currency → Currency Display (SAR locked)
├── Contact Support → Email Composer
├── Terms of Service → Legal Document Screen
└── Privacy Policy → Legal Document Screen
```

### Visual Design
- Group related settings into cards
- Use appropriate icons for each setting
- Show current values as descriptions
- Clear indication when features are locked (currency)
- Smooth transitions between screens

## Acceptance Criteria

### AC1: Profile Management
- User can view current profile information
- User can edit name, email, phone number
- Profile validation prevents invalid data
- Changes are saved to Supabase profiles table
- Success/error feedback provided

### AC2: Notification Settings
- User can toggle different notification types
- Settings are persisted locally
- UI shows current notification state
- Integration ready for future push notification implementation

### AC3: Language Selection
- English and Arabic options available
- Current language highlighted
- Selection immediately updates UI labels
- Language preference persisted

### AC4: Theme Management
- Light, Dark, and "Follow Device" options
- Immediate theme application when selected
- Theme preference persisted across app restarts
- Smooth transition animations

### AC5: Currency Display
- SAR displayed as locked default
- Clear indication this is region-specific
- No edit functionality (locked to Saudi market)

### AC6: Contact Support
- Email composer opens with pre-filled recipient
- Subject line includes app context
- User can modify email content
- Email address configurable in settings

### AC7: Legal Documents
- Terms of Service accessible and readable
- Privacy Policy accessible and readable
- Generic but comprehensive legal content
- Proper formatting and scroll capability

### AC8: Help Center Removal
- Help Center option removed from settings
- Navigation updated to exclude help routes
- Clean settings organization maintained

## Dependencies

### Internal Dependencies
- Existing theme system (lib/theme.ts)
- App store implementation (lib/store.ts)
- Profile API integration (lib/api.ts)
- Existing navigation structure

### External Dependencies
- expo-mail-composer for contact functionality
- @react-native-async-storage/async-storage for persistence
- react-native-paper theme system
- Expo system settings integration

## Open Questions

1. **Language Implementation Scope**: Should we implement full i18n or just UI preparation?
2. **Notification Types**: What specific notification categories should be configurable?
3. **Email Configuration**: How should the support email address be configured (hardcoded vs configurable)?
4. **Theme Persistence**: Should theme preference sync across devices for logged-in users?
5. **Profile Photo**: Should profile photo upload be included in this PBI?

## Related Tasks

[View Task List](mdc:tasks.md) 