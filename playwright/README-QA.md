# QA Testing Suite - Theme and Language Consistency

This comprehensive QA testing suite focuses on ensuring consistent behavior across different themes (light/dark) and languages (English/Arabic) in the Real Estate Management application.

## 🎯 Test Coverage

### Language Consistency Tests
- ✅ **English Language Display**: Verifies all English text elements are visible and correctly positioned
- ✅ **Arabic Language Display**: Tests Arabic text with proper RTL (Right-to-Left) layout
- ✅ **Language Switching**: Ensures smooth transitions between languages without UI breaks
- ✅ **RTL Layout**: Validates proper right-to-left text direction and element positioning

### Theme Consistency Tests
- ✅ **Light Theme**: Verifies consistent appearance across all screens in light mode
- ✅ **Dark Theme**: Tests dark mode consistency and proper contrast
- ✅ **Theme Switching**: Ensures smooth transitions between light and dark themes
- ✅ **UI Element Consistency**: Validates that all UI elements maintain proper styling

### Combined Testing
- ✅ **Arabic + Dark Theme**: Tests the combination of Arabic language with dark theme
- ✅ **English + Light Theme**: Validates the default combination
- ✅ **Cross-Combination Testing**: Tests all possible theme/language combinations

### Error Handling & Edge Cases
- ✅ **Rapid Switching**: Tests rapid theme/language switching for stability
- ✅ **Console Error Monitoring**: Tracks and reports console errors during operations
- ✅ **Graceful Error Handling**: Ensures the app handles errors gracefully

## 🚀 Running the Tests

### Quick Start
```bash
# Run all QA tests with comprehensive reporting
npm run test:qa

# Run only theme and language tests
npm run test:qa:theme

# Run with Playwright UI for interactive testing
npm run test:qa:theme:ui
```

### Individual Test Execution
```bash
# Run specific test suites
npx playwright test qa-theme-language.spec.ts
npx playwright test dashboard.spec.ts
npx playwright test auth.spec.ts

# Run with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 📊 Test Reports

After running the tests, you'll find comprehensive reports in the `playwright-report/` directory:

- **`index.html`**: Interactive HTML report with test results and screenshots
- **`qa-summary.md`**: Detailed markdown summary of all test results
- **`screenshots/`**: Visual screenshots captured during testing
- **`results.json`**: Machine-readable test results

## 📸 Screenshots Generated

The test suite automatically captures screenshots for:

- English language consistency across all screens
- Arabic language with RTL layout
- Light theme consistency
- Dark theme consistency
- Theme switching transitions
- Language switching transitions
- Combined theme/language combinations
- Navigation consistency across all combinations
- Form consistency across all combinations

## 🔧 Configuration

### Test Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './playwright/tests',
  timeout: 120 * 1000,        // 2 minutes per test
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: 'http://localhost:19006',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  }
});
```

### Environment Variables
```bash
# Skip web server startup (if already running)
PLAYWRIGHT_SKIP_WEB_SERVER=1

# Run in CI mode
CI=1

# Custom port
PORT=8081
```

## 🎨 Visual Testing Features

### Screenshot Comparison
The test suite captures screenshots at key points to ensure visual consistency:

1. **Language Consistency**: Screenshots of each screen in both English and Arabic
2. **Theme Consistency**: Screenshots of each screen in both light and dark themes
3. **Combination Testing**: Screenshots of all theme/language combinations
4. **Navigation Testing**: Screenshots during navigation between screens
5. **Form Testing**: Screenshots of form elements across different combinations

### RTL Layout Validation
The tests specifically validate:
- Text direction is properly set to RTL for Arabic
- Element positioning follows RTL conventions
- Navigation elements are properly mirrored
- Form layouts adapt correctly to RTL

## 🐛 Error Monitoring

The test suite monitors console errors and categorizes them:

### Expected Warnings (Filtered Out)
- `expo-notifications` warnings on web
- `useNativeDriver` warnings on web
- `pointerEvents` deprecation warnings
- `shadow*` deprecation warnings

### Critical Errors (Reported)
- JavaScript runtime errors
- React component errors
- Navigation errors
- Theme/language switching errors

## 📋 Test Checklist

### Pre-Test Setup
- [ ] Application is running on localhost:19006
- [ ] Database is accessible and populated with test data
- [ ] All dependencies are installed
- [ ] Playwright browsers are installed (`npx playwright install`)

### Post-Test Validation
- [ ] All screenshots are captured correctly
- [ ] HTML report is generated
- [ ] Console errors are within acceptable limits
- [ ] No critical functionality is broken

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill existing processes on port 19006
   npx kill-port 19006
   # Or use a different port
   PORT=8081 npm run test:qa
   ```

2. **Browser Not Installed**
   ```bash
   npx playwright install
   ```

3. **Screenshots Not Generated**
   - Check that the `playwright-report/screenshots/` directory exists
   - Verify file permissions
   - Ensure tests are running in headed mode for screenshots

4. **Tests Timing Out**
   - Increase timeout in `playwright.config.ts`
   - Check that the application is responding quickly
   - Verify network connectivity

### Debug Mode
```bash
# Run with debug output
DEBUG=pw:api npm run test:qa:theme

# Run with headed browser for visual debugging
npx playwright test qa-theme-language.spec.ts --headed

# Run specific test
npx playwright test qa-theme-language.spec.ts -g "Arabic language displays correctly"
```

## 📈 Continuous Integration

### GitHub Actions Example
```yaml
name: QA Tests
on: [push, pull_request]
jobs:
  qa-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:qa
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🎯 Best Practices

1. **Run tests before deployment** to catch theme/language issues early
2. **Review screenshots** to ensure visual consistency
3. **Monitor console errors** to maintain code quality
4. **Test on different screen sizes** for responsive design validation
5. **Update tests** when adding new UI elements or features

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [React Native Web Testing](https://reactnative.dev/docs/testing-overview)
- [RTL Layout Testing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Writing_Modes)
- [Theme Testing Best Practices](https://material.io/design/color/dark-theme.html)

---

*This QA testing suite ensures that the Real Estate Management application provides a consistent and reliable user experience across all supported themes and languages.*
