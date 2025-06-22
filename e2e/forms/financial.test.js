describe('Financial Forms E2E Tests', () => {
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

  describe('Create Invoice Form', () => {
    beforeEach(async () => {
      // Navigate to finance > invoices > create
      await element(by.testID('finance-tab')).tap();
      await expect(element(by.testID('finance-screen'))).toBeVisible();
      await element(by.testID('invoices-section')).tap();
      await element(by.testID('create-invoice-button')).tap();
      await expect(element(by.testID('create-invoice-screen'))).toBeVisible();
    });

    it('should display all create invoice form elements', async () => {
      // Customer Information
      await expect(element(by.testID('customer-selector'))).toBeVisible();
      await expect(element(by.testID('property-selector'))).toBeVisible();
      
      // Invoice Details
      await expect(element(by.testID('invoice-number-input'))).toBeVisible();
      await expect(element(by.testID('invoice-date-picker'))).toBeVisible();
      await expect(element(by.testID('due-date-picker'))).toBeVisible();
      
      // Line Items Section
      await expect(element(by.testID('line-items-section'))).toBeVisible();
      await expect(element(by.testID('add-line-item-button'))).toBeVisible();
      
      // VAT and Totals
      await expect(element(by.testID('vat-rate-selector'))).toBeVisible();
      await expect(element(by.testID('subtotal-display'))).toBeVisible();
      await expect(element(by.testID('vat-amount-display'))).toBeVisible();
      await expect(element(by.testID('total-amount-display'))).toBeVisible();
      
      // Payment Terms
      await expect(element(by.testID('payment-terms-selector'))).toBeVisible();
      await expect(element(by.testID('notes-input'))).toBeVisible();
      
      // Actions
      await expect(element(by.testID('save-draft-button'))).toBeVisible();
      await expect(element(by.testID('create-invoice-button'))).toBeVisible();
    });

    it('should auto-generate invoice number', async () => {
      // Invoice number should be pre-filled and follow format INV-YYYY-NNNN
      const invoiceNumber = await element(by.testID('invoice-number-input')).getAttributes();
      expect(invoiceNumber.text).toMatch(/^INV-\d{4}-\d{4}$/);
      
      // Should be editable
      await element(by.testID('invoice-number-input')).clearText();
      await element(by.testID('invoice-number-input')).typeText('INV-2024-0001');
      await expect(element(by.testID('invoice-number-input'))).toHaveText('INV-2024-0001');
    });

    it('should handle customer selection', async () => {
      await element(by.testID('customer-selector')).tap();
      
      // Should show available customers/tenants
      await expect(element(by.testID('customer-list'))).toBeVisible();
      await expect(element(by.testID('customer-john-doe'))).toBeVisible();
      await expect(element(by.testID('customer-jane-smith'))).toBeVisible();
      
      // Show customer details
      await expect(element(by.text('john.doe@example.com'))).toBeVisible();
      await expect(element(by.text('+966501234567'))).toBeVisible();
      
      // Select customer
      await element(by.testID('customer-john-doe')).tap();
      
      // Verify selection
      await expect(element(by.testID('selected-customer'))).toHaveText('John Doe');
      
      // Should populate customer details
      await expect(element(by.testID('customer-address'))).toBeVisible();
      await expect(element(by.testID('customer-tax-id'))).toBeVisible();
    });

    it('should handle property selection', async () => {
      // First select customer
      await element(by.testID('customer-selector')).tap();
      await element(by.testID('customer-john-doe')).tap();
      
      await element(by.testID('property-selector')).tap();
      
      // Should show customer's properties only
      await expect(element(by.testID('property-list'))).toBeVisible();
      await expect(element(by.testID('property-apartment-downtown'))).toBeVisible();
      
      // Select property
      await element(by.testID('property-apartment-downtown')).tap();
      
      // Verify selection
      await expect(element(by.testID('selected-property'))).toHaveText('Modern Apartment Downtown');
    });

    it('should handle line items management', async () => {
      // Add first line item
      await element(by.testID('add-line-item-button')).tap();
      
      await expect(element(by.testID('line-item-0'))).toBeVisible();
      await expect(element(by.testID('item-description-0'))).toBeVisible();
      await expect(element(by.testID('item-quantity-0'))).toBeVisible();
      await expect(element(by.testID('item-unit-price-0'))).toBeVisible();
      await expect(element(by.testID('item-total-0'))).toBeVisible();
      
      // Fill line item
      await element(by.testID('item-description-0')).typeText('Monthly Rent - December 2024');
      await element(by.testID('item-quantity-0')).typeText('1');
      await element(by.testID('item-unit-price-0')).typeText('2500');
      
      // Should auto-calculate total
      await expect(element(by.testID('item-total-0'))).toHaveText('2,500.00 SAR');
      
      // Add second line item
      await element(by.testID('add-line-item-button')).tap();
      await expect(element(by.testID('line-item-1'))).toBeVisible();
      
      // Fill second item
      await element(by.testID('item-description-1')).typeText('Maintenance Fee');
      await element(by.testID('item-quantity-1')).typeText('1');
      await element(by.testID('item-unit-price-1')).typeText('200');
      
      // Should update totals
      await expect(element(by.testID('subtotal-display'))).toHaveText('2,700.00 SAR');
    });

    it('should handle line item removal', async () => {
      // Add two line items
      await element(by.testID('add-line-item-button')).tap();
      await element(by.testID('item-description-0')).typeText('Rent');
      await element(by.testID('item-unit-price-0')).typeText('2000');
      
      await element(by.testID('add-line-item-button')).tap();
      await element(by.testID('item-description-1')).typeText('Utilities');
      await element(by.testID('item-unit-price-1')).typeText('300');
      
      // Remove first item
      await element(by.testID('remove-line-item-0')).tap();
      
      // Should show confirmation
      await expect(element(by.text('Remove Line Item?'))).toBeVisible();
      await element(by.testID('confirm-remove')).tap();
      
      // Should remove item and reorder
      await expect(element(by.testID('line-item-0'))).toBeVisible();
      await expect(element(by.testID('item-description-0'))).toHaveText('Utilities');
      await expect(element(by.testID('line-item-1'))).not.toBeVisible();
    });

    it('should handle VAT calculations', async () => {
      // Add line item
      await element(by.testID('add-line-item-button')).tap();
      await element(by.testID('item-description-0')).typeText('Service Fee');
      await element(by.testID('item-quantity-0')).typeText('1');
      await element(by.testID('item-unit-price-0')).typeText('1000');
      
      // Select VAT rate
      await element(by.testID('vat-rate-selector')).tap();
      
      await expect(element(by.testID('vat-0'))).toBeVisible(); // 0%
      await expect(element(by.testID('vat-5'))).toBeVisible(); // 5%
      await expect(element(by.testID('vat-15'))).toBeVisible(); // 15%
      
      // Select 15% VAT
      await element(by.testID('vat-15')).tap();
      
      // Should calculate VAT correctly
      await expect(element(by.testID('subtotal-display'))).toHaveText('1,000.00 SAR');
      await expect(element(by.testID('vat-amount-display'))).toHaveText('150.00 SAR');
      await expect(element(by.testID('total-amount-display'))).toHaveText('1,150.00 SAR');
    });

    it('should handle date selections', async () => {
      // Test invoice date
      await element(by.testID('invoice-date-picker')).tap();
      await expect(element(by.testID('date-picker-modal'))).toBeVisible();
      await element(by.testID('date-today')).tap();
      await element(by.testID('date-confirm')).tap();
      
      // Test due date
      await element(by.testID('due-date-picker')).tap();
      await element(by.testID('date-next-month')).tap();
      await element(by.testID('date-confirm')).tap();
      
      // Should validate date order
      await element(by.testID('create-invoice-button')).tap();
      // Due date should be after invoice date - no error expected
    });

    it('should validate date ranges', async () => {
      // Set due date before invoice date
      await element(by.testID('due-date-picker')).tap();
      await element(by.testID('date-yesterday')).tap();
      await element(by.testID('date-confirm')).tap();
      
      await element(by.testID('create-invoice-button')).tap();
      
      await expect(element(by.text('Due date must be after invoice date'))).toBeVisible();
    });

    it('should handle payment terms', async () => {
      await element(by.testID('payment-terms-selector')).tap();
      
      await expect(element(by.testID('terms-net-15'))).toBeVisible();
      await expect(element(by.testID('terms-net-30'))).toBeVisible();
      await expect(element(by.testID('terms-net-60'))).toBeVisible();
      await expect(element(by.testID('terms-due-on-receipt'))).toBeVisible();
      
      await element(by.testID('terms-net-30')).tap();
      await expect(element(by.testID('selected-payment-terms'))).toHaveText('Net 30 Days');
      
      // Should auto-update due date
      await expect(element(by.testID('due-date-auto-updated'))).toBeVisible();
    });

    it('should complete full invoice creation', async () => {
      // Select customer
      await element(by.testID('customer-selector')).tap();
      await element(by.testID('customer-john-doe')).tap();
      
      // Select property
      await element(by.testID('property-selector')).tap();
      await element(by.testID('property-apartment-downtown')).tap();
      
      // Set dates
      await element(by.testID('invoice-date-picker')).tap();
      await element(by.testID('date-today')).tap();
      await element(by.testID('date-confirm')).tap();
      
      // Add line items
      await element(by.testID('add-line-item-button')).tap();
      await element(by.testID('item-description-0')).typeText('Monthly Rent - January 2024');
      await element(by.testID('item-quantity-0')).typeText('1');
      await element(by.testID('item-unit-price-0')).typeText('2500');
      
      // Set VAT
      await element(by.testID('vat-rate-selector')).tap();
      await element(by.testID('vat-15')).tap();
      
      // Set payment terms
      await element(by.testID('payment-terms-selector')).tap();
      await element(by.testID('terms-net-30')).tap();
      
      // Add notes
      await element(by.testID('notes-input')).typeText('Payment due within 30 days of invoice date.');
      
      // Create invoice
      await element(by.testID('create-invoice-button')).tap();
      
      // Should show loading
      await expect(element(by.testID('loading-indicator'))).toBeVisible();
      
      // Wait for completion
      await waitFor(element(by.testID('invoice-created-success')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Should show invoice details
      await expect(element(by.text('Invoice Created Successfully'))).toBeVisible();
      await expect(element(by.testID('invoice-number'))).toBeVisible();
      await expect(element(by.testID('total-amount'))).toHaveText('2,875.00 SAR');
    });
  });

  describe('Voucher Forms', () => {
    describe('Receipt Voucher Form', () => {
      beforeEach(async () => {
        await element(by.testID('finance-tab')).tap();
        await element(by.testID('vouchers-section')).tap();
        await element(by.testID('create-receipt-voucher')).tap();
        await expect(element(by.testID('receipt-voucher-screen'))).toBeVisible();
      });

      it('should display all receipt voucher form elements', async () => {
        // Voucher Details
        await expect(element(by.testID('voucher-number-input'))).toBeVisible();
        await expect(element(by.testID('voucher-date-picker'))).toBeVisible();
        await expect(element(by.testID('amount-input'))).toBeVisible();
        
        // Revenue Classification
        await expect(element(by.testID('revenue-account-selector'))).toBeVisible();
        await expect(element(by.testID('deposit-account-selector'))).toBeVisible();
        
        // Property and Tenant
        await expect(element(by.testID('property-selector'))).toBeVisible();
        await expect(element(by.testID('tenant-selector'))).toBeVisible();
        
        // Payment Details
        await expect(element(by.testID('payment-method-selector'))).toBeVisible();
        await expect(element(by.testID('reference-number-input'))).toBeVisible();
        
        // Description
        await expect(element(by.testID('description-input'))).toBeVisible();
        
        // Cost Center
        await expect(element(by.testID('cost-center-selector'))).toBeVisible();
        
        // Submit Button
        await expect(element(by.testID('create-receipt-button'))).toBeVisible();
      });

      it('should auto-generate voucher number', async () => {
        const voucherNumber = await element(by.testID('voucher-number-input')).getAttributes();
        expect(voucherNumber.text).toMatch(/^RV-\d{4}-\d{4}$/);
      });

      it('should handle account selection', async () => {
        await element(by.testID('revenue-account-selector')).tap();
        
        await expect(element(by.testID('account-rental-income'))).toBeVisible();
        await expect(element(by.testID('account-maintenance-income'))).toBeVisible();
        await expect(element(by.testID('account-utility-income'))).toBeVisible();
        
        await element(by.testID('account-rental-income')).tap();
        await expect(element(by.testID('selected-revenue-account'))).toHaveText('Rental Income');
      });

      it('should handle payment method selection', async () => {
        await element(by.testID('payment-method-selector')).tap();
        
        await expect(element(by.testID('method-cash'))).toBeVisible();
        await expect(element(by.testID('method-bank-transfer'))).toBeVisible();
        await expect(element(by.testID('method-cheque'))).toBeVisible();
        await expect(element(by.testID('method-credit-card'))).toBeVisible();
        
        await element(by.testID('method-bank-transfer')).tap();
        
        // Should show additional fields for bank transfer
        await expect(element(by.testID('bank-reference-input'))).toBeVisible();
      });
    });

    describe('Payment Voucher Form', () => {
      beforeEach(async () => {
        await element(by.testID('finance-tab')).tap();
        await element(by.testID('vouchers-section')).tap();
        await element(by.testID('create-payment-voucher')).tap();
        await expect(element(by.testID('payment-voucher-screen'))).toBeVisible();
      });

      it('should display all payment voucher form elements', async () => {
        // Voucher Details
        await expect(element(by.testID('voucher-number-input'))).toBeVisible();
        await expect(element(by.testID('voucher-date-picker'))).toBeVisible();
        await expect(element(by.testID('amount-input'))).toBeVisible();
        
        // Expense Classification
        await expect(element(by.testID('expense-account-selector'))).toBeVisible();
        await expect(element(by.testID('payment-account-selector'))).toBeVisible();
        
        // Vendor Information
        await expect(element(by.testID('vendor-selector'))).toBeVisible();
        
        // Payment Details
        await expect(element(by.testID('payment-method-selector'))).toBeVisible();
        await expect(element(by.testID('cheque-number-input'))).toBeVisible();
        
        // Submit Button
        await expect(element(by.testID('create-payment-button'))).toBeVisible();
      });

      it('should handle expense account selection', async () => {
        await element(by.testID('expense-account-selector')).tap();
        
        await expect(element(by.testID('account-maintenance-expense'))).toBeVisible();
        await expect(element(by.testID('account-utility-expense'))).toBeVisible();
        await expect(element(by.testID('account-management-fees'))).toBeVisible();
        await expect(element(by.testID('account-insurance'))).toBeVisible();
        
        await element(by.testID('account-maintenance-expense')).tap();
        await expect(element(by.testID('selected-expense-account'))).toHaveText('Maintenance Expense');
      });
    });

    describe('Journal Entry Form', () => {
      beforeEach(async () => {
        await element(by.testID('finance-tab')).tap();
        await element(by.testID('vouchers-section')).tap();
        await element(by.testID('create-journal-entry')).tap();
        await expect(element(by.testID('journal-entry-screen'))).toBeVisible();
      });

      it('should display journal entry form elements', async () => {
        // Entry Details
        await expect(element(by.testID('entry-number-input'))).toBeVisible();
        await expect(element(by.testID('entry-date-picker'))).toBeVisible();
        await expect(element(by.testID('reference-input'))).toBeVisible();
        
        // Debit/Credit Entries
        await expect(element(by.testID('debit-entries-section'))).toBeVisible();
        await expect(element(by.testID('credit-entries-section'))).toBeVisible();
        await expect(element(by.testID('add-debit-entry-button'))).toBeVisible();
        await expect(element(by.testID('add-credit-entry-button'))).toBeVisible();
        
        // Balance Check
        await expect(element(by.testID('balance-check'))).toBeVisible();
        await expect(element(by.testID('total-debits'))).toBeVisible();
        await expect(element(by.testID('total-credits'))).toBeVisible();
        
        // Submit Button
        await expect(element(by.testID('create-entry-button'))).toBeVisible();
      });

      it('should enforce double-entry bookkeeping', async () => {
        // Add debit entry
        await element(by.testID('add-debit-entry-button')).tap();
        await element(by.testID('debit-account-0')).tap();
        await element(by.testID('account-cash')).tap();
        await element(by.testID('debit-amount-0')).typeText('1000');
        
        // Should show unbalanced state
        await expect(element(by.testID('balance-warning'))).toBeVisible();
        await expect(element(by.testID('total-debits'))).toHaveText('1,000.00');
        await expect(element(by.testID('total-credits'))).toHaveText('0.00');
        
        // Add credit entry
        await element(by.testID('add-credit-entry-button')).tap();
        await element(by.testID('credit-account-0')).tap();
        await element(by.testID('account-rental-income')).tap();
        await element(by.testID('credit-amount-0')).typeText('1000');
        
        // Should show balanced state
        await expect(element(by.testID('balance-check-passed'))).toBeVisible();
        await expect(element(by.testID('total-credits'))).toHaveText('1,000.00');
      });

      it('should prevent submission of unbalanced entries', async () => {
        // Add only debit entry
        await element(by.testID('add-debit-entry-button')).tap();
        await element(by.testID('debit-amount-0')).typeText('500');
        
        // Try to submit
        await element(by.testID('create-entry-button')).tap();
        
        await expect(element(by.text('Debits and credits must be equal'))).toBeVisible();
        await expect(element(by.testID('create-entry-button'))).toBeDisabled();
      });
    });
  });

  describe('Financial Forms RTL Support', () => {
    beforeEach(async () => {
      await helpers.changeLanguage('ar');
      await helpers.waitForAppToLoad();
      await element(by.testID('finance-tab')).tap();
      await element(by.testID('invoices-section')).tap();
      await element(by.testID('create-invoice-button')).tap();
    });

    it('should display financial forms correctly in Arabic RTL', async () => {
      // Check Arabic labels
      await expect(element(by.text('اختيار العميل'))).toBeVisible(); // Select Customer
      await expect(element(by.text('رقم الفاتورة'))).toBeVisible(); // Invoice Number
      await expect(element(by.text('تاريخ الفاتورة'))).toBeVisible(); // Invoice Date
      await expect(element(by.text('تاريخ الاستحقاق'))).toBeVisible(); // Due Date
      await expect(element(by.text('بنود الفاتورة'))).toBeVisible(); // Invoice Items
      await expect(element(by.text('المجموع الفرعي'))).toBeVisible(); // Subtotal
      await expect(element(by.text('ضريبة القيمة المضافة'))).toBeVisible(); // VAT
      await expect(element(by.text('المجموع الكلي'))).toBeVisible(); // Total
      
      // Verify RTL layout
      await helpers.verifyRTLLayout();
    });

    it('should handle Arabic number formatting', async () => {
      // Add line item with Arabic numbers
      await element(by.testID('add-line-item-button')).tap();
      await element(by.testID('item-unit-price-0')).typeText('١٠٠٠'); // Arabic numerals
      
      // Should convert to standard numerals for calculation
      await expect(element(by.testID('item-total-0'))).toHaveText('1,000.00 ر.س'); // SAR in Arabic
    });
  });
});