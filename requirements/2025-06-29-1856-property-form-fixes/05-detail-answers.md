# Detail Answers

## Q6: Should we completely remove the payment method field from the UI since there will only be cash?
**Answer:** Yes - remove the payment method field entirely from UI

## Q7: When replacing "country" field with "district", should the new district field still use a text input or would you prefer a dropdown/selection list?
**Answer:** Text input - keep as text input

## Q8: Should the property type buttons be displayed in multiple rows if they don't fit on one line, or should we reduce the font size?
**Answer:** Make them scrollable horizontally

## Q9: Should we validate that the street field contains actual street information (not just numbers or single characters)?
**Answer:** No - basic validation only

## Q10: Should the form automatically set the country value to "السعودية" in the database even though it won't be shown to users?
**Answer:** Yes - automatically set country to Saudi Arabia

## Summary of Detail Decisions
- Remove payment method UI completely (no segmented buttons)
- District field becomes a text input
- Property type buttons should scroll horizontally to prevent clipping
- Street field needs only basic required validation
- Country automatically set to "السعودية" in backend