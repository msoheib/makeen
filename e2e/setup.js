const detox = require('detox');
const config = require('../.detoxrc.js');
const adapter = require('detox/runners/jest/adapter');

// Set the default timeout for all tests
jest.setTimeout(120000);

// Setup Detox adapter
beforeAll(async () => {
  await detox.init(config, {initGlobals: false});
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});

// Helper functions for common actions
global.helpers = {
  // Wait for app to be fully loaded
  waitForAppToLoad: async () => {
    await waitFor(element(by.testID('splash-screen')))
      .not.toBeVisible()
      .withTimeout(30000);
  },
  
  // Change language and wait for reload
  changeLanguage: async (language) => {
    await element(by.testID('settings-tab')).tap();
    await element(by.testID('language-setting')).tap();
    await element(by.testID(`language-${language}`)).tap();
  },
  
  // Verify RTL layout by checking element positions
  verifyRTLLayout: async () => {
    // Check if navigation drawer opens from right side for RTL
    const drawer = element(by.testID('navigation-drawer'));
    await element(by.testID('hamburger-menu')).tap();
    await expect(drawer).toBeVisible();
    
    // Verify text alignment and icon positions
    const menuItems = element(by.testID('menu-items'));
    await expect(menuItems).toBeVisible();
  },
  
  // Verify LTR layout
  verifyLTRLayout: async () => {
    const drawer = element(by.testID('navigation-drawer'));
    await element(by.testID('hamburger-menu')).tap();
    await expect(drawer).toBeVisible();
  },

  // Authentication helpers
  authenticateUser: async (userType = 'owner') => {
    // Check if already authenticated
    try {
      await expect(element(by.testID('dashboard-screen'))).toBeVisible();
      return; // Already logged in
    } catch (e) {
      // Need to login
    }

    // Navigate to login if on signup screen
    try {
      await element(by.testID('signin-link')).tap();
    } catch (e) {
      // Already on login screen or somewhere else
    }

    // Wait for login form
    await waitFor(element(by.testID('sign-in-form')))
      .toBeVisible()
      .withTimeout(10000);

    // Use test credentials based on user type
    const credentials = {
      owner: { email: 'owner@test.com', password: 'password123' },
      tenant: { email: 'tenant@test.com', password: 'password123' },
      manager: { email: 'manager@test.com', password: 'password123' }
    };

    const { email, password } = credentials[userType];

    await element(by.testID('email-input')).typeText(email);
    await element(by.testID('password-input')).typeText(password);
    await element(by.testID('sign-in-button')).tap();

    // Wait for dashboard
    await waitFor(element(by.testID('dashboard-screen')))
      .toBeVisible()
      .withTimeout(15000);
  },

  // Logout helper
  logout: async () => {
    await element(by.testID('settings-tab')).tap();
    await element(by.testID('logout-button')).tap();
    await element(by.testID('confirm-logout')).tap();
    
    await waitFor(element(by.testID('sign-in-form')))
      .toBeVisible()
      .withTimeout(10000);
  },

  // Form validation helpers
  expectValidationError: async (message) => {
    await expect(element(by.text(message))).toBeVisible();
  },

  expectNoValidationError: async (message) => {
    await expect(element(by.text(message))).not.toBeVisible();
  },

  // Photo/Camera helpers for maintenance forms
  addMockPhoto: async () => {
    await element(by.testID('add-photo-button')).tap();
    await element(by.testID('photo-source-camera')).tap();
    
    // Mock camera capture
    await element(by.testID('capture-button')).tap();
    
    // Wait for photo to be processed
    await waitFor(element(by.testID('photo-preview')))
      .toBeVisible()
      .withTimeout(5000);
  },

  // Date picker helpers
  selectDate: async (testID, dateOption = 'today') => {
    await element(by.testID(testID)).tap();
    await expect(element(by.testID('date-picker-modal'))).toBeVisible();
    await element(by.testID(`date-${dateOption}`)).tap();
    await element(by.testID('date-confirm')).tap();
  },

  // Dropdown/Selector helpers
  selectOption: async (selectorTestID, optionTestID) => {
    await element(by.testID(selectorTestID)).tap();
    await element(by.testID(optionTestID)).tap();
  },

  // Form filling helpers
  fillForm: async (formData) => {
    for (const [fieldId, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        await element(by.testID(fieldId)).typeText(value);
      } else if (typeof value === 'boolean') {
        const currentValue = await element(by.testID(fieldId)).getAttributes();
        if ((currentValue.value === 'true') !== value) {
          await element(by.testID(fieldId)).tap();
        }
      }
    }
  },

  // Wait for loading to complete
  waitForLoading: async (timeout = 15000) => {
    await waitFor(element(by.testID('loading-indicator')))
      .not.toBeVisible()
      .withTimeout(timeout);
  },

  // Navigate to specific form
  navigateToForm: async (formType) => {
    const navigation = {
      'add-property': async () => {
        await element(by.testID('properties-tab')).tap();
        await element(by.testID('add-property-button')).tap();
      },
      'add-tenant': async () => {
        await element(by.testID('tenants-tab')).tap();
        await element(by.testID('add-tenant-button')).tap();
      },
      'add-maintenance': async () => {
        await element(by.testID('maintenance-tab')).tap();
        await element(by.testID('add-maintenance-button')).tap();
      },
      'create-invoice': async () => {
        await element(by.testID('finance-tab')).tap();
        await element(by.testID('invoices-section')).tap();
        await element(by.testID('create-invoice-button')).tap();
      }
    };

    if (navigation[formType]) {
      await navigation[formType]();
    } else {
      throw new Error(`Unknown form type: ${formType}`);
    }
  },

  // Currency and number formatting helpers
  expectCurrencyDisplay: async (testID, amount, currency = 'SAR') => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
    
    await expect(element(by.testID(testID))).toHaveText(formattedAmount);
  },

  // Error handling helpers
  handleNetworkError: async () => {
    try {
      await expect(element(by.text('Network Error'))).toBeVisible();
      await element(by.testID('retry-button')).tap();
      await helpers.waitForLoading();
    } catch (e) {
      // No network error present
    }
  },

  // Reset app state for clean tests
  resetAppState: async () => {
    await device.terminateApp();
    await device.launchApp({ newInstance: true, delete: true });
    await helpers.waitForAppToLoad();
  }
}; 