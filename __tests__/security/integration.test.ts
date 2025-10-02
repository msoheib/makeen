import { createTenantComplete } from '@/lib/tenantCreation';
import { getCurrentUserContext } from '@/lib/security';
import { profileService } from '@/lib/profileService';
import { hasScreenAccess, getNavigationPermissions } from '@/lib/permissions';
import { logger } from '@/lib/structuredLogger';

// Mock Supabase and dependencies
jest.mock('@/lib/supabase');
jest.mock('@/lib/profileService');

describe('Integration Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    logger.clearLogs();

    // Mock successful profile service
    const mockProfileService = require('@/lib/profileService');
    mockProfileService.profileService.ensureProfileExists.mockResolvedValue({
      id: 'tenant-456',
      email: 'tenant@test.com',
      first_name: 'Test',
      last_name: 'Tenant',
      role: 'tenant',
      profile_type: 'tenant',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  describe('End-to-End Tenant Creation Workflow', () => {
    test('manager creates tenant while maintaining session', async () => {
      // Mock manager session
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'manager-123',
            email: 'manager@test.com',
            user_metadata: { role: 'manager' }
          }
        },
        error: null
      });

      // Manager creates tenant
      const result = await createTenantComplete({
        email: 'newtenant@test.com',
        password: 'securePassword123',
        first_name: 'New',
        last_name: 'Tenant',
        role: 'tenant'
      });

      // Verify tenant creation success
      expect(result.success).toBe(true);
      expect(result.userId).toBe('tenant-456');
      expect(result.profile?.email).toBe('newtenant@test.com');

      // Verify manager session still intact
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();

      // Verify comprehensive logging
      const logs = logger.getLogs();
      const tenantLogs = logs.filter(log => log.context === 'tenant');

      expect(tenantLogs.length).toBeGreaterThan(0);
      expect(tenantLogs.some(log => log.action === 'complete_creation_success')).toBe(true);
    });

    test('tenant can only access permitted features after creation', async () => {
      // Create tenant
      const createResult = await createTenantComplete({
        email: 'tenant@test.com',
        password: 'securePassword123',
        first_name: 'Test',
        last_name: 'Tenant',
        role: 'tenant'
      });

      expect(createResult.success).toBe(true);

      // Mock tenant user context
      const tenantContext: any = {
        userId: 'tenant-456',
        role: 'tenant',
        isAuthenticated: true,
        rentedPropertyIds: ['property-1']
      };

      // Verify screen access restrictions
      expect(hasScreenAccess(tenantContext, 'properties')).toBe(false);
      expect(hasScreenAccess(tenantContext, 'dashboard')).toBe(true);

      // Verify navigation permissions
      const navPermissions = getNavigationPermissions(tenantContext);
      expect(navPermissions.properties?.visible).toBe(false);
      expect(navPermissions.dashboard?.visible).toBe(true);

      // Verify profile service was used
      expect(profileService.ensureProfileExists).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          email: 'tenant@test.com',
          role: 'tenant'
        })
      );
    });
  });

  describe('Concurrent Operations Security', () => {
    test('handles concurrent tenant creation attempts', async () => {
      // Simulate multiple managers creating tenants simultaneously
      const creationPromises = [
        createTenantComplete({
          email: 'tenant1@test.com',
          password: 'password123',
          first_name: 'Tenant',
          last_name: 'One',
          role: 'tenant'
        }),
        createTenantComplete({
          email: 'tenant2@test.com',
          password: 'password123',
          first_name: 'Tenant',
          last_name: 'Two',
          role: 'tenant'
        }),
        createTenantComplete({
          email: 'tenant3@test.com',
          password: 'password123',
          first_name: 'Tenant',
          last_name: 'Three',
          role: 'tenant'
        })
      ];

      const results = await Promise.all(creationPromises);

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.userId).toBeDefined();
      });

      // Verify all tenants have unique IDs
      const userIds = results.map(r => r.userId).filter(Boolean);
      expect(new Set(userIds).size).toBe(3);

      // Verify logging captured all operations
      const logs = logger.getLogs();
      const creationLogs = logs.filter(log => log.action === 'complete_creation_start');
      expect(creationLogs.length).toBe(3);
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('gracefully handles profile creation failures', async () => {
      // Mock profile service failure
      const mockProfileService = require('@/lib/profileService');
      mockProfileService.profileService.ensureProfileExists.mockRejectedValue(
        new Error('Database constraint violation')
      );

      // Attempt tenant creation
      const result = await createTenantComplete({
        email: 'tenant@test.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'Tenant',
        role: 'tenant'
      });

      // Should handle error gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Verify error logging
      const errorLogs = logger.getRecentErrors();
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs.some(log => log.context === 'tenant')).toBe(true);
    });

    test('maintains security during partial failures', async () => {
      // Mock partial success - auth succeeds but profile fails
      const mockProfileService = require('@/lib/profileService');
      let callCount = 0;
      mockProfileService.profileService.ensureProfileExists.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Profile creation failed'));
        }
        return Promise.resolve({
          id: 'tenant-456',
          email: 'tenant@test.com',
          role: 'tenant'
        });
      });

      // First attempt fails
      const result1 = await createTenantComplete({
        email: 'tenant@test.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'Tenant',
        role: 'tenant'
      });

      expect(result1.success).toBe(false);

      // Retry succeeds
      const result2 = await createTenantComplete({
        email: 'tenant@test.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'Tenant',
        role: 'tenant'
      });

      expect(result2.success).toBe(true);

      // Verify logging shows both attempts
      const logs = logger.getLogs();
      const tenantLogs = logs.filter(log => log.context === 'tenant');
      expect(tenantLogs.length).toBeGreaterThan(1);
    });
  });

  describe('Security Under Load', () => {
    test('maintains access control during high load', async () => {
      // Create many tenants to simulate load
      const tenantPromises = [];
      for (let i = 0; i < 10; i++) {
        tenantPromises.push(
          createTenantComplete({
            email: `tenant${i}@test.com`,
            password: 'password123',
            first_name: 'Tenant',
            last_name: i.toString(),
            role: 'tenant'
          })
        );
      }

      await Promise.all(tenantPromises);

      // Verify security contexts remain intact
      const tenantContext: any = {
        userId: 'tenant-456',
        role: 'tenant',
        isAuthenticated: true,
        rentedPropertyIds: ['property-1']
      };

      // Access controls still work
      expect(hasScreenAccess(tenantContext, 'properties')).toBe(false);
      expect(hasScreenAccess(tenantContext, 'dashboard')).toBe(true);

      // Verify performance logging for load
      const perfLogs = logger.getLogs('debug', 'performance');
      expect(perfLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency', () => {
    test('ensures data consistency across operations', async () => {
      // Create tenant with specific data
      const tenantData = {
        email: 'consistent@test.com',
        password: 'password123',
        first_name: 'Consistent',
        last_name: 'Tenant',
        role: 'tenant',
        phone: '+1234567890',
        address: '123 Test St'
      };

      const result = await createTenantComplete(tenantData);

      expect(result.success).toBe(true);

      // Verify all data is consistent
      expect(result.profile?.email).toBe(tenantData.email);
      expect(result.profile?.first_name).toBe(tenantData.first_name);
      expect(result.profile?.last_name).toBe(tenantData.last_name);
      expect(result.profile?.phone).toBe(tenantData.phone);
      expect(result.profile?.address).toBe(tenantData.address);
      expect(result.profile?.role).toBe(tenantData.role);

      // Verify profile service received complete data
      expect(profileService.ensureProfileExists).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          email: tenantData.email,
          first_name: tenantData.first_name,
          last_name: tenantData.last_name,
          phone: tenantData.phone,
          role: tenantData.role,
          address: tenantData.address
        })
      );
    });
  });

  describe('Audit Trail', () => {
    test('maintains complete audit trail', async () => {
      // Clear logs
      logger.clearLogs();

      // Perform tenant creation
      await createTenantComplete({
        email: 'audit@test.com',
        password: 'password123',
        first_name: 'Audit',
        last_name: 'Test',
        role: 'tenant'
      });

      // Verify comprehensive audit trail
      const logs = logger.getLogs();

      // Should have tenant creation logs
      const tenantLogs = logs.filter(log => log.context === 'tenant');
      expect(tenantLogs.length).toBeGreaterThan(0);

      // Should have profile operation logs
      const profileLogs = logs.filter(log => log.context === 'profile');
      expect(profileLogs.length).toBeGreaterThan(0);

      // All logs should have proper structure
      logs.forEach(log => {
        expect(log).toHaveProperty('timestamp');
        expect(log).toHaveProperty('level');
        expect(log).toHaveProperty('context');
        expect(log).toHaveProperty('action');
        expect(log).toHaveProperty('message');
        expect(log).toHaveProperty('metadata');
      });

      // Should be able to trace complete workflow
      const workflowLogs = logs.filter(log =>
        log.context === 'tenant' || log.context === 'profile'
      );
      expect(workflowLogs.length).toBeGreaterThan(2); // At least start and end
    });
  });
});