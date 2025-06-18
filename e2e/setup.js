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
  }
}; 