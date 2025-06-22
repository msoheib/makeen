describe('Authentication Forms E2E Tests', () => {
  beforeEach(async () => {
    await device.launchApp({ 
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
    await helpers.waitForAppToLoad();
  });

  afterEach(async () => {
    await device.terminateApp();
  });

  describe('Sign In Form', () => {
    it('should display all sign in form elements', async () => {
      // Check if we're on auth screen or need to navigate
      await waitFor(element(by.testID('sign-in-form')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Verify form elements
      await expect(element(by.testID('email-input'))).toBeVisible();
      await expect(element(by.testID('password-input'))).toBeVisible();
      await expect(element(by.testID('remember-me-checkbox'))).toBeVisible();
      await expect(element(by.testID('sign-in-button'))).toBeVisible();
      await expect(element(by.testID('forgot-password-link'))).toBeVisible();
      await expect(element(by.testID('signup-link'))).toBeVisible();
    });

    it('should show validation errors for empty fields', async () => {
      await element(by.testID('sign-in-form')).tap();
      
      // Try to submit without filling fields
      await element(by.testID('sign-in-button')).tap();
      
      // Check for validation errors
      await expect(element(by.text('Email is required'))).toBeVisible();
      await expect(element(by.text('Password is required'))).toBeVisible();
    });

    it('should show error for invalid email format', async () => {
      await element(by.testID('email-input')).typeText('invalid-email');
      await element(by.testID('password-input')).typeText('password123');
      await element(by.testID('sign-in-button')).tap();
      
      await expect(element(by.text('Please enter a valid email address'))).toBeVisible();
    });

    it('should handle valid login flow', async () => {
      await element(by.testID('email-input')).typeText('test@example.com');
      await element(by.testID('password-input')).typeText('password123');
      await element(by.testID('sign-in-button')).tap();
      
      // Should show loading state
      await expect(element(by.testID('loading-indicator'))).toBeVisible();
      
      // Should either navigate to dashboard or show error
      await waitFor(element(by.testID('loading-indicator')))
        .not.toBeVisible()
        .withTimeout(10000);
    });

    it('should toggle password visibility', async () => {
      await element(by.testID('password-input')).typeText('password123');
      
      // Initially password should be hidden
      await expect(element(by.testID('password-hidden'))).toBeVisible();
      
      // Tap show/hide button
      await element(by.testID('password-visibility-toggle')).tap();
      
      // Password should now be visible
      await expect(element(by.testID('password-visible'))).toBeVisible();
    });

    it('should handle remember me checkbox', async () => {
      // Initially unchecked
      await expect(element(by.testID('remember-me-checkbox'))).toHaveValue('false');
      
      // Tap checkbox
      await element(by.testID('remember-me-checkbox')).tap();
      
      // Should be checked
      await expect(element(by.testID('remember-me-checkbox'))).toHaveValue('true');
    });

    it('should navigate to forgot password screen', async () => {
      await element(by.testID('forgot-password-link')).tap();
      
      await expect(element(by.testID('forgot-password-screen'))).toBeVisible();
      await expect(element(by.text('Reset Password'))).toBeVisible();
    });

    it('should navigate to sign up screen', async () => {
      await element(by.testID('signup-link')).tap();
      
      await expect(element(by.testID('signup-screen'))).toBeVisible();
      await expect(element(by.text('Create Account'))).toBeVisible();
    });
  });

  describe('Sign Up Form', () => {
    beforeEach(async () => {
      // Navigate to signup screen
      await element(by.testID('signup-link')).tap();
      await expect(element(by.testID('signup-screen'))).toBeVisible();
    });

    it('should display all sign up form elements', async () => {
      await expect(element(by.testID('first-name-input'))).toBeVisible();
      await expect(element(by.testID('last-name-input'))).toBeVisible();
      await expect(element(by.testID('email-input'))).toBeVisible();
      await expect(element(by.testID('password-input'))).toBeVisible();
      await expect(element(by.testID('confirm-password-input'))).toBeVisible();
      await expect(element(by.testID('role-selector'))).toBeVisible();
      await expect(element(by.testID('terms-checkbox'))).toBeVisible();
      await expect(element(by.testID('signup-button'))).toBeVisible();
    });

    it('should show validation errors for empty required fields', async () => {
      await element(by.testID('signup-button')).tap();
      
      await expect(element(by.text('First name is required'))).toBeVisible();
      await expect(element(by.text('Last name is required'))).toBeVisible();
      await expect(element(by.text('Email is required'))).toBeVisible();
      await expect(element(by.text('Password is required'))).toBeVisible();
    });

    it('should validate password confirmation match', async () => {
      await element(by.testID('password-input')).typeText('password123');
      await element(by.testID('confirm-password-input')).typeText('password456');
      await element(by.testID('signup-button')).tap();
      
      await expect(element(by.text('Passwords do not match'))).toBeVisible();
    });

    it('should handle role selection', async () => {
      await element(by.testID('role-selector')).tap();
      
      // Should show role options
      await expect(element(by.testID('role-tenant'))).toBeVisible();
      await expect(element(by.testID('role-buyer'))).toBeVisible();
      await expect(element(by.testID('role-owner'))).toBeVisible();
      await expect(element(by.testID('role-manager'))).toBeVisible();
      
      // Select tenant role
      await element(by.testID('role-tenant')).tap();
      
      // Verify selection
      await expect(element(by.testID('selected-role'))).toHaveText('Tenant');
    });

    it('should handle terms and conditions checkbox', async () => {
      await expect(element(by.testID('terms-checkbox'))).toHaveValue('false');
      
      await element(by.testID('terms-checkbox')).tap();
      await expect(element(by.testID('terms-checkbox'))).toHaveValue('true');
    });

    it('should complete full registration flow', async () => {
      await element(by.testID('first-name-input')).typeText('John');
      await element(by.testID('last-name-input')).typeText('Doe');
      await element(by.testID('email-input')).typeText('john.doe@example.com');
      await element(by.testID('password-input')).typeText('password123');
      await element(by.testID('confirm-password-input')).typeText('password123');
      
      // Select role
      await element(by.testID('role-selector')).tap();
      await element(by.testID('role-tenant')).tap();
      
      // Accept terms
      await element(by.testID('terms-checkbox')).tap();
      
      // Submit form
      await element(by.testID('signup-button')).tap();
      
      // Should show loading state
      await expect(element(by.testID('loading-indicator'))).toBeVisible();
      
      // Wait for completion
      await waitFor(element(by.testID('loading-indicator')))
        .not.toBeVisible()
        .withTimeout(15000);
    });

    it('should show password strength indicator', async () => {
      await element(by.testID('password-input')).typeText('weak');
      await expect(element(by.testID('password-strength-weak'))).toBeVisible();
      
      await element(by.testID('password-input')).clearText();
      await element(by.testID('password-input')).typeText('StrongPassword123!');
      await expect(element(by.testID('password-strength-strong'))).toBeVisible();
    });
  });

  describe('RTL Support for Auth Forms', () => {
    beforeEach(async () => {
      await helpers.changeLanguage('ar');
      await helpers.waitForAppToLoad();
    });

    it('should display sign in form correctly in Arabic RTL', async () => {
      await expect(element(by.testID('sign-in-form'))).toBeVisible();
      
      // Check Arabic labels
      await expect(element(by.text('البريد الإلكتروني'))).toBeVisible(); // Email
      await expect(element(by.text('كلمة المرور'))).toBeVisible(); // Password
      await expect(element(by.text('تسجيل الدخول'))).toBeVisible(); // Sign In
      
      // Verify RTL layout
      await helpers.verifyRTLLayout();
    });

    it('should handle form submission in Arabic', async () => {
      await element(by.testID('email-input')).typeText('test@example.com');
      await element(by.testID('password-input')).typeText('password123');
      await element(by.testID('sign-in-button')).tap();
      
      await expect(element(by.testID('loading-indicator'))).toBeVisible();
    });
  });
});