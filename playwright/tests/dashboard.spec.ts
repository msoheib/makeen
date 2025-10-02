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
    {
      id: 'property-2',
      title: 'QA Lofts',
      property_code: 'QA-002',
      status: 'rented',
      property_type: 'loft',
      city: 'Sample City',
      address: '45 Demo St',
      owner_id: mockUser.id,
      is_sub_property: false,
      monthly_rent: 3200,
      created_at: '2024-06-15T00:00:00Z',
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
      property_id: 'property-2',
      tenant_id: 'tenant-1',
      status: 'active',
      rent_amount: 3200,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      created_at: '2024-01-01T00:00:00Z',
      property: {
        id: 'property-2',
        title: 'QA Lofts',
        address: '45 Demo St',
        city: 'Sample City',
        property_code: 'QA-002',
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

test('manager dashboard smoke test', async ({ page }) => {
  await mockSupabase(page);

  const consoleErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/');
  await page.getByRole('textbox', { name: /email/i }).fill('manager@example.com');
  await page.getByRole('textbox', { name: /password/i }).fill('password123');
  await page.getByRole('button', { name: /login/i }).click();

  await expect(page).toHaveURL(/\(tabs\)/);
  await expect(page.getByText('Dashboard').first()).toBeVisible();
  await expect(page.getByText('Total Properties')).toBeVisible();
  await expect(page.getByText('Total Tenants')).toBeVisible();
  await expect(page.getByText('Total Revenue')).toBeVisible();
  await expect(page.getByRole('button', { name: /Add Property/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /View Reports/i })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
