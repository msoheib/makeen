describe('Tenant Forms E2E Tests', () => {
  beforeEach(async () => {
    await device.launchApp({ 
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
    await helpers.waitForAppToLoad();
    await helpers.authenticateUser(); // Helper to log in first
  });

  afterEach(async () => {
    await device.terminateApp();
  });

  describe('Add Tenant Form', () => {
    beforeEach(async () => {
      // Navigate to tenants and add new tenant
      await element(by.testID('tenants-tab')).tap();
      await expect(element(by.testID('tenants-screen'))).toBeVisible();
      await element(by.testID('add-tenant-button')).tap();
      await expect(element(by.testID('add-tenant-screen'))).toBeVisible();
    });

    it('should display all add tenant form elements', async () => {
      // Tenant Selection Section
      await expect(element(by.testID('tenant-selector'))).toBeVisible();
      
      // Property Selection Section
      await expect(element(by.testID('property-selector'))).toBeVisible();
      
      // Contract Details Section
      await expect(element(by.testID('start-date-picker'))).toBeVisible();
      await expect(element(by.testID('end-date-picker'))).toBeVisible();
      await expect(element(by.testID('rent-amount-input'))).toBeVisible();
      await expect(element(by.testID('security-deposit-input'))).toBeVisible();
      
      // Payment Terms Section
      await expect(element(by.testID('payment-frequency-selector'))).toBeVisible();
      await expect(element(by.testID('payment-due-day-input'))).toBeVisible();
      
      // Additional Terms
      await expect(element(by.testID('utilities-included-toggle'))).toBeVisible();
      await expect(element(by.testID('pets-allowed-toggle'))).toBeVisible();
      
      // Submit Button
      await expect(element(by.testID('assign-tenant-button'))).toBeVisible();
    });

    it('should show validation errors for required fields', async () => {
      await element(by.testID('assign-tenant-button')).tap();
      
      await expect(element(by.text('Please select a tenant'))).toBeVisible();
      await expect(element(by.text('Please select a property'))).toBeVisible();
      await expect(element(by.text('Start date is required'))).toBeVisible();
      await expect(element(by.text('End date is required'))).toBeVisible();
      await expect(element(by.text('Rent amount is required'))).toBeVisible();
    });

    it('should handle tenant selection', async () => {
      await element(by.testID('tenant-selector')).tap();
      
      // Should show available tenants
      await expect(element(by.testID('tenant-list'))).toBeVisible();
      await expect(element(by.testID('tenant-john-doe'))).toBeVisible();
      await expect(element(by.testID('tenant-jane-smith'))).toBeVisible();
      
      // Select a tenant
      await element(by.testID('tenant-john-doe')).tap();
      
      // Verify selection
      await expect(element(by.testID('selected-tenant'))).toHaveText('John Doe');
      
      // Should show tenant details
      await expect(element(by.testID('tenant-email'))).toBeVisible();
      await expect(element(by.testID('tenant-phone'))).toBeVisible();
    });

    it('should handle property selection', async () => {
      await element(by.testID('property-selector')).tap();
      
      // Should show available properties
      await expect(element(by.testID('property-list'))).toBeVisible();
      await expect(element(by.testID('property-apartment-downtown'))).toBeVisible();
      await expect(element(by.testID('property-villa-suburbs'))).toBeVisible();
      
      // Select a property
      await element(by.testID('property-apartment-downtown')).tap();
      
      // Verify selection
      await expect(element(by.testID('selected-property'))).toHaveText('Modern Apartment Downtown');
      
      // Should show property details
      await expect(element(by.testID('property-address'))).toBeVisible();
      await expect(element(by.testID('property-bedrooms'))).toBeVisible();
    });

    it('should handle date selection', async () => {
      // Test start date picker
      await element(by.testID('start-date-picker')).tap();
      await expect(element(by.testID('date-picker-modal'))).toBeVisible();
      
      // Select a date
      await element(by.testID('date-confirm')).tap();
      await expect(element(by.testID('selected-start-date'))).toBeVisible();
      
      // Test end date picker
      await element(by.testID('end-date-picker')).tap();
      await expect(element(by.testID('date-picker-modal'))).toBeVisible();
      await element(by.testID('date-confirm')).tap();
      await expect(element(by.testID('selected-end-date'))).toBeVisible();
    });

    it('should validate date ranges', async () => {
      // Set end date before start date
      await element(by.testID('start-date-picker')).tap();
      await element(by.testID('date-2024-12-01')).tap();
      await element(by.testID('date-confirm')).tap();
      
      await element(by.testID('end-date-picker')).tap();
      await element(by.testID('date-2024-11-01')).tap();
      await element(by.testID('date-confirm')).tap();
      
      await element(by.testID('assign-tenant-button')).tap();
      
      await expect(element(by.text('End date must be after start date'))).toBeVisible();
    });

    it('should validate numeric inputs', async () => {
      // Test invalid rent amount
      await element(by.testID('rent-amount-input')).typeText('invalid');
      await element(by.testID('assign-tenant-button')).tap();
      await expect(element(by.text('Rent amount must be a valid number'))).toBeVisible();
      
      // Test negative rent amount
      await element(by.testID('rent-amount-input')).clearText();
      await element(by.testID('rent-amount-input')).typeText('-1000');
      await element(by.testID('assign-tenant-button')).tap();
      await expect(element(by.text('Rent amount must be greater than 0'))).toBeVisible();
      
      // Test zero security deposit (should be valid)
      await element(by.testID('rent-amount-input')).clearText();
      await element(by.testID('rent-amount-input')).typeText('2000');
      await element(by.testID('security-deposit-input')).typeText('0');
      // No error should appear for zero security deposit
    });

    it('should handle payment frequency selection', async () => {
      await element(by.testID('payment-frequency-selector')).tap();
      
      await expect(element(by.testID('frequency-monthly'))).toBeVisible();
      await expect(element(by.testID('frequency-quarterly'))).toBeVisible();
      await expect(element(by.testID('frequency-biannual'))).toBeVisible();
      await expect(element(by.testID('frequency-annual'))).toBeVisible();
      
      await element(by.testID('frequency-monthly')).tap();
      await expect(element(by.testID('selected-frequency'))).toHaveText('Monthly');
    });

    it('should handle toggle switches', async () => {
      // Test utilities included toggle
      await expect(element(by.testID('utilities-included-toggle'))).toHaveValue('false');
      await element(by.testID('utilities-included-toggle')).tap();
      await expect(element(by.testID('utilities-included-toggle'))).toHaveValue('true');
      
      // Test pets allowed toggle
      await expect(element(by.testID('pets-allowed-toggle'))).toHaveValue('false');
      await element(by.testID('pets-allowed-toggle')).tap();
      await expect(element(by.testID('pets-allowed-toggle'))).toHaveValue('true');
    });

    it('should complete full tenant assignment flow', async () => {
      // Select tenant
      await element(by.testID('tenant-selector')).tap();
      await element(by.testID('tenant-john-doe')).tap();
      
      // Select property
      await element(by.testID('property-selector')).tap();
      await element(by.testID('property-apartment-downtown')).tap();
      
      // Set dates
      await element(by.testID('start-date-picker')).tap();
      await element(by.testID('date-2024-01-01')).tap();
      await element(by.testID('date-confirm')).tap();
      
      await element(by.testID('end-date-picker')).tap();
      await element(by.testID('date-2024-12-31')).tap();
      await element(by.testID('date-confirm')).tap();
      
      // Set financial terms
      await element(by.testID('rent-amount-input')).typeText('2500');
      await element(by.testID('security-deposit-input')).typeText('5000');
      
      // Set payment frequency
      await element(by.testID('payment-frequency-selector')).tap();
      await element(by.testID('frequency-monthly')).tap();
      
      await element(by.testID('payment-due-day-input')).typeText('5');
      
      // Set additional terms
      await element(by.testID('utilities-included-toggle')).tap();
      
      // Submit form
      await element(by.testID('assign-tenant-button')).tap();
      
      // Should show loading state
      await expect(element(by.testID('loading-indicator'))).toBeVisible();
      
      // Wait for completion
      await waitFor(element(by.testID('tenants-screen')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Verify assignment was created
      await expect(element(by.text('John Doe - Modern Apartment Downtown'))).toBeVisible();
    });

    it('should calculate security deposit automatically', async () => {
      await element(by.testID('rent-amount-input')).typeText('2000');
      
      // Should auto-calculate security deposit as 2x rent
      await expect(element(by.testID('security-deposit-input'))).toHaveText('4000');
      
      // User should be able to override
      await element(by.testID('security-deposit-input')).clearText();
      await element(by.testID('security-deposit-input')).typeText('3000');
      await expect(element(by.testID('security-deposit-input'))).toHaveText('3000');
    });
  });

  describe('Edit Tenant Form', () => {
    beforeEach(async () => {
      // Navigate to tenant details and edit
      await element(by.testID('tenants-tab')).tap();
      await element(by.testID('tenant-john-doe')).tap();
      await expect(element(by.testID('tenant-details-screen'))).toBeVisible();
      await element(by.testID('edit-tenant-button')).tap();
      await expect(element(by.testID('edit-tenant-screen'))).toBeVisible();
    });

    it('should display all edit tenant form elements', async () => {
      // Personal Information
      await expect(element(by.testID('first-name-input'))).toBeVisible();
      await expect(element(by.testID('last-name-input'))).toBeVisible();
      await expect(element(by.testID('email-input'))).toBeVisible();
      await expect(element(by.testID('phone-input'))).toBeVisible();
      
      // Address Information
      await expect(element(by.testID('address-input'))).toBeVisible();
      await expect(element(by.testID('city-input'))).toBeVisible();
      await expect(element(by.testID('country-selector'))).toBeVisible();
      
      // Status Management
      await expect(element(by.testID('status-selector'))).toBeVisible();
      await expect(element(by.testID('foreign-tenant-toggle'))).toBeVisible();
      
      // Emergency Contact
      await expect(element(by.testID('emergency-contact-name-input'))).toBeVisible();
      await expect(element(by.testID('emergency-contact-phone-input'))).toBeVisible();
      
      // Update Button
      await expect(element(by.testID('update-tenant-button'))).toBeVisible();
    });

    it('should pre-populate form with existing data', async () => {
      await expect(element(by.testID('first-name-input'))).toHaveText('John');
      await expect(element(by.testID('last-name-input'))).toHaveText('Doe');
      await expect(element(by.testID('email-input'))).toHaveText('john.doe@example.com');
      await expect(element(by.testID('phone-input'))).toHaveText('+966501234567');
    });

    it('should handle status updates', async () => {
      await element(by.testID('status-selector')).tap();
      
      await expect(element(by.testID('status-active'))).toBeVisible();
      await expect(element(by.testID('status-inactive'))).toBeVisible();
      await expect(element(by.testID('status-suspended'))).toBeVisible();
      
      await element(by.testID('status-suspended')).tap();
      await expect(element(by.testID('selected-status'))).toHaveText('Suspended');
    });

    it('should detect and save changes', async () => {
      // Make a change
      await element(by.testID('phone-input')).clearText();
      await element(by.testID('phone-input')).typeText('+966507654321');
      
      // Should show unsaved changes indicator
      await expect(element(by.testID('unsaved-changes-indicator'))).toBeVisible();
      
      // Save changes
      await element(by.testID('update-tenant-button')).tap();
      
      // Should show loading state
      await expect(element(by.testID('loading-indicator'))).toBeVisible();
      
      // Wait for completion
      await waitFor(element(by.testID('tenant-details-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Verify changes were saved
      await expect(element(by.text('+966507654321'))).toBeVisible();
    });

    it('should handle foreign tenant designation', async () => {
      await expect(element(by.testID('foreign-tenant-toggle'))).toHaveValue('false');
      
      await element(by.testID('foreign-tenant-toggle')).tap();
      await expect(element(by.testID('foreign-tenant-toggle'))).toHaveValue('true');
      
      // Should show additional fields for foreign tenant
      await expect(element(by.testID('passport-number-input'))).toBeVisible();
      await expect(element(by.testID('visa-expiry-date-picker'))).toBeVisible();
      await expect(element(by.testID('nationality-selector'))).toBeVisible();
    });
  });

  describe('Tenant Forms RTL Support', () => {
    beforeEach(async () => {
      await helpers.changeLanguage('ar');
      await helpers.waitForAppToLoad();
      await element(by.testID('tenants-tab')).tap();
      await element(by.testID('add-tenant-button')).tap();
    });

    it('should display tenant form correctly in Arabic RTL', async () => {
      // Check Arabic labels
      await expect(element(by.text('اختيار المستأجر'))).toBeVisible(); // Select Tenant
      await expect(element(by.text('اختيار العقار'))).toBeVisible(); // Select Property
      await expect(element(by.text('تاريخ البدء'))).toBeVisible(); // Start Date
      await expect(element(by.text('تاريخ الانتهاء'))).toBeVisible(); // End Date
      await expect(element(by.text('مبلغ الإيجار'))).toBeVisible(); // Rent Amount
      await expect(element(by.text('التأمين'))).toBeVisible(); // Security Deposit
      
      // Verify RTL layout
      await helpers.verifyRTLLayout();
    });

    it('should handle form validation in Arabic', async () => {
      await element(by.testID('assign-tenant-button')).tap();
      
      // Should show Arabic validation messages
      await expect(element(by.text('يرجى اختيار مستأجر'))).toBeVisible(); // Please select tenant
      await expect(element(by.text('يرجى اختيار عقار'))).toBeVisible(); // Please select property
    });
  });
});