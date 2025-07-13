# Requirements Specification

**Date:** 2025-01-12 20:50
**Status:** Final
**Implementation Ready:** Yes

## Executive Summary

Replace hardcoded user profile data in settings and profile pages with dynamic database-driven data fetching and persistence. The system has excellent infrastructure already in place; the main work is connecting UI components to the existing database and API layer.

## Functional Requirements

### FR1: Dynamic Profile Data Display
- **Settings Page:** Replace hardcoded "admin@realestate.com" with current user's actual email
- **Profile Page:** Display real user data from database instead of store fallbacks
- **Data Source:** Fetch from `profiles` table using authenticated user's ID
- **Fields:** name, email, phone, company, address, city, country

### FR2: Profile Data Fetching
- Create `useUserProfile()` hook to fetch current user's profile
- Handle loading states during data fetch
- Handle cases where user profile doesn't exist in database
- Auto-sync with authentication state changes

### FR3: Profile Editing & Persistence
- Maintain existing edit UI in profile page
- Save changes to database using existing `profilesApi.update()`
- Update local store after successful database save
- Show success/error feedback to user

### FR4: Profile Creation for New Users
- Auto-create database profile for new users if missing
- Use auth metadata (name, email) as initial profile data
- Set default values for optional fields

### FR5: Data Consistency
- Ensure settings and profile pages show same user data
- Sync store with database after profile updates
- Handle authentication state changes properly

## Technical Implementation

### TI1: User Profile Hook
```typescript
// hooks/useUserProfile.ts
const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch profile by user ID
  // Handle auto-creation for missing profiles
  // Return { profile, loading, error, updateProfile, refetch }
}
```

### TI2: Profile Screen Integration
- Replace store-based profile data with `useUserProfile()` hook
- Wire save functionality to database via `profilesApi.update()`
- Update local store after successful database save
- Add proper loading and error states

### TI3: Settings Screen Integration
- Use `useUserProfile()` hook to get current user's email
- Replace hardcoded "admin@realestate.com" on line 236
- Ensure consistent data display with profile page

### TI4: Database Operations
- **Fetch:** `profilesApi.getById(user.id)`
- **Update:** `profilesApi.update(user.id, profileData)`
- **Create:** `profilesApi.create(newProfile)` for missing profiles
- Leverage existing API security and validation

## Implementation Plan

### Phase 1: Core Hook Development (30 mins)
1. Create `hooks/useUserProfile.ts`
2. Implement profile fetching logic
3. Add auto-creation for missing profiles
4. Handle loading and error states

### Phase 2: Profile Page Integration (20 mins)
1. Replace store usage with `useUserProfile()` hook
2. Wire save functionality to database
3. Update store after successful save
4. Test edit and save workflow

### Phase 3: Settings Page Integration (10 mins)
1. Add `useUserProfile()` hook to settings page
2. Replace hardcoded email with dynamic data
3. Ensure consistent display across pages

### Phase 4: Testing & Polish (10 mins)
1. Test with existing users
2. Test new user profile creation
3. Verify authentication state changes
4. Check error handling and edge cases

## Acceptance Criteria

### AC1: Dynamic Data Display
- [ ] Settings page shows current user's actual email
- [ ] Profile page displays real database profile data
- [ ] No hardcoded user data visible in either page

### AC2: Profile Management
- [ ] Users can edit profile information in profile page
- [ ] Changes save to database successfully
- [ ] Store updates after database save
- [ ] Success/error feedback shown to user

### AC3: New User Support
- [ ] New users get auto-created profiles from auth metadata
- [ ] Missing profiles handle gracefully without errors
- [ ] Default values populate appropriately

### AC4: Data Consistency
- [ ] Both pages show identical user data
- [ ] Profile changes reflect immediately in both pages
- [ ] Authentication state changes update profile data

### AC5: Error Handling
- [ ] Database errors handled gracefully
- [ ] Loading states shown during data operations
- [ ] User feedback for success/failure cases

## Risk Assessment

### Low Risk
- **Database Infrastructure:** Comprehensive `profiles` table exists
- **API Layer:** `profilesApi` functions ready and tested
- **Authentication:** Solid auth system with user ID access
- **UI Components:** Profile editing UI already implemented

### Medium Risk
- **Profile Auto-Creation:** Need to handle new users gracefully
- **Data Migration:** Existing users may not have database profiles

### Mitigation Strategies
- Implement robust auto-creation logic with fallbacks
- Test thoroughly with both existing and new user accounts
- Add comprehensive error handling and user feedback

## Dependencies

### External
- Supabase database and authentication
- Existing `profilesApi` functions in `lib/api.ts`
- User authentication state from `hooks/useAuth.ts`

### Internal
- Zustand store for local state management
- Profile page UI components already implemented
- Settings page structure ready for integration

## Success Metrics

- ✅ Zero hardcoded user data in UI
- ✅ Real user profile data displayed dynamically
- ✅ Profile edits persist to database
- ✅ New users get proper profile initialization
- ✅ Consistent data across settings and profile pages