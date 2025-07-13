# Expert Detail Questions

## Q6: Should we extend the existing property creation API at `lib/api.ts:propertiesApi.create()` to handle notification triggers?
**Default if unknown:** Yes (maintains architectural consistency with centralized API layer)

## Q7: Should the owner selection dropdown in the add property form use the same owner profiles query from `lib/api.ts:profilesApi.getAll()`?
**Default if unknown:** Yes (reuses existing API patterns and ensures consistent owner data)

## Q8: Should ownership transfer functionality be added as a new action in the property details screen at `app/properties/[id].tsx`?
**Default if unknown:** Yes (keeps ownership management centralized in property details view)

## Q9: Should we validate tenant contract status in real-time when they access properties, or cache the validation in the security context?
**Default if unknown:** Cache in security context (matches current pattern of pre-loading property access in `getCurrentUserContext()`)

## Q10: Should the property manager role checks use the existing `getCurrentUserContext()` role validation or create new permission-specific checks?
**Default if unknown:** Use existing `getCurrentUserContext()` (maintains consistency with current security architecture)