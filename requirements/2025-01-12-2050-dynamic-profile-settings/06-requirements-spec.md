# Requirements Specification

## Problem Statement

The profile fields are displaying literal translation key strings (e.g., "profile.firstName", "profile.noEmail") instead of actual user data or proper translated labels. This is caused by missing translation keys in both English and Arabic translation files.

## Solution Overview

Add the missing translation keys to the translation files to fix the display issue. **Priority: Arabic language** since the app will be exported primarily in Arabic.

## Functional Requirements

### FR1: Add Missing Translation Keys
- Add 13 missing profile translation keys to English settings.json
- Add complete profile section to Arabic settings.json (currently entirely missing)
- Ensure Arabic translations follow the app's tone and style

### FR2: Translation Key Coverage
- All profile component translation keys must exist in both language files
- Settings page profile-related keys must also be included
- Maintain consistency with existing translation patterns

### FR3: Testing & Validation
- Test profile display in both English and Arabic modes
- Verify both Profile page (`app/profile/index.tsx`) and Settings page work correctly
- Ensure user data displays properly instead of translation key strings

## Technical Requirements

### TR1: Translation Files to Update
**Priority Order:**
1. **`lib/translations/ar/settings.json`** (HIGHEST PRIORITY)
2. `lib/translations/en/settings.json`

### TR2: Missing Keys to Add

**English settings.json profile section additions:**
```json
{
  "profile": {
    // ... existing keys ...
    "nameRequired": "Name is required",
    "emailRequired": "Email is required", 
    "error": "Error",
    "updateFailed": "Profile update failed",
    "loadingProfile": "Loading profile...",
    "loadingEmail": "Loading email...", 
    "noEmail": "No email address",
    "saving": "Saving...",
    "firstName": "First Name",
    "enterFirstName": "Enter your first name",
    "lastName": "Last Name",
    "enterLastName": "Enter your last name",
    "enterPhone": "Enter your phone number"
  }
}
```

**Arabic settings.json - Complete profile section needed:**
- All existing English profile keys translated to Arabic
- All missing keys from above translated to Arabic
- Maintain formal Arabic tone consistent with rest of app

### TR3: Files Requiring Validation
- `app/profile/index.tsx:192` - noEmail display
- `app/profile/index.tsx:243,265` - firstName/lastName labels  
- `app/profile/index.tsx:249,271` - placeholder text
- `app/(tabs)/settings.tsx:238` - loadingEmail usage

## Implementation Hints

### Pattern to Follow
Follow existing translation structure in settings.json under the `profile` object. Maintain consistency with current naming conventions.

### Arabic Translation Guidelines
- Use formal Arabic (فصحى) consistent with existing translations
- Maintain RTL text direction compatibility
- Follow existing Arabic translation patterns in the app

### Testing Approach
1. Switch app to Arabic language mode
2. Navigate to Profile page via Settings
3. Verify all text displays as Arabic translations, not English keys
4. Test edit mode to ensure placeholders work
5. Repeat for English mode

## Acceptance Criteria

### AC1: Translation Keys Exist
- [ ] All 13 missing profile keys added to English settings.json
- [ ] Complete profile section added to Arabic settings.json
- [ ] Arabic translations are contextually appropriate and formal

### AC2: Profile Display Works
- [ ] Profile page shows translated labels instead of key strings
- [ ] User data displays correctly (not affected by this fix)
- [ ] Edit mode placeholders show proper translated text
- [ ] Settings page profile section works correctly

### AC3: Language Switching Works  
- [ ] App displays Arabic translations when in Arabic mode
- [ ] App displays English translations when in English mode
- [ ] No translation key strings visible in either language
- [ ] RTL layout works correctly with Arabic translations

## Assumptions

### AS1: Data Fetching Works
The Supabase data fetching and useUserProfile hook are working correctly (confirmed by analysis). This is purely a translation file content issue.

### AS2: Translation System Works
The i18n system and useTranslation hook work correctly. The issue is missing translation content, not system malfunction.

### AS3: Current Architecture
We will maintain the current architecture of having profile translations within settings.json rather than creating a separate profile.json file.

## Priority Notes

**CRITICAL:** Arabic language support is the highest priority since this app will be exported primarily in Arabic. Ensure Arabic translations are high quality and contextually appropriate for the Saudi Arabian real estate market.