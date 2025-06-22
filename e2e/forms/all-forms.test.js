describe('Complete Forms E2E Test Suite', () => {
  beforeAll(async () => {
    await device.launchApp({ 
      newInstance: true,
      permissions: { 
        camera: 'YES', 
        photos: 'YES', 
        notifications: 'YES' 
      }
    });
    await helpers.waitForAppToLoad();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Authentication Flow', () => {
    it('should complete full user registration and login flow', async () => {
      // Navigate to signup
      await element(by.testID('signup-link')).tap();
      await expect(element(by.testID('signup-screen'))).toBeVisible();
      
      // Fill registration form
      await helpers.fillForm({
        'first-name-input': 'Test',
        'last-name-input': 'User',
        'email-input': 'testuser@example.com',
        'password-input': 'TestPassword123!',
        'confirm-password-input': 'TestPassword123!',
      });
      
      // Select role
      await helpers.selectOption('role-selector', 'role-owner');
      
      // Accept terms
      await element(by.testID('terms-checkbox')).tap();
      
      // Submit registration
      await element(by.testID('signup-button')).tap();
      await helpers.waitForLoading();
      
      // Should be logged in and on dashboard
      await expect(element(by.testID('dashboard-screen'))).toBeVisible();
    });
  });

  describe('Property Management Flow', () => {
    beforeEach(async () => {
      await helpers.authenticateUser('owner');
    });

    it('should create a property end-to-end', async () => {
      await helpers.navigateToForm('add-property');
      
      // Fill property form
      await helpers.fillForm({
        'property-title-input': 'E2E Test Property',
        'property-description-input': 'This is a test property created during E2E testing',
        'address-input': '123 Test Street',
        'city-input': 'Test City',
        'neighborhood-input': 'Test District',
        'area-input': '120',
        'bedrooms-input': '2',
        'bathrooms-input': '2',
        'price-input': '350000'
      });
      
      // Select property type
      await helpers.selectOption('property-type-selector', 'type-apartment');
      
      // Select country
      await helpers.selectOption('country-selector', 'country-saudi-arabia');
      
      // Select payment method
      await helpers.selectOption('payment-method-selector', 'payment-both');
      
      // Select listing type
      await helpers.selectOption('listing-type-selector', 'listing-both');
      
      // Submit property
      await element(by.testID('submit-property-button')).tap();
      await helpers.waitForLoading();
      
      // Verify property was created
      await expect(element(by.testID('properties-screen'))).toBeVisible();
      await expect(element(by.text('E2E Test Property'))).toBeVisible();
    });
  });

  describe('Tenant Management Flow', () => {
    beforeEach(async () => {
      await helpers.authenticateUser('owner');
    });

    it('should assign tenant to property end-to-end', async () => {
      await helpers.navigateToForm('add-tenant');
      
      // Select tenant
      await helpers.selectOption('tenant-selector', 'tenant-john-doe');
      
      // Select property
      await helpers.selectOption('property-selector', 'property-apartment-downtown');
      
      // Set dates
      await helpers.selectDate('start-date-picker', '2024-01-01');
      await helpers.selectDate('end-date-picker', '2024-12-31');
      
      // Fill financial details
      await helpers.fillForm({
        'rent-amount-input': '2500',
        'security-deposit-input': '5000',
        'payment-due-day-input': '5'
      });
      
      // Select payment frequency
      await helpers.selectOption('payment-frequency-selector', 'frequency-monthly');
      
      // Set additional terms
      await element(by.testID('utilities-included-toggle')).tap();
      
      // Submit assignment
      await element(by.testID('assign-tenant-button')).tap();
      await helpers.waitForLoading();
      
      // Verify assignment was created
      await expect(element(by.testID('tenants-screen'))).toBeVisible();
      await expect(element(by.text('John Doe - Modern Apartment Downtown'))).toBeVisible();
    });
  });

  describe('Maintenance Request Flow', () => {
    beforeEach(async () => {
      await helpers.authenticateUser('tenant');
    });

    it('should create maintenance request with photos end-to-end', async () => {
      await helpers.navigateToForm('add-maintenance');
      
      // Fill request details
      await helpers.fillForm({
        'request-title-input': 'E2E Test Maintenance Request',
        'request-description-input': 'This is a test maintenance request created during E2E testing to verify the complete flow works correctly.',
        'access-instructions-input': 'Use the main entrance. Ring doorbell twice.'
      });
      
      // Select priority
      await helpers.selectOption('priority-selector', 'priority-high');
      
      // Select property
      await helpers.selectOption('property-selector', 'property-apartment-downtown');
      
      // Select category
      await helpers.selectOption('category-selector', 'category-plumbing');
      
      // Add photos
      await helpers.addMockPhoto();
      await helpers.addMockPhoto();
      
      // Set preferred schedule
      await helpers.selectDate('preferred-date-picker', 'tomorrow');
      await helpers.selectOption('preferred-time-selector', 'time-morning');
      
      // Set tenant presence
      await element(by.testID('tenant-present-toggle')).tap();
      
      // Submit request
      await element(by.testID('submit-maintenance-button')).tap();
      await helpers.waitForLoading();
      
      // Verify request was created
      await expect(element(by.testID('maintenance-screen'))).toBeVisible();
      await expect(element(by.text('E2E Test Maintenance Request'))).toBeVisible();
      await expect(element(by.testID('priority-indicator-high'))).toBeVisible();
    });
  });

  describe('Financial Management Flow', () => {
    beforeEach(async () => {
      await helpers.authenticateUser('owner');
    });

    it('should create invoice with multiple line items end-to-end', async () => {
      await helpers.navigateToForm('create-invoice');
      
      // Select customer
      await helpers.selectOption('customer-selector', 'customer-john-doe');
      
      // Select property
      await helpers.selectOption('property-selector', 'property-apartment-downtown');
      
      // Set dates
      await helpers.selectDate('invoice-date-picker', 'today');
      
      // Add line items
      await element(by.testID('add-line-item-button')).tap();
      await helpers.fillForm({
        'item-description-0': 'Monthly Rent - January 2024',
        'item-quantity-0': '1',
        'item-unit-price-0': '2500'
      });
      
      await element(by.testID('add-line-item-button')).tap();
      await helpers.fillForm({
        'item-description-1': 'Maintenance Fee',
        'item-quantity-1': '1',
        'item-unit-price-1': '200'
      });
      
      // Set VAT
      await helpers.selectOption('vat-rate-selector', 'vat-15');
      
      // Set payment terms
      await helpers.selectOption('payment-terms-selector', 'terms-net-30');
      
      // Add notes
      await element(by.testID('notes-input')).typeText('Payment due within 30 days. Thank you for your business.');
      
      // Create invoice
      await element(by.testID('create-invoice-button')).tap();
      await helpers.waitForLoading();
      
      // Verify invoice was created
      await expect(element(by.testID('invoice-created-success'))).toBeVisible();
      await expect(element(by.text('Invoice Created Successfully'))).toBeVisible();
      
      // Verify total calculation
      await helpers.expectCurrencyDisplay('total-amount', 3105); // (2500 + 200) * 1.15
    });

    it('should create receipt voucher end-to-end', async () => {
      // Navigate to receipt voucher form
      await element(by.testID('finance-tab')).tap();
      await element(by.testID('vouchers-section')).tap();
      await element(by.testID('create-receipt-voucher')).tap();
      
      // Fill voucher details
      await element(by.testID('amount-input')).typeText('2500');
      await element(by.testID('description-input')).typeText('Monthly rent payment received from John Doe');
      
      // Select accounts
      await helpers.selectOption('revenue-account-selector', 'account-rental-income');
      await helpers.selectOption('deposit-account-selector', 'account-bank-checking');
      
      // Select property and tenant
      await helpers.selectOption('property-selector', 'property-apartment-downtown');
      await helpers.selectOption('tenant-selector', 'tenant-john-doe');
      
      // Select payment method
      await helpers.selectOption('payment-method-selector', 'method-bank-transfer');
      await element(by.testID('reference-number-input')).typeText('TXN-20240101-001');
      
      // Select cost center
      await helpers.selectOption('cost-center-selector', 'cost-center-property-1');
      
      // Create receipt
      await element(by.testID('create-receipt-button')).tap();
      await helpers.waitForLoading();
      
      // Verify receipt was created
      await expect(element(by.text('Receipt Created Successfully'))).toBeVisible();
    });
  });

  describe('Cross-Platform RTL Testing', () => {
    beforeEach(async () => {
      await helpers.changeLanguage('ar');
      await helpers.waitForAppToLoad();
      await helpers.authenticateUser('owner');
    });

    it('should handle all forms correctly in Arabic RTL', async () => {
      // Test property form in Arabic
      await helpers.navigateToForm('add-property');
      await expect(element(by.text('إضافة عقار جديد'))).toBeVisible(); // Add New Property
      await helpers.verifyRTLLayout();
      
      // Fill some fields to test RTL text input
      await element(by.testID('property-title-input')).typeText('عقار تجريبي');
      await element(by.testID('property-description-input')).typeText('هذا عقار تجريبي لاختبار النظام');
      
      // Verify RTL text alignment
      await expect(element(by.testID('property-title-input'))).toHaveTextAlignment('right');
      
      // Navigate back and test another form
      await element(by.testID('back-button')).tap();
      
      // Test maintenance form in Arabic
      await helpers.navigateToForm('add-maintenance');
      await expect(element(by.text('طلب صيانة جديد'))).toBeVisible(); // New Maintenance Request
      await helpers.verifyRTLLayout();
      
      // Fill Arabic text
      await element(by.testID('request-title-input')).typeText('مشكلة في السباكة');
      await element(by.testID('request-description-input')).typeText('يوجد تسريب في الحمام ويحتاج إلى إصلاح عاجل');
      
      // Test form navigation
      await element(by.testID('back-button')).tap();
      await helpers.navigateToForm('create-invoice');
      await expect(element(by.text('إنشاء فاتورة جديدة'))).toBeVisible(); // Create New Invoice
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      await helpers.authenticateUser('owner');
    });

    it('should handle network errors gracefully', async () => {
      await helpers.navigateToForm('add-property');
      
      // Fill form
      await helpers.fillForm({
        'property-title-input': 'Network Test Property',
        'address-input': '123 Network Street'
      });
      
      // Simulate network error during submission
      await device.setNetworkConnection(false);
      await element(by.testID('submit-property-button')).tap();
      
      // Should show network error
      await expect(element(by.text('Network Error'))).toBeVisible();
      
      // Restore connection and retry
      await device.setNetworkConnection(true);
      await element(by.testID('retry-button')).tap();
      
      // Should eventually succeed
      await helpers.waitForLoading();
    });

    it('should handle form validation across all forms', async () => {
      // Test property form validation
      await helpers.navigateToForm('add-property');
      await element(by.testID('submit-property-button')).tap();
      await helpers.expectValidationError('Property title is required');
      
      // Test maintenance form validation
      await element(by.testID('back-button')).tap();
      await helpers.navigateToForm('add-maintenance');
      await element(by.testID('submit-maintenance-button')).tap();
      await helpers.expectValidationError('Request title is required');
      
      // Test invoice form validation
      await element(by.testID('back-button')).tap();
      await helpers.navigateToForm('create-invoice');
      await element(by.testID('create-invoice-button')).tap();
      await helpers.expectValidationError('Please select a customer');
    });

    it('should handle draft saving across forms', async () => {
      // Test property draft saving
      await helpers.navigateToForm('add-property');
      await element(by.testID('property-title-input')).typeText('Draft Property');
      await element(by.testID('back-button')).tap();
      await element(by.testID('save-draft-button')).tap();
      
      // Restore draft
      await helpers.navigateToForm('add-property');
      await element(by.testID('restore-draft-button')).tap();
      await expect(element(by.testID('property-title-input'))).toHaveText('Draft Property');
      
      // Test maintenance draft saving
      await element(by.testID('back-button')).tap();
      await helpers.navigateToForm('add-maintenance');
      await element(by.testID('request-title-input')).typeText('Draft Maintenance');
      await element(by.testID('back-button')).tap();
      await element(by.testID('save-draft-button')).tap();
    });
  });

  describe('Performance and Load Testing', () => {
    beforeEach(async () => {
      await helpers.authenticateUser('owner');
    });

    it('should handle rapid form navigation without crashes', async () => {
      // Rapidly navigate between forms
      for (let i = 0; i < 5; i++) {
        await helpers.navigateToForm('add-property');
        await expect(element(by.testID('add-property-screen'))).toBeVisible();
        
        await element(by.testID('back-button')).tap();
        await helpers.navigateToForm('add-maintenance');
        await expect(element(by.testID('add-maintenance-screen'))).toBeVisible();
        
        await element(by.testID('back-button')).tap();
        await helpers.navigateToForm('create-invoice');
        await expect(element(by.testID('create-invoice-screen'))).toBeVisible();
        
        await element(by.testID('back-button')).tap();
      }
    });

    it('should handle large form data without performance issues', async () => {
      await helpers.navigateToForm('add-maintenance');
      
      // Fill with large description
      const largeDescription = 'This is a very long description that tests the performance of the form when handling large amounts of text. '.repeat(10);
      
      await element(by.testID('request-description-input')).typeText(largeDescription);
      
      // Add maximum photos
      for (let i = 0; i < 5; i++) {
        await helpers.addMockPhoto();
      }
      
      // Form should still be responsive
      await element(by.testID('priority-selector')).tap();
      await element(by.testID('priority-high')).tap();
      
      // Should be able to scroll and interact
      await element(by.testID('submit-maintenance-button')).tap();
    });
  });
});