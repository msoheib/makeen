describe('RTL Layout Tests', () => {
  beforeEach(async () => {
    await device.launchApp({ 
      newInstance: true,
      languageAndLocale: {
        language: 'en',
        locale: 'en_US'
      }
    });
    await helpers.waitForAppToLoad();
  });

  afterEach(async () => {
    await device.terminateApp();
  });

  it('should start with English (LTR) layout by default', async () => {
    // Verify the app loads in English
    await expect(element(by.text('Dashboard'))).toBeVisible();
    await expect(element(by.text('Properties'))).toBeVisible();
    
    // Verify LTR layout
    await helpers.verifyLTRLayout();
  });

  it('should switch to Arabic (RTL) and reload the app', async () => {
    // Navigate to language settings
    await element(by.testID('settings-tab')).tap();
    await expect(element(by.text('Settings'))).toBeVisible();
    
    await element(by.testID('language-setting')).tap();
    await expect(element(by.text('Language'))).toBeVisible();
    
    // Switch to Arabic
    await element(by.testID('language-ar')).tap();
    
    // The app should reload automatically. Wait for the reload to complete.
    await helpers.waitForAppToLoad();
    
    // Verify the app is now in Arabic
    await expect(element(by.text('لوحة التحكم'))).toBeVisible(); // Dashboard in Arabic
    await expect(element(by.text('العقارات'))).toBeVisible(); // Properties in Arabic
    
    // Verify RTL layout
    await helpers.verifyRTLLayout();
  });

  it('should switch back to English (LTR) from Arabic', async () => {
    // First switch to Arabic
    await helpers.changeLanguage('ar');
    await helpers.waitForAppToLoad();
    
    // Verify we're in Arabic
    await expect(element(by.text('لوحة التحكم'))).toBeVisible();
    
    // Switch back to English
    await element(by.testID('settings-tab')).tap();
    await element(by.testID('language-setting')).tap();
    await element(by.testID('language-en')).tap();
    
    // Wait for reload
    await helpers.waitForAppToLoad();
    
    // Verify we're back in English
    await expect(element(by.text('Dashboard'))).toBeVisible();
    await expect(element(by.text('Properties'))).toBeVisible();
    
    // Verify LTR layout
    await helpers.verifyLTRLayout();
  });

  it('should persist language choice across app restarts', async () => {
    // Switch to Arabic
    await helpers.changeLanguage('ar');
    await helpers.waitForAppToLoad();
    
    // Verify Arabic
    await expect(element(by.text('لوحة التحكم'))).toBeVisible();
    
    // Restart the app
    await device.terminateApp();
    await device.launchApp({ newInstance: false }); // Don't reset, keep storage
    await helpers.waitForAppToLoad();
    
    // Verify the app still loads in Arabic
    await expect(element(by.text('لوحة التحكم'))).toBeVisible();
    await helpers.verifyRTLLayout();
  });

  it('should handle rapid language switching without crashes', async () => {
    // Switch between languages multiple times quickly
    for (let i = 0; i < 3; i++) {
      await helpers.changeLanguage('ar');
      await helpers.waitForAppToLoad();
      await expect(element(by.text('لوحة التحكم'))).toBeVisible();
      
      await helpers.changeLanguage('en');
      await helpers.waitForAppToLoad();
      await expect(element(by.text('Dashboard'))).toBeVisible();
    }
  });

  it('should display navigation elements correctly in RTL', async () => {
    await helpers.changeLanguage('ar');
    await helpers.waitForAppToLoad();
    
    // Open navigation drawer
    await element(by.testID('hamburger-menu')).tap();
    await expect(element(by.testID('navigation-drawer'))).toBeVisible();
    
    // Verify Arabic navigation items
    await expect(element(by.text('الرئيسية'))).toBeVisible(); // Home
    await expect(element(by.text('المالكون والعملاء'))).toBeVisible(); // Owners & Customers
    await expect(element(by.text('إدارة العقارات'))).toBeVisible(); // Property Management
    
    // Verify proper RTL alignment of menu items
    await helpers.verifyRTLLayout();
  });
}); 