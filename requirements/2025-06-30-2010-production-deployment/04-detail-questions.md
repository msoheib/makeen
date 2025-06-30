# Detail Questions

## Q6: Should we create separate environment configurations (.env files) for development, staging, and production with different Supabase projects?
**Default if unknown:** Yes (standard practice for production apps to separate environments)

## Q7: Do you have an Apple Developer Account for iOS deployment, or should we focus on Android-first deployment while iOS setup is prepared?
**Default if unknown:** Focus on Android-first (iOS requires paid Apple Developer account and additional setup time)

## Q8: Should we commit all current changes in a single comprehensive commit, or break them into logical feature commits (theme changes, navigation restructure, etc.)?
**Default if unknown:** Single comprehensive commit (simpler for this deployment preparation, changes are already integrated)

## Q9: Should we configure EAS Build to generate both APK (for testing) and AAB (for Play Store) for Android builds?
**Default if unknown:** Yes (AAB required for Play Store, APK useful for testing)

## Q10: Should we set up automated EAS Submit workflows to automatically submit builds to app stores after successful builds?
**Default if unknown:** No (manual review and submission is safer for initial production deployment)