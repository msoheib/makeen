import { profileService } from '@/lib/profileService';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/structuredLogger';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabaseFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  logger.clearLogs();

  // Setup Supabase mock chain
  (supabase.from as jest.Mock).mockReturnValue(mockSupabaseFrom);
  mockSupabaseFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  });
  mockSelect.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
  });
  mockInsert.mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: mockSingle,
    }),
  });
  mockUpdate.mockReturnValue({
    eq: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: mockSingle,
      }),
    }),
  });
});

describe('Profile Service Security Tests', () => {
  const testUserId = 'user-123';
  const testProfileData = {
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    phone: '+1234567890',
    role: 'tenant' as const,
  };

  describe('ensureProfileExists', () => {
    test('creates new profile when none exists', async () => {
      // Profile doesn't exist
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });

      // Profile creation succeeds
      mockSingle.mockResolvedValueOnce({
        data: {
          id: testUserId,
          ...testProfileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const profile = await profileService.ensureProfileExists(testUserId, testProfileData);

      expect(profile).toEqual({
        id: testUserId,
        ...testProfileData,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', testUserId);
      expect(mockInsert).toHaveBeenCalledWith([{
        id: testUserId,
        ...testProfileData,
        status: 'active',
        profile_type: 'tenant',
      }]);
    });

    test('returns existing profile when found', async () => {
      const existingProfile = {
        id: testUserId,
        ...testProfileData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Profile exists
      mockSingle.mockResolvedValue({
        data: existingProfile,
        error: null,
      });

      const profile = await profileService.ensureProfileExists(testUserId, testProfileData);

      expect(profile).toEqual(existingProfile);

      // Verify only select was called, not insert
      expect(mockInsert).not.toHaveBeenCalled();
    });

    test('handles concurrent creation attempts gracefully', async () => {
      // Simulate race condition: first attempt finds no profile,
      // second attempt also finds no profile, but first creation succeeds

      // Both attempts find no profile initially
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      // First insert succeeds
      mockSingle.mockResolvedValueOnce({
        data: {
          id: testUserId,
          ...testProfileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      // Second insert fails with duplicate key error
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key value' },
      });

      // Fetch the existing profile after failed insert
      mockSingle.mockResolvedValueOnce({
        data: {
          id: testUserId,
          ...testProfileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      // Simulate concurrent attempts
      const [result1, result2] = await Promise.all([
        profileService.ensureProfileExists(testUserId, testProfileData),
        profileService.ensureProfileExists(testUserId, testProfileData),
      ]);

      // Both should return the same profile
      expect(result1.id).toBe(result2.id);
      expect(result1.email).toBe(testProfileData.email);
    });

    test('handles database errors gracefully', async () => {
      // Database error on profile fetch
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'CONNECTION_ERROR', message: 'Database connection failed' },
      });

      await expect(
        profileService.ensureProfileExists(testUserId, testProfileData)
      ).rejects.toThrow('Failed to create user profile');
    });

    test('logs profile creation attempts', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      mockSingle.mockResolvedValueOnce({
        data: {
          id: testUserId,
          ...testProfileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      await profileService.ensureProfileExists(testUserId, testProfileData);

      // Verify logging occurred
      const logs = logger.getLogs();
      const profileLogs = logs.filter(log => log.context === 'profile');

      expect(profileLogs.length).toBeGreaterThan(0);

      const creationLog = profileLogs.find(log => log.action === 'creation_start');
      expect(creationLog).toBeDefined();
      expect(creationLog?.metadata?.userId).toBe(testUserId);
    });
  });

  describe('update', () => {
    test('updates profile successfully', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'User',
        phone: '+0987654321',
      };

      const updatedProfile = {
        id: testUserId,
        ...testProfileData,
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      mockSingle.mockResolvedValue({
        data: updatedProfile,
        error: null,
      });

      const result = await profileService.update(testUserId, updateData);

      expect(result).toEqual(updatedProfile);

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith(updateData);
      expect(mockEq).toHaveBeenCalledWith('id', testUserId);
    });

    test('handles update errors', async () => {
      const updateData = { first_name: 'Updated' };

      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'UPDATE_ERROR', message: 'Failed to update profile' },
      });

      await expect(
        profileService.update(testUserId, updateData)
      ).rejects.toThrow('Failed to update user profile');
    });
  });

  describe('getById', () => {
    test('returns profile when found', async () => {
      const existingProfile = {
        id: testUserId,
        ...testProfileData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({
        data: existingProfile,
        error: null,
      });

      const profile = await profileService.getById(testUserId);

      expect(profile).toEqual(existingProfile);
    });

    test('returns null when profile not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const profile = await profileService.getById(testUserId);

      expect(profile).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('handles missing user ID gracefully', async () => {
      await expect(
        profileService.ensureProfileExists('', testProfileData)
      ).rejects.toThrow('Failed to create user profile');
    });

    test('handles invalid profile data', async () => {
      const invalidData = {
        email: 'invalid-email',
        first_name: '',
        role: 'invalid-role' as any,
      };

      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Should still attempt to create, database validation will handle format
      await expect(
        profileService.ensureProfileExists(testUserId, invalidData)
      ).rejects.toThrow('Failed to create user profile');
    });
  });
});