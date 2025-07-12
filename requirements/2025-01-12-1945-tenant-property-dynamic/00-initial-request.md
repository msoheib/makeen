# Initial Request

**Date:** 2025-01-12 19:45
**Request:** can you fix that the homepage shows hard coded property as a tenant. It shows some property whioch is hardcoded. Can you please make it dynamic and if the tenant is not assigned a property yet it has to be saying no property yet please contaact manager for assginment

## Summary
The tenant homepage currently displays a hardcoded property instead of dynamically showing the tenant's actual assigned property. The system should:
1. Display the tenant's actual assigned property dynamically
2. Show a message "No property yet, please contact manager for assignment" when the tenant has no assigned property

## Key Requirements
- Remove hardcoded property data from tenant homepage
- Implement dynamic property fetching based on logged-in tenant
- Handle case when tenant has no assigned property
- Display appropriate message for unassigned tenants