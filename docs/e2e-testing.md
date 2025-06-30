# E2E Testing with Detox

## Overview
This project uses Detox for End-to-End (E2E) testing to ensure RTL (Right-to-Left) layout functionality works correctly across different app builds and prevents regression bugs.

## Setup Requirements

### 1. Android Emulator
- Android Studio with SDK installed
- Android emulator running with API level 30 or higher
- Recommended AVD: `Pixel_4_API_30`

### 2. Dependencies
All required dependencies are already installed:
- `detox` - E2E testing framework
- `jest-circus` - Test runner for Detox
- `expo-updates` - For app reload functionality

## Running Tests

### Build and Test Commands
```bash
# Build and run all E2E tests
npm run e2e:test

# Build Android debug version
npm run detox:build:android

# Run tests on debug build
npm run detox:test:android

# Run only RTL-specific tests
npm run e2e:test:rtl

# Build and test release version
npm run detox:build:android:release
npm run detox:test:android:release
```

### Manual Setup
```bash
# Start Android emulator first
# Then run tests manually:
detox test --configuration android.emu.debug
```

## Test Coverage

### RTL Layout Tests (`e2e/rtl.test.js`)
The main test suite covers:

1. **Default English (LTR) Layout**
   - Verifies app starts in English by default
   - Confirms LTR layout direction

2. **Arabic (RTL) Language Switch**
   - Tests switching from English to Arabic
   - Verifies automatic app reload occurs
   - Confirms RTL layout is applied correctly

3. **Language Persistence**
   - Tests that language choice persists across app restarts
   - Verifies storage mechanism works correctly

4. **Rapid Language Switching**
   - Tests app stability during rapid language changes
   - Ensures no crashes or memory leaks

5. **Navigation in RTL**
   - Verifies navigation drawer opens from correct side
   - Tests menu item alignment in Arabic
   - Confirms proper RTL text flow

## Key Test Features

### Helper Functions
Global helper functions available in all tests:
- `helpers.waitForAppToLoad()` - Wait for app initialization
- `helpers.changeLanguage(lang)` - Switch language and wait for reload
- `helpers.verifyRTLLayout()` - Verify RTL layout elements
- `helpers.verifyLTRLayout()` - Verify LTR layout elements

### TestIDs Used
Required testIDs in components for test targeting:
- `splash-screen` - Main splash screen container
- `settings-tab` - Settings tab in navigation
- `language-setting` - Language setting menu item
- `language-ar` / `language-en` - Language selection buttons
- `hamburger-menu` - Navigation menu button
- `navigation-drawer` - Side drawer container
- `menu-items` - Navigation menu items container

## Test Configuration

### Detox Configuration (`.detoxrc.js`)
- Configured for Android emulator and attached devices
- Supports both debug and release builds
- 120-second timeout for app operations
- Jest test runner with proper setup

### Jest Configuration (`e2e/jest.config.js`)
- Single worker to prevent race conditions
- Extended timeout for E2E operations
- Proper setup and teardown hooks
- Verbose logging for debugging

## Troubleshooting

### Common Issues

1. **App doesn't reload during language switch**
   - Ensure `expo-updates` is properly installed
   - Check if app has proper permissions
   - Verify `Updates.reloadAsync()` is called correctly

2. **Emulator not detected**
   - Start Android emulator before running tests
   - Check AVD name matches configuration
   - Ensure ADB is properly configured

3. **Tests timeout**
   - Increase timeout in jest configuration
   - Check if app is properly built
   - Verify emulator has sufficient resources

4. **RTL layout not applying**
   - Check if `I18nManager.forceRTL()` is called
   - Verify app reload occurs after RTL change
   - Ensure store hydration completes before testing

### Debug Mode
Run tests with detailed logging:
```bash
detox test --configuration android.emu.debug --loglevel verbose
```

## Production Testing
These E2E tests are specifically designed to catch RTL issues that may not appear in development but occur in production builds, ensuring:
- Language switching works in compiled apps
- RTL layout applies correctly after app store downloads
- No regression bugs in internationalization features

## Continuous Integration
Tests can be integrated into CI/CD pipelines to:
- Prevent RTL regression bugs from reaching production
- Validate language switching functionality
- Ensure proper app reload behavior across different build types 