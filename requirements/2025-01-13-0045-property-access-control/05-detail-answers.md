# Expert Detail Answers

## Q6: Should we extend the existing property creation API at `lib/api.ts:propertiesApi.create()` to handle notification triggers?
**Answer:** Yes

## Q7: Should the owner selection dropdown in the add property form use the same owner profiles query from `lib/api.ts:profilesApi.getAll()`?
**Answer:** Yes

## Q8: Should ownership transfer functionality be added as a new action in the property details screen at `app/properties/[id].tsx`?
**Answer:** Yes

## Q9: Should we validate tenant contract status in real-time when they access properties, or cache the validation in the security context?
**Answer:** Cache in security context

## Q10: Should the property manager role checks use the existing `getCurrentUserContext()` role validation or create new permission-specific checks?
**Answer:** Use existing `getCurrentUserContext()` (default - maintains consistency with current security architecture)