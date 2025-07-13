# Discovery Questions

**Date:** 2025-01-12 20:50
**Phase:** Discovery

## Question 1: Database Schema & User Data Source
Which database table contains the user profile information (email, phone, name, etc.)? Should we:
- Use the existing `auth.users` table from Supabase authentication
- Create/use a separate `profiles` or `user_profiles` table
- Extend an existing table with profile fields

**Context:** We need to identify where user profile data should be stored and retrieved from to replace the hardcoded values.

## Question 2: User Identification & Authentication
How should we identify which user's data to fetch? Should we:
- Use the current authenticated user's ID from Supabase auth session
- Use a user ID stored in the app store
- Use email as the identifier

**Context:** We need to link the displayed profile data to the currently logged-in user.

## Question 3: Profile Fields & Edit Permissions
Which profile fields should be editable by users, and which should be read-only? For example:
- Email (might be tied to authentication)
- Name, phone, company (likely editable)
- Account type, properties managed (might be system-controlled)

**Context:** The current profile page allows editing all fields, but some might need restrictions.

## Question 4: Data Persistence & Sync Strategy
When users edit their profile, should changes:
- Save immediately to database on each field change
- Save only when user clicks a "Save" button
- Update both the store and database, or just database with store refresh

**Context:** Need to determine the UX pattern and data consistency approach.

## Question 5: Default Values & New User Experience
For new users or users with incomplete profiles, should we:
- Show empty fields with placeholders
- Pre-populate with default values
- Guide users through profile completion

**Context:** Currently shows fallback values like "user@example.com" which may confuse users.