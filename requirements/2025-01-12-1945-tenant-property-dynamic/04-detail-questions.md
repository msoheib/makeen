# Detail Questions

These are expert-level questions based on deep codebase analysis to clarify expected system behavior.

## Q6: Should we reuse the existing `tenantContracts` data already being fetched in `app/(tabs)/index.tsx`?
**Default if unknown:** Yes (avoids duplicate API calls and maintains consistency with payment calculation)

## Q7: Should the property display show area in square meters using the existing `area_sqm` field format?
**Default if unknown:** Yes (matches existing UI pattern "150 م²" in hardcoded display)

## Q8: Should we prioritize active contracts over other statuses when selecting which property to display?
**Default if unknown:** Yes (active contracts represent current tenant assignments)

## Q9: Should the "no property" message use the same card styling as the current property display?
**Default if unknown:** Yes (maintains visual consistency in the UI)

## Q10: Should we add loading states for the property section similar to the payment section?
**Default if unknown:** Yes (consistent with existing loading patterns throughout the dashboard)