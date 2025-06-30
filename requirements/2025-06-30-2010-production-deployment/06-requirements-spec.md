# Requirements Specification: Production Deployment Preparation

## Problem Statement
The real estate management app needs to be prepared for production deployment to app stores via EAS (Expo Application Services). Currently, the app has extensive uncommitted changes from UI/theme updates, hardcoded security credentials, and incomplete deployment configuration that must be addressed before production release.

## Solution Overview
1. **Git Commit**: Create comprehensive commit documenting all UI/theme changes
2. **Security**: Remove hardcoded credentials and implement environment-based configuration
3. **EAS Configuration**: Update build profiles for production Android deployment
4. **Environment Management**: Create separate development/staging/production configurations
5. **Asset Optimization**: Ensure production-ready icons and splash screens
6. **Deployment Pipeline**: Prepare for Android-first app store publication

## Functional Requirements

### FR1: Git Repository Preparation
- Create single comprehensive commit message documenting all changes made
- Include detailed description of purple theme implementation (#4C2661)
- Document navigation restructure (removal of drawer system)
- Document component updates and import path fixes
- Ensure clean git state before deployment

### FR2: Security Configuration
- Remove Supabase service role key from client application
- Replace hardcoded credentials with environment variables
- Create environment-specific Supabase project configurations
- Update `lib/supabase.ts` to use environment variables
- Clean `app.json` of hardcoded credentials

### FR3: Environment Management
- Create `.env.development`, `.env.staging`, `.env.production` files
- Configure environment-specific Supabase URLs and keys
- Implement environment variable loading in app configuration
- Set up staging and production Supabase projects if needed

### FR4: EAS Build Configuration
- Update `eas.json` for Android-first deployment
- Configure production builds to generate both APK and AAB
- Set up proper versioning and build automation
- Ensure Google Play Store compatibility
- Prepare for future iOS configuration

### FR5: Asset Preparation
- Verify production app icon is properly configured
- Create proper splash screen from updated logo.png
- Optimize assets for both platforms
- Ensure consistent branding across all app assets

## Technical Requirements

### TR1: Git Commit Structure
**Commit Message Format:**
```
feat: Complete UI redesign with purple theme and simplified navigation

BREAKING CHANGES:
- Remove drawer navigation system entirely
- Implement purple theme (#4C2661) across all components
- Replace Chrome home icon with proper Home icon
- Remove hamburger menus from all screens

FEATURES:
- Purple color scheme with Material Design 3 compliance
- Simplified tab-only navigation structure
- Updated app header colors and styling
- Icon-only bottom navigation bar

FIXES:
- Resolved navigation route references
- Fixed import paths after structure changes
- Updated tab bar color references
- Removed unused sidebar components

TECHNICAL:
- Updated 20+ navigation references
- Cleaned up component prop interfaces
- Optimized routing structure for performance
```

### TR2: Environment Configuration Files

**`.env.development`**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
EXPO_PUBLIC_ENVIRONMENT=development
```

**`.env.production`**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
EXPO_PUBLIC_ENVIRONMENT=production
```

### TR3: Updated Supabase Configuration
**File:** `lib/supabase.ts`
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}
```

### TR4: Enhanced EAS Configuration
**File:** `eas.json`
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "NODE_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "NODE_ENV": "production"
      },
      "android": {
        "buildType": "aab",
        "gradleCommand": ":app:bundleRelease"
      }
    },
    "production-apk": {
      "extends": "production",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

### TR5: App Configuration Updates
**File:** `app.json`
- Remove hardcoded Supabase credentials from `extra` section
- Ensure proper app versioning for production
- Verify bundle identifiers for both platforms
- Configure proper app permissions

## Implementation Strategy

### Phase 1: Pre-Deployment Cleanup
1. **Git Status Check**: Review all uncommitted changes
2. **Security Audit**: Identify all hardcoded credentials
3. **Asset Verification**: Confirm icon and splash screen assets
4. **Environment Setup**: Create environment configuration files

### Phase 2: Security Hardening
1. **Remove Service Role Key**: Delete from all client-side files
2. **Environment Variables**: Replace hardcoded values
3. **Configuration Update**: Modify supabase.ts and app.json
4. **Validation**: Test with environment variables

### Phase 3: EAS Configuration
1. **Update Build Profiles**: Configure production builds
2. **Android Optimization**: Set up AAB and APK builds
3. **Versioning**: Ensure proper increment configuration
4. **Build Testing**: Test development and preview builds

### Phase 4: Git Commit and Deployment
1. **Comprehensive Commit**: Create detailed commit message
2. **Tag Release**: Tag commit for production release
3. **Build Production**: Run `eas build --platform android --profile production`
4. **Quality Assurance**: Test production build before submission

## Acceptance Criteria

### Git and Version Control
- [ ] All changes committed with comprehensive message
- [ ] No uncommitted files in git status
- [ ] Production release tagged appropriately
- [ ] Clean git history ready for deployment

### Security
- [ ] No hardcoded credentials in client code
- [ ] Service role key completely removed
- [ ] Environment variables properly configured
- [ ] Supabase connection working with environment config

### Build Configuration
- [ ] EAS production builds generate AAB for Play Store
- [ ] APK builds available for testing
- [ ] Auto-increment versioning working
- [ ] Build process completes without errors

### Assets and Branding
- [ ] App icon displays correctly in builds
- [ ] Splash screen matches updated branding
- [ ] Purple theme consistent across all screens
- [ ] App metadata ready for store submission

### Deployment Readiness
- [ ] Android production build successfully created
- [ ] Build artifacts ready for Play Store submission
- [ ] App tested on production configuration
- [ ] Documentation prepared for store listing

## Risk Considerations
- **Breaking Changes**: Extensive navigation restructure requires thorough testing
- **Environment Issues**: Environment variable misconfigurations could break app
- **Build Failures**: Complex build configuration may cause EAS build issues
- **Asset Problems**: Icon/splash screen issues could affect store approval

## Next Steps After Implementation
1. **Play Store Setup**: Create Google Play Console account and app listing
2. **Store Assets**: Prepare screenshots, descriptions, and metadata
3. **iOS Preparation**: Set up Apple Developer account for future iOS deployment
4. **Monitoring**: Implement crash reporting and analytics for production
5. **CI/CD**: Consider automated build and deployment pipelines

## Assumptions
- Google Play Console account will be created for Android deployment
- Current Supabase configuration is production-ready
- App functionality has been thoroughly tested with new navigation structure
- Store listing assets and metadata will be prepared separately