import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { profilesApi } from '@/lib/api';
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
      console.log('[useUserProfile] No user ID available, clearing profile state');
      setProfile(null);
      setLoading(false);
      setError('No authenticated user');
      return;
    }

    try {
      console.log('[useUserProfile] Fetching profile for user ID:', user.id);
      setLoading(true);
      setError(null);

      // Try to fetch existing profile
      console.log('[useUserProfile] Calling profilesApi.getById with user ID:', user.id);
      const apiResponse = await profilesApi.getById(user.id);
      console.log('[useUserProfile] Profile API full response:', apiResponse);
      
      const existingProfile = apiResponse.data;
      console.log('[useUserProfile] Profile data extracted:', existingProfile ? 'Profile found' : 'No profile found');
      
      if (apiResponse.error) {
        console.error('[useUserProfile] Profile API error:', apiResponse.error);
        setError(apiResponse.error.message);
        setLoading(false);
        return;
      }
      
      if (existingProfile) {
        console.log('[useUserProfile] Profile data:', {
          id: existingProfile.id,
          first_name: existingProfile.first_name,
          last_name: existingProfile.last_name,
          email: existingProfile.email,
          phone: existingProfile.phone,
          address: existingProfile.address,
          city: existingProfile.city,
          country: existingProfile.country
        });
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
        console.log('[useUserProfile] Profile loaded and store updated successfully');
      } else {
        console.log('[useUserProfile] No existing profile found, creating new profile from auth metadata');
        console.log('[useUserProfile] User metadata:', {
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || user.first_name,
          last_name: user.user_metadata?.last_name || user.last_name,
          phone: user.user_metadata?.phone || user.phone,
          role: user.user_metadata?.role
        });
        
        // Profile doesn't exist, create one from auth metadata
        const newProfile: Database['public']['Tables']['profiles']['Insert'] = {
          id: user.id,
          first_name: user.user_metadata?.first_name || user.first_name || '',
          last_name: user.user_metadata?.last_name || user.last_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || user.phone || '',
          role: user.user_metadata?.role || 'tenant',
          status: 'active',
          country: 'Saudi Arabia',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          console.log('[useUserProfile] Creating new profile with data:', newProfile);
          const createResponse = await profilesApi.create(newProfile);
          console.log('[useUserProfile] Profile create response:', createResponse);
          
          if (createResponse.error) {
            console.error('[useUserProfile] Failed to create user profile:', createResponse.error);
            setError(createResponse.error.message);
            return;
          }
          
          const createdProfile = createResponse.data;
          console.log('[useUserProfile] Profile created successfully:', createdProfile);
          setProfile(createdProfile);

          // Sync with app store
          updateSettings({
            userProfile: {
              name: `${createdProfile.first_name || ''} ${createdProfile.last_name || ''}`.trim(),
              email: createdProfile.email || '',
              phone: createdProfile.phone || '',
              company: '',
              address: createdProfile.address || '',
              city: createdProfile.city || '',
              country: createdProfile.country || 'Saudi Arabia',
              updatedAt: createdProfile.updated_at || new Date().toISOString(),
            },
          });
          console.log('[useUserProfile] New profile created and store updated');
        } catch (createError) {
          console.error('[useUserProfile] Failed to create user profile:', createError);
          setError('Failed to create user profile');
        }
      }
    } catch (err) {
      console.error('[useUserProfile] Failed to fetch user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
      console.log('[useUserProfile] Profile fetch completed, loading:', false);
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
      
      const updateResponse = await profilesApi.update(user.id, {
        ...updates,
        updated_at: new Date().toISOString(),
      });

      if (updateResponse.error) {
        console.error('[useUserProfile] Failed to update user profile:', updateResponse.error);
        setError(updateResponse.error.message);
        return false;
      }

      const updatedProfile = updateResponse.data;
      if (updatedProfile) {
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
      }
      
      return false;
    } catch (err) {
      console.error('Failed to update user profile:', err);
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