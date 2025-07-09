# Expert Requirements Questions

## Q6: Should the shimmer effect automatically detect and adapt to the number of items being loaded (e.g., show 3 property card shimmers if loading 3 properties)?
**Default if unknown:** No (show a fixed number like 5 shimmers for lists to avoid layout jumping)

## Q7: When a component has both an image and text content (like PropertyCard), should the image area show a different shimmer pattern than text lines?
**Default if unknown:** Yes (image areas typically show a solid shimmer block, text shows line-based shimmers)

## Q8: Should we implement a progressive loading approach where content appears as soon as it's ready rather than waiting for all data?
**Default if unknown:** Yes (better perceived performance, especially for lists)

## Q9: Do you want the shimmer animation to pause when the app is in the background to save battery?
**Default if unknown:** Yes (follow React Native best practices for background behavior)

## Q10: Should error states also use a shimmer-style placeholder before showing the error message?
**Default if unknown:** No (errors should appear immediately without shimmer delay)