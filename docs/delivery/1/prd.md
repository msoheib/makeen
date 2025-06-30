# PBI-1: Tenants Screen Integration

[View in Backlog](mdc:../backlog.md#user-content-1)

## Overview

Integrate the existing tenants screen with the profiles API to display real tenant data, provide search/filter capabilities, and enable full CRUD operations for tenant management.

## Problem Statement

Currently, the tenants screen exists in the navigation but is not connected to the database. Property managers need a functional interface to view, search, add, and manage tenant information efficiently.

## User Stories

- As a property manager, I want to see a list of all tenants so I can quickly access tenant information
- As a property manager, I want to search and filter tenants so I can find specific tenants quickly
- As a property manager, I want to view detailed tenant information so I can access complete tenant profiles
- As a property manager, I want to add new tenants so I can register new residents
- As a property manager, I want to edit tenant information so I can keep records up-to-date

## Technical Approach

- Connect to existing `profilesApi.getTenants()` function in `lib/api.ts`
- Implement tenant listing with proper loading states and error handling
- Add search functionality using existing API filtering capabilities
- Create tenant detail view/edit screens
- Implement add new tenant form with validation
- Use existing custom hooks from `hooks/useApi.ts` for state management

## UX/UI Considerations

- Follow existing design patterns from Dashboard and Properties screens
- Implement consistent loading states with shimmer effects
- Provide pull-to-refresh functionality
- Include proper error states with retry options
- Use Material Design 3 components for consistency
- Implement responsive design for different screen sizes

## Acceptance Criteria

1. Tenants screen displays list of all tenants from database
2. Search functionality filters tenants by name, email, or phone
3. Tenant details screen shows complete profile information
4. Add new tenant form validates required fields
5. Edit tenant functionality updates database records
6. Loading states display during API calls
7. Error handling provides user-friendly messages
8. Pull-to-refresh updates tenant list
9. Navigation integrates with existing drawer/tab structure

## Dependencies

- Existing `lib/api.ts` profiles API functions
- Existing `hooks/useApi.ts` custom hooks
- Supabase database with profiles table
- React Navigation structure

## Open Questions

- Should we implement tenant photo upload functionality?
- Do we need tenant status filtering (active/inactive)?
- Should tenant contact history be included in this PBI?

## Related Tasks

[View Tasks](mdc:tasks.md) 