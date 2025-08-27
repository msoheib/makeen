# Triage of re-indexed items (1–59)

## Errors by severity

### Critical (blockers/security/data integrity)
- 21 – (Maintenance Request – Add Image) cannot attach maintenance photo
- 29 – (Property List) cannot open property details
- 30 – cannot add a new property owner
- 32 – cannot display tenant details (site hangs)
- 33 – cannot add a new tenant (only shows previously added)
- 35 – (Reports) inaccessible even for property-manager account
- 37 – change-password action does nothing

### High
- 25 – (Maintenance Requests) some attached images do not appear
- 28 – Reports page freezes when scrolling down
- 31 – cannot delete old data
- 34 – (Tenant List) keyboard hides after each character while searching
- 36 – Dashboard quick stats show zeros instead of actual data
- 49 – keyboard still disappears during search in Property List

### Medium
- 3 – UI direction should follow selected language (LTR/RTL alignment)
- 5 – after exiting menus (e.g., Settings), should return to Dashboard
- 7 – slow loading when entering Property List
- 22 – priority colors inconsistent (Urgent should be darker than High)
- 47 – back arrow (top-right) navigates to previous subpage instead of intended main page

### Low
- 8 – Profile address formatting needs adjustment
- 9 – dark mode doesn’t work
- 10 – “Contact Support” title not centered
- 39 – cannot add profile photo for account owner

## Stylistic / UI changes (copy, layout, ordering, visual polish)
- 1 – unify tenant info (remove “foreign tenants” segment) in quick stats
- 2 – standardize language across options in Reports section of Tenant List
- 4 – clarify incomplete labels (e.g., “Maintenance options”)
- 11 – rename “Contact Support” to one of: “Contact Support Team” / “Help & Support” / “Complaints & Suggestions”
- 14 – Terms of Service should match selected language
- 15 – modernize login screen (neat and contemporary, not classic)
- 16 – statistics page uses charts and counters
- 17 – balance spacing on the home page
- 19 – priority options ordered right-to-left (Low → Medium …)
- 20 – move “Take Photo / Choose from Gallery” to a better place in Add Maintenance
- 23 – remove 10-character minimum for maintenance description (validation policy change)
- 24 – reverse maintenance status order (start from right: Pending → Approved …) and change wording to “تمت الموافقة”
- 38 – account type label should display a distinguishing role (Property Manager / Manager / Administrator)

## New feature requests (new capability or workflow/schema changes)
- 6 – make property dashboard cards tappable to enter sections (e.g., Total/Available Properties)
- 12 – Reports: view without saving, with side option to Save and Send
- 13 – Add Property: provide selectable options instead of full manual entry, with “Other”
- 18 – Add Maintenance: choose address from existing properties/buildings with “Other”
- 26 – Maintenance: replace simple search with a filter (Property Type, Maintenance Date, Maintenance Status)
- 27 – group maintenance items by month name (newest to oldest)
- 40 – dedicated section for tenant and owner information
- 41 – property-management section (units, vacancies, monthly/annual income)
- 42 – accountants’ module (receipt vouchers, accounts, meters, maintenance pricing, expense/revenue reports, printing)
- 43 – reports (monthly/semi-annual/annual) auto-updated for owners
- 44 – reminders for upcoming/expiring contracts with alerts/notifications
- 45 – maintenance section: quotations, requests, expected completion with start/end dates
- 46 – role selection on app entry (Tenant / Owner / Property Manager)
- 48 – owner search field when adding a property
- 50 – add “Building” as a property type
- 51 – owner details: use a single “Full Name” field (no first/last split)
- 52 – show total number of owners
- 53 – view owner details after adding
- 54 – parent-child property structure (Building → Apartments nested under the building)
- 55 – allow editing and deleting of any added data across entities (global CRUD)
- 56 – view reports without downloading, with a separate Download button
- 57 – in Reports, selector to choose the property type for a specific report; keep overall portfolio report
- 58 – add a water-meters report
- 59 – when adding a sub-property (e.g., Apartment under Building), include required/optional fields: meter numbers (optional); contract number (required); payment frequency (Monthly/Quarterly/Semi-annual/Annual) (required); contract PDF (required); tenant contact number with (+) for extra (required/optional); base price (total contract) plus per-frequency rent amount (required); contract duration options up to 5 years (required)

## Notes
- 12 and 56 are related (report viewing vs downloading). You can merge them into a single “report viewing/downloading UX” story if desired.
- 31 is a defect (cannot delete old data). 55 requests broader CRUD across entities. Keep both: fix the defect, then scope the global edit/delete feature.
