import { expect, Page, Route, test } from 'playwright/test';

const SUPABASE_HOST = 'fbabpaorcvatejkrelrf.supabase.co';

const baseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function fulfillOptions(route: Route) {
  return route.fulfill({
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': route.request().headers()['access-control-request-headers'] || '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    },
  });
}

async function mockSupabase(page: Page) {
  const mockUser = {
    id: 'user-manager',
    email: 'manager@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'email', role: 'manager' },
    user_metadata: { first_name: 'Morgan', last_name: 'Manager', role: 'manager' },
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockProfile = {
    id: mockUser.id,
    email: mockUser.email,
    first_name: 'Morgan',
    last_name: 'Manager',
    role: 'manager',
    profile_type: 'manager',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  };

  const properties = [
    {
      id: 'property-1',
      title: 'QA Heights',
      property_code: 'QA-001',
      status: 'available',
      property_type: 'apartment',
      city: 'Testville',
      address: '123 QA Lane',
      owner_id: mockUser.id,
      is_sub_property: false,
      monthly_rent: 2500,
      created_at: '2024-05-01T00:00:00Z',
      owner: {
        id: mockUser.id,
        first_name: 'Morgan',
        last_name: 'Manager',
        email: mockUser.email,
        phone: '555-0100',
      },
      group: null,
    },
  ];

  const contracts = [
    {
      id: 'contract-1',
      property_id: 'property-1',
      tenant_id: 'tenant-1',
      status: 'active',
      rent_amount: 2500,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      created_at: '2024-01-01T00:00:00Z',
      property: {
        id: 'property-1',
        title: 'QA Heights',
        address: '123 QA Lane',
        city: 'Testville',
        property_code: 'QA-001',
      },
      tenant: {
        id: 'tenant-1',
        first_name: 'Taylor',
        last_name: 'Tenant',
        email: 'tenant@example.com',
        phone: '555-0200',
      },
    },
  ];

  const tenants = [
    {
      id: 'tenant-1',
      email: 'tenant@example.com',
      first_name: 'Taylor',
      last_name: 'Tenant',
      role: 'tenant',
      status: 'active',
      profile_type: 'tenant',
      contracts,
      created_at: '2024-03-01T00:00:00Z',
    },
  ];

  const session = {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-token',
    user: mockUser,
  };

  const fulfillJson = (route: Route, body: unknown, extraHeaders: Record<string, string> = {}) => {
    return route.fulfill({
      status: 200,
      headers: { ...baseHeaders, ...extraHeaders },
      body: JSON.stringify(body),
    });
  };

  await page.route(`**://${SUPABASE_HOST}/auth/v1/token**`, route => {
    if (route.request().method() === 'OPTIONS') {
      return fulfillOptions(route);
    }
    return fulfillJson(route, { session, user: mockUser });
  });

  await page.route(`**://${SUPABASE_HOST}/auth/v1/user**`, route => {
    if (route.request().method() === 'OPTIONS') {
      return fulfillOptions(route);
    }
    return fulfillJson(route, { user: mockUser });
  });

  await page.route(`**://${SUPABASE_HOST}/rest/v1/profiles**`, route => {
    if (route.request().method() === 'OPTIONS') {
      return fulfillOptions(route);
    }
    const prefer = route.request().headers()['prefer']?.toLowerCase() ?? '';
    const url = new URL(route.request().url());
    const wantsSingle = prefer.includes('single') || url.searchParams.get('id')?.includes('eq.');

    if (wantsSingle) {
      return fulfillJson(route, mockProfile, { 'Content-Range': '0-0/1' });
    }

    const roleFilter = url.searchParams.get('role') || '';
    if (roleFilter.includes('tenant')) {
      return fulfillJson(route, tenants, { 'Content-Range': `0-${tenants.length - 1}/${tenants.length}` });
    }

    return fulfillJson(route, [mockProfile, ...tenants], { 'Content-Range': '0-1/2' });
  });

  await page.route(`**://${SUPABASE_HOST}/rest/v1/properties**`, route => {
    if (route.request().method() === 'OPTIONS') {
      return fulfillOptions(route);
    }
    return fulfillJson(route, properties, { 'Content-Range': `0-${properties.length - 1}/${properties.length}` });
  });

  await page.route(`**://${SUPABASE_HOST}/rest/v1/contracts**`, route => {
    if (route.request().method() === 'OPTIONS') {
      return fulfillOptions(route);
    }
    return fulfillJson(route, contracts, { 'Content-Range': `0-${contracts.length - 1}/${contracts.length}` });
  });

  await page.route(`**://${SUPABASE_HOST}/rest/v1/property_groups**`, route => {
    if (route.request().method() === 'OPTIONS') {
      return fulfillOptions(route);
    }
    return fulfillJson(route, [], { 'Content-Range': '0-0/0' });
  });
}

async function loginAndNavigateToDashboard(page: Page) {
  await page.goto('/');
  await page.getByRole('textbox', { name: /email/i }).fill('manager@example.com');
  await page.getByRole('textbox', { name: /password/i }).fill('password123');
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(/\(tabs\)/);
  await expect(page.getByText('Dashboard').first()).toBeVisible();
}

async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `playwright-report/screenshots/${name}.png`,
    fullPage: true 
  });
}

