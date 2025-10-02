import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { profilesApi } from '@/lib/api';
import { profileService } from '@/lib/profileService';
import { useAppStore } from '@/lib/store';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface UseUserProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<ProfileUpdate>) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useUserProfile = (): UseUserProfileReturn => {
  const { user } = useAuth();
  const { updateSettings } = useAppStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile from database
  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      setError('No authenticated user');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to fetch existing profile
      const apiResponse = await profilesApi.getById(user.id);
      
      const existingProfile = apiResponse.data;
      
      if (apiResponse.error) {
        console.error('[useUserProfile] Profile API error:', apiResponse.error);
        setError(apiResponse.error.message);
        setLoading(false);
        return;
      }
      
      if (existingProfile) {
        setProfile(existingProfile);
        
        // Sync with app store for consistency
        updateSettings({
          userProfile: {
            name: `${existingProfile.first_name || ''} ${existingProfile.last_name || ''}`.trim(),
            email: existingProfile.email || '',
            phone: existingProfile.phone || '',
            company: '', // Not in database schema, keep empty
            address: existingProfile.address || '',
            city: existingProfile.city || '',
            country: existingProfile.country || 'Saudi Arabia',
            updatedAt: existingProfile.updated_at || new Date().toISOString(),
          },
        });
      } else {
        try {
          // Use centralized profile service to ensure profile exists
          const ensuredProfile = await profileService.ensureProfileExists(user.id, {
            email: user.email || '',
            first_name: user.user_metadata?.first_name || user.first_name || '',
            last_name: user.user_metadata?.last_name || user.last_name || '',
            phone: user.user_metadata?.phone || user.phone || '',
            role: user.user_metadata?.role || 'tenant',
          });

          setProfile(ensuredProfile);

          // Sync with app store
          updateSettings({
            userProfile: {
              name: `${ensuredProfile.first_name || ''} ${ensuredProfile.last_name || ''}`.trim(),
              email: ensuredProfile.email || '',
              phone: ensuredProfile.phone || '',
              company: '',
              address: ensuredProfile.address || '',
              city: ensuredProfile.city || '',
              country: ensuredProfile.country || 'Saudi Arabia',
              updatedAt: ensuredProfile.updated_at || new Date().toISOString(),
            },
          });
        } catch (createError: any) {
          console.error('[useUserProfile] Failed to ensure user profile exists:', createError);
          setError('Failed to create user profile');
        }
      }
    } catch (err) {
      console.error('[useUserProfile] Failed to fetch user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, user?.first_name, user?.last_name, user?.phone, user?.user_metadata, updateSettings]);

  // Update profile in database
  const updateProfile = useCallback(async (updates: Partial<ProfileUpdate>): Promise<boolean> => {
    if (!user?.id || !profile) {
      setError('No user or profile available');
      return false;
    }

    try {
      setError(null);

      const updatedProfile = await profileService.update(user.id, {
        ...updates,
        updated_at: new Date().toISOString(),
      });

      setProfile(updatedProfile);

      // Sync with app store
      updateSettings({
        userProfile: {
          name: `${updatedProfile.first_name || ''} ${updatedProfile.last_name || ''}`.trim(),
          email: updatedProfile.email || '',
          phone: updatedProfile.phone || '',
          company: '', // Not in database schema
          address: updatedProfile.address || '',
          city: updatedProfile.city || '',
          country: updatedProfile.country || 'Saudi Arabia',
          updatedAt: updatedProfile.updated_at || new Date().toISOString(),
        },
      });

      return true;
    } catch (err) {
      console.error('[useUserProfile] Failed to update user profile:', err);
      setError('Failed to update profile');
      return false;
    }
  }, [user?.id, profile, updateSettings]);

  // Refetch profile data
  const refetch = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  // Initial fetch when user changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch,
  };
};
