# Initial Request

**Date:** 2025-01-12 20:50
**Original Request:** the settings and profile page is not showing the user info like email phone number etc dynamically but has static data hardcoded like example email or admin email hardcoded the pages should show the user specific data dynamically based on the user. can you please make it so that the data is fetch from the tables and displayed dynamically. Also I editing this information is saved on the database.

**Follow-up Issue:** great so in the last fix for the duanmic data you have populated the fields but they show as profile.noEmail, profile.firstName etc can you check the supabase mcp and api layer to see how the data is actually stored to be fetched properly

## Summary
The settings and profile pages currently display hardcoded user information (example emails, admin emails, etc.) instead of fetching and displaying the actual logged-in user's data dynamically. The system should:

1. Fetch user data dynamically from the database based on the current user
2. Display real user information (email, phone number, etc.) instead of static placeholders
3. Allow users to edit their profile information
4. Save edited information back to the database

## Key Requirements
- Replace hardcoded user data with dynamic database queries
- Fetch user-specific information based on logged-in user
- Implement edit functionality for user profile information
- Persist profile changes to the database
- Ensure data consistency across settings and profile pages