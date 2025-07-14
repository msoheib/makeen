# Expert Requirements Questions

Based on the codebase analysis, these questions will clarify the expected system behavior for the scrolling fixes.

## Q1: Should we maintain the current nested ScrollView + FlatList architecture in Properties and Tenants pages, or is it acceptable to refactor to a single FlatList with ListHeaderComponent for the stats section?
**Default if unknown:** No, refactor to single FlatList (better performance and eliminates nested scrolling issues)

## Q2: For the Maintenance page stats section, should it scroll away with the content like other pages, or do you prefer it to remain visible as a sticky header while scrolling through maintenance requests?
**Default if unknown:** Yes, it should scroll away with content (maintaining consistency with other pages)

## Q3: Should the card press functionality remain as-is with navigation to detail pages, or would you prefer to implement a different interaction pattern that's more web-touch friendly (like requiring a double-tap or having a dedicated button)?
**Default if unknown:** No, keep current press functionality (users expect this behavior)

## Q4: When implementing web-specific touch optimizations, should we add Platform.select conditions to existing components or create separate web-optimized card components?
**Default if unknown:** Yes, add Platform.select conditions to existing components (maintains single codebase)

## Q5: Should the scrolling fixes apply to all platforms (native iOS/Android, web) or focus specifically on the web platform where the issues are most prominent?
**Default if unknown:** No, focus on web platform (issues are web-specific, native works fine)