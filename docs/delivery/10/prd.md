# PBI-10: Remove Drawer Overlay/Fading Effect

## Overview
The current drawer navigator applies an overlay (`overlayColor`) that dims the underlying content whenever the sidebar is opened. Users have requested that the app remain fully visible without any dimming in all circumstances.

## Problem Statement
The dimmed overlay makes the main screen harder to read, feels visually heavy, and causes confusion when the overlay remains active in corner-cases. Removing the overlay will improve clarity and user experience.

## User Stories
*As an app user, I want the sidebar to slide in without fading the content behind it so that I can still read and interact with the main screen while the sidebar is open (where interaction is permitted).*  

## Technical Approach
1. Update drawer navigator configuration (`app/(drawer)/_layout.tsx`) to set `overlayColor="transparent"` (or remove property).  
2. Verify no additional custom fading/opacity styles are applied elsewhere.  
3. Ensure that touch interception still works (React Navigation handles a transparent overlay area for closing).  
4. Provide regression testing on opening/closing the drawer and other navigations.

## UX/UI Considerations
• Sidebar animation and width remain unchanged.  
• No backdrop fade-in/out.  
• Close gesture / tap-outside must still dismiss drawer.

## Acceptance Criteria
- [ ] Opening the drawer shows no dimming of the main screen.  
- [ ] Closing the drawer restores full interactivity, with no residual opacity.  
- [ ] Tapping outside the drawer still closes it.  
- [ ] Behaviour verified on Android and iOS.  
- [ ] No visual regressions to sidebar styling.

## Dependencies
None.

## Open Questions
- Do we want a slight shadow at drawer edge? (default elevation covers this).  

## Related Tasks
Will be listed in `tasks.md`. 