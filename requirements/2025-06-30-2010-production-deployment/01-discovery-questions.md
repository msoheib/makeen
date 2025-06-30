# Discovery Questions

## Q1: Will this deployment include both iOS and Android app stores, or just Android initially?
**Default if unknown:** Just Android initially (iOS setup is not complete and requires Apple Developer account)

## Q2: Should we remove the Supabase service role key from the client application before deployment?
**Default if unknown:** Yes (critical security issue - service role keys should never be in client apps)

## Q3: Do you want to create a comprehensive git commit message documenting all the UI/theme changes made today?
**Default if unknown:** Yes (good practice to document major changes before deployment)

## Q4: Will the app require any environment-specific configurations (dev/staging/prod) for different deployments?
**Default if unknown:** Yes (most production apps need separate environment configurations)

## Q5: Do you have production-ready app icons and splash screens, or should we use the current placeholder assets?
**Default if unknown:** Use current assets for now (can be updated later but shouldn't block initial deployment)