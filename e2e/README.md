# E2E Forms Testing Guide

This directory contains comprehensive End-to-End (E2E) tests for all forms in the Real Estate Management Application using Detox testing framework.

## Overview

The E2E test suite covers all major forms and user flows in the application:

- **Authentication Forms** (Login, Signup)
- **Property Management Forms** (Add Property)
- **Tenant Management Forms** (Add/Edit Tenant)
- **Maintenance Forms** (Create Maintenance Request)
- **Financial Forms** (Invoices, Vouchers, Journal Entries)
- **RTL Support Testing** (Arabic language support)
- **Cross-platform Testing** (Android focus)

## Test Structure

```
e2e/
├── forms/
│   ├── auth.test.js          # Authentication form tests
│   ├── property.test.js      # Property management form tests
│   ├── tenant.test.js        # Tenant management form tests
│   ├── maintenance.test.js   # Maintenance request form tests
│   ├── financial.test.js     # Financial form tests (invoices, vouchers)
│   └── all-forms.test.js     # Comprehensive integration tests
├── rtl.test.js              # RTL layout tests
├── setup.js                 # Test setup and helper functions
└── README.md               # This file
```

## Running Tests

### Prerequisites

1. **Android Emulator**: Ensure Android emulator is running
2. **Detox Setup**: Detox should be configured (already done in this project)
3. **App Build**: Build the app for testing

### Available Test Commands

```bash
# Build app for testing
npm run detox:build:android

# Run all form tests
npm run e2e:test:forms

# Run specific form tests
npm run e2e:test:auth           # Authentication forms only
npm run e2e:test:property       # Property forms only
npm run e2e:test:tenant         # Tenant forms only
npm run e2e:test:maintenance    # Maintenance forms only
npm run e2e:test:financial      # Financial forms only

# Run comprehensive integration tests
npm run e2e:test:all-forms

# Run RTL-specific tests
npm run e2e:test:rtl

# Run full test suite (build + all tests)
npm run e2e:test:full
```

## Test Categories

### 1. Authentication Form Tests (`auth.test.js`)

**Coverage:**
- Sign in form validation and submission
- User registration with role selection
- Password visibility toggle
- Remember me functionality
- Forgot password flow
- Form validation (empty fields, invalid email, password mismatch)
- RTL support for Arabic

**Key Test Cases:**
- ✅ Display all form elements
- ✅ Validation error handling
- ✅ Successful login/registration flow
- ✅ Password strength indicator
- ✅ Arabic RTL layout

### 2. Property Form Tests (`property.test.js`)

**Coverage:**
- Add property form with all sections
- Property type selection (apartment, villa, office, etc.)
- Location details (address, city, country, neighborhood)
- Property specifications (area, bedrooms, bathrooms)
- Pricing and payment methods
- Listing type selection (rent/sale/both)
- Form validation and error handling
- Draft saving functionality

**Key Test Cases:**
- ✅ Complete property creation flow
- ✅ Numeric validation (area, price, bedrooms)
- ✅ Dropdown selections
- ✅ Draft save/restore
- ✅ Arabic RTL support

### 3. Tenant Form Tests (`tenant.test.js`)

**Coverage:**
- Tenant assignment to properties
- Contract details (dates, rent, security deposit)
- Payment terms and frequency
- Additional terms (utilities, pets)
- Edit tenant information
- Foreign tenant designation
- Date range validation

**Key Test Cases:**
- ✅ Full tenant assignment flow
- ✅ Date picker functionality
- ✅ Financial calculations (security deposit auto-calculation)
- ✅ Edit tenant form with change detection
- ✅ Arabic RTL support

### 4. Maintenance Form Tests (`maintenance.test.js`)

**Coverage:**
- Maintenance request creation
- Priority level selection (low, medium, high, urgent)
- Property and category selection
- Photo attachments (up to 5 photos)
- Preferred scheduling
- Emergency request handling
- Description length validation
- Access instructions

**Key Test Cases:**
- ✅ Complete maintenance request flow
- ✅ Photo upload and removal (mock)
- ✅ Priority-based emergency handling
- ✅ Draft saving
- ✅ Photo limit enforcement
- ✅ Arabic RTL support

### 5. Financial Form Tests (`financial.test.js`)

**Coverage:**
- Invoice creation with line items
- VAT calculations (0%, 5%, 15%)
- Payment terms selection
- Customer and property selection
- Receipt voucher creation
- Payment voucher creation
- Journal entry with double-entry bookkeeping
- Account selection and classification

**Key Test Cases:**
- ✅ Multi-line item invoice creation
- ✅ Automatic VAT calculations
- ✅ Double-entry bookkeeping validation
- ✅ Payment method selection
- ✅ Date validation
- ✅ Arabic number formatting

