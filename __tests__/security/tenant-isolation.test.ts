import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { createTenantComplete } from '@/lib/tenantCreation';
import { propertiesApi, profilesApi } from '@/lib/api';

// Test configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Create test clients
const managerClient = createClient(supabaseUrl, supabaseAnonKey);
const tenantClient = createClient(supabaseUrl, supabaseAnonKey);

// Test data
const testManager = {
  email: 'test-manager-security@example.com',
  password: 'TestManager123!',
  first_name: 'Test',
  last_name: 'Manager',
  role: 'manager'
};

const testTenant = {
  email: 'test-tenant-security@example.com',
  password: 'TestTenant123!',
  first_name: 'Test',
  last_name: 'Tenant',
  role: 'tenant'
};

describe('Tenant Isolation Security Tests', () => {
  let managerSession: any;
  let tenantSession: any;
  let tenantUserId: string;

  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  describe('Session Preservation', () => {
    test('Manager session preserved when creating tenant', async () => {
      // Login as manager
      const { data: managerAuth, error: managerError } = await managerClient.auth.signUp({
        email: testManager.email,
        password: testManager.password,
        options: {
          data: {
            first_name: testManager.first_name,
            last_name: testManager.last_name,
            role: testManager.role
          }
        }
      });

      expect(managerError).toBeNull();
      expect(managerAuth.user).toBeTruthy();
      managerSession = managerAuth.session;

      // Create tenant using ephemeral client (should not affect manager session)
      const tenantResult = await createTenantComplete({
        email: testTenant.email,
        password: testTenant.password,
        first_name: testTenant.first_name,
        last_name: testTenant.last_name,
        role: testTenant.role
      });

      expect(tenantResult.success).toBe(true);
      expect(tenantResult.userId).toBeTruthy();
      tenantUserId = tenantResult.userId!;

      // Verify manager session is still intact
      const { data: currentManager } = await managerClient.auth.getSession();
      expect(currentManager.session?.user.id).toBe(managerSession?.user.id);
      expect(currentManager.session?.user.email).toBe(testManager.email);
    });

    test('Tenant creation does not trigger auth state change for manager', async () => {
      let authStateChanged = false;
      
      // Set up auth state change listener
      const { data: { subscription } } = managerClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user.email === testTenant.email) {
          authStateChanged = true;
        }
      });

      // Login as manager
      await managerClient.auth.signUp({
        email: testManager.email,
        password: testManager.password,
        options: { data: { first_name: testManager.first_name, last_name: testManager.last_name, role: testManager.role } }
      });

      // Create tenant
      await createTenantComplete({
        email: testTenant.email,
        password: testTenant.password,
        first_name: testTenant.first_name,
        last_name: testTenant.last_name,
        role: testTenant.role
      });

      // Wait a bit for any potential auth state changes
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify no auth state change occurred for manager
      expect(authStateChanged).toBe(false);

      subscription.unsubscribe();
    });
  });

  describe('Data Isolation', () => {
    beforeEach(async () => {
      // Setup manager session
      await managerClient.auth.signUp({
        email: testManager.email,
        password: testManager.password,
        options: { data: { first_name: testManager.first_name, last_name: testManager.last_name, role: testManager.role } }
      });

      // Create tenant
      const tenantResult = await createTenantComplete({
        email: testTenant.email,
        password: testTenant.password,
        first_name: testTenant.first_name,
        last_name: testTenant.last_name,
        role: testTenant.role
      });
      tenantUserId = tenantResult.userId!;

      // Login as tenant
      const { data: tenantAuth } = await tenantClient.auth.signInWithPassword({
        email: testTenant.email,
        password: testTenant.password
      });
      tenantSession = tenantAuth.session;
    });

    test('Tenant cannot access properties API', async () => {
      // Set tenant session
      await tenantClient.auth.setSession(tenantSession);

      // Try to access properties
      const propertiesResult = await propertiesApi.getAll();
      
      expect(propertiesResult.error).toBeTruthy();
      expect(propertiesResult.error?.message).toContain('Access denied');
      expect(propertiesResult.data).toBeNull();
    });

    test('Tenant cannot access individual property details', async () => {
      // Set tenant session
      await tenantClient.auth.setSession(tenantSession);

      // Try to access a property by ID
      const propertyResult = await propertiesApi.getById('some-property-id');
      
      expect(propertyResult.error).toBeTruthy();
      expect(propertyResult.error?.message).toContain('Access denied');
      expect(propertyResult.data).toBeNull();
    });

    test('Tenant can access their own profile', async () => {
      // Set tenant session
      await tenantClient.auth.setSession(tenantSession);

      // Try to access their own profile
      const profileResult = await profilesApi.getById(tenantUserId);
      
      expect(profileResult.error).toBeNull();
      expect(profileResult.data).toBeTruthy();
      expect(profileResult.data?.id).toBe(tenantUserId);
      expect(profileResult.data?.role).toBe('tenant');
    });

    test('Tenant cannot access other profiles', async () => {
      // Set tenant session
      await tenantClient.auth.setSession(tenantSession);

      // Try to access manager's profile
      const { data: managerData } = await managerClient.auth.getSession();
      const managerId = managerData.session?.user.id;

      if (managerId) {
        const profileResult = await profilesApi.getById(managerId);
        
        // Should either be denied or return null
        expect(profileResult.data).toBeNull();
      }
    });
  });

  describe('Database RLS Policies', () => {
    beforeEach(async () => {
      // Setup manager session
      await managerClient.auth.signUp({
        email: testManager.email,
        password: testManager.password,
        options: { data: { first_name: testManager.first_name, last_name: testManager.last_name, role: testManager.role } }
      });

      // Create tenant
      const tenantResult = await createTenantComplete({
        email: testTenant.email,
        password: testTenant.password,
        first_name: testTenant.first_name,
        last_name: testTenant.last_name,
        role: testTenant.role
      });
      tenantUserId = tenantResult.userId!;

      // Login as tenant
      const { data: tenantAuth } = await tenantClient.auth.signInWithPassword({
        email: testTenant.email,
        password: testTenant.password
      });
      tenantSession = tenantAuth.session;
    });

    test('RLS blocks tenant from querying properties table directly', async () => {
      // Set tenant session
      await tenantClient.auth.setSession(tenantSession);

      // Try to query properties table directly
      const { data, error } = await tenantClient
        .from('properties')
        .select('*');

      // Should be empty due to RLS policies
      expect(data).toHaveLength(0);
      expect(error).toBeNull(); // RLS doesn't return error, just empty results
    });

    test('RLS allows tenant to query their own profile', async () => {
      // Set tenant session
      await tenantClient.auth.setSession(tenantSession);

      // Query own profile
      const { data, error } = await tenantClient
        .from('profiles')
        .select('*')
        .eq('id', tenantUserId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.id).toBe(tenantUserId);
    });
  });

  describe('Race Condition Handling', () => {
    test('Duplicate profile creation handled gracefully', async () => {
      // Create tenant first time
      const result1 = await createTenantComplete({
        email: testTenant.email,
        password: testTenant.password,
        first_name: testTenant.first_name,
        last_name: testTenant.last_name,
        role: testTenant.role
      });

      expect(result1.success).toBe(true);

      // Try to create same tenant again
      const result2 = await createTenantComplete({
        email: testTenant.email,
        password: testTenant.password,
        first_name: testTenant.first_name,
        last_name: testTenant.last_name,
        role: testTenant.role
      });

      // Should handle duplicate gracefully
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('already exists');
    });
  });
});

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    // Clean up profiles
    await managerClient
      .from('profiles')
      .delete()
      .in('email', [testManager.email, testTenant.email]);

    // Clean up auth users
    const { data: managerUser } = await managerClient.auth.getUser();
    const { data: tenantUser } = await tenantClient.auth.getUser();

    if (managerUser.user) {
      await managerClient.auth.admin.deleteUser(managerUser.user.id);
    }
    if (tenantUser.user) {
      await tenantClient.auth.admin.deleteUser(tenantUser.user.id);
    }
  } catch (error) {
    // Ignore cleanup errors
    console.warn('Cleanup error:', error);
  }
}

