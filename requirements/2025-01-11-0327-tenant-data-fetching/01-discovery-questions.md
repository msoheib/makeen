# Discovery Questions: Tenant Data Fetching Issues

## Q1: Should new tenant users see an empty/welcome state instead of errors when they have no assigned properties?
**Default if unknown:** Yes (better UX than showing technical errors like UUID syntax errors)

## Q2: Should the dashboard payment amount be dynamic based on the tenant's actual contracts/invoices?
**Default if unknown:** Yes (hardcoded 5000 payment amount is misleading and incorrect)

## Q3: Should new tenants be able to browse available properties for rent before being assigned to one?
**Default if unknown:** Yes (allows tenants to see what's available and potentially request rentals)

## Q4: Do tenants need to be manually assigned to properties by admins, or can they self-select available properties?
**Default if unknown:** Manual assignment (typical in property management systems for verification/approval)

## Q5: Should the maintenance tab show a helpful message for tenants with no properties rather than a generic error?
**Default if unknown:** Yes (clearer user experience with contextual messaging)