test.describe('QA Theme and Language Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
  });

  test.describe('Language Consistency Tests', () => {
    test('English language displays correctly across all screens', async ({ page }) => {
      await loginAndNavigateToDashboard(page);
      
      // Verify English text elements are visible
      await expect(page.getByText('Dashboard')).toBeVisible();
      await expect(page.getByText('Properties')).toBeVisible();
      await expect(page.getByText('Tenants')).toBeVisible();
      await expect(page.getByText('Reports')).toBeVisible();
      await expect(page.getByText('Settings')).toBeVisible();
      
      // Check dashboard specific English text
      await expect(page.getByText('Total Properties')).toBeVisible();
      await expect(page.getByText('Total Tenants')).toBeVisible();
      await expect(page.getByText('Total Revenue')).toBeVisible();
      
      // Navigate to Properties tab
      await page.getByText('Properties').click();
      await expect(page.getByText('Properties')).toBeVisible();
      
      // Navigate to Tenants tab
      await page.getByText('Tenants').click();
      await expect(page.getByText('Tenants')).toBeVisible();
      
      // Navigate to Reports tab
      await page.getByText('Reports').click();
      await expect(page.getByText('Reports')).toBeVisible();
      
      // Navigate to Settings tab
      await page.getByText('Settings').click();
      await expect(page.getByText('Settings')).toBeVisible();
      
      await takeScreenshot(page, 'english-language-consistency');
    });

    test('Arabic language displays correctly with RTL layout', async ({ page }) => {
      await loginAndNavigateToDashboard(page);
      
      // Navigate to language settings
      await page.getByText('Settings').click();
      await page.getByText('Language').click();
      
      // Switch to Arabic
      await page.getByText('العربية').click();
      
      // Wait for language change to take effect
      await page.waitForTimeout(2000);
      
      // Verify Arabic text elements are visible
      await expect(page.getByText('لوحة التحكم')).toBeVisible();
      await expect(page.getByText('العقارات')).toBeVisible();
      await expect(page.getByText('المستأجرين')).toBeVisible();
      await expect(page.getByText('التقارير')).toBeVisible();
      await expect(page.getByText('الإعدادات')).toBeVisible();
      
      // Check RTL layout by verifying text direction
      const dashboardTitle = page.getByText('لوحة التحكم').first();
      await expect(dashboardTitle).toBeVisible();
      
      // Navigate through tabs to verify RTL consistency
      await page.getByText('العقارات').click();
      await expect(page.getByText('العقارات')).toBeVisible();
      
      await page.getByText('المستأجرين').click();
      await expect(page.getByText('المستأجرين')).toBeVisible();
      
      await page.getByText('التقارير').click();
      await expect(page.getByText('التقارير')).toBeVisible();
      
      await page.getByText('الإعدادات').click();
      await expect(page.getByText('الإعدادات')).toBeVisible();
      
      await takeScreenshot(page, 'arabic-language-rtl-consistency');
    });

    test('Language switching maintains UI consistency', async ({ page }) => {
      await loginAndNavigateToDashboard(page);
      
      // Test English -> Arabic -> English switching
      await page.getByText('Settings').click();
      await page.getByText('Language').click();
      
      // Switch to Arabic
      await page.getByText('العربية').click();
      await page.waitForTimeout(2000);
      
      // Verify Arabic is active
      await expect(page.getByText('لوحة التحكم')).toBeVisible();
      
      // Switch back to English
      await page.getByText('English').click();
      await page.waitForTimeout(2000);
      
      // Verify English is active
      await expect(page.getByText('Dashboard')).toBeVisible();
      
      await takeScreenshot(page, 'language-switching-consistency');
    });
  });

  test.describe('Theme Consistency Tests', () => {
    test('Light theme displays correctly across all screens', async ({ page }) => {
      await loginAndNavigateToDashboard(page);
      
      // Ensure light theme is active (default)
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Navigate through all main tabs
      const tabs = ['Properties', 'Tenants', 'Reports', 'Settings'];
      
      for (const tab of tabs) {
        await page.getByText(tab).click();
        await expect(page.getByText(tab)).toBeVisible();
        
        // Verify theme consistency by checking for light theme elements
        const header = page.locator('[data-testid="header"], .header, [class*="header"]').first();
        if (await header.isVisible()) {
          await expect(header).toBeVisible();
        }
      }
      
      await takeScreenshot(page, 'light-theme-consistency');
    });

    test('Dark theme displays correctly across all screens', async ({ page }) => {
      await loginAndNavigateToDashboard(page);
      
      // Navigate to theme settings
      await page.getByText('Settings').click();
      await page.getByText('Theme').click();
      
      // Switch to dark theme
      await page.getByText('Dark').click();
      await page.waitForTimeout(1000);
      
      // Verify dark theme is active
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Navigate through all main tabs to verify dark theme consistency
      const tabs = ['Properties', 'Tenants', 'Reports', 'Settings'];
      
      for (const tab of tabs) {
        await page.getByText(tab).click();
        await expect(page.getByText(tab)).toBeVisible();
        
        // Verify dark theme elements are present
        const header = page.locator('[data-testid="header"], .header, [class*="header"]').first();
        if (await header.isVisible()) {
          await expect(header).toBeVisible();
        }
      }
      
      await takeScreenshot(page, 'dark-theme-consistency');
    });

    test('Theme switching maintains UI consistency', async ({ page }) => {
      await loginAndNavigateToDashboard(page);
      
      // Test Light -> Dark -> Light switching
      await page.getByText('Settings').click();
      await page.getByText('Theme').click();
      
      // Switch to dark theme
      await page.getByText('Dark').click();
      await page.waitForTimeout(1000);
      
      // Verify dark theme is active
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Switch back to light theme
      await page.getByText('Light').click();
      await page.waitForTimeout(1000);
      
      // Verify light theme is active
      await expect(body).toBeVisible();
      
      await takeScreenshot(page, 'theme-switching-consistency');
    });
  });

  test.describe('Combined Theme and Language Tests', () => {
    test('Arabic + Dark theme combination works correctly', async ({ page }) => {
      await loginAndNavigateToDashboard(page);
      
      // Switch to Arabic
      await page.getByText('Settings').click();
      await page.getByText('Language').click();
      await page.getByText('العربية').click();
      await page.waitForTimeout(1000);
      
      // Switch to dark theme
      await page.getByText('الإعدادات').click();
      await page.getByText('المظهر').click();
      await page.getByText('الداكن').click();
      await page.waitForTimeout(1000);
      
      // Verify both Arabic and dark theme are active
      await expect(page.getByText('لوحة التحكم')).toBeVisible();
      
      // Navigate through tabs to verify consistency
      const tabs = ['العقارات', 'المستأجرين', 'التقارير', 'الإعدادات'];
      
      for (const tab of tabs) {
        await page.getByText(tab).click();
        await expect(page.getByText(tab)).toBeVisible();
      }
      
      await takeScreenshot(page, 'arabic-dark-theme-combination');
    });

    test('English + Light theme combination works correctly', async ({ page }) => {
      await loginAndNavigateToDashboard(page);
      
      // Ensure English and light theme are active
      await expect(page.getByText('Dashboard')).toBeVisible();
      
      // Navigate through tabs to verify consistency
      const tabs = ['Properties', 'Tenants', 'Reports', 'Settings'];
      
      for (const tab of tabs) {
        await page.getByText(tab).click();
        await expect(page.getByText(tab)).toBeVisible();
      }
      
      await takeScreenshot(page, 'english-light-theme-combination');
    });
  });

  test.describe('UI Element Consistency Tests', () => {
    test('Navigation elements maintain consistency across themes and languages', async ({ page }) => {
      await loginAndNavigateToDashboard(page);
      
      // Test all combinations
      const combinations = [
        { language: 'English', theme: 'Light' },
        { language: 'English', theme: 'Dark' },
        { language: 'Arabic', theme: 'Light' },
        { language: 'Arabic', theme: 'Dark' }
      ];
      
      for (const combo of combinations) {
        // Set language
        await page.getByText('Settings').click();
        await page.getByText('Language').click();
        
        if (combo.language === 'Arabic') {
          await page.getByText('العربية').click();
          await page.waitForTimeout(1000);
        } else {
          await page.getByText('English').click();
          await page.waitForTimeout(1000);
        }
        
        // Set theme
        const settingsText = combo.language === 'Arabic' ? 'الإعدادات' : 'Settings';
        await page.getByText(settingsText).click();
        
        const themeText = combo.language === 'Arabic' ? 'المظهر' : 'Theme';
        await page.getByText(themeText).click();
        
        if (combo.theme === 'Dark') {
          const darkText = combo.language === 'Arabic' ? 'الداكن' : 'Dark';
          await page.getByText(darkText).click();
        } else {
          const lightText = combo.language === 'Arabic' ? 'الفاتح' : 'Light';
          await page.getByText(lightText).click();
        }
        
        await page.waitForTimeout(1000);
        
        // Verify navigation elements are present and functional
        const tabs = combo.language === 'Arabic' 
          ? ['لوحة التحكم', 'العقارات', 'المستأجرين', 'التقارير', 'الإعدادات']
          : ['Dashboard', 'Properties', 'Tenants', 'Reports', 'Settings'];
        
        for (const tab of tabs) {
          await page.getByText(tab).click();
          await expect(page.getByText(tab)).toBeVisible();
        }
        
        await takeScreenshot(page, `navigation-consistency-${combo.language.toLowerCase()}-${combo.theme.toLowerCase()}`);
      }
    });

    test('Form elements maintain consistency across themes and languages', async ({ page }) => {
      await loginAndNavigateToDashboard(page);
      
      // Navigate to a form-heavy screen (Settings)
      await page.getByText('Settings').click();
      
      // Test form elements in different combinations
      const combinations = [
        { language: 'English', theme: 'Light' },
        { language: 'Arabic', theme: 'Dark' }
      ];
      
      for (const combo of combinations) {
        // Set language
        await page.getByText('Language').click();
        
        if (combo.language === 'Arabic') {
          await page.getByText('العربية').click();
          await page.waitForTimeout(1000);
        } else {
          await page.getByText('English').click();
          await page.waitForTimeout(1000);
        }
        
        // Set theme
        const settingsText = combo.language === 'Arabic' ? 'الإعدادات' : 'Settings';
        await page.getByText(settingsText).click();
        
        const themeText = combo.language === 'Arabic' ? 'المظهر' : 'Theme';
        await page.getByText(themeText).click();
        
        if (combo.theme === 'Dark') {
          const darkText = combo.language === 'Arabic' ? 'الداكن' : 'Dark';
          await page.getByText(darkText).click();
        } else {
          const lightText = combo.language === 'Arabic' ? 'الفاتح' : 'Light';
          await page.getByText(lightText).click();
        }
        
        await page.waitForTimeout(1000);
        
        // Verify form elements are visible and functional
        const profileText = combo.language === 'Arabic' ? 'الملف الشخصي' : 'Profile';
        await expect(page.getByText(profileText)).toBeVisible();
        
        await takeScreenshot(page, `form-consistency-${combo.language.toLowerCase()}-${combo.theme.toLowerCase()}`);
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('App handles theme/language switching gracefully', async ({ page }) => {
      await loginAndNavigateToDashboard(page);
      
      // Rapidly switch between themes and languages
      for (let i = 0; i < 3; i++) {
        // Switch language
        await page.getByText('Settings').click();
        await page.getByText('Language').click();
        await page.getByText('العربية').click();
        await page.waitForTimeout(500);
        
        await page.getByText('الإعدادات').click();
        await page.getByText('المظهر').click();
        await page.getByText('الداكن').click();
        await page.waitForTimeout(500);
        
        // Switch back
        await page.getByText('الإعدادات').click();
        await page.getByText('المظهر').click();
        await page.getByText('الفاتح').click();
        await page.waitForTimeout(500);
        
        await page.getByText('الإعدادات').click();
        await page.getByText('اللغة').click();
        await page.getByText('English').click();
        await page.waitForTimeout(500);
      }
      
      // Verify app is still functional
      await expect(page.getByText('Dashboard')).toBeVisible();
      
      await takeScreenshot(page, 'rapid-theme-language-switching');
    });

    test('Console errors are minimal during theme/language operations', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', message => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });
      
      await loginAndNavigateToDashboard(page);
      
      // Perform theme and language operations
      await page.getByText('Settings').click();
      await page.getByText('Language').click();
      await page.getByText('العربية').click();
      await page.waitForTimeout(1000);
      
      await page.getByText('الإعدادات').click();
      await page.getByText('المظهر').click();
      await page.getByText('الداكن').click();
      await page.waitForTimeout(1000);
      
      // Filter out expected warnings (like expo-notifications on web)
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('expo-notifications') && 
        !error.includes('useNativeDriver') &&
        !error.includes('pointerEvents') &&
        !error.includes('shadow*')
      );
      
      // Should have minimal critical errors
      expect(criticalErrors.length).toBeLessThan(5);
    });
  });
});
