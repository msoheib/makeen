# Discovery Questions

These questions help understand the scope and context of the tag/label vertical clipping issue in maintenance cards.

## Q1: Is the vertical clipping issue visible on both mobile and web platforms?
**Default if unknown:** Yes (React Native apps typically aim for consistent cross-platform appearance)

## Q2: Does the clipping issue occur specifically with the status chip (pending, approved, etc.) in the maintenance cards?
**Default if unknown:** Yes (status chips are the primary tags/labels shown in the component at line 201-210)

## Q3: Is the clipping issue also affecting the priority labels (low, medium, high, urgent)?
**Default if unknown:** No (priority labels use text with icons rather than chips, less prone to clipping)

## Q4: Are users currently experiencing this issue in production affecting their ability to read the full status text?
**Default if unknown:** Yes (visual bugs like clipping typically impact user experience immediately)

## Q5: Does the clipping issue persist when switching between light and dark themes?
**Default if unknown:** Yes (styling issues often affect both themes unless specifically handled)