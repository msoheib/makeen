# Detail Questions

## Q6: Should we completely remove the payment method field from the UI since there will only be cash?
**Default if unknown:** No (keep the field but only show cash option for consistency with database schema)

## Q7: When replacing "country" field with "district", should the new district field still use a text input or would you prefer a dropdown/selection list?
**Default if unknown:** Yes (keep as text input like the current implementation)

## Q8: Should the property type buttons be displayed in multiple rows if they don't fit on one line, or should we reduce the font size?
**Default if unknown:** Yes (display in multiple rows to maintain readability)

## Q9: Should we validate that the street field contains actual street information (not just numbers or single characters)?
**Default if unknown:** No (basic required field validation only, like other fields)

## Q10: Should the form automatically set the country value to "السعودية" in the database even though it won't be shown to users?
**Default if unknown:** Yes (maintain data integrity and avoid database constraint violations)