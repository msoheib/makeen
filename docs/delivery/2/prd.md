# PBI-2: Maintenance Management

[View in Backlog](mdc:../backlog.md#user-content-2)

## Overview

Implement comprehensive maintenance management screens that allow property managers to view, create, and manage maintenance requests and work orders with full integration to the existing maintenance API.

## Problem Statement

Property managers need dedicated screens to efficiently manage maintenance requests and work orders. Currently, the sidebar has maintenance options but no functional screens exist to handle the complete maintenance workflow.

## User Stories

- As a property manager, I want to view all maintenance requests so I can track property issues
- As a property manager, I want to create new maintenance requests so I can log property problems
- As a property manager, I want to manage work orders so I can assign and track maintenance tasks
- As a property manager, I want to update maintenance status so I can track progress
- As a property manager, I want to filter maintenance by priority so I can handle urgent issues first

## Technical Approach

- Utilize existing `maintenanceApi.getRequests()` and `maintenanceApi.getWorkOrders()` functions
- Create maintenance requests list screen with status filtering
- Implement add maintenance request form with property and tenant selection
- Build work orders management screen with assignment capabilities
- Add status update functionality for maintenance items
- Integrate with properties and profiles APIs for related data

## UX/UI Considerations

- Follow existing app design patterns and Material Design 3 components
- Implement priority-based color coding for maintenance items
- Provide intuitive status progression workflows
- Include photo upload capability for maintenance issues
- Use clear iconography for different maintenance types
- Implement responsive design for various screen sizes

## Acceptance Criteria

1. Maintenance requests list displays all requests with status and priority
2. Add maintenance request form includes property selection and description
3. Work orders screen shows assigned maintenance tasks
4. Status updates reflect in real-time across screens
5. Priority filtering allows sorting by urgency levels
6. Integration with properties shows related property information
7. Tenant information displays for maintenance requests
8. Loading states and error handling implemented throughout
9. Navigation integrates seamlessly with existing structure

## Dependencies

- Existing `lib/api.ts` maintenance API functions
- Existing `hooks/useApi.ts` custom hooks
- Supabase database with maintenance_requests and work_orders tables
- Properties and profiles API integration
- Image upload functionality (if implemented)

## Open Questions

- Should we implement maintenance cost tracking in this PBI?
- Do we need maintenance contractor management?
- Should maintenance history be included per property?

## Related Tasks

[View Tasks](mdc:tasks.md) 