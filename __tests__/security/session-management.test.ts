import { createClient } from '@supabase/supabase-js';
import { createTenantComplete } from '@/lib/tenantCreation';
import { profileService } from '@/lib/profileService';
import { logger } from '@/lib/structuredLogger';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    getUser: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(),
};

describe('Session Management Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    logger.clearLogs();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  test('manager session preserved after tenant creation', async () => {
    // Setup manager session
    const managerUserId = 'manager-123';
    const managerEmail = 'manager@test.com';

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: managerUserId, email: managerEmail },
        session: { access_token: 'manager-token' }
      },
      error: null
    });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: managerUserId, email: managerEmail } },
      error: null
    });

    // Mock profile service
    jest.spyOn(profileService, 'ensureProfileExists').mockResolvedValue({
      id: 'tenant-456',
      email: 'tenant@test.com',
      first_name: 'Test',
      last_name: 'Tenant',
      role: 'tenant'
    });

    // Create tenant
    const tenantResult = await createTenantComplete({
      email: 'tenant@test.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'Tenant',
      role: 'tenant'
    });

    // Verify tenant created successfully
    expect(tenantResult.success).toBe(true);
    expect(tenantResult.userId).toBe('tenant-456');

    // Verify manager session check was called
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();

    // Verify logging occurred
    const logs = logger.getLogs();
    const tenantLogs = logs.filter(log => log.context === 'tenant');
    expect(tenantLogs.length).toBeGreaterThan(0);

    // Verify specific log entries
    const creationLog = tenantLogs.find(log => log.action === 'complete_creation_start');
    expect(creationLog).toBeDefined();
    expect(creationLog?.metadata?.email).toBe('tenant@test.com');
  });

  test('ephemeral client used for tenant creation', async () => {
    // This test verifies that the ephemeral client pattern is being used
    // by checking that the createTenantComplete function doesn't affect the main client

    const managerUserId = 'manager-123';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: managerUserId } },
      error: null
    });

    jest.spyOn(profileService, 'ensureProfileExists').mockResolvedValue({
      id: 'tenant-456',
      email: 'tenant@test.com',
      role: 'tenant'
    });

    await createTenantComplete({
      email: 'tenant@test.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'Tenant',
      role: 'tenant'
    });

    // Verify the main Supabase client's auth state wasn't modified
    // The ephemeral client should have been used instead
    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  test('session state changes logged properly', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'manager-123' } },
      error: null
    });

    jest.spyOn(profileService, 'ensureProfileExists').mockResolvedValue({
      id: 'tenant-456',
      email: 'tenant@test.com',
      role: 'tenant'
    });

    await createTenantComplete({
      email: 'tenant@test.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'Tenant',
      role: 'tenant'
    });

    const logs = logger.getLogs();
    const authLogs = logs.filter(log => log.context === 'auth');

    expect(authLogs.length).toBeGreaterThan(0);

    // Verify log structure
    authLogs.forEach(log => {
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('level');
      expect(log).toHaveProperty('context');
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('message');
    });
  });
});