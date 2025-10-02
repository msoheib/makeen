import { createTenantComplete } from '@/lib/tenantCreation';
import { logger, logTenantCreation, logProfileOperation } from '@/lib/structuredLogger';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/lib/profileService');

describe('Logging and Observability Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    logger.clearLogs();
  });

  describe('Tenant Creation Logging', () => {
    test('logs tenant creation start event', async () => {
      // Mock successful tenant creation
      const mockProfileService = require('@/lib/profileService');
      mockProfileService.profileService.ensureProfileExists.mockResolvedValue({
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
      const startLogs = logs.filter(log =>
        log.context === 'tenant' && log.action === 'complete_creation_start'
      );

      expect(startLogs.length).toBe(1);
      expect(startLogs[0]).toMatchObject({
        context: 'tenant',
        action: 'complete_creation_start',
        level: 'info',
        metadata: expect.objectContaining({
          email: 'tenant@test.com',
          role: 'tenant'
        })
      });
    });

    test('logs tenant creation success event', async () => {
      const mockProfileService = require('@/lib/profileService');
      mockProfileService.profileService.ensureProfileExists.mockResolvedValue({
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
      const successLogs = logs.filter(log =>
        log.context === 'tenant' && log.action === 'complete_creation_success'
      );

      expect(successLogs.length).toBe(1);
      expect(successLogs[0]).toMatchObject({
        context: 'tenant',
        action: 'complete_creation_success',
        level: 'info',
        metadata: expect.objectContaining({
          email: 'tenant@test.com',
          userId: 'tenant-456',
          duration: expect.any(Number)
        })
      });
    });

    test('logs tenant creation error events', async () => {
      const mockProfileService = require('@/lib/profileService');
      mockProfileService.profileService.ensureProfileExists.mockRejectedValue(
        new Error('Profile creation failed')
      );

      try {
        await createTenantComplete({
          email: 'tenant@test.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'Tenant',
          role: 'tenant'
        });
      } catch (error) {
        // Expected to fail
      }

      const logs = logger.getLogs();
      const errorLogs = logs.filter(log =>
        log.context === 'tenant' && log.action === 'complete_creation_error'
      );

      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0]).toMatchObject({
        context: 'tenant',
        action: 'complete_creation_error',
        level: 'error',
        metadata: expect.objectContaining({
          email: 'tenant@test.com',
          error: expect.any(String),
          duration: expect.any(Number)
        })
      });
    });

    test('includes performance metrics in logs', async () => {
      const mockProfileService = require('@/lib/profileService');
      mockProfileService.profileService.ensureProfileExists.mockResolvedValue({
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
      const tenantLogs = logs.filter(log => log.context === 'tenant');

      // All tenant logs should have duration metrics
      tenantLogs.forEach(log => {
        expect(log.metadata?.duration).toBeDefined();
        expect(typeof log.metadata?.duration).toBe('number');
        expect(log.metadata?.duration).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Profile Operation Logging', () => {
    test('logs profile creation events', () => {
      logProfileOperation('user-123', 'create', true, {
        profileId: 'profile-456',
        duration: 150
      });

      const logs = logger.getLogs();
      const profileLogs = logs.filter(log => log.context === 'profile');

      expect(profileLogs.length).toBe(1);
      expect(profileLogs[0]).toMatchObject({
        context: 'profile',
        action: 'create',
        level: 'info',
        userId: 'user-123',
        metadata: expect.objectContaining({
          operation: 'create',
          success: true,
          profileId: 'profile-456',
          duration: 150
        })
      });
    });

    test('logs profile operation failures', () => {
      logProfileOperation('user-123', 'update', false, {
        error: 'Database constraint violation',
        duration: 50
      });

      const logs = logger.getLogs();
      const errorLogs = logs.filter(log => log.context === 'profile' && log.level === 'error');

      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0]).toMatchObject({
        context: 'profile',
        action: 'update',
        level: 'error',
        userId: 'user-123',
        metadata: expect.objectContaining({
          operation: 'update',
          success: false,
          error: 'Database constraint violation',
          duration: 50
        })
      });
    });
  });

  describe('Log Structure and Format', () => {
    test('all logs have required fields', () => {
      logTenantCreation.success('user-123', 'test@example.com', 100, {
        userId: 'user-123',
        emailConfirmed: true
      });

      const logs = logger.getLogs();
      const log = logs[0];

      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('level');
      expect(log).toHaveProperty('context');
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('message');
      expect(log).toHaveProperty('metadata');

      expect(typeof log.timestamp).toBe('string');
      expect(typeof log.level).toBe('string');
      expect(typeof log.context).toBe('string');
      expect(typeof log.action).toBe('string');
      expect(typeof log.message).toBe('string');
      expect(typeof log.metadata).toBe('object');
    });

    test('timestamps are ISO format', () => {
      logger.info('test', 'action', 'test message');

      const logs = logger.getLogs();
      const log = logs[0];

      expect(() => new Date(log.timestamp)).not.toThrow();
      expect(log.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    test('log levels are valid', () => {
      const levels = ['debug', 'info', 'warn', 'error'];

      levels.forEach(level => {
        logger.log(level as any, 'test', 'action', 'test message');
      });

      const logs = logger.getLogs();
      logs.forEach(log => {
        expect(levels).toContain(log.level);
      });
    });
  });

  describe('Log Retrieval and Filtering', () => {
    beforeEach(() => {
      // Create test logs with different contexts and levels
      logger.info('tenant', 'creation', 'Tenant creation started');
      logger.error('tenant', 'creation', 'Tenant creation failed');
      logger.info('profile', 'create', 'Profile created');
      logger.warn('auth', 'login', 'Failed login attempt');
    });

    test('can filter logs by context', () => {
      const tenantLogs = logger.getLogs(undefined, 'tenant');
      expect(tenantLogs.length).toBe(2);
      expect(tenantLogs.every(log => log.context === 'tenant')).toBe(true);
    });

    test('can filter logs by level', () => {
      const errorLogs = logger.getLogs('error');
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].level).toBe('error');
    });

    test('can limit number of returned logs', () => {
      const limitedLogs = logger.getLogs(undefined, undefined, 2);
      expect(limitedLogs.length).toBe(2);
    });

    test('getRecentErrors returns only error logs', () => {
      const recentErrors = logger.getRecentErrors();
      expect(recentErrors.length).toBe(1);
      expect(recentErrors[0].level).toBe('error');
    });
  });

  describe('Performance Logging', () => {
    test('tracks slow operations as warnings', () => {
      logger.logPerformance('tenant', 'creation', 1500, {
        userId: 'user-123'
      });

      const logs = logger.getLogs();
      const perfLogs = logs.filter(log => log.context === 'performance');

      expect(perfLogs.length).toBe(1);
      expect(perfLogs[0].level).toBe('warn');
      expect(perfLogs[0].metadata?.duration).toBe(1500);
    });

    test('tracks fast operations as debug', () => {
      logger.logPerformance('tenant', 'creation', 500, {
        userId: 'user-123'
      });

      const logs = logger.getLogs();
      const perfLogs = logs.filter(log => log.context === 'performance');

      expect(perfLogs.length).toBe(1);
      expect(perfLogs[0].level).toBe('debug');
      expect(perfLogs[0].metadata?.duration).toBe(500);
    });
  });

  describe('Log Management', () => {
    test('clearLogs removes all logs', () => {
      logger.info('test', 'action', 'test message');
      expect(logger.getLogs().length).toBe(1);

      logger.clearLogs();
      expect(logger.getLogs().length).toBe(0);
    });

    test('exportLogs returns copy of logs', () => {
      logger.info('test', 'action', 'test message');
      const exportedLogs = logger.exportLogs();

      expect(exportedLogs).toEqual(logger.getLogs());
      expect(exportedLogs).not.toBe(logger.getLogs()); // Different reference
    });

    test('logs are limited to max size', () => {
      // Add more logs than the max size (1000)
      for (let i = 0; i < 1100; i++) {
        logger.info('test', 'action', `test message ${i}`);
      }

      const logs = logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(1000);
      expect(logs.length).toBeGreaterThan(900); // Should be close to max
    });
  });

  describe('Security Event Logging', () => {
    test('logs security events with appropriate level', () => {
      logger.warn('security', 'unauthorized_access', 'Unauthorized access attempt', {
        userId: 'user-123',
        resource: '/api/properties',
        ipAddress: '192.168.1.1'
      });

      const logs = logger.getLogs();
      const securityLogs = logs.filter(log => log.context === 'security');

      expect(securityLogs.length).toBe(1);
      expect(securityLogs[0].level).toBe('warn');
      expect(securityLogs[0].action).toBe('unauthorized_access');
      expect(securityLogs[0].metadata?.resource).toBe('/api/properties');
    });
  });
});