### 6. Comprehensive Integration Tests (`all-forms.test.js`)

**Coverage:**
- End-to-end user flows across multiple forms
- Cross-form data consistency
- Performance testing with rapid navigation
- Network error handling
- Draft management across forms
- RTL testing across all forms
- Error handling and edge cases

**Key Test Cases:**
- ✅ Complete user journey (signup → property → tenant → maintenance → invoice)
- ✅ Network error recovery
- ✅ Form validation consistency
- ✅ Performance under load
- ✅ RTL across all forms

## Helper Functions

The test suite includes comprehensive helper functions in `setup.js`:

### Authentication Helpers
- `authenticateUser(userType)` - Login with different user roles
- `logout()` - Logout functionality

### Form Helpers
- `fillForm(formData)` - Fill form fields programmatically
- `selectOption(selector, option)` - Handle dropdown selections
- `selectDate(testID, dateOption)` - Date picker interactions

### Validation Helpers
- `expectValidationError(message)` - Check for validation errors
- `expectNoValidationError(message)` - Verify no validation errors

### Media Helpers
- `addMockPhoto()` - Mock photo upload functionality

### Navigation Helpers
- `navigateToForm(formType)` - Navigate to specific forms
- `verifyRTLLayout()` - Verify RTL layout correctness

### Utility Helpers
- `waitForLoading()` - Wait for loading states
- `expectCurrencyDisplay()` - Verify currency formatting
- `handleNetworkError()` - Handle network error scenarios

## RTL Testing

All forms are tested for Right-to-Left (RTL) language support:

- **Arabic Language Interface**: All labels and text in Arabic
- **RTL Layout Verification**: Text alignment, icon positions, navigation
- **Input Handling**: Arabic text input with proper alignment
- **Number Formatting**: Arabic numerals conversion and currency display

## Test Data

The tests use predefined test data:

```javascript
// Test Users
const testUsers = {
  owner: { email: 'owner@test.com', password: 'password123' },
  tenant: { email: 'tenant@test.com', password: 'password123' },
  manager: { email: 'manager@test.com', password: 'password123' }
};

// Test Properties
const testProperties = {
  apartment: 'Modern Apartment Downtown',
  villa: 'Luxury Villa Suburbs'
};
```

## Debugging Tests

### Enable Detailed Logging
```bash
# Run with verbose output
DEBUG=detox* npm run e2e:test:forms
```

### Test Individual Scenarios
```bash
# Run specific test file with pattern
npx detox test --configuration android.emu.debug --grep "should create property"
```

### Screenshot Capture
Tests automatically capture screenshots on failures. Screenshots are saved in:
```
artifacts/android.emu.debug.YYYY-MM-DD_HH-MM-SS/
```

## Common Issues and Solutions

### 1. Element Not Found
```javascript
// Wait for element to appear
await waitFor(element(by.testID('element-id')))
  .toBeVisible()
  .withTimeout(10000);
```

### 2. Keyboard Issues
```javascript
// Dismiss keyboard if interfering
await element(by.testID('form-container')).tap();
```

### 3. Network Timeouts
```javascript
// Increase timeout for network operations
await helpers.waitForLoading(30000); // 30 seconds
```

### 4. RTL Layout Issues
```javascript
// Verify RTL-specific attributes
await expect(element(by.testID('text-input'))).toHaveTextAlignment('right');
```

## Performance Considerations

- **Test Isolation**: Each test runs in a clean app state
- **Parallel Execution**: Tests can be run in parallel with multiple devices
- **Resource Cleanup**: Proper cleanup after each test
- **Mock Services**: External services are mocked to avoid dependencies

## Continuous Integration

Tests are designed to run in CI/CD environments:

```yaml
# Example GitHub Actions
- name: Run E2E Tests
  run: |
    npm run detox:build:android
    npm run e2e:test:forms
```

## Contributing

When adding new forms or modifying existing ones:

1. **Add Test Coverage**: Create corresponding E2E tests
2. **Update Helper Functions**: Add reusable helpers for new patterns
3. **RTL Testing**: Ensure Arabic/RTL support is tested
4. **Documentation**: Update this README with new test coverage

## Test Maintenance

### Regular Updates Needed:
- **Test Data**: Update when database schema changes
- **Test IDs**: Ensure components have proper `testID` attributes
- **Assertions**: Update expected text when UI copy changes
- **Helper Functions**: Maintain and extend as forms evolve

### Best Practices:
- Use descriptive test names
- Keep tests independent and isolated
- Use page object patterns for complex forms
- Mock external dependencies
- Test both happy path and error scenarios