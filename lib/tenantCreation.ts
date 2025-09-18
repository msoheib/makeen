import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './supabase';

/**
 * Ephemeral Supabase client for tenant creation
 * This client has session persistence disabled to prevent overwriting the manager's session
 */
const createEphemeralClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

/**
 * Create a tenant user account without affecting the current manager session
 * @param email - Tenant email
 * @param password - Tenant password
 * @param metadata - User metadata
 * @returns Promise with success/error result
 */
export const createTenantAccount = async (
  email: string,
  password: string,
  metadata: {
    first_name: string;
    last_name: string;
    phone?: string;
    role: string;
  }
) => {
  try {
    console.log('[TenantCreation] Creating tenant account:', { email, role: metadata.role });
    
    // Use ephemeral client to avoid session conflicts
    const ephemeralClient = createEphemeralClient();
    
    const { data, error } = await ephemeralClient.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      console.error('[TenantCreation] Auth signup error:', error);
      return { success: false, error: error.message, userId: null };
    }

    if (!data.user) {
      console.error('[TenantCreation] No user returned from signup');
      return { success: false, error: 'No user returned from signup', userId: null };
    }

    console.log('[TenantCreation] Tenant account created successfully:', data.user.id);
    return { success: true, error: null, userId: data.user.id };
  } catch (error: any) {
    console.error('[TenantCreation] Unexpected error:', error);
    return { success: false, error: error.message || 'Unexpected error', userId: null };
  }
};

/**
 * Create tenant profile in database
 * @param userId - User ID from auth signup
 * @param profileData - Profile data to insert
 * @returns Promise with success/error result
 */
export const createTenantProfile = async (
  userId: string,
  profileData: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: string;
    address?: string;
    city?: string;
    country?: string;
    nationality?: string;
    id_number?: string;
    is_foreign?: boolean;
  }
) => {
  try {
    console.log('[TenantCreation] Creating tenant profile:', { userId, email: profileData.email });
    
    // Use main client for database operations (no auth conflicts)
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        ...profileData,
        status: 'active',
        profile_type: profileData.role === 'tenant' ? 'tenant' : 'employee',
      }])
      .select()
      .single();

    if (error) {
      console.error('[TenantCreation] Profile creation error:', error);
      return { success: false, error: error.message, profile: null };
    }

    console.log('[TenantCreation] Tenant profile created successfully:', data.id);
    return { success: true, error: null, profile: data };
  } catch (error: any) {
    console.error('[TenantCreation] Profile creation unexpected error:', error);
    return { success: false, error: error.message || 'Unexpected error', profile: null };
  }
};

/**
 * Complete tenant creation process (account + profile)
 * @param tenantData - Complete tenant data
 * @returns Promise with success/error result
 */
export const createTenantComplete = async (tenantData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  id_number?: string;
  is_foreign?: boolean;
}) => {
  try {
    console.log('[TenantCreation] Starting complete tenant creation process');
    
    // Step 1: Create auth account
    const authResult = await createTenantAccount(
      tenantData.email,
      tenantData.password,
      {
        first_name: tenantData.first_name,
        last_name: tenantData.last_name,
        phone: tenantData.phone,
        role: tenantData.role,
      }
    );

    if (!authResult.success) {
      return { success: false, error: authResult.error, userId: null, profile: null };
    }

    // Step 2: Create profile
    const profileResult = await createTenantProfile(authResult.userId!, {
      first_name: tenantData.first_name,
      last_name: tenantData.last_name,
      email: tenantData.email,
      phone: tenantData.phone,
      role: tenantData.role,
      address: tenantData.address,
      city: tenantData.city,
      country: tenantData.country,
      nationality: tenantData.nationality,
      id_number: tenantData.id_number,
      is_foreign: tenantData.is_foreign,
    });

    if (!profileResult.success) {
      // Note: Auth account was created but profile failed
      // In production, you might want to clean up the auth account
      console.warn('[TenantCreation] Profile creation failed, auth account exists:', authResult.userId);
      return { 
        success: false, 
        error: `Account created but profile failed: ${profileResult.error}`, 
        userId: authResult.userId, 
        profile: null 
      };
    }

    console.log('[TenantCreation] Complete tenant creation successful');
    return { 
      success: true, 
      error: null, 
      userId: authResult.userId, 
      profile: profileResult.profile 
    };
  } catch (error: any) {
    console.error('[TenantCreation] Complete creation unexpected error:', error);
    return { 
      success: false, 
      error: error.message || 'Unexpected error', 
      userId: null, 
      profile: null 
    };
  }
};

