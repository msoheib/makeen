# Expert Detail Questions: Tenant Data Fetching Issues

## Q6: Should we extend the existing NotificationEmpty component at `components/NotificationEmpty.tsx` for tenant-specific empty states?
**Default if unknown:** Yes (maintains UI consistency and reuses existing Arabic/English translation patterns)

## Q7: When a tenant has no active contracts, should the dashboard show "0 ريال" or hide the payment section entirely?
**Default if unknown:** Show "0 ريال" (clearer than hidden section, indicates no outstanding payments)

## Q8: Should we add a new translation namespace `tenants.json` for tenant-specific messages, or extend the existing `common.json`?
**Default if unknown:** Extend common.json (simpler maintenance, tenant messages are not extensive enough for separate namespace)

## Q9: For the properties tab, should we show "No properties assigned - Contact your property manager" in both the empty state AND when the API returns an error?
**Default if unknown:** Yes (unified messaging regardless of whether it's empty data or API error for better UX)

## Q10: Should the maintenance tab allow tenants to see a "Request Assignment" button when they have no properties, or just show the empty message?
**Default if unknown:** No (manual assignment only, no self-service per regulatory constraints mentioned)