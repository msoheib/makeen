# Discovery Questions

These questions will help us understand the requirements better for making the tenant property display dynamic.

## Q1: Should the tenant's property information come from their active rental contract?
**Default if unknown:** Yes (most systems link tenants to properties through rental contracts)

## Q2: Should we display multiple properties if a tenant has multiple active contracts?
**Default if unknown:** No (typically tenants have one primary residence at a time)

## Q3: Should the "no property" message include contact information for the specific property manager?
**Default if unknown:** No (generic message is simpler and more maintainable)

## Q4: Should property details shown include the same information currently hardcoded (name, address, specs)?
**Default if unknown:** Yes (maintain consistency with current UI design)

## Q5: Should we also update the tenant dashboard (/tenant/dashboard) to show dynamic property info?
**Default if unknown:** Yes (consistency across all tenant views is important)