describe('Property Forms E2E Tests', () => {
  beforeEach(async () => {
    await device.launchApp({ 
      newInstance: true,
      permissions: { camera: 'YES', photos: 'YES' }
    });
    await helpers.waitForAppToLoad();
    await helpers.authenticateUser(); // Helper to log in first
  });

  afterEach(async () => {
    await device.terminateApp();
  });

  describe('Add Property Form', () => {
    beforeEach(async () => {
      // Navigate to add property screen
      await element(by.testID('properties-tab')).tap();
      await expect(element(by.testID('properties-screen'))).toBeVisible();
      await element(by.testID('add-property-button')).tap();
      await expect(element(by.testID('add-property-screen'))).toBeVisible();
    });

    it('should display all add property form elements', async () => {
      // Basic Information Section
      await expect(element(by.testID('property-title-input'))).toBeVisible();
      await expect(element(by.testID('property-description-input'))).toBeVisible();
      await expect(element(by.testID('property-type-selector'))).toBeVisible();
      
      // Location Section
      await expect(element(by.testID('address-input'))).toBeVisible();
      await expect(element(by.testID('city-input'))).toBeVisible();
      await expect(element(by.testID('country-selector'))).toBeVisible();
      await expect(element(by.testID('neighborhood-input'))).toBeVisible();
      
      // Specifications Section
      await expect(element(by.testID('area-input'))).toBeVisible();
      await expect(element(by.testID('bedrooms-input'))).toBeVisible();
      await expect(element(by.testID('bathrooms-input'))).toBeVisible();
      
      // Pricing Section
      await expect(element(by.testID('price-input'))).toBeVisible();
      await expect(element(by.testID('payment-method-selector'))).toBeVisible();
      
      // Listing Type Section
      await expect(element(by.testID('listing-type-selector'))).toBeVisible();
      
      // Submit Button
      await expect(element(by.testID('submit-property-button'))).toBeVisible();
    });

    it('should show validation errors for required fields', async () => {
      await element(by.testID('submit-property-button')).tap();
      
      // Check for validation errors
      await expect(element(by.text('Property title is required'))).toBeVisible();
      await expect(element(by.text('Property type is required'))).toBeVisible();
      await expect(element(by.text('Address is required'))).toBeVisible();
      await expect(element(by.text('City is required'))).toBeVisible();
      await expect(element(by.text('Price is required'))).toBeVisible();
    });

    it('should handle property type selection', async () => {
      await element(by.testID('property-type-selector')).tap();
      
      // Should show property type options
      await expect(element(by.testID('type-apartment'))).toBeVisible();
      await expect(element(by.testID('type-villa'))).toBeVisible();
      await expect(element(by.testID('type-office'))).toBeVisible();
      await expect(element(by.testID('type-commercial'))).toBeVisible();
      await expect(element(by.testID('type-land'))).toBeVisible();
      
      // Select apartment
      await element(by.testID('type-apartment')).tap();
      
      // Verify selection
      await expect(element(by.testID('selected-property-type'))).toHaveText('Apartment');
    });

    it('should handle country selection', async () => {
      await element(by.testID('country-selector')).tap();
      
      await expect(element(by.testID('country-saudi-arabia'))).toBeVisible();
      await expect(element(by.testID('country-uae'))).toBeVisible();
      await expect(element(by.testID('country-kuwait'))).toBeVisible();
      
      await element(by.testID('country-saudi-arabia')).tap();
      await expect(element(by.testID('selected-country'))).toHaveText('Saudi Arabia');
    });

    it('should validate numeric inputs', async () => {
      // Test area validation
      await element(by.testID('area-input')).typeText('invalid');
      await element(by.testID('submit-property-button')).tap();
      await expect(element(by.text('Area must be a valid number'))).toBeVisible();
      
      // Test bedrooms validation
      await element(by.testID('area-input')).clearText();
      await element(by.testID('area-input')).typeText('150');
      await element(by.testID('bedrooms-input')).typeText('-1');
      await element(by.testID('submit-property-button')).tap();
      await expect(element(by.text('Bedrooms must be 0 or greater'))).toBeVisible();
      
      // Test price validation
      await element(by.testID('bedrooms-input')).clearText();
      await element(by.testID('bedrooms-input')).typeText('3');
      await element(by.testID('price-input')).typeText('0');
      await element(by.testID('submit-property-button')).tap();
      await expect(element(by.text('Price must be greater than 0'))).toBeVisible();
    });

    it('should handle payment method selection', async () => {
      await element(by.testID('payment-method-selector')).tap();
      
      await expect(element(by.testID('payment-cash'))).toBeVisible();
      await expect(element(by.testID('payment-installment'))).toBeVisible();
      await expect(element(by.testID('payment-both'))).toBeVisible();
      
      await element(by.testID('payment-installment')).tap();
      await expect(element(by.testID('selected-payment-method'))).toHaveText('Installment');
    });

    it('should handle listing type selection', async () => {
      await element(by.testID('listing-type-selector')).tap();
      
      await expect(element(by.testID('listing-rent'))).toBeVisible();
      await expect(element(by.testID('listing-sale'))).toBeVisible();
      await expect(element(by.testID('listing-both'))).toBeVisible();
      
      await element(by.testID('listing-rent')).tap();
      await expect(element(by.testID('selected-listing-type'))).toHaveText('For Rent');
    });

    it('should complete full property creation flow', async () => {
      // Fill basic information
      await element(by.testID('property-title-input')).typeText('Modern Apartment in Downtown');
      await element(by.testID('property-description-input')).typeText('Beautiful 3-bedroom apartment with city view');
      
      // Select property type
      await element(by.testID('property-type-selector')).tap();
      await element(by.testID('type-apartment')).tap();
      
      // Fill location
      await element(by.testID('address-input')).typeText('123 Main Street');
      await element(by.testID('city-input')).typeText('Riyadh');
      await element(by.testID('country-selector')).tap();
      await element(by.testID('country-saudi-arabia')).tap();
      await element(by.testID('neighborhood-input')).typeText('Olaya District');
      
      // Fill specifications
      await element(by.testID('area-input')).typeText('150');
      await element(by.testID('bedrooms-input')).typeText('3');
      await element(by.testID('bathrooms-input')).typeText('2');
      
      // Fill pricing
      await element(by.testID('price-input')).typeText('500000');
      await element(by.testID('payment-method-selector')).tap();
      await element(by.testID('payment-both')).tap();
      
      // Select listing type
      await element(by.testID('listing-type-selector')).tap();
      await element(by.testID('listing-both')).tap();
      
      // Submit form
      await element(by.testID('submit-property-button')).tap();
      
      // Should show loading state
      await expect(element(by.testID('loading-indicator'))).toBeVisible();
      
      // Wait for completion and navigation
      await waitFor(element(by.testID('properties-screen')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Verify property was created
      await expect(element(by.text('Modern Apartment in Downtown'))).toBeVisible();
    });

    it('should handle form validation with mixed valid/invalid data', async () => {
      await element(by.testID('property-title-input')).typeText('Test Property');
      await element(by.testID('bedrooms-input')).typeText('invalid');
      await element(by.testID('price-input')).typeText('100000');
      
      await element(by.testID('submit-property-button')).tap();
      
      // Should show validation error for bedrooms only
      await expect(element(by.text('Bedrooms must be a valid number'))).toBeVisible();
      // Should not show errors for valid fields
      await expect(element(by.text('Property title is required'))).not.toBeVisible();
    });

    it('should save draft when navigating away', async () => {
      await element(by.testID('property-title-input')).typeText('Draft Property');
      await element(by.testID('area-input')).typeText('100');
      
      // Navigate away
      await element(by.testID('back-button')).tap();
      
      // Should show save draft dialog
      await expect(element(by.text('Save Draft?'))).toBeVisible();
      await element(by.testID('save-draft-button')).tap();
      
      // Navigate back to add property
      await element(by.testID('add-property-button')).tap();
      
      // Should restore draft
      await expect(element(by.testID('property-title-input'))).toHaveText('Draft Property');
      await expect(element(by.testID('area-input'))).toHaveText('100');
    });
  });

  describe('Property Form RTL Support', () => {
    beforeEach(async () => {
      await helpers.changeLanguage('ar');
      await helpers.waitForAppToLoad();
      await element(by.testID('properties-tab')).tap();
      await element(by.testID('add-property-button')).tap();
    });

    it('should display property form correctly in Arabic RTL', async () => {
      // Check Arabic labels
      await expect(element(by.text('عنوان العقار'))).toBeVisible(); // Property Title
      await expect(element(by.text('وصف العقار'))).toBeVisible(); // Property Description
      await expect(element(by.text('نوع العقار'))).toBeVisible(); // Property Type
      await expect(element(by.text('العنوان'))).toBeVisible(); // Address
      await expect(element(by.text('المدينة'))).toBeVisible(); // City
      await expect(element(by.text('المساحة'))).toBeVisible(); // Area
      await expect(element(by.text('السعر'))).toBeVisible(); // Price
      
      // Verify RTL layout
      await helpers.verifyRTLLayout();
    });

    it('should handle form submission in Arabic', async () => {
      await element(by.testID('property-title-input')).typeText('شقة حديثة');
      await element(by.testID('area-input')).typeText('150');
      await element(by.testID('price-input')).typeText('500000');
      
      // Form should work the same in Arabic
      await element(by.testID('submit-property-button')).tap();
      
      // Should show validation errors in Arabic
      await expect(element(by.text('نوع العقار مطلوب'))).toBeVisible(); // Property type required
    });
  });
});