import { supabase } from './supabase';
import type { Database } from './database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface ProfileService {
  getById(id: string): Promise<Profile | null>;
  create(profile: ProfileInsert): Promise<Profile>;
  update(id: string, updates: ProfileUpdate): Promise<Profile>;
  getByEmail(email: string): Promise<Profile | null>;
  ensureProfileExists(userId: string, userData: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    role?: string;
  }): Promise<Profile>;
}

/**
 * Centralized profile service to prevent duplicate profile creation
 */
class ProfileServiceImpl implements ProfileService {
  /**
   * Get profile by ID
   */
  async getById(id: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - profile doesn't exist
          return null;
        }
        if (process.env.NODE_ENV !== 'test') {
        console.error('[ProfileService] Error fetching profile:', error);
      }
        throw error;
      }

      return data;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[ProfileService] Unexpected error in getById:', error);
      }
      throw error;
    }
  }

  /**
   * Get profile by email
   */
  async getByEmail(email: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - profile doesn't exist
          return null;
        }
        if (process.env.NODE_ENV !== 'test') {
        console.error('[ProfileService] Error fetching profile by email:', error);
      }
        throw error;
      }

      return data;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[ProfileService] Unexpected error in getByEmail:', error);
      }
      throw error;
    }
  }

  /**
   * Create new profile with duplicate handling
   */
  async create(profile: ProfileInsert): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          // Profile was created by another process, fetch it
          const existingProfile = await this.getById(profile.id);
          if (existingProfile) {
            return existingProfile;
          }
        }
        if (process.env.NODE_ENV !== 'test') {
          console.error('[ProfileService] Error creating profile:', error);
        }
        throw error;
      }

      return data;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[ProfileService] Unexpected error in create:', error);
      }
      throw error;
    }
  }

  /**
   * Update profile
   */
  async update(id: string, updates: ProfileUpdate): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (process.env.NODE_ENV !== 'test') {
        console.error('[ProfileService] Error updating profile:', error);
      }
        throw error;
      }

      return data;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[ProfileService] Unexpected error in update:', error);
      }
      throw error;
    }
  }

  /**
   * Ensure profile exists with race condition protection
   * This is the centralized method that should be used for all profile creation
   */
  async ensureProfileExists(userId: string, userData: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    role?: string;
  }): Promise<Profile> {
    try {
      // First, try to get existing profile
      const existingProfile = await this.getById(userId);
      if (existingProfile) {
        return existingProfile;
      }

      // Check if email is already used by another profile
      const emailProfile = await this.getByEmail(userData.email);
      if (emailProfile && emailProfile.id !== userId) {
        throw new Error(`Email ${userData.email} is already registered to another user`);
      }

      // Create new profile with safe defaults
      const newProfile: ProfileInsert = {
        id: userId,
        email: userData.email,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: userData.phone || '',
        role: userData.role || 'tenant',
        status: 'active',
        profile_type: userData.role === 'tenant' ? 'tenant' : 'employee',
        country: 'Saudi Arabia', // Default country
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return await this.create(newProfile);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[ProfileService] Error ensuring profile exists:', error);
      }
      throw error;
    }
  }
}

// Export singleton instance
export const profileService = new ProfileServiceImpl();

// Export convenience functions for backward compatibility
export const getProfileById = (id: string) => profileService.getById(id);
export const createProfile = (profile: ProfileInsert) => profileService.create(profile);
export const updateProfile = (id: string, updates: ProfileUpdate) => profileService.update(id, updates);
export const ensureProfileExists = (userId: string, userData: Parameters<typeof profileService.ensureProfileExists>[1]) =>
  profileService.ensureProfileExists(userId, userData);
