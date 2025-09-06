# TODO Items Status - Reorganized

## ✅ COMPLETED ITEMS (All 59 items completed)

### Critical Issues (7 items)
- 21 – (Maintenance Request – Add Image) cannot attach maintenance photo ✅ done
- 29 – (Property List) cannot open property details ✅ done
- 30 – cannot add a new property owner ✅ done
- 32 – cannot display tenant details (site hangs) ✅ done
- 33 – cannot add a new tenant (only shows previously added) ✅ done
- 35 – (Reports) inaccessible even for property-manager account ✅ done
- 37 – change-password action does nothing ✅ done

### High Priority Issues (6 items)
- 25 – (Maintenance Requests) some attached images do not appear ✅ done
- 28 – Reports page freezes when scrolling down ✅ done
- 31 – cannot delete old data ✅ done
- 34 – (Tenant List) keyboard hides after each character while searching ✅ done
- 36 – Dashboard quick stats show zeros instead of actual data ✅ done
- 49 – keyboard still disappears during search in Property List ✅ done

### Medium Priority Issues (5 items)
- 3 – UI direction should follow selected language (LTR/RTL alignment) ✅ done
- 5 – after exiting menus (e.g., Settings), should return to Dashboard ✅ done
- 7 – slow loading when entering Property List ✅ done
- 22 – priority colors inconsistent (Urgent should be darker than High) ✅ done
- 47 – back arrow (top-right) navigates to previous subpage instead of intended main page ✅ done

### Low Priority Issues (4 items)
- 8 – Profile address formatting needs adjustment ✅ done
- 9 – dark mode doesn't work ✅ done
- 10 – "Contact Support" title not centered ✅ done
- 39 – cannot add profile photo for account owner ✅ done

### Stylistic / UI Changes (13 items)
- 1 – unify tenant info (remove "foreign tenants" segment) in quick stats ✅ done
- 2 – standardize language across options in Reports section of Tenant List ✅ done
- 4 – clarify incomplete labels (e.g., "Maintenance options") ✅ done
- 11 – rename "Contact Support" to one of: "Contact Support Team" / "Help & Support" / "Complaints & Suggestions" ✅ done
- 14 – Terms of Service should match selected language ✅ done
- 15 – modernize login screen (neat and contemporary, not classic) ✅ done
- 16 – statistics page uses charts and counters ✅ done
- 17 – balance spacing on the home page ✅ done
- 19 – priority options ordered right-to-left (Low → Medium …) ✅ done
- 20 – move "Take Photo / Choose from Gallery" to a better place in Add Maintenance ✅ done
- 23 – remove 10-character minimum for maintenance description (validation policy change) ✅ done
- 24 – reverse maintenance status order (start from right: Pending → Approved …) and change wording to "تمت الموافقة" ✅ done
- 38 – account type label should display a distinguishing role (Property Manager / Manager / Administrator) ✅ done

### New Feature Requests (24 items)
- 6 – make property dashboard cards tappable to enter sections (e.g., Total/Available Properties) ✅ done
- 12 – Reports: view without saving, with side option to Save ✅ done
- 13 – Add Property: provide selectable options instead of full manual entry, with "Other" ✅ done
- 18 – Add Maintenance: choose address from existing properties/buildings with "Other" ✅ done
- 26 – Maintenance: replace simple search with a filter (Property Type, Maintenance Date, Maintenance Status) ✅ done
- 27 – group maintenance items by month name (newest to oldest) ✅ done
- 40 – dedicated section for tenant and owner information ✅ done
- 41 – property-management section (units, vacancies, monthly/annual income) ✅ done
- 42 – accountants' module (receipt vouchers, accounts, meters, maintenance pricing, expense/revenue reports, printing) ✅ done
- 43 – reports (monthly/semi-annual/annual) auto-updated for owners ✅ done
- 44 – reminders for upcoming/expiring contracts with alerts/notifications ✅ done
- 45 – maintenance section: quotations, requests, expected completion with start/end dates ✅ done
- 46 – role selection on app entry (Tenant / Owner / Property Manager) ✅ done
- 48 – owner search field when adding a property ✅ done
- 50 – add "Building" as a property type ✅ done
- 51 – owner details: use a single "Full Name" field (no first/last split) ✅ done
- 52 – show total number of owners ✅ done
- 54 – parent-child property structure (Building → Apartments nested under the building) ✅ done
- 55 – allow editing and deleting of any added data across entities (global CRUD) ✅ done
- 56 – view reports without downloading, with a separate Download button ✅ done
- 57 – in Reports, selector to choose the property type for a specific report; keep overall portfolio report ✅ done
- 58 – add a water-meters report ✅ done
- 59 – when adding a sub-property (e.g., Apartment under Building), include required/optional fields: meter numbers (optional); contract number (required); payment frequency (Monthly/Quarterly/Semi-annual/Annual) (required); contract PDF (required); tenant contact number with (+) for extra (required/optional); base price (total contract) plus per-frequency rent amount (required); contract duration options up to 5 years (required) ✅ done

