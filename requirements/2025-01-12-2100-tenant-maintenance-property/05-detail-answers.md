# Detail Answers

## Q1: Should we add comprehensive logging to help debug the property data extraction and identify the exact response structure?
**Answer:** Yes

## Q2: Should the property be automatically pre-selected and the selection UI hidden when a tenant has only one active contract?
**Answer:** Yes

## Q3: Should we add proper error handling to distinguish between "no contracts" vs "contracts exist but property data missing"?
**Answer:** No

## Q4: Should we add TypeScript interfaces for the contract-with-property response to prevent similar data mapping issues?
**Answer:** Yes

## Q5: Should we validate that the property data exists before attempting to display it in the selection modal?
**Answer:** Yes but if it does exist the maintenance page shows the appropriate message but the problem is that it is not displaying properties when tenants have been assigned a property already