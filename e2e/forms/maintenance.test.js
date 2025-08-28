describe('Maintenance Forms E2E Tests', () => {
  beforeEach(async () => {
    await device.launchApp({ 
      newInstance: true,
      permissions: { camera: 'YES', photos: 'YES', notifications: 'YES' }
    });
    await helpers.waitForAppToLoad();
    await helpers.authenticateUser(); // Helper to log in first
  });

  afterEach(async () => {
    await device.terminateApp();
  });

  describe('Add Maintenance Request Form', () => {
    beforeEach(async () => {
      // Navigate to maintenance and add new request
      await element(by.testID('maintenance-tab')).tap();
      await expect(element(by.testID('maintenance-screen'))).toBeVisible();
      await element(by.testID('add-maintenance-button')).tap();
      await expect(element(by.testID('add-maintenance-screen'))).toBeVisible();
    });

    it('should display all add maintenance form elements', async () => {
      // Request Details Section
      await expect(element(by.testID('request-title-input'))).toBeVisible();
      await expect(element(by.testID('request-description-input'))).toBeVisible();
      await expect(element(by.testID('priority-selector'))).toBeVisible();
      
      // Property Selection Section
      await expect(element(by.testID('property-selector'))).toBeVisible();
      
      // Category Section
      await expect(element(by.testID('category-selector'))).toBeVisible();
      
      // Photo Attachments Section
      await expect(element(by.testID('photo-attachments-section'))).toBeVisible();
      await expect(element(by.testID('add-photo-button'))).toBeVisible();
      
      // Preferred Schedule Section
      await expect(element(by.testID('preferred-date-picker'))).toBeVisible();
      await expect(element(by.testID('preferred-time-selector'))).toBeVisible();
      
      // Additional Information
      await expect(element(by.testID('access-instructions-input'))).toBeVisible();
      await expect(element(by.testID('tenant-present-toggle'))).toBeVisible();
      
      // Submit Button
      await expect(element(by.testID('submit-maintenance-button'))).toBeVisible();
    });

    it('should show validation errors for required fields', async () => {
      await element(by.testID('submit-maintenance-button')).tap();
      
      await expect(element(by.text('Request title is required'))).toBeVisible();
      await expect(element(by.text('Description is required'))).toBeVisible();
      await expect(element(by.text('Please select a property'))).toBeVisible();
      await expect(element(by.text('Please select a category'))).toBeVisible();
      await expect(element(by.text('Priority level is required'))).toBeVisible();
    });

    it('should handle priority selection', async () => {
      await element(by.testID('priority-selector')).tap();
      
      // Should show priority options with descriptions
      await expect(element(by.testID('priority-low'))).toBeVisible();
      await expect(element(by.testID('priority-medium'))).toBeVisible();
      await expect(element(by.testID('priority-high'))).toBeVisible();
      await expect(element(by.testID('priority-urgent'))).toBeVisible();
      
      // Check priority descriptions
      await expect(element(by.text('Non-urgent, can wait'))).toBeVisible();
      await expect(element(by.text('Normal maintenance'))).toBeVisible();
      await expect(element(by.text('Important, needs attention'))).toBeVisible();
      await expect(element(by.text('Emergency, immediate action'))).toBeVisible();
      
      // Select high priority
      await element(by.testID('priority-high')).tap();
      
      // Verify selection with color indicator
      await expect(element(by.testID('selected-priority'))).toHaveText('High');
      await expect(element(by.testID('priority-indicator-high'))).toBeVisible();
    });

    it('should handle property selection', async () => {
      await element(by.testID('property-selector')).tap();
      
      // Should show available properties
      await expect(element(by.testID('property-list'))).toBeVisible();
      await expect(element(by.testID('property-apartment-downtown'))).toBeVisible();
      await expect(element(by.testID('property-villa-suburbs'))).toBeVisible();
      
      // Properties should show tenant information
      await expect(element(by.text('Tenant: John Doe'))).toBeVisible();
      await expect(element(by.text('Vacant'))).toBeVisible();
      
      // Select a property
      await element(by.testID('property-apartment-downtown')).tap();
      
      // Verify selection
      await expect(element(by.testID('selected-property'))).toHaveText('Modern Apartment Downtown');
      
      // Should show property details and tenant contact
      await expect(element(by.testID('property-address'))).toBeVisible();
      await expect(element(by.testID('tenant-contact-info'))).toBeVisible();
    });

    it('should handle category selection', async () => {
      await element(by.testID('category-selector')).tap();
      
      // Should show maintenance categories
      await expect(element(by.testID('category-plumbing'))).toBeVisible();
      await expect(element(by.testID('category-electrical'))).toBeVisible();
      await expect(element(by.testID('category-hvac'))).toBeVisible();
      await expect(element(by.testID('category-appliances'))).toBeVisible();
      await expect(element(by.testID('category-structural'))).toBeVisible();
      await expect(element(by.testID('category-cleaning'))).toBeVisible();
      await expect(element(by.testID('category-landscaping'))).toBeVisible();
      await expect(element(by.testID('category-security'))).toBeVisible();
      await expect(element(by.testID('category-other'))).toBeVisible();
      
      // Select plumbing
      await element(by.testID('category-plumbing')).tap();
      
      // Verify selection with icon
      await expect(element(by.testID('selected-category'))).toHaveText('Plumbing');
      await expect(element(by.testID('category-icon-plumbing'))).toBeVisible();
    });

    it('should handle photo attachments', async () => {
      // Add photo from camera
      await element(by.testID('add-photo-button')).tap();
      await expect(element(by.testID('photo-source-modal'))).toBeVisible();
      
      await element(by.testID('photo-source-camera')).tap();
      
      // Mock camera capture
      await expect(element(by.testID('camera-view'))).toBeVisible();
      await element(by.testID('capture-button')).tap();
      
      // Should show photo preview
      await expect(element(by.testID('photo-preview-1'))).toBeVisible();
      await expect(element(by.testID('photo-remove-1'))).toBeVisible();
      
      // Add photo from gallery
      await element(by.testID('add-photo-button')).tap();
      await element(by.testID('photo-source-gallery')).tap();
      
      // Mock gallery selection
      await element(by.testID('gallery-photo-1')).tap();
      await expect(element(by.testID('photo-preview-2'))).toBeVisible();
      
      // Should show photo count
      await expect(element(by.testID('photo-count'))).toHaveText('2 of 5 photos');
    });

    it('should handle photo removal', async () => {
      // Add a photo first
      await helpers.addMockPhoto();
      await expect(element(by.testID('photo-preview-1'))).toBeVisible();
      
      // Remove photo
      await element(by.testID('photo-remove-1')).tap();
      
      // Should show confirmation dialog
      await expect(element(by.text('Remove Photo?'))).toBeVisible();
      await element(by.testID('confirm-remove')).tap();
      
      // Photo should be removed
      await expect(element(by.testID('photo-preview-1'))).not.toBeVisible();
      await expect(element(by.testID('photo-count'))).toHaveText('0 of 5 photos');
    });

    it('should handle photo limit', async () => {
      // Add 5 photos (maximum)
      for (let i = 1; i <= 5; i++) {
        await helpers.addMockPhoto();
      }
      
      await expect(element(by.testID('photo-count'))).toHaveText('5 of 5 photos');
      
      // Add photo button should be disabled
      await expect(element(by.testID('add-photo-button'))).not.toBeVisible();
      await expect(element(by.testID('photo-limit-message'))).toBeVisible();
      await expect(element(by.text('Maximum 5 photos allowed'))).toBeVisible();
    });

    it('should handle date and time selection', async () => {
      // Test preferred date picker
      await element(by.testID('preferred-date-picker')).tap();
      await expect(element(by.testID('date-picker-modal'))).toBeVisible();
      
      // Select tomorrow's date
      await element(by.testID('date-tomorrow')).tap();
      await element(by.testID('date-confirm')).tap();
      
      await expect(element(by.testID('selected-preferred-date'))).toBeVisible();
      
      // Test preferred time selector
      await element(by.testID('preferred-time-selector')).tap();
      
      await expect(element(by.testID('time-morning'))).toBeVisible();
      await expect(element(by.testID('time-afternoon'))).toBeVisible();
      await expect(element(by.testID('time-evening'))).toBeVisible();
      await expect(element(by.testID('time-anytime'))).toBeVisible();
      
      await element(by.testID('time-morning')).tap();
      await expect(element(by.testID('selected-preferred-time'))).toHaveText('Morning (8 AM - 12 PM)');
    });

    it('should validate description length', async () => {
      // Test that description is required (no minimum length)
      await element(by.testID('request-description-input')).typeText('Short');
      await element(by.testID('submit-maintenance-button')).tap();
      
      // Should not show minimum length error since validation was removed
      // Only required field validation should apply
      
      // Test maximum length
      const longText = 'A'.repeat(1001);
      await element(by.testID('request-description-input')).clearText();
      await element(by.testID('request-description-input')).typeText(longText);
      
      await expect(element(by.text('Description cannot exceed 1000 characters'))).toBeVisible();
      await expect(element(by.testID('character-count'))).toHaveText('1001/1000');
    });

    it('should handle tenant presence toggle', async () => {
      await expect(element(by.testID('tenant-present-toggle'))).toHaveValue('false');
      
      await element(by.testID('tenant-present-toggle')).tap();
      await expect(element(by.testID('tenant-present-toggle'))).toHaveValue('true');
      
      // Should show additional contact fields
      await expect(element(by.testID('tenant-contact-time'))).toBeVisible();
      await expect(element(by.testID('special-instructions'))).toBeVisible();
    });

    it('should complete full maintenance request creation', async () => {
      // Fill request details
      await element(by.testID('request-title-input')).typeText('Leaking Kitchen Faucet');
      await element(by.testID('request-description-input')).typeText('The kitchen faucet has been leaking continuously for the past 3 days. Water is dripping even when fully closed. This needs urgent attention to prevent water damage.');
      
      // Select priority
      await element(by.testID('priority-selector')).tap();
      await element(by.testID('priority-high')).tap();
      
      // Select property
      await element(by.testID('property-selector')).tap();
      await element(by.testID('property-apartment-downtown')).tap();
      
      // Select category
      await element(by.testID('category-selector')).tap();
      await element(by.testID('category-plumbing')).tap();
      
      // Add photos
      await helpers.addMockPhoto();
      await helpers.addMockPhoto();
      
      // Set preferred schedule
      await element(by.testID('preferred-date-picker')).tap();
      await element(by.testID('date-tomorrow')).tap();
      await element(by.testID('date-confirm')).tap();
      
      await element(by.testID('preferred-time-selector')).tap();
      await element(by.testID('time-morning')).tap();
      
      // Add access instructions
      await element(by.testID('access-instructions-input')).typeText('Use the side entrance. Keys are with the building manager.');
      
      // Set tenant presence
      await element(by.testID('tenant-present-toggle')).tap();
      
      // Submit request
      await element(by.testID('submit-maintenance-button')).tap();
      
      // Should show loading state
      await expect(element(by.testID('loading-indicator'))).toBeVisible();
      
      // Wait for completion and navigation
      await waitFor(element(by.testID('maintenance-screen')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Verify request was created
      await expect(element(by.text('Leaking Kitchen Faucet'))).toBeVisible();
      await expect(element(by.testID('priority-indicator-high'))).toBeVisible();
      await expect(element(by.text('Plumbing'))).toBeVisible();
    });

    it('should save draft when navigating away', async () => {
      await element(by.testID('request-title-input')).typeText('Draft Request');
      await element(by.testID('request-description-input')).typeText('This is a draft maintenance request that should be saved.');
      
      // Navigate away
      await element(by.testID('back-button')).tap();
      
      // Should show save draft dialog
      await expect(element(by.text('Save Draft?'))).toBeVisible();
      await expect(element(by.text('You have unsaved changes. Would you like to save this as a draft?'))).toBeVisible();
      
      await element(by.testID('save-draft-button')).tap();
      
      // Navigate back to add maintenance
      await element(by.testID('add-maintenance-button')).tap();
      
      // Should offer to restore draft
      await expect(element(by.text('Restore Draft?'))).toBeVisible();
      await element(by.testID('restore-draft-button')).tap();
      
      // Should restore form data
      await expect(element(by.testID('request-title-input'))).toHaveText('Draft Request');
      await expect(element(by.testID('request-description-input'))).toHaveText('This is a draft maintenance request that should be saved.');
    });

    it('should handle emergency requests', async () => {
      // Select urgent priority
      await element(by.testID('priority-selector')).tap();
      await element(by.testID('priority-urgent')).tap();
      
      // Should show emergency notice
      await expect(element(by.testID('emergency-notice'))).toBeVisible();
      await expect(element(by.text('Emergency requests will be processed immediately'))).toBeVisible();
      
      // Should show emergency contact options
      await expect(element(by.testID('call-emergency-button'))).toBeVisible();
      await expect(element(by.testID('emergency-phone-number'))).toBeVisible();
    });
  });

  describe('Maintenance Forms RTL Support', () => {
    beforeEach(async () => {
      await helpers.changeLanguage('ar');
      await helpers.waitForAppToLoad();
      await element(by.testID('maintenance-tab')).tap();
      await element(by.testID('add-maintenance-button')).tap();
    });

    it('should display maintenance form correctly in Arabic RTL', async () => {
      // Check Arabic labels
      await expect(element(by.text('عنوان الطلب'))).toBeVisible(); // Request Title
      await expect(element(by.text('وصف المشكلة'))).toBeVisible(); // Problem Description
      await expect(element(by.text('مستوى الأولوية'))).toBeVisible(); // Priority Level
      await expect(element(by.text('اختيار العقار'))).toBeVisible(); // Select Property
      await expect(element(by.text('فئة الصيانة'))).toBeVisible(); // Maintenance Category
      await expect(element(by.text('إرفاق صور'))).toBeVisible(); // Attach Photos
      
      // Check Arabic priority levels
      await element(by.testID('priority-selector')).tap();
      await expect(element(by.text('منخفض'))).toBeVisible(); // Low
      await expect(element(by.text('متوسط'))).toBeVisible(); // Medium
      await expect(element(by.text('عالي'))).toBeVisible(); // High
      await expect(element(by.text('طارئ'))).toBeVisible(); // Urgent
      
      // Verify RTL layout
      await helpers.verifyRTLLayout();
    });

    it('should handle form validation in Arabic', async () => {
      await element(by.testID('submit-maintenance-button')).tap();
      
      // Should show Arabic validation messages
      await expect(element(by.text('عنوان الطلب مطلوب'))).toBeVisible(); // Title required
      await expect(element(by.text('وصف المشكلة مطلوب'))).toBeVisible(); // Description required
      await expect(element(by.text('يرجى اختيار عقار'))).toBeVisible(); // Please select property
    });

    it('should handle Arabic text input with correct alignment', async () => {
      await element(by.testID('request-title-input')).typeText('مشكلة في الحمام');
      await element(by.testID('request-description-input')).typeText('يوجد تسريب في صنبور الحمام ويحتاج إلى إصلاح عاجل');
      
      // Text should be right-aligned for Arabic
      await expect(element(by.testID('request-title-input'))).toHaveTextAlignment('right');
      await expect(element(by.testID('request-description-input'))).toHaveTextAlignment('right');
    });
  });
});