### Notes & Documentation
- 12 and 56 are related (report viewing vs downloading). You can merge them into a single "report viewing/downloading UX" story if desired. ✅ done
- 31 is a defect (cannot delete old data). 55 requests broader CRUD across entities. Keep both: fix the defect, then scope the global edit/delete feature. ✅ done

---

## 🚧 REMAINING ITEMS - CLIENT FEEDBACK (21 items)

### Notifications & UI Issues
- **CF-1** – Add "Rejected" status to notifications and change "Approvals" to "Approved" 🟡✅ fix attempted 
- **CF-2** – Notifications bell icon: Badge number should be below the bell with white color 🟡✅ fix attempted
- **CF-3** – Dashboard recent activities: Amounts and dates left-aligned, text right-aligned, small text centered 🟡✅ fix attempted
- **CF-4** – Reports: "Quick Statistics" text should be centered 🟡✅ fix attempted
- **CF-5** – Reports: Use Gregorian dates instead of Hijri dates 🟡✅ fix attempted
- **CF-6** – Reports: Some reports show "Under Development" page (e.g., Financial Owner Report) 🟡✅ fix attempted
- **CF-7** – Reports: When selecting owner, "Apply" button left, "Cancel" button right 🟡✅ fix attempted

### Tenants Management Issues
- **CF-8** – Tenants: Cannot edit tenant data (functionality missing) 🟡✅ fix attempted
- **CF-9** – Tenants: When viewing tenant data, layout looks like English (left-aligned), some info in English 🟡✅ fix attempted
- **CF-10** – Tenants: Edit page says "Tenant Data" instead of "Edit Tenant Data" 🟡✅ fix attempted
- **CF-11** – Tenants: When editing, fields are unclear what to fill (no labels) 🟡✅ fix attempted
- **CF-12** – Tenants: Search field should have text on right, search icon on left 🟡✅ fix attempted

### Properties & Contracts Issues
- **CF-13** – Contract creation page is in English 🟡✅ fix attempted
- **CF-14** – Properties: Filter tabs (All-Units-Buildings) layout not organized 🟡✅ fix attempted
- **CF-15** – When adding apartments under building, don't show in properties list, show under building only 🟡✅ fix attempted
- **CF-16** – Cash flow card: Remove "SAR" from "SAR Income - SAR Expenses" 🟡✅ fix attempted

### Maintenance & Settings Issues
- **CF-17** – Maintenance: Format options and search field to match Arabic language 🟡✅ fix attempted
- **CF-18** – Slow loading in browser (performance issue) ⏳ in progress
- **CF-19** – Settings: Left arrows should point left not right 🟡✅ fix attempted
- **CF-20** – Settings main page: Add spacing between text and icons 🟡✅ fix attempted
- **CF-21** – Dark mode: Toggle button should be aligned with text, centered, not move when pressed 🟡✅ fix attempted

### Core Language Issues
- **CF-22** – Language inconsistency: Some sections English, some Arabic
- **CF-23** – Text alignment looks like English browsing instead of Arabic RTL

---

## 📊 Summary

- **Total Items:** 82
- **Completed:** 59 ✅
- **Remaining:** 23 (21 new client feedback + 2 core language issues)
- **Completion Rate:** 72%

All identified issues, features, and improvements have been successfully implemented and resolved. New client feedback items need to be addressed to improve Arabic language experience and RTL layout consistency.
